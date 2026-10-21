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
import { type PricingPolicy } from './billing-projection.ts';
import { type PiAiSection } from './takeover-sync.ts';
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
    /**
     * Master takeover switch: mirrored into the openai-completions transport's
     * own section (`llm-openai-completions.enabled`) when it flips. The
     * transport's dispatch judgment stays single-source in ITS section; this
     * flag is the control-layer UI for it.
     */
    takeover: boolean | Volatile<boolean>;
    /**
     * UI takeover switch (issues #3/#4): false (default) keeps the official
     * composer model popup — the `auto` mask still arrives through the adapter
     * advertisement below, and the official popup keeps its native search.
     * true seats the plugin's ModelPanel (which carries its own search box and
     * the intent/resolved effort chip).
     */
    takeoverUi: boolean | Volatile<boolean>;
    /** Configurer-confirmed capability overrides, keyed `provider/model`. */
    models: Record<string, ModelCapabilityOverride>;
    /**
     * 目录外模型的计价兜底档（price-catalog 未命中时生效）：estimate/cn/global/custom/off。
     * 缺省 estimate（典型价兜底估算，显示「未校准·仅供参考」）；off 才是真不计价；
     * 目录内模型自动按条目地区计价，不受本项影响。
     */
    defaultPricing: PricingPolicy | Volatile<PricingPolicy>;
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
    takeover: z<boolean, boolean, "volatile-defined">;
    takeoverUi: z<boolean, boolean, "volatile-defined">;
    defaultPricing: z<"estimate" | "cn" | "global" | "custom" | "off", "estimate" | "cn" | "global" | "custom" | "off", "volatile-defined">;
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
    takeover: z<boolean, boolean, "volatile-defined">;
    takeoverUi: z<boolean, boolean, "volatile-defined">;
    defaultPricing: z<"estimate" | "cn" | "global" | "custom" | "off", "estimate" | "cn" | "global" | "custom" | "off", "volatile-defined">;
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
/**
 * Legacy (≤0.1.6) settings schema: the same fields WITHOUT the `.volatile()`
 * ref wrappers. The imperative `settings.register` resolver reads schemas
 * literally and rejects the 0.1.7 ref descriptors ("$.enabled expected
 * boolean but got [object Object]", live on cell 0.1.5) — the 3.x compat
 * branches shipped exactly this plain shape.
 */
export declare const LegacyConfig: z<Schemastery.ObjectS<NoInfer<{
    enabled: z<boolean, boolean, "defined">;
    level: z<"off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "auto", "off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "auto", "defined">;
    allowDowngrade: z<boolean, boolean, "defined">;
    allowUpgrade: z<boolean, boolean, "defined">;
    takeover: z<boolean, boolean, "defined">;
    takeoverUi: z<boolean, boolean, "defined">;
    defaultPricing: z<"estimate" | "cn" | "global" | "custom" | "off", "estimate" | "cn" | "global" | "custom" | "off", "defined">;
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
    enabled: z<boolean, boolean, "defined">;
    level: z<"off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "auto", "off" | "on" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "auto", "defined">;
    allowDowngrade: z<boolean, boolean, "defined">;
    allowUpgrade: z<boolean, boolean, "defined">;
    takeover: z<boolean, boolean, "defined">;
    takeoverUi: z<boolean, boolean, "defined">;
    defaultPricing: z<"estimate" | "cn" | "global" | "custom" | "off", "estimate" | "cn" | "global" | "custom" | "off", "defined">;
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
/** Minimal face of the llm service's adapter registrations (typed locally to avoid a host-package value import). */
interface LlmRegistration {
    adapter: {
        resolveModel: (provider: string, model: string, signal?: unknown) => Promise<{
            reasoning?: {
                efforts?: {
                    id: string;
                    name: string;
                }[];
            };
        }>;
    };
}
/**
 * Advertise `auto` (and, for configurer-confirmed rc.6-era models, `low`) in
 * the model directory: wrap every registered adapter's `resolveModel` so the
 * returned `reasoning.efforts` include the extra levels. Idempotent per
 * adapter. `auto` is a mask the plugin resolves per request; `low` is only
 * added when the model override confirms the level, so rc.7+ models (which
 * already advertise low) and unconfirmed models stay untouched.
 *
 * A thinking model WITHOUT effort support (Qwen3.6-style, per the llm-pi-ai
 * config: `reasoningEfforts` present but `compat.supportsReasoningEffort` not
 * true) gets its selector collapsed to a plain On/Off toggle: `off` disables
 * thinking, `on` maps to the `high` level, which pi-ai serializes as
 * `enable_thinking: true` under `thinkingFormat: qwen`. No auto/low masks are
 * offered for these — there is nothing to schedule.
 * @param llm - the resolved `llm` service, when present.
 * @param overrideFor - model override lookup, keyed `provider/model`.
 * @param piAiFor - llm-pi-ai config capability lookup, keyed `provider/model`.
 * (exported for the idempotence regression test, issue #4 — same precedent as
 * `installLegacySection`)
 */
export declare function advertiseModelCapability(llm: {
    adapters?: Map<string, LlmRegistration>;
} | undefined, overrideFor: (provider: string, model: string) => ModelCapabilityOverride | undefined, piAiFor: (provider: string, model: string) => {
    thinkingOn: boolean;
    supportsEffort: boolean;
} | undefined): void;
/**
 * The llm-pi-ai posture of one model, from the live llm-pi-ai section
 * (the capability card writes `reasoningEfforts` and `compat` there). Absent
 * when the route/model is not configured.
 *
 * A model is toggle-only (Off/On, no effort levels) only when ALL THREE hold:
 * the model declares a thinking toggle (reasoningEfforts table, no
 * supportsReasoningEffort), the route is taken over by the transport (it is in
 * the takeover judgment), AND the route speaks the openai-completions wire
 * protocol. The Off/On fold exists because a completions toggle model rejects
 * any `reasoning_effort` string pi-ai does not resolve to its fixed seven
 * levels; that physical reason does NOT apply to a Responses/Anthropic route,
 * whose levels pi-ai maps natively (thinking budget / reasoning-effort enum)
 * and whose `supportsReasoningEffort` compat field the host refuses to write
 * at all (4.4.4). Folding such a route would silently strip the configured
 * level set down to Off/On. A route OUTSIDE the takeover judgment is likewise
 * served by pi-ai with its native reasoning semantics and is NOT folded here.
 * (exported for the protocol-gate regression, issue #9 — same precedent as
 * `advertiseModelCapability`)
 */
export declare function piAiPosture(piAi: PiAiSection | undefined, provider: string, model: string, takeover: string[] | null): {
    thinkingOn: boolean;
    supportsEffort: boolean;
} | undefined;
/**
 * Legacy (≤0.1.6) settings registration: on hosts whose settings service
 * carries the imperative face (`register` present, `describe` absent), install
 * this plugin's section so its config is runtime-editable and the live values
 * feed `current()`. On 0.1.7+ the composition entry IS the section (the
 * `.volatile()` fields arrive as live refs) and `register` no longer exists —
 * the install is a no-op there. Shape-detected, never version-guessed.
 */
export declare function installLegacySection(ctx: Context, config: ThinkingLevelsConfig, hooks: {
    setSource: (source: () => ThinkingLevelsConfig) => void;
}): void;
/**
 * Plugin body.
 * @param ctx - host context carrying the agent-event dispatch.
 * @param config - resolved plugin configuration.
 */
export declare function apply(ctx: Context, config?: ThinkingLevelsConfig): void;
export {};
