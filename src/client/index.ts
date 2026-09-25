/**
 * dsh-thinking-levels — browser half.
 *
 * Registers the `thinking-levels` dictionaries and one composer tool-row
 * control (`conversation.input.right`) for the context-window quick editor.
 *
 * The plugin's own settings (default level, enable toggle, scheduler bounds)
 * have NO client registration since the DSH 0.1.7 line: the host renders the
 * Plugins settings form declaratively from the `.volatile()` fields of the
 * schema in src/index.ts, and the runtime values flow through the
 * `configForms` service keyed by the composition entry id. The former
 * per-plugin settings card was dropped with that migration (its seat no
 * longer exists in 0.1.7), including its llm-pi-ai model-capability editor —
 * the composer quick control below keeps serving the context-window edits.
 *
 * All @deepseek-ai/* imports are type-only: collaboration happens through
 * cordis services (`configForms`) and slot registration only (client bundle
 * purity).
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// DSH 0.1.5 moved the `ctx.slots` Context augmentation here (it used to live in
// the retired `dsh-client-runtime` package): importing the client types restores
// the typed `ctx.slots` member on the cordis Context surface.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { NS, en, ja, ko, zh } from './locales.ts'
import { ContextQuick, type ContextQuickInjected } from './context-quick.tsx'
import { FamilySettingsSection, type FamilySectionInjected, type FamilyTabEntry } from './family-tab.tsx'
import type { ThinkingLevelsCardInjected } from './card.tsx'
import type { ThinkingLevelsConfig } from '../index.ts'
// Type-only: pulls the settings shell's SlotMap merges ('settings.section').
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'

/**
 * The plugin-family shared settings surface: ONE top-level `settings.section`
 * nav entry (「起子插件设置」) whose entry declares the `dsh-family.tab` child
 * slot; sibling plugins contribute their cards there (session-guard first) and
 * the section renders them as tabs — the built-in Plugins section's
 * tabs-around-pages pattern. Declaring is claiming (ui-slots): the child slot
 * exists exactly while this section entry does, and a contributor's
 * `ctx.slots.inject('dsh-family.tab', …)` idles harmlessly if this plugin is
 * absent (an undischarged inject never blocks the client half).
 */
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'dsh-family.tab': { kind: 'list'; scope: 'root' }
  }
}

/** Services required by the browser half. */
export const inject = ['slots', 'locale', 'configForms']

/**
 * Client plugin body: dictionaries plus the composer quick-control slot.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  // `register(ns, dicts)` is typed to the built-in locale ids (`zh` / `en`
  // only); the shipped `ja` / `ko` dictionaries go through the single-locale
  // overload, so they are installed and ready once DSH publishes those ids.
  ctx.effect(() => {
    const disposers = [
      ctx.locale.register(NS, { zh, en }),
      ctx.locale.register(NS, 'ja', ja),
      ctx.locale.register(NS, 'ko', ko),
    ]
    return () => { for (const dispose of disposers) dispose() }
  }, 'dsh-thinking-levels: dictionaries')

  // Composer tool row: one compact context-window control next to the
  // model/effort select (`conversation.input.right`, a session-scoped list seat
  // any plugin may occupy). It edits the current session model's `contextWindow`
  // live: custom gateways write the `llm-pi-ai` entry config (same config form
  // the card used), official DeepSeek models write the `llm-deepseek` entry
  // (its `models[].contextWindow`, else the provider default). The model card
  // itself is not an option: the shipped `ModelSelect` renders no slots, so a
  // plugin cannot contribute inside that popup.
  ctx.slots.inject('conversation.input.right', function* () {
    yield ctx.slots.register({
      name: 'conversation.input.right',
      id: 'context-window-quick',
      locale: NS,
      inject: (): ContextQuickInjected => {
        // Entry ids of the target plugins: each dsh llm plugin's composition
        // entry id matches its settings namespace (`llm-pi-ai` / `llm-deepseek`).
        const piAiScope = ctx.configForms.get<unknown>('llm-pi-ai')
        const deepseekScope = ctx.configForms.get<unknown>('llm-deepseek')
        return { piAiScope, deepseekScope }
      },
    }, ContextQuick)
  })

  // Family settings section (see the SlotMap note above): the contributor
  // ledger is projected exactly like the built-in Plugins section projects its
  // tab ledger (cache until ledger/locale revision bumps, so useSyncExternalStore
  // sees a stable snapshot).
/** Registrant labels arrive as a string or a locale thunk; unwrap either. */
const resolveLabel = (label: unknown): string =>
  typeof label === 'function' ? (label as () => string)() : typeof label === 'string' ? label : ''

  let tabsVersion = -1
  let tabsRevision = -1
  let tabs: readonly FamilyTabEntry[] = []
  const sectionInjected = (): FamilySectionInjected => ({
    scope: ctx.configForms.get<ThinkingLevelsConfig>('dsh-thinking-levels'),
    piAiScope: ctx.configForms.get<unknown>('llm-pi-ai'),
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
                label: resolveLabel(entry.options.label),
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
}
