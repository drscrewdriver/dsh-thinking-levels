/**
 * star-row 副本行为契约（S 档，v2 页脚版式）。
 *
 * 副本本身由 `_tools/star-row/sync.mjs` 生成（漂移由 `sync.mjs --check` 把门），
 * 这里锁的是**行为**：一行页脚 = 版本 · 短问句 · ⭐ star · 💬 issue；
 * 点过任一链接即收敛为中性一行；链接永留；语言随 documentElement.lang 前缀切换。
 *
 * v2 与旧版的区别（2026-11-26 kit 真源改版）：不再有 ★ 胶囊按钮与 × 关闭钮，
 * 两个动作都是纯文字链接；点链接**不** preventDefault（照常跳转）后才收敛。
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { mountStarRow } from '../src/client/star-row-copy.ts'

/** 事件桩：副本在链接上挂 click，真 DOM 恒有 addEventListener，桩也要给。 */
interface StubEvent { prevented: boolean; stopped: boolean; preventDefault(): void; stopPropagation(): void }

/** 极简 DOM 桩：只实现副本用到的那几个接口，避免引 jsdom 依赖。 */
class StubEl {
  tagName: string
  children: StubEl[] = []
  attrs: Record<string, string> = {}
  dataset: Record<string, string> = {}
  parentNode: StubEl | null = null
  className = ''
  href = ''
  target = ''
  rel = ''
  type = ''
  onclick: ((event: StubEvent) => void) | null = null
  private _text = ''
  constructor(tag: string) { this.tagName = tag }
  appendChild(node: StubEl) { this.children.push(node); node.parentNode = this; return node }
  replaceChild(next: StubEl, prev: StubEl) {
    const i = this.children.indexOf(prev)
    if (i >= 0) this.children[i] = next
    next.parentNode = this
    prev.parentNode = null
    return prev
  }
  setAttribute(key: string, value: string) { this.attrs[key] = value }
  addEventListener(type: string, fn: (event: StubEvent) => void) { if (type === 'click') this.onclick = fn }
  /** 锚点 click 的桩：真 DOM 里这是打开新标签页的动作，这里只记录去了哪。 */
  click() { if (this.tagName === 'a') opened.push({ href: this.href, target: this.target }) }
  set textContent(value: string) { this._text = value }
  get textContent() { return this._text }
  get firstChild() { return this.children[0] ?? null }
  get id() { return this.attrs.id ?? '' }
  set id(value: string) { this.attrs.id = value }
}

const store = new Map<string, string>()
/** 链接被打开过的 URL（桌面壳里由锚点 click 触发，测试只验"去哪了"）。 */
const opened: Array<{ href: string; target: string }> = []
const head = new StubEl('head')

/** 造一个指定语言的文档，返回可注入的 document。 */
function fakeDocument(lang: string): Document {
  const doc = {
    documentElement: { lang },
    head,
    createElement: (tag: string) => new StubEl(tag),
    createElementNS: (_ns: string, tag: string) => new StubEl(tag),
    getElementById: (id: string) => head.children.find((node) => node.id === id) ?? null,
  }
  ;(globalThis as { document?: unknown }).document = doc
  return doc as unknown as Document
}

/** 摊平成一串可断言的值：链接属性 + 所有文本。 */
function flatten(node: StubEl, out: (string | Record<string, string>)[] = []) {
  if (node.tagName === 'a') out.push({ href: node.href, target: node.target, rel: node.rel })
  if (node.textContent) out.push(node.textContent)
  for (const child of node.children) flatten(child, out)
  return out
}

const REPO = 'https://github.com/drscrewdriver/dsh-thinking-levels'
const ISSUES = REPO + '/issues/new'

/** 按类名在子树里找一个元素（v2 的动作是链接，不是按钮）。 */
function byClass(row: StubEl, cls: string): StubEl | undefined {
  if (row.className === cls) return row
  for (const child of row.children) {
    const hit = byClass(child, cls)
    if (hit !== undefined) return hit
  }
  return undefined
}

/** 按文本找元素（⭐ / 💬 两个动作链接靠文案区分）。 */
function byText(row: StubEl, needle: string): StubEl | undefined {
  if (row.textContent.includes(needle)) return row
  for (const child of row.children) {
    const hit = byText(child, needle)
    if (hit !== undefined) return hit
  }
  return undefined
}

beforeEach(() => {
  store.clear()
  opened.length = 0
  head.children.length = 0
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)) },
    removeItem: (key: string) => { store.delete(key) },
  }
})

describe('star-row 副本（S 档 v2 页脚）', () => {
  it('渲染一行页脚：版本 · 问句 · ⭐star · 💬issue，两个动作都是新标签页链接', () => {
    fakeDocument('zh-CN')
    const row = mountStarRow() as unknown as StubEl
    expect(row.className).toBe('dsh-star-foot')
    const flat = flatten(row)
    const text = JSON.stringify(flat)
    expect(text).toContain('觉得好用？')
    expect(text).toContain('去 GitHub 点个 Star')
    expect(text).toContain('反馈建议 / 提 issue')
    // 版本徽章由 sync 从 package.json 烘入，是版本哨兵
    expect(text).toMatch(/v\d+\.\d+\.\d+/)
    // 两个动作链接都指向正确地址且新标签页打开
    expect(flat).toContainEqual({ href: REPO, target: '_blank', rel: 'noopener noreferrer' })
    expect(flat).toContainEqual({ href: ISSUES, target: '_blank', rel: 'noopener noreferrer' })
    // v2 不再有按钮式的 ★ / ×
    expect(byClass(row, 'dsh-star-cta')).toBeUndefined()
    expect(byClass(row, 'dsh-star-hide')).toBeUndefined()
  })

  it('文案随 documentElement.lang 切换，未知语言回落英文', () => {
    const cases: Array<[string, string]> = [
      ['ja', 'お役に立っていますか'],
      ['ko', '유용한가요'],
      ['de', 'Hilfreich'],
      ['pt', 'Achou útil'],
    ]
    for (const [lang, probe] of cases) {
      fakeDocument(lang)
      expect(JSON.stringify(flatten(mountStarRow() as unknown as StubEl))).toContain(probe)
    }
    fakeDocument('xx-YY')
    expect(JSON.stringify(flatten(mountStarRow() as unknown as StubEl))).toContain('Finding it useful')
  })

  it('点 ⭐ 照常跳转，随后收敛为中性一行并记住关闭态', () => {
    fakeDocument('zh-CN')
    const host = new StubEl('div')
    const row = mountStarRow() as unknown as StubEl
    host.appendChild(row)
    const star = byText(row, '去 GitHub 点个 Star')!
    star.click()                       // 真 DOM 里锚点 click 即打开新标签页
    star.onclick!({ prevented: false, stopped: false, preventDefault() {}, stopPropagation() {} })
    expect(opened).toContainEqual({ href: REPO, target: '_blank' })
    // 收敛：页脚换成中性链接行，话术不再出现
    expect(JSON.stringify(flatten(host))).not.toContain('觉得好用')
    expect(host.children[0]!.className).toBe('dsh-star-row')
    expect(store.get('dsh.star.thinking-levels.v2.dismissed')).toBe('1')
  })

  it('点 💬 issue 同样是「走过即收敛」，落地到 issues/new', () => {
    fakeDocument('zh-CN')
    const host = new StubEl('div')
    const row = mountStarRow() as unknown as StubEl
    host.appendChild(row)
    const issue = byText(row, '反馈建议')!
    issue.click()
    issue.onclick!({ prevented: false, stopped: false, preventDefault() {}, stopPropagation() {} })
    expect(opened).toContainEqual({ href: ISSUES, target: '_blank' })
    expect(host.children[0]!.className).toBe('dsh-star-row')
    expect(store.get('dsh.star.thinking-levels.v2.dismissed')).toBe('1')
  })

  it('已关闭态：直接给中性一行（无话术、无页脚容器）', () => {
    store.set('dsh.star.thinking-levels.v2.dismissed', '1')
    fakeDocument('zh-CN')
    const row = mountStarRow() as unknown as StubEl
    expect(row.tagName).toBe('a')
    expect(row.className).toBe('dsh-star-row')
    expect(row.dataset.starNs).toBe('thinking-levels')
    const flat = flatten(row)
    expect(flat).toContainEqual({ href: REPO, target: '_blank', rel: 'noreferrer' })
    expect(JSON.stringify(flat)).not.toContain('觉得好用')
    expect(JSON.stringify(flat)).not.toContain('点个 Star')
  })

  it('旧键（≤2.0.25 误写）不生效：视为未关闭并就地清除，不当成用户意图', () => {
    // 旧版把「点 ★」写成 dismissed=1，这一键是 bug 产物；读到即清、不迁值。
    store.set('dsh.star.thinking-levels.dismissed', '1')
    fakeDocument('zh-CN')
    const row = mountStarRow() as unknown as StubEl
    expect(row.className).toBe('dsh-star-foot')
    expect(store.get('dsh.star.thinking-levels.dismissed')).toBeUndefined()
    expect(store.get('dsh.star.thinking-levels.v2.dismissed')).toBeUndefined()
  })
})
