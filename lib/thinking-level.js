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
/** The eight standard levels (excluding the `auto` scheduler sentinel). */
export const STANDARD_LEVELS = [
    'off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max',
];
/** Runtime guard: is this a level the plugin understands? */
export function isEffortId(value) {
    return STANDARD_LEVELS.includes(value) || value === 'auto';
}
/**
 * Fail-loud config validation: reject an out-of-band level (e.g. a stray
 * value from an old profile) instead of silently injecting it into the
 * model request, where dsh would throw `UNSUPPORTED_REASONING_EFFORT`.
 */
export function assertEffortId(value, where) {
    if (!isEffortId(value)) {
        throw new TypeError(`${where}: invalid thinking level ${JSON.stringify(value)} `
            + '(expected off | on | minimal | low | medium | high | xhigh | max | auto)');
    }
}
/** Deterministic tool names that are cheap to reason about (word-boundary anchored). */
const SIMPLE_TOOL_RE = /^(?:fs|bash|terminal|code|text|todo|job|skill|read|list|search|write|grep|glob|edit|ls|cat|rm|mv|cp|touch|mkdir|pwd|head|tail)(?:_|$)/i;
/** Hefty payloads signal non-trivial work no matter the tool name. */
const HEAVY_ARGS = 800;
/** Count how many of the recent calls look cheap-and-deterministic. */
function simpleRatio(calls) {
    if (calls.length === 0)
        return 1;
    const simple = calls.filter(call => SIMPLE_TOOL_RE.test(call.name) && call.argsSize < HEAVY_ARGS).length;
    return simple / calls.length;
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
 * The scheduler MAY pick `low`: the request-level capability guard strips any
 * effort from models that do not support it, so a scheduled `low` only ever
 * reaches models that advertise the level.
 *
 * @param calls - recent tool calls of the step.
 * @param allowDowngrade - may drop below `high`.
 * @param allowUpgrade - may lift above `high`.
 * @returns a wire level; never `off` (off is manual-only) and never `auto`.
 */
function scheduleEffort(calls, allowDowngrade, allowUpgrade) {
    if (calls.length === 0)
        return allowDowngrade ? 'low' : 'high';
    const ratio = simpleRatio(calls);
    const heaviest = calls.reduce((max, call) => Math.max(max, call.argsSize), 0);
    if (ratio >= 0.75 && allowDowngrade)
        return 'low';
    if (heaviest >= HEAVY_ARGS * 4 && allowUpgrade)
        return 'max';
    return 'high';
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
export function decideEffort(input) {
    const { recentCalls, selected, allowDowngrade, allowUpgrade } = input;
    if (selected !== 'auto')
        return selected;
    return scheduleEffort(recentCalls, allowDowngrade, allowUpgrade);
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
export function reasoningEffortSupported(reasoning) {
    if (typeof reasoning !== 'object' || reasoning === null)
        return false;
    const efforts = reasoning.efforts;
    return Array.isArray(efforts) && efforts.length > 0;
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
export function clampToEfforts(level, efforts) {
    if (efforts.includes(level))
        return level;
    // off and auto are not thinking levels; the advertised list is
    // escalation-ordered.
    const thinking = efforts.filter(id => id !== 'off' && id !== 'auto');
    if (thinking.length === 0)
        return undefined;
    return thinking[thinking.length - 1];
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
export function resolveEffortInjection(input) {
    const { supportsReasoning, seedEffort, selected, efforts, toggleOnly } = input;
    if (!supportsReasoning)
        return { inject: false };
    if (toggleOnly) {
        // Toggle-only model (Qwen3.6 / mimo-v2.5 style): thinking is an on/off
        // switch expressed through the provider's enable_thinking semantics.
        // - Off → inject `off`: the provider maps it to thinking disabled.
        // - On / any other seed → inject `high` (the advertised toggle level): the
        //   short-circuit adapter serializes a non-off effort as enable_thinking
        //   true — an explicit "thinking on" signal the wire needs. (A request
        //   with NO effort at all is the ambiguous case: leaving it absent relies
        //   on the provider default, which some gateways treat as off.)
        return { inject: true, level: seedEffort === 'off' ? 'off' : 'high' };
    }
    if (seedEffort === 'on') {
        // A stray On on an effort-capable model: never a wire level, stripped.
        return { inject: false };
    }
    if (isEffortId(seedEffort) && seedEffort !== 'auto') {
        // A manual pick is the user asking for that exact level: pass it through
        // only when the model advertises it, strip it otherwise (no clamping of an
        // explicit choice).
        return efforts.includes(seedEffort)
            ? { inject: true, level: seedEffort }
            : { inject: false };
    }
    const level = decideEffort({
        recentCalls: input.recentCalls,
        selected: seedEffort === 'auto' ? 'auto' : selected,
        allowDowngrade: input.allowDowngrade,
        allowUpgrade: input.allowUpgrade,
    });
    const clamped = clampToEfforts(level, efforts);
    return clamped === undefined ? { inject: false } : { inject: true, level: clamped };
}
/** Wall-clock delta of one tool call, for the timing telemetry. */
export function toolDurationMs(startedAt, finishedAt) {
    return Math.max(0, finishedAt - startedAt);
}
/* ── effort slider ordering & placement (client face, kept pure for tests) ── */
/**
 * Display rank of the effort slider stops: `auto` is the scheduler sentinel and
 * sits LEFTMOST regardless of whether the model allows disabling thinking;
 * `off` / `on` follow, then the strength gradient. Ids outside the standard set
 * (custom gateway wire values such as `ultra`) rank last, in arrival order.
 */
export const EFFORT_SLIDER_RANK = {
    auto: 0, off: 1, on: 2, minimal: 3, low: 4, medium: 5, high: 6, xhigh: 7, max: 8,
};
/** Fallback rank for ids outside the standard table. */
const EFFORT_SLIDER_RANK_TAIL = 100;
/**
 * Order a model's advertised efforts for the slider track (left → right).
 * Stable sort: unknown ids keep their relative arrival order after the known
 * ranks, so a gateway's custom wire values are never dropped or reordered
 * against each other.
 */
export function orderEffortsForSlider(efforts) {
    return [...efforts].sort((a, b) => {
        const rankA = EFFORT_SLIDER_RANK[a.id] ?? EFFORT_SLIDER_RANK_TAIL;
        const rankB = EFFORT_SLIDER_RANK[b.id] ?? EFFORT_SLIDER_RANK_TAIL;
        return rankA - rankB;
    });
}
/**
 * Map the line's effective effort to a stop index of the ordered track: exact
 * id match wins; an unmatched id (e.g. a defaultEffort the track does not
 * advertise) parks on the nearest stop by display rank, ties resolving to the
 * stronger level (higher index); an absent value parks on stop 0 (the neutral
 * left end — `auto` when advertised) and an empty track always yields 0, so the
 * caller never faces an out-of-range thumb.
 */
export function nearestEffortStopIndex(stops, value) {
    if (stops.length === 0)
        return 0;
    if (value === undefined)
        return 0;
    const exact = stops.findIndex(stop => stop.id === value);
    if (exact >= 0)
        return exact;
    const rank = EFFORT_SLIDER_RANK[value] ?? EFFORT_SLIDER_RANK_TAIL;
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    stops.forEach((stop, index) => {
        const stopRank = EFFORT_SLIDER_RANK[stop.id] ?? EFFORT_SLIDER_RANK_TAIL;
        const distance = Math.abs(stopRank - rank);
        // `<=` resolves ties toward the stronger (right-most) level.
        if (distance <= bestDistance) {
            bestDistance = distance;
            best = index;
        }
    });
    return best;
}
