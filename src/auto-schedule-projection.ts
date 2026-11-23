/**
 * TL auto-schedule projection unit (`tlAutoSchedule`).
 *
 * Issue #6 background — the two defects this unit exists to fix:
 * - The scheduler sampled tool calls from `agent.session.events`, an array
 *   property that only existed on 0.1.0-rc.8. From 0.1.2-rc.1 onward the host
 *   exposes `eventAt()/snapshotEvents()/ownEvents()` instead, so the sampler
 *   returned `[]` on 13 of the 14 supported host lines and `auto` silently
 *   collapsed to `low`. Those three readers are now `@deprecated` with an
 *   explicit "new production calls are prohibited" policy
 *   (`packages/core/session/README.md:62`), so re-binding to them is not an
 *   option either.
 * - The host seeds every request's `reasoningEffort` from the previous
 *   `request/header`, i.e. from THIS plugin's own output
 *   (`core/agent-loop/src/agent.ts:573-581`), so treating a concrete seed as a
 *   manual pick froze `auto` after the first request of a session.
 *
 * Both are solved by reading/writing a Session projection instead of the log:
 * - `apply` folds `tool/call` events into a bounded ring → `samples`.
 * - `apply` folds `model/selection` events into `userEffort`. That event has
 *   exactly one production writer, the user-facing selection command
 *   (`api/session-controller/src/agent.ts:340` ← `commands.ts:176`), so the
 *   plugin's own injection can never pollute it — the echo disappears by
 *   construction and needs no "remember what I injected" side table.
 * - `apply` folds `request/header` events into `lastEffective` (issue #11) and
 *   the run-length `trace` (conversation-view effort tab): the header carries
 *   the level the request actually went out with, so the trace is the
 *   per-request history the single field can only summarize.
 *
 * Projections are the sanctioned read path ("reads the projection"), are
 * folded lazily over the in-memory log on first read (so resumed/forked
 * sessions are complete), and cost O(1) per request afterwards.
 *
 * Explicitly NOT used: the host's `modelSelection` projection. Its `lastUsed`
 * is rewritten on every `request/header` (i.e. it holds this plugin's own
 * output) and `pending` is cleared once a matching header commits
 * (`api/session-controller/src/model-selection-projection.ts:39-58`), so
 * neither field carries a durable user intent.
 * @module dsh-thinking-levels/auto-schedule-projection
 */
import { z } from 'zod'
import { TOOL_SAMPLE_WINDOW, toolSampleOf } from './session-events.ts'
import { schedulerWriteOf } from './plugin-records.ts'
import { isEffortId, type EffortId, type ToolCallSample } from './thinking-level.ts'

/** Projection key. `tl` matches the plugin's other unit (`tlCacheBilling`). */
export const AUTO_SCHEDULE_KEY = 'tlAutoSchedule'

/** One run-length segment of the effort trace (conversation-view tab). */
export interface EffortRun {
  /** The wire level this run's requests went out with. */
  level: string
  /**
   * Why this level was sent. Four-valued on purpose — the old three-valued
   * form LIED:
   *
   * - `'auto'` — the scheduler's `auto` sentinel resolved it.
   * - `'manual'` — a `model/selection` event in the log carries exactly this
   *   level at fold time, i.e. someone actually selected it.
   * - `'default'` — the session never picked anything; the configured default
   *   applied.
   * - `'scheduler'` — THIS PLUGIN wrote it, proven by a
   *   `plugin:dsh-thinking-levels/scheduler-write` mark committed just before
   *   the header (see plugin-records.ts). The strongest attribution available.
   * - `'unknown'` — the level changed with NO recorded selection behind it and
   *   no scheduler mark. This is the honest fallback for the 0.2.2+ strict
   *   line's unmarked writes (measured on a live session: 30 headers,
   *   high/low alternating, ONE `model/selection` event). Calling that
   *   "manual" was a fabrication.
   */
  intent: 'auto' | 'manual' | 'default' | 'unknown' | 'scheduler'
  /** How many consecutive committed requests the run covers. */
  count: number
  /**
   * The turn the run's FIRST request belonged to, folded from the preceding
   * `turn/start`. Optional: runs folded before stateVersion 4 (a cached row
   * that predates it) simply lack it and the tab omits the position chip.
   */
  turn?: number
  /** The step the run's first request belonged to (folded from `step/start`). */
  step?: number
  /** Wall-clock ms of the run's first committed request. */
  time?: number
  /** Provider route of the run's first request, folded from the request header. */
  provider?: string
  /** Model id of the run's first request, folded from the request header. */
  model?: string
}

/** Runs kept in the trace ring; run-length lets 64 runs cover very long sessions. */
export const TRACE_MAX = 64

/** Folded state: recent tool samples plus the session's explicit pick. */
export interface AutoScheduleState {
  /** Recent `tool/call` samples, oldest first, at most {@link TOOL_SAMPLE_WINDOW}. */
  samples: readonly ToolCallSample[]
  /** Effort explicitly picked in this session, or null when never picked. */
  userEffort: string | null
  /**
   * The effort the last request ACTUALLY carried, folded from the committed
   * `request/header` (the host writes the effective value there —
   * `dsh-llm/lib/index.js:2298-2308`).
   *
   * Issue #11: with `auto` selected the UI showed "Auto" while every request
   * went out as a concrete level, so the user could not tell what was really
   * sent. The host's `modelSelection.lastUsed` cannot answer that either (it is
   * rewritten on every header, i.e. it holds our own output — see the module
   * doc), so the answer has to come from this projection.
   *
   * `null` until the session's first committed request.
   */
  lastEffective: string | null
  /**
   * Run-length-folded effort trace, oldest run first — consecutive committed
   * requests that went out with the same effective level AND the same intent
   * collapse into one {@link EffortRun}. Folded from the same `request/header`
   * events as `lastEffective`: the trace is the per-request history that field
   * can only summarize (the conversation-view tab renders it). Headers without
   * an effort (non-reasoning model, stripped) append nothing — they
   * implicitly end the current run. At most {@link TRACE_MAX} runs.
   */
  trace: readonly EffortRun[]
  /**
   * The turn in progress at fold time (folded from `turn/start`), so a
   * `request/header` can be stamped with the turn it belongs to. `0` before the
   * session's first turn.
   */
  turn: number
  /** The step in progress at fold time (folded from `step/start`). `0` before it. */
  step: number
  /**
   * The provider route the last committed request went out on, folded from the
   * header's `config.provider`. `null` until the first request.
   *
   * The header carries it on every request, so the model a level was sent to is
   * always recoverable — dropping it (as the first version did) left the trace
   * unable to say WHICH model a switch happened on.
   */
  lastProvider: string | null
  /** The model id the last committed request went out on. `null` until the first. */
  lastModel: string | null
  /**
   * Count of provider/model switches observed in this session's committed
   * requests. `0` means one route throughout.
   */
  modelSwitches: number
  /**
   * One-shot flag: a scheduler-write mark was seen and the next committed
   * `request/header` should be attributed to the scheduler. Cleared by that
   * header (or by another `model/selection`, which supersedes the write).
   *
   * Host-side only — the browser never needs it, so it stays out of the wire.
   */
  pendingSchedulerWrite: boolean
}

const stateSchema = z.object({
  samples: z.array(z.object({ name: z.string(), argsSize: z.number() })),
  userEffort: z.string().nullable(),
  lastEffective: z.string().nullable(),
  trace: z.array(z.object({
    level: z.string(),
    intent: z.string().nullable(),
    count: z.number(),
    turn: z.number().optional(),
    step: z.number().optional(),
    time: z.number().optional(),
    provider: z.string().optional(),
    model: z.string().optional(),
  })),
  turn: z.number(),
  step: z.number(),
  lastProvider: z.string().nullable(),
  lastModel: z.string().nullable(),
  modelSwitches: z.number(),
  pendingSchedulerWrite: z.boolean(),
})

/** Initial folded state (also the shape every cold read starts from). */
const initAutoSchedule = (): AutoScheduleState => ({
  samples: [],
  userEffort: null,
  lastEffective: null,
  trace: [],
  turn: 0,
  step: 0,
  lastProvider: null,
  lastModel: null,
  modelSwitches: 0,
  pendingSchedulerWrite: false,
})

/**
 * Append one committed request's effective level to the run-length trace.
 *
 * Pure and total: every call returns a NEW array (a header always grows some
 * run — same level+intent extends the last run's count, anything else opens a
 * new one), so the Object.is change gate treats every level-carrying header as
 * a real state change and wakes the trace tab. Headers without a level never
 * reach this function (see {@link applyAutoSchedule}).
 * @param trace - trace before the header.
 * @param level - the effective wire level the header committed.
 * @param intent - why this level was sent (see {@link EffortRun.intent}).
 * @param at - where the request sat (turn/step), when it went out, and which
 *   provider/model route it targeted: stamped onto a run's FIRST request only,
 *   because a run means "this level held for these consecutive steps starting
 *   here".
 * @returns the advanced trace.
 */
export function foldTrace(
  trace: readonly EffortRun[],
  level: string,
  intent: EffortRun['intent'],
  at: { turn?: number; step?: number; time?: number; provider?: string; model?: string } = {},
): readonly EffortRun[] {
  const last = trace[trace.length - 1]
  // A run means "this level held on this ROUTE for these consecutive steps".
  // The route is part of the identity: folding `trae/high` and `deepseek/high`
  // into one run would erase the model switch the tab exists to show.
  if (last !== undefined
    && last.level === level
    && last.intent === intent
    && last.provider === at.provider
    && last.model === at.model) {
    return [...trace.slice(0, -1), { ...last, count: last.count + 1 }]
  }
  const run: EffortRun = { level, intent, count: 1 }
  if (at.turn !== undefined) run.turn = at.turn
  if (at.step !== undefined) run.step = at.step
  if (at.time !== undefined) run.time = at.time
  if (at.provider !== undefined) run.provider = at.provider
  if (at.model !== undefined) run.model = at.model
  const pushed = [...trace, run]
  return pushed.length > TRACE_MAX ? pushed.slice(pushed.length - TRACE_MAX) : pushed
}

/**
 * Fold one committed Session event into the auto-schedule state.
 *
 * Unrelated events return the SAME reference — the projection registry gates
 * its change feed on `Object.is`, so rebuilding state for every message would
 * wake every client-visible unit on each append.
 *
 * @param state - state before the event.
 * @param event - next committed Session event (raw wire shape; narrowed below).
 * @returns the original or advanced state.
 */
export function applyAutoSchedule(state: AutoScheduleState, event: unknown): AutoScheduleState {
  if (typeof event !== 'object' || event === null) return state
  const type = (event as { type?: unknown }).type
  // Scheduler-write mark (`plugin:dsh-thinking-levels/scheduler-write`): this
  // plugin wrote a `model/selection` that the host never logged. Arming a
  // one-shot flag lets the NEXT committed header be attributed to the
  // scheduler instead of falling into the `unknown` bucket.
  if (schedulerWriteOf(event) !== undefined) {
    return state.pendingSchedulerWrite ? state : { ...state, pendingSchedulerWrite: true }
  }
  if (type === 'tool/call') {    const sample = toolSampleOf(event)
    if (sample === undefined) return state
    const grown = [...state.samples, sample]
    const samples = grown.length > TOOL_SAMPLE_WINDOW
      ? grown.slice(grown.length - TOOL_SAMPLE_WINDOW)
      : grown
    return { ...state, samples }
  }
  if (type === 'model/selection') {
    const data = (event as { data?: unknown }).data
    const raw = typeof data === 'object' && data !== null
      ? (data as { reasoningEffort?: unknown }).reasoningEffort
      : undefined
    const userEffort = typeof raw === 'string' && raw.length > 0 ? raw : null
    return userEffort === state.userEffort ? state : { ...state, userEffort }
  }
  if (type === 'turn/start') {
    // Position bookkeeping only: the tab stamps each run with the turn/step it
    // started in, so "when did auto drop to low" is answerable in the UI.
    const data = (event as { data?: unknown }).data
    const raw = typeof data === 'object' && data !== null ? (data as { turn?: unknown }).turn : undefined
    if (typeof raw !== 'number') return state
    return raw === state.turn && state.step === 0 ? state : { ...state, turn: raw, step: 0 }
  }
  if (type === 'step/start') {
    const data = (event as { data?: unknown }).data
    const step = typeof data === 'object' && data !== null ? (data as { step?: unknown }).step : undefined
    if (typeof step !== 'number') return state
    return step === state.step ? state : { ...state, step }
  }
  if (type === 'request/header') {
    // Issue #11: the header carries the effort this request actually went out
    // with — the host resolves and commits the effective value here, so it is
    // the only durable record of what `auto` turned into.
    const data = (event as { data?: unknown }).data
    const header = typeof data === 'object' && data !== null
      ? (data as { header?: unknown }).header
      : undefined
    const config = typeof header === 'object' && header !== null
      ? (header as { config?: unknown }).config
      : undefined
    const route = typeof config === 'object' && config !== null
      ? (config as { provider?: unknown; model?: unknown })
      : undefined
    const provider = typeof route?.provider === 'string' && route.provider.length > 0
      ? route.provider
      : undefined
    const model = typeof route?.model === 'string' && route.model.length > 0
      ? route.model
      : undefined
    // A model switch is a route change between two consecutive committed
    // requests. Recorded on EVERY header (both ids), so the trace can name the
    // model each level was sent to instead of guessing.
    const switched = state.lastProvider !== null
      && (state.lastProvider !== provider || state.lastModel !== model)
    const raw = typeof config === 'object' && config !== null
      ? (config as { reasoningEffort?: unknown }).reasoningEffort
      : undefined
    if (typeof raw !== 'string' || raw.length === 0) {
      // A header without an effort (non-reasoning model, stripped) records
      // nothing in the trace and keeps the old same-reference semantics when
      // lastEffective is already null.
      const unchanged = state.lastEffective === null
        && !switched
        && state.lastProvider === (provider ?? null)
        && state.lastModel === (model ?? null)
      if (unchanged) return state
      return {
        ...state,
        lastEffective: null,
        lastProvider: provider ?? null,
        lastModel: model ?? null,
        modelSwitches: switched ? state.modelSwitches + 1 : state.modelSwitches,
        // The marked write never produced a level (non-reasoning model): the
        // mark is spent, nothing to attribute.
        pendingSchedulerWrite: false,
      }
    }
    // A pending scheduler-write mark claims THIS header: the plugin wrote the
    // level the host then sent. That is evidence, not a guess — it beats the
    // `unknown` fallback, which exists only for writes we cannot account for.
    const intent: EffortRun['intent'] = state.pendingSchedulerWrite
      ? 'scheduler'
      : attributionOf(state.userEffort, raw)
    const time = (event as { time?: unknown }).time
    return {
      ...state,
      lastEffective: raw,
      lastProvider: provider ?? null,
      lastModel: model ?? null,
      modelSwitches: switched ? state.modelSwitches + 1 : state.modelSwitches,
      pendingSchedulerWrite: false,
      trace: foldTrace(state.trace, raw, intent, {
        // A header that arrives before any `turn/start` (a synthetic or
        // inherited cut) carries no position rather than a bogus T0·S0.
        ...(state.turn > 0 ? { turn: state.turn, step: state.step } : {}),
        ...(typeof time === 'number' ? { time } : {}),
        ...(provider !== undefined ? { provider } : {}),
        ...(model !== undefined ? { model } : {}),
      }),
    }
  }
  return state
}

/**
 * Attribute one committed header's level to whoever actually chose it.
 *
 * The old rule was "the session's recorded pick is a concrete level → the
 * request was manual", which is a non-sequitur: a session can carry ONE
 * recorded pick and then send THIRTY headers at alternating levels (measured
 * live: `7f321902` had `model/selection = [high]` and headers
 * `high,low,high,low,…`). On the 0.2.2+ strict line the plugin itself is a
 * `model/selection` writer through `agent.model.select()`, and those writes do
 * not reach the log — so "manual" was a fabrication for 29 of 30 requests.
 *
 * The honest rule is equality, not existence:
 * - the recorded pick IS this level → `manual` (someone selected exactly this);
 * - the recorded pick is `auto` → `auto` (the scheduler resolved it);
 * - no pick at all → `default` (the configured default applied);
 * - a pick exists but is a DIFFERENT level → `unknown`: the level came from a
 *   writer the log does not record. Saying "manual" here would be a lie and
 *   saying "auto" would be a guess, so the UI shows a neutral "未记录" tag.
 *
 * @param userEffort - the session's recorded pick at fold time, or null.
 * @param level - the level this header actually carried.
 * @returns the attribution.
 */
export function attributionOf(userEffort: string | null, level: string): Exclude<EffortRun['intent'], 'scheduler'> {
  if (userEffort === null) return 'default'
  if (userEffort === 'auto') return 'auto'
  return userEffort === level ? 'manual' : 'unknown'
}

/**
 * The state -> client payload. `samples` stays host-side (only the scheduler
 * reads it), so the wire carries exactly what the browser renders.
 */
export interface AutoScheduleView {
  /** The session's explicit pick, or null when it never picked. */
  userEffort: string | null
  /** The level the last committed request actually carried, or null. */
  lastEffective: string | null
  /** Run-length effort trace, oldest run first. */
  trace: readonly EffortRun[]
  /** Provider route of the last committed request, or null. */
  lastProvider: string | null
  /** Model id of the last committed request, or null. */
  lastModel: string | null
  /** How many provider/model switches the session's committed requests show. */
  modelSwitches: number
}

const viewSchema = z.object({
  userEffort: z.string().nullable(),
  lastEffective: z.string().nullable(),
  trace: z.array(z.object({
    level: z.string(),
    intent: z.string().nullable(),
    count: z.number(),
    turn: z.number().optional(),
    step: z.number().optional(),
    time: z.number().optional(),
    provider: z.string().optional(),
    model: z.string().optional(),
  })),
  lastProvider: z.string().nullable(),
  lastModel: z.string().nullable(),
  modelSwitches: z.number(),
})

/** Content comparison for the wire identity gate (see {@link buildAutoScheduleDefinition}). */
function sameView(a: AutoScheduleView, b: AutoScheduleView): boolean {
  if (a.userEffort !== b.userEffort || a.lastEffective !== b.lastEffective) return false
  if (a.lastProvider !== b.lastProvider || a.lastModel !== b.lastModel) return false
  if (a.modelSwitches !== b.modelSwitches) return false
  if (a.trace === b.trace) return true
  if (a.trace.length !== b.trace.length) return false
  for (let i = 0; i < a.trace.length; i += 1) {
    const x = a.trace[i]!
    const y = b.trace[i]!
    if (x.level !== y.level || x.intent !== y.intent || x.count !== y.count) return false
    // Position/time/route ride the run's first request, so they only ever
    // change with a new run — compare them so a re-fold after a cold read stays
    // identical.
    if (x.turn !== y.turn || x.step !== y.step || x.time !== y.time) return false
    if (x.provider !== y.provider || x.model !== y.model) return false
  }
  return true
}

/**
 * Build the `tlAutoSchedule` projection definition. Registered soft-coupled
 * (runtime inject), exactly like `tlCacheBilling`: hosts whose registry cannot
 * serve `stateOf` simply never register it and the scheduler falls back to the
 * legacy array read.
 *
 * ## Why `wire` is not optional here (the empty-tab bug)
 *
 * The registry ships a unit to the browser ONLY when it declares `wire` —
 * `snapshot()` / `cachedSnapshot()` both `continue` on
 * `def.wire === undefined` (`packages/session/session-projection/src/index.ts`,
 * "Omit for host-only units"), and the client's `faceOf(key)` then reads
 * `undefined` forever. Without `wire` this unit was host-only, so the effort
 * tab's `traceOf` and the composer chip's `lastEffective` were dead reads on
 * every real host — a filled projection behind an empty UI. `tlCacheBilling`
 * always had `wire`; this unit did not.
 *
 * The `view` keeps a one-entry content memo so a `tool/call` (which only grows
 * `samples`) republishes nothing: the drive compares raw view results with
 * `Object.is`, so returning the SAME object for unchanged client-relevant
 * state is what suppresses the wake.
 */
export function buildAutoScheduleDefinition() {
  let lastState: AutoScheduleState | undefined
  let lastView: AutoScheduleView | undefined
  const view = (state: AutoScheduleState): AutoScheduleView => {
    if (lastView !== undefined && state === lastState) return lastView
    const next: AutoScheduleView = {
      userEffort: state.userEffort,
      lastEffective: state.lastEffective,
      trace: state.trace,
      lastProvider: state.lastProvider,
      lastModel: state.lastModel,
      modelSwitches: state.modelSwitches,
    }
    if (lastView !== undefined && sameView(lastView, next)) {
      // Client-irrelevant change (e.g. the samples ring): reuse the identity so
      // the Object.is gate stays closed.
      lastState = state
      return lastView
    }
    lastState = state
    lastView = next
    return next
  }
  return {
    key: AUTO_SCHEDULE_KEY,
    // Bumped 1 → 2 when `lastEffective` joined the state (issue #11), 2 → 3
    // when the run-length `trace` joined (conversation-view tab), 3 → 4 when
    // the trace gained turn/step/time position stamps, 4 → 5 when runs gained
    // provider/model plus the four-valued intent, 5 → 6 when the state gained
    // the scheduler-write flag (and runs the `scheduler` attribution): the host
    // validates against `stateSchema` per version, so a shape change must raise
    // it. Historical sessions are not lost — the state is a fold over the log,
    // so a cold read rebuilds everything from the events.
    stateVersion: 6,
    stateSchema,
    init: initAutoSchedule,
    apply: applyAutoSchedule,
    wire: { viewSchema, view },
  }
}

/** The one service surface this unit needs (duck-typed to stay version-agnostic). */
interface ProjectionReader {
  stateOf?: (session: unknown, key: string) => unknown
}

/**
 * Read the folded auto-schedule state for a session.
 *
 * Returns `undefined` — never throws — when the host cannot serve it: the
 * service is absent, or the registry predates `stateOf` (0.1.0-rc.8 is the
 * legacy plane-contract registry with `schema`/`view` and no `stateOf`). A
 * thrown error here would take down the whole turn
 * (`agent-loop/README.md:128`: "plugin failure ends the turn").
 *
 * @param ctx - plugin context (only `get` is used).
 * @param session - the live session owning the state.
 * @returns the folded state, or undefined when unavailable.
 */
export function readAutoSchedule(
  ctx: { get?: (name: string) => unknown },
  session: unknown,
): AutoScheduleState | undefined {
  if (typeof session !== 'object' || session === null) return undefined
  try {
    const service = ctx.get?.('sessionProjections') as ProjectionReader | undefined
    if (typeof service?.stateOf !== 'function') return undefined
    const state = service.stateOf(session, AUTO_SCHEDULE_KEY)
    return typeof state === 'object' && state !== null ? state as AutoScheduleState : undefined
  } catch {
    return undefined
  }
}

/**
 * The level this request was asked for: the session's explicit pick when it is
 * a level the plugin understands, else the plugin-configured default.
 *
 * Note the `isEffortId` gate is deliberate and matches the pre-existing
 * behaviour: a gateway-specific wire value (e.g. `ultra`) inside a concrete
 * pick already fell through to the scheduler before this change, because
 * `resolveEffortInjection` only passes through known effort ids.
 *
 * @param state - folded state, when the host could serve it.
 * @param fallback - configured default level.
 * @returns the requested level.
 */
export function requestedEffortOf(
  state: AutoScheduleState | undefined,
  fallback: EffortId,
): EffortId {
  const user = state?.userEffort
  return isEffortId(user) ? user : fallback
}
