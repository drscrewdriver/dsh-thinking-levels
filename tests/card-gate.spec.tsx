/**
 * Issue #7 render regression: the openai-completions-only compat fields are
 * MOVED OUT of the surface rather than rendered disabled.
 *
 * - The Thinking switch stays live on every protocol (it writes the
 *   protocol-neutral `reasoningEfforts`, the prerequisite of the effort
 *   selector).
 * - `supportsReasoningEffort` and `thinkingFormat` are only rendered once the
 *   model is DECLARED a thinking model AND its route speaks openai-completions;
 *   everywhere else they are absent from the DOM, not greyed out.
 * - A row still carrying those fields from an older version (or a hand-edited
 *   cordis.yml) surfaces an audit + one-click cleanup, because they make the
 *   host refuse the whole providers payload on the next save.
 */
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { act, create } from 'react-test-renderer'
import { ThinkingLevelsCard, staleThinkingCompatFields, stripThinkingCompat } from '../src/client/card.tsx'

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

/** One recorded scope write. */
interface Write {
  field: string
  value: unknown
}

/** An inert scope that records every `set(field, value)` the card issues. */
function recordingScope(snapshot: unknown, writes: Write[]): {
  getSnapshot: () => unknown
  subscribe: () => () => void
  set: (field: string, value: unknown) => Promise<boolean>
  unset: () => Promise<boolean>
} {
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
    set: (field: string, value: unknown) => {
      writes.push({ field, value })
      return Promise.resolve(true)
    },
    unset: () => Promise.resolve(true),
  }
}

const tlSnapshot = {
  status: 'ready', value: {}, revision: 1, writable: true, base: {}, user: {}, mode: 'host',
}

interface RowSpec {
  reasoningEfforts?: unknown
  compat?: Record<string, unknown>
}

function piAiSnapshot(api: string, row: RowSpec): unknown {
  return {
    status: 'ready',
    value: {},
    revision: 1,
    writable: true,
    base: {},
    user: {
      providers: {
        route: {
          api,
          models: [{
            id: 'claude-x',
            ...(row.reasoningEfforts === undefined ? {} : { reasoningEfforts: row.reasoningEfforts }),
            ...(row.compat === undefined ? {} : { compat: row.compat }),
          }],
        },
      },
    },
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

const THINKING_MODEL: RowSpec = { reasoningEfforts: { off: null, high: 'high' } }

function renderCard(api: string, row: RowSpec = THINKING_MODEL): RendererFace {
  const element = createElement(ThinkingLevelsCard as never, {
    t: identity,
    scope: inertScope(tlSnapshot),
    piAiScope: inertScope(piAiSnapshot(api, row)),
  } as never)
  let renderer: RendererFace | undefined
  act(() => { renderer = create(element) as unknown as RendererFace })
  if (renderer === undefined) throw new Error('renderer not captured')
  return renderer
}

/** Render with a WRITE-RECORDING llm-pi-ai scope (the issue-#8 bomb regression). */
function renderCardRecording(api: string, row: RowSpec = THINKING_MODEL): RendererFace & { writes: Write[] } {
  const writes: Write[] = []
  const element = createElement(ThinkingLevelsCard as never, {
    t: identity,
    scope: inertScope(tlSnapshot),
    piAiScope: recordingScope(piAiSnapshot(api, row), writes),
  } as never)
  let renderer: RendererFace | undefined
  act(() => { renderer = create(element) as unknown as RendererFace })
  if (renderer === undefined) throw new Error('renderer not captured')
  return Object.assign(renderer, { writes })
}

/** The label whose span reads exactly `text`. */
function labelWithText(renderer: RendererFace, text: string): InstanceFace {
  const label = renderer.root.findAll(node => node.type === 'label').find((candidate) =>
    candidate.findAll(node => node.type === 'span').some(span => span.children.join('') === text))
  expect(label, `label ${text}`).toBeDefined()
  return label!
}

/** The button whose caption is this locale key (plain text child or span-wrapped). */
function buttonWithText(renderer: RendererFace, text: string): InstanceFace {
  const button = renderer.root.findAll(node => node.type === 'button'
    && node.children.some(child => typeof child === 'string' && child === text))[0]
  expect(button, `button ${text}`).toBeDefined()
  return button!
}

function clickByTitle(renderer: RendererFace, title: string): void {
  const button = renderer.root.findAll(node => node.type === 'button' && node.props['title'] === title)[0]
  expect(button, `button titled ${title}`).toBeDefined()
  act(() => { (button!.props['onClick'] as () => void)() })
}

/** Expand the provider drawer, then the model drawer the card renders closed. */
function openCapabilities(renderer: RendererFace): RendererFace {
  clickByTitle(renderer, 'card.capabilities.expandProvider')
  clickByTitle(renderer, 'card.capabilities.openModelSettings')
  return renderer
}

/** Whether this locale key appears as visible text anywhere in the tree. */
function hasText(renderer: RendererFace, key: string): boolean {
  return JSON.stringify(renderer.toJSON()).includes(key)
}

const json = (renderer: RendererFace): string => JSON.stringify(renderer.toJSON())

describe('capability card protocol surface (issue #7)', () => {
  it('offers the compat controls only on openai-completions', () => {
    for (const api of ['openai-responses', 'anthropic-messages'] as const) {
      const renderer = openCapabilities(renderCard(api))
      // Thinking stays live — it is the prerequisite, and it is protocol-neutral.
      expect(hasText(renderer, 'card.capabilities.thinking')).toBe(true)
      // The two openai-completions-only controls are NOT in the DOM at all.
      expect(hasText(renderer, 'card.capabilities.supportsEffort')).toBe(false)
      expect(hasText(renderer, 'card.capabilities.thinkingFormat')).toBe(false)
    }
  })

  it('offers both compat controls on openai-completions', () => {
    const renderer = openCapabilities(renderCard('openai-completions'))
    expect(hasText(renderer, 'card.capabilities.supportsEffort')).toBe(true)
    expect(hasText(renderer, 'card.capabilities.thinkingFormat')).toBe(true)
  })

  // Issue #8: the per-level wire map is `reasoningEfforts` — the host turns it
  // into pi-ai's thinkingLevelMap, which EVERY protocol reads (Anthropic budget,
  // Responses effort, completions reasoning_effort string). So the gap that the
  // #7 work left behind — an unopenable level editor outside completions — is
  // closed: a thinking model opens the grid on any protocol.
  it('opens the level wire editor on non-completions protocols too', () => {
    for (const api of ['openai-responses', 'anthropic-messages'] as const) {
      const renderer = openCapabilities(renderCard(api))
      expect(hasText(renderer, 'card.capabilities.efforts')).toBe(true)
      expect(hasText(renderer, 'card.capabilities.applyLevel')).toBe(true)
      // …while the completions-only compat switches stay out of the DOM.
      expect(hasText(renderer, 'card.capabilities.supportsEffort')).toBe(false)
    }
  })

  it('keeps the editor closed for a non-thinking model on every protocol', () => {
    for (const api of ['openai-responses', 'anthropic-messages'] as const) {
      const renderer = openCapabilities(renderCard(api, { reasoningEfforts: false }))
      expect(hasText(renderer, 'card.capabilities.efforts')).toBe(false)
    }
  })

  it('hides the compat controls until the model is declared a thinking model', () => {
    const renderer = openCapabilities(renderCard('openai-completions', { reasoningEfforts: false }))
    expect(hasText(renderer, 'card.capabilities.supportsEffort')).toBe(false)
    expect(hasText(renderer, 'card.capabilities.thinkingFormat')).toBe(false)
  })

  it('surfaces leftovers from an older version', () => {
    const staleRow: RowSpec = {
      reasoningEfforts: { off: null, high: 'high' },
      compat: { thinkingFormat: 'qwen-chat-template', supportsReasoningEffort: true },
    }
    const renderer = openCapabilities(renderCard('anthropic-messages', staleRow))
    expect(hasText(renderer, 'card.capabilities.staleCompat')).toBe(true)
    expect(hasText(renderer, 'card.capabilities.stripStaleCompat')).toBe(true)
    // The audit line names the offending fields, not just "something is wrong".
    const text = json(renderer)
    expect(text).toContain('thinkingFormat')
    expect(text).toContain('supportsReasoningEffort')
    // …and the compat controls themselves are still absent on this protocol.
    expect(hasText(renderer, 'card.capabilities.supportsEffort')).toBe(false)
    expect(hasText(renderer, 'card.capabilities.thinkingFormat')).toBe(false)
  })

  it('strips the leftovers while sibling compat fields survive', () => {
    const row: Record<string, unknown> = {
      reasoningEfforts: { off: null, high: 'high' },
      compat: { thinkingFormat: 'qwen-chat-template', supportsReasoningEffort: true, supportsDeveloperRole: false },
    }
    const removed = stripThinkingCompat(
      { providerId: 'route', index: 0, modelId: 'claude-x', model: row, providerApi: 'anthropic-messages' },
      row,
    )
    expect(removed).toEqual(['thinkingFormat', 'supportsReasoningEffort'])
    expect(row['compat']).toEqual({ supportsDeveloperRole: false })
    expect(row['reasoningEfforts']).toEqual({ off: null, high: 'high' })
  })

  it('keeps the audit empty on a clean row and on openai-completions', () => {
    const base = { providerId: 'route', index: 0, modelId: 'claude-x' }
    expect(staleThinkingCompatFields({ ...base, model: {}, providerApi: 'anthropic-messages' })).toEqual([])
    expect(staleThinkingCompatFields({
      ...base,
      model: { compat: { thinkingFormat: 'qwen' } },
      providerApi: 'openai-completions',
    })).toEqual([])
  })

  it('drops a compat object that held nothing but the stale fields', () => {
    const row: Record<string, unknown> = { compat: { thinkingFormat: 'qwen' } }
    const removed = stripThinkingCompat(
      { providerId: 'r', index: 0, modelId: 'm', model: row, providerApi: 'openai-responses' },
      row,
    )
    expect(removed).toEqual(['thinkingFormat'])
    expect('compat' in row).toBe(false)
  })

  it('never touches a row without leftovers', () => {
    const row: Record<string, unknown> = { compat: { supportsDeveloperRole: false } }
    expect(stripThinkingCompat(
      { providerId: 'r', index: 0, modelId: 'm', model: row, providerApi: 'anthropic-messages' },
      row,
    )).toEqual([])
    expect(row['compat']).toEqual({ supportsDeveloperRole: false })
  })
})

/**
 * Issue #8: opening the level editor outside completions is only safe if the
 * APPLY path stops dragging the completions-only `supportsReasoningEffort` along.
 * That side effect used to fire whenever a non-toggle level was ticked, which on
 * a Responses/Anthropic route makes the host refuse the WHOLE providers payload
 * — one tick, whole save silently lost.
 */
describe('level editor apply (issue #8)', () => {
  /** Tick one level's grid checkbox through its own onChange handler. */
  function tickLevel(renderer: RendererFace, level: string): void {
    const input = labelWithText(renderer, level).findByType('input')
    act(() => {
      ;(input.props['onChange'] as (event: { currentTarget: { checked: boolean } }) => void)({
        currentTarget: { checked: true },
      })
    })
  }

  /** Click the grid's "apply this level" button. */
  function applyLevels(renderer: RendererFace): void {
    const button = buttonWithText(renderer, 'card.capabilities.applyLevel')
    ;(button.props['onClick'] as () => void)()
  }

  /** The providers payload of the last recorded write. */
  function lastProvidersWrite(writes: Write[]): Record<string, unknown> {
    const write = [...writes].reverse().find(candidate => candidate.field === 'providers')
    expect(write, 'a providers write').toBeDefined()
    return (write!.value as { route: { models: Record<string, unknown>[] } }).route.models[0]!
  }

  it('never writes the completions-only flag on a non-completions route', async () => {
    for (const api of ['openai-responses', 'anthropic-messages'] as const) {
      const renderer = renderCardRecording(api)
      openCapabilities(renderer)
      // Tick a reasoning_effort-only level (the exact trigger of the old
      // auto-`supportsReasoningEffort` write), then apply.
      tickLevel(renderer, 'medium')
      await act(async () => { applyLevels(renderer) })
      const row = lastProvidersWrite(renderer.writes)
      expect(row['reasoningEfforts']).toMatchObject({ medium: 'medium' })
      const compat = row['compat'] as Record<string, unknown> | undefined
      expect(compat?.['supportsReasoningEffort']).toBeUndefined()
      expect(compat?.['thinkingFormat']).toBeUndefined()
    }
  })

  it('still flags effort support on openai-completions (unchanged behaviour)', async () => {
    // On completions the grid is the EFFORT-CAPABLE surface: a toggle-style row
    // (no supportsReasoningEffort) deliberately keeps it closed, so the contrast
    // case declares effort support the way the checkbox would.
    const renderer = renderCardRecording('openai-completions', {
      reasoningEfforts: { off: null, high: 'high' },
      compat: { supportsReasoningEffort: true },
    })
    openCapabilities(renderer)
    tickLevel(renderer, 'medium')
    await act(async () => { applyLevels(renderer) })
    const row = lastProvidersWrite(renderer.writes)
    expect(row['reasoningEfforts']).toMatchObject({ medium: 'medium' })
    expect((row['compat'] as Record<string, unknown>)['supportsReasoningEffort']).toBe(true)
  })
})
