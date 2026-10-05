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
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { ContextRing } from './context-ring.tsx'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// DSH 0.1.5 moved the `ctx.slots` Context augmentation here (it used to live in
// the retired `dsh-client-runtime` package): importing the client types restores
// the typed `ctx.slots` member on the cordis Context surface.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { NS, de, en, es, fr, it, ja, ko, ru, zh } from './locales.ts'
import { ModelPanel, type ModelPanelInjected } from './model-panel.tsx'
import { FamilySettingsSection, type FamilySectionInjected, type FamilyTabEntry } from './family-tab.tsx'
import type { ThinkingLevelsConfig } from '../index.ts'
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

/** Services required by the browser half. */
export const inject = ['slots', 'locale', 'configForms', 'modelDirectories']

/**
 * Client plugin body: dictionaries plus the composer quick-control slot.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
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
            piAiScope: ctx.configForms.get<unknown>('llm-pi-ai'),
            deepseekScope: ctx.configForms.get<unknown>('llm-deepseek'),
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
  const sectionInjected = (): FamilySectionInjected => ({
    scope: ctx.configForms.get<ThinkingLevelsConfig>('dsh-thinking-levels'),
    piAiScope: ctx.configForms.get<unknown>('llm-pi-ai'),
    ocScope: ctx.configForms.get<unknown>('llm-openai-completions'),
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

  // Plugins-page configuration card (DSH 0.2.0): the Plugins page renders no
  // volatile config form on its own — the bundle's detail page mounts the
  // `plugins.bundle.config` keyed slot, dispatched by the package name, and
  // without a registration here the page shows no configuration card at all.
  // SAME component and SAME inject factory as the family section above, so
  // both surfaces stay one source of truth. On 0.1.7 hosts the slot is never
  // declared and this inject idles harmlessly (an undischarged inject never
  // blocks the client half — same story as the `dsh-family.tab` note above).
  ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
    name: 'plugins.bundle.config',
    key: 'dsh-thinking-levels',
    locale: NS,
    inject: sectionInjected,
  }, FamilySettingsSection))

  // Context-capacity check ring (conversation.input.right): the model-seat
  // takeover removed the shipped meter's trigger with the seat it lived on;
  // this restores the CHECK (pressure arc + used/window/breakdown popover)
  // next to where the shipped meter sat. The projection seats arrive via the
  // slot's injected props (`useProjection` — the same feed the shipped meter
  // consumes); a harness without them renders nothing (retired pill's
  // discipline). Layout language follows better-er/dsh-cache-billing.
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'context-check-ring',
    order: 5,
  }, ContextRing))
}
