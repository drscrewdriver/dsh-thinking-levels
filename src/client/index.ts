/**
 * dsh-thinking-levels — browser half.
 *
 * Registers the `thinking-levels` dictionaries, one `settings.plugin.item`
 * card keyed by the plugin's settings namespace, and the composer model-seat
 * panel (`conversation.input.model`) carrying the per-line context-window
 * editor and reasoning effort.
 *
 * The DSH 0.1.2 line declares the `settings.plugin.item` seat (keyed+id'd by
 * the plugin namespace), so this single registration covers the card. A
 * `settings.plugins.tab` registration would mint a dedicated top-level
 * Plugins tab duplicating the item card, so none is made.
 *
 * The model-seat panel occupies the seat the shipped `ModelSelect` renders
 * (`priority: -1` replaces trigger and popup outright) and supersedes the
 * retired composer context pill: every model line carries a context-window
 * chip and a reasoning effort dropdown, resolved over the harness's shared
 * `modelDirectories` service. The service is resolved through a deferred
 * cordis inject whose dependency set ALSO declares the resolver's own needs
 * (`sessions`, `remote`, `remote.session`): a cordis Service resolves
 * `this.ctx` through the ACCESSING context (traceable services rebind `ctx` to
 * the reader), and `directoryFor()` reads `this.ctx.sessions` — an inject that
 * declares only `modelDirectories` makes every call throw, and the thrown
 * render abdicates the seat entry back to the shipped selector. On harness
 * lines without the module the callback never fires and the shipped selector
 * stays untouched.
 *
 * All @deepseek-ai/* imports are type-only: collaboration happens through
 * cordis services (`settingsScope`) and slot registration only (client bundle
 * purity).
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// DSH 0.1.5 moved the `ctx.slots` Context augmentation here (it used to live in
// the retired `dsh-client-runtime` package): importing the client types restores
// the typed `ctx.slots` member on the cordis Context surface.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { ThinkingLevelsConfig } from '../index.ts'
import { NS, en, ja, ko, zh } from './locales.ts'
import { ThinkingLevelsCard, type ThinkingLevelsCardInjected } from './card.tsx'
import { ModelPanel, type ModelPanelInjected } from './model-panel.tsx'

/** The settings namespace the host half registers (kept in lockstep with src/index.ts). */
const THINKING_LEVELS_NS = 'thinking-levels'

/** Services required by the browser half. */
export const inject = ['slots', 'locale', 'settingsScope']

/**
 * Client plugin body: dictionaries, the settings card, and the model-seat
 * panel registration.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
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

  ctx.slots.inject('settings.plugin.item', function* () {
    yield ctx.slots.register({
      name: 'settings.plugin.item',
      // Both keys are supplied: CLI dsh declares this slot `keyed` (needs
      // `key`) while DSH Desktop's bundled version declares it `list` (needs
      // `id`) — the slots service validates only its kind's field, so the pair
      // keeps the card working in both environments.
      id: THINKING_LEVELS_NS,
      key: THINKING_LEVELS_NS,
      locale: NS,
      inject: (): ThinkingLevelsCardInjected => {
        const scope = ctx.settingsScope.bind<ThinkingLevelsConfig>({ namespace: THINKING_LEVELS_NS })
        // The llm-pi-ai namespace is bound read/write so the card can surface
        // and edit custom-provider model capabilities (vision / thinking /
        // effort levels / thinking format / the route-level official
        // compat.supportsDeveloperRole flag) without touching any official
        // package — llm-pi-ai's own schema validates every write.
        const piAiScope = ctx.settingsScope.bind<unknown>({ namespace: 'llm-pi-ai' })
        return { scope, piAiScope }
      },
    }, ThinkingLevelsCard)
  })

  // Composer model seat: resolve `modelDirectories` through a deferred cordis
  // inject (see the module comment for the dependency-set rationale). On
  // harness lines without the service the callback never fires, leaving the
  // shipped selector untouched.
  ;(ctx as unknown as {
    inject: (
      deps: string[],
      cb: (scope: {
        modelDirectories: ModelDirectoriesFace | undefined
        sessions: unknown
      }) => void,
    ) => void
  }).inject(['modelDirectories', 'sessions', 'remote', 'remote.session'], (scope) => {
    const directories: ModelDirectoriesFace | undefined = scope.modelDirectories
    if (directories === undefined) return
    ctx.slots.inject('conversation.input.model', function* () {
      yield ctx.slots.register({
        name: 'conversation.input.model',
        id: 'context-window-model-panel',
        priority: -1,
        locale: NS,
        inject: (sessionId: string): ModelPanelInjected => {
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
            piAiScope: ctx.settingsScope.bind<unknown>({ namespace: 'llm-pi-ai' }),
            deepseekScope: ctx.settingsScope.bind<unknown>({ namespace: 'llm-deepseek' }),
          }
        },
      }, ModelPanel)
    })
  })
}
