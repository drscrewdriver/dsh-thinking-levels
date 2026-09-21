/**
 * Pure thinking-level decision for the dsh-thinking-levels plugin.
 *
 * The measured bottleneck of tool calls in dsh is the model's THINKING phase
 * (~90% of the wall-clock time for simple tasks), not the tool execution
 * itself. DeepSeek's API exposes `reasoning_effort` in wire levels
 * (off / low / high / max; low shipped 2026-08-13 in dsh rc.7 — rc.6 and
 * older adapters only accept off / high / max).
 *
 * The plugin offers EIGHT standard levels aligned with dsh-thinking-effort's
 * level set, plus the scheduler sentinel:
 * - `off`     : thinking disabled (manual only — never auto-picked).
 * - `on`      : thinking enabled at the model's default strength. Toggle-only
 *               models (Qwen3.6-style) surface Off/On; `on` lifts to the
 *               advertised `high` (or the highest thinking level the model
 *               takes) instead of an exact wire level.
 * - `minimal` / `low` / `medium` / `high` / `xhigh` / `max` : strength
 *   gradients. Each maps to a wire value via the model's `reasoningEfforts`
 *   table (customizable per model — e.g. `high` → `ultra`); levels the model
 *   does not advertise are clamped to its highest thinking level or stripped.
 * - `auto`    : schedule per step from the recent tool-call history, between
 *               `low` / `high` / `max` (never `off`, never `auto` itself). The
 *               scheduler is fail-safe, not fail-cheap: thin evidence (no tool
 *               calls yet, a window too small to judge, or a session log the
 *               harness will not hand over) stays at the `high` hub.
 *
 * A request-level guard decides whether an effort may be injected at all:
 * models that do not advertise reasoning metadata (custom openai-completions
 * routes such as Qwen3.6 with no `reasoningEfforts`) must never receive a
 * `reasoningEffort` — dsh rejects it per request with
 * UNSUPPORTED_REASONING_EFFORT. Unsupported fields are stripped, not sent.
 *
 * Kept dependency-free (pure inputs -> output) so the policy is unit-testable
 * in isolation; the plugin host feeds it the live session's recent calls.
 */

/** The user-facing thinking levels: the eight standard levels plus the scheduler sentinel. */
export type EffortId = 'off' | 'on' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max' | 'auto'

/** Wire levels the auto scheduler may pick (never `off`, never `auto`). */
export type AutoEffort = 'low' | 'high' | 'max'

/** The eight standard levels (excluding the `auto` scheduler sentinel). */
export const STANDARD_LEVELS: readonly EffortId[] = [
  'off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max',
] as const

/** Runtime guard: is this a level the plugin understands? */
export function isEffortId(value: unknown): value is EffortId {
  return STANDARD_LEVELS.includes(value as EffortId) || value === 'auto'
}

/**
 * Fail-loud config validation: reject an out-of-band level (e.g. a stray
 * value from an old profile) instead of silently injecting it into the
 * model request, where dsh would throw `UNSUPPORTED_REASONING_EFFORT`.
 */
export function assertEffortId(value: unknown, where: string): asserts value is EffortId {
  if (!isEffortId(value)) {
    throw new TypeError(
      `${where}: invalid thinking level ${JSON.stringify(value)} `
      + '(expected off | on | minimal | low | medium | high | xhigh | max | auto)',
    )
  }
}

/** One observed tool call of the current/last step. */
export interface ToolCallSample {
  /** Tool name, e.g. 'bash', 'fs_write', 'web_search', 'mcp__...'. */
  name: string
  /** Approximate argument size in characters (payload heft). */
  argsSize: number
}

/**
 * One sampled window of the session log: the unit of evidence the scheduler
 * reasons about.
 *
 * The window is `undefined`-able at the call site on purpose. A session log the
 * harness will not hand over is NOT the same observation as a log with no tool
 * calls in it, and the policy answers those two differently — see
 * {@link scheduleEffort}.
 */
export interface ToolHistory {
  /** Recent tool calls of the step, oldest first (at most TOOL_SAMPLE_WINDOW). */
  calls: readonly ToolCallSample[]
  /** Whether a tool result in the same window reported a failure. */
  failed: boolean
}

/**
 * Everything the policy needs to decide one request's level.
 */
export interface EffortDecisionInput {
  /**
   * Sampled window of the step's tool calls, or `undefined` when the session
   * log could not be read at all. Not the same as an empty window.
   */
  history: ToolHistory | undefined
  /** The user-selected level: a fixed wire level, or `auto` for scheduling. */
  selected: EffortId
  /** Scheduler preference: allow the scheduler to drop below the hub (`high`). */
  allowDowngrade: boolean
  /** User preference: allow the scheduler to lift above the hub to `max`. */
  allowUpgrade: boolean
}

/** Deterministic tool names that are cheap to reason about (word-boundary anchored). */
const SIMPLE_TOOL_RE = /^(?:fs|bash|terminal|code|text|todo|job|skill|read|list|search|write|grep|glob|edit|ls|cat|rm|mv|cp|touch|mkdir|pwd|head|tail)(?:_|$)/i

/** Hefty payloads signal non-trivial work no matter the tool name. */
const HEAVY_ARGS = 800

/**
 * How many of the MOST RECENT calls may carry the escalation signal.
 *
 * Bounding it is the difference between "escalate on heavy work" and "escalate
 * on the memory of heavy work": measured over a full 8-call window on a real
 * coding workload, one 48 KB `write` kept the window "very heavy" for the next
 * eight requests, which put 43% of all steps at `max`. Over the most recent two
 * calls the same traffic lands at ~13%.
 */
const ESCALATION_RECENCY = 2

/** A recent payload at least this large escalates to `max` (4× the simple-call ceiling). */
const ESCALATION_ARGS = HEAVY_ARGS * 4

/** The hub level: the official default, and the answer whenever evidence is thin. */
const HUB_EFFORT: AutoEffort = 'high'

/**
 * Fewer sampled calls than this is not evidence of routine work. A single
 * `read` must not pin the whole following step to the cheapest level: one call
 * is an event, three are a pattern. This gates DOWNGRADES only — positive
 * evidence of heaviness (a huge payload) still escalates on one call.
 */
export const MIN_SAMPLE_FOR_DOWNGRADE = 3

/** Count how many of the recent calls look cheap-and-deterministic. */
function simpleRatio(calls: readonly ToolCallSample[]): number {
  if (calls.length === 0) return 1
  const simple = calls.filter(call =>
    SIMPLE_TOOL_RE.test(call.name) && call.argsSize < HEAVY_ARGS,
  ).length
  return simple / calls.length
}

/**
 * Auto schedule: map a recent tool-call window to the wire level the NEXT
 * model request of that step should use.
 *
 * Hub is `high` (the official default). Rules, in order:
 * - Unreadable window (`undefined`) -> `high`. "Cannot observe" is not
 *   "nothing heavy happened"; the policy never guesses cheap.
 * - A recent payload at or above {@link ESCALATION_ARGS} -> `max` when upgrades
 *   are allowed. Evaluated over the last {@link ESCALATION_RECENCY} calls only,
 *   so a single large payload escalates the work it belongs to instead of the
 *   next eight requests.
 * - Any other window containing a failed tool round -> `high`. A failure is a
 *   FLOOR, not an escalation: it says the round was not routine, not that
 *   maximal reasoning is required.
 * - Fewer than {@link MIN_SAMPLE_FOR_DOWNGRADE} calls, or a log with no tool
 *   calls yet -> `high`. A fresh prompt is not evidence of a cheap task: the
 *   first step of a session is where the plan is made, and a wrong guess there
 *   is paid for in every later step.
 * - At least 75% cheap-and-deterministic calls -> `low` when downgrades are
 *   allowed.
 * - Otherwise -> `high`.
 *
 * The asymmetry is deliberate: guessing `low` on heavy work costs quality and
 * extra steps, guessing `high` on simple work costs a fraction of one round.
 *
 * The scheduler MAY still pick `low`: the request-level capability guard strips
 * any effort from models that do not support it, so a scheduled `low` only ever
 * reaches models that advertise the level.
 *
 * @param history - the sampled window, or `undefined` when unreadable.
 * @param allowDowngrade - may drop below `high`.
 * @param allowUpgrade - may lift above `high`.
 * @returns a wire level; never `off` (off is manual-only) and never `auto`.
 */
function scheduleEffort(
  history: ToolHistory | undefined,
  allowDowngrade: boolean,
  allowUpgrade: boolean,
): AutoEffort {
  if (history === undefined) return HUB_EFFORT

  const calls = history.calls
  const recent = calls.slice(-ESCALATION_RECENCY)
  const heaviest = recent.reduce((max, call) => Math.max(max, call.argsSize), 0)

  // Positive evidence of heaviness outranks a thin simple-looking window, so it
  // is deliberately checked before the sample minimum below.
  if (heaviest >= ESCALATION_ARGS && allowUpgrade) return 'max'
  if (history.failed) return HUB_EFFORT
  if (calls.length < MIN_SAMPLE_FOR_DOWNGRADE) return HUB_EFFORT
  if (simpleRatio(calls) >= 0.75 && allowDowngrade) return 'low'
  return HUB_EFFORT
}

/**
 * Map the user's selected level to the level injected into the next
 * `agent/request`. Manual levels (off / low / high / max) pass through
 * unchanged — `low` is the manual pick for simple chat tasks. `auto`
 * delegates to the tool-history scheduler.
 *
 * @param input - sampled history, the selected level and the user's toggles.
 * @returns The level to inject; `auto` is resolved before returning.
 */
export function decideEffort(input: EffortDecisionInput): EffortId {
  const { history, selected, allowDowngrade, allowUpgrade } = input
  if (selected !== 'auto') return selected
  return scheduleEffort(history, allowDowngrade, allowUpgrade)
}

/**
 * Whether a model's resolved metadata advertises reasoning-effort support.
 * dsh resolves `reasoning` to `undefined` for non-reasoning models (e.g. a
 * hand-declared openai-completions route without `reasoningEfforts`), and
 * rejects any requested effort for them per request. An empty efforts list is
 * equally incapable and is treated as unsupported.
 * @param reasoning - the `reasoning` field of a resolved model info.
 * @returns true when the model advertises at least one effort level.
 */
export function reasoningEffortSupported(reasoning: unknown): boolean {
  if (typeof reasoning !== 'object' || reasoning === null) return false
  const efforts = (reasoning as { efforts?: unknown }).efforts
  return Array.isArray(efforts) && efforts.length > 0
}

/** One request-level injection decision. */
export interface EffortInjectionInput {
  /** Whether the target model advertises reasoning-effort support. */
  supportsReasoning: boolean
  /** The `reasoningEffort` already present on the request seed, if any. */
  seedEffort: unknown
  /** Plugin-configured default level when the seed carries none. */
  selected: EffortId
  /** Sampled tool window of the step, for the auto scheduler (`undefined` = unreadable). */
  history: ToolHistory | undefined
  /** Scheduler preference: allow the scheduler to drop below `high`. */
  allowDowngrade: boolean
  /** Scheduler preference: allow lifting above `high` to `max`. */
  allowUpgrade: boolean
  /** The model's advertised effort ids (including plugin masks like `auto`). */
  efforts: readonly string[]
  /**
   * The model takes only an on/off thinking toggle (Qwen3.6 / mimo-v2.5
   * style): `off` must be stripped (pi-ai expresses it by omitting the effort,
   * not by sending an `off` value), and `on` maps to the advertised `high`
   * level (pi-ai serializes it as enable_thinking, no reasoning_effort).
   */
  toggleOnly: boolean
}

/** The resolved action for one `agent/request`. */
export interface EffortInjectionDecision {
  /** Keep/inject a `reasoningEffort` on the request (false = strip it). */
  inject: boolean
  /** The wire level to set, present when `inject` is true. */
  level?: EffortId
}

/**
 * Clamp a level to the ones the model actually advertises. The adapter rejects
 * any other value per request (UNSUPPORTED_REASONING_EFFORT), so an unsupported
 * scheduled level is lifted to the model's highest advertised thinking level
 * (a toggle-only model advertises off/high → a scheduled low becomes `high`,
 * which enables thinking without sending a think effort), and a model
 * advertising no thinking level at all yields nothing (strip).
 * @param level - the scheduled or manually selected level.
 * @param efforts - the model's advertised effort ids (escalation-ordered).
 * @returns the level to inject, or `undefined` when the model cannot take it.
 */
export function clampToEfforts(level: EffortId, efforts: readonly string[]): EffortId | undefined {
  if (efforts.includes(level)) return level
  // off and auto are not thinking levels; the advertised list is
  // escalation-ordered.
  const thinking = efforts.filter(id => id !== 'off' && id !== 'auto')
  if (thinking.length === 0) return undefined
  return thinking[thinking.length - 1] as EffortId
}

/**
 * Decide what one model request should do with `reasoningEffort`.
 *
 * - A model without reasoning support never receives the field: dsh would
 *   throw UNSUPPORTED_REASONING_EFFORT, so the seed's inherited effort (from a
 *   previous route or session header) is stripped.
 * - A manual wire selection passes through unchanged when the model advertises
 *   it; an unsupported manual pick is stripped rather than clamped (the user
 *   asked for that exact level).
 * - `on` is the enable-thinking toggle, never a wire level: on a toggle-only
 *   model it injects the advertised thinking level (`high`), which the wire
 *   serializes as enable_thinking without a reasoning_effort; an
 *   effort-capable model does not advertise `on`, so it is stripped.
 * - `auto` (or no selection) resolves through the scheduler; the result is
 *   clamped to the model's advertised levels, so a scheduled `low` on a model
 *   that only takes off/high (Qwen3.6) becomes `high` instead of an error.
 *
 * @param input - model capability plus the seed's current effort.
 * @returns whether to inject and the level to set.
 */
export function resolveEffortInjection(input: EffortInjectionInput): EffortInjectionDecision {
  const { supportsReasoning, seedEffort, selected, efforts, toggleOnly } = input
  if (!supportsReasoning) return { inject: false }
  if (toggleOnly) {
    // Toggle-only model (Qwen3.6 / mimo-v2.5 style): thinking is an on/off
    // switch expressed through the provider's enable_thinking semantics.
    // - Off → inject `off`: the provider maps it to thinking disabled.
    // - On / any other seed → inject `high` (the advertised toggle level): the
    //   short-circuit adapter serializes a non-off effort as enable_thinking
    //   true — an explicit "thinking on" signal the wire needs. (A request
    //   with NO effort at all is the ambiguous case: leaving it absent relies
    //   on the provider default, which some gateways treat as off.)
    return { inject: true, level: seedEffort === 'off' ? 'off' : 'high' }
  }
  if (seedEffort === 'on') {
    // A stray On on an effort-capable model: never a wire level, stripped.
    return { inject: false }
  }
  if (isEffortId(seedEffort) && seedEffort !== 'auto') {
    // A manual pick is the user asking for that exact level: pass it through
    // only when the model advertises it, strip it otherwise (no clamping of an
    // explicit choice).
    return efforts.includes(seedEffort)
      ? { inject: true, level: seedEffort }
      : { inject: false }
  }
  const level = decideEffort({
    history: input.history,
    selected: seedEffort === 'auto' ? 'auto' : selected,
    allowDowngrade: input.allowDowngrade,
    allowUpgrade: input.allowUpgrade,
  })
  const clamped = clampToEfforts(level, efforts)
  return clamped === undefined ? { inject: false } : { inject: true, level: clamped }
}

/** Wall-clock delta of one tool call, for the timing telemetry. */
export function toolDurationMs(startedAt: number, finishedAt: number): number {
  return Math.max(0, finishedAt - startedAt)
}
