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
 *   - exactly ONE slot remains: the composer quick control, whose injected
 *     face pulls the `llm-pi-ai` / `llm-deepseek` config forms by entry id.
 */
import { describe, expect, it } from 'vitest'
import { apply, inject } from '../src/client/index.ts'

interface CapturedRegistration {
  readonly slot: string
  readonly options: Record<string, unknown>
  readonly component: unknown
}

/** Drive apply against a stub host and capture every slot registration. */
function collectRegistrations(): { declared: string[]; registrations: CapturedRegistration[]; forms: string[] } {
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

describe('config-form contract (declarative settings, no client settings seat)', () => {
  it('declares the services apply consumes (cordis waits; no lazy-get race)', () => {
    expect(inject).toEqual(['slots', 'locale', 'configForms'])
  })

  it('registers exactly one seat: the composer quick control (the settings card is host-generated)', () => {
    const { declared, registrations } = collectRegistrations()
    expect(declared).toEqual(['conversation.input.right'])
    expect(registrations).toHaveLength(1)
    expect(registrations[0]!.slot).toBe('conversation.input.right')
  })

  it('never mints a settings surface: the item card, a Plugins tab or a standalone section', () => {
    const { declared } = collectRegistrations()
    expect(declared).not.toContain('settings.plugin.item')
    expect(declared).not.toContain('settings.plugins.tab')
    expect(declared).not.toContain('settings.section')
  })

  it('pins the composer quick-control options (identity + inject factory + config-form entry ids)', () => {
    const { registrations, forms } = collectRegistrations()
    const { options } = registrations[0]!
    expect(options['id']).toBe('context-window-quick')
    expect(options['locale']).toBe('thinking-levels')
    expect(typeof options['inject']).toBe('function')
    // The injected face pulls the two cross-plugin config forms by entry id.
    ;(options['inject'] as () => Record<string, unknown>)()
    expect(forms).toEqual(['llm-pi-ai', 'llm-deepseek'])
  })
})
