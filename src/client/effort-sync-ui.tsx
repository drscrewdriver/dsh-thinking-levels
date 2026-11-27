/**
 * One-click effort-tier sync section (N3 / 4.10.0).
 *
 * Renders the catalog-driven preview and applies it through the plugin's
 * existing `llm-pi-ai` settings scope ONLY — the same read/write channel the
 * model capability card already uses. Never writes the official DeepSeek route,
 * never overwrites a user's own declaration unless the overwrite box is ticked.
 *
 * The heavy lifting (what to write, what to skip, batching) lives in the pure
 * `effort-sync` module and is unit-tested; this component is presentation plus
 * the per-batch write with error capture and a read-back self-check.
 */
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, JSX } from 'react'
import type { SettingsScope } from './scope-face.ts'
import { opsOf, planSync, type SyncPlanRow, type SyncSkipReason } from './effort-sync.ts'
import { EFFORT_TIER_FAMILIES } from '../model-effort-catalog.ts'

const CATALOG_DATE = '2026-11-27'

/** The user-layer providers map from a pi-ai snapshot (mirrors the card helper). */
function providersOf(snapshot: { user?: unknown; value?: unknown } | undefined): Record<string, unknown> {
  const user = snapshot?.user ?? snapshot?.value
  if (typeof user !== 'object' || user === null || Array.isArray(user)) return {}
  const providers = (user as Record<string, unknown>).providers
  return typeof providers === 'object' && providers !== null && !Array.isArray(providers)
    ? providers as Record<string, unknown>
    : {}
}

/** Flatten providers into the {provider, model} pairs the planner consumes. */
function modelPairs(providers: Record<string, unknown>): Array<{ provider: string; model: string }> {
  const out: Array<{ provider: string; model: string }> = []
  for (const [provider, profile] of Object.entries(providers)) {
    const models = (profile as { models?: unknown })?.models
    if (!Array.isArray(models)) continue
    for (const model of models) {
      if (typeof model === 'object' && model !== null && typeof (model as Record<string, unknown>).id === 'string') {
        out.push({ provider, model: (model as Record<string, unknown>).id as string })
      }
    }
  }
  return out
}

const sectionStyle: CSSProperties = { marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }
const titleStyle: CSSProperties = { fontSize: '13px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' }
const hintStyle: CSSProperties = { fontSize: '11px', color: 'var(--dsw-alias-label-tertiary)', margin: 0 }
const rowStyle: CSSProperties = { display: 'flex', gap: '8px', fontSize: '11px', alignItems: 'baseline', padding: '2px 0' }
const writeBtnStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid var(--dsw-alias-border-l2)',
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
  fontSize: '12px',
  cursor: 'pointer',
}
const okStyle: CSSProperties = { fontSize: '11px', color: 'var(--dsw-alias-state-success-primary, #2e9e5b)', margin: 0 }
const errStyle: CSSProperties = { fontSize: '11px', color: 'var(--dsw-alias-state-error-primary)', margin: 0 }

const SKIP_KEYS: Record<SyncSkipReason, string> = {
  declared: 'skip.declared',
  'host-managed': 'skip.host-managed',
  unrecognized: 'skip.unrecognized',
  'low-confidence': 'skip.low-confidence',
  'no-wire': 'skip.no-wire',
}

function describeNext(row: SyncPlanRow): string {
  if (row.next !== undefined) return Object.keys(row.next).join('/')
  if (row.skip !== undefined) return row.skip
  return ''
}

export function EffortSyncSection(props: {
  scope: SettingsScope<unknown>
  t: (key: string) => string
  readonly: boolean
}): JSX.Element {
  const { scope, t, readonly } = props
  const subscribe = useCallback((listener: () => void) => scope.subscribe(listener), [scope])
  const getSnapshot = useCallback(() => scope.getSnapshot(), [scope])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)

  const [overwrite, setOverwrite] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'empty' | 'error'; message?: string }>({ kind: 'idle' })

  const providers = snapshot.status === 'ready' ? providersOf(snapshot) : {}
  const models = useMemo(() => modelPairs(providers), [providers])
  const plan = useMemo(() => planSync({ models, providers, overwrite }), [models, providers, overwrite])
  const writable = plan.filter(row => row.next !== undefined && row.skip === undefined)

  const runSync = (): void => {
    const batches = opsOf(plan)
    if (batches.length === 0) {
      setStatus({ kind: 'empty' })
      return
    }
    setBusy(true)
    setStatus({ kind: 'idle' })
    const failures: string[] = []
    // Apply provider by provider; a failing batch is recorded and the rest still
    // land, so a single bad route never rolls back the whole sync.
    const applyOne = (batch: { provider: string; ops: ReturnType<typeof opsOf>[number]['ops'] }): Promise<boolean> => {
      if (typeof scope.mutate === 'function') {
        return scope.mutate(batch.ops.map(op => ({ path: op.path, op: op.op, value: op.value })))
      }
      // Fallback for hosts without mutate: clone the providers map, fold the ops
      // in by path, and set the whole key once.
      const next = structuredClone(providers)
      for (const op of batch.ops) {
        const [p, , , idx] = op.path
        const profile = next[p] as { models?: Record<string, unknown>[] } | undefined
        const entry = profile?.models?.[Number(idx)]
        if (entry !== undefined) entry.reasoningEfforts = op.value
      }
      return scope.set('providers', next)
    }
    const run = async (): Promise<void> => {
      for (const batch of batches) {
        try {
          const ok = await applyOne(batch)
          if (!ok) failures.push(batch.provider)
        } catch {
          failures.push(batch.provider)
        }
      }
      // Read-back self-check: confirm the first target row now carries a table.
      const after = providersOf(scope.getSnapshot())
      const first = writable[0]
      const stillMissing = first !== undefined
        && ((after[first.provider] as { models?: unknown[] } | undefined)?.models ?? [])
          .some(m => typeof m === 'object' && m !== null && (m as Record<string, unknown>).id === first.model
            && (m as Record<string, unknown>).reasoningEfforts === undefined)
      setBusy(false)
      if (failures.length > 0 || stillMissing) {
        setStatus({ kind: 'error', message: failures.join(', ') })
      } else {
        setStatus({ kind: 'ok' })
      }
    }
    void run()
  }

  return (
    <section style={sectionStyle} aria-label={t('sync.title')}>
      <h4 style={titleStyle}>{t('sync.title')}</h4>
      <p style={hintStyle}>{t('sync.note').replace('%d', CATALOG_DATE)}</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {EFFORT_TIER_FAMILIES.map(family => (
          <span key={family.id} style={rowStyle} title={family.source.url}>
            <strong>{family.label}</strong>
            <span style={{ color: 'var(--dsw-alias-label-tertiary)' }}>
              {family.toggleOnly ? t('model.panel.familyUnknown') : Object.keys(family.wires).join('/')}
            </span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: '6px', padding: '4px 8px' }}>
        {plan.map(row => (
          <div key={`${row.provider}:${row.model}`} style={rowStyle}>
            <span style={{ flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.provider}/{row.model}</span>
            <span style={{ color: 'var(--dsw-alias-label-secondary)' }}>{row.family ?? t('model.panel.familyUnknown')}</span>
            <span style={{ color: row.skip !== undefined ? 'var(--dsw-alias-label-tertiary)' : 'var(--dsw-alias-label-primary)' }}>
              {row.skip !== undefined ? t(SKIP_KEYS[row.skip]) : describeNext(row)}
            </span>
          </div>
        ))}
      </div>
      <label style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px' }}>
        <input type="checkbox" checked={overwrite} disabled={readonly || busy} onChange={e => { setOverwrite(e.target.checked) }} />
        {t('sync.overwrite')}
      </label>
      <button type="button" style={writeBtnStyle} disabled={readonly || busy || writable.length === 0} onClick={runSync}>
        {t('sync.run')} ({writable.length})
      </button>
      {status.kind === 'ok' && <p style={okStyle}>{t('sync.done')}</p>}
      {status.kind === 'empty' && <p style={hintStyle}>{t('sync.empty')}</p>}
      {status.kind === 'error' && <p style={errStyle} role="status">⚠ {t('sync.error')}{status.message ? `: ${status.message}` : ''}</p>}
    </section>
  )
}
