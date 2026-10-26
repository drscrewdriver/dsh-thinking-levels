/**
 * Session tool-call sampling for dsh-thinking-levels.
 *
 * Two readers, one extraction:
 * - {@link toolSampleOf} normalizes a single raw Session event and is shared
 *   with the `tlAutoSchedule` projection (`auto-schedule-projection.ts`), so
 *   the `tool/call` wire shape lives in exactly one place.
 * - {@link recentToolCalls} is the LEGACY pull path. `session.events` only
 *   ever existed on hosts up to 0.1.0-rc.8 (verified: `get events()` present at
 *   `dsh-v0.1.0-rc.8`, zero hits from `dsh-v0.1.2-rc.1` on), so on every newer
 *   line it returns `[]` — which is exactly the issue #6 defect. It survives
 *   only as the 0.1.0-rc.8 fallback for hosts whose projection registry
 *   predates `stateOf`.
 */

import type { ToolCallSample } from './thinking-level.ts'

/** How many recent tool calls to sample for one decision. */
export const TOOL_SAMPLE_WINDOW = 8

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Guard: one session event shaped like a tool/call record. */
function isToolCallEvent(event: unknown): event is { data: Record<string, unknown> } {
  if (!isRecord(event) || event.type !== 'tool/call') return false
  return isRecord(event.data)
}

/** Approximate argument size in characters (payload heft); unknown shapes read as 0. */
export function argsSizeOf(argumentsValue: unknown): number {
  return typeof argumentsValue === 'string' ? argumentsValue.length : 0
}

/**
 * Normalize one raw Session event into a tool-call sample.
 *
 * @param event - any committed Session event.
 * @returns the sample, or undefined for any other event / malformed record.
 */
export function toolSampleOf(event: unknown): ToolCallSample | undefined {
  if (!isToolCallEvent(event)) return undefined
  const data = event.data
  const name = typeof data.name === 'string' && data.name.length > 0 ? data.name : 'tool'
  return { name, argsSize: argsSizeOf(data.arguments) }
}

/**
 * LEGACY: recent tool calls off `agent.session.events`, oldest first.
 *
 * Only 0.1.0-rc.8 carries that array property; every host from 0.1.2-rc.1 on
 * drops it in favour of `eventAt()/snapshotEvents()/ownEvents()`, so this
 * returns `[]` there. Callers must treat `[]` as "no samples available" and
 * prefer the projection read.
 *
 * @param agent - the `payload.agent` value from the `agent/request` waterfall.
 * @returns the sampled tool calls, or `[]` for a fresh prompt / unknown shape.
 */
export function recentToolCalls(agent: unknown): ToolCallSample[] {
  if (!isRecord(agent)) return []
  const session = agent.session
  if (!isRecord(session) || !Array.isArray(session.events)) return []

  const samples: ToolCallSample[] = []
  for (let index = session.events.length - 1; index >= 0 && samples.length < TOOL_SAMPLE_WINDOW; index -= 1) {
    const sample = toolSampleOf(session.events[index])
    if (sample !== undefined) samples.push(sample)
  }
  return samples.reverse()
}
