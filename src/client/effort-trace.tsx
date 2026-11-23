/**
 * Effort-trace tab — the `conversation.view` face of dsh-thinking-levels,
 * following the conversation-view pattern dsh-perm-gate's history tab
 * demonstrates (runtime slot declared by the conversation UI package; the
 * typed SlotMap merge lives in `types/contracts.d.ts`).
 *
 * A run-length timeline of the effort levels this session's requests ACTUALLY
 * went out with — the `tlAutoSchedule` projection's `trace` (stateVersion 4),
 * the same durable fold the composer chip's `lastEffective` reads. Consecutive
 * requests with the same level AND intent collapse into one run, so even a
 * 95-step session reads as a handful of rows:
 *
 *   ↑ auto max ×1        T4·S7   14:03:22
 *   = auto high ×12      T3·S2   13:58:10
 *   ↓ auto low ×3        T1·S1   13:44:31
 *
 * The ↑/↓/= glyph is the transition against the escalation rank of the
 * previous (older) run; the run text shows the intent (`auto`/`manual`,
 * neutral when the session never picked and the configured default applied)
 * plus the repetition count and the turn·step the run STARTED in.
 *
 * ## Which "node" a run belongs to
 *
 * A run's position stamp is the `turn/start` / `step/start` pair preceding its
 * first `request/header`. The plugin's decision itself happens EARLIER — at
 * `agent/pre-step`, before the host appends `step/start` (agent-loop
 * `agent.ts`: `preStep()` then `session.append('step/start')`) — so the stamp
 * names the step the level was chosen FOR, which is exactly the node the user
 * sees in the timeline.
 *
 * Data source: the session's projection face — NO HTTP feed. The projection is
 * a pure fold over the session log, so a cold read rebuilds historical
 * sessions for free. Everything is best-effort: a missing projection face, an
 * empty trace or a throwing face read renders the empty state — a thrown
 * render would abdicate the whole tab, which is never acceptable for a
 * cosmetic view.
 *
 * Presentation mirrors perm-gate's approval history on purpose (title +
 * subtitle header, a summary strip, then one card per run with a circled glyph
 * on a connected rail, a colored intent tag, meta chips and a right-aligned
 * clock): the two tabs sit next to each other in the same tab row and must not
 * look like two different products.
 */
import { useMemo, useSyncExternalStore } from 'react'
import type { CSSProperties, JSX } from 'react'
import { EFFORT_SLIDER_RANK } from '../thinking-level.ts'
import type { EffortRun } from '../auto-schedule-projection.ts'
import { projectionValueOf } from './projection-value.ts'

/** Props the slot's `inject` option delivers (index.ts closes over the faces). */
export interface EffortTraceInjected {
  sessionId?: unknown
  /** The sessions face captured by the client assembly (same face the chip reads). */
  sessions?: SessionsFace | undefined
}

/** The tab's full props: injected faces + the locale seat with its fallback. */
export interface EffortTraceProps extends EffortTraceInjected {
  /** Host locale delivery (0.1.7+ `PropsLocale` seat). Absent on ≤0.1.6. */
  t?: ((key: string) => string) | undefined
  /** Injected eager binder fallback (`locale.bind(NS)`, index.ts). */
  tFallback?: ((key: string) => string) | undefined
}

/** One display row of the trace timeline (newest first). */
export interface TraceRow {
  run: EffortRun
  /** Transition from the previous (older) run, by escalation rank. */
  dir: 'up' | 'down' | 'flat' | 'start'
}

/** Transition glyph per direction (mirrors perm-gate's glyph table pattern). */
const GLYPH: Record<TraceRow['dir'], string> = { up: '↑', down: '↓', flat: '=', start: '•' }

/** Rail/tag color per direction: a rise is green, a drop is amber, flat is muted. */
const TONE: Record<TraceRow['dir'], { color: string; bg: string }> = {
  up: {
    color: 'var(--dsw-alias-state-success-primary, #1e8449)',
    bg: 'var(--dsw-alias-state-success-tertiary, rgba(30,132,73,0.08))',
  },
  down: {
    color: 'var(--dsw-alias-state-warn-label, #b9770e)',
    bg: 'var(--dsw-alias-state-warn-tertiary, rgba(185,119,14,0.08))',
  },
  flat: {
    color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.9))',
    bg: 'var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.06))',
  },
  start: {
    color: 'var(--dsw-alias-state-business-primary, #2b6cb0)',
    bg: 'var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.06))',
  },
}

/**
 * Tag tone per ATTRIBUTION — deliberately separate from the direction tone.
 *
 * `unknown` is grey, never amber/green: it is not a verdict about the level,
 * it says the log does not explain the change. Colouring it like a decision
 * would be the same lie as labelling it "manual".
 */
const INTENT_TONE: Record<EffortRun['intent'], { color: string; bg: string }> = {
  auto: {
    color: 'var(--dsw-alias-state-success-primary, #1e8449)',
    bg: 'var(--dsw-alias-state-success-tertiary, rgba(30,132,73,0.08))',
  },
  manual: {
    color: 'var(--dsw-alias-state-business-primary, #2b6cb0)',
    bg: 'var(--dsw-alias-bg-layer-2, rgba(43,108,176,0.08))',
  },
  default: {
    color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.9))',
    bg: 'var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.06))',
  },
  unknown: {
    color: 'var(--dsw-alias-state-warn-label, #b9770e)',
    bg: 'var(--dsw-alias-state-warn-tertiary, rgba(185,119,14,0.06))',
  },
  scheduler: {
    // Proven plugin output: the same business accent as `manual` on purpose —
    // both are "a known writer chose this". The LABEL carries the difference.
    color: 'var(--dsw-alias-state-success-primary, #1e8449)',
    bg: 'var(--dsw-alias-state-success-tertiary, rgba(30,132,73,0.10))',
  },
}

/** Unknown ids rank after the standard table (same tail semantics as the slider). */
const rankOf = (level: string): number => EFFORT_SLIDER_RANK[level] ?? 100

/** `HH:MM:SS` in the viewer's zone; empty for an absent stamp. */
function clockOf(ms: number | undefined): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return ''
  const d = new Date(ms)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** `T{turn}·S{step}` for a stamped run, empty when the run carries no position. */
function positionOf(run: EffortRun): string {
  if (typeof run.turn !== 'number') return ''
  return typeof run.step === 'number' ? `T${run.turn}·S${run.step}` : `T${run.turn}`
}

/**
 * Build the display rows: newest run first, each carrying the transition
 * against its chronological predecessor. Pure — the component is a straight
 * map over this.
 * @param trace - the folded run-length trace, oldest run first.
 * @returns rows newest first; empty for an absent or empty trace.
 */
export function traceRows(trace: readonly EffortRun[] | undefined): TraceRow[] {
  if (trace === undefined || trace.length === 0) return []
  const rows: TraceRow[] = []
  for (let i = trace.length - 1; i >= 0; i -= 1) {
    const run = trace[i]!
    const prev = i > 0 ? trace[i - 1] : undefined
    if (prev === undefined) {
      rows.push({ run, dir: 'start' })
      continue
    }
    const from = rankOf(prev.level)
    const to = rankOf(run.level)
    rows.push({ run, dir: to > from ? 'up' : to < from ? 'down' : 'flat' })
  }
  return rows
}

/** The whole-session summary the header strip shows. */
export interface TraceSummary {
  /** Committed requests covered by the trace (sum of run counts). */
  requests: number
  /** How many distinct runs are kept. */
  runs: number
  /** Highest escalation rank the session ever reached, if any. */
  highest: string | undefined
  /** How many of those runs came from the `auto` sentinel (rather than a manual lock). */
  autoRuns: number
  /** How many runs the log cannot attribute (see {@link EffortRun.intent}). */
  unknownRuns: number
  /** Provider/model switches across the session's committed requests. */
  switches: number
}

/**
 * Summarize a trace for the header strip. Pure.
 * @param trace - the folded trace, oldest run first.
 * @param modelSwitches - route switches folded by the projection (0 when absent).
 * @returns the summary; zeroed for an absent trace.
 */
export function summarize(trace: readonly EffortRun[] | undefined, modelSwitches = 0): TraceSummary {
  if (trace === undefined || trace.length === 0) {
    return { requests: 0, runs: 0, highest: undefined, autoRuns: 0, unknownRuns: 0, switches: modelSwitches }
  }
  let requests = 0
  let highest: string | undefined
  let autoRuns = 0
  let unknownRuns = 0
  for (const run of trace) {
    requests += run.count
    if (run.intent === 'auto') autoRuns += 1
    if (run.intent === 'unknown') unknownRuns += 1
    if (highest === undefined || rankOf(run.level) > rankOf(highest)) highest = run.level
  }
  return { requests, runs: trace.length, highest, autoRuns, unknownRuns, switches: modelSwitches }
}

/**
 * Read the folded trace off the session's projection face — the exact read
 * path the composer chip's `lastEffective` uses. Returns `undefined` — never
 * throws — when the session id, the face or the field is absent (older hosts,
 * cold sessions, odd shapes).
 * @param sessions - the sessions face.
 * @param sessionId - the owning session.
 * @returns the folded run-length trace, or undefined.
 */
export function traceOf(
  sessions: SessionsFace | undefined,
  sessionId: string | undefined,
): readonly EffortRun[] | undefined {
  try {
    if (typeof sessionId !== 'string' || sessionId.length === 0) return undefined
    const face = sessions?.binding(sessionId)?.session?.projections?.faceOf?.('tlAutoSchedule')
    const snapshot = typeof face?.getSnapshot === 'function' ? face.getSnapshot() : undefined
    // The face snapshot IS the state (no `{ value }` wrapper — see
    // projection-value.ts); reading `.value` here rendered the empty state
    // over a filled trace on every real host.
    const raw = projectionValueOf(snapshot)?.['trace']
    return Array.isArray(raw) ? raw as readonly EffortRun[] : undefined
  } catch {
    // A thrown cosmetic read must never escape: degrade to "no data".
    return undefined
  }
}

/** The whole projection slice this tab renders (trace + route bookkeeping). */
export interface TraceSlice {
  trace: readonly EffortRun[]
  /** Provider/model of the last committed request, for the summary strip. */
  lastProvider: string | null
  lastModel: string | null
  /** How many route switches the session shows. */
  modelSwitches: number
}

/**
 * Read the whole slice off the projection face. `undefined` — never a throw —
 * when the face or its trace is absent; a trace with no route bookkeeping still
 * renders (the older cached row simply has no switch count).
 *
 * ## Reference stability is mandatory here
 *
 * `useSyncExternalStore` requires `getSnapshot()` to return the SAME reference
 * until the underlying value changes. The projection face hands out the bare
 * state object and only swaps it on a real publish, so the slice is memoized on
 * that state identity: building a fresh `{ trace, … }` per call would make every
 * render look like a change and spin React into an infinite re-render.
 * @param sessions - the sessions face.
 * @param sessionId - the owning session.
 * @returns the slice, or undefined when there is nothing to render.
 */
export function traceSliceOf(
  sessions: SessionsFace | undefined,
  sessionId: string | undefined,
): TraceSlice | undefined {
  try {
    if (typeof sessionId !== 'string' || sessionId.length === 0) return undefined
    const face = sessions?.binding(sessionId)?.session?.projections?.faceOf?.('tlAutoSchedule')
    const snapshot = typeof face?.getSnapshot === 'function' ? face.getSnapshot() : undefined
    const state = projectionValueOf(snapshot)
    if (state === undefined) return undefined
    const raw = state['trace']
    if (!Array.isArray(raw)) return undefined
    const cached = sliceCache.get(state)
    if (cached !== undefined) return cached
    const provider = state['lastProvider']
    const model = state['lastModel']
    const switches = state['modelSwitches']
    const slice: TraceSlice = {
      trace: raw as readonly EffortRun[],
      lastProvider: typeof provider === 'string' && provider.length > 0 ? provider : null,
      lastModel: typeof model === 'string' && model.length > 0 ? model : null,
      modelSwitches: typeof switches === 'number' && Number.isFinite(switches) ? switches : 0,
    }
    sliceCache.set(state, slice)
    return slice
  } catch {
    return undefined
  }
}

/**
 * Memo for {@link traceSliceOf}: one slice per projection state identity. The
 * face is shared by every reader of this key (the chip and the tab), so the
 * memo lives at module level; entries die with the state objects themselves, so
 * it cannot grow without bound.
 */
const sliceCache = new WeakMap<object, TraceSlice>()

/**
 * Subscribe to the trace over the projection face's store when it offers one;
 * a one-shot read otherwise (the conversation re-renders around every request
 * anyway, so the one-shot cadence still tracks). `useSyncExternalStore` needs
 * a cached snapshot — the projection registry gates republishes on
 * `Object.is`, so the face's `value.trace` reference is stable between
 * publishes and the read wrapper stays honest.
 */
function useTrace(sessions: SessionsFace | undefined, sessionId: unknown): TraceSlice | undefined {
  const id = typeof sessionId === 'string' && sessionId.length > 0 ? sessionId : undefined
  const face = useMemo(() => {
    try {
      return id === undefined ? undefined : sessions?.binding(id)?.session?.projections?.faceOf?.('tlAutoSchedule')
    } catch {
      return undefined
    }
  }, [sessions, id])
  const getSnapshot = useMemo(() => () => traceSliceOf(sessions, id), [sessions, id])
  const subscribe = useMemo(() => (listener: () => void): (() => void) => {
    try {
      return typeof face?.subscribe === 'function' ? face.subscribe(listener) : () => {}
    } catch {
      return () => {}
    }
  }, [face])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/* ── styles (perm-gate history parity) ─────────────────────────────────── */

const pageStyle: CSSProperties = {
  boxSizing: 'border-box',
  maxWidth: '720px',
  margin: '0 auto',
  padding: '8px 4px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  font: 'inherit',
  overflowY: 'auto',
}

const titleStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--dsw-alias-label-primary)',
}

const subtitleStyle: CSSProperties = {
  marginTop: '2px',
  fontSize: '12px',
  lineHeight: '18px',
  color: 'var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary))',
}

/** The summary strip: the same rounded bar perm-gate's snapshot inventory uses. */
const barStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  padding: '6px 10px',
  borderRadius: '8px',
  background: 'var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.05))',
  fontSize: '12px',
  lineHeight: '18px',
  color: 'var(--dsw-alias-label-tertiary)',
}

const barStatStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: '4px',
}

const barValueStyle: CSSProperties = {
  fontWeight: 600,
  color: 'var(--dsw-alias-label-primary)',
  fontVariantNumeric: 'tabular-nums',
}

const barSepStyle: CSSProperties = {
  width: '1px',
  height: '10px',
  background: 'var(--dsw-alias-border-l2, rgba(127,127,127,0.3))',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  padding: '6px 10px',
  borderRadius: '8px',
  background: 'var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.05))',
}

const railStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: '0 0 auto',
  width: '20px',
}

const markStyle: CSSProperties = {
  width: '18px',
  height: '18px',
  marginTop: '3px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  lineHeight: '18px',
  borderRadius: '999px',
  borderStyle: 'solid',
  borderWidth: '1px',
  fontFamily: 'var(--ds-font-family-code, monospace)',
}

const railLineStyle: CSSProperties = {
  flex: '1 1 auto',
  width: '1px',
  minHeight: '10px',
  background: 'var(--dsw-alias-border-l2, rgba(127,127,127,0.3))',
}

const bodyStyle: CSSProperties = { flex: '1 1 auto', minWidth: 0, paddingBottom: '10px' }

const headStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
}

const levelStyle: CSSProperties = {
  font: '600 12px/18px var(--ds-font-family-code, monospace)',
  color: 'var(--dsw-alias-label-primary)',
}

const tagStyle: CSSProperties = {
  fontSize: '11px',
  lineHeight: '18px',
  padding: '0 8px',
  borderRadius: '9px',
  fontWeight: 600,
}

const metaStyle: CSSProperties = {
  fontSize: '11px',
  lineHeight: '18px',
  padding: '0 6px',
  borderRadius: '9px',
  color: 'var(--dsw-alias-label-tertiary)',
  border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.3))',
  fontVariantNumeric: 'tabular-nums',
}

const clockStyle: CSSProperties = {
  marginLeft: 'auto',
  flex: '0 0 auto',
  fontSize: '11px',
  color: 'var(--dsw-alias-label-tertiary)',
  fontVariantNumeric: 'tabular-nums',
}

const noteStyle: CSSProperties = {
  marginTop: '2px',
  fontSize: '12px',
  lineHeight: '18px',
  color: 'var(--dsw-alias-label-secondary, inherit)',
  overflowWrap: 'anywhere',
}

const emptyStyle: CSSProperties = {
  padding: '16px 0',
  fontSize: '13px',
  color: 'var(--dsw-alias-label-tertiary)',
}

/** The summary strip above the timeline. */
function SummaryBar(props: { t: (key: string) => string; summary: TraceSummary }): JSX.Element {
  const { t, summary } = props
  return (
    <div style={barStyle}>
      <span style={barStatStyle}>
        <span style={barValueStyle}>{summary.requests}</span>
        <span>{t('trace.summary.requests')}</span>
      </span>
      <span aria-hidden style={barSepStyle} />
      <span style={barStatStyle}>
        <span style={barValueStyle}>{summary.runs}</span>
        <span>{t('trace.summary.runs')}</span>
      </span>
      <span aria-hidden style={barSepStyle} />
      <span style={barStatStyle}>
        <span style={barValueStyle}>{summary.autoRuns}</span>
        <span>{t('trace.summary.autoRuns')}</span>
      </span>
      {summary.unknownRuns === 0
        ? null
        : (
            <>
              <span aria-hidden style={barSepStyle} />
              <span style={{ ...barStatStyle, color: 'var(--dsw-alias-state-warn-label, #b9770e)' }}>
                <span style={barValueStyle}>{summary.unknownRuns}</span>
                <span>{t('trace.intent.unknown')}</span>
              </span>
            </>
          )}
      {summary.switches === 0
        ? null
        : (
            <>
              <span aria-hidden style={barSepStyle} />
              <span style={barStatStyle}>
                <span style={barValueStyle}>{summary.switches}</span>
                <span>{t('trace.summary.switches')}</span>
              </span>
            </>
          )}
      {summary.highest === undefined
        ? null
        : (
            <>
              <span aria-hidden style={barSepStyle} />
              <span style={barStatStyle}>
                <span>{t('trace.summary.peak')}</span>
                <span style={{ ...barValueStyle, fontFamily: 'var(--ds-font-family-code, monospace)' }}>
                  {summary.highest}
                </span>
              </span>
            </>
          )}
      <span style={{ marginLeft: 'auto' }}>{t('trace.summary.hint')}</span>
    </div>
  )
}

/** The tab body: summary strip + timeline rows newest first, or the empty state. */
export function EffortTrace(props: EffortTraceProps): JSX.Element {
  const t = props.t ?? props.tFallback ?? ((key: string) => key)
  const slice = useTrace(props.sessions, props.sessionId)
  const trace = slice?.trace ?? []
  const rows = traceRows(trace)
  if (slice === undefined || rows.length === 0) {
    return (
      <div style={pageStyle}>
        <div>
          <div style={titleStyle}>{t('trace.title')}</div>
          <div style={subtitleStyle}>{t('trace.subtitle')}</div>
        </div>
        <span style={{ ...emptyStyle, fontSize: '13px' }}>{t('trace.empty')}</span>
      </div>
    )
  }
  return (
    <div style={pageStyle}>
      <div>
        <div style={titleStyle}>{t('trace.title')}</div>
        <div style={subtitleStyle}>{t('trace.subtitle')}</div>
      </div>
      <SummaryBar t={t} summary={summarize(trace, slice.modelSwitches)} />
      {/*
        * Attribution honesty: on the 0.2.2+ strict line THIS plugin is itself a
        * `model/selection` writer (it must fix the next step's level before
        * preparation), so a concrete level in the log cannot be proven to be a
        * human click. Say so instead of labelling scheduler output "manual".
        */}
      <div style={{ fontSize: '11px', lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)' }}>
        {t('trace.note.attribution')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map((row, i) => {
          const tone = TONE[row.dir]
          const intentTone = INTENT_TONE[row.run.intent]
          const position = positionOf(row.run)
          const clock = clockOf(row.run.time)
          const intentLabel = t(`trace.intent.${row.run.intent}`)
          const route = row.run.model === undefined
            ? ''
            : row.run.provider === undefined ? row.run.model : `${row.run.provider}/${row.run.model}`
          return (
            <div key={`${row.run.level}-${row.run.turn ?? 'x'}-${row.run.step ?? 'x'}-${trace.length - i}`} style={rowStyle}>
              <div style={railStyle}>
                <span aria-hidden style={{ ...markStyle, borderColor: tone.color, color: tone.color }}>
                  {GLYPH[row.dir]}
                </span>
                <span aria-hidden style={railLineStyle} />
              </div>
              <div style={bodyStyle}>
                <div style={headStyle}>
                  <code style={levelStyle}>{row.run.level}</code>
                  <span
                    style={{ ...tagStyle, color: intentTone.color, background: intentTone.bg }}
                    title={row.run.intent === 'unknown' ? t('trace.intent.unknownHint') : undefined}
                  >
                    {intentLabel}
                  </span>
                  {row.run.count > 1
                    ? <span style={metaStyle}>{`× ${row.run.count}`}</span>
                    : null}
                  {position === '' ? null : <span style={metaStyle}>{position}</span>}
                  {/*
                    * The model the level was sent to. Recorded from the request
                    * header, never inferred — without it a run cannot say which
                    * route it belonged to.
                    */}
                  {route === '' ? null : <span style={{ ...metaStyle, fontFamily: 'var(--ds-font-family-code, monospace)' }}>{route}</span>}
                  {clock === '' ? null : <span style={clockStyle}>{clock}</span>}
                </div>
                <div style={noteStyle}>
                  {t(`trace.dir.${row.dir}`).replace('%n', String(row.run.count))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
