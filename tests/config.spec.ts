import { describe, expect, it } from 'vitest'
import { Config, DEFAULT_CONFIG, THINKING_LEVELS_SETTINGS_NAMESPACE, type ThinkingLevelsConfig } from '../src/index.ts'

/** Partial configs ride the wire untrusted; type level only sees full ones. */
const asConfig = (patch: Record<string, unknown>): ThinkingLevelsConfig => patch as unknown as ThinkingLevelsConfig

describe('plugin config schema', () => {
  it('schema defaults stay in lockstep with DEFAULT_CONFIG', () => {
    expect(Config(asConfig({}))).toEqual(DEFAULT_CONFIG)
  })

  it('accepts the five levels and the scheduler toggles at both surfaces', () => {
    const parsed = Config({ enabled: false, level: 'low', allowDowngrade: false, allowUpgrade: true })
    expect(parsed).toEqual({ enabled: false, level: 'low', allowDowngrade: false, allowUpgrade: true })
  })

  it('rejects out-of-band levels at the configuration surface', () => {
    expect(() => Config(asConfig({ level: 'medium' }))).toThrow()
    expect(() => Config(asConfig({ level: 'xhigh' }))).toThrow()
  })

  it('exposes a kebab-case settings namespace', () => {
    expect(THINKING_LEVELS_SETTINGS_NAMESPACE).toBe('thinking-levels')
  })
})
