/**
 * Settings-seat contract pin for dsh-thinking-levels.
 *
 * This spec locks HOW the browser half reaches configuration. The DSH 0.1.7
 * line removed the `settings.plugin.item` card seat AND the `settingsScope`
 * service: the plugin's own settings render declaratively from the
 * `.volatile()` fields of the schema in src/index.ts (no client registration),
 * and cross-plugin values are read through the `configForms` service keyed by
 * composition entry id. When a future DSH line moves the surface again,
 * migrate src/client/index.ts AND this file together — the assertions below
 * fail on any drift:
 *
 *   - the retired `settings.plugin.item` seat is NOT registered (the host
 *     generates the plugin's settings form from the schema alone);
 *   - `settings.plugins.tab` / `settings.section` stay UNTOUCHED;
 *   - the composer MODEL seat (`conversation.input.model`) is occupied with
 *     the context-window model panel (the dsh-reasoning-effort pattern:
 *     priority -1 replaces the shipped `ModelSelect`), skipped gracefully
 *     when the harness lacks `modelDirectories`.
 */
import { describe, expect, it } from 'vitest'
import { apply, inject } from '../src/client/index.ts'

interface CapturedRegistration {
  readonly slot: string
  readonly options: Record<string, unknown>
  readonly component: unknown
}

/** Drive apply against a stub host and capture every slot registration.
 * @param withDirectories - whether the stub host provides `modelDirectories`;
 * without it the model-panel registration must be skipped (graceful path). */
function collectRegistrations(withDirectories = true): { declared: string[]; registrations: CapturedRegistration[]; forms: string[] } {
  const declared: string[] = []
  const registrations: CapturedRegistration[] = []
  const forms: string[] = []
  const ctx = {
    effect: (build: () => unknown) => { void build(); return () => {} },
    locale: { register: () => () => {}, bind: () => (key: string) => key },
    configForms: {
      get: <T,>(entryId: string) => {
        forms.push(entryId)
        return { entryId } as unknown as T
      },
    },
    modelDirectories: withDirectories
      ? {
          directoryFor: (sessionId: string) => ({
            store: { subscribe: () => () => {}, getSnapshot: () => ({}) },
            load: () => Promise.resolve(),
            select: () => Promise.resolve(),
            sessionId,
          }),
        }
      : undefined,
    // Cordis inject: the panel registration resolves `modelDirectories`
    // deferred (a synchronous property read races the service start). The
    // stub fires the callback immediately with the stub service face.
    inject: (deps: readonly string[], cb: (scope: { modelDirectories: unknown }) => void) => {
      const directories = ctx.modelDirectories
      cb({ modelDirectories: directories })
      return () => {}
    },
    slots: {
      inject: (slot: string, factory: () => (() => void) | Generator<() => void>) => {
        declared.push(slot)
        const result = factory()
        const steps: Iterable<() => void> = typeof (result as { [Symbol.iterator]?: unknown })?.[Symbol.iterator] === 'function'
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
  return { declared, registrations, forms }
}

describe('config-form contract (declarative settings, family shared tab)', () => {
  it('declares the services apply consumes (cordis waits; no lazy-get race)', () => {
    expect(inject).toEqual(['slots', 'locale', 'configForms', 'modelDirectories'])
  })

  it('registers the composer model panel and the family top-level section', () => {
    const { declared, registrations } = collectRegistrations()
    expect(declared).toEqual(['conversation.input.model', 'settings.section'])
    expect(registrations).toHaveLength(2)
    expect(registrations[0]!.slot).toBe('conversation.input.model')
    expect(registrations[1]!.slot).toBe('settings.section')
  })

  it('skips the model panel entirely when the harness lacks modelDirectories', () => {
    const { declared, registrations } = collectRegistrations(false)
    expect(declared).toEqual(['settings.section'])
    expect(registrations).toHaveLength(1)
    expect(registrations[0]!.slot).toBe('settings.section')
  })

  it('never mints the removed settings surfaces (the item card)', () => {
    const { declared } = collectRegistrations()
    expect(declared).not.toContain('settings.plugin.item')
  })

  it('declares the family child slot exactly once, on the section entry', () => {
    const { registrations } = collectRegistrations()
    const tab = registrations.find(r => r.slot === 'settings.section')
    expect(tab).toBeDefined()
    expect(tab!.options['id']).toBe('dsh-family')
    expect(tab!.options['children']).toEqual({ 'dsh-family.tab': { kind: 'list', scope: 'root' } })
  })

  it('pins the composer model-panel options (identity + inject factory + config-form entry ids)', () => {
    const { registrations, forms } = collectRegistrations()
    const { options } = registrations[0]!
    expect(options['id']).toBe('context-window-model-panel')
    expect(options['priority']).toBe(-1)
    expect(options['locale']).toBe('thinking-levels')
    expect(typeof options['inject']).toBe('function')
    // The injected face binds the session's model directory plus the two
    // cross-plugin config forms by entry id.
    const face = (options['inject'] as (sessionId: string) => Record<string, unknown>)('session-1')
    expect(forms).toEqual(['llm-pi-ai', 'llm-deepseek'])
    expect(Object.keys(face).sort()).toEqual(['deepseekScope', 'directory', 'piAiScope'])
    expect(face['directory']).toMatchObject({ sessionId: 'session-1' })
  })
})
