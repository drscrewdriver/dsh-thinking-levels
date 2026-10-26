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

const empty = (): AutoScheduleState => ({ samples: [], userEffort: null })

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
    expect(definition.stateVersion).toBe(1)
    const initial = definition.init()
    expect(initial).toEqual({ samples: [], userEffort: null })
    expect(definition.stateSchema.parse(initial)).toEqual(initial)
  })

  it('accepts a persisted row and strips unknown keys', () => {
    const definition = buildAutoScheduleDefinition()
    const parsed = definition.stateSchema.parse({
      samples: [{ name: 'bash', argsSize: 3 }],
      userEffort: 'auto',
      // a field a future version might drop — must not poison the cache row
      legacyField: true,
    })
    expect(parsed).toEqual({ samples: [{ name: 'bash', argsSize: 3 }], userEffort: 'auto' })
  })
})

describe('readAutoSchedule — capability gate', () => {
  it('reads the folded state when the registry serves stateOf', () => {
    const state = { samples: [{ name: 'bash', argsSize: 3 }], userEffort: 'auto' }
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
    const service = { stateOf: () => ({ samples: [], userEffort: null }) }
    expect(readAutoSchedule(ctxWith(service), undefined)).toBeUndefined()
    expect(readAutoSchedule(ctxWith(service), null)).toBeUndefined()
  })
})

describe('requestedEffortOf', () => {
  it('prefers the session pick over the configured default', () => {
    expect(requestedEffortOf({ samples: [], userEffort: 'high' }, 'auto')).toBe('high')
    expect(requestedEffortOf({ samples: [], userEffort: 'auto' }, 'low')).toBe('auto')
  })

  it('falls back when the session never picked', () => {
    expect(requestedEffortOf(undefined, 'auto')).toBe('auto')
    expect(requestedEffortOf({ samples: [], userEffort: null }, 'low')).toBe('low')
  })

  it('falls back for a value the plugin does not understand', () => {
    // A gateway-specific wire value is not a plugin level: it keeps the
    // pre-existing behaviour (scheduler decides) instead of being passed on.
    expect(requestedEffortOf({ samples: [], userEffort: 'ultra' }, 'auto')).toBe('auto')
  })
})
