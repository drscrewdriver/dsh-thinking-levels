/**
 * Regression for issue #4 (wrapper stacking): the advertisement re-runs on
 * every `llm/adapters-updated`; before the WeakSet guard each pass wrapped
 * `resolveModel` again, so a model resolution replayed the post-processing
 * (including a full settings readout via `piAiFor`) once per stacked layer —
 * the O(models x layers) cost the slow model page measured.
 */
import { describe, expect, it } from 'vitest'
import { advertiseModelCapability, piAiPosture } from '../src/index.ts'

interface EffortLike { id: string; name: string }

/** A fresh adapter whose original resolveModel reports one native effort. */
function stubAdapter(): { resolveModel: (provider: string, model: string, signal?: unknown) => Promise<{ reasoning?: { efforts?: EffortLike[] } }> } {
  return {
    resolveModel: async () => ({ reasoning: { efforts: [{ id: 'off', name: 'Off' }] } }),
  }
}

describe('advertiseModelCapability idempotence (issue #4)', () => {
  it('re-running the advertisement does not stack wrappers', async () => {
    const adapter = stubAdapter()
    const llm = { adapters: new Map<string, { adapter: unknown }>([['route', { adapter }]]) }
    let piAiCalls = 0
    const piAiFor = () => { piAiCalls += 1; return undefined }
    const overrideFor = () => undefined
    advertiseModelCapability(llm as never, overrideFor, piAiFor as never)
    advertiseModelCapability(llm as never, overrideFor, piAiFor as never)
    advertiseModelCapability(llm as never, overrideFor, piAiFor as never)
    piAiCalls = 0
    const info = await adapter.resolveModel('p', 'm')
    // One wrapper layer => exactly one post-processing pass per resolution.
    // Stacked layers would inflate this to the layer count.
    expect(piAiCalls).toBe(1)
    const autos = (info.reasoning?.efforts ?? []).filter(effort => effort.id === 'auto')
    expect(autos).toHaveLength(1)
  })

  it('wraps a genuinely new adapter while skipping the marked one', async () => {
    const first = stubAdapter()
    const llm = { adapters: new Map<string, { adapter: unknown }>([['a', { adapter: first }]]) }
    advertiseModelCapability(llm as never, () => undefined, () => undefined)
    const second = stubAdapter()
    llm.adapters.set('b', { adapter: second })
    advertiseModelCapability(llm as never, () => undefined, () => undefined)
    const info = await second.resolveModel('p', 'm')
    // The late-registering adapter is advertised once...
    expect((info.reasoning?.efforts ?? []).filter(effort => effort.id === 'auto')).toHaveLength(1)
    const infoFirst = await first.resolveModel('p', 'm')
    // ...and the already-marked one still resolves through exactly one layer.
    expect((infoFirst.reasoning?.efforts ?? []).filter(effort => effort.id === 'auto')).toHaveLength(1)
  })

  it('leaves non-reasoning models untouched', async () => {
    const adapter: { resolveModel: (provider: string, model: string, signal?: unknown) => Promise<Record<string, never>> } = {
      resolveModel: async () => ({}),
    }
    const llm = { adapters: new Map([['route', { adapter }]]) }
    advertiseModelCapability(llm as never, () => undefined, () => undefined)
    const info = await adapter.resolveModel('p', 'm')
    expect(info).toEqual({})
  })
})

/**
 * Regression for issue #9: the Off/On toggle fold must be an
 * openai-completions-only behavior. The transport is named
 * `dsh-llm-openai-completions` but since the 4.4.x line fronts three wire
 * protocols; a taken-over Responses/Anthropic route whose `reasoningEfforts`
 * table drives pi-ai's native thinkingLevelMap must keep its full level set —
 * folding it stripped the configured levels to Off/On, and (unlike completions)
 * the `supportsReasoningEffort` escape hatch cannot even be set there.
 */
describe('piAiPosture protocol gate (issue #9)', () => {
  /** A one-model llm-pi-ai section with a multi-level thinking table. */
  const sectionWith = (api: string | undefined): Record<string, unknown> => {
    const profile: Record<string, unknown> = {
      models: [{ id: 'm', reasoningEfforts: { off: null, low: 'low', high: 'high', xhigh: 'xhigh' } }],
    }
    if (api !== undefined) profile['api'] = api
    return { providers: { own: profile } }
  }

  it('does NOT fold a taken-over Responses route', () => {
    const posture = piAiPosture(sectionWith('openai-responses') as never, 'own', 'm', ['own'])
    expect(posture?.thinkingOn).toBe(false)
  })

  it('does NOT fold a taken-over Anthropic route', () => {
    const posture = piAiPosture(sectionWith('anthropic') as never, 'own', 'm', ['own'])
    expect(posture?.thinkingOn).toBe(false)
  })

  it('DOES fold a taken-over completions route (no supportsReasoningEffort)', () => {
    const posture = piAiPosture(sectionWith('openai-completions') as never, 'own', 'm', ['own'])
    expect(posture?.thinkingOn).toBe(true)
    expect(posture?.supportsEffort).toBe(false)
  })

  it('treats an absent api as completions (pi-ai default) and folds', () => {
    const posture = piAiPosture(sectionWith(undefined) as never, 'own', 'm', ['own'])
    expect(posture?.thinkingOn).toBe(true)
  })

  it('never folds a Responses route outside the takeover judgment', () => {
    const posture = piAiPosture(sectionWith('openai-responses') as never, 'own', 'm', [])
    expect(posture?.thinkingOn).toBe(false)
  })

  it('a completions route declaring supportsReasoningEffort is not toggle-only', () => {
    const section = {
      providers: {
        own: {
          api: 'openai-completions',
          models: [{
            id: 'm',
            reasoningEfforts: { off: null, high: 'high' },
            compat: { supportsReasoningEffort: true },
          }],
        },
      },
    }
    const posture = piAiPosture(section as never, 'own', 'm', ['own'])
    expect(posture?.supportsEffort).toBe(true)
  })
})
