/**
 * Pure thinking-level decision for the dsh-thinking-levels plugin.
 *
 * The measured bottleneck of tool calls in dsh is the model's THINKING phase
 * (~90% of the wall-clock time for simple tasks), not the tool execution
 * itself. DeepSeek's API exposes `reasoning_effort` in three wire levels
 * (low / high / max, plus `off` disables thinking; low shipped 2026-08-13 and
 * maps 1:1 per the official docs — medium/xhigh collapse onto high).
 *
 * The plugin offers FIVE user-facing levels:
 * - `off`  : thinking disabled (manual only — never auto-picked).
 * - `low`  : manual fix for simple chat tasks (cheap rounds stay cheap).
 * - `high` : manual fix, the official default effort.
 * - `max`  : manual fix for heavy work.
 * - `auto` : schedule per step from the recent tool-call history, between
 *            `low` / `high` / `max` (never `off`, never `auto` itself).
 *
 * Kept dependency-free (pure inputs -> output) so the policy is unit-testable
 * in isolation; the plugin host feeds it the live session's recent calls.
 */

/** The five user-facing thinking levels; the wire levels dsh forwards to DeepSeek plus the scheduler sentinel. */
export type EffortId = 'off' | 'low' | 'high' | 'max' | 'auto'

/** Wire levels the auto scheduler may pick (never `off`, never `auto`). */
export type AutoEffort = Exclude<EffortId, 'auto' | 'off'>

/** Runtime guard: is this a level the plugin understands? */
export function isEffortId(value: unknown): value is EffortId {
  return value === 'off' || value === 'low' || value === 'high' || value === 'max' || value === 'auto'
}

/**
 * Fail-loud config validation: reject an out-of-band level (e.g. a stray
 * `medium` from an old profile) instead of silently injecting it into the
 * model request, where dsh would throw `UNSUPPORTED_REASONING_EFFORT`.
 */
export function assertEffortId(value: unknown, where: string): asserts value is EffortId {
  if (!isEffortId(value)) {
    throw new TypeError(`${where}: invalid thinking level ${JSON.stringify(value)} (expected off | low | high | max | auto)`)
  }
}

/** One observed tool call of the current/last step. */
export interface ToolCallSample {
  /** Tool name, e.g. 'bash', 'fs_write', 'web_search', 'mcp__...'. */
  name: string
  /** Approximate argument size in characters (payload heft). */
  argsSize: number
}

/** Everything the policy needs to decide one request's level. */
export interface EffortDecisionInput {
  /** Recent tool calls of the step (oldest first); empty for a fresh prompt. */
  recentCalls: readonly ToolCallSample[]
  /** The user-selected level: a fixed wire level, or `auto` for scheduling. */
  selected: EffortId
  /** User preference: allow the scheduler to drop below the hub (`high`). */
  allowDowngrade: boolean
  /** User preference: allow the scheduler to lift above the hub to `max`. */
  allowUpgrade: boolean
}

/** Deterministic tool names that are cheap to reason about (word-boundary anchored). */
const SIMPLE_TOOL_RE = /^(?:fs|bash|terminal|code|text|todo|job|skill|read|list|search|write|grep|glob|edit|ls|cat|rm|mv|cp|touch|mkdir|pwd|head|tail)(?:_|$)/i

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
 * Auto schedule: map a recent tool-call history to the wire level the NEXT
 * model request of that step should use.
 *
 * Hub is `high` (the official default). Rules:
 * - No tool calls yet (fresh prompt, pure chat) -> `low` (simple chat tasks).
 * - All/mostly simple tools -> `low` (when downgrades are allowed).
 * - Mixed or heavy tools -> `high` (the hub).
 * - Very heavy context (huge args) -> `max` (when upgrades are allowed).
 *
 * @param calls - recent tool calls of the step.
 * @param allowDowngrade - may drop below `high`.
 * @param allowUpgrade - may lift above `high`.
 * @returns a wire level; never `off` (off is manual-only) and never `auto`.
 */
function scheduleEffort(
  calls: readonly ToolCallSample[],
  allowDowngrade: boolean,
  allowUpgrade: boolean,
): AutoEffort {
  if (calls.length === 0) return allowDowngrade ? 'low' : 'high'

  const ratio = simpleRatio(calls)
  const heaviest = calls.reduce((max, call) => Math.max(max, call.argsSize), 0)

  if (ratio >= 0.75 && allowDowngrade) return 'low'
  if (heaviest >= HEAVY_ARGS * 4 && allowUpgrade) return 'max'
  return 'high'
}

/**
 * Map the user's selected level to the level injected into the next
 * `agent/request`. Manual levels (off / low / high / max) pass through
 * unchanged — `low` is the manual pick for simple chat tasks. `auto`
 * delegates to the tool-history scheduler.
 *
 * @param input - recent calls, the selected level and the user's toggles.
 * @returns The level to inject; `auto` is resolved before returning.
 */
export function decideEffort(input: EffortDecisionInput): EffortId {
  const { recentCalls, selected, allowDowngrade, allowUpgrade } = input
  if (selected !== 'auto') return selected
  return scheduleEffort(recentCalls, allowDowngrade, allowUpgrade)
}

/** Wall-clock delta of one tool call, for the timing telemetry. */
export function toolDurationMs(startedAt: number, finishedAt: number): number {
  return Math.max(0, finishedAt - startedAt)
}
