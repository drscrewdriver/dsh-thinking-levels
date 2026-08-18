/**
 * dsh-thinking-levels host plugin: injects a user-selected or auto-scheduled
 * `reasoning_effort` into every `agent/request` waterfall (levels: off / low /
 * high / max / auto), and records per-tool wall-clock durations for telemetry.
 *
 * Extension points used (verified in deepseek-ai/deepseek-harness):
 * - `agent/request` waterfall (packages/core/agent-loop/src/agent.ts
 *   buildRequest): each listener may return a modified GenerateOptions for
 *   the next listener — the sanctioned way to adjust request config.
 * - `session.events` (agent.session) carries the step's tool/call records.
 * - settings service namespace (like DSH-better-sidebar's PrefsSchema) for
 *   the user toggles.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { assertEffortId, decideEffort, type EffortId } from './thinking-level.ts'
import { recentToolCalls } from './session-events.ts'

/** Plugin settings. */
export interface ThinkingLevelsConfig {
  enabled: boolean
  /** User-selected level: off / low / high / max fix the wire level; `auto` schedules per step. */
  level: EffortId
  /** Scheduler preference: allow dropping below the `high` hub. */
  allowDowngrade: boolean
  /** Scheduler preference: allow lifting above the `high` hub to `max`. */
  allowUpgrade: boolean
}

/**
 * Composition-entry schema: what a dsh profile may configure at assembly
 * time (cordis.yml `config:` of the plugin row). The settings namespace
 * reuses the same schema, so a value admitted at one surface is admitted
 * at the other.
 */
export const Config: z<ThinkingLevelsConfig> = z.object({
  enabled: z.boolean().default(true),
  level: z.union(['off', 'low', 'high', 'max', 'auto']).default('auto'),
  allowDowngrade: z.boolean().default(true),
  allowUpgrade: z.boolean().default(false),
})

/** Settings defaults, kept in lockstep with the schema defaults above. */
export const DEFAULT_CONFIG: ThinkingLevelsConfig = {
  enabled: true,
  level: 'auto',
  allowDowngrade: true,
  allowUpgrade: false,
}

/** Runtime-adjustable settings namespace: level + scheduler toggles. */
export const THINKING_LEVELS_SETTINGS_NAMESPACE = settingsNamespace('thinking-levels')

const TOOL_AGE_LIMIT_MS = 10 * 60 * 1000

/**
 * Plugin body.
 * @param ctx - host context carrying the agent-event dispatch.
 * @param config - resolved plugin configuration.
 */
export function apply(ctx: Context, config: ThinkingLevelsConfig = DEFAULT_CONFIG): void {
  if (!config.enabled) return
  // Fail-loud: a stray config value (e.g. `medium` from an old profile) must
  // not ride through into the model request, where dsh throws
  // UNSUPPORTED_REASONING_EFFORT per request.
  assertEffortId(config.level, 'dsh-thinking-levels config.level')

  // Runtime-adjustable configuration source: the composition entry is the
  // base; the settings namespace layers on top and `current()` always reads
  // the active section (official dsh settings integration pattern).
  let current: () => ThinkingLevelsConfig = () => config
  installSettingsSection(ctx, THINKING_LEVELS_SETTINGS_NAMESPACE, Config, config, {
    setSource: (source) => {
      current = source
    },
    // The decision is read per request, so a committed change needs no
    // re-registration.
    onChange: () => {},
  })

  // Inject the level decision into every model request of a step.
  // The 'agent/request' event key is augmented onto cordis Events by the
  // dsh-agent runtime's generated scope types; the npm package does not
  // re-export that augmentation, so the emitter is widened at the boundary.
  const on = ctx.on as unknown as (
    event: string,
    handler: (payload: Record<string, unknown>, next: () => unknown) => unknown | Promise<unknown>,
  ) => void
  on('agent/request', async (payload, next) => {
    const seed = await next() as { reasoningEffort?: unknown }
    const cfg = current()
    // `enabled` may flip at runtime through the settings namespace.
    if (!cfg.enabled) return seed
    const calls = recentToolCalls(payload.agent)
    const level = decideEffort({
      recentCalls: calls,
      selected: cfg.level,
      allowDowngrade: cfg.allowDowngrade,
      allowUpgrade: cfg.allowUpgrade,
    })
    // Summary-only log: individual tool names/arg sizes are workflow metadata
    // that need not land in the host log; count and decision suffice.
    ctx.logger?.info?.('[thinking-levels] agent/request: selected=%s calls=%d => level=%s', cfg.level, calls.length, level)
    return { ...seed, reasoningEffort: level }
  })

  // Per-tool wall-clock telemetry: log tool/call -> tool/result durations.
  // Same boundary widening as above (agent/tool is a generated scope event).
  const started = new Map<string, number>()
  // A tool that never emits `end` (crash, interruption) must not leak its
  // entry forever; sweep stale ones lazily on every new `start`.
  const pruneStale = (now: number): void => {
    for (const [callId, at] of started) {
      if (now - at > TOOL_AGE_LIMIT_MS) started.delete(callId)
    }
  }
  on('agent/tool', async (payload) => {
    const callId = payload.callId
    if (typeof callId !== 'string') return
    if (payload.phase === 'start') {
      const now = Date.now()
      pruneStale(now)
      started.set(callId, now)
    } else if (payload.phase === 'end') {
      const from = started.get(callId)
      started.delete(callId)
      if (from !== undefined) {
        const ms = Date.now() - from
        ctx.logger?.info?.('[thinking-levels] tool %s took %dms', callId, ms)
      }
    }
  })
}
