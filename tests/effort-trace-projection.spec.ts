/**
 * The run-length effort trace (`tlAutoSchedule.trace`, stateVersion 4): the
 * per-request history behind the conversation-view effort tab. The fold is
 * over the same committed `request/header` events `lastEffective` reads —
 * consecutive requests that went out with the same level AND the same intent
 * collapse into one run, so even a 95-step session reads as a handful of
 * rows. Cold reads rebuild the trace from the log (the projection is a pure
 * fold), so resumed/historical sessions get their trace for free.
 */
import { describe, expect, it } from 'vitest'
import {
  applyAutoSchedule,
  buildAutoScheduleDefinition,
  foldTrace,
  TRACE_MAX,
  type AutoScheduleState,
} from '../src/auto-schedule-projection.ts'

const empty = (): AutoScheduleState => ({ samples: [], userEffort: null, lastEffective: null, trace: [], turn: 0, step: 0, lastProvider: null, lastModel: null, modelSwitches: 0 })

/** A committed `request/header` with the effective reasoningEffort in config. */
const header = (reasoningEffort?: unknown) => ({
  type: 'request/header',
  data: { header: { provider: 'p', model: 'm', config: reasoningEffort === undefined ? {} : { reasoningEffort } } },
})

/** A `model/selection` carrying the user's pick (one production writer). */
const selection = (reasoningEffort?: unknown) => ({
  type: 'model/selection',
  data: { reasoningEffort },
})

describe('foldTrace — run-length append', () => {
  it('extends the last run when level and intent repeat', () => {
    const one = foldTrace([], 'high', 'auto')
    expect(one).toEqual([{ level: 'high', intent: 'auto', count: 1 }])
    const two = foldTrace(one, 'high', 'auto')
    expect(two).toEqual([{ level: 'high', intent: 'auto', count: 2 }])
    expect(two[0]).not.toBe(one[0])
  })

  it('opens a new run when the level moves, keeping earlier runs intact', () => {
    const trace = foldTrace(foldTrace([], 'high', 'auto'), 'high', 'auto')
    const moved = foldTrace(trace, 'low', 'auto')
    expect(moved).toEqual([
      { level: 'high', intent: 'auto', count: 2 },
      { level: 'low', intent: 'auto', count: 1 },
    ])
  })

  it('opens a new run when only the intent moves at the same level', () => {
    // auto→high then the user picks high manually: same wire level, different
    // why — two runs, because the tab's tag text differs.
    const trace = foldTrace(foldTrace([], 'high', 'auto'), 'high', 'manual')
    expect(trace).toEqual([
      { level: 'high', intent: 'auto', count: 1 },
      { level: 'high', intent: 'manual', count: 1 },
    ])
  })

  it('clips to TRACE_MAX runs, dropping the oldest', () => {
    let trace: readonly ReturnType<typeof foldTrace>[number][] = []
    for (let i = 0; i < TRACE_MAX + 5; i += 1) trace = foldTrace(trace, `level-${i}`, 'default')
    expect(trace).toHaveLength(TRACE_MAX)
    expect(trace[0]).toEqual({ level: `level-${5}`, intent: 'default', count: 1 })
    expect(trace[TRACE_MAX - 1]).toEqual({ level: `level-${TRACE_MAX + 4}`, intent: 'default', count: 1 })
  })
})

describe('applyAutoSchedule — trace fold over the session log', () => {
  it('attributes the run intent from the pick in force at fold time', () => {
    // auto pick → headers are auto; a later manual pick flips the intent of
    // subsequent headers without touching the earlier runs.
    let state = applyAutoSchedule(empty(), selection('auto'))
    state = applyAutoSchedule(state, header('high'))
    state = applyAutoSchedule(state, header('high'))
    expect(state.trace).toEqual([{ level: 'high', intent: 'auto', count: 2 }])
    state = applyAutoSchedule(state, selection('low'))
    state = applyAutoSchedule(state, header('low'))
    expect(state.trace).toEqual([
      { level: 'high', intent: 'auto', count: 2 },
      { level: 'low', intent: 'manual', count: 1 },
    ])
  })

  it('renders the configured default as a neutral run when the session never picked', () => {
    const state = applyAutoSchedule(empty(), header('high'))
    expect(state.trace).toEqual([{ level: 'high', intent: 'default', count: 1 }])
  })

  it('appends nothing for a header without an effort — the run simply ends', () => {
    let state = applyAutoSchedule(empty(), header('high'))
    const before = state.trace
    state = applyAutoSchedule(state, header())
    expect(state.trace).toBe(before)
    expect(state.lastEffective).toBeNull()
    // A later level re-opens a fresh run.
    state = applyAutoSchedule(state, header('low'))
    expect(state.trace).toEqual([
      { level: 'high', intent: 'default', count: 1 },
      { level: 'low', intent: 'default', count: 1 },
    ])
  })

  it('stays referentially stable for unrelated events', () => {
    const state = applyAutoSchedule(empty(), header('high'))
    expect(applyAutoSchedule(state, { type: 'assistant/chunk', data: {} })).toBe(state)
    expect(applyAutoSchedule(state, null)).toBe(state)
  })

  it('folds deterministically: two passes over the same log agree', () => {
    const log = [
      selection('auto'),
      header('high'),
      { type: 'tool/call', data: { name: 'bash', arguments: 'x' } },
      header('high'),
      header('low'),
      selection('low'),
      header('low'),
      header(),
      header('low'),
    ]
    let a = empty()
    for (const event of log) a = applyAutoSchedule(a, event)
    let b = empty()
    for (const event of log) b = applyAutoSchedule(b, event)
    expect(a.trace).toEqual(b.trace)
    // The mid-log manual pick (auto → low) splits the `low` level into two
    // runs: same wire level, different why — exactly the tag-boundary rule.
    expect(a.trace).toEqual([
      { level: 'high', intent: 'auto', count: 2 },
      { level: 'low', intent: 'auto', count: 1 },
      { level: 'low', intent: 'manual', count: 2 },
    ])
  })
})

describe('buildAutoScheduleDefinition — stateVersion 5', () => {
  it('declares version 5 with a schema that accepts a stamped trace', () => {
    const definition = buildAutoScheduleDefinition()
    expect(definition.stateVersion).toBe(5)
    const row = {
      samples: [],
      userEffort: 'auto',
      lastEffective: 'high',
      trace: [{ level: 'high', intent: 'auto', count: 2, turn: 3, step: 1, time: 1795412669385, provider: 'trae', model: 'deepseek-v4.1-flash' }],
      turn: 3,
      step: 1,
      lastProvider: 'trae',
      lastModel: 'deepseek-v4.1-flash',
      modelSwitches: 1,
    }
    expect(definition.stateSchema.parse(row)).toEqual(row)
  })

  it('still accepts a run without position stamps (an un-stamped header)', () => {
    const definition = buildAutoScheduleDefinition()
    const row = { samples: [], userEffort: null, lastEffective: 'low', trace: [{ level: 'low', intent: 'default', count: 1 }], turn: 0, step: 0, lastProvider: null, lastModel: null, modelSwitches: 0 }
    expect(definition.stateSchema.parse(row)).toEqual(row)
  })
})
