import { describe, expect, it } from 'vitest'
import { decideEffort, toolDurationMs, type EffortDecisionInput } from '../src/effort-decision.ts'

const base = (over: Partial<EffortDecisionInput>): EffortDecisionInput => ({
  recentCalls: [],
  selected: 'high',
  allowDowngrade: true,
  allowUpgrade: true,
  ...over,
})

describe('decideEffort', () => {
  it('keeps the selected effort for a fresh prompt without tool calls', () => {
    expect(decideEffort(base({ selected: 'high' }))).toBe('high')
    expect(decideEffort(base({ selected: 'max' }))).toBe('max')
  })

  it('downgrades to low when recent calls are simple and deterministic', () => {
    const recentCalls = [
      { name: 'bash', argsSize: 40 },
      { name: 'fs_read', argsSize: 20 },
      { name: 'fs_write', argsSize: 120 },
    ]
    expect(decideEffort(base({ recentCalls, selected: 'high' }))).toBe('low')
  })

  it('stays at the selected effort when downgrades are disabled', () => {
    const recentCalls = [{ name: 'bash', argsSize: 40 }]
    expect(decideEffort(base({ recentCalls, selected: 'high', allowDowngrade: false }))).toBe('high')
  })

  it('upgrades to max only for very heavy payloads when upgrades are allowed', () => {
    const recentCalls = [{ name: 'mcp__docs', argsSize: 4000 }]
    expect(decideEffort(base({ recentCalls, selected: 'high' }))).toBe('max')
    expect(decideEffort(base({ recentCalls, selected: 'high', allowUpgrade: false }))).toBe('high')
  })

  it('mixed or heavy tools lift the effort to high', () => {
    const recentCalls = [
      { name: 'bash', argsSize: 40 },
      { name: 'web_search', argsSize: 900 },
      { name: 'mcp__db', argsSize: 300 },
    ]
    expect(decideEffort(base({ recentCalls, selected: 'low' }))).toBe('high')
  })
})

describe('toolDurationMs', () => {
  it('reports the wall-clock delta and never negative jitter', () => {
    expect(toolDurationMs(1000, 2400)).toBe(1400)
    expect(toolDurationMs(2400, 1000)).toBe(0)
  })
})
