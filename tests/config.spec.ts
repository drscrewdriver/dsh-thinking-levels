import { describe, expect, it } from 'vitest'
import { Config, DEFAULT_CONFIG, installLegacySection, readVolatile } from '../src/index.ts'

/** Partial configs ride the wire untrusted; type level only sees full ones. */
const asConfig = (patch: Record<string, unknown>) => patch as never

describe('plugin config schema', () => {
  it('schema defaults stay in lockstep with DEFAULT_CONFIG (volatile fields read through refs)', () => {
    const parsed = Config(asConfig({}))
    expect(readVolatile(parsed.enabled, true)).toBe(DEFAULT_CONFIG.enabled)
    expect(readVolatile(parsed.level, 'auto')).toBe(DEFAULT_CONFIG.level)
    expect(readVolatile(parsed.allowDowngrade, true)).toBe(DEFAULT_CONFIG.allowDowngrade)
    expect(readVolatile(parsed.allowUpgrade, false)).toBe(DEFAULT_CONFIG.allowUpgrade)
    expect(parsed.models).toEqual(DEFAULT_CONFIG.models)
  })

  it('hands the runtime-adjustable fields over as live volatile refs (0.1.7 protocol)', () => {
    const parsed = Config(asConfig({}))
    for (const field of ['enabled', 'level', 'allowDowngrade', 'allowUpgrade'] as const) {
      const value: unknown = parsed[field]
      expect(typeof value, field).toBe('object')
      expect(typeof (value as { get?: unknown }).get, field).toBe('function')
    }
    // `models` is a configurer-level field, not runtime-adjustable: plain value.
    expect(parsed.models).toEqual({})
  })

  it('accepts the nine levels and the scheduler toggles at both surfaces', () => {
    const parsed = Config(asConfig({ enabled: false, level: 'medium', allowDowngrade: false, allowUpgrade: true }))
    expect(readVolatile(parsed.enabled, true)).toBe(false)
    expect(readVolatile(parsed.level, 'auto')).toBe('medium')
    expect(readVolatile(parsed.allowDowngrade, true)).toBe(false)
    expect(readVolatile(parsed.allowUpgrade, false)).toBe(true)
    expect(parsed.models).toEqual({})
  })

  it('accepts configurer-confirmed model capability overrides with extended levels', () => {
    const parsed = Config(asConfig({
      level: 'auto',
      models: {
        'llm-pi-ai/Qwen3.6-35B-A3B': { vision: false, thinking: true, efforts: false },
        'llm-pi-ai/Qwen3.8-27B': { efforts: ['low', 'high'] },
        'llm-pi-ai/custom-gateway': { efforts: ['minimal', 'medium', 'xhigh', 'max'] },
      },
    }))
    expect(parsed.models).toEqual({
      'llm-pi-ai/Qwen3.6-35B-A3B': { vision: false, thinking: true, efforts: false },
      'llm-pi-ai/Qwen3.8-27B': { efforts: ['low', 'high'] },
      'llm-pi-ai/custom-gateway': { efforts: ['minimal', 'medium', 'xhigh', 'max'] },
    })
  })

  it('rejects out-of-band levels at the configuration surface', () => {
    expect(() => Config(asConfig({ level: 'ultra' }))).toThrow()
    expect(() => Config(asConfig({ level: 'reasoning' }))).toThrow()
  })

  it('accepts a declared contextWindow within bounds', () => {
    const parsed = Config(asConfig({ models: { 'llm-pi-ai/custom-gateway': { contextWindow: 1_000_000 } } }))
    expect(parsed.models['llm-pi-ai/custom-gateway']).toEqual({ contextWindow: 1_000_000 })
  })

  it('rejects out-of-band contextWindow values', () => {
    expect(() => Config(asConfig({ models: { 'p/m': { contextWindow: 2_000_000 } } }))).toThrow()
    expect(() => Config(asConfig({ models: { 'p/m': { contextWindow: 0 } } }))).toThrow()
    expect(() => Config(asConfig({ models: { 'p/m': { contextWindow: '128k' as unknown as number } } }))).toThrow()
  })

  it('keeps contextWindow absent when not declared', () => {
    const parsed = Config(asConfig({ models: { 'p/m': { vision: true } } }))
    expect(parsed.models['p/m']).toEqual({ vision: true })
  })
})

describe('legacy settings install predicate (≤0.1.6 imperative face)', () => {
  /** Minimal ctx stub: captures inject deps, invokes the callback with the given scope object. */
  function stubCtx(settingsService: unknown): { ctx: unknown; registered: string[]; deps: string[][] } {
    const registered: string[] = []
    const deps: string[][] = []
    const ctx = {
      inject(d: string[], fn: (sctx: { settings: unknown; effect: (b: () => unknown) => void }) => void) {
        deps.push(d)
        fn({ settings: settingsService, effect: () => {} })
      },
    }
    return { ctx, registered, deps }
  }
  const registerReturn = { get: () => ({ level: 'auto' }), watch: () => {} }

  it('installs when `register` exists EVEN THOUGH describe rides the same service (0.1.2/0.1.5 shape)', () => {
    const { ctx, registered, deps } = stubCtx({
      register: (ns: string) => { registered.push(ns); return registerReturn },
      describe: () => ({}),
      installSection: () => {},
    })
    installLegacySection(ctx as never, DEFAULT_CONFIG, { setSource: () => {} })
    expect(deps).toEqual([['settings']])
    expect(registered).toEqual(['thinking-levels'])
  })

  it('installs on the bare imperative face (0.1.0/0.1.1 shape)', () => {
    const { ctx, registered } = stubCtx({
      register: (ns: string) => { registered.push(ns); return registerReturn },
    })
    installLegacySection(ctx as never, DEFAULT_CONFIG, { setSource: () => {} })
    expect(registered).toEqual(['thinking-levels'])
  })

  it('skips when the imperative face is absent (0.1.7+ declarative generation)', () => {
    const { ctx, registered } = stubCtx({ describe: () => ({}), update: () => {} })
    installLegacySection(ctx as never, DEFAULT_CONFIG, { setSource: () => {} })
    expect(registered).toEqual([])
  })

  it('skips when the settings service is missing entirely', () => {
    const { ctx, registered } = stubCtx(undefined)
    installLegacySection(ctx as never, DEFAULT_CONFIG, { setSource: () => {} })
    expect(registered).toEqual([])
  })
})
