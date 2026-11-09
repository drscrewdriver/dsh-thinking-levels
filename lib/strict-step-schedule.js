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
import { isEffortId, resolveEffortInjection } from "./thinking-level.js";
/** Read the effort a host selection carries; absent / non-string reads as null. */
export function effortOfSelection(value) {
    return typeof value === 'string' && value.length > 0 ? value : null;
}
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
export function planStrictStep(input) {
    const observed = effortOfSelection(input.selectionEffort);
    const memory = input.memory;
    let intent;
    if (memory === undefined) {
        // First observation of this Agent. The value may be an adapter default, a
        // resumed `lastUsed`, or a user pick made before the plugin attached —
        // indistinguishable, so it seeds the baseline and the configured level
        // supplies the intent.
        intent = input.cfgLevel;
    }
    else if (observed !== memory.baseline) {
        // The selection moved without this plugin writing it: a user change.
        intent = isEffortId(observed) ? observed : input.cfgLevel;
    }
    else {
        intent = memory.intent;
    }
    const decision = resolveEffortInjection({
        supportsReasoning: input.supportsReasoning,
        requested: intent,
        seedEffort: input.selectionEffort,
        recentCalls: input.samples,
        allowDowngrade: input.allowDowngrade,
        allowUpgrade: input.allowUpgrade,
        extraSimpleTools: input.extraSimpleTools,
        efforts: input.efforts,
        toggleOnly: input.toggleOnly,
    });
    let select;
    let baseline = observed;
    if (!decision.inject) {
        // The model takes no effort: clear whatever the step inherited. `clear` is
        // only needed when the host currently fixes one.
        if (observed !== null) {
            select = { clear: true };
            baseline = null;
        }
    }
    else if (decision.level !== observed && decision.level !== undefined) {
        select = { level: decision.level, clear: false };
        baseline = decision.level;
    }
    return { memory: { baseline, intent }, select, intent };
}
