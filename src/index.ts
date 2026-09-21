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
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { assertEffortId, reasoningEffortSupported, resolveEffortInjection, type EffortId } from './thinking-level.ts'
import { recentToolCalls } from './session-events.ts'
import { CONTEXT_WINDOW_MAX, CONTEXT_WINDOW_MIN } from './context-window.ts'
import {
  PI_AI_NAMESPACE,
  TAKEOVER_NAMESPACE,
  takeoverProvidersOf,
  withOfficialCompatFixes,
  type PiAiSection,
} from './takeover-sync.ts'

/** One configurer-confirmed capability override for a `provider/model` key. */
export interface ModelCapabilityOverride {
  /** Manual override of the vision-model classification (auto: inputModalities). */
  vision?: boolean
  /** Manual override of the thinking-model classification. */
  thinking?: boolean
  /**
   * Manual confirmation of the supported effort levels. `false` marks a
   * non-reasoning model; a list names the levels the API accepts (rc.6-era
   * adapters may then advertise missing ones, e.g. `low`). Absent keeps the
   * adapter-advertised list.
   */
  efforts?: false | Exclude<EffortId, 'auto'>[]
  /**
   * Declared context-window limit in tokens (2000–1_000_000). Declaration-only:
   * the runtime harness reads it from the llm-pi-ai model entry, so this
   * override is a validated config-surface declaration.
   */
  contextWindow?: number
}

/** Plugin settings. */
export interface ThinkingLevelsConfig {
  enabled: boolean
  /** User-selected level: off / on / minimal / low / medium / high / xhigh / max fix the wire level; `auto` schedules per step. */
  level: EffortId
  /** Scheduler preference: allow dropping below the `high` hub. */
  allowDowngrade: boolean
  /** Scheduler preference: allow lifting above the `high` hub to `max`. */
  allowUpgrade: boolean
  /** Configurer-confirmed capability overrides, keyed `provider/model`. */
  models: Record<string, ModelCapabilityOverride>
}

const effortId = z.union(['off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'])

/**
 * Composition-entry schema: what a dsh profile may configure at assembly
 * time (cordis.yml `config:` of the plugin row). The settings namespace
 * reuses the same schema, so a value admitted at one surface is admitted
 * at the other.
 */
export const Config: z<ThinkingLevelsConfig> = z.object({
  enabled: z.boolean().default(true),
  level: z.union(['off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto']).default('auto'),
  allowDowngrade: z.boolean().default(true),
  allowUpgrade: z.boolean().default(false),
  models: z.dict(z.object({
    // schemastery fields are optional unless marked `.required()`.
    vision: z.boolean(),
    thinking: z.boolean(),
    efforts: z.union([z.const(false), z.array(effortId)]),
    contextWindow: z.number().step(1).min(CONTEXT_WINDOW_MIN).max(CONTEXT_WINDOW_MAX),
  })).default({}),
})

/** Settings defaults, kept in lockstep with the schema defaults above. */
export const DEFAULT_CONFIG: ThinkingLevelsConfig = {
  enabled: true,
  level: 'auto',
  allowDowngrade: true,
  allowUpgrade: false,
  models: {},
}

/** Runtime-adjustable settings namespace: level + scheduler toggles. */
export const THINKING_LEVELS_SETTINGS_NAMESPACE = 'thinking-levels'

/**
 * Minimal faces of the dsh `settings` service (typed locally — the plugin must
 * NOT value-import the official `@deepseek-ai/dsh-settings` package: it is not
 * part of a profile's resolvable tree by design, and the service is provided
 * by the dsh runtime instead).
 */
interface SettingsScopeLike {
  get(): unknown
  watch(callback: () => void): () => void
}
interface SettingsServiceLike {
  register(ns: string, schema: unknown, options?: { base?: unknown }): SettingsScopeLike
}
interface SettingsAwareCtx {
  inject(deps: readonly string[], fn: (sctx: {
    settings: SettingsServiceLike
    effect(cleanup: () => (() => void) | void, label?: string): void
  }) => void): void
}

/**
 * Inline equivalent of the official `installSettingsSection` helper: register
 * the namespace through the `settings` service (cordis injection), layer the
 * composition entry as `base`, and keep the runtime source live. Kept local so
 * the host half has no value dependency on `@deepseek-ai/dsh-settings`.
 * @param ctx - host context carrying the settings service.
 * @param ns - settings namespace to register.
 * @param schema - schemastery schema resolving the namespace value.
 * @param entry - composition-entry config used as the `base` layer.
 * @param hooks - source sink and change notification.
 */
function installSettingsSection<T>(
  ctx: Context,
  ns: string,
  schema: unknown,
  entry: T,
  hooks: { setSource: (source: () => T) => void; onChange: () => void },
): void {
  ;(ctx as unknown as SettingsAwareCtx).inject(['settings'], (sctx) => {
    const scope = sctx.settings.register(ns, schema, { base: entry })
    hooks.setSource(() => scope.get() as T)
    hooks.onChange()
    // Detach: on plugin unload fall back to the composition entry, mirroring
    // the official helper's disposer.
    sctx.effect(() => () => {
      hooks.setSource(() => entry)
      hooks.onChange()
    })
    scope.watch(() => hooks.onChange())
  })
}

/**
 * The `auto` mask shown in the model directory: a user-facing level that is
 * never sent to the API — the plugin resolves it to a wire level per request.
 * It is injected into the adapter's `reasoning.efforts` so the model selector
 * offers it, and `resolveCallFor` accepts it until this plugin's request
 * interceptor substitutes the resolved wire level.
 */
const AUTO_EFFORT: { id: 'auto'; name: 'Auto' } = { id: 'auto', name: 'Auto' }

/**
 * The `low` level, advertised only for configurer-confirmed models whose
 * adapter predates dsh rc.7 (efforts list without `low`). Advertising it makes
 * the selector show Low and the harness request validation admit the
 * passthrough; the adapter must serialize it (pi-ai openai-completions does,
 * e.g. via `thinkingFormat: qwen` → enable_thinking + thinking_budget).
 */
const LOW_EFFORT: { id: 'low'; name: 'Low' } = { id: 'low', name: 'Low' }

/** Minimal face of the llm service's adapter registrations (typed locally to avoid a host-package value import). */
interface LlmRegistration {
  adapter: {
    resolveModel: (provider: string, model: string, signal?: unknown) => Promise<{
      reasoning?: { efforts?: { id: string; name: string }[] }
    }>
  }
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
 */
function advertiseModelCapability(
  llm: { adapters?: Map<string, LlmRegistration> } | undefined,
  overrideFor: (provider: string, model: string) => ModelCapabilityOverride | undefined,
  piAiFor: (provider: string, model: string) => { thinkingOn: boolean; supportsEffort: boolean } | undefined,
): void {
  for (const registration of llm?.adapters?.values() ?? []) {
    const adapter = registration.adapter
    const original = adapter.resolveModel.bind(adapter)
    adapter.resolveModel = async (provider, model, signal) => {
      const info = await original(provider, model, signal)
      const reasoning = info.reasoning
      if (reasoning === undefined) return info
      const piCap = piAiFor(provider, model)
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
        }
        return info
      }
      const efforts = [...(reasoning.efforts ?? [])]
      if (!efforts.some(effort => effort.id === 'auto')) efforts.push(AUTO_EFFORT)
      const override = overrideFor(provider, model)
      if (
        override?.efforts !== undefined
        && override.efforts !== false
        && override.efforts.includes('low')
        && !efforts.some(effort => effort.id === 'low')
      ) {
        efforts.push(LOW_EFFORT)
      }
      info.reasoning = { ...reasoning, efforts }
      return info
    }
  }
}

/** One resolved model's capability snapshot, cached per `provider/model`. */
interface ModelCapability {
  /** The model advertises at least one reasoning-effort level. */
  supportsReasoning: boolean
  /** The advertised effort ids, in selector order. */
  efforts: readonly string[]
  /** The model accepts image input (from `inputModalities`). */
  vision: boolean
  /**
   * The model takes only an on/off thinking toggle (Qwen3.6-style, per the
   * llm-pi-ai config): any effort level would be rejected, so the selector
   * shows Off/On and `off` means "omit the effort" (enable_thinking false).
   */
  toggleOnly: boolean
}

/** Minimal face of the llm service's model-info query (typed locally). */
interface LlmServiceLike {
  resolveModelInfo: (provider: string, model: string, signal?: unknown) => Promise<{
    reasoning?: { efforts?: { id: string }[] }
    inputModalities?: string[]
  }>
}

/** Minimal face of the settings service's cross-namespace read (typed locally). */
interface SettingsReadLike {
  get?: (ns: string) => unknown
}

/**
 * The providers currently taken over by dsh-llm-openai-completions, read
 * lazily from the live `llm-openai-completions` namespace. `null` when the
 * namespace is unregistered (adapter plugin absent). Toggle folding and effort
 * injection apply only to routes inside this list; everything else keeps
 * pi-ai's native reasoning semantics.
 */
function takeoverOf(ctx: Context): string[] | null {
  const settings = ctx.get('settings') as SettingsReadLike | undefined
  const section = settings?.get?.(TAKEOVER_NAMESPACE) as
    | { enabled?: unknown; providers?: unknown }
    | undefined
  return takeoverProvidersOf(section)
}

/**
 * The llm-pi-ai posture of one model, read from the live settings namespace
 * (the capability card writes `reasoningEfforts` and `compat` there). Absent
 * when the route/model is not configured.
 *
 * A model is toggle-only (Off/On, no effort levels) only when BOTH the model
 * declares a thinking toggle (reasoningEfforts table, no
 * supportsReasoningEffort) AND the route is taken over by the
 * openai-completions adapter (it is in the `llm-openai-completions` list).
 * A route OUTSIDE the takeover list is served by pi-ai with its native
 * reasoning semantics — off/high stay visible and pi-ai validates the effort —
 * so it is NOT folded into a toggle here.
 */
function piAiPosture(
  ctx: Context,
  provider: string,
  model: string,
  takeover: string[] | null,
): { thinkingOn: boolean; supportsEffort: boolean } | undefined {
  const settings = ctx.get('settings') as SettingsReadLike | undefined
  const section = settings?.get?.('llm-pi-ai') as { providers?: Record<string, { models?: Array<Record<string, unknown>> }> } | undefined
  const entry = section?.providers?.[provider]?.models?.find(candidate => candidate['id'] === model)
  if (entry === undefined) return undefined
  const efforts = entry['reasoningEfforts']
  const compat = entry['compat']
  const thinkingOn = typeof efforts === 'object' && efforts !== null && !Array.isArray(efforts)
  const supportsEffort = typeof compat === 'object' && compat !== null
    && (compat as Record<string, unknown>)['supportsReasoningEffort'] === true
  // Toggle folding is a takeover-list concern: only the openai-completions
  // adapter's routes get the Off/On treatment. pi-ai-served routes keep their
  // native effort levels (off/high visible).
  const toggled = takeover !== null && takeover.includes(provider)
  return { thinkingOn: thinkingOn && toggled, supportsEffort }
}

const CAPABILITY_CACHE_KEY_SEPARATOR = '\u0000'

/** A model that cannot be resolved is treated as non-reasoning: never inject. */
const UNRESOLVABLE_CAPABILITY: ModelCapability = { supportsReasoning: false, efforts: [], vision: false, toggleOnly: false }

/** Runtime model-capability lookup with a per-route cache. */
function capabilityResolver(ctx: Context): {
  resolve: (provider: unknown, model: unknown) => Promise<ModelCapability>
  clear: () => void
} {
  const cache = new Map<string, ModelCapability>()
  return {
    async resolve(provider, model) {
      if (typeof provider !== 'string' || typeof model !== 'string') return UNRESOLVABLE_CAPABILITY
      const key = `${provider}${CAPABILITY_CACHE_KEY_SEPARATOR}${model}`
      const cached = cache.get(key)
      if (cached !== undefined) return cached
      const llm = ctx.get('llm') as LlmServiceLike | undefined
      let capability: ModelCapability
      try {
        const info = await llm?.resolveModelInfo?.(provider, model)
        const efforts = info?.reasoning?.efforts?.map(effort => effort.id) ?? []
        const posture = piAiPosture(ctx, provider, model, takeoverOf(ctx))
        capability = {
          supportsReasoning: reasoningEffortSupported(info?.reasoning),
          efforts,
          vision: Array.isArray(info?.inputModalities) && info.inputModalities.includes('image'),
          toggleOnly: posture?.thinkingOn === true && posture.supportsEffort === false,
        }
      } catch {
        capability = UNRESOLVABLE_CAPABILITY
      }
      cache.set(key, capability)
      return capability
    },
    clear() {
      cache.clear()
    },
  }
}

/**
 * Plugin body.
 * @param ctx - host context carrying the agent-event dispatch.
 * @param config - resolved plugin configuration.
 */
export function apply(ctx: Context, config: ThinkingLevelsConfig = DEFAULT_CONFIG): void {
  if (!config.enabled) return
  // Fail-loud: a stray config value (e.g. `medium` from an old profile) must
  // not ride through into the model request, where dsh throws
  // UNSUPPORTED_REASONING_EFFORT per request.
  assertEffortId(config.level, 'dsh-thinking-levels config.level')

  // Runtime-adjustable configuration source: the composition entry is the
  // base; the settings namespace layers on top and `current()` always reads
  // the active section (official dsh settings integration pattern).
  let current: () => ThinkingLevelsConfig = () => config
  installSettingsSection(ctx, THINKING_LEVELS_SETTINGS_NAMESPACE, Config, config, {
    setSource: (source) => {
      current = source
    },
    // The decision is read per request, so a committed change needs no
    // re-registration.
    onChange: () => {},
  })

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
  let syncTail: Promise<unknown> = Promise.resolve()
  const syncDeveloperRole = (): void => {
    syncTail = syncTail.then(async () => {
      const settings = ctx.get('settings') as {
        get?: (ns: string) => unknown
        update?: (ns: string, patch: unknown) => Promise<unknown>
      } | undefined
      const piAi = settings?.get?.(PI_AI_NAMESPACE) as PiAiSection | undefined
      const next = withOfficialCompatFixes(piAi)
      if (next === undefined || next === piAi) return
      await settings?.update?.(PI_AI_NAMESPACE, { providers: next.providers })
      ctx.logger?.info?.(
        '[thinking-levels] official-compat: supportsDeveloperRole=false (route) and thinkingFormat=qwen (toggle-style models) written to llm-pi-ai for custom thinking routes',
      )
    }).catch((error) => {
      ctx.logger?.warn?.('[thinking-levels] developer-role compat sync rejected (schema gate); kept previous section', error)
    })
  }

  // Initial sync (adapters may register later; re-run on every adapters update
  // and every llm-pi-ai settings update so a Settings → Models edit propagates.
  // The write is identity-gated, so the re-entry triggered by our own update
  // settles immediately).
  syncDeveloperRole()
  const onSyncAny = ctx.on as unknown as (event: string, listener: (...args: never[]) => unknown) => void
  onSyncAny('llm/adapters-updated', () => syncDeveloperRole())
  onSyncAny('settings/document-updated', (ns: string) => {
    if (ns === PI_AI_NAMESPACE) syncDeveloperRole()
  })

  // Inject the level decision into every model request of a step.
  // The 'agent/request' event key is augmented onto cordis Events by the
  // dsh-agent runtime's generated scope types; the npm package does not
  // re-export that augmentation, so the emitter is widened at the boundary.
  //
  // prepend: the host's model-selection assembly also listens on this event and
  // overwrites `reasoningEffort` with the session's selection after `next()`;
  // registering first keeps this plugin's decision OUTERMOST so it runs last.
  const on = ctx.on as unknown as (
    event: string,
    handler: (payload: Record<string, unknown>, next: () => unknown) => unknown | Promise<unknown>,
    options?: { prepend?: boolean },
  ) => void

  // Model capability snapshots, cached per provider/model and cleared whenever
  // the adapter registry changes (a route's reasoning metadata can move).
  const capability = capabilityResolver(ctx)

  on('agent/request', async (payload, next) => {
    const seed = await next() as { provider?: unknown; model?: unknown; reasoningEffort?: unknown }
    const cfg = current()
    // `enabled` may flip at runtime through the settings namespace.
    if (!cfg.enabled) return seed

    // Model-aware guard: never send a reasoning effort to a model that does
    // not advertise one (custom openai-completions routes such as Qwen3.6).
    // Unsupported fields are stripped, not sent; a resolved low/auto schedule
    // only ever reaches models whose metadata admits the level.
    const capabilityFor = await capability.resolve(seed.provider, seed.model)
    // `undefined` when the session log cannot be read at all; the scheduler
    // then stays at the hub instead of reading it as an empty window.
    const history = recentToolCalls(payload.agent)
    const decision = resolveEffortInjection({
      supportsReasoning: capabilityFor.supportsReasoning,
      seedEffort: seed.reasoningEffort,
      selected: cfg.level,
      history,
      allowDowngrade: cfg.allowDowngrade,
      allowUpgrade: cfg.allowUpgrade,
      efforts: capabilityFor.efforts,
      toggleOnly: capabilityFor.toggleOnly,
    })
    if (!decision.inject) {
      // The model cannot take any effort: drop an inherited one so dsh does
      // not reject the request (UNSUPPORTED_REASONING_EFFORT).
      const stripped = { ...seed }
      delete (stripped as { reasoningEffort?: unknown }).reasoningEffort
      ctx.logger?.info?.(
        '[thinking-levels] agent/request: model=%s/%s has no reasoning effort; stripped',
        String(seed.provider), String(seed.model),
      )
      return stripped
    }
    // Summary-only log: individual tool names/arg sizes are workflow metadata
    // that need not land in the host log; count and decision suffice. An
    // unreadable log is named as such rather than reported as an empty window,
    // so a broken accessor is visible in the field instead of looking like a
    // session that simply never called a tool.
    ctx.logger?.info?.(
      '[thinking-levels] agent/request: model=%s/%s selected=%s calls=%s failed=%s => level=%s',
      String(seed.provider), String(seed.model), String(seed.reasoningEffort),
      history === undefined ? 'unreadable' : String(history.calls.length),
      history === undefined ? 'n/a' : String(history.failed),
      decision.level,
    )
    return { ...seed, reasoningEffort: decision.level }
  }, { prepend: true })

  // Advertise the `auto` mask (and, for configurer-confirmed rc.6-era models,
  // `low`) in the model directory so the session model selector offers them
  // alongside the adapter's native levels. Adapters may register after this
  // plugin's apply (the load order differs between the CLI and DSH Desktop),
  // so the wrapper also re-runs on every `llm/adapters-updated`.
  const llm = ctx.get('llm') as { adapters?: Map<string, LlmRegistration> } | undefined
  const overrideFor = (provider: string, model: string): ModelCapabilityOverride | undefined =>
    current().models[`${provider}/${model}`]
  // Read the live llm-pi-ai config for the thinking/effort posture the card
  // wrote there: a model with `reasoningEfforts` but without effort support
  // (Qwen3.6) is collapsed to an On/Off toggle in the selector — but ONLY when
  // the route is taken over by the openai-completions adapter. A pi-ai-served
  // route (e.g. mimo via xiaomi) keeps its native off/high levels.
  const piAiFor = (provider: string, model: string): { thinkingOn: boolean; supportsEffort: boolean } | undefined =>
    piAiPosture(ctx, provider, model, takeoverOf(ctx))
  advertiseModelCapability(llm, overrideFor, piAiFor)
  const onAny = ctx.on as unknown as (event: string, listener: (...args: never[]) => unknown) => void
  onAny('llm/adapters-updated', () => {
    capability.clear()
    advertiseModelCapability(
      ctx.get('llm') as { adapters?: Map<string, LlmRegistration> } | undefined,
      overrideFor,
      piAiFor,
    )
  })
}
