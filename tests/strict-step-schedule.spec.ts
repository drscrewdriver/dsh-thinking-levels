import { describe, expect, it } from 'vitest'
import { effortOfSelection, planStrictStep, type StrictStepInput } from '../src/strict-step-schedule.ts'
import type { EffortId } from '../src/thinking-level.ts'

/**
 * The strict line (dsh 0.2.2+) fixes the step's selection before
 * `agent/request` and throws when a listener changes it, so the plugin plans
 * one step ahead through `agent.model.select()`. These cases pin the baseline
 * diff that replaced the folded session pick: the plugin is itself a writer of
 * `model/selection`, so the fold can no longer tell "user picked auto" from
 * "the scheduler wrote low last step".
 */
const EFFORTS = ['off', 'low', 'high', 'max', 'auto']
const SIMPLE = [{ name: 'bash', argsSize: 2 }]
const HEAVY = [{ name: 'mcp__docs', argsSize: 4000 }]

const base = (over: Partial<StrictStepInput> = {}): StrictStepInput => ({
  selectionEffort: undefined,
  memory: undefined,
  cfgLevel: 'auto',
  samples: [],
  allowDowngrade: true,
  allowUpgrade: true,
  supportsReasoning: true,
  efforts: EFFORTS,
  toggleOnly: false,
  ...over,
})

const effort = (level: EffortId) => ({ level, clear: false })

describe('effortOfSelection', () => {
  it('reads a non-empty string and treats everything else as absent', () => {
    expect(effortOfSelection('low')).toBe('low')
    for (const value of [undefined, null, '', 42, {}]) expect(effortOfSelection(value)).toBeNull()
  })
})

describe('planStrictStep — a fresh session opens at the hub', () => {
  it('selects high for the next step when the host fixed no effort', () => {
    // No adapter default can be assumed to be the hub, and the first step sets
    // the plan: this write is what the session's second step inherits.
    const plan = planStrictStep(base())
    expect(plan.intent).toBe('auto')
    expect(plan.select).toEqual(effort('high'))
    expect(plan.memory).toEqual({ baseline: 'high', intent: 'auto' })
  })

  it('keeps the auto intent so later steps still schedule', () => {
    const plan = planStrictStep(base({
      selectionEffort: 'high',
      memory: { baseline: 'high', intent: 'auto' },
      samples: SIMPLE,
    }))
    expect(plan.intent).toBe('auto')
    expect(plan.select).toEqual(effort('low'))
    expect(plan.memory).toEqual({ baseline: 'low', intent: 'auto' })
  })

  it('reaches the scheduler floor and never goes below it', () => {
    const first = planStrictStep(base({ samples: SIMPLE }))
    expect(first.select).toEqual(effort('low'))
    // `low` is the floor: once the step is fixed there, nothing more is written.
    const settled = planStrictStep(base({ selectionEffort: 'low', memory: first.memory, samples: SIMPLE }))
    expect(settled.select).toBeUndefined()
    expect(settled.memory).toEqual({ baseline: 'low', intent: 'auto' })
  })
})

describe('planStrictStep — user changes win', () => {
  it('adopts a selection the plugin did not write, and stops scheduling', () => {
    const plan = planStrictStep(base({
      selectionEffort: 'low',
      memory: { baseline: 'high', intent: 'auto' },
      samples: HEAVY,
    }))
    expect(plan.intent).toBe('low')
    // The host already fixes low: nothing to write.
    expect(plan.select).toBeUndefined()
    expect(plan.memory).toEqual({ baseline: 'low', intent: 'low' })
  })

  it('holds an explicit pick against heavy evidence', () => {
    const plan = planStrictStep(base({
      selectionEffort: 'low',
      memory: { baseline: 'low', intent: 'low' },
      samples: HEAVY,
    }))
    expect(plan.intent).toBe('low')
    expect(plan.select).toBeUndefined()
  })

  it('lifts to max when the user re-picks auto', () => {
    const plan = planStrictStep(base({
      selectionEffort: 'auto',
      memory: { baseline: 'low', intent: 'low' },
      samples: HEAVY,
    }))
    // `auto` is a plugin mask, never a wire level: the scheduler resolves it.
    expect(plan.intent).toBe('auto')
    expect(plan.select).toEqual(effort('max'))
  })

  it('falls back to the configured level for a gateway-specific value', () => {
    const plan = planStrictStep(base({
      selectionEffort: 'ultra',
      memory: { baseline: 'high', intent: 'auto' },
    }))
    expect(plan.intent).toBe('auto')
    expect(plan.select).toEqual(effort('high'))
  })
})

describe('planStrictStep — resume seeds the baseline instead of faking a change', () => {
  it('does not read a resumed lastUsed as a user pick', () => {
    // A resumed Agent starts with no memory; the observed value IS what this
    // plugin (or the user) left in the log, so it can only seed the baseline.
    const plan = planStrictStep(base({ selectionEffort: 'low', samples: HEAVY }))
    expect(plan.intent).toBe('auto')
    expect(plan.select).toEqual(effort('max'))
    expect(plan.memory).toEqual({ baseline: 'max', intent: 'auto' })
  })
})

describe('planStrictStep — routes that take no effort', () => {
  it('clears an inherited effort instead of leaving an unsupported one fixed', () => {
    const plan = planStrictStep(base({
      selectionEffort: 'low',
      memory: { baseline: 'low', intent: 'auto' },
      supportsReasoning: false,
    }))
    expect(plan.select).toEqual({ clear: true })
    expect(plan.memory.baseline).toBeNull()
  })

  it('writes nothing when the step already carries no effort', () => {
    const plan = planStrictStep(base({ supportsReasoning: false }))
    expect(plan.select).toBeUndefined()
    expect(plan.memory.baseline).toBeNull()
  })
})

describe('planStrictStep — toggle-only models', () => {
  it('maps an off intent through the toggle path', () => {
    const plan = planStrictStep(base({
      memory: { baseline: null, intent: 'off' },
      toggleOnly: true,
    }))
    expect(plan.select).toEqual(effort('off'))
  })

  it('lifts any other intent to the advertised toggle level', () => {
    const plan = planStrictStep(base({ cfgLevel: 'low', toggleOnly: true }))
    expect(plan.intent).toBe('low')
    expect(plan.select).toEqual(effort('high'))
  })
})
