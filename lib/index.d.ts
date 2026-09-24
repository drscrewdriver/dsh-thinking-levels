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
 * - `session.events` (agent.session) carries the step's tool/call records; the
 *   auto scheduler PULLS the recent calls from there at request time
 *   (`recentToolCalls`). There is no `agent/tool` push event in DSH — the
 *   scope-event registry (`packages/core/scope/src/scoped-events.generated.ts`)
 *   lists no such name in 0.1.1-rc.2 or 0.1.2-rc.1, so tool recognition must
 *   stay a pull from `session.events`.
 * - declarative settings (DSH 0.1.7+): the runtime-adjustable `Config` fields
 *   are marked `.volatile()`, the host generates the settings form from the
 *   schema alone, and the plugin reads the live values per request.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Volatile } from '@deepseek-ai/cosmokit';
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
    /** On a DSH 0.1.7+ host the schema's `.volatile()` fields arrive as live refs — read them through `readVolatile`. */
    enabled: boolean | Volatile<boolean>;
    /** User-selected level: off / on / minimal / low / medium / high / xhigh / max fix the wire level; `auto` schedules per step. */
    level: EffortId | Volatile<EffortId>;
    /** Scheduler preference: allow dropping below the `high` hub. */
    allowDowngrade: boolean | Volatile<boolean>;
    /** Scheduler preference: allow lifting above the `high` hub to `max`. */
    allowUpgrade: boolean | Volatile<boolean>;
    /** Configurer-confirmed capability overrides, keyed `provider/model`. */
    models: Record<string, ModelCapabilityOverride>;
}
/**
 * Composition-entry schema: what a dsh profile may configure at assembly
 * time (cordis.yml `config:` of the plugin row). The same schema doubles as
 * the settings surface: DSH 0.1.7 renders the plugin's settings form from the
 * `.volatile()` fields alone (no registration call), and hands `apply` the
 * validated entry with those fields as live `Volatile` refs.
 */
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
    enabled: z<boolean, boolean, "volatile-defined">;
    level: z<"off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "auto", "off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "auto", "volatile-defined">;
    allowDowngrade: z<boolean, boolean, "volatile-defined">;
    allowUpgrade: z<boolean, boolean, "volatile-defined">;
    models: z<import("@deepseek-ai/cosmokit").Dict<{
        vision?: boolean | null | undefined;
        thinking?: boolean | null | undefined;
        efforts?: false | ("off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max")[] | null | undefined;
        contextWindow?: number | null | undefined;
    } & import("@deepseek-ai/cosmokit").Dict, string>, import("@deepseek-ai/cosmokit").Dict<Schemastery.ObjectT<NoInfer<{
        vision: z<boolean, boolean, "plain">;
        thinking: z<boolean, boolean, "plain">;
        efforts: z<false | ("off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max")[], false | ("off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max")[], "plain">;
        contextWindow: z<number, number, "plain">;
    }>>, string>, "defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    enabled: z<boolean, boolean, "volatile-defined">;
    level: z<"off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "auto", "off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "auto", "volatile-defined">;
    allowDowngrade: z<boolean, boolean, "volatile-defined">;
    allowUpgrade: z<boolean, boolean, "volatile-defined">;
    models: z<import("@deepseek-ai/cosmokit").Dict<{
        vision?: boolean | null | undefined;
        thinking?: boolean | null | undefined;
        efforts?: false | ("off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max")[] | null | undefined;
        contextWindow?: number | null | undefined;
    } & import("@deepseek-ai/cosmokit").Dict, string>, import("@deepseek-ai/cosmokit").Dict<Schemastery.ObjectT<NoInfer<{
        vision: z<boolean, boolean, "plain">;
        thinking: z<boolean, boolean, "plain">;
        efforts: z<false | ("off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max")[], false | ("off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max")[], "plain">;
        contextWindow: z<number, number, "plain">;
    }>>, string>, "defined">;
}>>, "plain">;
/** Settings defaults, kept in lockstep with the schema defaults above. */
export declare const DEFAULT_CONFIG: ThinkingLevelsConfig;
/**
 * The `loader/volatile-update` event is emitted by the DSH 0.1.7+ loader when
 * a `.volatile()` config field changes (no plugin remount). The dev pins
 * predate the event, so the signature is augmented here — mirroring the host
 * runtime, which passes the changed config paths.
 */
declare module '@deepseek-ai/cordis' {
    interface Events {
        'loader/volatile-update': (paths: string[]) => void;
    }
}
/**
 * Read a `.volatile()` field: a live `Volatile` ref on a DSH 0.1.7+ host, a
 * plain value otherwise. `get()` may return undefined for an absent value, so
 * the schema default is the fallback.
 */
export declare function readVolatile<T>(value: T | Volatile<T> | undefined, fallback: T): T;
/**
 * Plugin body.
 * @param ctx - host context carrying the agent-event dispatch.
 * @param config - resolved plugin configuration.
 */
export declare function apply(ctx: Context, config?: ThinkingLevelsConfig): void;
