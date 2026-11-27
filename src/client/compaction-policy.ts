/**
 * Per-model compaction threshold planner (N6 / 4.13.0) — pure, no DOM, no I/O.
 *
 * Writes ONLY `dsh-compaction-basic`'s `modelPolicies[]` (the official, stable
 * per-model override surface: `{ provider, model, thresholdRatio, retainRatio }`).
 * It NEVER touches the `auto` master switch or the global ratios, and NEVER
 * calls the private `compactRegion()`. The UI reads the plugin's own configForms
 * handle for `dsh-compaction-basic` and feeds the live snapshot + user drafts
 * here; the resulting ops go back through the same scope the effort sync uses.
 *
 * Validation (checklist N6): a ratio must be `0 < r < 1`, and `retainRatio`
 * must stay strictly below `thresholdRatio` (compaction rejects otherwise).
 * Violations return a readable error and the row is NOT written — no silent
 * clamping.
 */
import type { SettingsPathOp } from './effort-sync.ts'

export interface ModelKey { provider: string; model: string }

export interface CompactionDraft {
  thresholdRatio?: number
  retainRatio?: number
}

export interface CompactionPolicyResult {
  /** True when the host's compaction config has no `modelPolicies` surface (old line). */
  unavailable?: boolean
  /** Human-readable validation errors; the offending rows produce no ops. */
  errors: string[]
  /** Mutate ops to apply; empty when nothing valid changed. */
  ops: SettingsPathOp[]
}

interface ExistingPolicy extends ModelKey {
  thresholdRatio?: number
  retainRatio?: number
  [k: string]: unknown
}

const RATIO_OK = (v: number): boolean => Number.isFinite(v) && v > 0 && v < 1

/** Read the live `modelPolicies` array from a compaction snapshot user layer. */
export function modelPoliciesOf(snapshot: { user?: unknown; value?: unknown } | undefined): ExistingPolicy[] | undefined {
  const user = snapshot?.user ?? snapshot?.value
  if (typeof user !== 'object' || user === null) return undefined
  const policies = (user as Record<string, unknown>).modelPolicies
  if (!Array.isArray(policies)) return undefined
  return policies.filter((p): p is ExistingPolicy => typeof p === 'object' && p !== null && !Array.isArray(p))
}

/** The host defaults, read defensively (0.8 / 0.16 per findings §五). */
export function globalRatios(snapshot: { user?: unknown; value?: unknown } | undefined): { thresholdRatio: number; retainRatio: number } {
  const user = (snapshot?.user ?? snapshot?.value) as Record<string, unknown> | undefined
  const thr = typeof user?.thresholdRatio === 'number' ? user.thresholdRatio : 0.8
  const ret = typeof user?.retainRatio === 'number' ? user.retainRatio : 0.16
  return { thresholdRatio: thr, retainRatio: ret }
}

/**
 * Build the mutate ops for the edited models. Only models present in `drafts`
 * with at least one valid change emit ops; untouched models never appear.
 * @param drafts keyed by `provider/model`.
 */
export function planCompactionPolicies(
  models: readonly ModelKey[],
  current: ExistingPolicy[] | undefined,
  drafts: Record<string, CompactionDraft>,
  defaults: { thresholdRatio: number; retainRatio: number },
): CompactionPolicyResult {
  // A host whose compaction config predates `modelPolicies` offers no surface.
  if (current === undefined) {
    return { unavailable: true, errors: [], ops: [] }
  }
  const base = current.map(entry => ({ ...entry }))
  const errors: string[] = []
  const ops: SettingsPathOp[] = []
  const modelIndex = new Map(models.map((m, i) => [`${m.provider}/${m.model}`, i]))

  for (const [key, draft] of Object.entries(drafts)) {
    if (draft.thresholdRatio === undefined && draft.retainRatio === undefined) continue
    const [provider, model] = key.split('/')
    if (provider === undefined || model === undefined || !modelIndex.has(key)) {
      errors.push(`${key}: ${'model not in list'}`)
      continue
    }
    const idx = base.findIndex(entry => entry.provider === provider && entry.model === model)

    // Effective post-draft ratios (draft wins over existing over host default).
    const existing = idx >= 0 ? base[idx] : undefined
    const nextThreshold = draft.thresholdRatio ?? existing?.thresholdRatio ?? defaults.thresholdRatio
    const nextRetain = draft.retainRatio ?? existing?.retainRatio ?? defaults.retainRatio

    if (draft.thresholdRatio !== undefined && !RATIO_OK(draft.thresholdRatio)) {
      errors.push(`${key}: thresholdRatio must be between 0 and 1`)
      continue
    }
    if (draft.retainRatio !== undefined && !RATIO_OK(draft.retainRatio)) {
      errors.push(`${key}: retainRatio must be between 0 and 1`)
      continue
    }
    if (!(nextRetain < nextThreshold)) {
      errors.push(`${key}: retainRatio must be below thresholdRatio`)
      continue
    }

    if (idx >= 0) {
      const target = base[idx]
      if (draft.thresholdRatio !== undefined && draft.thresholdRatio !== target.thresholdRatio) {
        ops.push({ path: ['modelPolicies', String(idx), 'thresholdRatio'], op: 'set', value: draft.thresholdRatio })
        target.thresholdRatio = draft.thresholdRatio
      }
      if (draft.retainRatio !== undefined && draft.retainRatio !== target.retainRatio) {
        ops.push({ path: ['modelPolicies', String(idx), 'retainRatio'], op: 'set', value: draft.retainRatio })
        target.retainRatio = draft.retainRatio
      }
    } else {
      const appendIndex = base.length
      ops.push({ path: ['modelPolicies', String(appendIndex), 'provider'], op: 'set', value: provider })
      ops.push({ path: ['modelPolicies', String(appendIndex), 'model'], op: 'set', value: model })
      ops.push({ path: ['modelPolicies', String(appendIndex), 'thresholdRatio'], op: 'set', value: nextThreshold })
      ops.push({ path: ['modelPolicies', String(appendIndex), 'retainRatio'], op: 'set', value: nextRetain })
      base.push({ provider, model, thresholdRatio: nextThreshold, retainRatio: nextRetain })
    }
  }
  return { errors, ops }
}
