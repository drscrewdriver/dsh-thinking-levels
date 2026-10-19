/**
 * Issue-facing UI regressions for 4.4.0:
 * - issue #5: the trigger chip shows the user INTENT (auto), with the step's
 *   resolved level demoted to a secondary `→ <level>` hint — never a bare
 *   resolved value in place of the chosen auto;
 * - issue #3: the takeover popup carries a search row (>4 models, the shipped
 *   rule) filtering name/id case-insensitively while keeping grouping;
 * - issue #2: the api-type gate helper behind the capability card's disabled
 *   controls (responses protocols refuse the thinking-compat write wholesale).
 */
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { act, create } from 'react-test-renderer'
import { ModelPanel } from '../src/client/model-panel.tsx'
import { effortCompatConfigurable } from '../src/client/card.tsx'

// Node environment: the open popup's outside-click listener is the only
// `document` touch on this render path — a two-method stub keeps the spec off
// a jsdom dependency.
;(globalThis as { document?: unknown }).document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  // ContextRing sniffs the page language for its zh/en readout.
  documentElement: { lang: 'en' },
}

const identity = (key: string): string => key

function inertScope(snapshot: unknown): unknown {
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
    set: () => Promise.resolve(true),
    unset: () => Promise.resolve(true),
  }
}

const piSnapshot = {
  status: 'ready', value: {}, revision: 1, writable: true, base: {}, user: { providers: {} }, mode: 'host',
}
const dsSnapshot = {
  status: 'ready', value: { models: [] }, revision: 1, writable: true, base: {}, user: {}, mode: 'host',
}

/** Six models across two groups — over the `> 4` search threshold. */
function makeDirectory(currentEffort: string | undefined): unknown {
  const state = {
    status: 'ready',
    error: null,
    current: {
      provider: 'p1',
      model: 'm1',
      ...(currentEffort === undefined ? {} : { reasoningEffort: currentEffort }),
    },
    groups: [
      {
        id: 'p1',
        name: 'Provider One',
        models: [
          {
            id: 'm1',
            name: 'Alpha One',
            reasoning: {
              defaultEffort: 'high',
              efforts: [
                { id: 'auto', name: 'Auto' },
                { id: 'low', name: 'Low' },
                { id: 'high', name: 'High' },
              ],
            },
          },
          { id: 'm2', name: 'Alpha Two' },
          { id: 'm3', name: 'Alpha Three' },
        ],
      },
      {
        id: 'p2',
        name: 'Provider Two',
        models: [
          { id: 'b1', name: 'Beta One' },
          { id: 'b2', name: 'Beta Two' },
          { id: 'b3', name: 'Beta Three' },
        ],
      },
    ],
  }
  return {
    store: { subscribe: () => () => {}, getSnapshot: () => state },
    load: () => Promise.resolve(),
    select: () => Promise.resolve(),
  }
}

/** The subset of the react-test-renderer instance surface this spec walks. */
interface RendererFace {
  toJSON(): unknown
  root: unknown
}

interface InstanceFace {
  props: Record<string, unknown>
}

function renderPanel(currentEffort: string | undefined, tlValue: Record<string, unknown>): RendererFace {
  const element = createElement(ModelPanel as never, {
    directory: makeDirectory(currentEffort),
    piAiScope: inertScope(piSnapshot),
    deepseekScope: inertScope(dsSnapshot),
    tlScope: inertScope({ status: 'ready', value: tlValue, revision: 1, writable: true, base: {}, user: {}, mode: 'host' }),
    sessionId: 's1',
    t: identity,
  } as never)
  let renderer: RendererFace | undefined
  act(() => { renderer = create(element) as unknown as RendererFace })
  if (renderer === undefined) throw new Error('renderer not captured')
  return renderer
}

const json = (renderer: RendererFace): string => JSON.stringify(renderer.toJSON())

const find = (renderer: RendererFace, props: Record<string, unknown>): InstanceFace =>
  (renderer.root as { findByProps: (match: Record<string, unknown>) => InstanceFace }).findByProps(props)

describe('ModelPanel trigger chip (issue #5)', () => {
  it('shows auto (the intent) with the resolved level demoted to a hint when the scheduler masked it', () => {
    const text = json(renderPanel('low', { level: 'auto' }))
    expect(text).toContain('Auto')
    expect(text).toContain('→ Low')
  })

  it('shows auto without a hint when the merged value itself is the mask (persisted pending)', () => {
    const text = json(renderPanel('auto', { level: 'auto' }))
    expect(text).toContain('Auto')
    expect(text).not.toContain('→ ')
  })

  it('keeps a fixed configured level rendering the plain level', () => {
    const text = json(renderPanel(undefined, { level: 'high' }))
    expect(text).toContain('High')
    expect(text).not.toContain('→ ')
  })
})

describe('ModelPanel popup search (issue #3)', () => {
  it('appears once the catalog passes four models and filters by name (case-insensitive), keeping groups', () => {
    const renderer = renderPanel('auto', { level: 'auto' })
    expect(json(renderer)).not.toContain('panel.search.placeholder')
    const trigger = find(renderer, { 'aria-haspopup': 'dialog' })
    act(() => { (trigger.props.onClick as () => void)() })
    expect(json(renderer)).toContain('panel.search.placeholder')
    const input = find(renderer, { placeholder: 'panel.search.placeholder' })
    const type = (value: string): void => {
      act(() => {
        ;(input.props.onChange as (event: { currentTarget: { value: string } }) => void)({ currentTarget: { value } })
      })
    }
    type('beta')
    // 'Alpha One' also rides the (always-present) trigger label — the popup
    // rows are proven by the other names and the group headers.
    expect(json(renderer)).toContain('Beta One')
    expect(json(renderer)).not.toContain('Alpha Two')
    expect(json(renderer)).not.toContain('Provider One')
    type('')
    // Cleared: both groups ride the full list again (rows fold back under
    // their collapsed headers — the headers are the visible truth).
    expect(json(renderer)).toContain('Provider One')
    expect(json(renderer)).toContain('Provider Two')
    expect(json(renderer)).not.toContain('model.panel.empty')
    type('alpha')
    expect(json(renderer)).toContain('Alpha Two')
    type('zzz')
    expect(json(renderer)).toContain('model.panel.empty')
  })
})

describe('effortCompatConfigurable (issue #2)', () => {
  it('allows openai-completions and the absent-api default', () => {
    expect(effortCompatConfigurable({ providerId: 'p', index: 0, model: {}, modelId: 'm', providerApi: 'openai-completions' })).toBe(true)
    expect(effortCompatConfigurable({ providerId: 'p', index: 0, model: {}, modelId: 'm' })).toBe(true)
  })

  it('gates the responses protocols', () => {
    expect(effortCompatConfigurable({ providerId: 'p', index: 0, model: {}, modelId: 'm', providerApi: 'openai-responses' })).toBe(false)
    expect(effortCompatConfigurable({ providerId: 'p', index: 0, model: {}, modelId: 'm', providerApi: 'azure-openai-responses' })).toBe(false)
    expect(effortCompatConfigurable({ providerId: 'p', index: 0, model: {}, modelId: 'm', providerApi: 'anthropic-messages' })).toBe(false)
  })
})
