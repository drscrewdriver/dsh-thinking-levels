import { describe, expect, it } from 'vitest'
import { assertEffortId, decideEffort, isEffortId, toolDurationMs, type EffortDecisionInput } from '../src/thinking-level.ts'

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
  it('accepts exactly the five levels', () => {
    for (const level of ['off', 'low', 'high', 'max', 'auto']) {
      expect(isEffortId(level)).toBe(true)
      expect(() => assertEffortId(level, 'test')).not.toThrow()
    }
  })

  it('rejects out-of-band values that dsh would reject per request', () => {
    for (const bad of ['medium', 'xhigh', 3, null, undefined, {}]) {
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
