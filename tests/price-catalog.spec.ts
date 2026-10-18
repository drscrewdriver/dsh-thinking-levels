import { describe, expect, it } from 'vitest'
import { findEntry, resolveRate, isPeakBeijing, isWorkdayBeijing, PRICE_CATALOG, CATALOG_VERSION, type PricingSnapshot } from '../src/price-catalog.ts'

/** 北京时间 2026-10-12（周一，非节假日）HH:00 的 epoch ms。 */
const monday = (hour: number): number => Date.UTC(2026, 9, 12, hour - 8, 0, 0)

const OFF: PricingSnapshot = { defaultPricing: 'off' }

describe('目录数据完整性（golden）', () => {
  it('版本与复核标注齐全：每条目都有 asOf/source，aliases 非空', () => {
    expect(CATALOG_VERSION).toBe(2)
    for (const entry of PRICE_CATALOG) {
      expect(entry.aliases.length).toBeGreaterThan(0)
      expect(entry.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(entry.source.length).toBeGreaterThan(0)
    }
  })

  it('海外 USD 行已补录（2026-10-18）：global 条目均带 asOf/source，且无 cn 行', () => {
    const globals = PRICE_CATALOG.filter((e) => e.global !== undefined)
    expect(globals.length).toBe(11)
    for (const entry of globals) {
      expect(entry.cn).toBeUndefined()
      expect(entry.asOf).toBe('2026-10-18')
      expect(entry.source.length).toBeGreaterThan(0)
    }
  })

  it('golden：海外 USD 行钉死（防手滑改价）', () => {
    expect(findEntry('claude-sonnet-5.5')?.global).toEqual({ flat: { inputCacheHit: 0.1, inputMiss: 2, output: 10 } })
    expect(findEntry('claude-opus-5.5')?.global).toEqual({ flat: { inputCacheHit: 0.2, inputMiss: 4, output: 20 } })
    expect(findEntry('gpt-6.1-sol')?.global).toEqual({ flat: { inputCacheHit: 0.1, inputMiss: 2, output: 10 } })
    expect(findEntry('gpt-6-luna')?.global).toEqual({ flat: { inputCacheHit: 0.01, inputMiss: 0.1, output: 0.5 } })
    expect(findEntry('gemini-4-argon')?.global).toEqual({ flat: { inputCacheHit: 0.1, inputMiss: 2, output: 10 } })
  })

  it('USD 目录命中（无显式策略）→ 条目自身地区取 global，实价入账非估算', () => {
    const r = resolveRate('claude-sonnet-5.5', 'anthropic', monday(10), { defaultPricing: 'estimate' })
    expect(r).toMatchObject({ priced: true, estimated: false, source: 'global', currency: 'USD' })
    expect(r.row).toEqual({ inputCacheHit: 0.1, inputMiss: 2, output: 10 })
  })

  it('golden：DeepSeek 峰谷行钉死（防手滑改价）', () => {
    const flash = findEntry('deepseek-v4.1-flash')
    expect(flash?.cn).toEqual({
      peak: { inputCacheHit: 0.04, inputMiss: 2, output: 8 },
      offPeak: { inputCacheHit: 0.02, inputMiss: 1, output: 4 },
    })
    const v4 = findEntry('deepseek-v4-flash')
    expect(v4?.cn).toEqual({
      peak: { inputCacheHit: 0.1, inputMiss: 3, output: 9 },
      offPeak: { inputCacheHit: 0.05, inputMiss: 1.5, output: 4.5 },
    })
    expect(findEntry('qwen3-max')?.cn).toEqual({ flat: { inputCacheHit: 0.5, inputMiss: 2.5, output: 10 } })
  })
})

describe('findEntry — 全目录三级匹配', () => {
  it('精确 > 最长后缀 > 最长包含', () => {
    expect(findEntry('deepseek-v4.1-flash')?.key).toBe('deepseek-v4.1-flash')
    expect(findEntry('proxy/deepseek-v4.1-flash-expires-0910')?.key).toBe('deepseek-v4.1-flash')
    // v4-flash-vision-exp 归 v4-flash（最长别名优先，不归 v4.1 的 contains）
    expect(findEntry('deepseek-v4-flash-vision-exp')?.key).toBe('deepseek-v4-flash')
    expect(findEntry('glm-5.2x')?.key).toBe('glm-5.2')
    expect(findEntry('qwen3-plus-2027')?.key).toBe('qwen3-plus')
    expect(findEntry(null)).toBeNull()
    expect(findEntry('  ')).toBeNull()
    expect(findEntry('mythos-9-x')).toBeNull()
  })
})

describe('isPeakBeijing / isWorkdayBeijing — 修正表定乾坤', () => {
  it('工作日峰段与谷段', () => {
    expect(isPeakBeijing(monday(9))).toBe(true)
    expect(isPeakBeijing(monday(17))).toBe(true)
    expect(isPeakBeijing(monday(8))).toBe(false)
    expect(isPeakBeijing(monday(12))).toBe(false)
    expect(isPeakBeijing(monday(18))).toBe(false)
  })

  it('调休补班周末按工作日判峰；法定假日全天非峰', () => {
    expect(isPeakBeijing(Date.UTC(2026, 9, 10, 2, 0, 0))).toBe(true) // 10-10 周六补班 10:00
    expect(isPeakBeijing(Date.UTC(2026, 0, 4, 6, 0, 0))).toBe(true) // 01-04 周日补班 14:00
    expect(isPeakBeijing(Date.UTC(2026, 9, 6, 2, 0, 0))).toBe(false) // 10-06 假期
    expect(isPeakBeijing(Date.UTC(2026, 4, 4, 2, 0, 0))).toBe(false) // 05-04 假内工作日
  })

  it('自然周末非峰；表外年份退化只认周末（已知降级）', () => {
    expect(isPeakBeijing(Date.UTC(2026, 9, 17, 2, 0, 0))).toBe(false) // 普通周六
    // 2027-01-04（周一，表外年）按工作日规则入峰——2027 表待公告后补录
    const weekday2027 = Date.UTC(2027, 0, 4, 2, 0, 0)
    const shifted = new Date(weekday2027 + 8 * 3600 * 1000)
    expect(isWorkdayBeijing(shifted, '2027-01-04')).toBe(true)
    expect(isPeakBeijing(weekday2027)).toBe(true)
  })
})

describe('resolveRate — 策略优先与兜底', () => {
  it('目录命中默认按条目地区（cn 优先）', () => {
    const hit = resolveRate('deepseek-flash', 'p', monday(10), OFF)
    expect(hit).toMatchObject({ tier: 'peak', currency: 'CNY', source: 'cn', priced: true })
    expect(hit.row).toEqual({ inputCacheHit: 0.04, inputMiss: 2, output: 8 })
  })

  it('平价条目 tier=flat', () => {
    const flat = resolveRate('glm-4.7', 'p', monday(10), OFF)
    expect(flat).toMatchObject({ tier: 'flat', currency: 'CNY', source: 'cn', priced: true })
  })

  it('目录外 + 缺省 off → 不计价且 source=catalog-miss（缺省路径标记）', () => {
    const miss = resolveRate('mythos-9', 'p', monday(10), OFF)
    expect(miss).toMatchObject({ row: null, priced: false, estimated: false, source: 'catalog-miss', entry: null })
  })

  it('显式 off 策略（非缺省）→ source=off 不计价', () => {
    const off = resolveRate('mythos-9', 'p', monday(10), { defaultPricing: 'estimate', policies: { '*': { policy: 'off' } } })
    expect(off).toMatchObject({ row: null, priced: false, estimated: false, source: 'off' })
  })

  it('目录外 + 缺省 estimate → 典型价兜底估算，estimated=true 且 source=catalog-miss', () => {
    const est = resolveRate('mythos-9', 'p', monday(10), { defaultPricing: 'estimate' })
    expect(est).toMatchObject({ priced: true, estimated: true, tier: 'flat', currency: 'CNY', source: 'catalog-miss', entry: null })
    expect(est.row).toEqual({ inputCacheHit: 0.02, inputMiss: 1, output: 4 })
  })

  it('目录外 + defaultPricing=cn（选了校准档）→ 仍取兜底典型价，标 estimated', () => {
    const miss = resolveRate('mythos-9', 'p', monday(10), { defaultPricing: 'cn' })
    expect(miss).toMatchObject({ priced: true, estimated: true, source: 'catalog-miss', currency: 'CNY' })
  })

  it('显式 estimate 策略命中目录外 → source=estimate（非缺省路径）', () => {
    const est = resolveRate('mythos-9', 'p', monday(10), { defaultPricing: 'off', policies: { '*': { policy: 'estimate' } } })
    expect(est).toMatchObject({ priced: true, estimated: true, source: 'estimate' })
  })

  it('目录外 + custom 无自填行 → 仍不计价（不拿兜底冒充自填价）', () => {
    const bare = resolveRate('mythos-9', 'p', monday(10), { defaultPricing: 'off', policies: { '*': { policy: 'custom' } } })
    expect(bare).toMatchObject({ row: null, priced: false, estimated: false, source: 'custom' })
  })

  it('策略 key 特异性 provider/model > model > provider > *', () => {
    const snapshot: PricingSnapshot = {
      defaultPricing: 'off',
      policies: {
        '*': { policy: 'cn' },
        deepseek: { policy: 'off' },
        'deepseek/deepseek-flash': { policy: 'custom', custom: { inputMiss: 1, inputCacheHit: 0.1, output: 2, currency: 'USD' } },
      },
    }
    expect(resolveRate('deepseek-flash', 'deepseek', monday(10), snapshot)).toMatchObject({ source: 'custom', currency: 'USD', priced: true })
    expect(resolveRate('deepseek-chat', 'deepseek', monday(10), snapshot).source).toBe('off')
    expect(resolveRate('glm-5', 'zhipu', monday(10), snapshot).source).toBe('cn')
  })

  it('custom 无自填行 → priced=false；整行替换不与目录价混合', () => {
    const bare = resolveRate('deepseek-flash', 'p', monday(10), { defaultPricing: 'off', policies: { '*': { policy: 'custom' } } })
    expect(bare).toMatchObject({ row: null, priced: false, source: 'custom' })
  })

  it('global 档有条目但无 USD 行（留空期）→ priced=false 但 source 记 global，不回退兜底', () => {
    const g = resolveRate('glm-5', 'p', monday(10), { defaultPricing: 'off', policies: { 'glm-5': { policy: 'global' } } })
    expect(g).toMatchObject({ priced: false, estimated: false, source: 'global', row: null })
  })

  it('目录内命中恒 estimated=false（兜底不冒充目录价）', () => {
    const hit = resolveRate('deepseek-flash', 'p', monday(10), { defaultPricing: 'estimate' })
    expect(hit).toMatchObject({ priced: true, estimated: false, source: 'cn' })
  })
})
