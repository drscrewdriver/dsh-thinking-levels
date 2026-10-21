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
import { useCallback, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, JSX } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from './scope-face.ts'
import type { EffortId } from '../thinking-level.ts'
import type { PricingPolicy } from '../price-catalog.ts'
import { CONTEXT_WINDOW_PRESETS, formatContextWindow, validateContextWindow } from '../context-window.ts'
import { contextWindowOf, deepseekSectionOf, DEEPSEEK_DEFAULT_WINDOW } from './model-panel.tsx'
import type { ThinkingLevelsConfig } from '../index.ts'

/** One injected face: the plugin's own scope plus the llm-pi-ai namespace scope. */
export interface ThinkingLevelsCardInjected {
  scope: SettingsScope<ThinkingLevelsConfig>
  /** The `llm-pi-ai` settings namespace, read and written for model capabilities. */
  piAiScope: SettingsScope<unknown>
  /**
   * The openai-completions transport's section (`llm-openai-completions`):
   * read for the per-route takeover state, written by the route-head takeover
   * checkbox (`enabled` + the manual `providers` list). Absent face = the
   * transport is not composed; the checkbox then renders disabled.
   */
  ocScope?: SettingsScope<unknown>
  /**
   * The `llm-deepseek` section: with the seat takeover off (4.4.0 default)
   * the official-model context editor lives on this card instead of the
   * ModelPanel lines. Absent on hosts without the namespace.
   */
  deepseekScope?: SettingsScope<unknown>
}

/** Full props: locale seat + the injected scopes. */
export type ThinkingLevelsCardProps = PropsLocale<'thinking-levels'> & ThinkingLevelsCardInjected

/** The user-facing levels, in picker order: eight standard levels plus the auto scheduler sentinel. */
const EFFORT_OPTIONS: readonly EffortId[] = [
  'off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto',
]

/** 计价兜底档，in picker order：缺省 estimate（典型价估算，未校准仅供参考）。 */
const PRICING_OPTIONS: readonly PricingPolicy[] = [
  'estimate', 'cn', 'global', 'custom', 'off',
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

/** Native form controls (the select's dropdown popup) follow `color-scheme`,
 * which the ≤0.1.6 shells never set — derive it from the body luminance once
 * at bundle eval so dark-theme hosts get dark popups without a media query
 * (the app theme isn't the OS theme, so prefers-color-scheme would lie). */
const controlColorScheme: 'dark' | 'light' = (() => {
  try {
    const rgb = getComputedStyle(document.body).backgroundColor.match(/\d+/g) ?? ['255', '255', '255']
    const [r, g, b] = rgb.map(Number)
    return (r * 299 + g * 587 + b * 114) / 1000 < 128 ? 'dark' : 'light'
  } catch { return 'light' }
})()

const controlStyle: CSSProperties = {
  // Translucent fallback: the alias tokens don't exist on the ≤0.1.6 shells,
  // and the old `#fff` fallback painted white controls onto dark dialogs.
  background: 'var(--dsw-alias-bg-surface, rgba(127,127,127,0.12))',
  color: 'var(--dsw-alias-label-primary, inherit)',
  colorScheme: controlColorScheme,
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
  // 0.1.7+ snapshots carry the user layer; ≤0.1.6 settingsScope snapshots
  // carry the merged section as `value` — read whichever the host provides.
  const user = (snapshot as { user?: unknown }).user
    ?? (snapshot as { value?: unknown }).value
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

/**
 * Whether the transport currently takes this route over: its master switch on
 * AND the route in its manual providers list. Pure membership — the checkbox
 * is the single per-route truth, so dispatch uses the same set.
 */
function takeoverActiveOf(section: { enabled?: unknown; providers?: unknown }, providerId: string): boolean {
  if (section.enabled !== true) return false
  return Array.isArray(section.providers) && (section.providers as unknown[]).includes(providerId)
}

/**
 * The transport's `extraInputs` dict ('provider/model' → modality list), from
 * its own section. The host llm-pi-ai schema caps a model row's `input` enum
 * at text|image, so video/audio declarations for omni models live here —
 * the taken-over transport unions them into the model's effective input.
 */
function extraInputsOf(section: { extraInputs?: unknown }): Record<string, string[]> {
  if (typeof section.extraInputs !== 'object' || section.extraInputs === null || Array.isArray(section.extraInputs)) return {}
  const out: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(section.extraInputs as Record<string, unknown>)) {
    if (Array.isArray(value)) out[key] = value.filter((m): m is string => typeof m === 'string')
  }
  return out
}

/**
 * One settings write with a single self-heal retry. A false return means the
 * host refused the optimistic lock — and the client has ALREADY completed its
 * recover() (a fresh describe folded into the mirror) by the time resolve
 * lands, so an immediate second attempt carries a fresh revision: the machine
 * equivalent of the user's proven "click it twice" workaround.
 */
async function setWithRetry(scope: SettingsScope<unknown>, field: string, value: unknown): Promise<{ ok: boolean; retried: boolean }> {
  const ok1 = await scope.set(field, value).catch(() => false)
  if (ok1) return { ok: true, retried: false }
  await new Promise((resolve) => setTimeout(resolve, 350))
  const ok2 = await scope.set(field, value).catch(() => false)
  return { ok: ok2, retried: true }
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
  /** The provider-level `api` (wire protocol): the host's compat gates differ per protocol. */
  providerApi?: unknown
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

/**
 * Whether this entry's wire protocol takes the model-level
 * openai-completions compat fields (`compat.thinkingFormat`,
 * `compat.supportsReasoningEffort`). The host llm-pi-ai gate (`COMPAT_GATES`)
 * offers them ONLY on openai-completions, and a MODEL-level write carrying one
 * on a Responses/Anthropic route fails the WHOLE providers payload
 * (`not configurable here`). An absent `api` keeps pi-ai's
 * openai-completions default, so the row stays editable.
 *
 * Scoped to the FIELD, never to thinking: the thinking DECLARATION
 * (`reasoningEfforts`) is protocol-neutral and stays editable everywhere — a
 * non-completions route merely must not carry the completions-only compat
 * fields alongside it (issue #6).
 * (exported for the gate's unit regression, issues #2/#6)
 */
export function completionsCompatConfigurable(entry: CapabilityEntry): boolean {
  return typeof entry.providerApi !== 'string' || entry.providerApi === 'openai-completions'
}

/**
 * The pre-#6 spelling of {@link completionsCompatConfigurable}, kept exported
 * because the 4.4.x line published it.
 * @deprecated use {@link completionsCompatConfigurable}.
 */
export const effortCompatConfigurable = completionsCompatConfigurable

/**
 * Write the Thinking checkbox's declaration onto ONE model row (the caller
 * hands the row inside its cloned providers payload). Protocol-aware on
 * purpose (issue #6):
 *
 * - `reasoningEfforts` is protocol-NEUTRAL: the host llm-pi-ai resolves it to
 *   `reasoning: true` + `thinkingLevelMap` for every wire protocol, and pi-ai
 *   then maps the levels natively (Anthropic thinking budget, Responses
 *   reasoning effort). Thinking is therefore declarable on all three protocol
 *   families — it is the prerequisite of the effort selector.
 * - the `off` wire value is where the protocols DIVERGE. `off: null` marks the
 *   level unsupported to pi-ai (`getSupportedThinkingLevels` drops it), which
 *   is the completions transport's "send nothing" toggle — fine there, but on
 *   a pi-ai-served route it would leave thinking un-turn-off-able. A
 *   non-completions route therefore keeps `off` SELECTABLE with the
 *   providers' own "no reasoning" token: Anthropic only needs it non-null
 *   (`thinking: {type:'disabled'}`), Responses sends `effort: 'none'`.
 * - the qwen `thinkingFormat` autofill is an openai-completions-ONLY compat
 *   field: writing it on a Responses/Anthropic route makes the host reject the
 *   whole providers payload, so it is skipped there and the format simply
 *   stays inherited.
 * @param entry - the capability entry whose provider protocol decides the gate.
 * @param row - the model row to mutate.
 * @param next - the new Thinking state.
 */
export function writeThinkingRow(
  entry: CapabilityEntry,
  row: Record<string, unknown>,
  next: boolean,
): void {
  if (!next) {
    // Thinking off: a non-reasoning model never takes an effort.
    row['reasoningEfforts'] = false
    return
  }
  // Thinking on: a table must exist so the wire drives enable_thinking /
  // reasoning_effort. Start from the persisted table or the default high
  // set; a toggle model (no effort) keeps supportsReasoningEffort false.
  const effortCapable = supportsEffortOf(row)
  const completions = completionsCompatConfigurable(entry)
  if (effortCapable) {
    row['reasoningEfforts'] = effortTableOf({ high: 'high' })
  } else if (completions) {
    row['reasoningEfforts'] = { off: null, high: 'high' }
  } else {
    row['reasoningEfforts'] = { off: 'none', high: 'high' }
  }
  // Toggle-style thinking models need the official qwen format so pi-ai
  // sends enable_thinking (early vLLM thinking models return no thinking
  // content without that flag, and reject reasoning_effort). Only fills
  // an absent format — an explicit choice is never clobbered — and only on
  // the one protocol whose compat takes the field.
  if (!effortCapable && completions) {
    patchCompat(row, (compat) => {
      if (compat['thinkingFormat'] === undefined) compat['thinkingFormat'] = 'qwen-chat-template'
    })
  }
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
      providerApi: raw['api'],
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
 * Horizontal pill toggle: the real checkbox stays the a11y control (sr-only),
 * the drawn track/knob reflects `checked` — which the card feeds from its
 * optimistic overlay, so the pill flips the instant the user clicks and rolls
 * back on a refused write (same pendingTl contract as every other field).
 */
function PillToggle(props: {
  id: string
  checked: boolean
  disabled: boolean
  title?: string
  onChange: (next: boolean) => void
}): JSX.Element {
  const { id, checked, disabled, title, onChange } = props
  return (
    <label
      htmlFor={id}
      title={title}
      style={{ display: 'inline-flex', alignItems: 'center', cursor: disabled ? 'default' : 'pointer' }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
        style={{ position: 'absolute', width: 1, height: 1, margin: 0, opacity: 0, pointerEvents: 'none' }}
      />
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: '36px',
          height: '20px',
          borderRadius: '999px',
          flex: '0 0 auto',
          position: 'relative',
          background: checked
            ? 'var(--dsw-alias-bg-control-primary, #4d6bfe)'
            : 'var(--dsw-alias-fill-input-primary, rgba(127,127,127,0.25))',
          border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))',
          transition: 'background 0.16s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '1px',
            left: checked ? '17px' : '1px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
            transition: 'left 0.16s',
          }}
        />
      </span>
    </label>
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
/**
 * The absent-transport snapshot: a module-level CONSTANT. `useSyncExternalStore`
 * requires getSnapshot to return a STABLE value — an inline fallback literal is
 * a new object on every call, and React spins an infinite update loop (#185)
 * the moment this block renders with no transport handle (the ready branch's
 * first-ever mount crash).
 */
const OC_ABSENT_SNAPSHOT = Object.freeze({
  status: 'unavailable' as const,
  value: undefined,
  revision: undefined,
  writable: false,
  base: undefined,
  user: undefined,
  mode: 'memory' as const,
})

function ModelCapabilities(props: {
  scope: SettingsScope<unknown>
  ocScope?: SettingsScope<unknown>
  /** The plugin's OWN settings scope (TL namespace): hosts the takeover master switch write. */
  tlScope?: SettingsScope<unknown>
  t: (key: string) => string
  readonly: boolean
}): JSX.Element {
  const { scope, ocScope, tlScope, t, readonly } = props
  // Stable subscription identities: inline lambdas make React resubscribe on
  // every render, and the host controller folds a fresh decoded snapshot into
  // its store on every subscribe — each resubscription would then look like a
  // store change and re-render forever.
  const subscribe = useCallback((listener: () => void) => scope.subscribe(listener), [scope])
  const getSnapshot = useCallback(() => scope.getSnapshot(), [scope])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  // The transport's live section: drives the per-route takeover checkbox.
  const ocSubscribe = useCallback(
    (listener: () => void) => ocScope?.subscribe(listener) ?? (() => {}),
    [ocScope],
  )
  const ocGetSnapshot = useCallback(
    () => (ocScope !== undefined ? ocScope.getSnapshot() : OC_ABSENT_SNAPSHOT),
    [ocScope],
  )
  const ocSnapshot = useSyncExternalStore(ocSubscribe, ocGetSnapshot)
  const ocSection = (ocSnapshot.status === 'ready' && typeof ocSnapshot.value === 'object' && ocSnapshot.value !== null
    ? ocSnapshot.value
    : {}) as { enabled?: unknown; providers?: unknown; extraInputs?: unknown }
  const ocWritable = ocSnapshot.status === 'ready' && ocSnapshot.writable && !readonly
  // Optimistic overlay (plan tl-write-immediacy §B): pending values shadow the
  // snapshots until their write settles. resolve(true) implies the client has
  // already accepted the new mirror view, so clearing the pending entry then
  // is gap-free; resolve(false) rolls the overlay back AND surfaces the error
  // banner. Optimistic writes deliberately do NOT touch `busy` — a 350ms
  // grey-out would defeat the instant-flip this overlay exists for.
  const [pendingOc, setPendingOc] = useState<Partial<{ enabled: boolean; providers: string[]; extraInputs: Record<string, string[]> }>>({})
  const [pendingPi, setPendingPi] = useState<Record<string, unknown> | undefined>(undefined)
  const [writeError, setWriteError] = useState<string | null>(null)
  const viewOc = { ...ocSection, ...pendingOc } as { enabled?: unknown; providers?: unknown; extraInputs?: unknown }
  const unavailable = snapshot.status === 'unavailable'
  const providers = snapshot.status === 'ready' ? providersOf(snapshot) : {}
  // H1: the overlay must sit at the SOURCE of the model-row derivation chain —
  // thinking / vision / effort / context all flow from entriesOf(...).
  const viewProviders = { ...providers, ...pendingPi }
  // Every llm-pi-ai provider is listed with its models — no list gating: the
  // official compat surface (dsh ≥ rc.8) means pi-ai serves every route
  // natively, so each model is editable right here.
  const allEntries = entriesOf(viewProviders)

  // UI-only state: provider/model expansion, the wire drafts, and the query.
  const [query, setQuery] = useState('')
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({})
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({})
  const [drafts, setDrafts] = useState<Record<string, Record<string, string | null>>>({})
  // `busy` has no writer by design (see the optimistic-write note above) —
  // every write path is optimistic with its own inline rollback, so the
  // disabled states below are currently pure `readonly` mirrors.
  const [busy] = useState(false)
  const [contextRaw, setContextRaw] = useState<Record<string, string>>({})
  const [contextError, setContextError] = useState<Record<string, string>>({})

  const entryKey = (entry: CapabilityEntry): string => `${entry.providerId}\u0000${entry.index}`

  /** Commit one patch over the user-layer providers (optimistic + self-heal retry). */
  const commitProviders = (mutate: (current: Record<string, unknown>) => Record<string, unknown>): void => {
    if (snapshot.status !== 'ready' || readonly) return
    const next = mutate(structuredClone(viewProviders))
    setPendingPi(next)
    void setWithRetry(scope, 'providers', next).then(({ ok }) => {
      setPendingPi(undefined)
      if (!ok) setWriteError(t('card.writeError'))
    })
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

  /**
   * Toggle the per-route third-party takeover. Ownership split (plan §D): this
   * checkbox writes MEMBERSHIP only — `OC.enabled`'s sole writer is the host
   * mirror of TL's `takeover` master. Checking a route while the master is off
   * lights the master through ONE TL-namespace write instead of the old direct
   * OC.enabled write that used to fight the mirror and bounce the checkbox.
   */
  const toggleTakeover = (providerId: string, next: boolean): void => {
    if (ocScope === undefined || !ocWritable) return
    const currentProviders = Array.isArray(viewOc.providers)
      ? (viewOc.providers as unknown[]).filter((id): id is string => typeof id === 'string')
      : []
    const providers = next
      ? [...new Set([...currentProviders, providerId])]
      : currentProviders.filter((id) => id !== providerId)
    setPendingOc((cur) => ({ ...cur, providers }))
    // Master-off detection reads TL's OWN snapshot, never viewOc.enabled: the
    // enabled field folds lazily (host mirror timing) and reads stale-true
    // right after a master-off click, which would skip the auto-light. The
    // TL snapshot folds on the master write itself, so it is always fresh.
    const tlTakeoverNow = (tlScope?.getSnapshot().value as { takeover?: unknown } | undefined)?.takeover === true
    if (next && !tlTakeoverNow && tlScope !== undefined) {
      // Light the master AND carry OC.enabled with it in-session: the host
      // mirror only reconciles at boot reliably, so the card writes both sides
      // of the lighting (same value — no fight with the mirror is possible).
      void setWithRetry(tlScope, 'takeover', true).then(({ ok }) => {
        if (!ok) setWriteError(t('card.writeError'))
      })
      void setWithRetry(ocScope, 'enabled', true).then(({ ok }) => {
        if (!ok) setWriteError(t('card.writeError'))
      })
    }
    void setWithRetry(ocScope, 'providers', providers).then(({ ok }) => {
      setPendingOc((cur) => {
        const rest = { ...cur }
        delete rest['providers']
        return rest
      })
      if (!ok) {
        setPendingOc((cur) => ({ ...cur, providers: currentProviders }))
        setWriteError(t('card.writeError'))
      }
    })
  }

  /** The model's extra input modalities declared on the transport ('provider/model' key). */
  const modelExtrasOf = (providerId: string, modelId: string): string[] =>
    extraInputsOf(viewOc)[`${providerId}/${modelId}`] ?? []

  /** Toggle one model's video/audio declaration on the transport's extraInputs.
   *  The host pi-ai schema caps model-row `input` at text|image, so omni
   *  modalities live here — effective only while the route is taken over. */
  const toggleModelModality = (providerId: string, modelId: string, modality: 'video' | 'audio', next: boolean): void => {
    if (ocScope === undefined || !ocWritable) return
    const current = extraInputsOf(viewOc)
    const modelKey = `${providerId}/${modelId}`
    const entry = Array.isArray(current[modelKey]) ? [...current[modelKey]] : []
    const nextEntry = next ? [...new Set([...entry, modality])] : entry.filter((m) => m !== modality)
    const nextDict: Record<string, string[]> = { ...current }
    if (nextEntry.length > 0) nextDict[modelKey] = nextEntry
    else delete nextDict[modelKey]
    setPendingOc((cur) => ({ ...cur, extraInputs: nextDict }))
    void setWithRetry(ocScope, 'extraInputs', nextDict).then(({ ok }) => {
      setPendingOc((cur) => {
        const rest = { ...cur }
        delete rest['extraInputs']
        return rest
      })
      if (!ok) {
        setPendingOc((cur) => ({ ...cur, extraInputs: current }))
        setWriteError(t('card.writeError'))
      }
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

  /**
   * Toggle whether a model is a thinking model (`reasoningEfforts` table vs
   * false). Delegates the row patch to {@link writeThinkingRow}: thinking is
   * declared on every protocol, only the completions-only format autofill is
   * protocol-gated.
   */
  const toggleThinking = (entry: CapabilityEntry, next: boolean): void => {
    patchModel(entry.providerId, entry.index, (row) => writeThinkingRow(entry, row, next))
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
      {writeError !== null && (
        <p style={{ margin: '0 0 4px', fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-danger, #e5484d)' }} role="status">⚠ {writeError}</p>
      )}

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
                <label
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', whiteSpace: 'nowrap', color: ocWritable ? 'var(--dsw-alias-label-secondary)' : 'var(--dsw-alias-label-disabled, var(--dsw-alias-label-caption))' }}
                  title={ocScope === undefined ? t('card.capabilities.takeoverHintAbsent') : t('card.capabilities.takeoverHint')}
                >
                  <input
                    type="checkbox"
                    checked={takeoverActiveOf(viewOc, providerId)}
                    disabled={readonly || busy || !ocWritable}
                    onChange={(event) => toggleTakeover(providerId, event.currentTarget.checked)}
                  />
                  <span>{t('card.capabilities.takeover')}</span>
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
                  // Issue #2/#6: a non-completions protocol refuses the
                  // openai-completions compat FIELDS at the write site — grey
                  // exactly those out before the attempt instead of failing the
                  // whole providers payload. The Thinking switch stays live on
                  // every protocol: it writes protocol-neutral `reasoningEfforts`
                  // (the prerequisite of the effort selector).
                  const compatGated = !completionsCompatConfigurable(entry)
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
                        {modelExtrasOf(entry.providerId, entry.modelId).includes('video') && <span style={badgeStyle} title="video (extraInputs)">VID</span>}
                        {modelExtrasOf(entry.providerId, entry.modelId).includes('audio') && <span style={badgeStyle} title="audio (extraInputs)">AUD</span>}
                        {meta.context !== null && <span style={badgeStyle}>{meta.context}</span>}
                        {thinking && !supportsEffort && <span style={badgeStyle}>On/Off</span>}
                      </div>
                      {modelOpen
                        ? (
                          <div style={{ padding: '4px 10px 10px', borderTop: '1px solid var(--dsw-alias-border-l2)' }}>
                            {compatGated && <p style={hintStyle}>{t('card.capabilities.apiUnsupported')}</p>}
                            {/* Layer 1 — base capabilities: is it a thinking model? A vision model? */}
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', margin: '2px 0 8px' }}>
                              <label
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                                title={compatGated ? t('card.capabilities.thinkingNative') : undefined}
                              >
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
                              {/* Video/audio declarations live on the taken-over transport
                                  (extraInputs): the host model-row input enum caps at text|image. */}
                              {(['video', 'audio'] as const).map(modality => (
                                <label
                                  key={modality}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: takeoverActiveOf(viewOc, entry.providerId) ? undefined : 'var(--dsw-alias-label-disabled, var(--dsw-alias-label-caption))' }}
                                  title={t('card.capabilities.mediaHint')}
                                >
                                  <input
                                    type="checkbox"
                                    checked={modelExtrasOf(entry.providerId, entry.modelId).includes(modality)}
                                    disabled={readonly || busy || !ocWritable || !takeoverActiveOf(viewOc, entry.providerId)}
                                    onChange={(event) => toggleModelModality(entry.providerId, entry.modelId, modality, event.currentTarget.checked)}
                                  />
                                  <span>{t(`card.capabilities.${modality}`)}</span>
                                </label>
                              ))}
                            </div>
                            {/* Layer 2 — only for thinking models: does it take reasoning_effort levels? */}
                            {thinking
                              ? (
                                <label
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', margin: '0 0 8px' }}
                                  title={compatGated ? t('card.capabilities.apiUnsupported') : undefined}
                                >
                                  <input
                                    type="checkbox"
                                    checked={supportsEffort}
                                    disabled={readonly || busy || compatGated}
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
                                  disabled={readonly || busy || compatGated}
                                  title={compatGated ? t('card.capabilities.apiUnsupported') : undefined}
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
 * The absent-llm-deepseek snapshot: module-level CONSTANT (the stable-snapshot
 * rule that killed the first-ever panel mount, #185).
 */
const DS_ABSENT_SNAPSHOT = Object.freeze({
  status: 'unavailable' as const,
  value: undefined,
  revision: undefined,
  writable: false,
  base: undefined,
  user: undefined,
  mode: 'memory' as const,
})

/**
 * Official DeepSeek model context-window editor (4.4.0): the per-line editor
 * lived only in the ModelPanel; with the seat takeover off by default the
 * card owns it. Writes mirror the panel's DEEPSEEK branch exactly: the model
 * entry's `contextWindow` when listed, the route `defaultContextWindow`
 * otherwise (clear = back to the native 1M).
 * @param props - the llm-deepseek scope (absent = section hidden), copy, fence.
 * @returns the editor block, or null when the namespace/scope is unavailable.
 */
function DeepSeekContextSection(props: {
  scope: SettingsScope<unknown> | undefined
  t: (key: string) => string
  readonly: boolean
}): JSX.Element | null {
  const { scope, t, readonly } = props
  const subscribe = useCallback(
    (listener: () => void) => (scope !== undefined ? scope.subscribe(listener) : () => {}),
    [scope],
  )
  const getSnapshot = useCallback(
    () => (scope === undefined ? DS_ABSENT_SNAPSHOT : scope.getSnapshot()),
    [scope],
  )
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const [raw, setRaw] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  if (snapshot.status !== 'ready') return null
  const section = deepseekSectionOf(snapshot)
  const models = section.models ?? []
  if (models.length === 0 && section.defaultContextWindow === undefined) return null
  const writable = snapshot.writable && !readonly && !busy

  /** Commit one row's window (index -1 = the route default layer). */
  const commit = (index: number, value: number | undefined): void => {
    if (scope === undefined || !writable) return
    setBusy(true)
    const rows = (deepseekSectionOf(scope.getSnapshot()).models ?? []).map(entry => ({ ...entry }))
    const write = index >= 0
      ? scope.set('models', rows.map((entry, at) => {
        if (at !== index) return entry
        if (value === undefined) {
          const rest = { ...entry }
          delete rest['contextWindow']
          return rest
        }
        return { ...entry, contextWindow: value }
      }))
      : scope.set('defaultContextWindow', value ?? DEEPSEEK_DEFAULT_WINDOW)
    void write.then(
      () => {
        setBusy(false)
        setErrors(cur => {
          const next = { ...cur }
          delete next[String(index)]
          return next
        })
      },
      () => {
        setBusy(false)
        setErrors(cur => ({ ...cur, [String(index)]: t('card.capabilities.failed') }))
      },
    )
  }

  /** Validate and commit the custom input; empty clears. */
  const applyCustom = (index: number): void => {
    const key = String(index)
    const trimmed = (raw[key] ?? '').trim()
    if (trimmed === '') {
      commit(index, undefined)
      return
    }
    const validation = validateContextWindow(trimmed)
    if (!validation.ok) {
      setErrors(cur => ({
        ...cur,
        [key]: t(validation.reason === 'integer' ? 'input.context.integer' : 'input.context.range'),
      }))
      return
    }
    commit(index, validation.value)
  }

  const rows: { label: string; index: number; value: number | undefined }[] = [
    ...models.map((entry, index) => ({
      label: String(entry['name'] ?? entry['id'] ?? index),
      index,
      value: contextWindowOf(entry),
    })),
    { label: t('model.panel.window'), index: -1, value: section.defaultContextWindow },
  ]

  return (
    <div style={sectionStyle}>
      <p style={fieldLabelStyle}>{t('card.dsContextTitle')}</p>
      {rows.map(row => {
        const key = String(row.index)
        return (
          <div key={key} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', margin: '6px 0' }}>
            <span style={{ ...fieldLabelStyle, margin: 0 }}>{row.label}</span>
            <span style={badgeStyle}>{row.value === undefined ? t('input.context.unset') : formatContextWindow(row.value)}</span>
            {CONTEXT_WINDOW_PRESETS.map(preset => (
              <button
                key={preset.value}
                type="button"
                disabled={!writable}
                onClick={() => commit(row.index, preset.value)}
                style={{
                  ...controlStyle,
                  padding: '2px 8px',
                  cursor: writable ? 'pointer' : 'default',
                  opacity: writable ? 1 : 0.5,
                }}
              >
                {preset.label}
              </button>
            ))}
            <input
              type="text"
              inputMode="numeric"
              value={raw[key] ?? ''}
              disabled={!writable}
              placeholder={t('card.capabilities.contextCustomPlaceholder')}
              style={{ ...controlStyle, width: '120px' }}
              onChange={event => setRaw(cur => ({ ...cur, [key]: event.currentTarget.value }))}
              onKeyDown={event => { if (event.key === 'Enter') applyCustom(row.index) }}
            />
            <button
              type="button"
              disabled={!writable || row.value === undefined}
              onClick={() => commit(row.index, undefined)}
              style={{ ...controlStyle, padding: '2px 8px' }}
            >
              {t('input.context.clear')}
            </button>
            {errors[key] !== undefined && (
              <span style={{ fontSize: '12px', color: 'var(--dsw-alias-danger, #e5484d)' }}>{errors[key]}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * The card body, wrapped in a disclosure shell like every peer settings card:
 * a header (name + description + chevron) that toggles the body, expanded by
 * default so the family section reads as an open page of drawers.
 * @param props - locale copy and the injected scopes.
 */
export function ThinkingLevelsCard({ t, scope, piAiScope, ocScope, deepseekScope }: ThinkingLevelsCardProps): JSX.Element {
  const [open, setOpen] = useState(true)
  // Stable subscription identities (see ModelCapabilities): the host controller
  // folds a fresh snapshot on every subscribe, so per-render inline lambdas
  // would resubscribe→fold→re-render forever.
  const subscribe = useCallback((listener: () => void) => scope.subscribe(listener), [scope])
  const getSnapshot = useCallback(() => scope.getSnapshot(), [scope])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
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
    takeover: boolean
    takeoverUi: boolean
    defaultPricing: PricingPolicy
  }>
  // Optimistic overlay for this card's own writes (plan §E): same contract as
  // the capability card's overlay — clear on resolve(true), roll back + banner
  // on resolve(false).
  const [pendingTl, setPendingTl] = useState<Partial<{ enabled: boolean; level: EffortId; allowDowngrade: boolean; allowUpgrade: boolean; takeover: boolean; takeoverUi: boolean; defaultPricing: PricingPolicy }>>({})
  const [writeErrorTl, setWriteErrorTl] = useState<string | null>(null)
  const viewValue = { ...value, ...pendingTl }
  const level = EFFORT_OPTIONS.includes(viewValue.level as EffortId) ? viewValue.level as EffortId : 'auto'
  const defaultPricing = PRICING_OPTIONS.includes(viewValue.defaultPricing as PricingPolicy) ? viewValue.defaultPricing as PricingPolicy : 'estimate'
  const writeTl = (field: 'enabled' | 'level' | 'allowDowngrade' | 'allowUpgrade' | 'takeover' | 'takeoverUi' | 'defaultPricing', v: unknown): void => {
    setPendingTl((cur) => ({ ...cur, [field]: v as never }))
    void setWithRetry(scope, field, v).then(({ ok }) => {
      setPendingTl((cur) => {
        const rest = { ...cur }
        delete rest[field]
        return rest
      })
      if (!ok) setWriteErrorTl(t('card.writeError'))
    })
    // The takeover master carries OC.enabled with it in-session (same value):
    // the host mirror reconciles at boot, but an in-session flip must take
    // effect immediately — writing the same value the mirror would write can
    // never fight it.
    if (field === 'takeover' && typeof v === 'boolean' && ocScope !== undefined) {
      void setWithRetry(ocScope, 'enabled', v).then(({ ok }) => {
        if (!ok) setWriteErrorTl(t('card.writeError'))
      })
    }
  }

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
                      onChange={(event) => { writeTl('level', event.currentTarget.value as EffortId) }}
                    >
                      {EFFORT_OPTIONS.map((option) => (
                        <option key={option} value={option}>{t(`card.level.${option}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div style={rowStyle}>
                    <label htmlFor="plugin-config-thinking-levels-enabled" style={labelStyle}>{t('card.enabled')}</label>
                    <PillToggle
                      id="plugin-config-thinking-levels-enabled"
                      checked={viewValue.enabled ?? true}
                      disabled={readonly}
                      onChange={(next) => { writeTl('enabled', next) }}
                    />
                  </div>
                  <div style={rowStyle}>
                    <label
                      htmlFor="plugin-config-thinking-levels-takeover"
                      style={labelStyle}
                      title={t('card.masterTakeoverHint')}
                    >{t('card.masterTakeover')}</label>
                    <PillToggle
                      id="plugin-config-thinking-levels-takeover"
                      checked={viewValue.takeover ?? false}
                      disabled={readonly}
                      title={t('card.masterTakeoverHint')}
                      onChange={(next) => { writeTl('takeover', next) }}
                    />
                  </div>
                  <div style={rowStyle}>
                    <label
                      htmlFor="plugin-config-thinking-levels-takeover-ui"
                      style={labelStyle}
                      title={t('card.takeoverUiHint')}
                    >{t('card.takeoverUi')}</label>
                    <PillToggle
                      id="plugin-config-thinking-levels-takeover-ui"
                      checked={viewValue.takeoverUi ?? false}
                      disabled={readonly}
                      title={t('card.takeoverUiHint')}
                      onChange={(next) => { writeTl('takeoverUi', next) }}
                    />
                  </div>
                  {/* Visible explainer (user feedback: what enabling actually
                      buys must be readable without hunting for a tooltip). */}
                  <p style={{ ...hintStyle, margin: '2px 0 10px' }}>{t('card.takeoverUiHint')}</p>
                  <div style={rowStyle}>
                    <label htmlFor="plugin-config-thinking-levels-downgrade" style={labelStyle}>{t('card.allowDowngrade')}</label>
                    <PillToggle
                      id="plugin-config-thinking-levels-downgrade"
                      checked={viewValue.allowDowngrade ?? true}
                      disabled={readonly || viewValue.level !== 'auto'}
                      onChange={(next) => { writeTl('allowDowngrade', next) }}
                    />
                  </div>
                  <div style={rowStyle}>
                    <label htmlFor="plugin-config-thinking-levels-upgrade" style={labelStyle}>{t('card.allowUpgrade')}</label>
                    <PillToggle
                      id="plugin-config-thinking-levels-upgrade"
                      checked={viewValue.allowUpgrade ?? false}
                      disabled={readonly || viewValue.level !== 'auto'}
                      onChange={(next) => { writeTl('allowUpgrade', next) }}
                    />
                  </div>
                  <div style={rowStyle}>
                    <label
                      htmlFor="plugin-config-thinking-levels-default-pricing"
                      style={labelStyle}
                      title={t('card.defaultPricingHint')}
                    >{t('card.defaultPricing')}</label>
                    <select
                      id="plugin-config-thinking-levels-default-pricing"
                      value={defaultPricing}
                      disabled={readonly}
                      style={controlStyle}
                      onChange={(event) => { writeTl('defaultPricing', event.currentTarget.value) }}
                    >
                      {PRICING_OPTIONS.map((option) => (
                        <option key={option} value={option}>{t(`card.defaultPricing.${option}`)}</option>
                      ))}
                    </select>
                  </div>
                  {writeErrorTl !== null && (
                    <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--dsw-alias-danger, #e5484d)' }} role="status">⚠ {writeErrorTl}</p>
                  )}
                  {!snapshot.writable
                    && <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)' }}>{t('card.readonly')}</p>}
                  <ModelCapabilities scope={piAiScope} ocScope={ocScope} tlScope={scope} t={t} readonly={readonly} />
                  <DeepSeekContextSection scope={deepseekScope} t={t} readonly={readonly} />
                </>
              )}
          </div>
        )
        : null}
    </div>
  )
}
