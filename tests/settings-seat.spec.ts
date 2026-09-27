/**
 * Settings-seat contract pin for dsh-thinking-levels.
 *
 * This spec locks WHERE the browser half mounts its settings card and the
 * model-seat panel. The settings seat has already migrated twice
 * (settings.plugin.item is the 0.1.2–0.1.6 card seat; a settings.plugins.tab
 * registration on the 0.1.5 line minted a duplicate top-level Plugins tab and
 * was removed in 2.0.0-beta.4). When a future DSH line moves the seat again,
 * migrate src/client/index.ts AND this file together — the assertions below
 * fail on any drift:
 *
 *   - exactly ONE settings seat is registered (no duplicate surfaces);
 *   - the seat is `settings.plugin.item`, keyed+id'd by the namespace, so the
 *     card renders inside the host's built-in configurable Plugins tab;
 *   - `settings.plugins.tab` / `settings.section` stay UNTOUCHED;
 *   - the composer model seat (`conversation.input.model`) is only taken over
 *     through the deferred `modelDirectories` inject, at `priority: -1`, with
 *     the panel component — and the deferred inject declares the resolver's
 *     full dependency set (sessions/remote/remote.session): cordis traceable
 *     services rebind `service.ctx` to the reader and `directoryFor()` reads
 *     `this.ctx.sessions`, so a modelDirectories-only inject crashes every
 *     render and abdicates the takeover.
 */
import { describe, expect, it } from 'vitest'
import { apply, inject } from '../src/client/index.ts'
import { ThinkingLevelsCard } from '../src/client/card.tsx'
import { ModelPanel } from '../src/client/model-panel.tsx'

interface CapturedRegistration {
  readonly slot: string
  readonly options: Record<string, unknown>
  readonly component: unknown
}

/** The dependency list captured from the deferred modelDirectories inject. */
let deferredInjectDeps: string[] | undefined

/** Drive apply against a stub host and capture every slot registration. */
function collectRegistrations(options: { modelDirectories?: object } = {}): {
  declared: string[]
  registrations: CapturedRegistration[]
} {
  const declared: string[] = []
  const registrations: CapturedRegistration[] = []
  const ctx = {
    effect: (build: () => unknown) => { void build(); return () => {} },
    inject: (deps: string[], cb: (scope: Record<string, unknown>) => void) => {
      deferredInjectDeps = [...deps]
      if (options.modelDirectories !== undefined) cb({ modelDirectories: options.modelDirectories })
      return () => {}
    },
    locale: { register: () => () => {}, bind: () => (key: string) => key },
    settingsScope: { bind: <T,>(_spec: { namespace: string }) => ({ ns: Symbol('scope') }) as unknown as T },
    slots: {
      inject: (slot: string, factory: () => (() => void) | Generator<() => void>) => {
        declared.push(slot)
        const result = factory()
        const steps: Iterable<() => void> = typeof (result as { [Symbol.iterator]?: () => Iterator<() => void> })?.[Symbol.iterator] === 'function'
          ? (result as Generator<() => void>)
          : [result as () => void]
        for (const step of steps) { void step }
        return () => {}
      },
      register: (options: Record<string, unknown>, component: unknown) => {
        registrations.push({ slot: String(options['name']), options, component })
        return () => {}
      },
    },
  }
  apply(ctx as never)
  return { declared, registrations }
}

describe('settings-seat contract (single settings.plugin.item card)', () => {
  it('declares the services apply consumes (cordis waits; no lazy-get race)', () => {
    expect(inject).toEqual(['slots', 'locale', 'settingsScope'])
  })

  it('injects exactly one settings seat: the settings.plugin.item card', () => {
    const { declared, registrations } = collectRegistrations()
    expect(declared).toEqual(['settings.plugin.item'])
    expect(registrations.filter(r => r.slot === 'settings.plugin.item')).toHaveLength(1)
  })

  it('pins the item-card options (namespace identity + inject factory + card component)', () => {
    const { registrations } = collectRegistrations()
    const { options, component } = registrations[0]!
    expect(options['id']).toBe('thinking-levels')
    expect(options['key']).toBe('thinking-levels') // CLI keyed seat; id covers Desktop list
    expect(options['locale']).toBe('thinking-levels')
    expect(typeof options['inject']).toBe('function')
    // The injected face binds the plugin namespace plus the llm-pi-ai namespace.
    const face = (options['inject'] as () => Record<string, unknown>)()
    expect(Object.keys(face).sort()).toEqual(['piAiScope', 'scope'])
    expect(component).toBe(ThinkingLevelsCard)
  })

  it('never mints a dedicated Plugins tab or a standalone settings section', () => {
    const { declared } = collectRegistrations()
    expect(declared).not.toContain('settings.plugins.tab')
    expect(declared).not.toContain('settings.section')
  })

  it('takes over the model seat only through the deferred modelDirectories inject', () => {
    // Without the service the takeover must stay silent (shipped selector untouched).
    const absent = collectRegistrations()
    expect(absent.declared).not.toContain('conversation.input.model')

    // With the service, the seat entry shadows the shipped selector at priority -1.
    const { declared, registrations } = collectRegistrations({
      modelDirectories: { directoryFor: () => ({}) },
    })
    expect(deferredInjectDeps).toEqual(['modelDirectories', 'sessions', 'remote', 'remote.session'])
    expect(declared).toContain('conversation.input.model')
    const seat = registrations.find(r => r.slot === 'conversation.input.model')!
    expect(seat.options['id']).toBe('context-window-model-panel')
    expect(seat.options['priority']).toBe(-1)
    expect(seat.component).toBe(ModelPanel)
    const face = (seat.options['inject'] as (sessionId: string) => Record<string, unknown>)('session-1')
    expect(Object.keys(face).sort()).toEqual(['deepseekScope', 'directory', 'piAiScope'])
    expect(face['directory']).toBeDefined()
  })

  it('keeps the model seat when directoryFor refuses the session (no takeover loss)', () => {
    const { registrations } = collectRegistrations({
      modelDirectories: { directoryFor: () => { throw new Error('no scope') } },
    })
    const seat = registrations.find(r => r.slot === 'conversation.input.model')!
    const face = (seat.options['inject'] as (sessionId: string) => Record<string, unknown>)('session-1')
    expect(face['directory']).toBeUndefined()
  })
})
