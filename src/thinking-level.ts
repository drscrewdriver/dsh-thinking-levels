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
 *               `low` / `high` / `max` (never `off`, never `auto` itself).
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

/**
 * Deterministic failure evidence the auto scheduler reads (N4 / 4.11.0). Defined
 * here so `thinking-level` stays the dependency-free leaf; the folder lives in
 * `session-events` and re-exports this type.
 */
export interface FailureSignal {
  /** Distinct (name+args) groups that failed ≥2 times within the lookback. */
  repeatFailures: number
  /** The most recent turn ended with `reason.kind === 'error'`. */
  turnErrored: boolean
}

/** Wire levels the auto scheduler may pick (never `off`, never `auto`). */
export type AutoEffort = 'low' | 'high' | 'max'

/**
 * Pick the level one agent should use given a separate subagent setting (N5 /
 * 4.12.0). The host exposes `agent.options.subagentDepth` (>0 for a delegated
 * subagent), so a subagent can hold its own tier while the parent keeps `level`.
 * `subagentLevel:'inherit'` (default) leaves the parent's level in force for
 * every agent — byte-for-byte the pre-4.12 behavior.
 * @param level - the configured parent / default level.
 * @param subagentLevel - the subagent override, or `inherit`.
 * @param isSubagent - whether this agent runs as a delegated subagent.
 */
export function pickAgentLevel(
  level: EffortId,
  subagentLevel: EffortId | 'inherit',
  isSubagent: boolean,
): EffortId {
  return isSubagent && subagentLevel !== 'inherit' ? subagentLevel : level
}

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
 * Everything the policy needs to decide one request's level.
 */
export interface EffortDecisionInput {
  /** Recent tool calls of the step (oldest first); empty for a fresh prompt. */
  recentCalls: readonly ToolCallSample[]
  /** The user-selected level: a fixed wire level, or `auto` for scheduling. */
  selected: EffortId
  /** Scheduler preference: allow the scheduler to drop below the hub (`high`). */
  allowDowngrade: boolean
  /** User preference: allow the scheduler to lift above the hub to `max`. */
  allowUpgrade: boolean
  /**
   * Deterministic failure evidence for the step (N4). When present and non-empty
   * the auto tier never falls below `high`; two or more repeated-argument
   * failures can lift it to `max` (subject to `allowUpgrade`).
   */
  failure?: FailureSignal
  /**
   * Extra tool names treated as cheap-and-deterministic, merged with the
   * built-in set (each matched after the `ops_` namespace strip). Empty/omitted
   * leaves the built-in classification untouched (issue #8 `Config.simpleTools`).
   */
  extraSimpleTools?: readonly string[]
  /**
   * Extra RAW REGEX patterns treated as cheap-and-deterministic, merged with
   * the literal list and the built-in set (issue #12 `Config.simpleToolsRegex`).
   * Each entry compiles as written (`i` flag, no auto-anchoring — the hint
   * suggests `^`); invalid entries are skipped with a one-time warning. The
   * matcher tests the full name and the bare name, so a family pattern like
   * `ops_.*` hits the whole namespace.
   */
  extraSimpleRegex?: readonly string[]
}

/**
 * Deterministic tool names that are cheap to reason about (word-boundary
 * anchored). `shell`/`pwsh`/`cmd`/`sh` sit alongside `bash`/`terminal` — every
 * one of them is a "run this command" entry, so a step made only of short calls
 * to any of them is cheap-and-deterministic (issue #8 follow-up: on hosts whose
 * command tool is named `shell`/`pwsh` rather than `bash`, auto used to sit
 * permanently on `high`).
 */
const SIMPLE_TOOL_RE = /^(?:fs|bash|terminal|shell|pwsh|cmd|sh|code|text|todo|job|skill|read|list|search|write|grep|glob|edit|ls|cat|rm|mv|cp|touch|mkdir|pwd|head|tail)(?:_|$)/i

/**
 * Known tool-wrapper namespaces (issue #8). `ops_` is the prefix the dsh-ops
 * plugin family puts on its tools (`ops_bash`, `ops_grep`, `ops_shell`,
 * `ops_read_files`); the wrapped tool is just as cheap-and-deterministic as its
 * bare name, so the prefix is stripped before the simple-tool check. Only an
 * explicit table is stripped: a generic `word_` catch-all would misread
 * look-alike heavy names such as `codebase_search` as simple (see the
 * classification-boundary test).
 */
const TOOL_NAMESPACE_RE = /^(?:ops_)+/i

/** Hefty payloads signal non-trivial work no matter the tool name. */
const HEAVY_ARGS = 800

/** Escape a user-supplied token for embedding in a RegExp source. */
function escapeRe(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * The merged cheap-and-deterministic classifier over both extra lists
 * (issue #12): literal entries (`Config.simpleTools`, anchored exactly as
 * before) plus raw regex entries (`Config.simpleToolsRegex`, compiled as
 * written — invalid ones skipped with a one-time warning, never thrown).
 *
 * `test` matches the FULL tool name AND the namespace-stripped bare name: a
 * family pattern like `ops_.*` can only ever hit the full name (the bare name
 * carries no `ops_` prefix), while a literal entry like `ops_bash` used to be
 * dead on arrival against the bare name alone — the dual face repairs it as a
 * side effect. The BUILT-IN table keeps its bare-name-only semantics (the
 * issue #8 contract); only the extra lists gained the second face.
 */
export interface SimpleToolMatcher {
  test(name: string): boolean
}

/**
 * Compiled matchers, memoised by content. The config arrays may be fresh
 * references on every read (volatile `.get()`), so key on the joined contents
 * rather than identity to avoid recompiling per request.
 */
const SIMPLE_MATCHER_CACHE = new Map<string, SimpleToolMatcher | null>()

/**
 * Compile the two extra lists into one classifier, or `null` when both are
 * empty (the built-in classification then stands alone). A compile is pure
 * apart from the one-time `console.warn` for invalid regex entries — the
 * cache keys on content, so the warning fires once per configuration, not
 * once per request.
 */
export function compileSimpleToolsMatcher(
  literal: readonly string[] | undefined,
  regex: readonly string[] | undefined,
): SimpleToolMatcher | null {
  const literalKey = (literal ?? []).join('\u0000')
  const regexKey = (regex ?? []).join('\u0000')
  if (literalKey === '' && regexKey === '') return null
  const key = `${literalKey}\u0001${regexKey}`
  const hit = SIMPLE_MATCHER_CACHE.get(key)
  if (hit !== undefined) return hit
  const matcher = buildSimpleToolsMatcher(literal ?? [], regex ?? [])
  SIMPLE_MATCHER_CACHE.set(key, matcher)
  return matcher
}

function buildSimpleToolsMatcher(literal: readonly string[], regex: readonly string[]): SimpleToolMatcher | null {
  const cleaned = literal.map(token => token.trim()).filter(token => token !== '')
  const literalRe = cleaned.length === 0
    ? null
    : new RegExp(`^(?:${cleaned.map(escapeRe).join('|')})(?:_|$)`, 'i')
  const rawRes: RegExp[] = []
  const failed: string[] = []
  for (const pattern of regex) {
    const trimmed = pattern.trim()
    if (trimmed === '') continue
    try {
      rawRes.push(new RegExp(trimmed, 'i'))
    } catch {
      failed.push(trimmed)
    }
  }
  if (failed.length > 0) {
    console.warn(`[dsh-thinking-levels] Config.simpleToolsRegex: skipped invalid pattern(s) (they must compile as JavaScript RegExp): ${failed.map(p => `/${p}/`).join(', ')}`)
  }
  if (literalRe === null && rawRes.length === 0) return null
  return {
    test(name: string): boolean {
      const bare = name.replace(TOOL_NAMESPACE_RE, '')
      return (literalRe !== null && (literalRe.test(name) || literalRe.test(bare)))
        || rawRes.some(re => re.test(name) || re.test(bare))
    },
  }
}

/** Whether a tool name looks cheap-and-deterministic: the built-in table reads
 * the namespace-stripped bare name (issue #8 semantics, untouched); the extra
 * matcher carries its own dual face (full name ∥ bare name, issue #12). */
function isSimpleToolName(name: string, extra?: SimpleToolMatcher | null): boolean {
  const bare = name.replace(TOOL_NAMESPACE_RE, '')
  return SIMPLE_TOOL_RE.test(bare) || (extra !== undefined && extra !== null && extra.test(name))
}

/** Count how many of the recent calls look cheap-and-deterministic. */
function simpleRatio(calls: readonly ToolCallSample[], extra?: SimpleToolMatcher | null): number {
  if (calls.length === 0) return 1
  const simple = calls.filter(call =>
    isSimpleToolName(call.name, extra) && call.argsSize < HEAVY_ARGS,
  ).length
  return simple / calls.length
}

/**
 * Auto schedule: map a recent tool-call history to the wire level the NEXT
 * model request of that step should use.
 *
 * Hub is `high` (the official default). Rules:
 * - No tool calls yet (the session's FIRST request) -> `high`, ALWAYS.
 * - All/mostly simple tools -> `low` (when downgrades are allowed) — `low` is
 *   the floor the scheduler may ever reach.
 * - Mixed or heavy tools -> `high` (the hub).
 * - Very heavy context (huge args) -> `max` (when upgrades are allowed).
 *
 * Why the first request sits on the hub instead of the old `low`: the first
 * step has no tool history to justify a downgrade, and it is the step that
 * decides the plan — tool choice, payload shape, decomposition. An
 * under-thought first step produces a plan the rest of the turn inherits, and
 * the measured saving of one cheap step does not pay for a re-plan. Downgrades
 * therefore require evidence: `low` needs at least one observed simple tool
 * call, so `allowDowngrade` no longer moves the no-sample branch.
 *
 * The scheduler MAY pick `low`: the request-level capability guard strips any
 * effort from models that do not support it, so a scheduled `low` only ever
 * reaches models that advertise the level.
 *
 * @param calls - recent tool calls of the step.
 * @param allowDowngrade - may drop below `high` once tool evidence exists.
 * @param allowUpgrade - may lift above `high`.
 * @returns a wire level; never `off` (off is manual-only) and never `auto`.
 */
function scheduleEffort(
  calls: readonly ToolCallSample[],
  allowDowngrade: boolean,
  allowUpgrade: boolean,
  extra?: SimpleToolMatcher | null,
  failure?: FailureSignal,
): AutoEffort {
  // The no-sample branch is the first request of the session: start at the hub
  // regardless of `allowDowngrade` (see the rationale above).
  if (calls.length === 0) return 'high'

  const ratio = simpleRatio(calls, extra)
  const heaviest = calls.reduce((max, call) => Math.max(max, call.argsSize), 0)

  // N4 failure evidence floors the tier at `high` (checked before the downgrade
  // branch so a failing step made only of simple tools still stays at `high`),
  // and lifts to `max` once two distinct same-argument failures prove the cheap
  // plan is stuck (upgrade still gated on the user's allow-upgrade preference).
  if (failure !== undefined && (failure.repeatFailures > 0 || failure.turnErrored)) {
    if (failure.repeatFailures >= 2 && allowUpgrade) return 'max'
    return 'high'
  }

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
  const { recentCalls, selected, allowDowngrade, allowUpgrade, extraSimpleTools, extraSimpleRegex, failure } = input
  if (selected !== 'auto') return selected
  return scheduleEffort(recentCalls, allowDowngrade, allowUpgrade, compileSimpleToolsMatcher(extraSimpleTools, extraSimpleRegex), failure)
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
  /**
   * The level this request was ASKED for: the session's explicit pick (folded
   * from `model/selection`) when present, else the plugin-configured default.
   *
   * Never derive this from the request seed. From dsh 0.1.2-rc.1 on, the host
   * seeds `reasoningEffort` from the previous `request/header` — which is this
   * plugin's own output (`core/agent-loop/src/agent.ts:573-581`). Reading it as
   * a manual pick made `auto` resolve once and then stay frozen for the rest of
   * the session (issue #6, bug 2).
   */
  requested: EffortId
  /**
   * The `reasoningEffort` already present on the request seed (host echo of a
   * previous header, or route inheritance). Used ONLY to recognise the `on`
   * toggle and to strip an inherited effort from a model that cannot take one —
   * never as a manual-pick signal.
   */
  seedEffort: unknown
  /** Recent tool calls of the step, for the auto scheduler. */
  recentCalls: readonly ToolCallSample[]
  /** Scheduler preference: allow the scheduler to drop below `high`. */
  allowDowngrade: boolean
  /** Scheduler preference: allow lifting above `high` to `max`. */
  allowUpgrade: boolean
  /** Deterministic failure evidence for the auto scheduler (N4). */
  failure?: FailureSignal
  /**
   * Extra tool names merged into the built-in cheap-and-deterministic set for
   * the `auto` scheduler (issue #8 `Config.simpleTools`).
   */
  extraSimpleTools?: readonly string[]
  /**
   * Extra raw regex patterns for the same set (issue #12
   * `Config.simpleToolsRegex`), compiled as written, invalid ones skipped.
   */
  extraSimpleRegex?: readonly string[]
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
 * Clamp a scheduled (auto) level to the ones the model actually advertises, and
 * when the exact level is missing fall DOWNWARD to the highest advertised level
 * that is not above the target — matching the vendor fallback semantics (an
 * unsupported `xhigh` runs as the highest supported level ≤ xhigh, never up to
 * a more expensive one). A model advertising no usable thinking level yields
 * `undefined` (strip).
 * @param level - the scheduled level (the auto path only; manual picks strip).
 * @param efforts - the model's advertised effort ids.
 * @returns the level to inject, or `undefined` when the model cannot take it.
 */
export function clampToEfforts(level: EffortId, efforts: readonly string[]): EffortId | undefined {
  if (efforts.includes(level)) return level
  // off and auto are not thinking levels; rank drives "not above the target".
  const rank = EFFORT_SLIDER_RANK as Record<string, number | undefined>
  const target = rank[level] ?? 0
  let best: EffortId | undefined
  let bestRank = -1
  for (const id of efforts) {
    if (id === 'off' || id === 'auto') continue
    const r = rank[id] ?? 0
    if (r <= target && r > bestRank) {
      bestRank = r
      best = id as EffortId
    }
  }
  return best
}

/**
 * Decide what one model request should do with `reasoningEffort`.
 *
 * - A model without reasoning support never receives the field: dsh would
 *   throw UNSUPPORTED_REASONING_EFFORT, so the seed's inherited effort (from a
 *   previous route or session header) is stripped.
 * - A manual wire selection (`requested`) passes through unchanged when the
 *   model advertises it; an unsupported manual pick is stripped rather than
 *   clamped (the user asked for that exact level).
 * - `on` is the enable-thinking toggle, never a wire level: on a toggle-only
 *   model it injects the advertised thinking level (`high`), which the wire
 *   serializes as enable_thinking without a reasoning_effort; an
 *   effort-capable model does not advertise `on`, so it is stripped.
 * - `auto` resolves through the scheduler; the result is clamped to the
 *   model's advertised levels, so a scheduled `low` on a model that only takes
 *   off/high (Qwen3.6) becomes `high` instead of an error.
 *
 * The manual/auto branch reads `requested` only. The seed no longer influences
 * it, so a header echoed back by the host cannot masquerade as a user pick.
 *
 * @param input - model capability plus the requested level and the seed's effort.
 * @returns whether to inject and the level to set.
 */
export function resolveEffortInjection(input: EffortInjectionInput): EffortInjectionDecision {
  const { supportsReasoning, requested, efforts, toggleOnly } = input
  if (!supportsReasoning) return { inject: false }
  if (toggleOnly) {
    // Toggle-only model (Qwen3.6 / mimo-v2.5 style): thinking is an on/off
    // switch expressed through the provider's enable_thinking semantics.
    // - Off → inject `off`: the provider maps it to thinking disabled.
    // - On / any other request → inject `high` (the advertised toggle level):
    //   the short-circuit adapter serializes a non-off effort as
    //   enable_thinking true — an explicit "thinking on" signal the wire needs.
    //   (A request with NO effort at all is the ambiguous case: leaving it
    //   absent relies on the provider default, which some gateways read as off.)
    return { inject: true, level: requested === 'off' ? 'off' : 'high' }
  }
  if (requested === 'on' || input.seedEffort === 'on') {
    // A stray On on an effort-capable model: never a wire level, stripped.
    return { inject: false }
  }
  if (requested !== 'auto') {
    // A manual pick is the user asking for that exact level: pass it through
    // only when the model advertises it, strip it otherwise (no clamping of an
    // explicit choice).
    return efforts.includes(requested)
      ? { inject: true, level: requested }
      : { inject: false }
  }
  const level = decideEffort({
    recentCalls: input.recentCalls,
    selected: 'auto',
    allowDowngrade: input.allowDowngrade,
    allowUpgrade: input.allowUpgrade,
    extraSimpleTools: input.extraSimpleTools,
    extraSimpleRegex: input.extraSimpleRegex,
    failure: input.failure,
  })
  const clamped = clampToEfforts(level, efforts)
  return clamped === undefined ? { inject: false } : { inject: true, level: clamped }
}

/** Wall-clock delta of one tool call, for the timing telemetry. */
export function toolDurationMs(startedAt: number, finishedAt: number): number {
  return Math.max(0, finishedAt - startedAt)
}

/* ── effort slider ordering & placement (client face, kept pure for tests) ── */

/**
 * Display rank of the effort slider stops: `auto` is the scheduler sentinel and
 * sits LEFTMOST regardless of whether the model allows disabling thinking;
 * `off` / `on` follow, then the strength gradient. Ids outside the standard set
 * (custom gateway wire values such as `ultra`) rank last, in arrival order.
 */
export const EFFORT_SLIDER_RANK: Readonly<Record<string, number>> = {
  auto: 0, off: 1, on: 2, minimal: 3, low: 4, medium: 5, high: 6, xhigh: 7, max: 8,
} as const

/** Fallback rank for ids outside the standard table. */
const EFFORT_SLIDER_RANK_TAIL = 100

/**
 * Order a model's advertised efforts for the slider track (left → right).
 * Stable sort: unknown ids keep their relative arrival order after the known
 * ranks, so a gateway's custom wire values are never dropped or reordered
 * against each other.
 */
export function orderEffortsForSlider<T extends { id: string }>(efforts: readonly T[]): T[] {
  return [...efforts].sort((a, b) => {
    const rankA = EFFORT_SLIDER_RANK[a.id] ?? EFFORT_SLIDER_RANK_TAIL
    const rankB = EFFORT_SLIDER_RANK[b.id] ?? EFFORT_SLIDER_RANK_TAIL
    return rankA - rankB
  })
}

/**
 * Map the line's effective effort to a stop index of the ordered track: exact
 * id match wins; an unmatched id (e.g. a defaultEffort the track does not
 * advertise) parks on the nearest stop by display rank, ties resolving to the
 * stronger level (higher index); an absent value parks on stop 0 (the neutral
 * left end — `auto` when advertised) and an empty track always yields 0, so the
 * caller never faces an out-of-range thumb.
 */
export function nearestEffortStopIndex(
  stops: readonly { id: string }[],
  value: string | undefined,
): number {
  if (stops.length === 0) return 0
  if (value === undefined) return 0
  const exact = stops.findIndex(stop => stop.id === value)
  if (exact >= 0) return exact
  const rank = EFFORT_SLIDER_RANK[value] ?? EFFORT_SLIDER_RANK_TAIL
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  stops.forEach((stop, index) => {
    const stopRank = EFFORT_SLIDER_RANK[stop.id] ?? EFFORT_SLIDER_RANK_TAIL
    const distance = Math.abs(stopRank - rank)
    // `<=` resolves ties toward the stronger (right-most) level.
    if (distance <= bestDistance) {
      bestDistance = distance
      best = index
    }
  })
  return best
}
