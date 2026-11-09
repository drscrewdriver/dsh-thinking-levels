/**
 * Strict-line step scheduler (dsh 0.2.2+).
 *
 * From `dsh-v0.2.2-alpha.2` the host fixes the step's provider / model /
 * `reasoningEffort` during step preparation and REJECTS any `agent/request`
 * listener that changes one of the three:
 *
 * ```
 * agent "${id}": agent/request proposed reasoning effort "low" after step
 * preparation fixed "adapter default"; use agent.model.select() before step
 * preparation
 * ```
 *
 * (`packages/core/agent-loop/src/agent.ts`, `prepareRequest`.) The official
 * migration guide (`docs/upgrade-guide/v0.2.1-alpha.4/session-model-selection`)
 * names the replacement: `agent.model.select(selection)` before the prompt is
 * assembled. So on that line the plugin stops rewriting the request and
 * schedules one step AHEAD instead:
 *
 * - `agent/pre-step` observes the selection the host just fixed for THIS step,
 *   computes the level the NEXT step should be fixed at, and records it with
 *   `agent.model.select()`. The already-captured selection is untouched (the
 *   loop reads `model.current()` before the waterfall), so the change applies
 *   to the next step — the accepted lag.
 * - `agent/request` returns the seed unchanged. Any change there is a throw.
 *
 * ## Why a baseline instead of the session pick
 *
 * The plugin is now itself a writer of `model/selection`, so the folded
 * `userEffort` of `tlAutoSchedule` can no longer distinguish "the user picked
 * `auto`" from "the scheduler wrote `low` last step". The strict line therefore
 * diffs the observed selection against the value it last observed/wrote
 * (`baseline`): a change that the plugin did not make is a user change and
 * becomes the new intent; otherwise the carried intent stands.
 *
 * `baseline` lives in a WeakMap per live Agent. That is correct across
 * resume/fork without extra persistence: a resumed Agent's first observation IS
 * the last value this plugin (or the user) left in the log, so it seeds the
 * baseline rather than registering as a change.
 * @module dsh-thinking-levels/strict-step-schedule
 */
import { type EffortId, type ToolCallSample } from './thinking-level.ts';
/** Per-Agent memory carried between steps of the strict line. */
export interface StrictStepMemory {
    /** The effort the host fixed for the previous step (null = the step had none). */
    baseline: string | null;
    /** The user intent carried to the next step when nothing changed externally. */
    intent: EffortId;
}
/** One strict-line step observation. */
export interface StrictStepInput {
    /** `payload.modelSelection.reasoningEffort` — the value the host fixed for this step. */
    selectionEffort: unknown;
    /**
     * What the plugin last observed or wrote for this Agent, or undefined on the
     * first strict-line step of the Agent (a fresh, resumed, or forked session).
     */
    memory: StrictStepMemory | undefined;
    /** The configured level, used as the intent whenever the session carries none. */
    cfgLevel: EffortId;
    /** Recent tool-call samples folded by `tlAutoSchedule`. */
    samples: readonly ToolCallSample[];
    /** Scheduler preference: may drop to `low` once tool evidence exists. */
    allowDowngrade: boolean;
    /** Scheduler preference: may lift above the hub to `max`. */
    allowUpgrade: boolean;
    /** Extra tool names merged into the built-in cheap-and-deterministic set (issue #8 `Config.simpleTools`). */
    extraSimpleTools?: readonly string[];
    /** Whether the target model advertises reasoning-effort support at all. */
    supportsReasoning: boolean;
    /** The model's advertised effort ids (including plugin masks like `auto`). */
    efforts: readonly string[];
    /** The model takes only an on/off thinking toggle (Qwen3.6-style). */
    toggleOnly: boolean;
}
/** The change to record on the Session for the NEXT step. */
export interface StrictSelectionWrite {
    /** The level to fix; absent when the effort must be cleared. */
    level?: EffortId;
    /** Clear the effort entirely (a model that takes none). */
    clear: boolean;
}
/** One step's plan: what to remember and what (if anything) to write. */
export interface StrictStepPlan {
    /** Memory for the next step. */
    memory: StrictStepMemory;
    /** The selection change for the next step, or undefined to leave it alone. */
    select: StrictSelectionWrite | undefined;
    /** The intent this step resolved, for the runtime log. */
    intent: EffortId;
}
/** Read the effort a host selection carries; absent / non-string reads as null. */
export declare function effortOfSelection(value: unknown): string | null;
/**
 * Plan one strict-line step.
 *
 * Pure: the caller owns the WeakMap, the capability lookup and the append. The
 * returned `select` is a request for `agent.model.select()`, which takes effect
 * on the NEXT step's preparation (the current step's selection was captured
 * before `agent/pre-step` ran).
 *
 * @param input - the observed step selection plus the scheduler inputs.
 * @returns the memory to keep and the selection change to record.
 */
export declare function planStrictStep(input: StrictStepInput): StrictStepPlan;
