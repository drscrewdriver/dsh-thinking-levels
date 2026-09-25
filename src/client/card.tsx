/**
 * Thinking-levels settings card — the family settings tab face of the
 * dsh-thinking-levels plugin.
 *
 * The card binds this plugin's entry config through the `configForms` cordis
 * service and renders its fields: the level picker
 * (off / on / minimal / low / medium / high / xhigh / max / auto) plus the
 * scheduler toggles. Every change commits immediately through the scope (no
 * staged form): the decision is read per model request, so a committed change
 * applies to the next request without a restart.
 *
 * Below the scheduler rows, a "model capabilities" block edits the
 * `llm-pi-ai` namespace directly (read + write through the same settings
 * transport), borrowing dsh-thinking-effort's presentation: providers group
 * their models, each model row shows capability badges and expands into a
 * per-level editor where a level is ticked and its gateway wire value entered
 * (e.g. `high` → `ultra`); `off` left empty means "do not send". A search box
 * filters models and one-click presets apply official/generic level sets to
 * every thinking model.
 *
 * Kept dependency-free beyond react: the scopes are subscribed with
 * `useSyncExternalStore`, and the controls are plain HTML so the client bundle
 * needs no CSS modules and no primitives value import.
 */
import { useState, useSyncExternalStore } from 'react'
import type { CSSProperties, JSX } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from './scope-face.ts'
import type { EffortId } from '../thinking-level.ts'
import { CONTEXT_WINDOW_PRESETS, formatContextWindow, validateContextWindow } from '../context-window.ts'
import type { ThinkingLevelsConfig } from '../index.ts'

/** One injected face: the plugin's own scope plus the llm-pi-ai namespace scope. */
export interface ThinkingLevelsCardInjected {
  scope: SettingsScope<ThinkingLevelsConfig>
  /** The `llm-pi-ai` settings namespace, read and written for model capabilities. */
  piAiScope: SettingsScope<unknown>
}

/** Full props: locale seat + the injected scopes. */
export type ThinkingLevelsCardProps = PropsLocale<'thinking-levels'> & ThinkingLevelsCardInjected

/** The user-facing levels, in picker order: eight standard levels plus the auto scheduler sentinel. */
const EFFORT_OPTIONS: readonly EffortId[] = [
  'off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto',
]

/**
 * The levels the capability editor offers. This is the llm-pi-ai
 * `reasoningEfforts` table-key space — pi-ai's fixed seven levels (schema
 * rejects any other key). `on` (the enable-thinking toggle) is a selector /
 * injection-level concept, expressed here by the `off` + `high` pair
 * (enable_thinking false/true), so it has no table key of its own.
 */
const CAPABILITY_LEVELS: readonly EffortId[] = [
  'off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max',
] as const

/** One-click presets, mirroring dsh-thinking-effort: official DeepSeek style and a generic set. */
const PRESETS: readonly { key: 'official' | 'generic'; levels: Record<string, unknown> }[] = [
  { key: 'official', levels: { off: null, high: 'high', max: 'max' } },
  { key: 'generic', levels: { off: null, low: 'low', medium: 'medium', high: 'high' } },
]

/** The wire thinking formats offered (llm-pi-ai's nameable set, incl. qwen-chat-template). */
const THINKING_FORMATS = [
  'openai', 'deepseek', 'openrouter', 'together', 'zai', 'qwen',
  'qwen-chat-template', 'string-thinking', 'ant-ling',
] as const

/* ── shared row styling (inline; keeps the client bundle CSS-free) ──────── */

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '6px 0',
  fontSize: '13px',
  lineHeight: '20px',
}

const labelStyle: CSSProperties = { margin: 0, color: 'var(--dsw-alias-label-primary)' }

const controlStyle: CSSProperties = {
  background: 'var(--dsw-alias-bg-surface, #fff)',
  color: 'var(--dsw-alias-label-primary)',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '4px',
  padding: '3px 8px',
  fontSize: '13px',
}

const sectionStyle: CSSProperties = {
  marginTop: '14px',
  paddingTop: '12px',
  borderTop: '1px solid var(--dsw-alias-border-l2)',
}

const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' }

const fieldLabelStyle: CSSProperties = { margin: 0, fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary)' }

const hintStyle: CSSProperties = { margin: '6px 0 0', fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary)' }

/** Provider group shell: an outlined row grouping its models. */
const providerStyle: CSSProperties = {
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '8px',
  margin: '8px 0 0',
  overflow: 'hidden',
}

const providerHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 10px',
  background: 'var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.06))',
}

const providerNameStyle: CSSProperties = {
  margin: 0,
  flex: '1 1 auto',
  minWidth: 0,
  fontFamily: 'var(--ds-font-family-code, monospace)',
  fontSize: '12px',
  lineHeight: '18px',
  fontWeight: 600,
  color: 'var(--dsw-alias-label-primary)',
  overflowWrap: 'anywhere',
}

const providerBadgeStyle: CSSProperties = {
  margin: 0,
  fontSize: '10px',
  lineHeight: '16px',
  color: 'var(--dsw-alias-label-tertiary)',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '4px',
  padding: '0 5px',
  whiteSpace: 'nowrap',
}

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--dsw-alias-label-tertiary)',
  cursor: 'pointer',
  padding: '2px 4px',
  display: 'inline-flex',
  alignItems: 'center',
}

/** One model row inside a provider group. */
const modelRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 10px',
  borderTop: '1px solid var(--dsw-alias-border-l2)',
}

const modelIdStyle: CSSProperties = {
  margin: 0,
  flex: '1 1 auto',
  minWidth: 0,
  fontFamily: 'var(--ds-font-family-code, monospace)',
  fontSize: '12px',
  lineHeight: '18px',
  color: 'var(--dsw-alias-label-secondary)',
  overflowWrap: 'anywhere',
}

/** Capability badge chips (text / image / context). */
const badgeStyle: CSSProperties = {
  fontSize: '10px',
  lineHeight: '16px',
  color: 'var(--dsw-alias-label-tertiary)',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '4px',
  padding: '0 5px',
  whiteSpace: 'nowrap',
}

/** The per-level editor grid: one row per level with a toggle, a label and a wire input. */
const levelRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 92px minmax(0, 1fr)',
  alignItems: 'center',
  gap: '8px',
  padding: '4px 0',
  fontSize: '13px',
}

const levelNameStyle: CSSProperties = { margin: 0, fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' }

const wireInputStyle: CSSProperties = {
  background: 'var(--dsw-alias-bg-surface, #fff)',
  color: 'var(--dsw-alias-label-primary)',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '4px',
  padding: '3px 8px',
  fontSize: '12px',
  width: '100%',
  boxSizing: 'border-box',
}

/* ── helpers over the llm-pi-ai user layer ─────────────────────────────── */

/** A row's `reasoningEfforts` as stored in the user layer. */
function effortsOf(model: Record<string, unknown>): false | Record<string, unknown> | undefined {
  const value = model['reasoningEfforts']
  if (value === false) return false
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

/**
 * Build a `reasoningEfforts` table from a level→wire draft. `off` maps to
 * `null` (omit the reasoning option → enable_thinking false) unless the user
 * typed a wire value; every other ticked level keeps its typed wire value.
 * pi-ai rejects a table offering nothing beyond `off`, so a selection of only
 * `off` falls back to the default `high` level.
 */
function effortTableOf(draft: Record<string, string | null>): Record<string, unknown> {
  const table: Record<string, unknown> = {}
  for (const level of CAPABILITY_LEVELS) {
    const wire = draft[level]
    if (wire === undefined || wire === null) continue
    const trimmed = typeof wire === 'string' ? wire.trim() : ''
    if (level === 'off') table[level] = trimmed === '' ? null : trimmed
    else if (trimmed !== '') table[level] = trimmed
  }
  if (Object.keys(table).length === 0 || Object.keys(table).every(level => table[level] === null)) {
    return { ...table, high: 'high' }
  }
  return table
}

/** Whether a row declares `compat.supportsReasoningEffort` (the wire sends reasoning_effort). */
function supportsEffortOf(model: Record<string, unknown>): boolean {
  const compat = model['compat']
  if (typeof compat !== 'object' || compat === null || Array.isArray(compat)) return false
  return (compat as Record<string, unknown>)['supportsReasoningEffort'] === true
}

/** Patch one row's `compat` object, merging rather than replacing sibling fields. */
function patchCompat(
  row: Record<string, unknown>,
  patch: (compat: Record<string, unknown>) => void,
): void {
  const compat = typeof row['compat'] === 'object' && row['compat'] !== null && !Array.isArray(row['compat'])
    ? { ...(row['compat'] as Record<string, unknown>) }
    : {}
  patch(compat)
  if (Object.keys(compat).length === 0) delete row['compat']
  else row['compat'] = compat
}

/** The user-layer `providers` value of the llm-pi-ai namespace, when present. */
function providersOf(snapshot: unknown): Record<string, unknown> {
  if (typeof snapshot !== 'object' || snapshot === null) return {}
  const user = (snapshot as { user?: unknown }).user
  if (typeof user !== 'object' || user === null || Array.isArray(user)) return {}
  const providers = (user as Record<string, unknown>)['providers']
  return typeof providers === 'object' && providers !== null && !Array.isArray(providers)
    ? providers as Record<string, unknown>
    : {}
}

/** Whether a route-level profile declares `compat.supportsDeveloperRole: false`. */
function developerRoleDisabledOf(profile: unknown): boolean {
  if (typeof profile !== 'object' || profile === null) return false
  const compat = (profile as Record<string, unknown>)['compat']
  if (typeof compat !== 'object' || compat === null || Array.isArray(compat)) return false
  return (compat as Record<string, unknown>)['supportsDeveloperRole'] === false
}

/** One flattened capability entry: a provider's model at an array index. */
interface CapabilityEntry {
  providerId: string
  index: number
  model: Record<string, unknown>
  modelId: string
  /** The provider-level `compat`, applied to models that declare none (display parity). */
  providerCompat?: unknown
  /** The provider-level `defaultInput`, applied to models that declare none (display parity). */
  providerInput?: unknown[]
}

/** The effective `compat` of an entry: its own `compat` merged over the provider-level `compat`. */
function compatOf(entry: CapabilityEntry): Record<string, unknown> {
  const base = typeof entry.providerCompat === 'object' && entry.providerCompat !== null
    ? entry.providerCompat as Record<string, unknown>
    : {}
  const own = entry.model['compat']
  return typeof own === 'object' && own !== null && !Array.isArray(own)
    ? { ...base, ...(own as Record<string, unknown>) }
    : base
}

/** Flatten the user-layer providers into capability entries (models arrays only). */
function entriesOf(providers: Record<string, unknown>): CapabilityEntry[] {
  return Object.entries(providers).flatMap(([providerId, profile]) => {
    const raw = profile as Record<string, unknown>
    const models = raw['models']
    if (!Array.isArray(models)) return []
    const providerCompat = raw['compat']
    const providerInput = Array.isArray(raw['defaultInput']) ? raw['defaultInput'] as unknown[] : undefined
    return models.map((model, index) => ({
      providerId,
      index,
      model: (typeof model === 'object' && model !== null && !Array.isArray(model)
        ? model as Record<string, unknown>
        : {}),
      modelId: typeof model === 'object' && model !== null && typeof (model as Record<string, unknown>)['id'] === 'string'
        ? (model as Record<string, unknown>)['id'] as string
        : `#${index + 1}`,
      providerCompat,
      providerInput,
    }))
  })
}

/** Human-readable capability summary of one entry (input modalities + declared context window). */
function summaryOf(entry: CapabilityEntry): { text: boolean; image: boolean; context: string | null } {
  // Modalities fall back to the provider-level `defaultInput` so a vision
  // gateway declared once on the route shows every model as vision, matching
  // llm-pi-ai's resolution and the adapter's runtime gate.
  const input = Array.isArray(entry.model['input'])
    ? entry.model['input'] as unknown[]
    : entry.providerInput
  const text = !Array.isArray(input) || input.length === 0 || input.includes('text')
  const image = Array.isArray(input) && input.includes('image')
  const contextWindow = entry.model['contextWindow']
  const context = typeof contextWindow === 'number' && Number.isFinite(contextWindow) && contextWindow > 0
    ? formatContextWindow(contextWindow)
    : null
  return { text, image, context }
}

/** A tiny inline chevron icon (no CSS modules). */
function ChevronIcon({ open }: { open: boolean }): JSX.Element {
  return (
    <svg
      width="12" height="12" viewBox="0 0 16 16" aria-hidden
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.16s' }}
    >
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The llm-pi-ai model-capability editor block (dsh-thinking-effort style:
 * provider groups, model rows with badges, per-level wire editors, search and
 * one-click presets).
 * @param scope - the `llm-pi-ai` namespace scope.
 * @param t - copy lookup.
 * @param readonly - whether writes are forbidden.
 * @returns the capabilities block, or a placeholder when nothing is configured.
 */
function ModelCapabilities(props: {
  scope: SettingsScope<unknown>
  t: (key: string) => string
  readonly: boolean
}): JSX.Element {
  const { scope, t, readonly } = props
  const snapshot = useSyncExternalStore(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot(),
  )
  const unavailable = snapshot.status === 'unavailable'
  const providers = snapshot.status === 'ready' ? providersOf(snapshot) : {}
  // Every llm-pi-ai provider is listed with its models — no list gating: the
  // official compat surface (dsh ≥ rc.8) means pi-ai serves every route
  // natively, so each model is editable right here.
  const allEntries = entriesOf(providers)

  // UI-only state: provider/model expansion, the wire drafts, and the query.
  const [query, setQuery] = useState('')
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({})
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({})
  const [drafts, setDrafts] = useState<Record<string, Record<string, string | null>>>({})
  const [busy, setBusy] = useState(false)
  const [contextRaw, setContextRaw] = useState<Record<string, string>>({})
  const [contextError, setContextError] = useState<Record<string, string>>({})

  const entryKey = (entry: CapabilityEntry): string => `${entry.providerId}\u0000${entry.index}`

  /** Commit one patch over the user-layer providers. */
  const commitProviders = (mutate: (current: Record<string, unknown>) => Record<string, unknown>): void => {
    if (snapshot.status !== 'ready' || readonly) return
    setBusy(true)
    void scope.set('providers', mutate(structuredClone(providers)))
      .then(() => { setBusy(false) })
      .catch(() => { setBusy(false) })
  }

  /** Toggle the route-level official compat flag: unchecked = inherit (unset). */
  const toggleDeveloperRole = (providerId: string, next: boolean): void => {
    commitProviders((current) => {
      const profile = current[providerId] as Record<string, unknown> | undefined
      if (profile === undefined) return current
      const compat = typeof profile['compat'] === 'object' && profile['compat'] !== null && !Array.isArray(profile['compat'])
        ? { ...(profile['compat'] as Record<string, unknown>) }
        : {}
      if (next) compat['supportsDeveloperRole'] = false
      else delete compat['supportsDeveloperRole']
      if (Object.keys(compat).length === 0) delete profile['compat']
      else profile['compat'] = compat
      return current
    })
  }

  /** Patch one model row of one provider. */
  const patchModel = (
    providerId: string,
    index: number,
    patch: (model: Record<string, unknown>) => void,
  ): void => {
    commitProviders((current) => {
      const profile = current[providerId] as { models?: unknown[] } | undefined
      if (profile === undefined || !Array.isArray(profile.models)) return current
      const model = profile.models[index]
      if (typeof model !== 'object' || model === null) return current
      patch(model as Record<string, unknown>)
      return current
    })
  }

  /** Toggle whether a model is a thinking model (reasoningEfforts table vs false). */
  const toggleThinking = (entry: CapabilityEntry, next: boolean): void => {
    patchModel(entry.providerId, entry.index, (row) => {
      if (next) {
        // Thinking on: a table must exist so the wire drives enable_thinking /
        // reasoning_effort. Start from the persisted table or the default high
        // set; a toggle model (no effort) keeps supportsReasoningEffort false.
        const effortCapable = supportsEffortOf(row)
        row['reasoningEfforts'] = effortCapable
          ? effortTableOf({ high: 'high' })
          : { off: null, high: 'high' }
        // Toggle-style thinking models need the official qwen format so pi-ai
        // sends enable_thinking (early vLLM thinking models return no thinking
        // content without that flag, and reject reasoning_effort). Only fills
        // an absent format — an explicit choice is never clobbered.
        if (!effortCapable) {
          patchCompat(row, (compat) => {
            if (compat['thinkingFormat'] === undefined) compat['thinkingFormat'] = 'qwen-chat-template'
          })
        }
      } else {
        // Thinking off: a non-reasoning model never takes an effort.
        row['reasoningEfforts'] = false
      }
    })
  }

  /** Toggle whether a model accepts reasoning_effort levels. */
  const toggleEffortCapable = (entry: CapabilityEntry, next: boolean): void => {
    patchModel(entry.providerId, entry.index, (row) => {
      patchCompat(row, (compat) => {
        compat['supportsReasoningEffort'] = next
        // Counterpart of the auto-fill in toggleThinking: effort-capable rows
        // need reasoning_effort on the wire, so drop the toggle-style qwen
        // format when effort turns on (it would drive enable_thinking instead).
        if (next && compat['thinkingFormat'] === 'qwen-chat-template') delete compat['thinkingFormat']
      })
    })
  }

  /** Apply one model's wire draft as its `reasoningEfforts` table. */
  const applyDraft = (entry: CapabilityEntry): void => {
    const key = entryKey(entry)
    const draft = drafts[key]
    if (draft === undefined) return
    const table = effortTableOf(draft)
    patchModel(entry.providerId, entry.index, (row) => {
      row['reasoningEfforts'] = table
      // Mark effort support only when the model already had it or the user
      // ticked a reasoning_effort-only level (minimal/low/medium/xhigh/max).
      // A toggle-only model (Qwen3.6: off/high = enable_thinking) must keep
      // supportsReasoningEffort false — flipping it would make the adapter
      // send a reasoning_effort the gateway rejects (400).
      const extended = Object.keys(table).some(level => level !== 'off' && level !== 'on' && level !== 'high')
      if (supportsEffortOf(row) || extended) {
        patchCompat(row, (compat) => {
          compat['supportsReasoningEffort'] = true
        })
      }
    })
  }

  /** Reset a model's draft to its persisted table (or the default high set). */
  const resetDraft = (entry: CapabilityEntry): void => {
    const key = entryKey(entry)
    setDrafts(current => {
      const next = { ...current }
      const table = effortsOf(entry.model)
      if (typeof table === 'object' && table !== null) {
        next[key] = Object.fromEntries(CAPABILITY_LEVELS.map(level => [
          level,
          table[level] === undefined ? null : (table[level] === null ? '' : String(table[level])),
        ]))
      } else {
        next[key] = { off: '', high: 'high' }
      }
      return next
    })
  }

  /** Seed a model's draft when it is first expanded. */
  const ensureDraft = (entry: CapabilityEntry): void => {
    const key = entryKey(entry)
    setDrafts(current => {
      if (current[key] !== undefined) return current
      const next = { ...current }
      const table = effortsOf(entry.model)
      if (typeof table === 'object' && table !== null) {
        next[key] = Object.fromEntries(CAPABILITY_LEVELS.map(level => [
          level,
          table[level] === undefined ? null : (table[level] === null ? '' : String(table[level])),
        ]))
      } else {
        next[key] = { off: '', high: 'high' }
      }
      return next
    })
  }

  /** Apply a one-click preset to every thinking model. */
  const applyPreset = (levels: Record<string, unknown>): void => {
    commitProviders((current) => {
      for (const entry of entriesOf(current)) {
        const profile = current[entry.providerId] as { models?: unknown[] } | undefined
        if (profile === undefined || !Array.isArray(profile.models)) continue
        const model = profile.models[entry.index]
        if (typeof model !== 'object' || model === null) continue
        const row = model as Record<string, unknown>
        if (effortsOf(row) === undefined) continue // only thinking models
        // Replace the table but never touch supportsReasoningEffort: a
        // toggle-only model (Qwen3.6) must stay Off/On (enable_thinking), so
        // the request guard keeps clamping any injected level to its default
        // strength instead of sending a reasoning_effort the gateway rejects.
        row['reasoningEfforts'] = levels
      }
      return current
    })
  }

  /** Seed a model's context-window input when it is first expanded. */
  const seedContext = (entry: CapabilityEntry): void => {
    const key = entryKey(entry)
    setContextRaw(current => {
      if (current[key] !== undefined) return current
      const value = entry.model['contextWindow']
      return {
        ...current,
        [key]: typeof value === 'number' && Number.isFinite(value) ? String(value) : '',
      }
    })
  }

  /** Write (or delete) a model's `contextWindow` in the llm-pi-ai entry. */
  const commitContextWindow = (entry: CapabilityEntry, value: number | undefined): void => {
    const key = entryKey(entry)
    patchModel(entry.providerId, entry.index, (row) => {
      if (value === undefined) delete row['contextWindow']
      else row['contextWindow'] = value
    })
    setContextError(current => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  /** Apply one preset immediately. */
  const applyContextPreset = (entry: CapabilityEntry, value: number): void => {
    const key = entryKey(entry)
    setContextRaw(current => ({ ...current, [key]: String(value) }))
    commitContextWindow(entry, value)
  }

  /** Validate and commit the custom input (blur / Enter); empty clears it. */
  const applyContextInput = (entry: CapabilityEntry): void => {
    const key = entryKey(entry)
    const raw = (contextRaw[key] ?? '').trim()
    if (raw === '') {
      commitContextWindow(entry, undefined)
      return
    }
    const validation = validateContextWindow(raw)
    if (!validation.ok) {
      setContextError(current => ({
        ...current,
        [key]: t(validation.reason === 'integer'
          ? 'card.capabilities.contextInteger'
          : 'card.capabilities.contextRange'),
      }))
      return
    }
    commitContextWindow(entry, validation.value)
  }

  /** Clear the model's context-window declaration (delete the field). */
  const clearContext = (entry: CapabilityEntry): void => {
    const key = entryKey(entry)
    setContextRaw(current => ({ ...current, [key]: '' }))
    commitContextWindow(entry, undefined)
  }

  if (unavailable) {
    return (
      <div style={sectionStyle}>
        <p style={hintStyle}>{t('card.capabilities.unavailable')}</p>
      </div>
    )
  }
  if (allEntries.length === 0) {
    return (
      <div style={sectionStyle}>
        <p style={fieldLabelStyle}>{t('card.capabilities')}</p>
        <p style={hintStyle}>{t('card.capabilities.empty')}</p>
      </div>
    )
  }

  const needle = query.trim().toLowerCase()
  const visible = needle === ''
    ? allEntries
    : allEntries.filter(entry =>
      entry.modelId.toLowerCase().includes(needle)
      || entry.providerId.toLowerCase().includes(needle))
  const providerIds = [...new Set(visible.map(entry => entry.providerId))]

  return (
    <div style={sectionStyle}>
      <p style={fieldLabelStyle}>{t('card.capabilities')}</p>
      <p style={hintStyle}>{t('card.capabilities.hint')}</p>

      {/* Search + one-click presets */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', margin: '8px 0 2px' }}>
        <input
          type="text"
          value={query}
          placeholder={t('card.capabilities.search')}
          disabled={readonly || busy}
          style={{ ...controlStyle, flex: '1 1 160px', minWidth: '140px' }}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        {PRESETS.map(preset => (
          <button
            key={preset.key}
            type="button"
            disabled={readonly || busy}
            onClick={() => applyPreset(preset.levels)}
            style={{
              ...controlStyle,
              cursor: readonly || busy ? 'default' : 'pointer',
              opacity: readonly || busy ? 0.5 : 1,
            }}
          >
            {t(`card.capabilities.preset${preset.key === 'official' ? 'Official' : 'Generic'}`)}
          </button>
        ))}
      </div>

      {visible.length === 0
        ? <p style={hintStyle}>{t('card.capabilities.noMatches')}</p>
        : providerIds.map(providerId => {
          const providerEntries = visible.filter(entry => entry.providerId === providerId)
          const providerOpen = expandedProviders[providerId] === true || needle !== ''
          return (
            <div key={providerId} style={providerStyle}>
              <div style={providerHeadStyle}>
                <button
                  type="button"
                  aria-expanded={providerOpen}
                  disabled={readonly || busy}
                  onClick={() => setExpandedProviders(current => ({
                    ...current,
                    [providerId]: current[providerId] !== true,
                  }))}
                  style={{
                    ...iconButtonStyle,
                    cursor: readonly || busy ? 'default' : 'pointer',
                  }}
                  title={providerOpen ? t('card.capabilities.collapseProvider') : t('card.capabilities.expandProvider')}
                >
                  <ChevronIcon open={providerOpen} />
                </button>
                <p style={providerNameStyle}>{providerId}</p>
                <label
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', whiteSpace: 'nowrap', color: 'var(--dsw-alias-label-secondary)' }}
                  title={t('card.capabilities.developerRoleHint')}
                >
                  <input
                    type="checkbox"
                    checked={developerRoleDisabledOf(providers[providerId])}
                    disabled={readonly || busy}
                    onChange={(event) => toggleDeveloperRole(providerId, event.currentTarget.checked)}
                  />
                  <span>{t('card.capabilities.developerRole')}</span>
                </label>
                <p style={providerBadgeStyle}>{providerEntries.length}</p>
              </div>
              {providerOpen
                ? providerEntries.map(entry => {
                  const key = entryKey(entry)
                  const modelOpen = expandedModels[key] === true
                  const efforts = effortsOf(entry.model)
                  const thinking = typeof efforts === 'object'
                  // Display falls back to the provider-level `compat` so a
                  // route-declared thinking/effort posture shows on every model.
                  const compat = compatOf(entry)
                  const supportsEffort = compat['supportsReasoningEffort'] === true
                  const meta = summaryOf(entry)
                  const format = typeof compat['thinkingFormat'] === 'string'
                    ? compat['thinkingFormat']
                    : undefined
                  return (
                    <div key={key}>
                      <div style={modelRowStyle}>
                        <button
                          type="button"
                          aria-expanded={modelOpen}
                          disabled={readonly || busy}
                          onClick={() => {
                            const next = expandedModels[key] !== true
                            setExpandedModels(current => ({ ...current, [key]: next }))
                            if (next) { ensureDraft(entry); seedContext(entry) }
                          }}
                          style={{
                            ...iconButtonStyle,
                            cursor: readonly || busy ? 'default' : 'pointer',
                          }}
                          title={modelOpen ? t('card.capabilities.closeModelSettings') : t('card.capabilities.openModelSettings')}
                        >
                          <ChevronIcon open={modelOpen} />
                        </button>
                        <p style={modelIdStyle}>{entry.modelId}</p>
                        <span style={badgeStyle} title="text">{meta.text ? 'T' : '–'}</span>
                        <span style={badgeStyle} title="image">{meta.image ? 'IMG' : '–'}</span>
                        {meta.context !== null && <span style={badgeStyle}>{meta.context}</span>}
                        {thinking && !supportsEffort && <span style={badgeStyle}>On/Off</span>}
                      </div>
                      {modelOpen
                        ? (
                          <div style={{ padding: '4px 10px 10px', borderTop: '1px solid var(--dsw-alias-border-l2)' }}>
                            {/* Layer 1 — base capabilities: is it a thinking model? A vision model? */}
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', margin: '2px 0 8px' }}>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                <input
                                  type="checkbox"
                                  checked={thinking}
                                  disabled={readonly || busy}
                                  onChange={(event) => toggleThinking(entry, event.currentTarget.checked)}
                                />
                                <span>{t('card.capabilities.thinking')}</span>
                              </label>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                <input
                                  type="checkbox"
                                  checked={meta.image}
                                  disabled={readonly || busy}
                                  onChange={(event) => {
                                    patchModel(entry.providerId, entry.index, (row) => {
                                      // Image input implies text input; the pair is written together.
                                      row['input'] = event.currentTarget.checked ? ['text', 'image'] : ['text']
                                    })
                                  }}
                                />
                                <span>{t('card.capabilities.vision')}</span>
                              </label>
                            </div>
                            {/* Layer 2 — only for thinking models: does it take reasoning_effort levels? */}
                            {thinking
                              ? (
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', margin: '0 0 8px' }}>
                                  <input
                                    type="checkbox"
                                    checked={supportsEffort}
                                    disabled={readonly || busy}
                                    onChange={(event) => toggleEffortCapable(entry, event.currentTarget.checked)}
                                  />
                                  <span>{t('card.capabilities.supportsEffort')}</span>
                                </label>
                              )
                              : null}
                            {thinking && supportsEffort
                              ? (
                                <>
                                  {/* Per-level wire editor — only for effort-capable thinking models */}
                                  <p style={fieldLabelStyle}>{t('card.capabilities.efforts')}</p>
                                  <div style={{ margin: '4px 0 6px' }}>
                                    {CAPABILITY_LEVELS.map(level => {
                                      const wire = drafts[key]?.[level]
                                      const on = wire !== undefined && wire !== null
                                      return (
                                        <div key={level} style={levelRowStyle}>
                                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                            <input
                                              type="checkbox"
                                              checked={on}
                                              disabled={readonly || busy}
                                              onChange={(event) => {
                                                const checked = event.currentTarget.checked
                                                setDrafts(current => {
                                                  const draft = { ...(current[key] ?? {}) }
                                                  draft[level] = checked
                                                    ? (level === 'off' ? '' : level)
                                                    : null
                                                  return { ...current, [key]: draft }
                                                })
                                              }}
                                            />
                                            <span>{level}</span>
                                          </label>
                                          <span style={levelNameStyle}>{level === 'off' ? t('card.capabilities.offPlaceholder') : '→'}</span>
                                          <input
                                            type="text"
                                            value={wire ?? ''}
                                            disabled={readonly || busy || !on}
                                            placeholder={t('card.capabilities.wirePlaceholder')}
                                            style={wireInputStyle}
                                            onChange={(event) => {
                                              setDrafts(current => {
                                                const draft = { ...(current[key] ?? {}) }
                                                draft[level] = event.currentTarget.value
                                                return { ...current, [key]: draft }
                                              })
                                            }}
                                          />
                                        </div>
                                      )
                                    })}
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      disabled={readonly || busy}
                                      onClick={() => applyDraft(entry)}
                                      style={{
                                        ...controlStyle,
                                        cursor: readonly || busy ? 'default' : 'pointer',
                                        opacity: readonly || busy ? 0.5 : 1,
                                      }}
                                    >
                                      {t('card.capabilities.applyLevel')}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={readonly || busy}
                                      onClick={() => resetDraft(entry)}
                                      style={{
                                        ...controlStyle,
                                        cursor: readonly || busy ? 'default' : 'pointer',
                                        opacity: readonly || busy ? 0.5 : 1,
                                      }}
                                    >
                                      {t('card.capabilities.restoreDefault')}
                                    </button>
                                  </div>
                                </>
                              )
                              : null}
                            {/* Layer 4 — thinking format (wire serialization) */}
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}>
                              <label style={fieldStyle}>
                                <span style={fieldLabelStyle}>{t('card.capabilities.thinkingFormat')}</span>
                                <select
                                  style={controlStyle}
                                  value={format ?? 'inherit'}
                                  disabled={readonly || busy}
                                  onChange={(event) => {
                                    const next = event.currentTarget.value
                                    patchModel(entry.providerId, entry.index, (row) => {
                                      patchCompat(row, (compat) => {
                                        if (next === 'inherit') delete compat['thinkingFormat']
                                        else compat['thinkingFormat'] = next
                                      })
                                    })
                                  }}
                                >
                                  <option value="inherit">{t('card.capabilities.thinkingFormat.inherit')}</option>
                                  {THINKING_FORMATS.map(formatOption => (
                                    <option key={formatOption} value={formatOption}>{formatOption}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            {/* Context-window limit: presets + custom integer (written to llm-pi-ai, live on next request) */}
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}>
                              <label style={fieldStyle}>
                                <span style={fieldLabelStyle}>{t('card.capabilities.contextWindow')}</span>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  {CONTEXT_WINDOW_PRESETS.map(preset => (
                                    <button
                                      key={preset.value}
                                      type="button"
                                      disabled={readonly || busy}
                                      onClick={() => applyContextPreset(entry, preset.value)}
                                      style={{
                                        ...controlStyle,
                                        padding: '2px 8px',
                                        cursor: readonly || busy ? 'default' : 'pointer',
                                        opacity: readonly || busy ? 0.5 : 1,
                                      }}
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                  <input
                                    type="text"
                                    value={contextRaw[key] ?? ''}
                                    disabled={readonly || busy}
                                    placeholder={t('card.capabilities.contextCustomPlaceholder')}
                                    style={{ ...controlStyle, width: '120px' }}
                                    onChange={(event) => {
                                      const next = event.currentTarget.value
                                      setContextRaw(current => ({ ...current, [key]: next }))
                                    }}
                                    onBlur={() => applyContextInput(entry)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') event.currentTarget.blur()
                                    }}
                                  />
                                  <button
                                    type="button"
                                    disabled={readonly || busy}
                                    onClick={() => clearContext(entry)}
                                    style={{
                                      ...controlStyle,
                                      cursor: readonly || busy ? 'default' : 'pointer',
                                      opacity: readonly || busy ? 0.5 : 1,
                                    }}
                                  >
                                    {t('card.capabilities.contextClear')}
                                  </button>
                                </div>
                                {contextError[key] !== undefined
                                  ? (
                                    <span style={{ margin: 0, fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-danger, #e5484d)' }}>
                                      {contextError[key]}
                                    </span>
                                  )
                                  : null}
                              </label>
                            </div>
                          </div>
                        )
                        : null}
                    </div>
                  )
                })
                : null}
            </div>
          )
        })}
      {readonly ? <p style={hintStyle}>{t('card.readonly')}</p> : null}
    </div>
  )
}

/**
 * The card body, wrapped in a disclosure shell like every peer settings card:
 * a header (name + description + chevron) that toggles the body, collapsed by
 * default so the plugin tab stays a tidy list of drawers.
 * @param props - locale copy and the injected scopes.
 */
export function ThinkingLevelsCard({ t, scope, piAiScope }: ThinkingLevelsCardProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const snapshot = useSyncExternalStore(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot(),
  )
  const unavailable = snapshot.status === 'unavailable'
  const readonly = unavailable || !snapshot.writable
  // configForms serves the STORED doc: volatile fields arrive as plain values
  // (simplify() unwraps the live refs before persistence), so the card sees a
  // plain config shape even though the host-side type carries Volatile unions.
  const value = (snapshot.value ?? {}) as unknown as Partial<{
    enabled: boolean
    level: EffortId
    allowDowngrade: boolean
    allowUpgrade: boolean
  }>
  const level = EFFORT_OPTIONS.includes(value.level as EffortId) ? value.level as EffortId : 'auto'

  return (
    <div style={{
      border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))',
      background: 'var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.05))',
      borderRadius: '12px',
      transition: 'border-color 0.16s, background 0.16s',
    }}>
      <button
        type="button"
        aria-expanded={open}
        style={{
          appearance: 'none',
          width: '100%',
          font: 'inherit',
          color: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
          background: 'none',
          border: 0,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
        }}
        onClick={() => { setOpen(current => !current) }}
      >
        <span style={{ flex: '1 1 0%', minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' }}>{t('card.title')}</div>
          <div style={{ color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))', fontSize: '13px', lineHeight: 1.5 }}>{t('card.description')}</div>
        </span>
        <svg
          width="16" height="16" viewBox="0 0 16 16" aria-hidden
          style={{
            color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))',
            flex: '0 0 auto',
            transition: 'transform 0.16s',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        >
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open
        ? (
          <div style={{ padding: '12px 16px' }}>
            {unavailable
              ? (
                <div style={{ fontSize: '13px', color: 'var(--dsw-alias-label-tertiary)' }}>
                  {t('card.unavailable')}
                </div>
              )
              : (
                <>
                  <div style={rowStyle}>
                    <label htmlFor="plugin-config-thinking-levels-level" style={labelStyle}>{t('card.level')}</label>
                    <select
                      id="plugin-config-thinking-levels-level"
                      value={level}
                      disabled={readonly}
                      style={controlStyle}
                      onChange={(event) => { void scope.set('level', event.currentTarget.value as EffortId) }}
                    >
                      {EFFORT_OPTIONS.map((option) => (
                        <option key={option} value={option}>{t(`card.level.${option}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div style={rowStyle}>
                    <label htmlFor="plugin-config-thinking-levels-enabled" style={labelStyle}>{t('card.enabled')}</label>
                    <input
                      id="plugin-config-thinking-levels-enabled"
                      type="checkbox"
                      checked={value.enabled ?? true}
                      disabled={readonly}
                      onChange={(event) => { void scope.set('enabled', event.currentTarget.checked) }}
                    />
                  </div>
                  <div style={rowStyle}>
                    <label htmlFor="plugin-config-thinking-levels-downgrade" style={labelStyle}>{t('card.allowDowngrade')}</label>
                    <input
                      id="plugin-config-thinking-levels-downgrade"
                      type="checkbox"
                      checked={value.allowDowngrade ?? true}
                      disabled={readonly || value.level !== 'auto'}
                      onChange={(event) => { void scope.set('allowDowngrade', event.currentTarget.checked) }}
                    />
                  </div>
                  <div style={rowStyle}>
                    <label htmlFor="plugin-config-thinking-levels-upgrade" style={labelStyle}>{t('card.allowUpgrade')}</label>
                    <input
                      id="plugin-config-thinking-levels-upgrade"
                      type="checkbox"
                      checked={value.allowUpgrade ?? false}
                      disabled={readonly || value.level !== 'auto'}
                      onChange={(event) => { void scope.set('allowUpgrade', event.currentTarget.checked) }}
                    />
                  </div>
                  {!snapshot.writable
                    && <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)' }}>{t('card.readonly')}</p>}
                  <ModelCapabilities scope={piAiScope} t={t} readonly={readonly} />
                </>
              )}
          </div>
        )
        : null}
    </div>
  )
}
