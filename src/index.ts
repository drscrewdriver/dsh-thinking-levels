/**
 * dsh-thinking-levels host plugin: injects a user-selected or auto-scheduled
 * `reasoning_effort` into every `agent/request` waterfall (levels: off / low /
 * high / max / auto), and records per-tool wall-clock durations for telemetry.
 *
 * Extension points used (verified in deepseek-ai/deepseek-harness):
 * - `agent/request` waterfall (packages/core/agent-loop/src/agent.ts
 *   buildRequest): each listener may return a modified GenerateOptions for
 *   the next listener — the sanctioned way to adjust request config.
 * - `session.events` (agent.session) carries the step's tool/call records.
 * - settings service namespace (like DSH-better-sidebar's PrefsSchema) for
 *   the user toggles.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { assertEffortId, decideEffort, isEffortId, type EffortId } from './thinking-level.ts'
import { recentToolCalls } from './session-events.ts'

/** Plugin settings. */
export interface ThinkingLevelsConfig {
  enabled: boolean
  /** User-selected level: off / low / high / max fix the wire level; `auto` schedules per step. */
  level: EffortId
  /** Scheduler preference: allow dropping below the `high` hub. */
  allowDowngrade: boolean
  /** Scheduler preference: allow lifting above the `high` hub to `max`. */
  allowUpgrade: boolean
}

/**
 * Composition-entry schema: what a dsh profile may configure at assembly
 * time (cordis.yml `config:` of the plugin row). The settings namespace
 * reuses the same schema, so a value admitted at one surface is admitted
 * at the other.
 */
export const Config: z<ThinkingLevelsConfig> = z.object({
  enabled: z.boolean().default(true),
  level: z.union(['off', 'low', 'high', 'max', 'auto']).default('auto'),
  allowDowngrade: z.boolean().default(true),
  allowUpgrade: z.boolean().default(false),
})

/** Settings defaults, kept in lockstep with the schema defaults above. */
export const DEFAULT_CONFIG: ThinkingLevelsConfig = {
  enabled: true,
  level: 'auto',
  allowDowngrade: true,
  allowUpgrade: false,
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

const TOOL_AGE_LIMIT_MS = 10 * 60 * 1000

/**
 * The `auto` mask shown in the model directory: a user-facing level that is
 * never sent to the API — the plugin resolves it to a wire level per request.
 * It is injected into the adapter's `reasoning.efforts` so the model selector
 * offers it, and `resolveCallFor` accepts it until this plugin's request
 * interceptor substitutes the resolved wire level.
 */
const AUTO_EFFORT: { id: 'auto'; name: 'Auto' } = { id: 'auto', name: 'Auto' }

/** Minimal face of the llm service's adapter registrations (typed locally to avoid a host-package value import). */
interface LlmRegistration {
  adapter: {
    resolveModel: (provider: string, model: string, signal?: unknown) => Promise<{
      reasoning?: { efforts?: { id: string; name: string }[] }
    }>
  }
}

/**
 * Advertise `auto` in the model directory (and the call-config validation it
 * feeds): wrap every registered adapter's `resolveModel` so the returned
 * `reasoning.efforts` include the mask level. Idempotent per adapter.
 * @param llm - the resolved `llm` service, when present.
 */
function advertiseAutoEffort(llm: { adapters?: Map<string, LlmRegistration> } | undefined): void {
  for (const registration of llm?.adapters?.values() ?? []) {
    const adapter = registration.adapter
    const original = adapter.resolveModel.bind(adapter)
    adapter.resolveModel = async (provider, model, signal) => {
      const info = await original(provider, model, signal)
      const reasoning = info.reasoning
      if (reasoning !== undefined && !reasoning.efforts?.some((effort) => effort.id === 'auto')) {
        info.reasoning = { ...reasoning, efforts: [...(reasoning.efforts ?? []), AUTO_EFFORT] }
      }
      return info
    }
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
  on('agent/request', async (payload, next) => {
    const seed = await next() as { reasoningEffort?: unknown }
    const cfg = current()
    // `enabled` may flip at runtime through the settings namespace.
    if (!cfg.enabled) return seed
    const selected = seed.reasoningEffort
    // A wire level picked in the model selector (off/low/high/max) wins — the
    // plugin only intervenes for the `auto` mask or when nothing was selected.
    if (isEffortId(selected) && selected !== 'auto') return seed
    // `auto` mask (or an unset/unknown value): resolve through the plugin's
    // scheduler, falling back to the configured default level.
    const base: EffortId = selected === 'auto' ? 'auto' : cfg.level
    const calls = recentToolCalls(payload.agent)
    const level = decideEffort({
      recentCalls: calls,
      selected: base,
      allowDowngrade: cfg.allowDowngrade,
      allowUpgrade: cfg.allowUpgrade,
    })
    // Summary-only log: individual tool names/arg sizes are workflow metadata
    // that need not land in the host log; count and decision suffice.
    ctx.logger?.info?.('[thinking-levels] agent/request: selected=%s calls=%d => level=%s', String(selected), calls.length, level)
    return { ...seed, reasoningEffort: level }
  }, { prepend: true })

  // Advertise the `auto` mask in the model directory so the session model
  // selector offers it alongside Off/Low/High/Max. Adapters may register after
  // this plugin's apply (the load order differs between the CLI and DSH
  // Desktop), so the wrapper also re-runs on every `llm/adapters-updated`.
  const llm = ctx.get('llm') as { adapters?: Map<string, LlmRegistration> } | undefined
  advertiseAutoEffort(llm)
  const onAny = ctx.on as unknown as (event: string, listener: (...args: never[]) => unknown) => void
  onAny('llm/adapters-updated', () => {
    advertiseAutoEffort(ctx.get('llm') as { adapters?: Map<string, LlmRegistration> } | undefined)
  })

  // Per-tool wall-clock telemetry: log tool/call -> tool/result durations.
  // Same boundary widening as above (agent/tool is a generated scope event).
  const started = new Map<string, number>()
  // A tool that never emits `end` (crash, interruption) must not leak its
  // entry forever; sweep stale ones lazily on every new `start`.
  const pruneStale = (now: number): void => {
    for (const [callId, at] of started) {
      if (now - at > TOOL_AGE_LIMIT_MS) started.delete(callId)
    }
  }
  on('agent/tool', async (payload) => {
    const callId = payload.callId
    if (typeof callId !== 'string') return
    if (payload.phase === 'start') {
      const now = Date.now()
      pruneStale(now)
      started.set(callId, now)
    } else if (payload.phase === 'end') {
      const from = started.get(callId)
      started.delete(callId)
      if (from !== undefined) {
        const ms = Date.now() - from
        ctx.logger?.info?.('[thinking-levels] tool %s took %dms', callId, ms)
      }
    }
  })
}
