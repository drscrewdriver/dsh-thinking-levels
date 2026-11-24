/**
 * 语言守卫核心：AST 扫描客户端半边里**硬编码的 CJK 文案**并分三档。
 *
 *   class A-pair : 位于 `{ en: '…', zh: '…' }` 配对结构内 —— 已是双语，但上限只有
 *                  2 语，ru/es 等语种看到的是中文
 *   class B-log  : 在 console.* / logger.* 调用内 —— 开发者日志，**不该**本地化，不计缺陷
 *   class C-ui   : 其余（JSX 文本、UI 字面量、模板串）—— 真缺陷：任何非 zh 语种都见中文
 *
 * 为什么用 AST 而不是正则：正则漏非空断言 `!`、可选链与跨行字面量（tidy-display
 * `locale.register!(…)` 实证过漏判）；各插件已有 typescript 依赖，用
 * `createSourceFile` 即可，零新依赖。
 *
 * 守卫形式是**棘轮**（count 只降不升）：可以分批修、每批下压基线，不阻塞其它工作；
 * 新增一行硬编码立刻变红。基线见同目录 `_locale-baseline.json`。
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

/** 本模块位于 `<plugin>/tests/`，插件根即上一级。 */
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** 插件名（取自 package.json），也是基线表里的键。 */
export const plugin = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).name

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/
const SKIP_DIRS = new Set(['node_modules', 'dist', 'lib', 'coverage', '.git', 'tests', 'test', 'scripts'])
const LOG_CALLS = new Set(['console', 'logger', 'warn', 'info', 'error', 'debug', 'log', 'trace'])
/** 已走字典的调用：其（非字面量）实参不算硬编码。 */
const KEY_FUNCS = new Set(['tr', 't', 'translate', '$t'])

let cachedTs
function typescript() {
  if (cachedTs !== undefined) return cachedTs
  cachedTs = createRequire(path.join(root, 'package.json'))('typescript')
  return cachedTs
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue
      walk(p, out)
    } else if (/\.(ts|tsx)$/.test(ent.name) && !/\.d\.ts$/.test(ent.name)) out.push(p)
  }
  return out
}

/** 客户端半边的源码根：单包布局或 `packages/<pkg>/src/client` 的 monorepo 布局。 */
export function clientRoots() {
  const roots = []
  for (const c of ['src/client', 'client/src']) {
    const p = path.join(root, c)
    if (fs.existsSync(p)) roots.push(p)
  }
  const packages = path.join(root, 'packages')
  if (fs.existsSync(packages)) {
    for (const name of fs.readdirSync(packages)) {
      const p = path.join(packages, name, 'src/client')
      if (fs.existsSync(p)) roots.push(p)
    }
  }
  return roots
}

/** 字典自身不参与统计（它就是译文所在处）。 */
function isDictionary(file) {
  const base = path.basename(file).toLowerCase()
  const rel = file.replace(/\\/g, '/').toLowerCase()
  return base === 'locales.ts' || base === 'copy.ts' || base.includes('i18n')
    || base.includes('locale') || rel.includes('/locales/')
}

const relOf = (file) => path.relative(root, file).replace(/\\/g, '/')

/** 收集一处文件内的 CJK 文案行。 */
function scanFile(file) {
  const T = typescript()
  const src = fs.readFileSync(file, 'utf8')
  if (!CJK.test(src)) return []
  const sf = T.createSourceFile(file, src, T.ScriptTarget.Latest, true,
    file.endsWith('.tsx') ? T.ScriptKind.TSX : T.ScriptKind.TS)
  const rows = []
  const visit = (node, ctx) => {
    const next = { ...ctx }
    if (T.isCallExpression(node)) {
      const callee = node.expression
      const name = T.isPropertyAccessExpression(callee) ? callee.name.text
        : T.isIdentifier(callee) ? callee.text : ''
      if (LOG_CALLS.has(name)) next.inLog = true
      if (KEY_FUNCS.has(name)) next.keyed = true
    }
    if (T.isObjectLiteralExpression(node)) {
      const names = new Set()
      for (const p of node.properties) {
        if (!T.isPropertyAssignment(p)) continue
        const n = T.isIdentifier(p.name) ? p.name.text : T.isStringLiteral(p.name) ? p.name.text : ''
        if (n) names.add(n)
      }
      if (names.has('en') && names.has('zh')) next.inPair = true
    }
    let text = null
    if (T.isStringLiteral(node) || T.isNoSubstitutionTemplateLiteral(node)) text = node.text
    else if (T.isJsxText(node)) text = node.getText(sf)
    else if (T.isTemplateHead(node) || T.isTemplateMiddle(node) || T.isTemplateTail(node)) text = node.text
    if (text !== null && CJK.test(text)) {
      const trimmed = text.trim()
      if (trimmed && !next.keyed) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
        rows.push({
          file: relOf(file),
          line: line + 1,
          cls: next.inLog ? 'B-log' : next.inPair ? 'A-pair' : 'C-ui',
          text: trimmed.replace(/\s+/g, ' ').slice(0, 120),
        })
      }
    }
    T.forEachChild(node, (child) => visit(child, next))
  }
  visit(sf, { inLog: false, inPair: false, keyed: false })
  return rows
}

/** 全部命中（未剔白名单），按 cls 分档。 */
export function scan() {
  const rows = []
  for (const dir of clientRoots()) {
    for (const file of walk(dir)) {
      if (isDictionary(file)) continue
      rows.push(...scanFile(file))
    }
  }
  return {
    rows,
    pair: rows.filter((r) => r.cls === 'A-pair'),
    log: rows.filter((r) => r.cls === 'B-log'),
    ui: rows.filter((r) => r.cls === 'C-ui'),
  }
}

/**
 * 白名单命中判定：同一文件 + 文案片段包含即算（行号会漂，片段不会）；
 * 只给 `file` 不给 `text` 表示整文件豁免（引导组件的 zh/en 对照是整块刻意独立）。
 */
export function isWhitelisted(row, whitelist) {
  return whitelist.some((w) => w.file === row.file && (w.text === undefined || row.text.includes(w.text)))
}

/** 基线表位置：多数仓是 `tests/`，perm-gate 的测试目录叫 `test/`。 */
function baselineFile() {
  for (const dir of ['tests', 'test']) {
    const p = path.join(root, dir, '_locale-baseline.json')
    if (fs.existsSync(p)) return p
  }
  throw new Error('locale baseline not found (tests/ or test/)')
}

/** 读同目录基线：`{ <plugin>: { cUi, aPair, keys, whitelist } }`。 */
export function readBaseline(name) {
  const all = JSON.parse(fs.readFileSync(baselineFile(), 'utf8'))
  const own = all[name]
  if (own === undefined) throw new Error(`baseline has no entry for ${name}`)
  return own
}

/** 剔除白名单后的棘轮计数（同一条硬编码只在其片段命中时剔除）。 */
export function ratchet(name = plugin) {
  const baseline = readBaseline(name)
  const all = scan()
  const keys = keySetOf(baseline)
  const ui = all.ui.filter((r) => !isWhitelisted(r, baseline.whitelist) && !keys.has(r.text))
  const pair = all.pair.filter((r) => !isWhitelisted(r, baseline.whitelist))
  return {
    plugin: name,
    baseline,
    cUi: ui.length,
    aPair: pair.length,
    uiRows: ui,
    pairRows: pair,
    keyed: (r) => keys.has(r.text),
  }
}

/**
 * key=zh 插件的字典键集（`baseline.keysFrom` 指向 `locales/keys.json`）。
 *
 * 这类插件的字典就是「中文原文 → 译文」表，所以界面里的中文字面量**本身就是键**：
 * 它后面必然接 `tr(...)` 才上屏。把它们计作缺陷只会把基线抬成噪声，真正的回归信号是
 * 「出现了字典里没有的中文」（那种才永远翻不出去）。无 `keysFrom` 的插件（slug 键）
 * 返回空集，一字中文字面量都算缺陷。
 */
function keySetOf(baseline) {
  if (typeof baseline.keysFrom !== 'string') return new Set()
  const file = path.join(root, baseline.keysFrom)
  if (!fs.existsSync(file)) return new Set()
  return new Set(JSON.parse(fs.readFileSync(file, 'utf8')))
}