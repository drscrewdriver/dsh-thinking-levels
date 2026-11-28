/**
 * Built-in mainstream-model effort-tier catalog (N2 / 4.9.0).
 *
 * Pure data + pure functions, zero runtime deps, unit-testable. One entry per
 * vendor FAMILY: which host slider levels the family supports, the wire
 * spelling each level takes on that vendor's API, the vendor's own default,
 * and whether thinking can be turned off at all. Narrower `variants` override
 * family data for exceptional models (Claude 4.6 lacking `xhigh`, Gemini 3.5
 * flash gaining `minimal`, …).
 *
 * Data policy (see plan findings §1): every family carries `source.url` +
 * `retrievedAt`; anything not confirmed first-hand stays `confidence:'low'`
 * and must NOT produce suggested writes. Wire values are information pinned
 * from vendor docs — this module never guesses a spelling.
 */
import type { EffortId } from './thinking-level.ts'

/** Host-model levels that can carry a wire mapping (`on`/`auto` are plugin-side only). */
export type WireLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'

/** The seven host levels, in slider order — the catalog's key domain. */
export const WIRE_LEVELS: readonly WireLevel[] = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']

/** A narrower exception inside a family; each present key replaces the family value. */
export interface EffortTierVariant {
  modelMatch: readonly RegExp[]
  wires?: Partial<Record<WireLevel, string>>
  vendorDefault?: EffortId
  /** Appended to the family notes for this variant (data caveats, extra knobs). */
  notes?: string
}

export interface EffortTierFamily {
  id: string
  label: string
  /** All non-empty match lists present must hit (provider AND model). */
  providerMatch: readonly RegExp[]
  modelMatch: readonly RegExp[]
  /** Host level -> wire spelling; absent key = level unsupported by this family. */
  wires: Partial<Record<WireLevel, string>>
  vendorDefault: EffortId
  canDisable: boolean
  /** Family exposes only an on/off thinking toggle, no effort gradient. */
  toggleOnly: boolean
  /** `low` = not first-hand confirmed -> display-only, never suggested. */
  confidence: 'high' | 'low'
  /** Evaluated before the family defaults; first matching variant wins. */
  variants?: readonly EffortTierVariant[]
  source: { url: string; retrievedAt: string }
  /** Data caveats carried verbatim from the research notes. */
  notes?: string
}

/** A resolved per-model tier view: family data with the winning variant merged. */
export interface ResolvedTier {
  family: EffortTierFamily
  wires: Partial<Record<WireLevel, string>>
  vendorDefault: EffortId
  canDisable: boolean
  toggleOnly: boolean
  confidence: 'high' | 'low'
  /** Family notes plus the winning variant's, when either exists. */
  notes?: string
}

const RETRIEVED = '2026-11-28'

/** The retrieval date shown in the UI ("catalog data retrieved %d"). */
export const CATALOG_RETRIEVED = RETRIEVED

export const EFFORT_TIER_FAMILIES: readonly EffortTierFamily[] = [
  {
    id: 'openai-gpt5',
    label: 'OpenAI GPT-5.x',
    providerMatch: [/^openai$/i, /chatgpt/i],
    modelMatch: [/^gpt-5/i],
    wires: { off: 'none', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh' },
    vendorDefault: 'medium',
    canDisable: true,
    toggleOnly: false,
    // findings §1.7: only gpt-5.5 confirmed first-hand; whether other GPT-5.x
    // models carry `minimal`/`max` is unverified -> low, display-only.
    confidence: 'low',
    source: { url: 'https://modelparams.dev/models/openai/gpt-5.5', retrievedAt: RETRIEVED },
    notes: 'gpt-5.5: none|low|medium|high|xhigh, default medium. Other GPT-5.x sets unverified.',
  },
  {
    id: 'anthropic-claude',
    label: 'Claude',
    providerMatch: [/^anthropic$/i, /claude/i],
    modelMatch: [/^claude-/i],
    // Base shape = the 4.6 line (no xhigh). Variants widen per model docs.
    wires: { low: 'low', medium: 'medium', high: 'high', max: 'max' },
    vendorDefault: 'high',
    canDisable: false,
    toggleOnly: false,
    confidence: 'high',
    variants: [
      // Fable 5.2 — five levels, default medium.
      { modelMatch: [/fable/i], wires: { xhigh: 'xhigh' }, vendorDefault: 'medium' },
      // 5.5 / 5 line and Opus 4.7/4.8 — five levels; 5.5 line defaults medium, 4.7 xhigh.
      { modelMatch: [/-(?:opus|sonnet|haiku)-5(?:\.5)?$/i], wires: { xhigh: 'xhigh' }, vendorDefault: 'medium' },
      { modelMatch: [/^claude-opus-4\.7$/i], wires: { xhigh: 'xhigh' }, vendorDefault: 'xhigh' },
      { modelMatch: [/^claude-opus-4\.8$/i], wires: { xhigh: 'xhigh' } },
    ],
    source: { url: 'https://code.claude.com/docs/en/model-config', retrievedAt: RETRIEVED },
    notes: 'Unsupported level falls back DOWNWARD to the highest supported one (vendor semantics).',
  },
  {
    id: 'gemini-4',
    label: 'Gemini 4',
    providerMatch: [/google/i, /gemini/i],
    modelMatch: [/^gemini-4/i],
    wires: { low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh' },
    vendorDefault: 'high',
    canDisable: false,
    toggleOnly: false,
    confidence: 'high',
    source: { url: 'https://raw.githubusercontent.com/google-gemini/cookbook/main/quickstarts/Get_started_thinking.ipynb', retrievedAt: RETRIEVED },
    notes: 'Thinking is always on for Gemini 4; no `minimal` level. Pro/Hydrogen default high, Carbon/Argon default medium.',
  },
  {
    id: 'gemini-3',
    label: 'Gemini 3',
    providerMatch: [/google/i, /gemini/i],
    modelMatch: [/^gemini-3/i],
    // findings §1.4: minimal only on 3.5/3.6 flash; Pro defaults high, flash line medium.
    wires: { low: 'low', medium: 'medium', high: 'high' },
    vendorDefault: 'medium',
    canDisable: false,
    toggleOnly: false,
    confidence: 'high',
    variants: [
      { modelMatch: [/^gemini-3\.[56].*flash/i], wires: { minimal: 'minimal' } },
      { modelMatch: [/pro/i], vendorDefault: 'high' },
    ],
    source: { url: 'https://raw.githubusercontent.com/google-gemini/cookbook/main/quickstarts/Get_started_thinking.ipynb', retrievedAt: RETRIEVED },
  },
  {
    id: 'deepseek-v4',
    label: 'DeepSeek V4',
    providerMatch: [/deepseek/i],
    modelMatch: [/^deepseek/i],
    // 4.13.3: three real grades + off, not the host's seven. The vendor maps
    // low/medium -> high and xhigh -> max, so shipping minimal/medium/xhigh as
    // separate host levels handed the auto scheduler two stops with identical
    // effect and made a four-level model look like a seven-level one.
    // off (`none`) exists on the Responses API only.
    wires: { off: 'none', low: 'low', high: 'high', max: 'max' },
    vendorDefault: 'high',
    canDisable: true,
    toggleOnly: false,
    confidence: 'high',
    source: { url: 'https://api-docs.deepseek.com/guides/thinking_mode/', retrievedAt: RETRIEVED },
    notes: 'V4 line: high and max are the real grades; low/medium are mapped up to high and xhigh to max. V4.1 (incl. Flash) also takes a 1–100 reasoning_effort integer for fine depth control. Thinking on by default, default high; `none` exists on the Responses API only.',
  },
  {
    id: 'xiaomi-mimo',
    label: 'Xiaomi MiMo',
    providerMatch: [/xiaomi|mimo/i],
    modelMatch: [/mimo/i],
    // 4.13.3: no effort gradient — MiMo 2.5/2.6 (Pro and non-Pro) take no
    // reasoning_effort, only a thinking on/off (enable_thinking via
    // qwen-chat-template). Recognizing the family makes the card say "on/off
    // only" instead of "unrecognized", and keeps the sync planner from writing
    // a ladder the gateway would ignore.
    wires: {},
    vendorDefault: 'on',
    canDisable: true,
    toggleOnly: true,
    confidence: 'high',
    source: { url: 'https://github.com/XiaomiMiMo/MiMo', retrievedAt: RETRIEVED },
    notes: 'MiMo 2.5/2.6 (incl. non-Pro) do not accept reasoning_effort; thinking depth is not tunable, only on/off.',
  },
  {
    id: 'grok-4.6',
    label: 'Grok 4.6+',
    providerMatch: [/xai/i, /grok/i],
    modelMatch: [/^grok-4\.[6-9]/i, /^grok-[5-9]/i],
    wires: { low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh' },
    vendorDefault: 'high',
    canDisable: false,
    toggleOnly: false,
    confidence: 'high',
    source: { url: 'https://modelparams.dev/models/xai/grok-4.6', retrievedAt: RETRIEVED },
    notes: 'Reasoning cannot be disabled; xhigh from grok-4.6 onward.',
  },
  {
    id: 'qwen-effort',
    label: 'Qwen (effort)',
    providerMatch: [/qwen/i, /dashscope/i, /tongyi/i],
    modelMatch: [/^qwen3\.[5-9].*(?:max|omni-flash)/i],
    wires: { low: 'low', medium: 'medium', xhigh: 'xhigh' },
    vendorDefault: 'xhigh',
    canDisable: false,
    toggleOnly: false,
    confidence: 'high',
    source: { url: 'https://docs.qwencloud.com/developer-guides/text-generation/thinking', retrievedAt: RETRIEVED },
    notes: 'qwen3.8-max: low|medium|xhigh, default xhigh. reasoning_effort and thinking_budget must not be set together.',
  },
  {
    id: 'qwen-toggle',
    label: 'Qwen (toggle)',
    providerMatch: [/qwen/i, /dashscope/i, /tongyi/i],
    modelMatch: [/^qwen/i],
    wires: {},
    vendorDefault: 'on',
    canDisable: true,
    toggleOnly: true,
    confidence: 'high',
    source: { url: 'https://docs.qwencloud.com/developer-guides/text-generation/thinking', retrievedAt: RETRIEVED },
    notes: 'Hybrid thinking via per-request enable_thinking; no confirmed effort gradient. qwen-plus/qwen-flash default thinking OFF.',
  },
  {
    id: 'glm-kimi-minimax-toggle',
    label: 'GLM / Kimi / MiniMax (toggle)',
    providerMatch: [/zhipu|glm|moonshot|kimi|minimax/i],
    modelMatch: [/^(?:glm|kimi|MiniMax)/i, /^(?:glm|kimi|minimax)/i],
    wires: {},
    vendorDefault: 'on',
    canDisable: true,
    toggleOnly: true,
    confidence: 'low',
    source: { url: 'https://docs.qwencloud.com/developer-guides/text-generation/thinking', retrievedAt: RETRIEVED },
    notes: 'Docs confirm enable/disable only (thinking-only lines like glm-5.3, kimi-k2.7-code cannot disable); no effort gradient verified -> display-only.',
  },
]

function matchesAll(matchers: readonly RegExp[], value: string): boolean {
  return matchers.length === 0 || matchers.some(pattern => pattern.test(value))
}

/**
 * The family for a model line. Model ids embed the vendor (grok-4.6, claude-*,
 * deepseek-* …), so `modelMatch` is the primary key — a gateway that serves the
 * model under a different provider name (openrouter/deepseek-v4-pro) still
 * resolves. `providerMatch` only disambiguates when several families hit the
 * same model id; the first array-order match wins otherwise.
 */
export function matchEffortFamily(provider: string, model: string): EffortTierFamily | undefined {
  const byModel = EFFORT_TIER_FAMILIES.filter(family => matchesAll(family.modelMatch, model))
  if (byModel.length === 0) return undefined
  const narrowed = byModel.find(family => family.providerMatch.length > 0 && matchesAll(family.providerMatch, provider))
  return narrowed ?? byModel[0]
}

/** Family data with the first matching variant merged over it. */
export function resolveTier(provider: string, model: string): ResolvedTier | undefined {
  const family = matchEffortFamily(provider, model)
  if (family === undefined) return undefined
  const variant = family.variants?.find(candidate => matchesAll(candidate.modelMatch, model))
  const notes = [family.notes, variant?.notes].filter((note): note is string => typeof note === 'string' && note !== '').join(' ')
  return {
    family,
    wires: variant?.wires === undefined ? family.wires : { ...family.wires, ...variant.wires },
    vendorDefault: variant?.vendorDefault ?? family.vendorDefault,
    canDisable: family.canDisable,
    toggleOnly: family.toggleOnly,
    confidence: family.confidence,
    notes: notes === '' ? undefined : notes,
  }
}

/** The levels a family/variant actually offers, in slider order. */
export function wireLevelsOf(wires: Partial<Record<WireLevel, string>>): WireLevel[] {
  return WIRE_LEVELS.filter(level => wires[level] !== undefined)
}

/**
 * The `reasoningEfforts` shape the llm-pi-ai user layer takes:
 * `Partial<Record<WireLevel, string | null>>` — wire spelling per supported
 * level, `off: null` when the family can disable thinking (null = the host's
 * "no wire value, strip the param" convention), absent for unsupported levels.
 * Toggle-only families produce an empty map (there is nothing to write).
 */
export function reasoningEffortsOf(tier: Pick<ResolvedTier, 'wires' | 'canDisable' | 'toggleOnly'>): Partial<Record<WireLevel, string | null>> {
  if (tier.toggleOnly) return {}
  const out: Partial<Record<WireLevel, string | null>> = {}
  for (const level of WIRE_LEVELS) {
    const wire = tier.wires[level]
    if (wire !== undefined) out[level] = wire
    else if (level === 'off' && tier.canDisable) out.off = null
  }
  return out
}

/** Why a model has no auto-applicable ladder. */
export type SuggestionMiss = 'unrecognized' | 'low-confidence' | 'toggle-only' | 'no-effort'

/** One model's auto-apply suggestion: a ready-to-write table, or the reason there is none. */
export type TierSuggestion =
  | { ok: true; tier: ResolvedTier; table: Partial<Record<WireLevel, string | null>>; levels: WireLevel[] }
  | { ok: false; reason: SuggestionMiss; tier?: ResolvedTier }

/**
 * The ladder to write for one model line — the shared brain behind the model
 * card's 「按建议自动设置」 button and the one-click sync.
 *
 * Refusals are explicit rather than silently empty: an unknown family, a
 * low-confidence family (never auto-writes, per the data policy), a toggle-only
 * family (nothing but on/off exists) and an effort-less family (MiMo) each get
 * their own reason so the UI can say WHY instead of showing a dead button.
 */
export function suggestedEffortsFor(provider: string, model: string): TierSuggestion {
  const tier = resolveTier(provider, model)
  if (tier === undefined) return { ok: false, reason: 'unrecognized' }
  // Confidence first: "we never confirmed this family" is the stronger reason
  // to stay silent than "this family only has an on/off switch", and a
  // low-confidence toggle family (GLM) carries both truths.
  if (tier.confidence === 'low') return { ok: false, reason: 'low-confidence', tier }
  if (tier.toggleOnly) return { ok: false, reason: 'toggle-only', tier }
  const table = reasoningEffortsOf(tier)
  const levels = wireLevelsOf(tier.wires)
  if (levels.length === 0) return { ok: false, reason: 'no-effort', tier }
  return { ok: true, tier, table, levels }
}

/** The display list for a family row (catalog coverage panel, sync header). */
export function familyLevelList(family: EffortTierFamily): { kind: 'levels' | 'toggle' | 'none'; levels: WireLevel[] } {
  const levels = wireLevelsOf(family.wires)
  if (family.toggleOnly) return { kind: 'toggle', levels }
  if (levels.length === 0) return { kind: 'none', levels }
  return { kind: 'levels', levels }
}
