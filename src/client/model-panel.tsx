/**
 * Model-seat panel for the composer (`conversation.input.model`).
 *
 * Why this seat: the shipped `ModelSelect` renders no slots inside its popup,
 * so a plugin can never contribute *into* that panel — the working pattern
 * (proven by dsh-reasoning-effort) is to occupy the model seat itself: one
 * registered entry named after the seat with `priority: -1` replaces the
 * shipped trigger and popup outright. This component then renders its own
 * picker over the harness's shared model directory (`modelDirectories`
 * service), so model switching keeps working, and adds what the official
 * popup cannot offer: a context-window editor on every model line.
 *
 * Per-line context window (the "max context window" moved into each line):
 * each model row carries a compact chip showing the model's effective
 * `contextWindow`; clicking it opens an inline editor row (preset slider,
 * custom-integer input, Clear). Writes follow the same two-family discipline
 * the retired composer pill used (both consumed live by
 * `resolveModelInfo(...).context.contextWindow`, effective on the next
 * request without a restart):
 * - Custom gateways (`llm-pi-ai` providers): writes the model entry's
 *   `contextWindow` under `providers[provider].models[i]`; a gateway model
 *   missing from the config has no write target and renders the chip disabled.
 * - Official DeepSeek (`deepseek-official`, the `llm-deepseek` entry): writes
 *   the catalog model's `contextWindow` when listed, otherwise caps via
 *   `defaultContextWindow`.
 *
 * Per-line reasoning effort (the 改造 panel): the retired per-line `<select>`
 * became an effort chip that expands an inline segment slider
 * (`EffortSlider`) under the model line — stop count adapts to the model's
 * advertised efforts, `auto` sits leftmost, the thumb follows the pointer and
 * snaps on release. DeepSeek lines run the whale-girl runner strip as the
 * thumb (`isDeepSeekLine`); every other model gets the plain white knob. The
 * select's "provider default" reset survives as the ↺ button of the slider
 * row (submits the declared `defaultEffort`).
 *
 * Graceful degradation: when the harness provides no `modelDirectories`
 * service (older lines) the registration is skipped entirely and the shipped
 * model selector stays untouched.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, JSX } from 'react'
import type { SettingsScope } from './scope-face.ts'
import { EffortSlider } from './effort-slider.tsx'
import { orderEffortsForSlider } from '../thinking-level.ts'
import { CONTEXT_WINDOW_PRESETS, formatContextWindow, validateContextWindow } from '../context-window.ts'

/** The official DeepSeek provider route owned by the llm-deepseek adapter. */
const DEEPSEEK_PROVIDER = 'deepseek-official'
/** llm-deepseek's native default context capacity (DEFAULT_CONTEXT_WINDOW). */
const DEEPSEEK_DEFAULT_WINDOW = 1_000_000
/** Slider stop an unset window parks on: the thumb needs a position, the readout stays "unset". */
const UNSET_STOP_INDEX = CONTEXT_WINDOW_PRESETS.findIndex(preset => preset.value === 256_000)

/**
 * Whether one model line gets the whale-girl runner thumb: the official
 * DeepSeek route plus any gateway model whose id or display name says
 * deepseek (custom "DeepSeek"-named providers). Every other line gets the
 * plain white knob.
 */
const isDeepSeekLine = (provider: string, modelId: string, name: string | undefined): boolean =>
  provider === DEEPSEEK_PROVIDER || /deepseek/i.test(modelId) || /deepseek/i.test(name ?? '')

/** Snapshot shown when the session's directory face is unavailable. */
const UNAVAILABLE_STATE: ModelDirectoryState = {
  status: 'loading',
  groups: [],
  current: null,
  error: null,
}

/** One injected face: the shared model directory plus the two config forms. */
export interface ModelPanelInjected {
  /**
   * The session's shared model directory store, loader and selector.
   * Undefined when the resolver refused this session (odd session shape):
   * the panel renders its unavailable notice instead of crashing — a thrown
   * render abdicates the seat entry and the shipped selector comes back.
   */
  directory: ModelDirectoryFace | undefined
  /** The `llm-pi-ai` config form (custom gateway models). */
  piAiScope: SettingsScope<unknown>
  /** The `llm-deepseek` config form (official DeepSeek models). */
  deepseekScope: SettingsScope<unknown>
}

/** Full props: the injected face + the session standard seat + locale copy. */
export interface ModelPanelProps extends ModelPanelInjected {
  /** The session id of the slot's owning conversation (standard seat). */
  sessionId: string
  /** Locale copy thunk. */
  t: (key: string) => string
}

/* ── shared inline styling (no CSS modules in the client bundle) ───────── */

const rootStyle: CSSProperties = { position: 'relative', display: 'inline-flex' }

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  height: '26px',
  padding: '0 10px',
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '8px',
  fontSize: '12px',
  lineHeight: '18px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  maxWidth: '220px',
}

const triggerNameStyle: CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const triggerEffortStyle: CSSProperties = {
  flex: '0 0 auto',
  maxWidth: '72px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: 'var(--dsw-alias-label-tertiary)',
}

const chevronStyle: CSSProperties = {
  flex: '0 0 auto',
  fontSize: '9px',
  color: 'var(--dsw-alias-label-tertiary)',
}

const popStyle: CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 8px)',
  left: '0',
  // Above host chrome (the composer tool rows render z-indexed FABs); capped
  // by the viewport so a narrow chat column can still reach every row.
  zIndex: 1300,
  width: 'min(320px, calc(100vw - 24px))',
  padding: '8px',
  background: 'var(--dsw-alias-bg-layer-3)',
  color: 'var(--dsw-alias-label-primary)',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '10px',
  boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

const backdropStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 1299 }

const modelsStyle: CSSProperties = { maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }

const providerToggleStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  width: '100%',
  padding: '6px 8px',
  border: 'none',
  borderRadius: '6px',
  background: 'transparent',
  color: 'var(--dsw-alias-label-secondary)',
  font: 'inherit',
  fontSize: '12px',
  cursor: 'pointer',
  textAlign: 'left',
}

const providerNameStyle: CSSProperties = { flex: '1 1 auto', fontWeight: 600 }

const providerMetaStyle: CSSProperties = {
  flex: '0 0 auto',
  color: 'var(--dsw-alias-label-tertiary)',
  fontSize: '11px',
}

/** The model-line row CONTAINER: highlight surface + flex parent of pick/select/chip.
* Wraps so the inline window editor (a flex item too) takes its own full line. */
const modelRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px',
  width: '100%',
  borderRadius: '6px',
}

const modelRowActiveStyle: CSSProperties = {
  ...modelRowStyle,
  background: 'var(--dsw-alias-state-business-primary-weak, var(--dsw-alias-interactive-bg-hover, transparent))',
}

/** The pick button inside the row: name/description/✓, keeps the row's old padding. */
const modelPickStyle: CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 4px 6px 18px',
  border: 'none',
  background: 'transparent',
  color: 'var(--dsw-alias-label-primary)',
  font: 'inherit',
  fontSize: '12px',
  cursor: 'pointer',
  textAlign: 'left',
}

const modelCopyStyle: CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
}

const modelNameStyle: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

const checkStyle: CSSProperties = { flex: '0 0 auto', color: 'var(--dsw-alias-state-business-primary)' }

const chipStyle: CSSProperties = {
  flex: '0 0 auto',
  height: '18px',
  padding: '0 6px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '5px',
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-secondary)',
  fontSize: '11px',
  lineHeight: '16px',
  fontFamily: 'var(--ds-font-family-code, monospace)',
  fontVariantNumeric: 'tabular-nums',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  marginRight: '8px',
}

const chipDisabledStyle: CSSProperties = { ...chipStyle, cursor: 'default', opacity: 0.55 }

/** The per-line effort chip (ex-select): shows the line's effective level name. */
const effortChipStyle: CSSProperties = {
  flex: '0 0 auto',
  height: '18px',
  maxWidth: '96px',
  padding: '0 6px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '5px',
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-secondary)',
  fontSize: '11px',
  lineHeight: '16px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  userSelect: 'none',
}

const editorRowStyle: CSSProperties = {
  flex: '1 1 100%',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  margin: '2px 8px 6px 18px',
  padding: '6px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '6px',
  background: 'var(--dsw-alias-bg-layer-1)',
  fontSize: '12px',
  // Stack above the neighboring model rows: the slider's girl/flare layers
  // must not lose the paint order against the row containers below it.
  position: 'relative',
  zIndex: 2,
}

const labelStyle: CSSProperties = {
  flex: '0 0 auto',
  color: 'var(--dsw-alias-label-tertiary)',
  whiteSpace: 'nowrap',
}

const sliderStyle: CSSProperties = {
  flex: '1 1 auto',
  minWidth: '48px',
  maxWidth: '170px',
  height: '14px',
  margin: '0',
  padding: '0',
  accentColor: 'var(--dsw-alias-state-business-primary)',
  cursor: 'pointer',
}

const valueStyle: CSSProperties = {
  flex: '0 0 auto',
  minWidth: '24px',
  textAlign: 'right',
  color: 'var(--dsw-alias-label-primary)',
  fontFamily: 'var(--ds-font-family-code, monospace)',
  fontVariantNumeric: 'tabular-nums',
}

const actionButtonStyle: CSSProperties = {
  flex: '0 0 auto',
  height: '18px',
  padding: '0 6px',
  border: '1px solid transparent',
  borderRadius: '4px',
  background: 'transparent',
  color: 'var(--dsw-alias-label-secondary)',
  font: 'inherit',
  cursor: 'pointer',
}

const inputStyle: CSSProperties = {
  flex: '1 1 auto',
  minWidth: '0',
  boxSizing: 'border-box',
  padding: '2px 6px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '5px',
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
  font: 'inherit',
}

const errorStyle: CSSProperties = {
  flex: '0 0 auto',
  color: 'var(--dsw-alias-state-error-primary)',
  fontSize: '11px',
}

const statusStyle: CSSProperties = {
  padding: '10px 8px',
  fontSize: '12px',
  color: 'var(--dsw-alias-label-tertiary)',
}

const errorBannerStyle: CSSProperties = {
  padding: '6px 8px',
  borderRadius: '6px',
  background: 'var(--dsw-alias-interactive-bg-hover-danger)',
  color: 'var(--dsw-alias-state-error-primary)',
  fontSize: '11px',
}

/* ── helpers over the settings user layer ──────────────────────────────── */

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

/** The user-layer `models`/`defaultContextWindow` of the llm-deepseek namespace. */
function deepseekSectionOf(snapshot: unknown): {
  models?: Record<string, unknown>[]
  defaultContextWindow?: number
} {
  if (typeof snapshot !== 'object' || snapshot === null) return {}
  const user = (snapshot as { user?: unknown }).user
  if (typeof user !== 'object' || user === null || Array.isArray(user)) return {}
  const section = user as { models?: unknown; defaultContextWindow?: unknown }
  const models = Array.isArray(section.models)
    ? section.models.filter((model): model is Record<string, unknown> =>
      typeof model === 'object' && model !== null && !Array.isArray(model))
    : undefined
  const defaultContextWindow = typeof section.defaultContextWindow === 'number'
    ? section.defaultContextWindow
    : undefined
  return {
    ...models === undefined ? {} : { models },
    ...defaultContextWindow === undefined ? {} : { defaultContextWindow },
  }
}

/** One model entry's declared contextWindow, when present. */
function contextWindowOf(model: Record<string, unknown>): number | undefined {
  const value = model['contextWindow']
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

/** A provider's model entry in the llm-pi-ai user layer, when present. */
function piModelEntry(
  providers: Record<string, unknown>,
  provider: string,
  model: string,
): Record<string, unknown> | undefined {
  const profile = providers[provider] as { models?: unknown[] } | undefined
  const entry = profile !== undefined && Array.isArray(profile.models)
    ? profile.models.find((candidate): candidate is Record<string, unknown> =>
      typeof candidate === 'object' && candidate !== null && (candidate as Record<string, unknown>)['id'] === model)
    : undefined
  return entry
}

/** The slider stop nearest to a committed token count. */
function stopIndexOf(value: number | undefined): number {
  if (value === undefined) return Math.max(0, UNSET_STOP_INDEX)
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  CONTEXT_WINDOW_PRESETS.forEach((preset, index) => {
    const distance = Math.abs(preset.value - value)
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  })
  return best
}

/**
 * The model-seat panel: replaces the shipped model selector on this seat and
 * renders one picker whose every model line carries a context-window chip
 * (the "max context window" editor moved into each line).
 * @param props - injected directory + config forms, session seat, copy.
 */
export function ModelPanel({ directory, piAiScope, deepseekScope, t }: ModelPanelProps): JSX.Element {
  const state = useSyncExternalStore(
    listener => directory?.store.subscribe(listener) ?? (() => {}),
    () => directory?.store.getSnapshot() ?? UNAVAILABLE_STATE,
  )
  const piSnapshot = useSyncExternalStore(
    listener => piAiScope.subscribe(listener),
    () => piAiScope.getSnapshot(),
  )
  const dsSnapshot = useSyncExternalStore(
    listener => deepseekScope.subscribe(listener),
    () => deepseekScope.getSnapshot(),
  )

  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  // One inline editor at a time: the context-window editor or the effort slider,
  // expanded under their own model line (the row wraps it onto its own line).
  const [editing, setEditing] = useState<{ provider: string; model: string; kind: 'context' | 'effort' } | null>(null)
  const [draft, setDraft] = useState<number | null>(null)
  const [custom, setCustom] = useState(false)
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    directory?.load().catch(() => { /* surfaced on the shared store */ })
  }, [directory, open])

  const close = useCallback((): void => {
    setOpen(false)
    setEditing(null)
    setError(null)
  }, [])

  useEffect(() => {
    if (!open) return
    const onOutside = (event: globalThis.MouseEvent): void => {
      const target = event.target
      if (target instanceof Node && rootRef.current?.contains(target)) return
      close()
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [close, open])

  const writable = piSnapshot.status === 'ready' && piSnapshot.writable
    && dsSnapshot.status === 'ready' && dsSnapshot.writable

  const current = useMemo(() => {
    if (state.current === null) return undefined
    for (const group of state.groups) {
      if (group.id !== state.current.provider) continue
      const model = group.models.find(candidate => candidate.id === state.current?.model)
      if (model !== undefined) return { model, name: model.name }
    }
    return undefined
  }, [state])

  const providers = useMemo(() => providersOf(piSnapshot), [piSnapshot])
  const dsSection = useMemo(() => deepseekSectionOf(dsSnapshot), [dsSnapshot])

  /** The effective window of one model line, resolved against its family. */
  const windowOf = (provider: string, model: string): number | undefined => {
    if (provider === DEEPSEEK_PROVIDER) {
      const models = dsSection.models ?? []
      const index = models.findIndex(entry => entry['id'] === model)
      return index >= 0 ? contextWindowOf(models[index]) : dsSection.defaultContextWindow
    }
    const entry = piModelEntry(providers, provider, model)
    return entry === undefined ? undefined : contextWindowOf(entry)
  }

  /** Whether one model line has a config write target. */
  const writableLine = (provider: string, model: string): boolean => {
    if (!writable) return false
    if (provider === DEEPSEEK_PROVIDER) return true
    return piModelEntry(providers, provider, model) !== undefined
  }

  /** Commit (or delete) one model line's context window. */
  const commitWindow = (provider: string, model: string, value: number | undefined): void => {
    setBusy(true)
    const done = (): void => { setBusy(false); setDraft(null) }
    if (provider === DEEPSEEK_PROVIDER) {
      const models = (deepseekSectionOf(dsSnapshot).models ?? []).map(entry => ({ ...entry }))
      const index = models.findIndex(entry => entry['id'] === model)
      const commit = index >= 0
        ? deepseekScope.set('models', models.map((entry, at) => {
          if (at !== index) return entry
          if (value === undefined) {
            const rest = { ...entry }
            delete rest['contextWindow']
            return rest
          }
          return { ...entry, contextWindow: value }
        }))
        : deepseekScope.set('defaultContextWindow', value === undefined ? DEEPSEEK_DEFAULT_WINDOW : value)
      commit.then(done, done)
      return
    }
    const next = structuredClone(providers)
    const entry = piModelEntry(next, provider, model)
    if (entry === undefined) {
      setBusy(false)
      setDraft(null)
      return
    }
    if (value === undefined) delete entry['contextWindow']
    else entry['contextWindow'] = value
    piAiScope.set('providers', next).then(done, done)
  }

  /** Validate and commit the custom input; empty clears. */
  const applyCustom = (): void => {
    if (editing === null) return
    const trimmed = raw.trim()
    if (trimmed === '') {
      setError(null)
      commitWindow(editing.provider, editing.model, undefined)
      return
    }
    const validation = validateContextWindow(trimmed)
    if (!validation.ok) {
      setError(t(validation.reason === 'integer' ? 'input.context.integer' : 'input.context.range'))
      return
    }
    setError(null)
    commitWindow(editing.provider, editing.model, validation.value)
  }

  const openEditor = (provider: string, model: string): void => {
    setEditing({ provider, model, kind: 'context' })
    setDraft(null)
    setCustom(false)
    setRaw('')
    setError(null)
  }

  /** Toggle one line's inline effort slider (the ex-select). */
  const toggleEffortEditor = (provider: string, model: string): void => {
    setEditing(previous =>
      previous !== null && previous.provider === provider && previous.model === model && previous.kind === 'effort'
        ? null
        : { provider, model, kind: 'effort' })
  }

  const toggleProvider = (provider: string): void => {
    setExpanded(previous => {
      const next = new Set(previous)
      if (next.has(provider)) next.delete(provider)
      else next.add(provider)
      return next
    })
  }

  const chooseModel = (provider: string, model: string): void => {
    if (busy || directory === undefined) return
    setBusy(true)
    directory.select({ provider, model })
      .then(() => { setBusy(false); close() })
      .catch(() => { setBusy(false) })
  }

  /** Commit one model line's reasoning effort; empty string = provider default (omit the field). */
  const chooseEffort = (provider: string, model: string, effort: string): void => {
    if (busy || directory === undefined) return
    setBusy(true)
    directory.select({ provider, model, ...(effort === '' ? {} : { reasoningEffort: effort }) })
      .then(() => { setBusy(false) })
      .catch(() => { setBusy(false) })
  }

  const triggerLabel = current?.name ?? state.current?.model ?? t('model.panel.choose')

  const currentReasoning = current?.model.reasoning
  const effectiveEffort = state.current?.reasoningEffort ?? currentReasoning?.defaultEffort
  const effortLabel = currentReasoning === undefined
    ? undefined
    : effectiveEffort === undefined
      ? t('input.effort.default')
      : currentReasoning.efforts.find(level => level.id === effectiveEffort)?.name ?? effectiveEffort

  return (
    <div ref={rootRef} style={rootStyle}>
      <button
        type="button"
        style={triggerStyle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('model.panel.choose')}
        title={state.current === null ? triggerLabel : `${state.current.provider}/${triggerLabel}`}
        onClick={() => { if (open) close(); else { setOpen(true); setError(null) } }}
      >
        <span style={triggerNameStyle}>{triggerLabel}</span>
        {effortLabel !== undefined && <span style={triggerEffortStyle}>{effortLabel}</span>}
        <span style={chevronStyle}>{open ? '▲' : '▼'}</span>
      </button>
      {open
        ? (
          <>
            <div style={backdropStyle} onClick={close} />
            <div style={popStyle} role="dialog" aria-label={t('model.panel.choose')}>
              <div style={modelsStyle}>
                {directory === undefined && (
                  <div style={statusStyle}>{t('model.panel.unavailable')}</div>
                )}
                {directory !== undefined && state.status === 'loading' && state.groups.length === 0 && (
                  <div style={statusStyle}>{t('model.panel.loading')}</div>
                )}
                {directory !== undefined && state.groups.map(group => {
                  const isExpanded = expanded.has(group.id)
                  const name = group.name ?? group.label ?? group.id
                  const activeModel = state.current?.provider === group.id ? state.current.model : undefined
                  return (
                    <section key={group.id}>
                      <button
                        type="button"
                        style={providerToggleStyle}
                        aria-expanded={isExpanded}
                        onClick={() => toggleProvider(group.id)}
                      >
                        <span style={providerNameStyle}>{name}</span>
                        <span style={providerMetaStyle}>{group.models.length}</span>
                        <span style={chevronStyle}>{isExpanded ? '▼' : '▶'}</span>
                      </button>
                      {isExpanded && group.models.map(model => {
                        const active = activeModel === model.id
                        const lineWritable = writableLine(group.id, model.id)
                        const lineWindow = windowOf(group.id, model.id)
                        const isContextEditing = editing !== null
                          && editing.provider === group.id
                          && editing.model === model.id
                          && editing.kind === 'context'
                        const isEffortEditing = editing !== null
                          && editing.provider === group.id
                          && editing.model === model.id
                          && editing.kind === 'effort'
                        const lineEffort = active
                          ? state.current?.reasoningEffort ?? model.reasoning?.defaultEffort
                          : model.reasoning?.defaultEffort
                        // Slider stops adapt to the model's advertised efforts;
                        // `auto` (when the directory masks it in) sits leftmost.
                        const lineStops = model.reasoning === undefined
                          ? []
                          : orderEffortsForSlider(model.reasoning.efforts)
                        const lineEffortName = lineEffort === undefined
                          ? t('input.effort.default')
                          : lineStops.find(stop => stop.id === lineEffort)?.name ?? lineEffort
                        return (
                          <div key={group.id + ':' + model.id} style={active ? modelRowActiveStyle : modelRowStyle}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={active}
                              style={modelPickStyle}
                              disabled={busy}
                              onClick={() => chooseModel(group.id, model.id)}
                            >
                              <span style={modelCopyStyle}>
                                <span style={modelNameStyle}>{model.name}</span>
                              </span>
                              {active && <span style={checkStyle} aria-hidden="true">✓</span>}
                            </button>
                            {(model.reasoning?.efforts.length ?? 0) > 0 && (
                              <span
                                role="button"
                                tabIndex={0}
                                aria-label={t('input.effort.title')}
                                title={t('input.effort.title')}
                                aria-expanded={isEffortEditing}
                                style={effortChipStyle}
                                onClick={event => {
                                  event.stopPropagation()
                                  if (!busy) toggleEffortEditor(group.id, model.id)
                                }}
                                onKeyDown={event => {
                                  if (event.key !== 'Enter' && event.key !== ' ') return
                                  event.preventDefault()
                                  event.stopPropagation()
                                  if (!busy) toggleEffortEditor(group.id, model.id)
                                }}
                              >
                                {lineEffortName}
                              </span>
                            )}
                            {isEffortEditing && model.reasoning !== undefined && (
                              <div style={editorRowStyle} onClick={event => event.stopPropagation()}>
                                <span style={labelStyle}>{t('input.effort.title')}</span>
                                <EffortSlider
                                  stops={lineStops}
                                  value={lineEffort}
                                  mascot={isDeepSeekLine(group.id, model.id, model.name)}
                                  disabled={busy}
                                  onCommit={id => chooseEffort(group.id, model.id, id)}
                                  t={t}
                                />
                                {model.reasoning.defaultEffort !== undefined && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    aria-label={t('input.effort.reset')}
                                    title={t('input.effort.reset')}
                                    style={actionButtonStyle}
                                    onClick={event => {
                                      event.stopPropagation()
                                      const target = model.reasoning?.defaultEffort
                                      if (target !== undefined) chooseEffort(group.id, model.id, target)
                                    }}
                                  >
                                    ↺
                                  </button>
                                )}
                              </div>
                            )}
                            <span
                              role="button"
                              tabIndex={0}
                              aria-label={t('input.context.title')}
                              title={lineWritable
                                ? t('input.context.globalHint')
                                : t('model.panel.noTarget')}
                              style={lineWritable && !busy ? chipStyle : chipDisabledStyle}
                              onClick={event => {
                                event.stopPropagation()
                                if (!lineWritable || busy) return
                                if (isContextEditing) { setEditing(null); return }
                                openEditor(group.id, model.id)
                              }}
                              onKeyDown={event => {
                                if (event.key !== 'Enter' && event.key !== ' ') return
                                event.preventDefault()
                                event.stopPropagation()
                                if (!lineWritable || busy) return
                                openEditor(group.id, model.id)
                              }}
                            >
                              {lineWindow === undefined
                                ? t('input.context.unset')
                                : formatContextWindow(lineWindow)}
                            </span>
                            {isContextEditing && (
                              <div style={editorRowStyle}>
                                <span style={labelStyle} title={t('input.context.globalHint')}>
                                  {t('model.panel.window')}
                                </span>
                                <input
                                  type="range"
                                  min={0}
                                  max={CONTEXT_WINDOW_PRESETS.length - 1}
                                  step={1}
                                  value={draft ?? stopIndexOf(lineWindow)}
                                  disabled={busy}
                                  aria-label={t('input.context.title')}
                                  style={sliderStyle}
                                  onChange={event => { setDraft(Number(event.currentTarget.value)) }}
                                  onPointerUp={() => {
                                    if (draft === null) return
                                    commitWindow(group.id, model.id, CONTEXT_WINDOW_PRESETS[draft]?.value)
                                  }}
                                  onKeyUp={() => {
                                    if (draft === null) return
                                    commitWindow(group.id, model.id, CONTEXT_WINDOW_PRESETS[draft]?.value)
                                  }}
                                />
                                <span style={valueStyle}>
                                  {draft === null
                                    ? lineWindow === undefined ? t('input.context.unset') : formatContextWindow(lineWindow)
                                    : formatContextWindow(CONTEXT_WINDOW_PRESETS[draft]?.value ?? 0)}
                                </span>
                                {custom
                                  ? (
                                    <>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={raw}
                                        disabled={busy}
                                        placeholder={t('input.context.customPlaceholder')}
                                        aria-label={t('input.context.customPlaceholder')}
                                        style={inputStyle}
                                        onChange={event => { setRaw(event.currentTarget.value) }}
                                        onKeyDown={event => { if (event.key === 'Enter') applyCustom() }}
                                      />
                                      <button
                                        type="button"
                                        disabled={busy}
                                        style={actionButtonStyle}
                                        onClick={applyCustom}
                                      >
                                        {t('input.context.apply')}
                                      </button>
                                    </>
                                  )
                                  : (
                                    <>
                                      <button
                                        type="button"
                                        disabled={busy}
                                        aria-label={t('input.context.custom')}
                                        title={t('input.context.custom')}
                                        style={actionButtonStyle}
                                        onClick={() => { setCustom(true); setError(null) }}
                                      >
                                        ⋯
                                      </button>
                                      <button
                                        type="button"
                                        disabled={busy || lineWindow === undefined}
                                        style={{
                                          ...actionButtonStyle,
                                          opacity: lineWindow === undefined ? 0.55 : 1,
                                        }}
                                        onClick={() => {
                                          setDraft(null)
                                          setError(null)
                                          commitWindow(group.id, model.id, undefined)
                                        }}
                                      >
                                        {t('input.context.clear')}
                                      </button>
                                    </>
                                  )}
                                {error !== null && <span style={errorStyle}>{error}</span>}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </section>
                  )
                })}
                {directory !== undefined && state.status !== 'loading' && state.groups.length === 0 && (
                  <div style={statusStyle}>{t('model.panel.empty')}</div>
                )}
              </div>
              {directory !== undefined && state.error !== null && <div style={errorBannerStyle} role="status">{state.error}</div>}
            </div>
          </>
        )
        : null}
    </div>
  )
}

export default ModelPanel
