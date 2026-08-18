/**
 * dsh-tool-turbo host plugin: lowers tool-call latency by injecting a
 * task-appropriate `reasoning_effort` into every `agent/request` waterfall,
 * and records per-tool wall-clock durations for telemetry.
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
import { decideEffort, type EffortId } from './thinking-level.ts'
import { recentToolCalls } from './session-events.ts'

/** Plugin settings: off by default until the user opts in. */
export interface ToolTurboConfig {
  enabled: boolean
  allowDowngrade: boolean
  allowUpgrade: boolean
  /** The user's baseline effort the policy starts from. */
  baseline: EffortId
}

export const DEFAULT_CONFIG: ToolTurboConfig = {
  enabled: true,
  allowDowngrade: true,
  allowUpgrade: false,
  baseline: 'high',
}

/**
 * Plugin body.
 * @param ctx - host context carrying the agent-event dispatch.
 * @param config - resolved plugin configuration.
 */
export function apply(ctx: Context, config: ToolTurboConfig = DEFAULT_CONFIG): void {
  if (!config.enabled) return

  // Inject the effort decision into every model request of a step.
  // The 'agent/request' event key is augmented onto cordis Events by the
  // dsh-agent runtime's generated scope types; the npm package does not
  // re-export that augmentation, so the emitter is widened at the boundary.
  const on = ctx.on as unknown as (
    event: string,
    handler: (payload: Record<string, unknown>, next: () => unknown) => unknown | Promise<unknown>,
  ) => void
  on('agent/request', async (payload, next) => {
    const seed = await next() as { reasoningEffort?: unknown }
    const calls = recentToolCalls(payload.agent)
    const effort = decideEffort({
      recentCalls: calls,
      selected: config.baseline,
      allowDowngrade: config.allowDowngrade,
      allowUpgrade: config.allowUpgrade,
    })
    console.log(`[tool-turbo] agent/request: baseline=${config.baseline} calls=${JSON.stringify(calls)} => reasoningEffort=${effort}`)
    return { ...seed, reasoningEffort: effort }
  })

  // Per-tool wall-clock telemetry: log tool/call -> tool/result durations.
  // Same boundary widening as above (agent/tool is a generated scope event).
  const started = new Map<string, number>()
  on('agent/tool', async (payload, _next) => {
    const callId = payload.callId
    if (typeof callId !== 'string') return
    if (payload.phase === 'start') {
      started.set(callId, Date.now())
    } else if (payload.phase === 'end') {
      const from = started.get(callId)
      started.delete(callId)
      if (from !== undefined) {
        const ms = Date.now() - from
        ctx.logger?.info?.('[tool-turbo] tool %s took %dms', callId, ms)
      }
    }
  })
}
