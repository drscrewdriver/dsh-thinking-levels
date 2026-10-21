/**
 * Issue #6 render regression: on a non-openai-completions route the capability
 * card must leave the Thinking checkbox ENABLED (thinking is the prerequisite
 * of the effort selector, and its `reasoningEfforts` declaration is
 * protocol-neutral) while the completions-only compat controls — 支持 think
 * effort and the thinking-format select — stay disabled.
 *
 * Rendered through the real card so the JSX wiring is what is asserted, not
 * just the pure helper.
 */
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { act, create } from 'react-test-renderer'
import { ThinkingLevelsCard, completionsCompatConfigurable } from '../src/client/card.tsx'

// Node environment: the settings disclosure only touches these two `document`
// members. Module scope so the card's first render (inside `create`) sees the
// stub.
;(globalThis as { document?: unknown }).document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  documentElement: { lang: 'en' },
}

const identity = (key: string): string => key

function inertScope(snapshot: unknown): {
  getSnapshot: () => unknown
  subscribe: () => () => void
  set: () => Promise<boolean>
  unset: () => Promise<boolean>
} {
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
    set: () => Promise.resolve(true),
    unset: () => Promise.resolve(true),
  }
}

const tlSnapshot = {
  status: 'ready', value: {}, revision: 1, writable: true, base: {}, user: {}, mode: 'host',
}

function piAiSnapshot(api: string): unknown {
  return {
    status: 'ready',
    value: {},
    revision: 1,
    writable: true,
    base: {},
    // A thinking model (a reasoningEfforts table) — the 支持 think effort row
    // only renders for one, and it is exactly the row the gate must split.
    user: { providers: { route: { api, models: [{ id: 'claude-x', reasoningEfforts: { off: null, high: 'high' } }] } } },
    mode: 'host',
  }
}

/** The subset of the react-test-renderer instance surface this spec walks. */
interface InstanceFace {
  type: string
  props: Record<string, unknown>
  children: (InstanceFace | string)[]
  findAll(match: (node: InstanceFace) => boolean): InstanceFace[]
  findByType(type: string): InstanceFace
}

interface RendererFace {
  root: InstanceFace
  toJSON(): unknown
}

/** Render the settings card with one route speaking `api`. */
function renderCard(api: string): RendererFace {
  const element = createElement(ThinkingLevelsCard as never, {
    t: identity,
    scope: inertScope(tlSnapshot),
    piAiScope: inertScope(piAiSnapshot(api)),
  } as never)
  let renderer: RendererFace | undefined
  act(() => { renderer = create(element) as unknown as RendererFace })
  if (renderer === undefined) throw new Error('renderer not captured')
  return renderer
}

function clickByTitle(renderer: RendererFace, title: string): void {
  const button = renderer.root.findAll(node => node.type === 'button' && node.props['title'] === title)[0]
  expect(button, `button titled ${title}`).toBeDefined()
  act(() => { (button!.props['onClick'] as () => void)() })
}

/** The label whose span reads `text` — a capability control's own caption. */
function checkboxOf(renderer: RendererFace, text: string): InstanceFace {
  const label = renderer.root.findAll(node => node.type === 'label').find((candidate) => {
    return candidate.findAll(node => node.type === 'span')
      .some(span => span.children.join('') === text)
  })
  expect(label, `label titled ${text}`).toBeDefined()
  return label!.findByType('input')
}

/** Expand the provider drawer, then the model drawer the card renders closed. */
function openCapabilities(renderer: RendererFace): RendererFace {
  clickByTitle(renderer, 'card.capabilities.expandProvider')
  clickByTitle(renderer, 'card.capabilities.openModelSettings')
  return renderer
}

const json = (renderer: RendererFace): string => JSON.stringify(renderer.toJSON())

describe('capability card protocol gating (issue #6)', () => {
  it('keeps Thinking enabled on a non-completions route while the compat fields stay gated', () => {
    for (const api of ['openai-responses', 'anthropic-messages'] as const) {
      const renderer = openCapabilities(renderCard(api))
      // The gate itself says this route takes no completions compat…
      expect(completionsCompatConfigurable({
        providerId: 'route', index: 0, modelId: 'claude-x', model: {}, providerApi: api,
      })).toBe(false)
      // …yet thinking — the effort selector's prerequisite — stays clickable.
      expect(checkboxOf(renderer, 'card.capabilities.thinking').props['disabled']).toBe(false)
      expect(checkboxOf(renderer, 'card.capabilities.supportsEffort').props['disabled']).toBe(true)
      const select = renderer.root.findAll(
        node => node.type === 'select' && node.props['title'] === 'card.capabilities.apiUnsupported',
      )
      expect(select[0]?.props['disabled']).toBe(true)
    }
  })

  it('keeps both controls enabled on openai-completions', () => {
    const renderer = openCapabilities(renderCard('openai-completions'))
    expect(checkboxOf(renderer, 'card.capabilities.thinking').props['disabled']).toBe(false)
    expect(checkboxOf(renderer, 'card.capabilities.supportsEffort').props['disabled']).toBe(false)
  })

  it('explains the split instead of claiming thinking is unconfigurable', () => {
    const text = json(openCapabilities(renderCard('anthropic-messages')))
    expect(text).toContain('card.capabilities.thinkingNative')
    expect(text).toContain('card.capabilities.apiUnsupported')
  })
})
