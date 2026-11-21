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
import { z } from 'zod';
import { type EffortId, type ToolCallSample } from './thinking-level.ts';
/** Projection key. `tl` matches the plugin's other unit (`tlCacheBilling`). */
export declare const AUTO_SCHEDULE_KEY = "tlAutoSchedule";
/** One run-length segment of the effort trace (conversation-view tab). */
export interface EffortRun {
    /** The wire level this run's requests went out with. */
    level: string;
    /**
     * Why: `'auto'` (scheduler sentinel), `'manual'` (explicit session pick) or
     * `null` (the configured default — a session that never picked cannot be
     * told apart from one, so the tab renders it neutral).
     */
    intent: 'auto' | 'manual' | null;
    /** How many consecutive committed requests the run covers. */
    count: number;
}
/** Runs kept in the trace ring; run-length lets 64 runs cover very long sessions. */
export declare const TRACE_MAX = 64;
/** Folded state: recent tool samples plus the session's explicit pick. */
export interface AutoScheduleState {
    /** Recent `tool/call` samples, oldest first, at most {@link TOOL_SAMPLE_WINDOW}. */
    samples: readonly ToolCallSample[];
    /** Effort explicitly picked in this session, or null when never picked. */
    userEffort: string | null;
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
    lastEffective: string | null;
    /**
     * Run-length-folded effort trace, oldest run first — consecutive committed
     * requests that went out with the same effective level AND the same intent
     * collapse into one {@link EffortRun}. Folded from the same `request/header`
     * events as `lastEffective`: the trace is the per-request history that field
     * can only summarize (the conversation-view tab renders it). Headers without
     * an effort (non-reasoning model, stripped) append nothing — they
     * implicitly end the current run. At most {@link TRACE_MAX} runs.
     */
    trace: readonly EffortRun[];
}
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
 * @param intent - why: the session pick at fold time, or null for default.
 * @returns the advanced trace.
 */
export declare function foldTrace(trace: readonly EffortRun[], level: string, intent: EffortRun['intent']): readonly EffortRun[];
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
export declare function applyAutoSchedule(state: AutoScheduleState, event: unknown): AutoScheduleState;
/**
 * Build the `tlAutoSchedule` projection definition. Registered soft-coupled
 * (runtime inject), exactly like `tlCacheBilling`: hosts whose registry cannot
 * serve `stateOf` simply never register it and the scheduler falls back to the
 * legacy array read.
 */
export declare function buildAutoScheduleDefinition(): {
    key: string;
    stateVersion: number;
    stateSchema: z.ZodObject<{
        samples: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            argsSize: z.ZodNumber;
        }, z.core.$strip>>;
        userEffort: z.ZodNullable<z.ZodString>;
        lastEffective: z.ZodNullable<z.ZodString>;
        trace: z.ZodArray<z.ZodObject<{
            level: z.ZodString;
            intent: z.ZodNullable<z.ZodString>;
            count: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    init: () => AutoScheduleState;
    apply: typeof applyAutoSchedule;
};
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
export declare function readAutoSchedule(ctx: {
    get?: (name: string) => unknown;
}, session: unknown): AutoScheduleState | undefined;
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
export declare function requestedEffortOf(state: AutoScheduleState | undefined, fallback: EffortId): EffortId;
