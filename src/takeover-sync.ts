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
export const PI_AI_NAMESPACE = 'llm-pi-ai'

/** The settings namespace of the retired short-circuit adapter, still READ to gate posture. */
export const TAKEOVER_NAMESPACE = 'llm-openai-completions'

/** One model row of the llm-pi-ai section (minimal face). */
export interface PiAiModelRow {
  id?: unknown
  reasoningEfforts?: unknown
  compat?: unknown
}

/** One provider profile of the llm-pi-ai section (minimal face). */
export interface PiAiProviderProfile {
  api?: unknown
  baseURL?: unknown
  models?: unknown
  compat?: unknown
  /** Other profile fields (apiKeyEnv, displayName, …) exist but are unused. */
  [key: string]: unknown
}

/** The llm-pi-ai section slice this module reads and transforms. */
export interface PiAiSection {
  providers?: Record<string, PiAiProviderProfile>
}

/** Hosts that are NOT a custom gateway (official OpenAI-compatible endpoints). */
const OFFICIAL_HOST_RE = /(?:^|\.)(?:deepseek\.com|openai\.com|openrouter\.ai|anthropic\.com|googleapis\.com|ai\.google\.dev|mistral\.ai|x\.ai)$/i

/** Whether a value looks like a declared reasoningEfforts table. */
function isEffortsTable(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Whether a provider profile targets a CUSTOM openai-completions gateway:
 * explicit `api: openai-completions`, or a baseURL that is not an official
 * host. Catalog routes without either (e.g. xiaomi via pi-ai discovery) are
 * not custom and are left alone.
 * @param profile - the provider profile slice.
 * @returns true when the route is a custom openai-completions gateway.
 */
export function isCustomOpenAiGateway(profile: PiAiProviderProfile | undefined): boolean {
  if (profile === undefined) return false
  if (profile.api === 'openai-completions') return true
  const baseURL = profile.baseURL
  if (typeof baseURL !== 'string' || baseURL.length === 0) return false
  try {
    return !OFFICIAL_HOST_RE.test(new URL(baseURL).hostname)
  } catch {
    return false
  }
}

/** The model rows a profile declares, from models[] then modelOverrides (effort's modelRows pattern). */
function modelRows(profile: PiAiProviderProfile): PiAiModelRow[] {
  const rows: PiAiModelRow[] = []
  if (Array.isArray(profile.models)) {
    rows.push(...profile.models.filter((row): row is PiAiModelRow => typeof row === 'object' && row !== null))
  }
  if (typeof profile.modelOverrides === 'object' && profile.modelOverrides !== null && !Array.isArray(profile.modelOverrides)) {
    rows.push(...Object.values(profile.modelOverrides).filter((row): row is PiAiModelRow => typeof row === 'object' && row !== null))
  }
  return rows
}

/**
 * Whether a provider declares thinking: at least one model row carries a
 * reasoningEfforts table (thinking on). `false` (thinking off) and absent
 * both mean no thinking.
 * @param profile - the provider profile slice.
 * @returns true when any model declares a reasoningEfforts table.
 */
export function declaresThinking(profile: PiAiProviderProfile | undefined): boolean {
  if (profile === undefined) return false
  return modelRows(profile).some((row) => isEffortsTable(row.reasoningEfforts))
}

/**
 * Identify the providers that should be taken over by the openai-completions
 * adapter: custom gateway AND thinking declared. Order is stable (the section's
 * own provider order).
 * @param section - the live llm-pi-ai section.
 * @returns the provider ids to add to the takeover list.
 */
export function identifyTakeoverProviders(section: PiAiSection | undefined): string[] {
  const providers = section?.providers
  if (typeof providers !== 'object' || providers === null) return []
  return Object.entries(providers)
    .filter(([, profile]) => isCustomOpenAiGateway(profile) && declaresThinking(profile))
    .map(([id]) => id)
}

/** A row's own `compat` record, when it declares one. */
function ownCompat(row: PiAiModelRow): Record<string, unknown> | undefined {
  return typeof row.compat === 'object' && row.compat !== null && !Array.isArray(row.compat)
    ? row.compat as Record<string, unknown>
    : undefined
}

/** Whether the ROW ITSELF declares `supportsReasoningEffort: true` (route-level does not count here). */
function rowEffortCapable(row: PiAiModelRow): boolean {
  return ownCompat(row)?.['supportsReasoningEffort'] === true
}

/** The row's own `thinkingFormat`, when explicitly declared. */
function rowThinkingFormat(row: PiAiModelRow): unknown {
  return ownCompat(row)?.['thinkingFormat']
}

/**
 * Rewrite one model row's compat for the toggle-thinking fix. Returns the row
 * by reference when nothing to change.
 */
function withToggleThinkingFormat(row: PiAiModelRow): PiAiModelRow {
  // Only TOGGLE-STYLE thinking models (a reasoningEfforts table but no
  // row-level effort support) need `thinkingFormat: qwen-chat-template`:
  // pi-ai's default `openai` format sends reasoning_effort — which an early
  // vLLM thinking model rejects or ignores — and the plain `qwen` format's
  // TOP-LEVEL enable_thinking is silently dropped by bare vLLM servers, whose
  // Qwen3 templates only honor chat_template_kwargs.enable_thinking. An
  // explicit thinkingFormat is respected and never clobbered.
  if (!isEffortsTable(row.reasoningEfforts)) return row
  if (rowEffortCapable(row)) return row
  if (rowThinkingFormat(row) !== undefined) return row
  return { ...row, compat: { ...ownCompat(row), thinkingFormat: 'qwen-chat-template' } }
}

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
export function withOfficialCompatFixes(
  section: PiAiSection | undefined,
): PiAiSection | undefined {
  const providers = section?.providers
  if (typeof providers !== 'object' || providers === null) return section
  let nextProviders: Record<string, PiAiProviderProfile> | undefined
  for (const [id, profile] of Object.entries(providers)) {
    if (!isCustomOpenAiGateway(profile) || !declaresThinking(profile)) continue
    let nextProfile: PiAiProviderProfile = profile
    // Route-level developer-role flag (absent only).
    if ((profile.compat as Record<string, unknown> | undefined)?.['supportsDeveloperRole'] === undefined) {
      nextProfile = {
        ...nextProfile,
        compat: { ...(typeof nextProfile.compat === 'object' && nextProfile.compat !== null ? nextProfile.compat as Record<string, unknown> : {}), supportsDeveloperRole: false },
      }
    }
    // Model-level toggle-thinking format (models[] rows).
    if (Array.isArray(profile.models)) {
      let nextModels: PiAiModelRow[] | undefined
      profile.models.forEach((row, index) => {
        if (typeof row !== 'object' || row === null) return
        const fixed = withToggleThinkingFormat(row as PiAiModelRow)
        if (fixed !== row) {
          nextModels ??= [...profile.models as PiAiModelRow[]]
          nextModels[index] = fixed
        }
      })
      if (nextModels !== undefined) nextProfile = { ...nextProfile, models: nextModels }
    }
    // Model-level toggle-thinking format (modelOverrides entries).
    if (typeof profile.modelOverrides === 'object' && profile.modelOverrides !== null && !Array.isArray(profile.modelOverrides)) {
      let nextOverrides: Record<string, PiAiModelRow> | undefined
      for (const [modelId, row] of Object.entries(profile.modelOverrides as Record<string, PiAiModelRow>)) {
        if (typeof row !== 'object' || row === null) continue
        const fixed = withToggleThinkingFormat(row)
        if (fixed !== row) {
          nextOverrides ??= { ...(profile.modelOverrides as Record<string, PiAiModelRow>) }
          nextOverrides[modelId] = fixed
        }
      }
      if (nextOverrides !== undefined) nextProfile = { ...nextProfile, modelOverrides: nextOverrides }
    }
    if (nextProfile !== profile) {
      nextProviders ??= { ...providers }
      nextProviders[id] = nextProfile
    }
  }
  return nextProviders === undefined ? section : { ...section, providers: nextProviders }
}

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
export function takeoverPatch(
  section: { enabled?: unknown; providers?: unknown } | undefined,
  flag: boolean,
): { enabled: boolean } | undefined {
  if (section === undefined) return undefined
  if (section.enabled === flag) return undefined
  return { enabled: flag }
}

/**
 * The routes the openai-completions transport currently takes over: pure
 * manual membership (`enabled && route ∈ providers`). The capability card's
 * per-route takeover checkbox is the single per-route truth and dispatch uses
 * the same set, so this gating reads exactly what the transport serves.
 * @param section - the live llm-openai-completions section, if composed.
 * @returns the taken-over route ids, `[]` when the transport is disabled, or
 *   `null` when the transport is not composed (namespace absent — every route
 *   keeps pi-ai's native reasoning semantics).
 */
export function takeoverRoutesOf(
  section: { enabled?: unknown; providers?: unknown } | undefined,
): string[] | null {
  if (section === undefined) return null
  if (section.enabled !== true) return []
  if (!Array.isArray(section.providers)) return []
  return section.providers.filter((id): id is string => typeof id === 'string')
}
