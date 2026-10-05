import { describe, expect, it } from 'vitest'
import {
  assertEffortId, decideEffort, isEffortId, nearestEffortStopIndex, orderEffortsForSlider,
  reasoningEffortSupported, resolveEffortInjection, toolDurationMs,
  type EffortDecisionInput, type EffortInjectionInput,
} from '../src/thinking-level.ts'

const base = (over: Partial<EffortDecisionInput>): EffortDecisionInput => ({
  recentCalls: [],
  selected: 'high',
  allowDowngrade: true,
  allowUpgrade: true,
  ...over,
})

describe('manual levels pass through unchanged', () => {
  it('off disables thinking for any request', () => {
    expect(decideEffort(base({ selected: 'off' }))).toBe('off')
    expect(decideEffort(base({ recentCalls: [{ name: 'bash', argsSize: 40 }], selected: 'off' }))).toBe('off')
  })

  it('low is the manual pick for simple chat tasks, regardless of history', () => {
    expect(decideEffort(base({ selected: 'low' }))).toBe('low')
    expect(decideEffort(base({ recentCalls: [{ name: 'web_search', argsSize: 2000 }], selected: 'low' }))).toBe('low')
  })

  it('high and max fix the wire level', () => {
    expect(decideEffort(base({ selected: 'high' }))).toBe('high')
    expect(decideEffort(base({ selected: 'max' }))).toBe('max')
  })
})

describe('auto scheduler', () => {
  it('sends a fresh prompt (pure chat) to low — cheap rounds stay cheap', () => {
    expect(decideEffort(base({ selected: 'auto' }))).toBe('low')
  })

  it('sends simple deterministic tool chains to low', () => {
    const recentCalls = [
      { name: 'bash', argsSize: 40 },
      { name: 'fs_read', argsSize: 20 },
      { name: 'fs_write', argsSize: 120 },
    ]
    expect(decideEffort(base({ selected: 'auto', recentCalls }))).toBe('low')
  })

  it('keeps mixed or heavy tool chains at the high hub', () => {
    const recentCalls = [
      { name: 'bash', argsSize: 40 },
      { name: 'web_search', argsSize: 900 },
      { name: 'mcp__db', argsSize: 300 },
    ]
    expect(decideEffort(base({ selected: 'auto', recentCalls }))).toBe('high')
  })

  it('lifts to max only for very heavy payloads when upgrades are allowed', () => {
    const recentCalls = [{ name: 'mcp__docs', argsSize: 4000 }]
    expect(decideEffort(base({ selected: 'auto', recentCalls }))).toBe('max')
    expect(decideEffort(base({ selected: 'auto', recentCalls, allowUpgrade: false }))).toBe('high')
  })

  it('respects the downgrade toggle: fresh prompt stays at the hub', () => {
    expect(decideEffort(base({ selected: 'auto', allowDowngrade: false }))).toBe('high')
  })

  it('never resolves to off or auto (scheduler output is a wire level)', () => {
    const samples = [
      base({ selected: 'auto' }),
      base({ selected: 'auto', recentCalls: [{ name: 'bash', argsSize: 10 }] }),
      base({ selected: 'auto', recentCalls: [{ name: 'mcp__db', argsSize: 5000 }], allowUpgrade: true }),
    ]
    for (const input of samples) {
      const out = decideEffort(input)
      expect(['low', 'high', 'max']).toContain(out)
    }
  })
})

describe('effort-level validation', () => {
  it('accepts the eight standard levels plus auto', () => {
    for (const level of ['off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto']) {
      expect(isEffortId(level)).toBe(true)
      expect(() => assertEffortId(level, 'test')).not.toThrow()
    }
  })

  it('rejects out-of-band values that dsh would reject per request', () => {
    for (const bad of ['ultra', 'reasoning', 3, null, undefined, {}]) {
      expect(isEffortId(bad)).toBe(false)
      expect(() => assertEffortId(bad, 'test')).toThrow(TypeError)
    }
  })
})

describe('simple-tool classification boundary', () => {
  it('anchors on word boundaries so look-alike heavy tools are not misread as simple', () => {
    // fs_* and bash match; heavy look-alikes do not.
    const simpleCalls = [{ name: 'fs_write', argsSize: 100 }, { name: 'bash', argsSize: 40 }]
    expect(decideEffort(base({ selected: 'auto', recentCalls: simpleCalls }))).toBe('low')
    const lookAlike = [
      { name: 'codebase_search', argsSize: 40 }, // starts with code but is a search-heavy tool
      { name: 'job_status_check', argsSize: 30 },
    ]
    expect(decideEffort(base({ selected: 'auto', recentCalls: lookAlike }))).toBe('high')
  })
})

describe('toolDurationMs', () => {
  it('reports the wall-clock delta and never negative jitter', () => {
    expect(toolDurationMs(1000, 2400)).toBe(1400)
    expect(toolDurationMs(2400, 1000)).toBe(0)
  })
})

describe('reasoningEffortSupported', () => {
  it('accepts a reasoning metadata object with efforts', () => {
    expect(reasoningEffortSupported({ efforts: [{ id: 'off', name: 'Off' }, { id: 'low', name: 'Low' }] })).toBe(true)
  })

  it('rejects absent, empty, and malformed reasoning metadata', () => {
    expect(reasoningEffortSupported(undefined)).toBe(false)
    expect(reasoningEffortSupported(null)).toBe(false)
    expect(reasoningEffortSupported({})).toBe(false)
    expect(reasoningEffortSupported({ efforts: [] })).toBe(false)
    expect(reasoningEffortSupported({ efforts: 'off' })).toBe(false)
  })
})

describe('resolveEffortInjection — model capability guard', () => {
  const FULL_EFFORTS = ['off', 'low', 'high', 'max', 'auto']
  const base = (over: Partial<EffortInjectionInput>): EffortInjectionInput => ({
    supportsReasoning: true,
    seedEffort: undefined,
    selected: 'auto',
    recentCalls: [],
    allowDowngrade: true,
    allowUpgrade: true,
    efforts: FULL_EFFORTS,
    toggleOnly: false,
    ...over,
  })

  it('strips the effort entirely for a model without reasoning support', () => {
    // A custom openai-completions route (e.g. Qwen3.6 without reasoningEfforts)
    // must never receive a reasoning_effort: dsh rejects it per request.
    const decision = resolveEffortInjection(base({ supportsReasoning: false, seedEffort: 'low', selected: 'low' }))
    expect(decision).toEqual({ inject: false })
  })

  it('passes a manual low selection through unchanged on a supporting model', () => {
    // dsh rc.7+ advertises low natively; the plugin neither rewrites it nor
    // re-schedules it.
    expect(resolveEffortInjection(base({ seedEffort: 'low' }))).toEqual({ inject: true, level: 'low' })
    expect(resolveEffortInjection(base({ seedEffort: 'max' }))).toEqual({ inject: true, level: 'max' })
  })

  it('resolves auto through the scheduler, which may still pick low', () => {
    // The capability guard already stripped unsupported models, so a scheduled
    // low only reaches models that advertise it.
    expect(resolveEffortInjection(base({ seedEffort: undefined }))).toEqual({ inject: true, level: 'low' })
    const heavy = [{ name: 'mcp__docs', argsSize: 4000 }]
    expect(resolveEffortInjection(base({ seedEffort: 'auto', recentCalls: heavy }))).toEqual({ inject: true, level: 'max' })
  })

  it('falls back to the configured default when the seed carries no effort', () => {
    expect(resolveEffortInjection(base({ seedEffort: undefined, selected: 'high' }))).toEqual({ inject: true, level: 'high' })
  })

  it('clamps a scheduled low to the model’s highest thinking level', () => {
    // A model advertising no low (e.g. off/minimal/max) lifts a scheduled low
    // to its highest thinking level instead of erroring.
    const narrow = { efforts: ['off', 'minimal', 'max'], toggleOnly: false }
    expect(resolveEffortInjection(base({ ...narrow, seedEffort: undefined }))).toEqual({ inject: true, level: 'max' })
  })

  it('strips an unsupported manual pick instead of clamping it', () => {
    // A manual low on a model that advertises no low is the user asking for an
    // exact level the API cannot take; the request must not fail per-round.
    expect(resolveEffortInjection(base({ efforts: ['off', 'high', 'max'], seedEffort: 'low' })))
      .toEqual({ inject: false })
  })

  it('toggle-only Off injects the off level (providers map it to thinking disabled)', () => {
    const toggle = { efforts: ['off', 'high'], toggleOnly: true }
    expect(resolveEffortInjection(base({ ...toggle, seedEffort: 'off' }))).toEqual({ inject: true, level: 'off' })
  })

  it('toggle-only On injects high (the explicit thinking-on signal)', () => {
    // `on` / any non-off seed on a toggle-only model injects `high` — the
    // advertised toggle level. The short-circuit adapter serializes a non-off
    // effort as enable_thinking true; an absent effort is ambiguous (some
    // gateways treat it as off), so the explicit signal is required.
    const toggle = { efforts: ['off', 'high'], toggleOnly: true }
    expect(resolveEffortInjection(base({ ...toggle, seedEffort: 'on' }))).toEqual({ inject: true, level: 'high' })
    expect(resolveEffortInjection(base({ ...toggle, seedEffort: 'high' }))).toEqual({ inject: true, level: 'high' })
    expect(resolveEffortInjection(base({ ...toggle, seedEffort: undefined }))).toEqual({ inject: true, level: 'high' })
  })

  it('a stray On on an effort-capable model is stripped, never lifted', () => {
    // An effort-capable model advertises no `on`: a stray manual pick is
    // stripped, not lifted to high.
    expect(resolveEffortInjection(base({ efforts: ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'], seedEffort: 'on' })))
      .toEqual({ inject: false })
  })

  it('passes the extended wire levels through when the model advertises them', () => {
    // A custom gateway may declare minimal / medium / xhigh in reasoningEfforts;
    // the manual pick then passes through unchanged (custom wire mapping).
    expect(resolveEffortInjection(base({ efforts: ['off', 'minimal', 'medium', 'high', 'xhigh', 'max'], seedEffort: 'medium' })))
      .toEqual({ inject: true, level: 'medium' })
    expect(resolveEffortInjection(base({ efforts: ['off', 'minimal', 'medium', 'high', 'xhigh', 'max'], seedEffort: 'xhigh' })))
      .toEqual({ inject: true, level: 'xhigh' })
  })
})

describe('orderEffortsForSlider', () => {
  it('pins auto leftmost even when off is offered alongside', () => {
    const ordered = orderEffortsForSlider([{ id: 'off' }, { id: 'high' }, { id: 'auto' }])
    expect(ordered.map(stop => stop.id)).toEqual(['auto', 'off', 'high'])
  })

  it('pins auto leftmost when thinking cannot be disabled at all', () => {
    const ordered = orderEffortsForSlider([{ id: 'high' }, { id: 'auto' }, { id: 'max' }])
    expect(ordered.map(stop => stop.id)).toEqual(['auto', 'high', 'max'])
  })

  it('sorts the full standard gradient after off/on', () => {
    const ids = ['max', 'low', 'auto', 'off', 'medium', 'on', 'minimal', 'xhigh', 'high']
    const ordered = orderEffortsForSlider(ids.map(id => ({ id })))
    expect(ordered.map(stop => stop.id))
      .toEqual(['auto', 'off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
  })

  it('keeps unknown wire values right-most in arrival order', () => {
    const ordered = orderEffortsForSlider([{ id: 'ultra' }, { id: 'off' }, { id: 'mega' }, { id: 'auto' }])
    expect(ordered.map(stop => stop.id)).toEqual(['auto', 'off', 'ultra', 'mega'])
  })

  it('returns an empty track untouched', () => {
    expect(orderEffortsForSlider([])).toEqual([])
  })
})

describe('nearestEffortStopIndex', () => {
  const stops = [{ id: 'auto' }, { id: 'off' }, { id: 'low' }, { id: 'high' }, { id: 'max' }]

  it('matches an advertised id exactly', () => {
    expect(nearestEffortStopIndex(stops, 'low')).toBe(2)
    expect(nearestEffortStopIndex(stops, 'max')).toBe(4)
  })

  it('parks an unadvertised value on the rank-nearest stop, ties toward the stronger level', () => {
    expect(nearestEffortStopIndex(stops, 'medium')).toBe(3)
    expect(nearestEffortStopIndex(stops, 'minimal')).toBe(2)
    expect(nearestEffortStopIndex([{ id: 'low' }, { id: 'high' }], 'medium')).toBe(1)
  })

  it('lands unknown ids at the right end and absence at the left end', () => {
    expect(nearestEffortStopIndex(stops, 'ultra')).toBe(4)
    expect(nearestEffortStopIndex(stops, undefined)).toBe(0)
  })

  it('degenerate tracks always yield 0', () => {
    expect(nearestEffortStopIndex([], 'high')).toBe(0)
    expect(nearestEffortStopIndex([], undefined)).toBe(0)
  })
})
