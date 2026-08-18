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

const TOOL_AGE_LIMIT_MS = 10 * 60 * 1000

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
    // Summary-only log: individual tool names/arg sizes are workflow metadata
    // that need not land in the host log; count and decision suffice.
    ctx.logger?.info?.('[thinking-levels] agent/request: selected=%s calls=%d => level=%s', config.baseline, calls.length, effort)
    return { ...seed, reasoningEffort: effort }
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
  on('agent/tool', async (payload, _next) => {
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
