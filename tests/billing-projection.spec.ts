import { describe, expect, it } from 'vitest'
import {
  BILLING_MODEL,
  buildBillingDefinition,
  costOf,
  isFullMiss,
  isPeakBeijing,
  isWriteMiss,
  rateOf,
  type Sample,
} from '../src/billing-projection.ts'

/** 北京时间 2026-10-12（周一，非节假日）HH:00 的 epoch ms。 */
const monday = (hour: number): number =>
  Date.UTC(2026, 9, 12, hour - 8, 0, 0) // UTC+8：北京 HH:00 = UTC hour-8

describe('isPeakBeijing — UTC+8 纯数学换算', () => {
  it('工作日峰段 09-12 / 14-18', () => {
    expect(isPeakBeijing(monday(9))).toBe(true)
    expect(isPeakBeijing(monday(11))).toBe(true)
    expect(isPeakBeijing(monday(14))).toBe(true)
    expect(isPeakBeijing(monday(17))).toBe(true)
  })

  it('工作日谷段（午休/早晚/夜间）', () => {
    expect(isPeakBeijing(monday(8))).toBe(false)
    expect(isPeakBeijing(monday(12))).toBe(false)
    expect(isPeakBeijing(monday(13))).toBe(false)
    expect(isPeakBeijing(monday(18))).toBe(false)
  })

  it('周末全天谷价', () => {
    const saturday = Date.UTC(2026, 9, 17, 2, 0, 0) // 北京周六 10:00
    expect(isPeakBeijing(saturday)).toBe(false)
  })

  it('法定节假日全天谷价（国庆 10-06，与系统时区无关）', () => {
    const holidayNoon = Date.UTC(2026, 9, 6, 2, 0, 0) // 北京 10-06 10:00
    expect(isPeakBeijing(holidayNoon)).toBe(false)
  })
})

describe('rateOf / costOf — Flash 单模型计价', () => {
  it('白名单三级匹配（精确/后缀/包含）', () => {
    for (const name of ['deepseek-flash', 'deepseek-v4.1-flash-expires-on-0910', 'DeepSeek-V4.1-Flash']) {
      expect(rateOf(name, monday(10)).matched).toBe(true)
    }
    expect(rateOf('qwen3.6-35b', monday(10)).matched).toBe(false)
  })

  it('峰谷费率行正确（谷 0.02/1/4，峰 ×2）', () => {
    expect(rateOf('deepseek-flash', monday(8)).row).toEqual(BILLING_MODEL.offPeak)
    expect(rateOf('deepseek-flash', monday(10)).row).toEqual(BILLING_MODEL.peak)
    expect(rateOf('deepseek-flash', monday(15)).row).toEqual(BILLING_MODEL.peak)
  })

  const sample: Sample = {
    turn: 1, step: 1,
    inputTokens: 291, cacheReadTokens: 247_000, cacheWriteTokens: 0, outputTokens: 97,
    model: 'deepseek-flash', provider: 'deepseek-official', time: monday(8),
  }

  it('三笔费用 round9（谷价：命中 0.02/未命中 1/输出 4 每百万）', () => {
    const { hit, miss, output } = costOf(sample)
    expect(hit).toBeCloseTo(247_000 * 0.02 / 1e6, 9)
    expect(miss).toBeCloseTo(291 * 1 / 1e6, 9)
    expect(output).toBeCloseTo(97 * 4 / 1e6, 9)
  })
})

describe('失效判定', () => {
  it('完全失效：有输入但缓存命中为 0（含首轮）', () => {
    expect(isFullMiss({ turn: 1, step: 1, inputTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 5, model: null, provider: null, time: 0 })).toBe(true)
  })

  it('有命中即非完全失效；写失效看 cacheWrite', () => {
    const hit: Sample = { turn: 1, step: 2, inputTokens: 10, cacheReadTokens: 500, cacheWriteTokens: 0, outputTokens: 1, model: null, provider: null, time: 0 }
    expect(isFullMiss(hit)).toBe(false)
    expect(isWriteMiss({ ...hit, cacheWriteTokens: 3 })).toBe(true)
    expect(isWriteMiss(hit)).toBe(false)
  })
})

describe('投影 apply — 采样/替换/聚合/失效', () => {
  const def = buildBillingDefinition()

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

  it('无关事件返回同一引用（Object.is 把关变更流）', () => {
    const state = def.init()
    expect(def.apply(state, { type: 'session/other', data: {} })).toBe(state)
  })

  it('usage 采样进 totals，rounds+1；header 跟踪 provider/model', () => {
    let state = def.apply(def.init(), header('deepseek-official', 'deepseek-flash'))
    state = def.apply(state, usageChunk(1, 1, { inputTokens: 291, cacheReadTokens: 247_000, cacheWriteTokens: 0, outputTokens: 97 }))
    expect(state.model).toBe('deepseek-flash')
    expect(state.provider).toBe('deepseek-official')
    expect(state.totals.rounds).toBe(1)
    expect(state.totals.fullMissSteps).toBe(0)
    expect(state.last?.cacheReadTokens).toBe(247_000)
  })

  it('同 step 替换：扣旧加新，rounds 不变', () => {
    let state = def.apply(def.init(), usageChunk(1, 1, { inputTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 1 }))
    const afterFirst = state.totals.rounds
    state = def.apply(state, usageChunk(1, 1, { inputTokens: 20, cacheReadTokens: 500, cacheWriteTokens: 0, outputTokens: 2 }))
    expect(state.totals.rounds).toBe(afterFirst)
    expect(state.totals.inputTokens).toBe(20 + 500)
    expect(state.last?.inputTokens).toBe(20)
  })

  it('同 step 全同样本返回原引用', () => {
    let state = def.apply(def.init(), usageChunk(1, 1, { inputTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 1 }))
    const snapshot = state
    state = def.apply(state, usageChunk(1, 1, { inputTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 1 }))
    expect(state).toBe(snapshot)
  })

  it('新 step 同 turn 累加；turn 切换重置当前轮、totals 继续累计', () => {
    let state = def.apply(def.init(), usageChunk(1, 1, { inputTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 10 }))
    state = def.apply(state, usageChunk(1, 2, { inputTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 10 }))
    expect(state.turn?.inputTokens).toBe(200)
    const sessionInput = state.totals.inputTokens
    state = def.apply(state, usageChunk(2, 1, { inputTokens: 50, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 5 }))
    expect(state.turn?.id).toBe(2)
    expect(state.turn?.inputTokens).toBe(50)
    expect(state.totals.inputTokens).toBe(sessionInput + 50)
  })

  it('完全失效计数：首轮（无缓存可命中）计入', () => {
    let state = def.apply(def.init(), usageChunk(1, 1, { inputTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 10 }))
    expect(state.totals.fullMissSteps).toBe(1)
    state = def.apply(state, usageChunk(1, 2, { inputTokens: 100, cacheReadTokens: 900, cacheWriteTokens: 0, outputTokens: 10 }))
    expect(state.totals.fullMissSteps).toBe(1)
  })

  it('view：有读数输出全字段（tier/modelMatched/三级金额与会话累计）', () => {
    let state = def.apply(def.init(), header('deepseek-official', 'deepseek-flash'))
    state = def.apply(state, usageChunk(3, 7, { inputTokens: 291, cacheReadTokens: 247_000, cacheWriteTokens: 0, outputTokens: 97 }, monday(8)))
    const view = (def.wire as { view: (s: unknown) => Record<string, unknown> }).view(state)
    expect(view.available).toBe(true)
    expect(view.currency).toBe('CNY')
    expect(view.tier).toBe('offPeak')
    expect(view.modelMatched).toBe(true)
    expect(view.matchedModel).toBe('DeepSeek-V4.1-Flash')
    expect(view.turn).toBe(3)
    expect(view.step).toBe(7)
    expect(view.sessionRounds).toBe(1)
    // wire.viewSchema 应能 parse 自己的 view（自洽）
    expect(def.wire.viewSchema.parse(view)).toEqual(view)
  })

  it('view：无读数 available=false 且会话累计为零值', () => {
    const view = (def.wire as { view: (s: unknown) => Record<string, unknown> }).view(def.init())
    expect(view.available).toBe(false)
    expect(view.sessionRounds).toBe(0)
  })
})
