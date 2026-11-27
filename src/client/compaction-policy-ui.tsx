/**
 * Per-model compaction threshold editor (N6 / 4.13.0), rendered only when the
 * host's `dsh-compaction-basic` config actually exposes a `modelPolicies` array.
 *
 * Two ratio inputs per model (trigger / retain) plus a reset; writes go through
 * the compaction scope's mutate ops ONLY for edited models. It never reads or
 * writes the `auto` switch or the global ratios (red line), and never calls the
 * private `compactRegion()` — every rule lives in the tested `compaction-policy`.
 */
import { useCallback, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, JSX } from 'react'
import type { SettingsScope } from './scope-face.ts'
import { globalRatios, modelPoliciesOf, planCompactionPolicies, type CompactionDraft } from './compaction-policy.ts'

const sectionStyle: CSSProperties = { marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }
const titleStyle: CSSProperties = { fontSize: '13px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' }
const hintStyle: CSSProperties = { fontSize: '11px', color: 'var(--dsw-alias-label-tertiary)', margin: 0 }
const rowStyle: CSSProperties = { display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px' }
const inputStyle: CSSProperties = {
  width: '72px',
  padding: '2px 4px',
  borderRadius: '4px',
  border: '1px solid var(--dsw-alias-border-l2)',
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
  fontVariantNumeric: 'tabular-nums',
}
const btnStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid var(--dsw-alias-border-l2)',
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
  fontSize: '12px',
  cursor: 'pointer',
}
const errStyle: CSSProperties = { fontSize: '11px', color: 'var(--dsw-alias-state-error-primary)', margin: 0 }

function providersOf(snapshot: { user?: unknown; value?: unknown } | undefined): Record<string, unknown> {
  const user = snapshot?.user ?? snapshot?.value
  if (typeof user !== 'object' || user === null || Array.isArray(user)) return {}
  const providers = (user as Record<string, unknown>).providers
  return typeof providers === 'object' && providers !== null && !Array.isArray(providers) ? providers as Record<string, unknown> : {}
}

function modelKeys(providers: Record<string, unknown>): Array<{ provider: string; model: string }> {
  const out: Array<{ provider: string; model: string }> = []
  for (const [provider, profile] of Object.entries(providers)) {
    const models = (profile as { models?: unknown })?.models
    if (!Array.isArray(models)) continue
    for (const m of models) {
      if (typeof m === 'object' && m !== null && typeof (m as Record<string, unknown>).id === 'string') {
        out.push({ provider, model: (m as Record<string, unknown>).id as string })
      }
    }
  }
  return out
}

export function CompactionPolicySection(props: {
  compactionScope?: SettingsScope<unknown>
  piAiScope: SettingsScope<unknown>
  t: (key: string) => string
  readonly: boolean
}): JSX.Element | null {
  const { compactionScope, piAiScope, t, readonly } = props

  const cSub = useCallback((l: () => void) => compactionScope?.subscribe(l) ?? (() => {}), [compactionScope])
  const cSnap = useCallback(() => (compactionScope !== undefined ? compactionScope.getSnapshot() : undefined), [compactionScope])
  const compaction = useSyncExternalStore(cSub, cSnap)

  const pSub = useCallback((l: () => void) => piAiScope.subscribe(l), [piAiScope])
  const pSnap = useCallback(() => piAiScope.getSnapshot(), [piAiScope])
  const piSnap = useSyncExternalStore(pSub, pSnap)

  const [drafts, setDrafts] = useState<Record<string, CompactionDraft>>({})
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const current = compaction && compaction.status === 'ready' ? modelPoliciesOf(compaction) : undefined
  // Capability gate: hosts whose compaction config predates `modelPolicies` get
  // no section at all (never a half-wired editor).
  if (compactionScope === undefined || current === undefined) return null

  const defaults = globalRatios(compaction)
  const models = piSnap.status === 'ready' ? modelKeys(providersOf(piSnap)) : []
  const policyFor = (provider: string, model: string) => current.find(p => p.provider === provider && p.model === model)

  const setDraft = (key: string, field: 'thresholdRatio' | 'retainRatio', raw: string): void => {
    const num = Number(raw)
    setDrafts(cur => ({ ...cur, [key]: { ...cur[key], [field]: Number.isFinite(num) ? num : undefined } }))
  }

  const apply = (): void => {
    const result = planCompactionPolicies(models, current, drafts, defaults)
    if (result.unavailable || result.ops.length === 0) {
      setErrors(result.errors)
      return
    }
    setBusy(true)
    setErrors([])
    const run = async (): Promise<void> => {
      const failures: string[] = []
      try {
        if (typeof compactionScope.mutate === 'function') {
          const ok = await compactionScope.mutate(result.ops.map(op => ({ path: op.path, op: op.op, value: op.value })))
          if (!ok) failures.push('mutate')
        } else {
          // Fold ops into the current modelPolicies array and set the whole key.
          const next = current.map(p => ({ ...p }))
          for (const op of result.ops) {
            const [, idx, field] = op.path
            const i = Number(idx)
            while (next.length <= i) next.push({ provider: '', model: '' })
            ;(next[i] as Record<string, unknown>)[field] = op.value
          }
          const ok = await compactionScope.set('modelPolicies', next)
          if (!ok) failures.push('set')
        }
      } catch {
        failures.push('write')
      }
      // Read-back self-check: the first edited model now carries its threshold.
      const after = modelPoliciesOf(compactionScope.getSnapshot()) ?? []
      const firstKey = Object.keys(drafts)[0]
      const [p, m] = firstKey ? firstKey.split('/') : []
      const draft = firstKey ? drafts[firstKey] : undefined
      const stillMissing = draft?.thresholdRatio !== undefined
        && after.some(x => x.provider === p && x.model === m && x.thresholdRatio !== draft.thresholdRatio)
      setBusy(false)
      setErrors(failures.length > 0 || stillMissing ? [...failures] : [])
      if (failures.length === 0 && !stillMissing) setDrafts({})
    }
    void run()
  }

  return (
    <section style={sectionStyle} aria-label={t('comp.title')}>
      <h4 style={titleStyle}>{t('comp.title')}</h4>
      <p style={hintStyle}>{t('comp.note').replace('%t', String(defaults.thresholdRatio)).replace('%r', String(defaults.retainRatio))}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: '6px', padding: '4px 8px' }}>
        {models.map(({ provider, model }) => {
          const key = `${provider}/${model}`
          const existing = policyFor(provider, model)
          const draft = drafts[key] ?? {}
          const thr = draft.thresholdRatio ?? existing?.thresholdRatio ?? defaults.thresholdRatio
          const ret = draft.retainRatio ?? existing?.retainRatio ?? defaults.retainRatio
          return (
            <div key={key} style={rowStyle}>
              <span style={{ flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{key}</span>
              <input type="number" step="0.01" min="0" max="1" value={thr} disabled={readonly || busy} aria-label={t('comp.threshold')} placeholder={t('comp.threshold')} style={inputStyle} onChange={e => { setDraft(key, 'thresholdRatio', e.currentTarget.value) }} />
              <input type="number" step="0.01" min="0" max="1" value={ret} disabled={readonly || busy} aria-label={t('comp.retain')} placeholder={t('comp.retain')} style={inputStyle} onChange={e => { setDraft(key, 'retainRatio', e.currentTarget.value) }} />
            </div>
          )
        })}
      </div>
      <button type="button" style={btnStyle} disabled={readonly || busy || Object.keys(drafts).length === 0} onClick={apply}>{t('comp.apply')}</button>
      {errors.length > 0 && <p style={errStyle} role="status">⚠ {errors.join('; ')}</p>}
    </section>
  )
}
