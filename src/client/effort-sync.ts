/**
 * One-click effort sync (N3 / 4.10.0) — pure planning logic, no DOM, no I/O.
 *
 * Given the third-party model list and the current `llm-pi-ai` user layer, it
 * produces a preview of per-model writes and the mutate ops that would apply
 * them. The write-back itself lives in the settings UI and only goes through
 * the existing `piAiScope`; this module never touches the host.
 *
 * Safety rules baked into the plan (checklist N3):
 * - never overwrite a model that already declares `reasoningEfforts` unless the
 *   caller passes `overwrite:true`;
 * - an overwrite never WIDENS a model's level set: a declared table is the only
 *   per-model statement of which host levels that model accepts, so the family
 *   ladder is narrowed to the declared keys (4.13.2 — a family ladder says what
 *   the vendor family supports, not what one model accepts; DeepSeek-V4.1-Flash
 *   takes off/low/high/xhigh while the V4 family table carries all seven);
 * - never touch the official DeepSeek route (host-managed);
 * - skip unrecognized / low-confidence / wire-less families.
 */
import { suggestedEffortsFor, type WireLevel } from '../model-effort-catalog.ts'

/** A single settings mutate operation, mirroring `SettingsScope.mutate`. */
export interface SettingsPathOp {
  path: readonly string[]
  op: 'set' | 'unset'
  value?: unknown
}

export type SyncSkipReason = 'declared' | 'host-managed' | 'unrecognized' | 'low-confidence' | 'no-wire'

export interface SyncPlanRow {
  provider: string
  model: string
  /** Index of this model inside `providers[provider].models`; -1 when absent. */
  modelIndex: number
  family: string | undefined
  /** What the llm-pi-ai user layer currently declares, when anything. */
  current: Partial<Record<WireLevel, string | null>> | undefined
  /** What we would write; undefined = nothing to do. */
  next: Partial<Record<WireLevel, string | null>> | undefined
  /** Why this row is skipped; absent = it will be written. */
  skip?: SyncSkipReason
}

/** Providers whose model directory is owned by an official adapter — writes get clobbered upstream. */
export const HOST_MANAGED_PROVIDERS: readonly string[] = ['deepseek-official', 'llm-deepseek']

interface KnownModel { provider: string; model: string }

function isHostManaged(provider: string): boolean {
  return HOST_MANAGED_PROVIDERS.some(id => id.toLowerCase() === provider.toLowerCase())
}

/** The user-layer `models` array of one provider, defensively. */
function modelsArray(providers: Record<string, unknown>, provider: string): Record<string, unknown>[] {
  const profile = providers[provider]
  if (typeof profile !== 'object' || profile === null) return []
  const models = (profile as { models?: unknown }).models
  return Array.isArray(models)
    ? models.filter((m): m is Record<string, unknown> => typeof m === 'object' && m !== null && !Array.isArray(m))
    : []
}

/** Whether a value looks like a declared `reasoningEfforts` table. */
function isDeclaredTable(value: unknown): value is Partial<Record<WireLevel, string | null>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * The family ladder narrowed to the levels the model already declares.
 *
 * A declared table carries the level KEYS the user's route accepts; the family
 * ladder only knows the vendor family's full set. Writing the family set over a
 * narrower declaration would put levels the model cannot take into the very
 * config that defines its available tiers — the reported 4.1-Flash symptom
 * (declared off/low/high/xhigh, family table lists all seven). Wire spellings
 * still come from the catalog, so a misspelled declared level is corrected.
 */
function narrowToDeclared(
  ladder: Partial<Record<WireLevel, string | null>>,
  declared: Partial<Record<WireLevel, string | null>>,
): Partial<Record<WireLevel, string | null>> {
  const out: Partial<Record<WireLevel, string | null>> = {}
  for (const level of Object.keys(ladder) as WireLevel[]) {
    if (Object.hasOwn(declared, level)) out[level] = ladder[level]
  }
  return out
}

/** Build the per-model sync preview. */
export function planSync(input: {
  models: readonly KnownModel[]
  providers: Record<string, unknown>
  overwrite: boolean
}): SyncPlanRow[] {
  return input.models.map(({ provider, model }) => {
    if (isHostManaged(provider)) {
      return { provider, model, modelIndex: -1, family: undefined, current: undefined, next: undefined, skip: 'host-managed' as const }
    }
    const models = modelsArray(input.providers, provider)
    const modelIndex = models.findIndex(entry => entry['id'] === model)
    const declared = modelIndex >= 0 ? models[modelIndex]?.['reasoningEfforts'] : undefined
    const current = isDeclaredTable(declared) ? declared : undefined
    // One brain for both surfaces: the card's per-model 「按建议自动设置」 button
    // and this planner resolve through `suggestedEffortsFor`, so they can never
    // disagree about which model gets which ladder.
    const suggestion = suggestedEffortsFor(provider, model)
    if (!suggestion.ok) {
      const family = suggestion.tier?.family.label
      const skip: SyncSkipReason = suggestion.reason === 'unrecognized'
        ? 'unrecognized'
        : suggestion.reason === 'low-confidence'
          ? 'low-confidence'
          : 'no-wire'
      return { provider, model, modelIndex, family, current, next: undefined, skip }
    }
    const base = { provider, model, modelIndex, family: suggestion.tier.family.label, current }
    if (current !== undefined && !input.overwrite) {
      return { ...base, next: undefined, skip: 'declared' as const }
    }
    const next = current === undefined ? suggestion.table : narrowToDeclared(suggestion.table, current)
    if (Object.keys(next).length === 0) {
      return { ...base, next: undefined, skip: 'no-wire' as const }
    }
    return { ...base, next }
  })
}

/**
 * Group the writable rows into per-provider mutate batches. A provider with no
 * writable rows produces no batch, so an all-skip plan returns [] (the caller
 * must not fire a no-op write).
 */
export function opsOf(plan: readonly SyncPlanRow[]): Array<{ provider: string; ops: SettingsPathOp[] }> {
  const byProvider = new Map<string, SettingsPathOp[]>()
  for (const row of plan) {
    if (row.next === undefined || row.skip !== undefined || row.modelIndex < 0) continue
    const ops = byProvider.get(row.provider) ?? []
    ops.push({ path: ['providers', row.provider, 'models', String(row.modelIndex), 'reasoningEfforts'], op: 'set', value: row.next })
    byProvider.set(row.provider, ops)
  }
  return [...byProvider.entries()].map(([provider, ops]) => ({ provider, ops }))
}
