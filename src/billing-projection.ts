/**
 * TL cache-billing projection unit (`tlCacheBilling`).
 *
 * Accounting semantics ported from better-er/dsh-cache-billing (read line by
 * line, see .agents/plans/tl-billing-popover): usage samples from
 * assistant/chunk (type 'usage') and assistant/message (data.usage), same-step
 * replacement settles old-minus-new, turn aggregation resets on turn switch,
 * session totals price every sample at its own event-time rate.
 *
 * Pricing: single model DeepSeek-V4.1-Flash, Beijing-time peak/off-peak
 * (workdays 09-12 & 14-18 peak, weekends and CN statutory holidays off-peak
 * all day; pure UTC+8 math, never the local clock). Unmatched model names are
 * still priced at Flash rates and flagged via modelMatched=false.
 *
 * Schema library: the projection framework duck-types `stateSchema.parse()` /
 * `wire.viewSchema.parse()` (dsh-session-projection lib:255/259/305), so these
 * MUST be real zod objects — schemastery has no parse. zod ^4.4.3 rides in
 * dependencies (TL's tsc build does not bundle).
 * @module dsh-thinking-levels/billing-projection
 */
import { z } from 'zod'

/** 谷价费率行（元/百万 token）——价目表的基准列。 */
export interface RateRow {
  cacheHit: number
  cacheMiss: number
  output: number
}

/** 账目只认 DeepSeek-V4.1-Flash：现名、旧名与历史变体全部由 Flash 服务。 */
export const BILLING_MODEL = {
  key: 'deepseek-v4.1-flash',
  label: 'DeepSeek-V4.1-Flash',
  aliases: [
    'deepseek-v4.1-flash',
    'deepseek-flash',
    'deepseek-v4-flash',
    'deepseek-v4-flash-vision-exp',
  ],
  peak: { cacheHit: 0.04, cacheMiss: 2, output: 8 },
  offPeak: { cacheHit: 0.02, cacheMiss: 1, output: 4 },
} as const

export type Tier = 'peak' | 'offPeak'

/**
 * 中国法定节假日放假日（北京时间 YYYY-MM-DD），2026 年国务院安排 33 天（holiday-cn）。
 * 只收放假日不收调休补班周末；表外年份退化为只认周末。
 */
export const HOLIDAYS_2026: ReadonlySet<string> = new Set([
  '2026-01-01', '2026-01-02', '2026-01-03',
  '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19',
  '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
  '2026-04-04', '2026-04-05', '2026-04-06',
  '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
  '2026-06-19', '2026-06-20', '2026-06-21',
  '2026-09-25', '2026-09-26', '2026-09-27',
  '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05',
  '2026-10-06', '2026-10-07',
])

/** 时刻是否为北京高峰。UTC+8 纯数学换算；无效时间戳用 getUTC* 拼串不抛错。 */
export function isPeakBeijing(timeMs: number): boolean {
  const shifted = new Date(timeMs + 8 * 3600 * 1000)
  const day = shifted.getUTCDay()
  if (day === 0 || day === 6) return false
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(shifted.getUTCDate()).padStart(2, '0')
  if (HOLIDAYS_2026.has(`${shifted.getUTCFullYear()}-${month}-${dayOfMonth}`)) return false
  const hour = shifted.getUTCHours()
  return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18)
}

/** 模型在某时刻的费率行 + 峰谷 + 白名单命中标记。 */
export function rateOf(
  model: string | null,
  timeMs: number,
): { row: RateRow; tier: Tier; matchedModel: string; matched: boolean } {
  const key = (model ?? '').toLowerCase()
  const tier: Tier = isPeakBeijing(timeMs) ? 'peak' : 'offPeak'
  const row = tier === 'peak' ? BILLING_MODEL.peak : BILLING_MODEL.offPeak
  const matched = BILLING_MODEL.aliases.some(
    (alias) => key === alias || key.endsWith(alias) || key.includes(alias),
  )
  return { row, tier, matchedModel: BILLING_MODEL.label, matched }
}

const round9 = (n: number): number => Math.round(n * 1e9) / 1e9

/** 一个 usage 样本：state.last 只存最新一轮。 */
export interface Sample {
  turn: number
  step: number
  inputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  outputTokens: number
  model: string | null
  provider: string | null
  /** 事件时刻 epoch ms（峰谷判定用事件时刻，不用当前时钟）。 */
  time: number
}

/** 会话累计：跨轮逐笔按各自事件时刻费率计价。 */
export interface Totals {
  cacheHitCost: number
  missCost: number
  outputCost: number
  inputTokens: number
  cacheReadTokens: number
  outputTokens: number
  rounds: number
  missSteps: number
  writeTokens: number
  fullMissSteps: number
}

/** 当前轮累计：turn 切换重置。 */
export interface TurnTotals {
  id: number
  hitCost: number
  missCost: number
  outputCost: number
  inputTokens: number
  cacheReadTokens: number
  outputTokens: number
}

export interface ProjectionState {
  provider: string | null
  model: string | null
  last: Sample | null
  turn: TurnTotals | null
  totals: Totals
}

/** 按样本模型与事件时刻计一轮三笔费用（元）。 */
export function costOf(sample: Sample): { hit: number; miss: number; output: number } {
  const { row } = rateOf(sample.model, sample.time)
  return {
    hit: round9((sample.cacheReadTokens * row.cacheHit) / 1e6),
    miss: round9(((sample.inputTokens + sample.cacheWriteTokens) * row.cacheMiss) / 1e6),
    output: round9((sample.outputTokens * row.output) / 1e6),
  }
}

/** 写失效：发生过缓存写入（官方不报，恒 false，个别中转有值）。 */
export const isWriteMiss = (s: Sample): boolean => s.cacheWriteTokens > 0

/** 完全失效：有输入但缓存命中为 0（首轮无缓存可命中也算，近似，任何路由可靠）。 */
export const isFullMiss = (s: Sample): boolean =>
  s.inputTokens + s.cacheReadTokens + s.cacheWriteTokens > 0 && s.cacheReadTokens === 0

const sampleInput = (s: Sample): number => s.inputTokens + s.cacheReadTokens + s.cacheWriteTokens

const EMPTY_TOTALS: Totals = {
  cacheHitCost: 0,
  missCost: 0,
  outputCost: 0,
  inputTokens: 0,
  cacheReadTokens: 0,
  outputTokens: 0,
  rounds: 0,
  missSteps: 0,
  writeTokens: 0,
  fullMissSteps: 0,
}

const sampleSchemaFields = {
  inputTokens: z.number().int().nonnegative(),
  cacheReadTokens: z.number().int().nonnegative(),
  cacheWriteTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  model: z.string().nullable(),
  provider: z.string().nullable(),
  time: z.number(),
}

const turnTotalsShape = {
  id: z.number().int(),
  hitCost: z.number().nonnegative(),
  missCost: z.number().nonnegative(),
  outputCost: z.number().nonnegative(),
  inputTokens: z.number().int().nonnegative(),
  cacheReadTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
}

const totalsShape = {
  cacheHitCost: z.number().nonnegative(),
  missCost: z.number().nonnegative(),
  outputCost: z.number().nonnegative(),
  inputTokens: z.number().int().nonnegative(),
  cacheReadTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  rounds: z.number().int().nonnegative(),
  missSteps: z.number().int().nonnegative(),
  writeTokens: z.number().int().nonnegative(),
  fullMissSteps: z.number().int().nonnegative(),
}

/**
 * Build the `tlCacheBilling` projection definition. Registered soft-coupled
 * (runtime inject — NEVER a top-level export inject, which would make the
 * whole plugin 0.2.0-only): hosts without the sessionProjections service
 * simply never register it, and the ring's billing section stays hidden.
 */
export function buildBillingDefinition() {
  const stateSchema = z.object({
    provider: z.string().nullable(),
    model: z.string().nullable(),
    last: z.object({ turn: z.number().int(), step: z.number().int(), ...sampleSchemaFields }).nullable(),
    turn: z.object(turnTotalsShape).nullable(),
    totals: z.object(totalsShape),
  })

  type State = {
    provider: string | null
    model: string | null
    last: (z.infer<typeof stateSchema>)['last']
    turn: (z.infer<typeof stateSchema>)['turn']
    totals: Totals
  }

  const init = (): State => ({
    provider: null,
    model: null,
    last: null,
    turn: null,
    totals: { ...EMPTY_TOTALS },
  })

  const apply = (state: State, event: any): State => {
    // 当前请求的 provider/model 跟踪
    if (event.type === 'request/header') {
      const cfg = event.data?.header?.config
      const provider = typeof cfg?.provider === 'string' && cfg.provider !== '' ? cfg.provider : state.provider
      const model = typeof cfg?.model === 'string' && cfg.model !== '' ? cfg.model : state.model
      return provider !== state.provider || model !== state.model ? { ...state, provider, model } : state
    }
    if (event.type === 'request/context') {
      const raw = event.data?.model
      const model = typeof raw === 'string' && raw !== '' ? raw : state.model
      return model !== state.model ? { ...state, model } : state
    }

    // usage 双源采样
    let turn: unknown
    let step: unknown
    let usage: any
    let sourceModel: string | undefined
    let sourceProvider: string | undefined
    if (event.type === 'assistant/chunk' && event.data?.chunk?.type === 'usage') {
      turn = event.data.turn
      step = event.data.step
      usage = event.data.chunk.usage
    } else if (event.type === 'assistant/message' && event.data?.usage !== undefined) {
      turn = event.data.turn
      step = event.data.step
      usage = event.data.usage
      const source = event.data.message?.source
      if (typeof source?.provider === 'string') sourceProvider = source.provider
      if (typeof source?.model === 'string') sourceModel = source.model
    } else {
      return state // 无关事件：同一引用，驱动以 Object.is 把关变更流
    }
    if (usage === undefined || typeof turn !== 'number' || typeof step !== 'number') return state

    const sample: Sample = {
      turn,
      step,
      inputTokens: Number(usage.inputTokens) || 0,
      cacheReadTokens: Number(usage.cacheReadTokens) || 0,
      cacheWriteTokens: Number(usage.cacheWriteTokens) || 0,
      outputTokens: Number(usage.outputTokens) || 0,
      model: sourceModel ?? state.model,
      provider: sourceProvider ?? state.provider,
      time: typeof event.time === 'number' ? event.time : Date.now(),
    }

    const prev = state.last
    // 同 step 替换样本：数据全同则引用不变
    if (
      prev !== null && prev.turn === turn && prev.step === step &&
      prev.inputTokens === sample.inputTokens &&
      prev.cacheReadTokens === sample.cacheReadTokens &&
      prev.cacheWriteTokens === sample.cacheWriteTokens &&
      prev.outputTokens === sample.outputTokens &&
      prev.model === sample.model && prev.provider === sample.provider
    ) {
      return state
    }

    const current = costOf(sample)
    const writeMiss = isWriteMiss(sample)
    const fullMiss = isFullMiss(sample)
    const input = sampleInput(sample)

    if (prev !== null && prev.turn === turn && prev.step === step) {
      // 同 step 替换：扣旧加新，轮数不变
      const old = costOf(prev)
      const prevInput = sampleInput(prev)
      const turnBase: TurnTotals =
        state.turn !== null && state.turn.id === prev.turn
          ? state.turn
          : { id: turn, hitCost: 0, missCost: 0, outputCost: 0, inputTokens: 0, cacheReadTokens: 0, outputTokens: 0 }
      return {
        ...state,
        last: sample,
        turn: {
          ...turnBase,
          id: turn,
          hitCost: turnBase.hitCost - old.hit + current.hit,
          missCost: turnBase.missCost - old.miss + current.miss,
          outputCost: turnBase.outputCost - old.output + current.output,
          inputTokens: turnBase.inputTokens - prevInput + input,
          cacheReadTokens: turnBase.cacheReadTokens - prev.cacheReadTokens + sample.cacheReadTokens,
          outputTokens: turnBase.outputTokens - prev.outputTokens + sample.outputTokens,
        },
        totals: {
          cacheHitCost: state.totals.cacheHitCost - old.hit + current.hit,
          missCost: state.totals.missCost - old.miss + current.miss,
          outputCost: state.totals.outputCost - old.output + current.output,
          inputTokens: state.totals.inputTokens - prevInput + input,
          cacheReadTokens: state.totals.cacheReadTokens - prev.cacheReadTokens + sample.cacheReadTokens,
          outputTokens: state.totals.outputTokens - prev.outputTokens + sample.outputTokens,
          rounds: state.totals.rounds,
          missSteps: state.totals.missSteps - (isWriteMiss(prev) ? 1 : 0) + (writeMiss ? 1 : 0),
          writeTokens: state.totals.writeTokens - prev.cacheWriteTokens + sample.cacheWriteTokens,
          fullMissSteps: state.totals.fullMissSteps - (isFullMiss(prev) ? 1 : 0) + (fullMiss ? 1 : 0),
        },
      }
    }

    // 新 step：同 turn 累加 / 异 turn 重置；totals 累加、轮数+1
    const sameTurn = state.turn !== null && state.turn.id === turn
    return {
      ...state,
      last: sample,
      turn: sameTurn
        ? {
            ...state.turn!,
            hitCost: state.turn!.hitCost + current.hit,
            missCost: state.turn!.missCost + current.miss,
            outputCost: state.turn!.outputCost + current.output,
            inputTokens: state.turn!.inputTokens + input,
            cacheReadTokens: state.turn!.cacheReadTokens + sample.cacheReadTokens,
            outputTokens: state.turn!.outputTokens + sample.outputTokens,
          }
        : {
            id: turn,
            hitCost: current.hit,
            missCost: current.miss,
            outputCost: current.output,
            inputTokens: input,
            cacheReadTokens: sample.cacheReadTokens,
            outputTokens: sample.outputTokens,
          },
      totals: {
        cacheHitCost: state.totals.cacheHitCost + current.hit,
        missCost: state.totals.missCost + current.miss,
        outputCost: state.totals.outputCost + current.output,
        inputTokens: state.totals.inputTokens + input,
        cacheReadTokens: state.totals.cacheReadTokens + sample.cacheReadTokens,
        outputTokens: state.totals.outputTokens + sample.outputTokens,
        rounds: state.totals.rounds + 1,
        missSteps: state.totals.missSteps + (writeMiss ? 1 : 0),
        writeTokens: state.totals.writeTokens + sample.cacheWriteTokens,
        fullMissSteps: state.totals.fullMissSteps + (fullMiss ? 1 : 0),
      },
    }
  }

  const view = (state: State) => {
    const s = state.last
    const t = state.totals
    if (s === null) {
      return {
        available: false, cost: 0, missCost: 0, outputCost: 0, currency: 'CNY' as const,
        cacheReadTokens: 0, totalInputTokens: 0, outputTokens: 0, hitRate: null,
        model: state.model, provider: state.provider, matchedModel: null, modelMatched: false,
        tier: null, unitPricePerM: null, turn: null, step: null,
        turnCost: 0, turnHitCost: 0, turnMissCost: 0, turnOutputCost: 0,
        turnTokens: 0, turnCacheReadTokens: 0, turnInputTokens: 0, turnOutputTokens: 0,
        sessionCacheHitCost: t.cacheHitCost, sessionMissCost: t.missCost, sessionOutputCost: t.outputCost,
        sessionInputTokens: t.inputTokens, sessionCacheReadTokens: t.cacheReadTokens,
        sessionOutputTokens: t.outputTokens, sessionRounds: t.rounds, sessionMissSteps: t.missSteps,
        sessionWriteTokens: t.writeTokens, sessionFullMissSteps: t.fullMissSteps,
      }
    }
    const totalInput = sampleInput(s)
    const { row, tier, matchedModel, matched } = rateOf(s.model, s.time)
    const cost = round9((s.cacheReadTokens * row.cacheHit) / 1e6)
    const missCost = round9(((s.inputTokens + s.cacheWriteTokens) * row.cacheMiss) / 1e6)
    const outputCost = round9((s.outputTokens * row.output) / 1e6)
    const turn = state.turn
    return {
      available: totalInput > 0 || s.outputTokens > 0,
      cost, missCost, outputCost,
      currency: 'CNY' as const,
      cacheReadTokens: s.cacheReadTokens,
      totalInputTokens: totalInput,
      outputTokens: s.outputTokens,
      hitRate: totalInput > 0 ? Math.round((s.cacheReadTokens / totalInput) * 1000) / 10 : null,
      model: s.model,
      provider: s.provider,
      matchedModel,
      modelMatched: matched,
      tier,
      unitPricePerM: row.cacheHit,
      turn: s.turn,
      step: s.step,
      turnCost: turn === null ? 0 : turn.hitCost + turn.missCost + turn.outputCost,
      turnHitCost: turn === null ? 0 : turn.hitCost,
      turnMissCost: turn === null ? 0 : turn.missCost,
      turnOutputCost: turn === null ? 0 : turn.outputCost,
      turnTokens: turn === null ? 0 : turn.inputTokens + turn.outputTokens,
      turnCacheReadTokens: turn === null ? 0 : turn.cacheReadTokens,
      turnInputTokens: turn === null ? 0 : turn.inputTokens,
      turnOutputTokens: turn === null ? 0 : turn.outputTokens,
      sessionCacheHitCost: t.cacheHitCost,
      sessionMissCost: t.missCost,
      sessionOutputCost: t.outputCost,
      sessionInputTokens: t.inputTokens,
      sessionCacheReadTokens: t.cacheReadTokens,
      sessionOutputTokens: t.outputTokens,
      sessionRounds: t.rounds,
      sessionMissSteps: t.missSteps,
      sessionWriteTokens: t.writeTokens,
      sessionFullMissSteps: t.fullMissSteps,
    }
  }

  const viewSchema = z.object({
    available: z.boolean(),
    cost: z.number().nonnegative(),
    missCost: z.number().nonnegative(),
    outputCost: z.number().nonnegative(),
    currency: z.literal('CNY'),
    cacheReadTokens: z.number().int().nonnegative(),
    totalInputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    hitRate: z.number().nullable(),
    model: z.string().nullable(),
    provider: z.string().nullable(),
    matchedModel: z.string().nullable(),
    modelMatched: z.boolean(),
    tier: z.enum(['peak', 'offPeak']).nullable(),
    unitPricePerM: z.number().nullable(),
    turn: z.number().int().nullable(),
    step: z.number().int().nullable(),
    turnCost: z.number().nonnegative(),
    turnHitCost: z.number().nonnegative(),
    turnMissCost: z.number().nonnegative(),
    turnOutputCost: z.number().nonnegative(),
    turnTokens: z.number().int().nonnegative(),
    turnCacheReadTokens: z.number().int().nonnegative(),
    turnInputTokens: z.number().int().nonnegative(),
    turnOutputTokens: z.number().int().nonnegative(),
    sessionCacheHitCost: z.number().nonnegative(),
    sessionMissCost: z.number().nonnegative(),
    sessionOutputCost: z.number().nonnegative(),
    sessionInputTokens: z.number().int().nonnegative(),
    sessionCacheReadTokens: z.number().int().nonnegative(),
    sessionOutputTokens: z.number().int().nonnegative(),
    sessionRounds: z.number().int().nonnegative(),
    sessionMissSteps: z.number().int().nonnegative(),
    sessionWriteTokens: z.number().int().nonnegative(),
    sessionFullMissSteps: z.number().int().nonnegative(),
  })

  return {
    key: 'tlCacheBilling',
    stateVersion: 1,
    stateSchema,
    init,
    apply,
    wire: { viewSchema, view },
  }
}
