import { describe, expect, it } from 'vitest'
import {
  declaresThinking,
  identifyTakeoverProviders,
  isCustomOpenAiGateway,
  takeoverPatch,
  takeoverRoutesOf,
  withOfficialCompatFixes,
  type PiAiSection,
} from '../src/takeover-sync.ts'

const customThinkingProvider = {
  local35b: {
    api: 'openai-completions',
    baseURL: 'http://192.168.100.242:8200/v1',
    models: [
      { id: 'Qwen3.6-35B-A3B', reasoningEfforts: { off: null, high: 'high' } },
    ],
  },
}

describe('isCustomOpenAiGateway', () => {
  it('explicit api: openai-completions is custom', () => {
    expect(isCustomOpenAiGateway({ api: 'openai-completions', baseURL: 'http://x/v1' })).toBe(true)
  })

  it('a non-official baseURL without api field is custom', () => {
    expect(isCustomOpenAiGateway({ baseURL: 'http://192.168.100.242:8200/v1' })).toBe(true)
  })

  it('official hosts are not custom', () => {
    expect(isCustomOpenAiGateway({ baseURL: 'https://api.openai.com/v1' })).toBe(false)
    expect(isCustomOpenAiGateway({ baseURL: 'https://api.deepseek.com/v1' })).toBe(false)
    expect(isCustomOpenAiGateway({ baseURL: 'https://openrouter.ai/api/v1' })).toBe(false)
  })

  it('a route with neither api nor baseURL is not custom (catalog route)', () => {
    expect(isCustomOpenAiGateway({ models: [] })).toBe(false)
    expect(isCustomOpenAiGateway(undefined)).toBe(false)
  })
})

describe('declaresThinking', () => {
  it('true when a model carries a reasoningEfforts table', () => {
    expect(declaresThinking(customThinkingProvider.local35b)).toBe(true)
  })

  it('false when reasoningEfforts is false (thinking off)', () => {
    expect(declaresThinking({ models: [{ id: 'm', reasoningEfforts: false }] })).toBe(false)
  })

  it('false when no models or no table', () => {
    expect(declaresThinking({ models: [{ id: 'm' }] })).toBe(false)
    expect(declaresThinking({ models: [] })).toBe(false)
    expect(declaresThinking(undefined)).toBe(false)
  })
})

describe('identifyTakeoverProviders', () => {
  it('finds custom + thinking providers only', () => {
    const section: PiAiSection = {
      providers: {
        ...customThinkingProvider,
        xiaomi: { apiKeyEnv: 'XIAOMI_API_KEY', models: [{ id: 'mimo-v2.5' }] },
        official: { baseURL: 'https://api.deepseek.com/v1', models: [{ id: 'm', reasoningEfforts: { high: 'high' } }] },
        customNoThink: { api: 'openai-completions', baseURL: 'http://y/v1', models: [{ id: 'm' }] },
      },
    }
    expect(identifyTakeoverProviders(section)).toEqual(['local35b'])
  })

  it('empty when the section is absent or has no providers', () => {
    expect(identifyTakeoverProviders(undefined)).toEqual([])
    expect(identifyTakeoverProviders({})).toEqual([])
  })
})

describe('withOfficialCompatFixes', () => {
  it('writes the official flag at route level for identified providers', () => {
    const section: PiAiSection = { providers: { ...customThinkingProvider } }
    const next = withOfficialCompatFixes(section)!
    expect(next.providers?.local35b?.compat).toEqual({ supportsDeveloperRole: false })
    // other profile fields survive
    expect(next.providers?.local35b?.baseURL).toBe('http://192.168.100.242:8200/v1')
  })

  it('leaves non-identified providers untouched and preserves section identity for them', () => {
    const section: PiAiSection = {
      providers: {
        ...customThinkingProvider,
        official: { baseURL: 'https://api.deepseek.com/v1', models: [{ id: 'm', reasoningEfforts: { high: 'high' } }] },
      },
    }
    const next = withOfficialCompatFixes(section)!
    expect(next.providers?.official).toBe(section.providers?.official)
    expect(next.providers?.official?.compat).toBeUndefined()
  })

  it('respects an explicit route-level value (true or false) — model fixes still apply', () => {
    const explicitTrue: PiAiSection = {
      providers: { local35b: { ...customThinkingProvider.local35b, compat: { supportsDeveloperRole: true } } },
    }
    const next = withOfficialCompatFixes(explicitTrue)!
    // route-level explicit value is never overwritten...
    expect(((next.providers?.local35b?.compat ?? {}) as Record<string, unknown>)['supportsDeveloperRole']).toBe(true)
    // ...but the model-level toggle fix is a different concern and still applies
    const rows = next.providers?.local35b?.models as Array<Record<string, unknown>>
    expect(rows[0]?.compat).toEqual({ thinkingFormat: 'qwen-chat-template' })
  })

  it('merges into an existing compat object without clobbering siblings', () => {
    const section: PiAiSection = {
      providers: { local35b: { ...customThinkingProvider.local35b, compat: { maxTokensField: 'max_tokens' } } },
    }
    const next = withOfficialCompatFixes(section)!
    expect(next.providers?.local35b?.compat).toEqual({ maxTokensField: 'max_tokens', supportsDeveloperRole: false })
  })

  it('fills thinkingFormat qwen on toggle-style rows while effort-capable and explicit-format rows stay untouched', () => {
    const section: PiAiSection = {
      providers: {
        local35b: {
          ...customThinkingProvider.local35b,
          models: [
            // toggle-style: thinking table, no supportsReasoningEffort → qwen
            { id: 'toggle-model', reasoningEfforts: { off: null, high: 'high' } },
            // effort-capable: reasoning_effort wire — format untouched
            { id: 'effort-model', reasoningEfforts: { off: null, high: 'high' }, compat: { supportsReasoningEffort: true } },
            // explicit format: respected, never clobbered
            { id: 'explicit-format', reasoningEfforts: { off: null, high: 'high' }, compat: { thinkingFormat: 'qwen-chat-template' } },
          ],
        },
      },
    }
    const next = withOfficialCompatFixes(section)!
    const rows = next.providers?.local35b?.models as Array<Record<string, unknown>>
    expect(rows[0]?.compat).toEqual({ thinkingFormat: 'qwen-chat-template' })
    expect(rows[1]?.compat).toEqual({ supportsReasoningEffort: true })
    expect(rows[2]?.compat).toEqual({ thinkingFormat: 'qwen-chat-template' })
  })

  it('merges the toggle fix into an existing model compat without clobbering siblings', () => {
    const section: PiAiSection = {
      providers: {
        local35b: {
          ...customThinkingProvider.local35b,
          models: [{ id: 'm', reasoningEfforts: { off: null, high: 'high' }, compat: { supportsDeveloperRole: false } }],
        },
      },
    }
    const next = withOfficialCompatFixes(section)!
    const rows = next.providers?.local35b?.models as Array<Record<string, unknown>>
    expect(rows[0]?.compat).toEqual({ supportsDeveloperRole: false, thinkingFormat: 'qwen-chat-template' })
  })

  it('scans modelOverrides for thinking declaration (models[]-absent routes)', () => {
    const section: PiAiSection = {
      providers: {
        overridesOnly: {
          api: 'openai-completions',
          baseURL: 'http://z/v1',
          modelOverrides: { m: { reasoningEfforts: { high: 'high' } } },
        },
      },
    }
    const next = withOfficialCompatFixes(section)!
    expect(next.providers?.overridesOnly?.compat).toEqual({ supportsDeveloperRole: false })
  })

  it('returns the previous section (identity) when nothing to write', () => {
    const empty: PiAiSection = { providers: {} }
    expect(withOfficialCompatFixes(empty)).toBe(empty)
    expect(withOfficialCompatFixes(undefined)).toBeUndefined()
  })
})

describe('takeoverPatch — the mirror write', () => {
  it('writes only the enabled flag, never the manual providers list', () => {
    expect(takeoverPatch({ enabled: false, providers: ['manual'] }, true)).toEqual({ enabled: true })
    expect(takeoverPatch({ enabled: true, providers: ['manual'] }, false)).toEqual({ enabled: false })
  })

  it('returns undefined when the section already agrees (identity)', () => {
    expect(takeoverPatch({ enabled: true, providers: [] }, true)).toBeUndefined()
    expect(takeoverPatch({ enabled: false, providers: [] }, false)).toBeUndefined()
  })

  it('returns undefined when the transport is not composed (nothing to drive)', () => {
    expect(takeoverPatch(undefined, true)).toBeUndefined()
  })

  it('treats any non-boolean enabled as needing the write', () => {
    expect(takeoverPatch({ enabled: undefined }, true)).toEqual({ enabled: true })
    expect(takeoverPatch({}, false)).toEqual({ enabled: false })
  })
})

describe('takeoverRoutesOf', () => {
  const piAi: PiAiSection = { providers: { ...customThinkingProvider } }

  it('unions the manual list with the routes identified from llm-pi-ai', () => {
    expect(takeoverRoutesOf({ enabled: true, providers: ['manual-route'] }, piAi))
      .toEqual(['manual-route', 'local35b'])
  })

  it('returns only the identified routes when the manual list is empty', () => {
    expect(takeoverRoutesOf({ enabled: true, providers: [] }, piAi)).toEqual(['local35b'])
    expect(takeoverRoutesOf({ enabled: true }, piAi)).toEqual(['local35b'])
  })

  it('deduplicates a manual entry that is also identified', () => {
    expect(takeoverRoutesOf({ enabled: true, providers: ['local35b'] }, piAi)).toEqual(['local35b'])
  })

  it('returns an empty list when the transport is disabled', () => {
    expect(takeoverRoutesOf({ enabled: false, providers: ['local35b'] }, piAi)).toEqual([])
  })

  it('returns null when the transport is not composed (namespace absent)', () => {
    expect(takeoverRoutesOf(undefined, piAi)).toBeNull()
  })

  it('filters non-string manual entries and works without an llm-pi-ai section', () => {
    expect(takeoverRoutesOf({ enabled: true, providers: ['a', 3, null] }, undefined)).toEqual(['a'])
  })
})
