/**
 * Auto-flag sync (check branch): bridge from dsh-thinking-levels to the
 * OFFICIAL llm-pi-ai compat surface.
 *
 * CHECK-BRANCH REPLACEMENT: the previous bridge maintained the
 * `llm-openai-completions` takeover list of the dsh-llm-openai-completions
 * adapter plugin (the short-circuit route). Since dsh v0.1.0-rc.8 the official
 * `compat.supportsDeveloperRole` flag (commit 884f7b9c41) fixes the developer
 * role 400 declaratively, so the short-circuit list is no longer needed: the
 * sync now writes the flag into the OFFICIAL `llm-pi-ai` namespace instead.
 *
 * Storage pattern learned from hytime/dsh-thinking-effort's host side
 * (src/host/settings.ts): read the live section → pure transform with
 * immutable clones → `settings.update('llm-pi-ai', { providers })` whole-section
 * writeback, so dsh's `llm-pi-ai` schema validator (assertServiceable) gates
 * the write where it is WRITTEN (settings-rejected names route and model)
 * instead of storing something the reader cannot serve. The flag is written at
 * the ROUTE level (`providers.<route>.compat`) — the official inheritance chain
 * (model → provider → catalog → protocol) means a model-level explicit value
 * still wins, and explicit values are never clobbered by this sync.
 *
 * Identification is unchanged: a provider that (a) targets a custom
 * openai-completions gateway and (b) declares thinking (a reasoningEfforts
 * table) is exactly the route the short-circuit used to take over. Pure
 * functions here are unit-tested; the host plugin wires them to the settings
 * service.
 *
 * Deliberately soft-coupled: nothing here value-imports dsh-settings. If the
 * installed dsh predates rc.8 the schema rejects the unknown field and the
 * host catches and logs the rejection — no error, no log spam.
 * @module dsh-thinking-levels/takeover-sync
 */
/** The settings namespace holding the provider/model configs (llm-pi-ai). */
export declare const PI_AI_NAMESPACE = "llm-pi-ai";
/** The settings namespace of the retired short-circuit adapter, still READ to gate posture. */
export declare const TAKEOVER_NAMESPACE = "llm-openai-completions";
/** One model row of the llm-pi-ai section (minimal face). */
export interface PiAiModelRow {
    id?: unknown;
    reasoningEfforts?: unknown;
    compat?: unknown;
}
/** One provider profile of the llm-pi-ai section (minimal face). */
export interface PiAiProviderProfile {
    api?: unknown;
    baseURL?: unknown;
    models?: unknown;
    compat?: unknown;
    /** Other profile fields (apiKeyEnv, displayName, …) exist but are unused. */
    [key: string]: unknown;
}
/** The llm-pi-ai section slice this module reads and transforms. */
export interface PiAiSection {
    providers?: Record<string, PiAiProviderProfile>;
}
/**
 * Whether a provider profile targets a CUSTOM openai-completions gateway:
 * explicit `api: openai-completions`, or a baseURL that is not an official
 * host. Catalog routes without either (e.g. xiaomi via pi-ai discovery) are
 * not custom and are left alone.
 * @param profile - the provider profile slice.
 * @returns true when the route is a custom openai-completions gateway.
 */
export declare function isCustomOpenAiGateway(profile: PiAiProviderProfile | undefined): boolean;
/**
 * Whether a provider declares thinking: at least one model row carries a
 * reasoningEfforts table (thinking on). `false` (thinking off) and absent
 * both mean no thinking.
 * @param profile - the provider profile slice.
 * @returns true when any model declares a reasoningEfforts table.
 */
export declare function declaresThinking(profile: PiAiProviderProfile | undefined): boolean;
/**
 * Identify the providers that should be taken over by the openai-completions
 * adapter: custom gateway AND thinking declared. Order is stable (the section's
 * own provider order).
 * @param section - the live llm-pi-ai section.
 * @returns the provider ids to add to the takeover list.
 */
export declare function identifyTakeoverProviders(section: PiAiSection | undefined): string[];
/**
 * Compute the llm-pi-ai section with the OFFICIAL compat fixes written for
 * every identified provider (custom openai-completions gateway AND thinking
 * declared):
 *
 * 1. ROUTE level: `compat.supportsDeveloperRole: false` when the route does
 *    not carry an explicit value — the system prompt goes out as `system`
 *    (fixes the Unexpected message role 400 on vLLM/SGLang gateways).
 * 2. MODEL level: `compat.thinkingFormat: 'qwen-chat-template'` on TOGGLE-STYLE thinking
 *    model rows (a reasoningEfforts table, no row-level
 *    `supportsReasoningEffort: true`, no explicit thinkingFormat) — pi-ai
 *    then sends the `enable_thinking` flag these early vLLM thinking models
 *    need, instead of a reasoning_effort they do not support. Effort-capable
 *    rows are untouched (their reasoning_effort wire needs the default/openai
 *    or declared format), and the route level is deliberately NOT written —
 *    a route-wide thinkingFormat would flip effort models onto
 *    enable_thinking too.
 *
 * Semantics (learned from dsh-thinking-effort's storage handling):
 * - An EXPLICIT value on any layer is respected and left alone; only ABSENT
 *   fields are filled. This keeps the sync idempotent and never overrides
 *   user intent.
 * - Immutable: unchanged profiles/rows and the unchanged section are returned
 *   by reference, so the host can skip the write on identity.
 * @param section - the live llm-pi-ai section.
 * @returns the next section, or the previous value (identity) when no change.
 */
export declare function withOfficialCompatFixes(section: PiAiSection | undefined): PiAiSection | undefined;
/**
 * The settings patch to sync this plugin's takeover switch into the
 * transport's own section, or `undefined` when nothing may be written:
 * the transport is not composed (no section to drive — its `enabled` simply
 * does not exist), or the section already agrees (identity). Cross-plugin
 * writes are schema-gated at the WRITE site (the target field must be
 * volatile in the owning plugin's Config — `enabled` is), not
 * caller-gated; this plugin never writes anything but `enabled` there, so
 * the user's manual `providers` list and every other field are untouched.
 * @param section - the live llm-openai-completions section, if composed.
 * @param flag - this plugin's takeover switch.
 * @returns the minimal patch, or `undefined` when no write is due.
 */
export declare function takeoverPatch(section: {
    enabled?: unknown;
} | undefined, flag: boolean): {
    enabled: boolean;
} | undefined;
/**
 * The routes the openai-completions transport currently takes over, from its
 * live settings section plus the llm-pi-ai data plane. The section's
 * `enabled` flag is the single source of truth (the transport's own switch);
 * the judgment unions the section's MANUAL `providers` list with the routes
 * auto-identified from llm-pi-ai (custom openai-completions gateway AND
 * thinking declared) — the same union the transport itself applies at
 * dispatch, so this plugin's gating cannot drift from the actual takeover.
 * @param section - the live llm-openai-completions section, if composed.
 * @param piAi - the live llm-pi-ai section, if composed.
 * @returns the taken-over route ids, `[]` when the transport is disabled, or
 *   `null` when the transport is not composed (namespace absent — every route
 *   keeps pi-ai's native reasoning semantics).
 */
export declare function takeoverRoutesOf(section: {
    enabled?: unknown;
    providers?: unknown;
} | undefined, piAi: PiAiSection | undefined): string[] | null;
