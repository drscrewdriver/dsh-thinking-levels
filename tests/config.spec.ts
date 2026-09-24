import { describe, expect, it } from 'vitest'
import { Config, DEFAULT_CONFIG, readVolatile } from '../src/index.ts'

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
