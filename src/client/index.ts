/**
 * dsh-thinking-levels — browser half.
 *
 * Registers the `thinking-levels` dictionaries and one composer model-seat
 * panel (`conversation.input.model`) carrying the per-line context-window
 * editor.
 *
 * The plugin's own settings (default level, enable toggle, scheduler bounds)
 * have NO standalone settings card since the DSH 0.1.7 line: the host renders
 * the Plugins settings form declaratively from the `.volatile()` fields of the
 * schema in src/index.ts, and the runtime values flow through the
 * `configForms` service keyed by the composition entry id. The former
 * per-plugin settings card was dropped with that migration (its seat no
 * longer exists in 0.1.7), including its llm-pi-ai model-capability editor.
 * DSH 0.2.0 restores a client face for them: the family settings section
 * below and the Plugins-page `plugins.bundle.config` card (same component,
 * same inject factory).
 *
 * All @deepseek-ai/* imports are type-only: collaboration happens through
 * cordis services (`configForms`) and slot registration only (client bundle
 * purity).
 */
import { createElement } from 'react'
import type { ComponentType, ReactNode } from 'react'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// DSH 0.1.5 moved the `ctx.slots` Context augmentation here (it used to live in
// the retired `dsh-client-runtime` package): importing the client types restores
// the typed `ctx.slots` member on the cordis Context surface.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { NS, de, en, es, fr, it, ja, ko, ru, zh } from './locales.ts'
import { ModelPanel, type ModelPanelInjected } from './model-panel.tsx'
import { ProjectionDataHook } from './context-ring.tsx'
import { FamilySettingsSection, type FamilySectionInjected, type FamilyTabEntry } from './family-tab.tsx'
import { ThinkingLevelsCard } from './card.tsx'
// Type-only: pulls the settings shell's SlotMap merges ('settings.section').
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'

/**
 * The plugin-family shared settings surface: ONE top-level `settings.section`
 * nav entry (「起子插件设置」) whose entry declares the `dsh-family.tab` child
 * slot; sibling plugins contribute their cards there (session-guard first) and
 * the section renders them as tabs — the built-in Plugins section's
 * tabs-around-pages pattern; every card drawer is expanded by default. Declaring is claiming (ui-slots): the child slot
 * exists exactly while this section entry does, and a contributor's
 * `ctx.slots.inject('dsh-family.tab', …)` idles harmlessly if this plugin is
 * absent (an undischarged inject never blocks the client half).
 */
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'dsh-family.tab': { kind: 'list'; scope: 'root' }
    /**
     * Plugins-page configuration card (official ui-plugin-manager contract):
     * keyed by the bundle's package name, rendered on the bundle's detail page
     * with `{ view: 'page' }` owner props. Declared here because community
     * plugins don't import the official package's client types — the same
     * merge pattern as dsh-tidy-display's settings-slots.ts.
     */
    'plugins.bundle.config': { kind: 'keyed'; scope: 'root'; owner: Record<string, unknown> }
  }
}

/** Services required by the browser half (the common floor across all host
 * generations). Generation-specific services resolve through separate deferred
 * injects below: a cordis inject naming an absent service would pend forever,
 * so `configForms` (0.1.7+), `settingsScope` (≤0.1.6) and `modelDirectories`
 * each get their own inject that simply never fires where the service is
 * missing — shape-detected availability, never version-guessed.
 */
export const inject = ['slots', 'locale']

/**
 * The openai-completions transport's settings namespace, resolved per render:
 * its composition entry id changed shape across packaging history
 * (`dsh-llm-openai-completions` in the 0.4.0 fragment; earlier manual installs
 * used the short form), so both candidates are probed and the one the host's
 * describe document actually carries wins. A handle for an absent namespace
 * reports `unavailable` forever, which the capability card treats as "transport
 * absent" — that degradation is only honest when BOTH candidates are absent.
 */
const OC_NAMESPACE_PREFERRED = 'dsh-llm-openai-completions'
const OC_NAMESPACE_LEGACY = 'llm-openai-completions'

interface ScopeStatusFace {
  getSnapshot?: () => { status?: 'loading' | 'ready' | 'unavailable' }
}

function ocTransportScopeOf(scopeOf: (ns: string) => unknown): unknown {
  const preferredScope = scopeOf(OC_NAMESPACE_PREFERRED) as ScopeStatusFace | undefined
  const status = typeof preferredScope?.getSnapshot === 'function'
    ? preferredScope.getSnapshot().status
    : undefined
  // `loading` means the mirror is still folding — the preferred face may still
  // turn ready, so keep it rather than degrading to the legacy name.
  if (status === 'unavailable') return scopeOf(OC_NAMESPACE_LEGACY)
  return preferredScope
}

const TL_NAMESPACE_MODERN = 'dsh-thinking-levels'
const TL_NAMESPACE_LEGACY = 'thinking-levels'

/**
 * The plugin's own settings scope, generation-probed like the transport above:
 * 0.1.7+ keys configForms by the composition entry id (`dsh-thinking-levels`),
 * while ≤0.1.6 hosts register the settings section under `thinking-levels` —
 * the same namespace the legacy card reads. A handle for an absent namespace
 * reports `unavailable` forever, which is the probe signal.
 */
function tlSettingsScopeOf(scopeOf: (ns: string) => unknown): unknown {
  const modern = scopeOf(TL_NAMESPACE_MODERN) as ScopeStatusFace | undefined
  const status = typeof modern?.getSnapshot === 'function'
    ? modern.getSnapshot().status
    : undefined
  if (status === 'unavailable') {
    logOwnScopeOnce(false, status)
    return scopeOf(TL_NAMESPACE_LEGACY)
  }
  logOwnScopeOnce(true, status)
  return modern
}

/** One-shot generation probe line (client mirror of the server's
 * installSection-style log): which own-settings namespace the family section
 * settled on, and why. Never repeats — render-time callers hit this often. */
let ownScopeLogged = false
function logOwnScopeOnce(modern: boolean, status: unknown): void {
  if (ownScopeLogged) return
  ownScopeLogged = true
  console.info(`[dsh-thinking-levels] own-scope ns = ${modern ? TL_NAMESPACE_MODERN : TL_NAMESPACE_LEGACY} (modern status=${String(status)})`)
}

/**
 * Raw ledger record: ui-slots keeps `component` and the per-entry `inject` on
 * the entry objects of `ctx.slots.entries(key)` on every host line (the
 * public SlotMap typing narrows to options only, so the direct-mount face
 * widens the shape locally).
 */
interface FamilyLedgerEntry {
  options: { id?: string; locale?: string }
  component?: ComponentType<Record<string, unknown>>
  inject?: () => unknown
}

/**
 * Client plugin body: dictionaries plus the composer quick-control slot.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  // `locale.bind` is a 0.1.7+ face; the only apply-scope use is the family
  // section's nav label (registered in the configForms path below), so the
  // fallback never renders anywhere.
  const locale = ctx.locale as { bind?: (ns: string) => (key: string) => string }
  const t = typeof locale.bind === 'function' ? locale.bind(NS) : (key: string) => key
  // The one scope factory, set by whichever generation's settings channel the
  // host provides (see the waist injects at the end of apply).
  let scopeOf: ((ns: string) => unknown) | undefined
  const scopeInject = (ctx as unknown as {
    inject: (deps: string[], cb: (scope: Record<string, unknown>) => void) => void
  }).inject

  // `register(ns, dicts)` is typed to the built-in locale ids (`zh` / `en`
  // only); the shipped `ja` / `ko` / `fr` / `de` / `it` / `ru` / `es`
  // dictionaries go through the single-locale overload, so they are installed
  // and ready once DSH publishes those ids.
  ctx.effect(() => {
    const disposers = [
      ctx.locale.register(NS, { zh, en }),
      ctx.locale.register(NS, 'ja', ja),
      ctx.locale.register(NS, 'ko', ko),
      ctx.locale.register(NS, 'fr', fr),
      ctx.locale.register(NS, 'de', de),
      ctx.locale.register(NS, 'it', it),
      ctx.locale.register(NS, 'ru', ru),
      ctx.locale.register(NS, 'es', es),
    ]
    return () => { for (const dispose of disposers) dispose() }
  }, 'dsh-thinking-levels: dictionaries')

  // Composer model seat: one registered entry named after the seat with
  // `priority: -1` replaces the shipped `ModelSelect` trigger and popup
  // outright (the official popup renders no slots, so occupying the seat is
  // the only way to contribute inside it — the dsh-reasoning-effort pattern).
  // The panel renders its own picker over the harness's shared
  // `modelDirectories` service (model switching keeps working) and puts a
  // context-window editor on every model line: custom gateways write the
  // `llm-pi-ai` entry config, official DeepSeek models write the
  // `llm-deepseek` entry (its `models[].contextWindow`, else the provider
  // default).
  // Resolve `modelDirectories` through a cordis inject, NOT a synchronous
  // property read: at apply time the ui-model-selection module's service may
  // not be started yet, and the property read returned undefined on 0.1.7
  // hosts — the whole panel was silently skipped and the shipped selector
  // stayed. The deferred inject waits for the service to start; on harness
  // lines without the module the callback never fires or sees undefined,
  // leaving the shipped selector untouched.
  //
  // The inject must ALSO declare the resolver's own dependency set
  // (`sessions`, `remote`, `remote.session` — ui-model-selection's
  // `ModelDirectoryResolver.static inject`): a cordis Service resolves
  // `this.ctx` through the ACCESSING context (the traceable proxy rebinds
  // `ctx` to the reader), and `directoryFor()` reads `this.ctx.sessions` —
  // with only `modelDirectories` declared that read came back undefined and
  // every `directoryFor` call threw, so the seat entry crashed on first
  // render and the slot boundary abdicated it back to the shipped selector.
  ;(ctx as unknown as {
    inject: (
      deps: string[],
      cb: (scope: {
        modelDirectories: ModelDirectoriesFace | undefined
        sessions: SessionsFace | undefined
      }) => void,
    ) => void
  }).inject(['modelDirectories', 'sessions', 'remote', 'remote.session'], (scope) => {
    const directories = scope.modelDirectories
    if (directories === undefined) return
    ctx.slots.inject('conversation.input.model', function* () {
      yield ctx.slots.register({
        name: 'conversation.input.model',
        id: 'context-window-model-panel',
        priority: -1,
        locale: NS,
        inject: (sessionId: string): ModelPanelInjected => {
          // Entry ids of the target plugins: each dsh llm plugin's composition
          // entry id matches its settings namespace (`llm-pi-ai` / `llm-deepseek`).
          // A `directoryFor` failure (odd session shape) must not throw out of
          // the render: a thrown inject abdicates the seat entry — the whole
          // takeover — so degrade to the unavailable face instead.
          let directory: ModelDirectoryFace | undefined
          try {
            directory = directories.directoryFor(sessionId)
          } catch {
            directory = undefined
          }
          return {
            directory,
            // Resolved through the generation waist; by the time a session
            // renders, both deferred injects have long settled.
            piAiScope: scopeOf?.('llm-pi-ai') as never,
            deepseekScope: scopeOf?.('llm-deepseek') as never,
          }
        },
      }, ModelPanel)
    })
  })

  // Family settings section (see the SlotMap note above): the contributor
  // ledger is projected exactly like the built-in Plugins section projects its
  // tab ledger (cache until ledger/locale revision bumps, so useSyncExternalStore
  // sees a stable snapshot).
/** Registrant labels arrive as a string or a locale thunk; unwrap either.
 * A throwing thunk (e.g. a contributor whose label touches a service its own
 * inject never declared) must not kill the whole tab-ledger projection — fall
 * back to the entry id. */
const resolveLabel = (label: unknown, fallback = ''): string => {
  try {
    if (typeof label === 'function') return (label as () => string)() || fallback
    if (typeof label === 'string') return label
  } catch { /* bad contributor label — degrade to the fallback */ }
  return fallback
}

  let tabsVersion = -1
  let tabsRevision = -1
  let tabs: readonly FamilyTabEntry[] = []

  // Direct-mount face for contributor tabs on hosts whose settings shell does
  // not deliver renderSlot (≤0.1.6): the raw ledger records carry the
  // contributor's component and inject face on every line, so the section can
  // mount the active tab itself. Every failure mode (entry gone mid-render, a
  // throwing inject, a host without the raw view) degrades to an empty panel —
  // never a thrown render.
  const renderContributor = (id: string): ReactNode => {
    try {
      const entry = (ctx.slots.entries('dsh-family.tab') as readonly FamilyLedgerEntry[])
        .find(candidate => candidate.options.id === id)
      if (entry === undefined || entry.component === undefined) return null
      const injected = typeof entry.inject === 'function'
        ? entry.inject() as Record<string, unknown> | undefined
        : undefined
      return createElement(entry.component, (injected ?? {}) as Record<string, unknown>)
    } catch {
      return null
    }
  }

  const sectionInjected = (): FamilySectionInjected => ({
    // The settings namespace IS the composition entry id — the include row id
    // the shipped cordis.patch.yml inserts (`dsh-thinking-levels`), NOT this
    // plugin's locale NS. The host keys configForms by that id; a handle for
    // any other string reports `unavailable` forever. Generation-probed: ≤0.1.6
    // hosts register the section as `thinking-levels` (see tlSettingsScopeOf).
    scope: tlSettingsScopeOf(scopeOf!) as never,
    piAiScope: scopeOf!('llm-pi-ai') as never,
    // The transport's entry id changed shape across its packaging history
    // (`dsh-llm-openai-completions` in the 0.4.0 fragment; earlier manual
    // installs used the short form): settle on whichever namespace the host's
    // describe document actually carries.
    ocScope: ocTransportScopeOf(scopeOf!) as never,
    // ≤0.1.6 stand-ins for owner props the settings shell there doesn't
    // deliver (see family-tab.tsx): the apply-time EAGER binder stands in for
    // the host's PropsLocale `t`, and the direct-mount face stands in for
    // renderSlot. Both are ignored on shells that provide the real props.
    tFallback: t,
    renderContributor,
    hooks: {
      tabs: {
        getSnapshot: () => {
          const version = ctx.slots.getVersion('dsh-family.tab')
          const revision = ctx.locale.getSnapshot().revision
          if (version !== tabsVersion || revision !== tabsRevision) {
            tabsVersion = version
            tabsRevision = revision
            tabs = ctx.slots.entries('dsh-family.tab')
              .map(entry => ({
                id: entry.options.id ?? '',
                order: entry.options.order ?? 0,
                label: resolveLabel(entry.options.label, entry.options.id ?? ''),
              }))
              .sort((a, b) => a.order - b.order)
          }
          return tabs
        },
        subscribe: (listener) => {
          const offLedger = ctx.slots.subscribe('dsh-family.tab', listener)
          const offLocale = ctx.locale.subscribe(listener)
          return () => {
            offLedger()
            offLocale()
          }
        },
      },
    },
  })

/** ≤0.1.6 surface: the per-plugin settings card (the 0.1.7 migration's casualty).
 * The legacy scope namespace is this plugin's OWN registered settings section
 * (`thinking-levels`) — a self-registered name on hosts without declarative
 * settings, not a composition entry id, so it deliberately differs from the
 * `dsh-thinking-levels` entry id the 0.1.7+ surfaces read. */
  function registerLegacyCard(): void {
    if (scopeOf === undefined) return
    ctx.slots.inject('settings.plugin.item', function* () {
      yield ctx.slots.register({
        name: 'settings.plugin.item',
        id: NS,
        key: NS,
        locale: NS,
        inject: () => ({
          scope: scopeOf!('thinking-levels') as never,
          piAiScope: scopeOf!('llm-pi-ai') as never,
        }),
      }, ThinkingLevelsCard)
    })
  }

  /** 0.1.7+/0.2.0 surfaces: family section, plugins-page card, context ring.
   * Generation-neutral in practice (route A, 2026-10): the `settings.section`
   * entry and its children declaration exist on every host line (the perm-gate
   * placeholder render proved the 0.1.5 shell consumes client-contributed
   * section bodies), so the settingsScope waist below calls this too — its
   * `plugins.bundle.config` inject idles harmlessly where the slot is never
   * declared (0.1.7 and older). */
  function registerModernSurface(): void {
    if (scopeOf === undefined) return
    ctx.slots.inject('settings.section', function* () {
      yield ctx.slots.register({
        name: 'settings.section',
        id: 'dsh-family',
        order: 40,
        label: () => t('family.title'),
        locale: NS,
        inject: sectionInjected,
        children: { 'dsh-family.tab': { kind: 'list', scope: 'root' } },
      }, FamilySettingsSection)
    })

    // Plugins-page configuration card (DSH 0.2.0): same component and same
    // inject factory as the family section above, so both surfaces stay one
    // source of truth. On 0.1.7 hosts the slot is never declared and this
    // inject idles harmlessly.
    ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
      name: 'plugins.bundle.config',
      key: 'dsh-thinking-levels',
      locale: NS,
      inject: sectionInjected,
    }, FamilySettingsSection))

    // Context-capacity check ring (conversation.input.right): restores the
    // CHECK the model-seat takeover removed. The projection seat arrives via
    // the slot's injected props; hosts without it render nothing (the ring is
    // a 0.2.0 feature — on the ≤0.1.6 lines the seat props lack the hook).
  }

  // Projection data hook (conversation.input.right): this seat's entries DO
  // receive the session projection hook (better-er/dsh-cache-billing proved
  // the injection there); the model seat does not. The zero-size hook mirrors
  // every push into the module store the ring reads.
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'projection-data-hook',
    order: 9,
  }, ProjectionDataHook))

  // Generation waist (registered last — the callbacks reach the definitions
  // above): whichever settings channel the host provides becomes the one scope
  // factory. Faces are structurally identical (getSnapshot / subscribe / set /
  // unset) — 0.1.7's ConfigForm handle mirrors the ≤0.1.6 settingsScope
  // field-for-field. A host missing a generation's service never fires that
  // callback, so exactly one path registers its surface.
  scopeInject.call(ctx, ['configForms'], (scope) => {
    const forms = scope.configForms as { get: <T>(entryId: string) => T } | undefined
    if (forms === undefined) return
    scopeOf = (<T,>(ns: string) => forms.get<T>(ns)) as typeof scopeOf
    registerModernSurface()
  })
  scopeInject.call(ctx, ['settingsScope'], (scope) => {
    const settingsScope = scope.settingsScope as
      | { bind: <T>(spec: { namespace: string }) => T }
      | undefined
    if (settingsScope === undefined) return
    scopeOf = (<T,>(ns: string) => settingsScope.bind<T>({ namespace: ns })) as typeof scopeOf
    registerLegacyCard()
    // Route A (family-tab ledger, 2026-10): the family section body used to be
    // configForms-only, leaving ≤0.1.6 hosts with session-guard's nav-level
    // takeover and an EMPTY section body. The section entry itself is
    // generation-neutral — the component self-degrades where the shell omits
    // the owner props (tFallback / hooks-compartment polling / direct-mount
    // contributor render).
    registerModernSurface()
  })
}
