/**
 * Context-capacity check ring for the composer tool row
 * (`conversation.input.right`, the seat just left of the send button —
 * the same seat the retired context-window pill used, and the same side of
 * the composer where the shipped ContextMeter lived).
 *
 * Why this exists: the model-seat panel replaced the shipped `ModelSelect`
 * trigger and popup, and with them went the shipped context meter — the
 * "how full is this window" read. The editor part moved into the model
 * panel's per-model lines; the CHECK part (used vs. window, pressure, a
 * breakdown, a warning before you run out) is what this ring restores.
 * Layout language follows better-er/dsh-cache-billing (rows with a color
 * swatch, token counts right-aligned, a muted footer note), which itself
 * pins into the shipped meter's popup.
 *
 * Data: the session projection seats. `useProjection('contextPressure')`
 * is the same feed the shipped meter consumes (`{ usedTokens, contextWindow,
 * percent }`), `useProjection('contextBreakdown')` the three-way split
 * (`{ systemTokens, toolsTokens, messageTokens }`). Both are optional on the
 * props and defensively read: a harness without the projection seat, or a
 * session before its first request, renders nothing here instead of a dead
 * control (the retired pill's discipline). Values refresh live while the
 * projection pushes — no polling.
 *
 * Zero host coupling beyond react + the injected seats: plain SVG + HTML
 * with token-based inline styling; copy is inline zh/en by document language
 * (the plugin's locale dictionaries stay untouched).
 */
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, JSX } from 'react'

/** The pressure projection slice (fields defensively optional). */
export interface ContextPressureLike {
  usedTokens?: number
  contextWindow?: number
  percent?: number
}

/** The breakdown projection slice (shipped meter's three-way split). */
export interface ContextBreakdownLike {
  systemTokens?: number
  toolsTokens?: number
  messageTokens?: number
}

/**
 * One session projection seat: a selector hook over the host's projection
 * store. Absent on harnesses without the projection module — the component
 * then renders nothing.
 */
type ProjectionHook = <T>(key: string) => T | undefined

/** Full props: the session seats the harness injects into this list entry. */
export interface ContextRingProps {
  /** The session id of the slot's owning conversation (standard seat). */
  sessionId?: string
  /** The session projection seat (0.2.0+); absent on a harness without it. */
  useProjection?: ProjectionHook
}

/* ── inline copy: zh default, en elsewhere ──────────────────────────────── */

interface CopyShape {
  title: string
  used: string
  remaining: string
  window: string
  percent: string
  system: string
  tools: string
  messages: string
  warning: string
  aria: (percent: string) => string
  unset: string
}

const COPY: Record<'zh' | 'en', CopyShape> = {
  zh: {
    title: '上下文检查',
    used: '已用',
    remaining: '剩余',
    window: '窗口容量',
    percent: '占用',
    system: '系统提示词',
    tools: '工具定义',
    messages: '对话消息',
    warning: '上下文即将用尽——建议压缩上下文或开启新会话。',
    aria: (percent: string) => `上下文已用 ${percent}`,
    unset: '本轮尚未产生用量',
  },
  en: {
    title: 'Context check',
    used: 'Used',
    remaining: 'Remaining',
    window: 'Context window',
    percent: 'Pressure',
    system: 'System prompt',
    tools: 'Tool definitions',
    messages: 'Messages',
    warning: 'Context is nearly full — compact the context or start a new session.',
    aria: (percent: string) => `${percent} of context used`,
    unset: 'No usage yet in this turn',
  },
} as const

const copy = (): CopyShape =>
  typeof document !== 'undefined' && document.documentElement.lang?.toLowerCase().startsWith('zh')
    ? COPY.zh
    : COPY.en

/* ── inline styling (no CSS modules in the client bundle) ──────────────── */

const RING_SIZE = 18
const RING_STROKE = 2.5

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  height: '24px',
  padding: '0 6px',
  background: 'transparent',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'var(--dsw-alias-label-secondary, inherit)',
  fontFamily: 'var(--ds-font-family-code, monospace)',
  fontSize: '11px',
  lineHeight: '16px',
  whiteSpace: 'nowrap',
}

const popStyle: CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 8px)',
  right: 0,
  zIndex: 1200,
  minWidth: '264px',
  padding: '10px 12px',
  background: 'var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.05))',
  color: 'var(--dsw-alias-label-primary, inherit)',
  border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.25))',
  borderRadius: '10px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
  fontSize: '12px',
  lineHeight: '18px',
}

const headStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
  fontWeight: 600,
  marginBottom: '4px',
}

const figureStyle: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFamily: 'var(--ds-font-family-code, monospace)',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '2px 0',
}

const rowLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  color: 'var(--dsw-alias-label-secondary, inherit)',
}

const rowValueStyle: CSSProperties = {
  marginLeft: 'auto',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 500,
  textAlign: 'right' as const,
}

const swatchStyle = (color: string): CSSProperties => ({
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '2px',
  marginRight: '6px',
  flex: 'none',
  background: color,
})

const warnStyle: CSSProperties = {
  marginTop: '6px',
  color: '#f43f5e',
  fontSize: '11px',
  lineHeight: '16px',
}

const footStyle: CSSProperties = {
  marginTop: '6px',
  color: 'var(--dsw-alias-label-caption, inherit)',
  fontSize: '11px',
  lineHeight: '16px',
}

const BREAKDOWN_COLORS = { system: '#8b5cf6', tools: '#0ea5e9', messages: '#10b981' } as const

/** Pressure color: calm → amber → red (cache-billing's foot/warn palette). */
export function pressureColor(percent: number): string {
  if (percent >= 85) return '#f43f5e'
  if (percent >= 70) return '#f59e0b'
  return 'var(--dsw-alias-label-secondary, currentColor)'
}

/** Format a token count compactly (12.3k / 1.24M). */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${Math.round((n / 1_000_000) * 100) / 100}M`
  if (n >= 1000) return `${Math.round((n / 1000) * 10) / 10}k`
  return String(Math.round(n))
}

/** The SVG ring: one background track + one pressure arc. */
function Ring({ percent, color }: { percent: number; color: string }): JSX.Element {
  const r = (RING_SIZE - RING_STROKE) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden="true">
      <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={r} fill="none"
        stroke="var(--dsw-alias-border-l2, rgba(127,127,127,0.3))" strokeWidth={RING_STROKE} />
      <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={r} fill="none"
        stroke={color} strokeWidth={RING_STROKE} strokeLinecap="round"
        strokeDasharray={`${(c * clamped) / 100} ${c}`}
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} />
    </svg>
  )
}

/** One breakdown row (cache-billing's swatch-row layout). */
function BreakdownRow({ label, value, color }: { label: string; value: number; color: string }): JSX.Element {
  return (
    <div style={rowStyle}>
      <dt style={rowLabelStyle}><span style={swatchStyle(color)} />{label}</dt>
      <dd style={{ ...rowValueStyle, margin: 0 }}>{formatTokens(value)}</dd>
    </div>
  )
}

/**
 * The ring entry: pressure arc trigger + the check popover. Renders nothing
 * without a projection seat or before the session has any reading.
 */
export function ContextRing(props: ContextRingProps): JSX.Element | null {
  const { useProjection } = props
  const pressure = useProjection?.('contextPressure') as ContextPressureLike | undefined
  const breakdown = useProjection?.('contextBreakdown') as ContextBreakdownLike | undefined
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Outside click / Escape closes the popover (the shipped meter's behavior).
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent): void => {
      if (rootRef.current !== null && event.target instanceof Node && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const used = typeof pressure?.usedTokens === 'number' ? pressure.usedTokens : undefined
  const window_ = typeof pressure?.contextWindow === 'number' ? pressure.contextWindow : undefined
  if (used === undefined || window_ === undefined || window_ <= 0) return null

  const c = copy()
  const percent = typeof pressure?.percent === 'number'
    ? pressure.percent
    : Math.min(100, Math.round((used / window_) * 100))
  const color = pressureColor(percent)
  const remaining = Math.max(0, window_ - used)
  const rows: Array<{ label: string; value: number | undefined; color: string }> = breakdown === undefined
    ? []
    : [
      { label: c.system, value: breakdown.systemTokens, color: BREAKDOWN_COLORS.system },
      { label: c.tools, value: breakdown.toolsTokens, color: BREAKDOWN_COLORS.tools },
      { label: c.messages, value: breakdown.messageTokens, color: BREAKDOWN_COLORS.messages },
    ]

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        style={triggerStyle}
        aria-label={c.aria(`${percent}%`)}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(state => !state)}
      >
        <Ring percent={percent} color={color} />
        <span style={{ ...figureStyle, color }}>{percent}%</span>
      </button>
      {open && (
        <div style={popStyle} role="dialog" aria-label={c.title}>
          <div style={headStyle}>
            {c.title}
            <span style={{ ...rowValueStyle, ...figureStyle }}>~{formatTokens(used)} / {formatTokens(window_)}</span>
          </div>
          <div style={rowStyle}>
            <dt style={rowLabelStyle}>{c.percent}</dt>
            <dd style={{ ...rowValueStyle, margin: 0, color }}>{percent}%</dd>
          </div>
          <div style={rowStyle}>
            <dt style={rowLabelStyle}>{c.remaining}</dt>
            <dd style={{ ...rowValueStyle, margin: 0 }}>{formatTokens(remaining)}</dd>
          </div>
          {rows.every(row => typeof row.value === 'number') && rows.length > 0 && (
            <dl style={{ margin: '4px 0 0', padding: '6px 0 0', borderTop: '1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.18))' }}>
              {rows.map(row => <BreakdownRow key={row.label} label={row.label} value={row.value as number} color={row.color} />)}
            </dl>
          )}
          {percent >= 85 && <div style={warnStyle}>{c.warning}</div>}
          <div style={footStyle}>{c.window}: {window_.toLocaleString()} tok</div>
        </div>
      )}
    </div>
  )
}
