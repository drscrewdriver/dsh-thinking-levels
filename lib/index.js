import z from '@deepseek-ai/schemastery';
import { assertEffortId, reasoningEffortSupported, resolveEffortInjection } from "./thinking-level.js";
import { buildBillingDefinition } from "./billing-projection.js";
import { recentToolCalls } from "./session-events.js";
import { CONTEXT_WINDOW_MAX, CONTEXT_WINDOW_MIN } from "./context-window.js";
import { PI_AI_NAMESPACE, TAKEOVER_NAMESPACE_CANDIDATES, takeoverPatch, takeoverRoutesOf, withOfficialCompatFixes, } from "./takeover-sync.js";
import { describeSettings, readSection, readSectionOf, resolveNamespaceOf } from "./settings-read.js";
const effortId = z.union(['off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']);
/** Per-model capability overrides — shared verbatim by both schema faces
 * below (the two must never drift). */
const modelsSchema = z.dict(z.object({
    // schemastery fields are optional unless marked `.required()`.
    vision: z.boolean(),
    thinking: z.boolean(),
    efforts: z.union([z.const(false), z.array(effortId)]),
    contextWindow: z.number().step(1).min(CONTEXT_WINDOW_MIN).max(CONTEXT_WINDOW_MAX),
})).default({});
/**
 * Composition-entry schema: what a dsh profile may configure at assembly
 * time (cordis.yml `config:` of the plugin row). The same schema doubles as
 * the settings surface: DSH 0.1.7 renders the plugin's settings form from the
 * `.volatile()` fields alone (no registration call), and hands `apply` the
 * validated entry with those fields as live `Volatile` refs.
 */
export const Config = z.object({
    enabled: z.boolean().default(true).volatile(),
    level: z.union(['off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto']).default('auto').volatile(),
    allowDowngrade: z.boolean().default(true).volatile(),
    allowUpgrade: z.boolean().default(false).volatile(),
    takeover: z.boolean().default(false).volatile(),
    models: modelsSchema,
});
/**
 * Legacy (≤0.1.6) settings schema: the same fields WITHOUT the `.volatile()`
 * ref wrappers. The imperative `settings.register` resolver reads schemas
 * literally and rejects the 0.1.7 ref descriptors ("$.enabled expected
 * boolean but got [object Object]", live on cell 0.1.5) — the 3.x compat
 * branches shipped exactly this plain shape.
 */
export const LegacyConfig = z.object({
    enabled: z.boolean().default(true),
    level: z.union(['off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto']).default('auto'),
    allowDowngrade: z.boolean().default(true),
    allowUpgrade: z.boolean().default(false),
    takeover: z.boolean().default(false),
    models: modelsSchema,
});
/** Settings defaults, kept in lockstep with the schema defaults above. */
export const DEFAULT_CONFIG = {
    enabled: true,
    level: 'auto',
    allowDowngrade: true,
    allowUpgrade: false,
    takeover: false,
    models: {},
};
/**
 * Read a `.volatile()` field: a live `Volatile` ref on a DSH 0.1.7+ host, a
 * plain value otherwise. `get()` may return undefined for an absent value, so
 * the schema default is the fallback.
 */
export function readVolatile(value, fallback) {
    if (value !== null && typeof value === 'object' && typeof value.get === 'function') {
        const snapshot = value.get();
        return (snapshot === undefined ? fallback : snapshot);
    }
    return value ?? fallback;
}
/**
 * Resolve the live configuration snapshot: the runtime-adjustable fields are
 * read through their (possibly volatile) composition-entry values on every
 * call, so a committed settings change applies to the next request without a
 * plugin remount.
 */
function resolveLiveConfig(config) {
    return {
        enabled: readVolatile(config.enabled, true),
        level: readVolatile(config.level, 'auto'),
        allowDowngrade: readVolatile(config.allowDowngrade, true),
        allowUpgrade: readVolatile(config.allowUpgrade, false),
        takeover: readVolatile(config.takeover, false),
        models: config.models,
    };
}
/**
 * The `auto` mask shown in the model directory: a user-facing level that is
 * never sent to the API — the plugin resolves it to a wire level per request.
 * It is injected into the adapter's `reasoning.efforts` so the model selector
 * offers it, and `resolveCallFor` accepts it until this plugin's request
 * interceptor substitutes the resolved wire level.
 */
const AUTO_EFFORT = { id: 'auto', name: 'Auto' };
/**
 * The `low` level, advertised only for configurer-confirmed models whose
 * adapter predates dsh rc.7 (efforts list without `low`). Advertising it makes
 * the selector show Low and the harness request validation admit the
 * passthrough; the adapter must serialize it (pi-ai openai-completions does,
 * e.g. via `thinkingFormat: qwen` → enable_thinking + thinking_budget).
 */
const LOW_EFFORT = { id: 'low', name: 'Low' };
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
 */
function advertiseModelCapability(llm, overrideFor, piAiFor) {
    for (const registration of llm?.adapters?.values() ?? []) {
        const adapter = registration.adapter;
        const original = adapter.resolveModel.bind(adapter);
        adapter.resolveModel = async (provider, model, signal) => {
            const info = await original(provider, model, signal);
            const reasoning = info.reasoning;
            if (reasoning === undefined)
                return info;
            const piCap = piAiFor(provider, model);
            if (piCap?.thinkingOn === true && piCap.supportsEffort === false) {
                // Toggle-only model (Qwen3.6 / mimo-v2.5 style): the selector shows
                // Off/On. The On pick MUST be a level the provider's own request path
                // accepts — pi-ai resolves only its fixed seven levels and rejects
                // anything else per stream (`UNSUPPORTED_REASONING_EFFORT`). `high` is
                // that level: because the model declares supportsReasoningEffort:
                // false, pi-ai serializes a non-off effort as enable_thinking only —
                // no reasoning_effort is sent, which is exactly the toggle semantics.
                info.reasoning = {
                    ...reasoning,
                    efforts: [
                        { id: 'off', name: 'Off' },
                        { id: 'high', name: 'On' },
                    ],
                };
                return info;
            }
            const efforts = [...(reasoning.efforts ?? [])];
            if (!efforts.some(effort => effort.id === 'auto'))
                efforts.push(AUTO_EFFORT);
            const override = overrideFor(provider, model);
            if (override?.efforts !== undefined
                && override.efforts !== false
                && override.efforts.includes('low')
                && !efforts.some(effort => effort.id === 'low')) {
                efforts.push(LOW_EFFORT);
            }
            info.reasoning = { ...reasoning, efforts };
            return info;
        };
    }
}
/**
 * One `describe()` pass, two namespaces: the taken-over routes (transport
 * section judgment) and the llm-pi-ai section for the posture lookup.
 * `describe()` replaces the dead `settings?.get?.()` soft reads —
 * `SettingsForms` has no `get`.
 */
function takeoverReadout(ctx) {
    const descriptors = describeSettings(ctx);
    // The transport's composition entry id changed shape across its packaging
    // history — settle on whichever namespace the describe document carries.
    const section = resolveNamespaceOf(descriptors, TAKEOVER_NAMESPACE_CANDIDATES)?.value;
    const piAi = readSectionOf(descriptors, PI_AI_NAMESPACE)?.value;
    return { routes: takeoverRoutesOf(section), piAi };
}
/**
 * The llm-pi-ai posture of one model, from the live llm-pi-ai section
 * (the capability card writes `reasoningEfforts` and `compat` there). Absent
 * when the route/model is not configured.
 *
 * A model is toggle-only (Off/On, no effort levels) only when BOTH the model
 * declares a thinking toggle (reasoningEfforts table, no
 * supportsReasoningEffort) AND the route is taken over by the
 * openai-completions transport (it is in the takeover judgment). A route
 * OUTSIDE the takeover judgment is served by pi-ai with its native
 * reasoning semantics — off/high stay visible and pi-ai validates the
 * effort — so it is NOT folded into a toggle here.
 */
function piAiPosture(piAi, provider, model, takeover) {
    const rows = Array.isArray(piAi?.providers?.[provider]?.models)
        ? piAi.providers[provider].models
        : [];
    const entry = rows.find(candidate => candidate['id'] === model);
    if (entry === undefined)
        return undefined;
    const efforts = entry['reasoningEfforts'];
    const compat = entry['compat'];
    const thinkingOn = typeof efforts === 'object' && efforts !== null && !Array.isArray(efforts);
    const supportsEffort = typeof compat === 'object' && compat !== null
        && compat['supportsReasoningEffort'] === true;
    // Toggle folding is a takeover-judgment concern: only the openai-completions
    // transport's routes get the Off/On treatment. pi-ai-served routes keep their
    // native effort levels (off/high visible).
    const toggled = takeover !== null && takeover.includes(provider);
    return { thinkingOn: thinkingOn && toggled, supportsEffort };
}
const CAPABILITY_CACHE_KEY_SEPARATOR = '\u0000';
/** A model that cannot be resolved is treated as non-reasoning: never inject. */
const UNRESOLVABLE_CAPABILITY = { supportsReasoning: false, efforts: [], vision: false, toggleOnly: false };
/** Runtime model-capability lookup with a per-route cache. */
function capabilityResolver(ctx) {
    const cache = new Map();
    return {
        async resolve(provider, model) {
            if (typeof provider !== 'string' || typeof model !== 'string')
                return UNRESOLVABLE_CAPABILITY;
            const key = `${provider}${CAPABILITY_CACHE_KEY_SEPARATOR}${model}`;
            const cached = cache.get(key);
            if (cached !== undefined)
                return cached;
            const llm = ctx.get('llm');
            let capability;
            try {
                const info = await llm?.resolveModelInfo?.(provider, model);
                const efforts = info?.reasoning?.efforts?.map(effort => effort.id) ?? [];
                const readout = takeoverReadout(ctx);
                const posture = piAiPosture(readout.piAi, provider, model, readout.routes);
                capability = {
                    supportsReasoning: reasoningEffortSupported(info?.reasoning),
                    efforts,
                    vision: Array.isArray(info?.inputModalities) && info.inputModalities.includes('image'),
                    toggleOnly: posture?.thinkingOn === true && posture.supportsEffort === false,
                };
            }
            catch {
                capability = UNRESOLVABLE_CAPABILITY;
            }
            cache.set(key, capability);
            return capability;
        },
        clear() {
            cache.clear();
        },
    };
}
/** The registered settings namespace of the ≤0.1.6 era. */
const THINKING_LEVELS_SETTINGS_NAMESPACE = 'thinking-levels';
/**
 * Legacy (≤0.1.6) settings registration: on hosts whose settings service
 * carries the imperative face (`register` present, `describe` absent), install
 * this plugin's section so its config is runtime-editable and the live values
 * feed `current()`. On 0.1.7+ the composition entry IS the section (the
 * `.volatile()` fields arrive as live refs) and `register` no longer exists —
 * the install is a no-op there. Shape-detected, never version-guessed.
 */
export function installLegacySection(ctx, config, hooks) {
    const inject = ctx.inject;
    if (typeof inject !== 'function')
        return;
    inject.call(ctx, ['settings'], (sctx) => {
        const settings = sctx.settings;
        console.log(`[dsh-thinking-levels] settings service face: register=${typeof settings?.register} installSection=${typeof settings?.installSection} describe=${typeof settings?.describe}`);
        // `register`'s presence IS the imperative face (≤0.1.6). `describe` must
        // NOT be read as a declarative-generation marker: the webServer mirror
        // carries describe/mutate on EVERY generation (三代腰 finding —
        // mutate/describe 四代全在), so the old `describe → skip` clause silently
        // disabled this install on 0.1.2/0.1.5 too, leaving the namespace
        // unregistered and every settingsScope.bind('thinking-levels') read
        // `unavailable` forever.
        if (typeof settings?.register !== 'function')
            return;
        try {
            // The loader hands `apply` its config through the entry schema — the
            // volatile-shaped `Config` on EVERY generation — so the runtime values
            // sit behind live refs even on hosts taking the imperative register
            // path. Flatten to plain values for the legacy resolver's base layer
            // ("$.enabled expected boolean but got [object Object]", live on cell
            // 0.1.5, was the ref riding in as the base).
            const plainBase = {
                enabled: readVolatile(config.enabled, true),
                level: readVolatile(config.level, 'auto'),
                allowDowngrade: readVolatile(config.allowDowngrade, true),
                allowUpgrade: readVolatile(config.allowUpgrade, false),
                takeover: readVolatile(config.takeover, false),
                models: config.models,
            };
            const scope = settings.register(THINKING_LEVELS_SETTINGS_NAMESPACE, LegacyConfig, { base: plainBase });
            console.log('[dsh-thinking-levels] settings via settings.register (≤0.1.6 imperative face)');
            hooks.setSource(() => scope.get());
            sctx.effect(() => () => {
                hooks.setSource(() => config);
            });
            scope.watch?.(() => { });
        }
        catch (error) {
            console.log(`[dsh-thinking-levels] settings.register FAILED: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}
/**
 * Plugin body.
 * @param ctx - host context carrying the agent-event dispatch.
 * @param config - resolved plugin configuration.
 */
export function apply(ctx, config = DEFAULT_CONFIG) {
    // Fail-loud: a stray config value (e.g. `medium` from an old profile) must
    // not ride through into the model request, where dsh throws
    // UNSUPPORTED_REASONING_EFFORT per request.
    assertEffortId(resolveLiveConfig(config).level, 'dsh-thinking-levels config.level');
    // Runtime-adjustable configuration: volatile refs on 0.1.7+, the registered
    // section before that — both re-read per request, so a committed settings
    // change needs no re-registration. The ≤0.1.6 registered section (user edits
    // layered over the entry base) wins when installed.
    let source = () => config;
    installLegacySection(ctx, config, { setSource: (next) => { source = next; } });
    ctx.inject?.(['sessionProjections'], (scope) => {
        scope.sessionProjections?.register(buildBillingDefinition());
    });
    const current = () => resolveLiveConfig(source());
    ctx.on('loader/volatile-update', () => {
        assertEffortId(resolveLiveConfig(config).level, 'dsh-thinking-levels config.level');
        // A flipped takeover switch mirrors immediately (identity-gated).
        syncTakeover();
    });
    // Official-compat bridge (check branch): write the OFFICIAL compat surface
    // into the llm-pi-ai namespace for every provider that targets a custom
    // openai-completions gateway AND declares thinking (reasoningEfforts table):
    // route-level `supportsDeveloperRole: false` plus model-level
    // `thinkingFormat: qwen` on toggle-style thinking rows. This replaces the
    // retired short-circuit route (maintaining the dsh-llm-openai-completions
    // takeover list): since dsh v0.1.0-rc.8 the declarative compat fixes the
    // developer-role 400 AND drives enable_thinking at the pi-ai adapter itself,
    // so pi-ai keeps serving the route and no transport takeover is needed.
    // Storage pattern follows
    // hytime/dsh-thinking-effort's host side: read → pure transform (identity
    // when nothing to change) → whole-section update, so dsh's llm-pi-ai schema
    // validator gates the write where it is WRITTEN; an installed dsh predating
    // rc.8 rejects the unknown field and we log and keep the previous section.
    // The read is lazy and writes are queued by the service, so no race with a
    // concurrent Settings → Models edit.
    let syncTail = Promise.resolve();
    const syncDeveloperRole = () => {
        syncTail = syncTail.then(async () => {
            const settings = ctx.get('settings');
            // describe() is the only read channel on 0.1.7+ (SettingsForms has no
            // `get`); the section value is the schema-projected live config.
            const piAi = readSection(ctx, PI_AI_NAMESPACE)?.value;
            const next = withOfficialCompatFixes(piAi);
            if (next === undefined || next === piAi)
                return;
            await settings?.update?.(PI_AI_NAMESPACE, { providers: next.providers });
            ctx.logger?.info?.('[thinking-levels] official-compat: supportsDeveloperRole=false (route) and thinkingFormat=qwen (toggle-style models) written to llm-pi-ai for custom thinking routes');
        }).catch((error) => {
            ctx.logger?.warn?.('[thinking-levels] developer-role compat sync rejected (schema gate); kept previous section', error);
        });
    };
    // Takeover mirror: this plugin's `takeover` switch (settings UI) is the
    // control-layer master; the write lands in the transport's OWN section
    // (`llm-openai-completions.enabled`), whose judgment stays single-source.
    // Cross-plugin writes are schema-gated at the write site (the transport's
    // `enabled` is volatile) and never touch its other fields. Writes fire only
    // on divergence (transport absent = nothing to drive), so a manual edit of
    // the transport section survives until the switch is actually flipped again.
    const syncTakeover = () => {
        syncTail = syncTail.then(async () => {
            // Resolve the transport's LIVE namespace from the describe document
            // (the entry id changed shape across its packaging history) — the read
            // and the mirror write land on the same settled id.
            const transport = resolveNamespaceOf(describeSettings(ctx), TAKEOVER_NAMESPACE_CANDIDATES);
            const patch = takeoverPatch(transport?.value, current().takeover);
            if (patch === undefined || transport === undefined)
                return;
            const settings = ctx.get('settings');
            await settings?.update?.(transport.ns, patch);
            ctx.logger?.info?.('[thinking-levels] takeover switch %s written to %s.enabled', String(current().takeover), transport.ns);
        }).catch((error) => {
            ctx.logger?.warn?.('[thinking-levels] takeover mirror write rejected (schema gate); kept previous section', error);
        });
    };
    // Initial sync (adapters may register later; re-run on every adapters update
    // and every llm-pi-ai settings update so a Settings → Models edit propagates.
    // The write is identity-gated, so the re-entry triggered by our own update
    // settles immediately).
    syncDeveloperRole();
    syncTakeover();
    const onSyncAny = ctx.on;
    onSyncAny('llm/adapters-updated', () => {
        syncDeveloperRole();
        syncTakeover();
    });
    onSyncAny('settings/document-updated', (ns) => {
        if (ns === PI_AI_NAMESPACE)
            syncDeveloperRole();
        // Any settings commit re-checks the mirror (identity-gated); the write we
        // just made re-enters here and settles without a second write.
        syncTakeover();
    });
    // Inject the level decision into every model request of a step.
    // The 'agent/request' event key is augmented onto cordis Events by the
    // dsh-agent runtime's generated scope types; the npm package does not
    // re-export that augmentation, so the emitter is widened at the boundary.
    //
    // prepend: the host's model-selection assembly also listens on this event and
    // overwrites `reasoningEffort` with the session's selection after `next()`;
    // registering first keeps this plugin's decision OUTERMOST so it runs last.
    const on = ctx.on;
    // Model capability snapshots, cached per provider/model and cleared whenever
    // the adapter registry changes (a route's reasoning metadata can move).
    const capability = capabilityResolver(ctx);
    on('agent/request', async (payload, next) => {
        const seed = await next();
        const cfg = current();
        // `enabled` may flip at runtime through the settings namespace.
        if (!cfg.enabled)
            return seed;
        // Model-aware guard: never send a reasoning effort to a model that does
        // not advertise one (custom openai-completions routes such as Qwen3.6).
        // Unsupported fields are stripped, not sent; a resolved low/auto schedule
        // only ever reaches models whose metadata admits the level.
        const capabilityFor = await capability.resolve(seed.provider, seed.model);
        const calls = recentToolCalls(payload.agent);
        const decision = resolveEffortInjection({
            supportsReasoning: capabilityFor.supportsReasoning,
            seedEffort: seed.reasoningEffort,
            selected: cfg.level,
            recentCalls: calls,
            allowDowngrade: cfg.allowDowngrade,
            allowUpgrade: cfg.allowUpgrade,
            efforts: capabilityFor.efforts,
            toggleOnly: capabilityFor.toggleOnly,
        });
        if (!decision.inject) {
            // The model cannot take any effort: drop an inherited one so dsh does
            // not reject the request (UNSUPPORTED_REASONING_EFFORT).
            const stripped = { ...seed };
            delete stripped.reasoningEffort;
            ctx.logger?.info?.('[thinking-levels] agent/request: model=%s/%s has no reasoning effort; stripped', String(seed.provider), String(seed.model));
            return stripped;
        }
        // Summary-only log: individual tool names/arg sizes are workflow metadata
        // that need not land in the host log; count and decision suffice.
        ctx.logger?.info?.('[thinking-levels] agent/request: model=%s/%s selected=%s calls=%d => level=%s', String(seed.provider), String(seed.model), String(seed.reasoningEffort), calls.length, decision.level);
        return { ...seed, reasoningEffort: decision.level };
    }, { prepend: true });
    // Advertise the `auto` mask (and, for configurer-confirmed rc.6-era models,
    // `low`) in the model directory so the session model selector offers them
    // alongside the adapter's native levels. Adapters may register after this
    // plugin's apply (the load order differs between the CLI and DSH Desktop),
    // so the wrapper also re-runs on every `llm/adapters-updated`.
    const llm = ctx.get('llm');
    const overrideFor = (provider, model) => current().models[`${provider}/${model}`];
    // Read the live llm-pi-ai config for the thinking/effort posture the card
    // wrote there: a model with `reasoningEfforts` but without effort support
    // (Qwen3.6) is collapsed to an On/Off toggle in the selector — but ONLY when
    // the route is taken over by the openai-completions transport. A pi-ai-served
    // route (e.g. mimo via xiaomi) keeps its native off/high levels.
    const piAiFor = (provider, model) => {
        const readout = takeoverReadout(ctx);
        return piAiPosture(readout.piAi, provider, model, readout.routes);
    };
    advertiseModelCapability(llm, overrideFor, piAiFor);
    const onAny = ctx.on;
    onAny('llm/adapters-updated', () => {
        capability.clear();
        advertiseModelCapability(ctx.get('llm'), overrideFor, piAiFor);
    });
    // A settings commit can flip the takeover judgment (the transport's enabled
    // flag or the llm-pi-ai routes): drop the cached capability snapshots so
    // toggle folding follows the new posture on the next request.
    onAny('settings/document-updated', () => {
        capability.clear();
    });
}
