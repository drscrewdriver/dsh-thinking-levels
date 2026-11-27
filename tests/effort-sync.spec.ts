/**
 * N3 (4.10.0) sync-planner guards (checklist N3):
 * default-never-overwrite, overwrite opt-in, official-route skip, unrecognized
 * skip, provider-grouped ops with correct paths, and the empty-plan => [] rule.
 */
import { describe, expect, it } from 'vitest'
import { opsOf, planSync } from '../src/client/effort-sync.ts'

const providers = {
  openrouter: { models: [
    { id: 'deepseek-v4-pro' },
    { id: 'grok-4.6' },
    { id: 'claude-opus-4.6', reasoningEfforts: { high: 'high', max: 'max' } },
    { id: 'mystery-9000' },
  ] },
  'deepseek-official': { models: [{ id: 'deepseek-chat' }] },
}

describe('planSync', () => {
  it('does not overwrite an existing declaration by default (skip:declared)', () => {
    const plan = planSync({ models: [{ provider: 'openrouter', model: 'claude-opus-4.6' }], providers, overwrite: false })
    expect(plan[0].skip).toBe('declared')
    expect(plan[0].next).toBeUndefined()
    expect(plan[0].current).toEqual({ high: 'high', max: 'max' })
  })

  it('overwrites when overwrite:true', () => {
    const plan = planSync({ models: [{ provider: 'openrouter', model: 'claude-opus-4.6' }], providers, overwrite: true })
    expect(plan[0].skip).toBeUndefined()
    expect(plan[0].next).toBeDefined()
  })

  it('skips the official DeepSeek route (skip:host-managed)', () => {
    const plan = planSync({ models: [{ provider: 'deepseek-official', model: 'deepseek-chat' }], providers, overwrite: true })
    expect(plan[0].skip).toBe('host-managed')
    expect(plan[0].next).toBeUndefined()
  })

  it('skips an unrecognized model (skip:unrecognized)', () => {
    const plan = planSync({ models: [{ provider: 'openrouter', model: 'mystery-9000' }], providers, overwrite: false })
    expect(plan[0].skip).toBe('unrecognized')
  })

  it('fills an undeclared known model with the family ladder', () => {
    const plan = planSync({ models: [{ provider: 'openrouter', model: 'grok-4.6' }], providers, overwrite: false })
    expect(plan[0].skip).toBeUndefined()
    expect(plan[0].next).toMatchObject({ low: 'low', high: 'high', xhigh: 'xhigh' })
    expect(plan[0].next!.off).toBeUndefined()
  })
})

describe('opsOf', () => {
  it('groups by provider with the correct path shape', () => {
    const plan = planSync({
      models: [
        { provider: 'openrouter', model: 'deepseek-v4-pro' },
        { provider: 'openrouter', model: 'grok-4.6' },
      ],
      providers,
      overwrite: false,
    })
    const batches = opsOf(plan)
    expect(batches).toHaveLength(1)
    expect(batches[0].provider).toBe('openrouter')
    expect(batches[0].ops[0].path).toEqual(['providers', 'openrouter', 'models', '0', 'reasoningEfforts'])
    expect(batches[0].ops[0].op).toBe('set')
    // deepseek-v4-pro is at index 0, grok-4.6 at index 1.
    expect(batches[0].ops[1].path).toEqual(['providers', 'openrouter', 'models', '1', 'reasoningEfforts'])
  })

  it('returns [] when nothing is writable (no meaningless write)', () => {
    const plan = planSync({
      models: [
        { provider: 'deepseek-official', model: 'deepseek-chat' },
        { provider: 'openrouter', model: 'mystery-9000' },
        { provider: 'openrouter', model: 'claude-opus-4.6' },
      ],
      providers,
      overwrite: false,
    })
    expect(opsOf(plan)).toEqual([])
  })
})
