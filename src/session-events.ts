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

import type { FailureSignal, ToolCallSample } from './thinking-level.ts'

export type { FailureSignal }

/** How many recent tool calls to sample for one decision. */
export const TOOL_SAMPLE_WINDOW = 8

/**
 * Deterministic failure evidence folded from raw session events (N4 / 4.11.0).
 * A tool that fails repeatedly on the same arguments, or a turn that ended in
 * error, is the scheduler's signal that the cheap plan is not working — the
 * auto tier must not fall below `high` on such evidence. The shape lives in
 * {@link FailureSignal} (re-exported above from the dependency-free leaf).
 */
/** Tool calls / turns considered when folding the failure signal. */
export const FAILURE_LOOKBACK = 8

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

/**
 * Whether one `tool/call` event records a failure, across the shapes hosts use
 * (`isError`, a truthy `error`, `status:'error'`, or a result carrying `error`).
 */
function toolFailed(event: { data: Record<string, unknown> }): boolean {
  const d = event.data
  if (d.isError === true) return true
  if (d.error !== undefined && d.error !== null && d.error !== false) return true
  if (d.status === 'error') return true
  const result = d.result
  if (isRecord(result) && result.error !== undefined && result.error !== null && result.error !== false) return true
  return false
}

/** Fingerprint a tool call by name + arguments so retries of the same call group. */
function fingerprintOf(event: { data: Record<string, unknown> }): string {
  const d = event.data
  const name = typeof d.name === 'string' && d.name.length > 0 ? d.name : 'tool'
  const args = typeof d.arguments === 'string' ? d.arguments : JSON.stringify(d.arguments ?? '')
  return name + '\u0000' + args
}

/** Whether one event is a `turn/end` that ended in error. */
function isTurnError(event: unknown): boolean {
  if (!isRecord(event) || event.type !== 'turn/end') return false
  const data = isRecord(event.data) ? event.data : {}
  const reason = isRecord(data.reason) ? data.reason : undefined
  const kind = reason?.kind ?? data.kind
  return kind === 'error'
}

/**
 * Fold the failure signal from raw session events (newest `FAILURE_LOOKBACK`
 * tool calls, plus any error turn in that tail). Shares the `tool/call` guard
 * with {@link toolSampleOf} so there is exactly one wire shape for tool events.
 */
export function failureSignalOf(events: readonly unknown[]): FailureSignal {
  const groups = new Map<string, number>()
  let turnErrored = false
  let seenTools = 0
  for (let index = events.length - 1; index >= 0 && seenTools < FAILURE_LOOKBACK; index -= 1) {
    const event = events[index]
    if (isTurnError(event)) turnErrored = true
    if (!isToolCallEvent(event)) continue
    seenTools += 1
    if (toolFailed(event)) {
      const fp = fingerprintOf(event)
      groups.set(fp, (groups.get(fp) ?? 0) + 1)
    }
  }
  let repeatFailures = 0
  for (const count of groups.values()) {
    if (count >= 2) repeatFailures += 1
  }
  return { repeatFailures, turnErrored }
}
