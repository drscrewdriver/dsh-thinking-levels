/**
 * star-row 副本行为契约（S 档）：渲染 / 链接属性 / 语言切换 / 关闭态只剩链接。
 *
 * 副本本身由 `_tools/star-row/sync.mjs` 生成（漂移由 `sync.mjs --check` 把门），
 * 这里锁的是**行为**：★ 打开仓库页、隐藏才收话术、链接永留、语言按 documentElement.lang 前缀切换。
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { mountStarRow } from '../src/client/star-row-copy.ts'

/** 事件桩：副本在按钮上会 preventDefault/stopPropagation，真 DOM 恒有，桩也要给。 */
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
/** ★ 钮打开过的 URL（桌面壳里由锚点 click 触发，测试只验"去哪了"）。 */
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

beforeEach(() => {
  store.clear()
  opened.length = 0
  head.children.length = 0
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)) },
  }
})

/** 按类名在子树里找一个按钮（★ 与隐藏钮同类名规则，靠 class 区分）。 */
function buttonByClass(row: StubEl, cls: string): StubEl | undefined {
  return row.children.find((child) => child.tagName === 'button' && child.className === cls)
}

/** 触发一次点击（带最小事件对象），返回该事件以备断言。 */
function fire(button: StubEl): StubEvent {
  const event: StubEvent = {
    prevented: false,
    stopped: false,
    preventDefault() { this.prevented = true },
    stopPropagation() { this.stopped = true },
  }
  button.onclick!(event)
  return event
}

describe('star-row 副本（S 档）', () => {
  it('渲染链接 + 话术 + ★ 钮 + 隐藏钮，链接新标签页打开且 rel=noreferrer', () => {
    fakeDocument('zh-CN')
    const row = mountStarRow() as unknown as StubEl
    const flat = flatten(row)
    expect(flat).toContainEqual({ href: REPO, target: '_blank', rel: 'noreferrer' })
    expect(JSON.stringify(flat)).toContain('一颗 Star 让工具被更多人看见')
    expect(JSON.stringify(flat)).toContain('★ 留颗 Star')
    expect(buttonByClass(row, 'dsh-star-cta')).toBeDefined()
    expect(buttonByClass(row, 'dsh-star-hide')).toBeDefined()
  })

  it('话术随 documentElement.lang 切换，未知语言回落英文', () => {
    for (const [lang, probe] of [['ja', '便利でしたら'], ['ko', '유용했다면'], ['de', 'Nützlich'], ['pt', 'Achou útil']] as const) {
      fakeDocument(lang)
      expect(JSON.stringify(flatten(mountStarRow() as unknown as StubEl))).toContain(probe)
    }
    fakeDocument('xx-YY')
    expect(JSON.stringify(flatten(mountStarRow() as unknown as StubEl))).toContain('A star helps more people')
  })

  it('点 ★ 打开仓库页，不改隐藏态、不收话术', () => {
    fakeDocument('zh-CN')
    const host = new StubEl('div')
    const row = mountStarRow() as unknown as StubEl
    host.appendChild(row)
    fire(buttonByClass(row, 'dsh-star-cta')!)
    expect(opened).toContainEqual({ href: REPO, target: '_blank' })
    // 点星是「去点星」，不是「别打扰我」：话术仍在，dismissed 未写。
    expect(JSON.stringify(flatten(host))).toContain('一颗 Star 让工具被更多人看见')
    expect(store.get('dsh.star.thinking-levels.dismissed')).toBeUndefined()
  })

  it('点隐藏只收话术与钮，链接当场仍在、仓库页没被打开', () => {
    fakeDocument('zh-CN')
    const host = new StubEl('div')
    const row = mountStarRow() as unknown as StubEl
    host.appendChild(row)
    fire(buttonByClass(row, 'dsh-star-hide')!)
    const flat = flatten(host)
    expect(JSON.stringify(flat)).not.toContain('一颗 Star')
    expect(JSON.stringify(flat)).not.toContain('留颗 Star')
    expect(flat).toContainEqual({ href: REPO, target: '_blank', rel: 'noreferrer' })
    expect(opened).toHaveLength(0)
    expect(store.get('dsh.star.thinking-levels.dismissed')).toBe('1')
  })

  it('隐藏后重新渲染只剩裸链接（无话术无钮），且不再注入 S 容器', () => {
    store.set('dsh.star.thinking-levels.dismissed', '1')
    fakeDocument('zh-CN')
    const row = mountStarRow() as unknown as StubEl
    const flat = flatten(row)
    expect(row.tagName).toBe('a')
    expect(flat).toContainEqual({ href: REPO, target: '_blank', rel: 'noreferrer' })
    expect(JSON.stringify(flat)).not.toContain('一颗 Star')
    expect(JSON.stringify(flat)).not.toContain('留颗 Star')
  })
})