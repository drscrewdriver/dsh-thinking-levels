import { describe, expect, it } from 'vitest'
import {
  AUTO_SCHEDULE_KEY,
  applyAutoSchedule,
  buildAutoScheduleDefinition,
  readAutoSchedule,
  requestedEffortOf,
  type AutoScheduleState,
} from '../src/auto-schedule-projection.ts'
import { TOOL_SAMPLE_WINDOW } from '../src/session-events.ts'

const empty = (): AutoScheduleState => ({ samples: [], userEffort: null, lastEffective: null, trace: [], turn: 0, step: 0 })

/** The real wire shape (`packages/core/session/src/types.ts`): name + arguments. */
const toolCall = (name: string, args = '') => ({ type: 'tool/call', data: { turn: 1, step: 1, callId: 'c', name, arguments: args } })
const selection = (reasoningEffort?: string) => ({
  type: 'model/selection',
  data: { provider: 'deepseek-account', model: 'deepseek-flash', ...(reasoningEffort === undefined ? {} : { reasoningEffort }) },
})

/** Minimal projections service: only the surface the reader duck-types. */
const ctxWith = (service: unknown) => ({ get: (name: string) => (name === 'sessionProjections' ? service : undefined) })

describe('applyAutoSchedule — tool sampling', () => {
  it('collects tool/call samples oldest first', () => {
    let state = empty()
    state = applyAutoSchedule(state, { type: 'user/message', data: {} })
    state = applyAutoSchedule(state, toolCall('bash', 'echo hi'))
    state = applyAutoSchedule(state, { type: 'tool/result', data: {} })
    state = applyAutoSchedule(state, toolCall('fs_read', 'x'.repeat(20)))
    expect(state.samples).toEqual([
      { name: 'bash', argsSize: 7 },
      { name: 'fs_read', argsSize: 20 },
    ])
  })

  it('caps the ring at TOOL_SAMPLE_WINDOW, dropping the oldest', () => {
    let state = empty()
    for (let index = 0; index < TOOL_SAMPLE_WINDOW + 5; index += 1) {
      state = applyAutoSchedule(state, toolCall(`tool_${index}`, `${index}`))
    }
    expect(state.samples).toHaveLength(TOOL_SAMPLE_WINDOW)
    expect(state.samples[0]?.name).toBe('tool_5')
    expect(state.samples.at(-1)?.name).toBe(`tool_${TOOL_SAMPLE_WINDOW + 4}`)
  })

  it('skips malformed tool/call records instead of throwing', () => {
    let state = empty()
    for (const event of [
      { type: 'tool/call' },
      { type: 'tool/call', data: null },
      { type: 'tool/call', data: { arguments: 42 } },
      { type: 'tool/call', data: { name: '', arguments: 'abc' } },
    ]) {
      state = applyAutoSchedule(state, event)
    }
    expect(state.samples).toEqual([
      { name: 'tool', argsSize: 0 },
      { name: 'tool', argsSize: 3 },
    ])
  })
})

describe('applyAutoSchedule — explicit pick', () => {
  it('records the reasoningEffort of model/selection', () => {
    const state = applyAutoSchedule(empty(), selection('auto'))
    expect(state.userEffort).toBe('auto')
    expect(applyAutoSchedule(state, selection('high')).userEffort).toBe('high')
  })

  it('clears to null when the selection carries no effort', () => {
    const picked = applyAutoSchedule(empty(), selection('high'))
    expect(applyAutoSchedule(picked, selection()).userEffort).toBeNull()
  })

  it('keeps the same reference for an unchanged pick', () => {
    const picked = applyAutoSchedule(empty(), selection('auto'))
    expect(applyAutoSchedule(picked, selection('auto'))).toBe(picked)
  })
})

describe('applyAutoSchedule — no-op paths stay referentially stable', () => {
  it('returns the same state for unrelated events', () => {
    const state = empty()
    expect(applyAutoSchedule(state, { type: 'assistant/chunk', data: {} })).toBe(state)
    expect(applyAutoSchedule(state, { type: 'request/header', data: {} })).toBe(state)
    expect(applyAutoSchedule(state, null)).toBe(state)
    expect(applyAutoSchedule(state, 'nope')).toBe(state)
  })
})

describe('buildAutoScheduleDefinition', () => {
  it('declares a versioned unit with a parseable schema', () => {
    const definition = buildAutoScheduleDefinition()
    expect(definition.key).toBe(AUTO_SCHEDULE_KEY)
    expect(definition.stateVersion).toBe(4)
    const initial = definition.init()
    expect(initial).toEqual({ samples: [], userEffort: null, lastEffective: null, trace: [], turn: 0, step: 0 })
    expect(definition.stateSchema.parse(initial)).toEqual(initial)
  })

  it('accepts a persisted row and strips unknown keys', () => {
    const definition = buildAutoScheduleDefinition()
    const parsed = definition.stateSchema.parse({
      samples: [{ name: 'bash', argsSize: 3 }],
      userEffort: 'auto',
      lastEffective: null,
      trace: [],
      turn: 2,
      step: 3,
      // a field a future version might drop — must not poison the cache row
      legacyField: true,
    })
    expect(parsed).toEqual({ samples: [{ name: 'bash', argsSize: 3 }], userEffort: 'auto', lastEffective: null, trace: [], turn: 2, step: 3 })
  })
})

describe('readAutoSchedule — capability gate', () => {
  it('reads the folded state when the registry serves stateOf', () => {
    const state = { samples: [{ name: 'bash', argsSize: 3 }], userEffort: 'auto', lastEffective: null, trace: [], turn: 0, step: 0 }
    const service = { stateOf: (_session: unknown, key: string) => (key === AUTO_SCHEDULE_KEY ? state : undefined) }
    expect(readAutoSchedule(ctxWith(service), {})).toEqual(state)
  })

  it('returns undefined when the service is absent (old line / plane contract)', () => {
    expect(readAutoSchedule(ctxWith(undefined), {})).toBeUndefined()
    expect(readAutoSchedule({}, {})).toBeUndefined()
  })

  it('returns undefined on the 0.1.0-rc.8 registry, which has no stateOf', () => {
    expect(readAutoSchedule(ctxWith({ register: () => {} }), {})).toBeUndefined()
  })

  it('never throws when the registry does', () => {
    const service = { stateOf: () => { throw new Error('boom') } }
    expect(readAutoSchedule(ctxWith(service), {})).toBeUndefined()
  })

  it('returns undefined without a session', () => {
    const service = { stateOf: () => ({ samples: [], userEffort: null, lastEffective: null, trace: [], turn: 0, step: 0 }) }
    expect(readAutoSchedule(ctxWith(service), undefined)).toBeUndefined()
    expect(readAutoSchedule(ctxWith(service), null)).toBeUndefined()
  })
})

describe('requestedEffortOf', () => {
  it('prefers the session pick over the configured default', () => {
    expect(requestedEffortOf({ samples: [], userEffort: 'high', lastEffective: null, trace: [], turn: 0, step: 0 }, 'auto')).toBe('high')
    expect(requestedEffortOf({ samples: [], userEffort: 'auto', lastEffective: null, trace: [], turn: 0, step: 0 }, 'low')).toBe('auto')
  })

  it('falls back when the session never picked', () => {
    expect(requestedEffortOf(undefined, 'auto')).toBe('auto')
    expect(requestedEffortOf({ samples: [], userEffort: null, lastEffective: null, trace: [], turn: 0, step: 0 }, 'low')).toBe('low')
  })

  it('falls back for a value the plugin does not understand', () => {
    // A gateway-specific wire value is not a plugin level: it keeps the
    // pre-existing behaviour (scheduler decides) instead of being passed on.
    expect(requestedEffortOf({ samples: [], userEffort: 'ultra', lastEffective: null, trace: [], turn: 0, step: 0 }, 'auto')).toBe('auto')
  })
})

/**
 * Issue #11: the selector showed "Auto" while every request went out as a
 * concrete level, so the user could not tell what was actually sent. The
 * committed `request/header` carries the effective value (the host resolves it
 * before committing — `dsh-llm/lib/index.js:2298-2308`), so the projection folds
 * it into `lastEffective`.
 */
describe('lastEffective — the level the last request actually carried (issue #11)', () => {
  const header = (reasoningEffort?: unknown) => ({
    type: 'request/header',
    data: { header: { provider: 'deepseek-account', model: 'deepseek-flash', config: reasoningEffort === undefined ? {} : { reasoningEffort } } },
  })

  it('folds the effective effort out of a committed header', () => {
    const next = applyAutoSchedule(empty(), header('high'))
    expect(next.lastEffective).toBe('high')
  })

  it('records null when the header carries no effort (non-reasoning model)', () => {
    expect(applyAutoSchedule(empty(), header()).lastEffective).toBeNull()
  })

  it('records null for a non-string effort instead of trusting the wire', () => {
    expect(applyAutoSchedule(empty(), header(42)).lastEffective).toBeNull()
    expect(applyAutoSchedule(empty(), header('')).lastEffective).toBeNull()
  })

  it('advances the trace run when the level repeats; same reference only for effort-less headers', () => {
    // The registry gates its change feed on Object.is. Since the trace joined
    // (stateVersion 3+, now 4), a level-carrying header ALWAYS advances its run —
    // count++ = new reference — so the trace tab stays live per request; the
    // same-reference guarantee survives only for headers without an effort.
    const once = applyAutoSchedule(empty(), header('high'))
    const twice = applyAutoSchedule(once, header('high'))
    expect(twice).not.toBe(once)
    expect(twice.trace).toEqual([{ level: 'high', intent: null, count: 2 }])
    expect(applyAutoSchedule(once, header('low'))).not.toBe(once)
    const quiet = applyAutoSchedule(empty(), header())
    expect(applyAutoSchedule(quiet, header())).toBe(quiet)
  })

  it('leaves samples and userEffort untouched', () => {
    const state = { samples: [{ name: 'bash', argsSize: 3 }], userEffort: 'auto', lastEffective: null, trace: [], turn: 0, step: 0 }
    const next = applyAutoSchedule(state, header('low'))
    expect(next.samples).toBe(state.samples)
    expect(next.userEffort).toBe('auto')
    expect(next.lastEffective).toBe('low')
  })

  it('rebuilds from a cold read: samples, userEffort and lastEffective all fold', () => {
    // Resume/fork replays the log through init+apply, so the effective level
    // survives a restart even though the projection is not stored separately.
    let state = buildAutoScheduleDefinition().init()
    for (const event of [toolCall('bash', 'x'), selection('auto'), header('high')]) {
      state = applyAutoSchedule(state, event)
    }
    expect(state.samples).toHaveLength(1)
    expect(state.userEffort).toBe('auto')
    expect(state.lastEffective).toBe('high')
  })
})

/**
 * The registry ships a unit to the browser ONLY when it declares `wire`:
 * `snapshot()`/`cachedSnapshot()` both `continue` on `def.wire === undefined`
 * (`packages/session/session-projection/src/index.ts`). Without it this unit
 * was host-only, so the effort tab and the chip both read a key that never
 * crossed the wire — a filled projection behind an always-empty UI.
 */
describe('wire — the unit must be client-visible (empty-tab bug)', () => {
  it('declares a wire view and validates the payload', () => {
    const def = buildAutoScheduleDefinition()
    expect(def.key).toBe(AUTO_SCHEDULE_KEY)
    expect(def.wire).toBeDefined()
    const state: AutoScheduleState = {
      samples: [{ name: 'bash', argsSize: 3 }],
      userEffort: 'auto',
      lastEffective: 'low',
      trace: [{ level: 'low', intent: 'auto', count: 2 }],
      turn: 1,
      step: 2,
    }
    const view = def.wire.view(state)
    // samples stay host-side; the browser gets exactly what it renders.
    expect(view).toEqual({ userEffort: 'auto', lastEffective: 'low', trace: [{ level: 'low', intent: 'auto', count: 2 }] })
    expect(def.wire.viewSchema.parse(view)).toEqual(view)
  })

  it('keeps the view identity when only host-only state (samples) changes', () => {
    const def = buildAutoScheduleDefinition()
    const base: AutoScheduleState = { samples: [], userEffort: 'auto', lastEffective: 'low', trace: [{ level: 'low', intent: 'auto', count: 1 }], turn: 1, step: 1 }
    const first = def.wire.view(base)
    const grown: AutoScheduleState = { ...base, samples: [{ name: 'bash', argsSize: 9 }] }
    // Same content, new state reference: the Object.is gate must stay closed,
    // otherwise every single tool/call wakes every subscribed client.
    expect(def.wire.view(grown)).toBe(first)
    const advanced: AutoScheduleState = { ...grown, lastEffective: 'high', trace: [{ level: 'high', intent: 'auto', count: 1 }] }
    expect(def.wire.view(advanced)).not.toBe(first)
    expect(def.wire.view(advanced).lastEffective).toBe('high')
  })

  it('reuses the view for a repeated identical state read', () => {
    const def = buildAutoScheduleDefinition()
    const state: AutoScheduleState = { samples: [], userEffort: null, lastEffective: 'max', trace: [{ level: 'max', intent: null, count: 1 }], turn: 0, step: 0 }
    expect(def.wire.view(state)).toBe(def.wire.view(state))
  })

  it('rejects a malformed payload at the wire boundary', () => {
    const def = buildAutoScheduleDefinition()
    expect(() => def.wire.viewSchema.parse({ userEffort: 1, lastEffective: null, trace: [] })).toThrow()
    expect(() => def.wire.viewSchema.parse({ userEffort: null, lastEffective: null, trace: [{ level: 'low', intent: null }] })).toThrow()
  })
})

/**
 * Position stamps: the tab names the turn/step a run STARTED in, so "when did
 * auto drop to low" is answerable in the UI. The decision itself is made at
 * `agent/pre-step` — BEFORE the host appends `step/start` (agent-loop
 * `agent.ts`: `preStep()` then `session.append('step/start')`) — so the stamp
 * identifies the step the level was picked FOR, i.e. the timeline node.
 */
describe('position stamps — turn/step on the run, not on the request', () => {
  const turnStart = (turn: number) => ({ type: 'turn/start', data: { turn } })
  const stepStart = (turn: number, step: number) => ({ type: 'step/start', data: { turn, step } })
  const stamped = (level: string, time: number) => ({ type: 'request/header', time, data: { header: { config: { provider: 'p', model: 'm', reasoningEffort: level } } } })

  it('stamps only the first request of a run, so a run still reads as one row', () => {
    let state = buildAutoScheduleDefinition().init()
    state = applyAutoSchedule(state, turnStart(1))
    state = applyAutoSchedule(state, stepStart(1, 1))
    state = applyAutoSchedule(state, stamped('low', 1000))
    state = applyAutoSchedule(state, stepStart(1, 2))
    state = applyAutoSchedule(state, stamped('low', 2000))
    expect(state.trace).toEqual([{ level: 'low', intent: null, count: 2, turn: 1, step: 1, time: 1000 }])
    // A new run opens with ITS OWN position, not the previous run's.
    state = applyAutoSchedule(state, turnStart(2))
    state = applyAutoSchedule(state, stepStart(2, 1))
    state = applyAutoSchedule(state, stamped('high', 3000))
    expect(state.trace[1]).toEqual({ level: 'high', intent: null, count: 1, turn: 2, step: 1, time: 3000 })
  })

  it('leaves the position off a header that arrives before any turn/start', () => {
    const state = applyAutoSchedule(empty(), stamped('low', 500))
    expect(state.trace).toEqual([{ level: 'low', intent: null, count: 1, time: 500 }])
  })

  it('keeps the state reference for repeated turn/step announcements', () => {
    let state = applyAutoSchedule(empty(), turnStart(3))
    expect(applyAutoSchedule(state, turnStart(3))).toBe(state)
    state = applyAutoSchedule(state, stepStart(3, 4))
    expect(applyAutoSchedule(state, stepStart(3, 4))).toBe(state)
    expect(applyAutoSchedule(state, { type: 'user/message', data: {} })).toBe(state)
  })

  it('survives malformed position events without changing state', () => {
    const base = applyAutoSchedule(empty(), turnStart(1))
    expect(applyAutoSchedule(base, { type: 'turn/start', data: {} })).toBe(base)
    expect(applyAutoSchedule(base, { type: 'step/start', data: { step: 'x' } })).toBe(base)
    expect(applyAutoSchedule(base, { type: 'step/start' })).toBe(base)
  })
})
