/**
 * 语言守卫：硬编码中文**棘轮**（只降不升）。
 *
 * 用户诉求是"切到 ru/es 不串台"。串台的主因不是缺翻译（缺键在宿主回退链下只落
 * en），而是**硬编码绕开字典**——那种文案任何语种都显示中文。所以本测试盯的是
 * `C-ui` 计数：新增一处硬编码立刻变红，修一处则把基线手动下压。
 *
 * A-pair（`{ en, zh }` 内联双语）单列一条：上限只有 2 语，ru/es 见中文，同样不该增长。
 */
import { describe, expect, test } from 'vitest'
import { plugin, ratchet } from './_locale-guard.mjs'

const listing = (rows: Array<{ file: string; line: number; text: string }>): string =>
  rows.map((r) => `  ${r.file}:${r.line}  ${r.text}`).join('\n')

describe('locale guard (ratchet)', () => {
  test('hard-coded UI copy (C-ui) only shrinks', () => {
    const now = ratchet()
    const detail = now.cUi > now.baseline.cUi
      ? `\n新增的硬编码中文（请搬进字典，而不是下压基线）：\n${listing(now.uiRows)}`
      : ''
    if (now.cUi > now.baseline.cUi) {
      throw new Error(`${plugin}: C-ui ${now.cUi} > 基线 ${now.baseline.cUi}${detail}`)
    }
    expect(now.cUi).toBeLessThanOrEqual(now.baseline.cUi)
  })

  test('zh/en inline pairs (A-pair) only shrink', () => {
    const now = ratchet()
    const detail = now.aPair > now.baseline.aPair
      ? `\n新增的内联双语（上限 2 语，ru/es 见中文）：\n${listing(now.pairRows)}`
      : ''
    if (now.aPair > now.baseline.aPair) {
      throw new Error(`${plugin}: A-pair ${now.aPair} > 基线 ${now.baseline.aPair}${detail}`)
    }
    expect(now.aPair).toBeLessThanOrEqual(now.baseline.aPair)
  })
})