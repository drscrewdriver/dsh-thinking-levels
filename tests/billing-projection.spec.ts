import { describe, expect, it } from 'vitest'
import {
  billFor,
  buildBillingDefinition,
  isFullMiss,
  isPeakBeijing,
  isWriteMiss,
  type PricingSnapshot,
  type Sample,
} from '../src/billing-projection.ts'

/** 北京时间 2026-10-12（周一，非节假日）HH:00 的 epoch ms。 */
const monday = (hour: number): number =>
  Date.UTC(2026, 9, 12, hour - 8, 0, 0) // UTC+8：北京 HH:00 = UTC hour-8

const OFF: PricingSnapshot = { defaultPricing: 'off' }

/** 完整样本构造（billed 凭证占位，billFor/apply 会重算）。 */
const BILLED_ZERO = {
  hit: 0, miss: 0, output: 0, currency: 'CNY', tier: null, source: 'off',
  priced: false, catalogKey: null, catalogLabel: null, priceRow: null,
} as const

const mkSample = (over: Partial<Sample>): Sample => ({
  turn: 1, step: 1,
  inputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0,
  model: null, provider: null, time: 0, billed: BILLED_ZERO as Sample['billed'],
  ...over,
})

describe('isPeakBeijing — UTC+8 纯数学换算（含调休补班）', () => {
  it('工作日峰段 09-12 / 14-18，谷段其余', () => {
    expect(isPeakBeijing(monday(9))).toBe(true)
    expect(isPeakBeijing(monday(14))).toBe(true)
    expect(isPeakBeijing(monday(8))).toBe(false)
    expect(isPeakBeijing(monday(12))).toBe(false)
    expect(isPeakBeijing(monday(18))).toBe(false)
  })

  it('周末全天谷价；补班周末按工作日计峰；法定假日全天谷价', () => {
    expect(isPeakBeijing(Date.UTC(2026, 9, 17, 2, 0, 0))).toBe(false) // 普通周六
    expect(isPeakBeijing(Date.UTC(2026, 9, 10, 2, 0, 0))).toBe(true) // 10-10 补班 10:00
    expect(isPeakBeijing(Date.UTC(2026, 9, 10, 4, 0, 0))).toBe(false) // 同周六 12:00 午休谷
    expect(isPeakBeijing(Date.UTC(2026, 9, 6, 2, 0, 0))).toBe(false) // 10-06 假期
  })
})

describe('billFor — 折入时刻结算', () => {
  it('目录命中按事件时刻选峰谷行（round9 三笔）', () => {
    const sample = mkSample({
      inputTokens: 291, cacheReadTokens: 247_000, outputTokens: 97,
      model: 'deepseek-flash', provider: 'deepseek-official', time: monday(8),
    })
    const billed = billFor(sample, OFF)
    expect(billed).toMatchObject({ priced: true, tier: 'offPeak', currency: 'CNY', source: 'cn', catalogKey: 'deepseek-v4.1-flash' })
    expect(billed.hit).toBeCloseTo(247_000 * 0.02 / 1e6, 9)
    expect(billed.miss).toBeCloseTo(291 * 1 / 1e6, 9)
    expect(billed.output).toBeCloseTo(97 * 4 / 1e6, 9)
    expect(billed.priceRow).toEqual({ inputCacheHit: 0.02, inputMiss: 1, output: 4 })
  })

  it('目录外 + off 兜底：金额恒 0、priced=false、source=catalog-miss', () => {
    const billed = billFor(mkSample({ inputTokens: 10, outputTokens: 1, model: 'mythos-9', time: monday(10) }), OFF)
    expect(billed).toMatchObject({ hit: 0, miss: 0, output: 0, priced: false, source: 'catalog-miss' })
  })
})

describe('失效判定', () => {
  it('完全失效：有输入但缓存命中为 0（含首轮）', () => {
    expect(isFullMiss(mkSample({ inputTokens: 100, outputTokens: 5 }))).toBe(true)
  })

  it('有命中即非完全失效；写失效看 cacheWrite', () => {
    const hit = mkSample({ inputTokens: 10, cacheReadTokens: 500, outputTokens: 1 })
    expect(isFullMiss(hit)).toBe(false)
    expect(isWriteMiss({ ...hit, cacheWriteTokens: 3 })).toBe(true)
    expect(isWriteMiss(hit)).toBe(false)
  })
})

describe('投影 apply — 采样/替换/聚合/分桶（stateVersion 2）', () => {
  /** 可变快照：模拟设置热改只影响后续新账。 */
  let snap: PricingSnapshot = OFF
  const makeDef = () => buildBillingDefinition(() => snap)

  /** 快捷构造事件。 */
  const usageChunk = (turn: number, step: number, usage: Record<string, number>, time = monday(10)) => ({
    type: 'assistant/chunk',
    time,
    data: { turn, step, chunk: { type: 'usage', usage } },
  })
  const header = (provider: string, model: string) => ({
    type: 'request/header',
    time: monday(10),
    data: { header: { config: { provider, model } } },
  })

  it('定义面：key/stateVersion 钉死（bump 审计位）', () => {
    const def = makeDef()
    expect(def.key).toBe('tlCacheBilling')
    expect(def.stateVersion).toBe(2)
  })

  it('无关事件返回同一引用（Object.is 把关变更流）', () => {
    const def = makeDef()
    const state = def.init()
    expect(def.apply(state, { type: 'session/other', data: {} })).toBe(state)
  })

  it('usage 采样进 totals.counts，rounds+1；header 跟踪 provider/model；凭证落 last.billed', () => {
    const def = makeDef()
    let state = def.apply(def.init(), header('deepseek-official', 'deepseek-flash'))
    state = def.apply(state, usageChunk(1, 1, { inputTokens: 291, cacheReadTokens: 247_000, cacheWriteTokens: 0, outputTokens: 97 }))
    expect(state.model).toBe('deepseek-flash')
    expect(state.provider).toBe('deepseek-official')
    expect(state.totals.counts.rounds).toBe(1)
    expect(state.totals.counts.fullMissSteps).toBe(0)
    // 快照为 off：目录外才走兜底；deepseek-flash 在目录内，但本用例集缺省 OFF——
    // 命中条目时策略取条目地区（cn），金额应非零。
    expect(state.totals.money.CNY.hitCost).toBeGreaterThan(0)
    expect(state.last?.billed.priced).toBe(true)
    expect(state.last?.billed.source).toBe('cn')
  })

  it('同 step 替换：减 prev 凭证记录值（改价不产生负数），rounds 不变', () => {
    snap = OFF
    const def = makeDef()
    let state = def.apply(def.init(), header('router', 'mythos-9'))
    state = def.apply(def.apply(state, usageChunk(1, 1, { inputTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 1 })), { type: 'noop' })
    expect(state.totals.money.CNY.hitCost).toBe(0) // 目录外 off 入账，金额 0
    // 热改设置：custom USD 上线——替换必须「减旧记录值 0，加新算值」
    snap = { defaultPricing: 'custom', policies: { '*': { policy: 'custom', custom: { inputMiss: 5, inputCacheHit: 1, output: 5, currency: 'USD' } } } }
    state = def.apply(state, usageChunk(1, 1, { inputTokens: 20, cacheReadTokens: 500, cacheWriteTokens: 0, outputTokens: 2 }))
    expect(state.totals.counts.rounds).toBe(1)
    const usd = state.totals.money.USD
    expect(usd.hitCost).toBeGreaterThanOrEqual(0)
    expect(usd.hitCost).toBeCloseTo(state.last!.billed.hit, 12)
    expect(usd.missCost).toBeCloseTo(state.last!.billed.miss, 12)
    expect(state.totals.money.CNY.hitCost).toBe(0)
    snap = OFF
  })

  it('同 step 全同样本返回原引用', () => {
    const def = makeDef()
    let state = def.apply(def.init(), usageChunk(1, 1, { inputTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 1 }))
    const snapshot = state
    state = def.apply(state, usageChunk(1, 1, { inputTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 1 }))
    expect(state).toBe(snapshot)
  })

  it('新 step 同 turn 累加；turn 切换重置当前轮、totals 继续累计', () => {
    const def = makeDef()
    let state = def.apply(def.init(), usageChunk(1, 1, { inputTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 10 }))
    state = def.apply(state, usageChunk(1, 2, { inputTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 10 }))
    expect(state.turn?.inputTokens).toBe(200)
    const sessionInput = state.totals.counts.inputTokens
    state = def.apply(state, usageChunk(2, 1, { inputTokens: 50, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 5 }))
    expect(state.turn?.id).toBe(2)
    expect(state.turn?.inputTokens).toBe(50)
    expect(state.totals.counts.inputTokens).toBe(sessionInput + 50)
  })

  it('币种分桶：CNY 与 custom USD 并存不相加，view 报 mixedCurrency', () => {
    snap = {
      defaultPricing: 'off',
      policies: { usdrouter: { policy: 'custom', custom: { inputMiss: 1, inputCacheHit: 0.1, output: 2, currency: 'USD' } } },
    }
    const def = makeDef()
    let state = def.apply(def.init(), header('deepseek', 'deepseek-flash'))
    state = def.apply(state, usageChunk(1, 1, { inputTokens: 1_000_000, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }, monday(8)))
    // 第二笔：provider 命中 custom USD
    state = def.apply(state, header('usdrouter', 'anything'))
    state = def.apply(state, usageChunk(1, 2, { inputTokens: 1_000_000, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }, monday(8)))
    expect(state.totals.money.USD.missCost).toBeGreaterThan(0)
    const view = (def.wire as { view: (s: unknown) => Record<string, unknown> }).view(state)
    expect(view.mixedCurrency).toBe(true)
    expect(Array.isArray(view.sessionByCurrency)).toBe(true)
    expect((view.sessionByCurrency as unknown[]).length).toBe(2)
    snap = OFF
  })

  it('完全失效计数：首轮（无缓存可命中）计入', () => {
    const def = makeDef()
    let state = def.apply(def.init(), usageChunk(1, 1, { inputTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 10 }))
    expect(state.totals.counts.fullMissSteps).toBe(1)
    state = def.apply(state, usageChunk(1, 2, { inputTokens: 100, cacheReadTokens: 900, cacheWriteTokens: 0, outputTokens: 10 }))
    expect(state.totals.counts.fullMissSteps).toBe(1)
  })
})

describe('view — 四态自洽（wire.viewSchema.parse 全过）', () => {
  const usageChunk = (turn: number, step: number, usage: Record<string, number>, time: number) => ({
    type: 'assistant/chunk' as const, time, data: { turn, step, chunk: { type: 'usage', usage } },
  })

  const fold = (snap: PricingSnapshot, events: unknown[]) => {
    const def = buildBillingDefinition(() => snap)
    let state = def.init()
    for (const event of events) state = def.apply(state, event)
    return { def, state }
  }

  it('态 1：空读数 available=false，累计零值，自 parse', () => {
    const { def } = fold(OFF, [])
    const view = (def.wire as { view: (s: unknown) => Record<string, unknown> }).view(def.init())
    expect(view.available).toBe(false)
    expect(view.sessionRounds).toBe(0)
    expect(def.wire.viewSchema.parse(view)).toEqual(view)
  })

  it('态 2：cn 目录命中（峰段全字段 + deprecated 双写）', () => {
    const { def, state } = fold(
      { defaultPricing: 'cn' },
      [{ type: 'request/header', time: monday(10), data: { header: { config: { provider: 'deepseek-official', model: 'deepseek-flash' } } } },
        usageChunk(3, 7, { inputTokens: 291, cacheReadTokens: 247_000, cacheWriteTokens: 0, outputTokens: 97 }, monday(10))],
    )
    const view = (def.wire as { view: (s: unknown) => Record<string, unknown> }).view(state)
    expect(view).toMatchObject({
      available: true, currency: 'CNY', tier: 'peak', priced: true, pricingSource: 'cn',
      catalogKey: 'deepseek-v4.1-flash', matchedModel: 'DeepSeek-V4.1-Flash', modelMatched: true,
      turn: 3, step: 7, sessionRounds: 1,
    })
    expect(view.unitPricePerM).toBe(0.04)
    expect(def.wire.viewSchema.parse(view)).toEqual(view)
  })

  it('态 3：目录外 off —— priced=false、金额 0、token 读数仍在', () => {
    const { def, state } = fold(
      OFF,
      [{ type: 'request/header', time: monday(10), data: { header: { config: { provider: 'x', model: 'mythos-9' } } } },
        usageChunk(1, 1, { inputTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 5 }, monday(10))],
    )
    const view = (def.wire as { view: (s: unknown) => Record<string, unknown> }).view(state)
    expect(view).toMatchObject({ available: true, priced: false, pricingSource: 'catalog-miss', cost: 0, mixedCurrency: false })
    expect(view.sessionInputTokens).toBeGreaterThan(0)
    expect(def.wire.viewSchema.parse(view)).toEqual(view)
  })

  it('态 4：custom USD 平价 —— tier=flat、$ 口径、自 parse', () => {
    const { def, state } = fold(
      { defaultPricing: 'custom', policies: { '*': { policy: 'custom', custom: { inputMiss: 1, inputCacheHit: 0.1, output: 2, currency: 'USD' } } } },
      [usageChunk(1, 1, { inputTokens: 1_000_000, cacheReadTokens: 1_000_000, cacheWriteTokens: 0, outputTokens: 100 }, Date.UTC(2026, 9, 17, 2, 0, 0))],
    )
    const view = (def.wire as { view: (s: unknown) => Record<string, unknown> }).view(state)
    expect(view).toMatchObject({ currency: 'USD', tier: 'flat', priced: true, pricingSource: 'custom' })
    expect(view.sessionMissCost).toBeCloseTo(1, 9)
    expect(def.wire.viewSchema.parse(view)).toEqual(view)
  })
})
