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

declare module '@deepseek-ai/cordis' {
  interface Context {
    configForms: import('@deepseek-ai/dsh-client-ui-settings/client').ConfigFormsFace
  }
}

/** Services required by the browser half. */
export const inject = ['slots', 'locale', 'configForms']

/**
 * Client plugin body: dictionaries plus the composer quick-control slot.
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
}
