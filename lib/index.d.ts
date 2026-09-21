/**
 * dsh-thinking-levels host plugin: injects a user-selected or auto-scheduled
 * `reasoning_effort` into every `agent/request` waterfall (levels: off / on /
 * minimal / low / medium / high / xhigh / max / auto), and records per-tool
 * wall-clock durations for telemetry.
 *
 * Model-aware since v0.5.0:
 * - A model that does not advertise reasoning metadata (custom
 *   openai-completions routes such as Qwen3.6 without `reasoningEfforts`)
 *   NEVER receives a `reasoningEffort` — dsh rejects unsupported efforts per
 *   request (UNSUPPORTED_REASONING_EFFORT). Unsupported fields are stripped.
 * - Manual selections pass through unchanged, including `low` on dsh rc.7+
 *   where the level is native. `on` (the enable-thinking toggle) is never a
 *   wire level: on a toggle-only model it injects the advertised `high`
 *   (serialized as enable_thinking, no reasoning_effort); elsewhere it is
 *   stripped.
 * - The auto scheduler never picks `low` (no surprise low injection).
 * - On rc.6-era adapters (efforts without `low`) a configurer-confirmed model
 *   override may advertise `low` so the selector shows it and the passthrough
 *   is admitted by request validation.
 *
 * Extension points used (verified in deepseek-ai/deepseek-harness):
 * - `agent/request` waterfall (packages/core/agent-loop/src/agent.ts
 *   buildRequest): each listener may return a modified GenerateOptions for
 *   the next listener — the sanctioned way to adjust request config.
 * - the session log (agent.session) carries the step's tool/call records; the
 *   auto scheduler PULLS the recent calls from there at request time
 *   (`recentToolCalls`). There is no `agent/tool` push event in DSH — the
 *   scope-event registry (`packages/core/scope/src/scoped-events.generated.ts`)
 *   lists no such name in 0.1.1-rc.2 or 0.1.2-rc.1, so tool recognition must
 *   stay a pull from the session log. The accessor itself moved at the
 *   0.1.2-rc.1 boundary (`session.events` -> `eventAt` / `snapshotEvents` /
 *   `ownEvents`) while `engines.dsh` spans both sides; `session-events.ts`
 *   reads whichever one the installed harness exposes.
 * - settings service namespace (like DSH-better-sidebar's PrefsSchema) for
 *   the user toggles.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { type EffortId } from './thinking-level.ts';
/** One configurer-confirmed capability override for a `provider/model` key. */
export interface ModelCapabilityOverride {
    /** Manual override of the vision-model classification (auto: inputModalities). */
    vision?: boolean;
    /** Manual override of the thinking-model classification. */
    thinking?: boolean;
    /**
     * Manual confirmation of the supported effort levels. `false` marks a
     * non-reasoning model; a list names the levels the API accepts (rc.6-era
     * adapters may then advertise missing ones, e.g. `low`). Absent keeps the
     * adapter-advertised list.
     */
    efforts?: false | Exclude<EffortId, 'auto'>[];
    /**
     * Declared context-window limit in tokens (2000–1_000_000). Declaration-only:
     * the runtime harness reads it from the llm-pi-ai model entry, so this
     * override is a validated config-surface declaration.
     */
    contextWindow?: number;
}
/** Plugin settings. */
export interface ThinkingLevelsConfig {
    enabled: boolean;
    /** User-selected level: off / on / minimal / low / medium / high / xhigh / max fix the wire level; `auto` schedules per step. */
    level: EffortId;
    /** Scheduler preference: allow dropping below the `high` hub. */
    allowDowngrade: boolean;
    /** Scheduler preference: allow lifting above the `high` hub to `max`. */
    allowUpgrade: boolean;
    /** Configurer-confirmed capability overrides, keyed `provider/model`. */
    models: Record<string, ModelCapabilityOverride>;
}
/**
 * Composition-entry schema: what a dsh profile may configure at assembly
 * time (cordis.yml `config:` of the plugin row). The settings namespace
 * reuses the same schema, so a value admitted at one surface is admitted
 * at the other.
 */
export declare const Config: z<ThinkingLevelsConfig>;
/** Settings defaults, kept in lockstep with the schema defaults above. */
export declare const DEFAULT_CONFIG: ThinkingLevelsConfig;
/** Runtime-adjustable settings namespace: level + scheduler toggles. */
export declare const THINKING_LEVELS_SETTINGS_NAMESPACE = "thinking-levels";
/**
 * Plugin body.
 * @param ctx - host context carrying the agent-event dispatch.
 * @param config - resolved plugin configuration.
 */
export declare function apply(ctx: Context, config?: ThinkingLevelsConfig): void;
