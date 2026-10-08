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
 * without it the model-panel registration must be skipped (graceful path).
 * @param generation - which durable-settings channel the stub host carries:
 * `configForms` (0.1.7+) or `settingsScope` (≤0.1.6). The two are mutually
 * exclusive on real hosts, and exactly one waist path may fire. */
function collectRegistrations(
  withDirectories = true,
  generation: 'configForms' | 'settingsScope' = 'configForms',
  nsStatus: Record<string, string> = {},
  opts: { throwOnChildren?: boolean } = {},
): { declared: string[]; registrations: CapturedRegistration[]; forms: string[]; ledger: Array<Record<string, unknown>> } {
  const declared: string[] = []
  const registrations: CapturedRegistration[] = []
  const forms: string[] = []
  const ledger: Array<Record<string, unknown>> = []
  const bindSettingsScope = <T,>(spec: { namespace: string }): T => {
    const ns = spec.namespace
    return { namespace: ns, getSnapshot: () => ({ status: nsStatus[ns] ?? 'ready' }) } as unknown as T
  }
  const ctx = {
    effect: (build: () => unknown) => { void build(); return () => {} },
    locale: { register: () => () => {}, bind: () => (key: string) => key },
    configForms: generation === 'configForms'
      ? {
          get: <T,>(entryId: string) => {
            forms.push(entryId)
            return { entryId } as unknown as T
          },
        }
      : undefined,
    settingsScope: generation === 'settingsScope'
      ? { bind: bindSettingsScope }
      : undefined,
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
    // Cordis inject: deferred registrations resolve through this stub, which
    // serves whatever the (0.1.7+ generation) host has — modelDirectories and
    // configForms present, settingsScope deliberately absent (that waist path
    // must not register the legacy card here).
    inject: (deps: readonly string[], cb: (scope: Record<string, unknown>) => void) => {
      const scope: Record<string, unknown> = {}
      for (const dep of deps) {
        if (dep === 'modelDirectories') scope[dep] = ctx.modelDirectories
        else if (dep === 'configForms' && ctx.configForms) scope[dep] = { get: ctx.configForms.get }
        else if (dep === 'settingsScope' && ctx.settingsScope) scope[dep] = ctx.settingsScope
        else if (dep === 'sessions') scope[dep] = {}
        else if (dep === 'remote' || dep === 'remote.session') scope[dep] = {}
      }
      cb(scope)
      return () => {}
    },
    slots: {
      entries: (slot: string) => (slot === 'dsh-family.tab' ? ledger : []),
      getVersion: () => 0,
      subscribe: () => () => {},
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
        if (opts.throwOnChildren && options['children'] !== undefined) {
          throw new Error('slot "dsh-family.tab" is already declared (by an entry in "settings.section")')
        }
        registrations.push({ slot: String(options['name']), options, component })
        return () => {}
      },
    },
  }
  apply(ctx as never)
  return { declared, registrations, forms, ledger }
}

describe('config-form contract (declarative settings, family shared tab)', () => {
  it('declares the services apply consumes (cordis waits; no lazy-get race)', () => {
    expect(inject).toEqual(['slots', 'locale'])
  })

  it('registers the composer model panel, the family top-level section and the plugins-page config card', () => {
    const { declared, registrations } = collectRegistrations()
    expect(declared).toEqual(['conversation.input.model', 'conversation.input.right', 'settings.section', 'plugins.bundle.config'])
    expect(registrations).toHaveLength(4)
    expect(registrations[0]!.slot).toBe('conversation.input.model')
    expect(registrations[1]!.slot).toBe('conversation.input.right')
    expect(registrations[1]!.options).toMatchObject({ id: 'projection-data-hook' })
    expect(registrations[2]!.slot).toBe('settings.section')
    expect(registrations[3]!.slot).toBe('plugins.bundle.config')
  })

  it('skips the model panel entirely when the harness lacks modelDirectories', () => {
    const { declared, registrations } = collectRegistrations(false)
    expect(declared).toEqual(['conversation.input.right', 'settings.section', 'plugins.bundle.config'])
    // The model panel is skipped, but the modern surface (family section,
    // plugins-page card, and the context-check ring riding its seat) still
    // registers — none of them depend on modelDirectories.
    expect(registrations).toHaveLength(3)
    expect(registrations[0]!.slot).toBe('conversation.input.right')
    expect(registrations[0]!.options).toMatchObject({ id: 'projection-data-hook' })
    expect(registrations[1]!.slot).toBe('settings.section')
    expect(registrations[2]!.slot).toBe('plugins.bundle.config')
    // The projection hook rides the right seat on every generation; only the
    // ring (0.2.0 projection consumers) gates on the data being present.
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

describe('settingsScope generation (route A: family section on ≤0.1.6 hosts)', () => {
  it('registers ONLY the family section on ≤0.1.6 hosts (item card retired 2026-10-08)', () => {
    const { declared, registrations } = collectRegistrations(true, 'settingsScope')
    // The legacy plugins-page item card duplicated the family-tab card — the
    // family insection tab is the single settings surface on every generation.
    expect(declared).not.toContain('settings.plugin.item')
    expect(registrations.find(r => r.slot === 'settings.plugin.item')).toBeUndefined()
    expect(declared).toContain('settings.section')
    const section = registrations.find(r => r.slot === 'settings.section')
    expect(section?.options).toMatchObject({ id: 'dsh-family' })
  })

  it('leaves the item card unregistered on the configForms generation', () => {
    const { declared } = collectRegistrations(true, 'configForms')
    expect(declared).not.toContain('settings.plugin.item')
  })

  it('the section inject face carries the ≤0.1.6 degradation faces on BOTH generations', () => {
    for (const generation of ['configForms', 'settingsScope'] as const) {
      const { registrations } = collectRegistrations(true, generation)
      const section = registrations.find(r => r.slot === 'settings.section')!
      const face = (section.options['inject'] as () => Record<string, unknown>)()
      expect(typeof face['tFallback']).toBe('function')
      expect(typeof face['renderContributor']).toBe('function')
      // The stub handles carry their namespace under different keys per
      // generation (`configForms.get` → entryId, `settingsScope.bind` →
      // namespace); what matters is that BOTH resolve the modern entry id.
      if (generation === 'settingsScope') {
        expect(face['scope']).toMatchObject({ namespace: 'dsh-thinking-levels' })
      } else {
        expect(face['scope']).toMatchObject({ entryId: 'dsh-thinking-levels' })
      }
    }
  })

  it('probes the own-settings namespace down to the legacy name when the modern id is unavailable', () => {
    const { registrations } = collectRegistrations(true, 'settingsScope', { 'dsh-thinking-levels': 'unavailable' })
    const section = registrations.find(r => r.slot === 'settings.section')!
    const face = (section.options['inject'] as () => Record<string, unknown>)()
    expect(face['scope']).toMatchObject({ namespace: 'thinking-levels' })
  })

  it('renderContributor mounts the matching ledger entry from the raw records', () => {
    const captured = collectRegistrations(true, 'settingsScope')
    const StubContributor = (): null => null
    captured.ledger.push({
      options: { id: 'input-traffic', locale: 'input-traffic' },
      component: StubContributor,
      inject: () => ({ scope: { marker: 'it-scope' } }),
    })
    const section = captured.registrations.find(r => r.slot === 'settings.section')!
    const face = (section.options['inject'] as () => Record<string, unknown>)()
    const el = (face['renderContributor'] as (id: string) => { type: unknown; props: Record<string, unknown> } | null)('input-traffic')
    expect(el).not.toBeNull()
    expect(el!.type).toBe(StubContributor)
    expect(el!.props).toEqual({ scope: { marker: 'it-scope' } })
  })

  it('renderContributor degrades to null for unknown ids and throwing injects', () => {
    const captured = collectRegistrations(true, 'settingsScope')
    const ThrowingContributor = (): null => null
    captured.ledger.push({
      options: { id: 'boom' },
      component: ThrowingContributor,
      inject: () => { throw new Error('boom') },
    })
    const section = captured.registrations.find(r => r.slot === 'settings.section')!
    const face = (section.options['inject'] as () => Record<string, unknown>)()
    const render = face['renderContributor'] as (id: string) => unknown
    expect(render('nope')).toBeNull()
    expect(render('boom')).toBeNull()
  })
})

describe('family section children-declaration conflict (takeover shadow race)', () => {
  it('lands the p0 head without children when the takeover shadow claimed the declaration first', () => {
    const { registrations } = collectRegistrations(true, 'settingsScope', {}, { throwOnChildren: true })
    const section = registrations.find(r => r.slot === 'settings.section')
    expect(section).toBeDefined()
    expect(section!.options['id']).toBe('dsh-family')
    expect(section!.options['children']).toBeUndefined()
  })

  it('keeps the children declaration when nothing conflicts', () => {
    const { registrations } = collectRegistrations(true, 'settingsScope')
    const section = registrations.find(r => r.slot === 'settings.section')
    expect(section!.options['children']).toEqual({ 'dsh-family.tab': { kind: 'list', scope: 'root' } })
  })
})
