/**
 * N3 (4.10.0) sync-planner guards (checklist N3):
 * default-never-overwrite, overwrite opt-in, official-route skip, unrecognized
 * skip, provider-grouped ops with correct paths, and the empty-plan => [] rule.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react-test-renderer'
import { opsOf, planSync } from '../src/client/effort-sync.ts'
import { EFFORT_TIER_FAMILIES } from '../src/model-effort-catalog.ts'

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

  it('never widens a declared level set (4.1-Flash: family has 4, model takes 2)', () => {
    // DeepSeek-V4.1-Flash on a gateway: the V4 family table carries
    // off/low/high/max, the model declares a narrower pair.
    const flash = {
      gateway: { models: [
        { id: 'deepseek-flash', reasoningEfforts: { low: 'low', high: 'high' } },
      ] },
    }
    const plan = planSync({ models: [{ provider: 'gateway', model: 'deepseek-flash' }], providers: flash, overwrite: true })
    expect(plan[0].skip).toBeUndefined()
    expect(Object.keys(plan[0].next!).sort()).toEqual(['high', 'low'])
  })

  it('writes the whole three-grade DeepSeek ladder on an undeclared model', () => {
    const bare = { gateway: { models: [{ id: 'deepseek-flash' }] } }
    const plan = planSync({ models: [{ provider: 'gateway', model: 'deepseek-flash' }], providers: bare, overwrite: false })
    expect(plan[0].family).toBe('DeepSeek V4')
    expect(plan[0].next).toEqual({ off: 'none', low: 'low', high: 'high', max: 'max' })
  })

  it('skips a model whose family has no effort wire (MiMo) without a write', () => {
    const mimo = { xiaomi: { models: [{ id: 'mimo-v2.6-flash' }] } }
    const plan = planSync({ models: [{ provider: 'xiaomi', model: 'mimo-v2.6-flash' }], providers: mimo, overwrite: true })
    expect(plan[0].family).toBe('Xiaomi MiMo')
    expect(plan[0].skip).toBe('no-wire')
    expect(plan[0].next).toBeUndefined()
  })

  it('keeps catalog wire spellings while narrowing to the declared keys', () => {
    const misspelled = {
      gateway: { models: [{ id: 'deepseek-flash', reasoningEfforts: { low: 'minimum', high: 'high' } }] },
    }
    const plan = planSync({ models: [{ provider: 'gateway', model: 'deepseek-flash' }], providers: misspelled, overwrite: true })
    expect(plan[0].next).toEqual({ low: 'low', high: 'high' })
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

/**
 * 4.13.3: the sync section must SHOW what the catalog knows — one row per
 * vendor family with its real levels — instead of a bare count, and MiMo has to
 * read as on/off only rather than "unrecognized".
 */
describe('catalog coverage panel', () => {
  it('renders one row per family with its real level list', async () => {
    const { createElement } = await import('react')
    const { create } = await import('react-test-renderer')
    const { EffortSyncSection } = await import('../src/client/effort-sync-ui.tsx')
    // A STABLE snapshot object: useSyncExternalStore compares with Object.is, so
    // a fresh literal per call would re-render forever (the real scope's
    // snapshot is stable by contract, so the test must be too).
    const snapshot = { status: 'ready', value: {}, revision: 1, writable: true, base: {}, user: {}, mode: 'host' }
    const scope = {
      getSnapshot: () => snapshot,
      subscribe: () => () => {},
      set: () => Promise.resolve(true),
      unset: () => Promise.resolve(true),
    }
    const identity = (key: string): string => key
    let renderer: { toJSON: () => unknown } | undefined
    await act(async () => {
      renderer = create(createElement(EffortSyncSection as never, { scope: scope as never, t: identity, readonly: false })) as never
    })
    const text = JSON.stringify(renderer!.toJSON())
    for (const family of EFFORT_TIER_FAMILIES) {
      expect(text).toContain(family.label)
    }
    expect(text).toContain('sync.catalog')
    expect(text).toContain('sync.catalog.toggle')
  })
})
