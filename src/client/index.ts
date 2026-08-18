/**
 * dsh-thinking-levels — browser half.
 *
 * Registers the `thinking-levels` dictionaries and one `settings.plugin.item`
 * card keyed by the plugin's settings namespace, so the shared Plugins
 * settings tab renders an editable card: the level picker (off / low / high /
 * max / auto) plus the scheduler toggles.
 *
 * All @deepseek-ai/* imports are type-only: collaboration happens through
 * cordis services (`settingsScope`) and slot registration only (client bundle
 * purity).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ThinkingLevelsConfig } from '../index.ts'
import { NS, en, zh } from './locales.ts'
import { ThinkingLevelsCard, type ThinkingLevelsCardInjected } from './card.tsx'

/** The settings namespace the host half registers (kept in lockstep with src/index.ts). */
const THINKING_LEVELS_NS = 'thinking-levels'

/** Services required by the browser half. */
export const inject = ['slots', 'locale', 'settingsScope']

/**
 * Client plugin body: dictionaries plus the settings card registration.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-thinking-levels: dictionaries')

  ctx.slots.inject('settings.plugin.item', function* () {
    yield ctx.slots.register({
      name: 'settings.plugin.item',
      key: THINKING_LEVELS_NS,
      locale: NS,
      inject: (): ThinkingLevelsCardInjected => {
        const scope = ctx.settingsScope.bind<ThinkingLevelsConfig>({ namespace: THINKING_LEVELS_NS })
        return { scope }
      },
    }, ThinkingLevelsCard)
  })
}
