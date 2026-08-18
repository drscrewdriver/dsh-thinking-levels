/**
 * Pure reasoning-effort decision for the tool-turbo plugin.
 *
 * The measured bottleneck of tool calls in dsh is the model's THINKING phase
 * (~90% of the wall-clock time for simple tasks), not the tool execution
 * itself. DeepSeek's API exposes `reasoning_effort` in three steps
 * (low / high / max, shipped 2026-08-13): dropping a trivial tool round from
 * high to low can cut the think time by 3-5x. The decision below maps the
 * RECENT tool-call history of a step to an effort id.
 *
 * Kept dependency-free (pure inputs -> output) so the policy is unit-testable
 * in isolation; the plugin host feeds it the live session's recent calls.
 */

/** The three reasoning-effort steps dsh forwards to DeepSeek. */
export type EffortId = 'low' | 'high' | 'max'

/** One observed tool call of the current/last step. */
export interface ToolCallSample {
  /** Tool name, e.g. 'bash', 'fs_write', 'web_search', 'mcp__...'. */
  name: string
  /** Approximate argument size in characters (payload heft). */
  argsSize: number
}

/** Everything the policy needs to decide one request's effort. */
export interface EffortDecisionInput {
  /** Recent tool calls of the step (oldest first); empty for a fresh prompt. */
  recentCalls: readonly ToolCallSample[]
  /** The user-selected baseline effort (what the UI shows). */
  selected: EffortId
  /** User preference: allow downgrades below the selected baseline. */
  allowDowngrade: boolean
  /** User preference: allow upgrades above the selected baseline. */
  allowUpgrade: boolean
}

/** Deterministic tool names that are cheap to reason about. */
const SIMPLE_TOOL_RE = /^(fs|bash|terminal|code|text|todo|job|skill|read|list|search|write|grep|glob|edit|ls|cat|rm|mv|cp|touch|mkdir|pwd|head|tail)/i

/** Hefty payloads signal non-trivial work no matter the tool name. */
const HEAVY_ARGS = 800

/** Count how many of the recent calls look cheap-and-deterministic. */
function simpleRatio(calls: readonly ToolCallSample[]): number {
  if (calls.length === 0) return 1
  const simple = calls.filter(call =>
    SIMPLE_TOOL_RE.test(call.name) && call.argsSize < HEAVY_ARGS,
  ).length
  return simple / calls.length
}

/**
 * Map a recent tool-call history to the effort dsh should use for the NEXT
 * model request of that step.
 *
 * Rules (pure, testable):
 * - No tool calls yet (fresh prompt) -> keep the user's selected effort.
 * - All/mostly simple tools -> `low` when downgrades are allowed.
 * - Mixed or heavy tools -> `high`.
 * - Very heavy context (huge args) -> `max` when upgrades are allowed.
 *
 * @param input - recent calls, the selected baseline and the user's toggles.
 * @returns The effort id to inject into the next agent/request.
 */
export function decideEffort(input: EffortDecisionInput): EffortId {
  const { recentCalls, selected, allowDowngrade, allowUpgrade } = input
  if (recentCalls.length === 0) return selected

  const ratio = simpleRatio(recentCalls)
  const heaviest = recentCalls.reduce((max, call) => Math.max(max, call.argsSize), 0)

  if (ratio >= 0.75 && allowDowngrade) return 'low'
  if (heaviest >= HEAVY_ARGS * 4 && allowUpgrade) return 'max'
  if (ratio < 0.75) return allowUpgrade ? 'high' : selected
  return selected
}

/** Wall-clock delta of one tool call, for the timing telemetry. */
export function toolDurationMs(startedAt: number, finishedAt: number): number {
  return Math.max(0, finishedAt - startedAt)
}
