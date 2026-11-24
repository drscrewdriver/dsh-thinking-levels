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
 * with token-based inline styling; copy comes from the plugin dictionary
 * (`ring.*`), delivered as the `t` thunk from the model panel — a ru/es host
 * then reads its own language instead of the old inline zh/en pair.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, JSX } from 'react'

/** The pressure projection slice — the token-meter wire view's own fields. */
export interface ContextPressureLike {
  /** Post-usage pressure: the last usage sample's prompt-side token count. */
  pressureTokens?: number
  /** The request-projected estimate (pressure + uncommitted surface). */
  projectedTokens?: number
  contextWindow?: number
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
export type ProjectionHook = <T>(key: string) => T | undefined

/** The tlCacheBilling projection wire view (full field set). */
export interface CacheBillingLike {
  available?: boolean
  cost?: number
  missCost?: number
  outputCost?: number
  currency?: string
  cacheReadTokens?: number
  totalInputTokens?: number
  outputTokens?: number
  hitRate?: number | null
  model?: string | null
  provider?: string | null
  matchedModel?: string | null
  modelMatched?: boolean
  tier?: 'peak' | 'offPeak' | 'flat' | null
  unitPricePerM?: number | null
  /** 目录化新增字段（全部 optional：旧 view 落新客户端时保守回退）。 */
  priced?: boolean
  pricingSource?: 'estimate' | 'cn' | 'global' | 'custom' | 'off' | 'catalog-miss' | null
  /** 金额为兜底典型价估算（未校准，仅供参考）。 */
  estimated?: boolean
  catalogKey?: string | null
  catalogLabel?: string | null
  priceRow?: { inputMiss: number; inputCacheHit: number; output: number } | null
  sessionByCurrency?: Array<{ currency: string; hitCost: number; missCost: number; outputCost: number }>
  mixedCurrency?: boolean
  turn?: number | null
  step?: number | null
  turnCost?: number
  turnHitCost?: number
  turnMissCost?: number
  turnOutputCost?: number
  turnTokens?: number
  turnCacheReadTokens?: number
  turnInputTokens?: number
  turnOutputTokens?: number
  sessionCacheHitCost?: number
  sessionMissCost?: number
  sessionOutputCost?: number
  sessionInputTokens?: number
  sessionCacheReadTokens?: number
  sessionOutputTokens?: number
  sessionRounds?: number
  sessionMissSteps?: number
  sessionWriteTokens?: number
  sessionFullMissSteps?: number
}

/** Full props of the ring entry (all optional — data comes from the store). */
export interface ContextRingProps {
  /** The session id of the slot's owning conversation (standard seat). */
  sessionId?: string
  /**
   * Capacity fallback from the model catalog: when the contextPressure
   * projection carries no contextWindow (some sessions never see the
   * request/context event), the declared window of the ACTIVE model fills in.
   */
  contextWindowFallback?: number
  /**
   * Dictionary thunk (`locale.bind(NS)` in the model panel, or the host's own
   * `PropsLocale` seat). Optional: a caller without it renders keys, never
   * Chinese — degrade to keys rather than to a language nobody asked for.
   */
  t?: (key: string) => string
}

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

const BILL_COLORS = { hit: '#10b981', miss: '#f59e0b', output: '#3b82f6' } as const

/** One nested billing sub-row (cache-billing's indented swatch row). */
function BillSubRow({ label, tokens, amount, color }: { label: string; tokens: number; amount: string; color: string }): JSX.Element {
  return (
    <div style={{ ...rowStyle, paddingLeft: '16px' }}>
      <dt style={rowLabelStyle}><span style={swatchStyle(color)} />{label}</dt>
      <dd style={{ ...rowValueStyle, margin: 0 }}>
        <span style={{ color: 'var(--dsw-alias-label-caption, inherit)', fontWeight: 400, marginRight: '6px' }}>{formatTokens(tokens)} tok</span>
        {amount}
      </dd>
    </div>
  )
}

/** 币种符号：目录原样不折算；未知币种回退 ISO 码。 */
function currencySymbol(currency: string | undefined): string {
  if (currency === 'USD') return '$'
  if (currency !== undefined && currency !== 'CNY') return `${currency} `
  return '¥'
}

/** Format an amount: four decimals for a step, fewer for the totals. */
function formatMoney(amount: number, digits: number, currency?: string): string {
  return `${currencySymbol(currency)}${amount.toFixed(digits)}`
}

/**
 * The module-level projection store. The ring renders inside the model seat,
 * whose entry props do NOT carry the projection hook — the hook lives on a
 * zero-size data hook mounted at `conversation.input.right` (the seat where
 * better-er/dsh-cache-billing proved the hook injection), which mirrors every
 * push into this store. The ring subscribes like any external store.
 */
interface ProjectionSnapshot {
  /** Set once the data hook mounts anywhere — the 0.2.0+ seat marker. */
  seatMounted?: boolean
  pressure?: ContextPressureLike
  breakdown?: ContextBreakdownLike
  billing?: CacheBillingLike
}

let store: ProjectionSnapshot = {}
const listeners = new Set<() => void>()

/** Immutable replacement — useSyncExternalStore compares snapshots by
 * reference, so in-place mutation would never re-render subscribers. */
function publish(patch: Partial<ProjectionSnapshot>): void {
  store = { ...store, ...patch }
  for (const listener of listeners) listener()
}

function subscribeStore(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function getStore(): ProjectionSnapshot {
  return store
}

/**
 * The zero-size data hook: props delivered by the slot renderer carry the
 * session projection hook; every push lands in the module store.
 */
export function ProjectionDataHook(props: { useProjection?: ProjectionHook }): JSX.Element {
  const pressure = props.useProjection?.('contextPressure') as ContextPressureLike | undefined
  const breakdown = props.useProjection?.('contextBreakdown') as ContextBreakdownLike | undefined
  const billing = props.useProjection?.('tlCacheBilling') as CacheBillingLike | undefined
  useEffect(() => {
    // The seat marker rides the first publish: the ring re-renders on every
    // publish, so a marker arriving after the ring's first render still
    // flips it from hidden to visible.
    publish({ seatMounted: true, pressure, breakdown, billing })
  })
  return <span data-dsh-thinking-levels="projection-hook" style={{ display: 'none' }} />
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
 * The cache-billing block (catalog era). 未计价（priced===false）时保留 token
 * 读数、金额位换「未计价」文案；旧 view 缺 priced 字段 → 按历史行为计价。
 * 混币种会话不给跨币种合计，改按币种分行。
 */
function BillingBlock({ billing, t }: { billing: CacheBillingLike; t: (key: string) => string }): JSX.Element {
  /** `ring.*` 读取（字典里只有一个 `%n` 占位符，有值就填）。 */
  const c = (key: string, value?: string): string => {
    const text = t(key)
    return value === undefined ? text : text.replace('%n', value)
  }
  const cur = billing.currency
  const priced = billing.priced !== false
  const money = (amount: number | undefined, digits: number): JSX.Element | string =>
    priced
      ? formatMoney(amount ?? 0, digits, cur)
      : <span style={{ color: 'var(--dsw-alias-label-caption, inherit)' }}>{c('ring.bill.unpriced')}</span>
  const dash = priced ? undefined : '—'
  const buckets = Array.isArray(billing.sessionByCurrency) ? billing.sessionByCurrency : []
  const sessionTotal: JSX.Element | string = !priced
    ? <span style={{ color: 'var(--dsw-alias-label-caption, inherit)' }}>{c('ring.bill.unpriced')}</span>
    : billing.mixedCurrency === true && buckets.length > 1
      // 跨币种不相加：逐桶展示（主币种取 session* 字段，其余补列）
      ? buckets.map((b) => `${currencySymbol(b.currency)}${(b.hitCost + b.missCost + b.outputCost).toFixed(2)}`).join(' + ')
      : formatMoney((billing.sessionCacheHitCost ?? 0) + (billing.sessionMissCost ?? 0) + (billing.sessionOutputCost ?? 0), 2, cur)
  return (
    <dl style={{ margin: '4px 0 0', padding: '6px 0 0', borderTop: '1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.18))' }}>
      <div style={rowStyle}>
        <dt style={{ ...rowLabelStyle, color: '#a78bfa' }}>{c('ring.bill.step')}</dt>
        <dd style={{ ...rowValueStyle, margin: 0 }}>
          {formatTokens((billing.totalInputTokens ?? 0) + (billing.outputTokens ?? 0))} tok {money(billing.cost, 4)}
        </dd>
      </div>
      <BillSubRow label={c('ring.bill.cacheRead')} tokens={billing.cacheReadTokens ?? 0} amount={dash ?? formatMoney(billing.cost ?? 0, 4, cur)} color={BILL_COLORS.hit} />
      <BillSubRow label={c('ring.bill.cacheMiss')} tokens={(billing.totalInputTokens ?? 0) - (billing.cacheReadTokens ?? 0)} amount={dash ?? formatMoney(billing.missCost ?? 0, 4, cur)} color={BILL_COLORS.miss} />
      <BillSubRow label={c('ring.bill.output')} tokens={billing.outputTokens ?? 0} amount={dash ?? formatMoney(billing.outputCost ?? 0, 4, cur)} color={BILL_COLORS.output} />
      <div style={rowStyle}>
        <dt style={{ ...rowLabelStyle, color: '#22d3ee' }}>{c('ring.bill.turn')}</dt>
        <dd style={{ ...rowValueStyle, margin: 0 }}>
          {formatTokens(billing.turnTokens ?? 0)} tok {money(billing.turnCost, 3)}
        </dd>
      </div>
      <BillSubRow label={c('ring.bill.cacheRead')} tokens={billing.turnCacheReadTokens ?? 0} amount={dash ?? formatMoney(billing.turnHitCost ?? 0, 3, cur)} color={BILL_COLORS.hit} />
      <BillSubRow label={c('ring.bill.cacheMiss')} tokens={(billing.turnInputTokens ?? 0) - (billing.turnCacheReadTokens ?? 0)} amount={dash ?? formatMoney(billing.turnMissCost ?? 0, 3, cur)} color={BILL_COLORS.miss} />
      <BillSubRow label={c('ring.bill.output')} tokens={billing.turnOutputTokens ?? 0} amount={dash ?? formatMoney(billing.turnOutputCost ?? 0, 3, cur)} color={BILL_COLORS.output} />
      <div style={rowStyle}>
        <dt style={{ ...rowLabelStyle, color: '#f472b6' }}>
          {c('ring.bill.session')}{billing.sessionRounds ? ` · ${billing.sessionRounds} ${c('ring.bill.rounds')}` : ''}
        </dt>
        <dd style={{ ...rowValueStyle, margin: 0 }}>
          {formatTokens((billing.sessionInputTokens ?? 0) + (billing.sessionOutputTokens ?? 0))} tok {sessionTotal}
        </dd>
      </div>
      <BillSubRow label={c('ring.bill.cacheRead')} tokens={billing.sessionCacheReadTokens ?? 0} amount={dash ?? formatMoney(billing.sessionCacheHitCost ?? 0, 2, cur)} color={BILL_COLORS.hit} />
      <BillSubRow label={c('ring.bill.cacheMiss')} tokens={(billing.sessionInputTokens ?? 0) - (billing.sessionCacheReadTokens ?? 0)} amount={dash ?? formatMoney(billing.sessionMissCost ?? 0, 2, cur)} color={BILL_COLORS.miss} />
      <BillSubRow label={c('ring.bill.output')} tokens={billing.sessionOutputTokens ?? 0} amount={dash ?? formatMoney(billing.sessionOutputCost ?? 0, 2, cur)} color={BILL_COLORS.output} />
      {(billing.sessionFullMissSteps ?? 0) > 0 && (
        <div style={rowStyle}>
          <dt style={{ ...rowLabelStyle, color: '#f43f5e' }}>{c('ring.bill.fullMiss')}</dt>
          <dd style={{ ...rowValueStyle, margin: 0 }}>{billing.sessionFullMissSteps}</dd>
        </div>
      )}
    </dl>
  )
}

/**
 * The ring entry: pressure arc trigger + the check popover. Renders nothing
 * without a projection seat or before the session has any reading.
 */
export function ContextRing(props: ContextRingProps): JSX.Element | null {
  // Two distinct invisible cases, handled differently: a host WITHOUT the
  // projection hook seat (≤0.1.6 lines — the data hook never mounts) hides the
  // ring, the retired pill's discipline — a permanently dead control helps
  // nobody there. A host WITH the hook but no reading yet (fresh session)
  // renders the dimmed unset state — fail-visible, because a hidden control is
  // indistinguishable from a dead registration, which cost a debug round-trip
  // once already.
  const live = useSyncExternalStore(subscribeStore, getStore)
  const hasSeat = live.seatMounted === true
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const pressure = live.pressure
  const breakdown = live.breakdown
  const billing = live.billing
  // The official meter's own occupancy mapping (contextOccupancy): the
  // projected estimate wins, the raw pressure sample is the floor.
  const used = typeof pressure?.projectedTokens === 'number'
    ? pressure.projectedTokens
    : typeof pressure?.pressureTokens === 'number' ? pressure.pressureTokens : undefined
  const window_ = typeof pressure?.contextWindow === 'number' && pressure.contextWindow > 0
    ? pressure.contextWindow
    : typeof props.contextWindowFallback === 'number' && props.contextWindowFallback > 0
      ? props.contextWindowFallback
      : undefined
  const hasReading = used !== undefined && window_ !== undefined && window_ > 0

  /** Dictionary thunk: the model panel passes `locale.bind(NS)`; without it keys render. */
  const t = props.t ?? ((key: string) => key)
  /** `ring.*` 读取（字典里只有一个 `%n` 占位符，有值就填）。 */
  const c = (key: string, value?: string): string => {
    const text = t(key)
    return value === undefined ? text : text.replace('%n', value)
  }
  const percent = hasReading
    ? Math.min(100, Math.round(((used as number) / (window_ as number)) * 100))
    : 0
  const color = pressureColor(percent)
  const remaining = hasReading ? Math.max(0, (window_ as number) - (used as number)) : 0
  const rows: Array<{ label: string; value: number | undefined; color: string }> = !hasReading || breakdown === undefined
    ? []
    : [
      { label: c('ring.system'), value: breakdown.systemTokens, color: BREAKDOWN_COLORS.system },
      { label: c('ring.tools'), value: breakdown.toolsTokens, color: BREAKDOWN_COLORS.tools },
      { label: c('ring.messages'), value: breakdown.messageTokens, color: BREAKDOWN_COLORS.messages },
    ]

  // Hosts without the projection hook seat (≤0.1.6) can never produce a
  // reading — hide the control entirely rather than show a permanently dead
  // dial (the discipline in the comment at hasSeat). A host with the seat
  // flips `seatMounted` during the hook's own mount, so the gap is one store
  // tick before the first real re-render.
  if (!hasSeat) return null

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        style={hasReading ? triggerStyle : { ...triggerStyle, opacity: 0.55 }}
        aria-label={hasReading ? c('ring.aria', `${percent}%`) : c('ring.unset')}
        aria-haspopup={hasReading ? 'dialog' : undefined}
        aria-expanded={open}
        onClick={() => { if (hasReading) setOpen(state => !state) }}
      >
        <Ring percent={percent} color={color} />
        <span style={{ ...figureStyle, color: hasReading ? color : 'var(--dsw-alias-label-caption, inherit)' }}>
          {hasReading ? `${percent}%` : '–'}
        </span>
      </button>
      {open && hasReading && (
        <div style={popStyle} role="dialog" aria-label={c('ring.title')}>
          <div style={headStyle}>
            {c('ring.title')}
            <span style={{ ...rowValueStyle, ...figureStyle }}>~{formatTokens(used)} / {formatTokens(window_)}</span>
          </div>
          <div style={rowStyle}>
            <dt style={rowLabelStyle}>{c('ring.percent')}</dt>
            <dd style={{ ...rowValueStyle, margin: 0, color }}>{percent}%</dd>
          </div>
          <div style={rowStyle}>
            <dt style={rowLabelStyle}>{c('ring.remaining')}</dt>
            <dd style={{ ...rowValueStyle, margin: 0 }}>{formatTokens(remaining)}</dd>
          </div>
          {rows.every(row => typeof row.value === 'number') && rows.length > 0 && (
            <dl style={{ margin: '4px 0 0', padding: '6px 0 0', borderTop: '1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.18))' }}>
              {rows.map(row => <BreakdownRow key={row.label} label={row.label} value={row.value as number} color={row.color} />)}
            </dl>
          )}
          {billing?.available === true && <BillingBlock billing={billing} t={t} />}
          {percent >= 85 && <div style={warnStyle}>{c('ring.warning')}</div>}
          <div style={footStyle}>
            {c('ring.window')}: {hasReading ? (window_ as number).toLocaleString() : c('ring.unset')}
            {billing?.available === true
              ? ` · ${billing.tier === 'peak' ? c('ring.bill.peak') : billing.tier === 'offPeak' ? c('ring.bill.offPeak') : billing.tier === 'flat' ? c('ring.bill.flat') : c('ring.bill.unpriced')} · ${
                  billing.priced === false
                    ? c('ring.bill.unpriced')
                    : billing.estimated === true
                      ? c('ring.bill.uncalibrated')
                      : typeof billing.catalogLabel === 'string'
                        ? c('ring.bill.pricedAs', billing.catalogLabel)
                        : billing.pricingSource === 'custom'
                          ? c('ring.bill.custom')
                          : billing.modelMatched === false
                            ? c('ring.bill.estimate')
                            : c('ring.bill.priced')
                }`
              : ''}
          </div>
        </div>
      )}
    </div>
  )
}
