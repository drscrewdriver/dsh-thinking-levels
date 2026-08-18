/**
 * Session tool-call sampling for dsh-thinking-levels.
 *
 * Pulled out of the plugin body so the extraction logic — the part most
 * exposed to dsh event-shape drift — is unit-testable in isolation, with
 * explicit guards instead of naked type assertions. If a future dsh version
 * reshapes `session.events`, the failure shows up in the tests, not as a
 * silently wrong effort decision.
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
function argsSizeOf(argumentsValue: unknown): number {
  return typeof argumentsValue === 'string' ? argumentsValue.length : 0
}

/**
 * Recent tool calls of a session's current step, oldest first.
 * Non-tool events and malformed records are skipped; at most
 * {@link TOOL_SAMPLE_WINDOW} samples are returned.
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
    const event = session.events[index]
    if (!isToolCallEvent(event)) continue
    const data = event.data
    const name = typeof data.name === 'string' && data.name.length > 0 ? data.name : 'tool'
    samples.push({ name, argsSize: argsSizeOf(data.arguments) })
  }
  return samples.reverse()
}
