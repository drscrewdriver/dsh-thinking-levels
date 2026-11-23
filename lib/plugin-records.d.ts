/**
 * Durable marks for the scheduler's OWN `model/selection` writes.
 *
 * ## The problem this solves
 *
 * On the 0.2.2+ strict line this plugin is itself a `model/selection` writer:
 * it fixes the next step's level through `agent.model.select()` (or by rewriting
 * the step's captured selection). Those writes do NOT reach the session log —
 * the host only appends `model/selection` for an explicit user pick
 * (`api/session-controller/src/commands.ts:176` → `selectForNextRequest`).
 *
 * Measured live (session `7f321902`): ONE `model/selection` event against THIRTY
 * `request/header` events alternating high/low. A projection folded over the log
 * alone therefore cannot tell "the user chose low" from "the scheduler chose
 * low", and the first honest answer was `unknown` — truthful, but useless: it
 * cannot distinguish scheduler output from a genuinely unexplained change.
 *
 * ## The mechanism
 *
 * `@deepseek-ai/dsh-session` exposes `appendPluginRecord(session, type, data)`
 * for exactly this: an `ignorable` event under a `plugin:`-namespaced type that
 * never enters the model-visible surface, is retained across fork/resume, and is
 * skipped (not refused) by readers that do not know it. We append one record per
 * scheduler write, so the projection can attribute the following
 * `request/header` to the scheduler.
 *
 * ## Coupling rules
 *
 * - **Soft**: the host package is resolved with a dynamic `import()` at call
 *   time and every failure degrades to "no mark" (the projection then keeps its
 *   `unknown` attribution). A plugin must never take a turn down because an
 *   optional telemetry channel is missing (`agent-loop/README.md:128`).
 * - **Never throws**: the caller is mid-turn; a rejected append would abort the
 *   step. All paths are wrapped.
 * - **Probed once**: the first attempt logs whether the API was reachable, so a
 *   silent degradation is diagnosable from the host log instead of by guessing.
 * @module dsh-thinking-levels/plugin-records
 */
/**
 * The record type. `plugin:` + slash-separated lowercase segments, per the
 * host grammar (`PluginRecordType` in `dsh-session/types`).
 */
export declare const SCHEDULER_WRITE_RECORD = "plugin:dsh-thinking-levels/scheduler-write";
/** Payload of one scheduler-write mark. */
export interface SchedulerWriteRecord {
    /** The level this plugin wrote (absent when it cleared the effort). */
    level?: string;
    /** `true` when the write removed the effort instead of setting one. */
    clear?: boolean;
    /** The intent the scheduler resolved for this step, for diagnosis. */
    intent?: string;
    /** Provider/model route the write targeted. */
    provider?: string;
    model?: string;
    /** `step` when the write landed on the current step, `next` when deferred. */
    applied?: 'step' | 'next';
}
/**
 * Append one scheduler-write mark to the session log.
 *
 * Best-effort by construction: an absent API, a non-appendable session, a
 * rejected payload or a throwing host all resolve to `false` — never a
 * rejection — because the caller is in the middle of a turn.
 * @param session - the live Session the write applies to (`agent.session`).
 * @param record - what was written.
 * @param logger - optional host logger, used once for the capability probe.
 * @returns whether the mark was committed.
 */
export declare function markSchedulerWrite(session: unknown, record: SchedulerWriteRecord, logger?: {
    info?: (message: string, ...args: unknown[]) => void;
    warn?: (message: string, ...args: unknown[]) => void;
}): Promise<boolean>;
/**
 * Read one committed event as a scheduler-write mark.
 *
 * Duck-typed on purpose: the projection folds raw events and must recognize the
 * mark on any host line without importing host types.
 * @param event - any committed session event.
 * @returns the record payload, or undefined for any other event.
 */
export declare function schedulerWriteOf(event: unknown): SchedulerWriteRecord | undefined;
/** Whether the capability probe has run and what it found (diagnostics/tests). */
export declare function schedulerMarkChannel(): 'ready' | 'unavailable' | 'unprobed';
/** Test seam: forget the cached module and probe state. */
export declare function resetSchedulerMarkChannel(): void;
