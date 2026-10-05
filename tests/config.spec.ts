import { describe, expect, it } from 'vitest'
import { Config, DEFAULT_CONFIG, THINKING_LEVELS_SETTINGS_NAMESPACE, type ThinkingLevelsConfig } from '../src/index.ts'

/** Partial configs ride the wire untrusted; type level only sees full ones. */
const asConfig = (patch: Record<string, unknown>): ThinkingLevelsConfig => patch as unknown as ThinkingLevelsConfig

describe('plugin config schema', () => {
  it('schema defaults stay in lockstep with DEFAULT_CONFIG', () => {
    expect(Config(asConfig({}))).toEqual(DEFAULT_CONFIG)
  })

  it('accepts the nine levels and the scheduler toggles at both surfaces', () => {
    const parsed = Config(asConfig({ enabled: false, level: 'medium', allowDowngrade: false, allowUpgrade: true }))
    expect(parsed).toEqual({ enabled: false, level: 'medium', allowDowngrade: false, allowUpgrade: true, takeover: false, models: {} })
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

  it('exposes a kebab-case settings namespace', () => {
    expect(THINKING_LEVELS_SETTINGS_NAMESPACE).toBe('thinking-levels')
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
    expect(Config(asConfig({}))).toEqual(DEFAULT_CONFIG)
    const parsed = Config(asConfig({ models: { 'p/m': { vision: true } } }))
    expect(parsed.models['p/m']).toEqual({ vision: true })
  })
})
