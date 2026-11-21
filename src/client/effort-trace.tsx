/**
 * Effort-trace tab — the `conversation.view` face of dsh-thinking-levels,
 * following the conversation-view pattern dsh-perm-gate's history tab
 * demonstrates (runtime slot declared by the conversation UI package; the
 * typed SlotMap merge lives in `types/contracts.d.ts`).
 *
 * A run-length timeline of the effort levels this session's requests ACTUALLY
 * went out with — the `tlAutoSchedule` projection's `trace` (stateVersion 3),
 * the same durable fold the composer chip's `lastEffective` reads. Consecutive
 * requests with the same level AND intent collapse into one run, so even a
 * 95-step session reads as a handful of rows:
 *
 *   ↑ auto max ×1
 *   = auto high ×12
 *   ↓ auto low ×3
 *
 * The ↑/↓/= glyph is the transition against the escalation rank of the
 * previous (older) run; the run text shows the intent (`auto`/`manual`,
 * neutral when the session never picked and the configured default applied)
 * plus the repetition count.
 *
 * Data source: the session's projection face — NO HTTP feed. The projection is
 * a pure fold over the session log, so a cold read rebuilds historical
 * sessions for free. Everything is best-effort: a missing projection face, an
 * empty trace or a throwing face read renders the empty state — a thrown
 * render would abdicate the whole tab, which is never acceptable for a
 * cosmetic view.
 */
import { useMemo, useSyncExternalStore } from 'react'
import type { CSSProperties, JSX } from 'react'
import { EFFORT_SLIDER_RANK } from '../thinking-level.ts'
import type { EffortRun } from '../auto-schedule-projection.ts'

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

/** Unknown ids rank after the standard table (same tail semantics as the slider). */
const rankOf = (level: string): number => EFFORT_SLIDER_RANK[level] ?? 100

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
    const value = typeof snapshot === 'object' && snapshot !== null
      ? (snapshot as { value?: unknown }).value
      : undefined
    const raw = typeof value === 'object' && value !== null
      ? (value as { trace?: unknown }).trace
      : undefined
    return Array.isArray(raw) ? raw as readonly EffortRun[] : undefined
  } catch {
    // A thrown cosmetic read must never escape: degrade to "no data".
    return undefined
  }
}

/**
 * Subscribe to the trace over the projection face's store when it offers one;
 * a one-shot read otherwise (the conversation re-renders around every request
 * anyway, so the one-shot cadence still tracks). `useSyncExternalStore` needs
 * a cached snapshot — the projection registry gates republishes on
 * `Object.is`, so the face's `value.trace` reference is stable between
 * publishes and the read wrapper stays honest.
 */
function useTrace(sessions: SessionsFace | undefined, sessionId: unknown): readonly EffortRun[] | undefined {
  const id = typeof sessionId === 'string' && sessionId.length > 0 ? sessionId : undefined
  const face = useMemo(() => {
    try {
      return id === undefined ? undefined : sessions?.binding(id)?.session?.projections?.faceOf?.('tlAutoSchedule')
    } catch {
      return undefined
    }
  }, [sessions, id])
  const getSnapshot = useMemo(() => () => traceOf(sessions, id), [sessions, id])
  const subscribe = useMemo(() => (listener: () => void): (() => void) => {
    try {
      return typeof face?.subscribe === 'function' ? face.subscribe(listener) : () => {}
    } catch {
      return () => {}
    }
  }, [face])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 12,
  overflowY: 'auto',
  font: 'inherit',
}
const rowStyle: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 8 }
const glyphStyle: CSSProperties = {
  width: 18,
  flexShrink: 0,
  textAlign: 'center',
  fontFamily: 'monospace',
  color: 'var(--dsw-alias-text-secondary, rgba(127,127,127,0.9))',
}
const countStyle: CSSProperties = {
  color: 'var(--dsw-alias-text-secondary, rgba(127,127,127,0.9))',
  fontVariantNumeric: 'tabular-nums',
}
const levelStyle: CSSProperties = { fontFamily: 'monospace' }

/** The tab body: timeline rows newest first, or the empty state. */
export function EffortTrace(props: EffortTraceProps): JSX.Element {
  const t = props.t ?? props.tFallback ?? ((key: string) => key)
  const trace = useTrace(props.sessions, props.sessionId)
  const rows = traceRows(trace)
  if (trace === undefined || rows.length === 0) {
    return <div style={listStyle}><span style={countStyle}>{t('trace.empty')}</span></div>
  }
  return (
    <div style={listStyle}>
      {rows.map((row, i) => (
        <div key={trace.length - i} style={rowStyle}>
          <span style={glyphStyle} aria-hidden="true">{GLYPH[row.dir]}</span>
          <span>
            {row.run.intent === 'auto' && `${t('trace.intent.auto')} `}
            {row.run.intent === 'manual' && `${t('trace.intent.manual')} `}
            <code style={levelStyle}>{row.run.level}</code>
            {row.run.count > 1 && <span style={countStyle}> ×{row.run.count}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}
