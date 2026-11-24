/** `_locale-guard.mjs` 的类型声明（JS 核心模块 + TS 测试的分界）。 */

export interface GuardRow {
  /** 相对插件根的路径，正斜杠。 */
  file: string
  /** 1 基行号。 */
  line: number
  /** A-pair（zh/en 配对）| B-log（日志）| C-ui（真缺陷）。 */
  cls: 'A-pair' | 'B-log' | 'C-ui'
  /** 归一化后的文案片段（≤120 字）。 */
  text: string
}

export interface WhitelistEntry {
  file: string
  text: string
  reason?: string
}

export interface BaselineEntry {
  cUi: number
  aPair: number
  bLog: number
  keys: Record<string, number>
  whitelist: WhitelistEntry[]
}

export interface RatchetResult {
  plugin: string
  baseline: BaselineEntry
  cUi: number
  aPair: number
  uiRows: GuardRow[]
  pairRows: GuardRow[]
}

export declare const root: string
export declare const plugin: string
export declare function clientRoots(): string[]
export declare function scan(): { rows: GuardRow[]; pair: GuardRow[]; log: GuardRow[]; ui: GuardRow[] }
export declare function isWhitelisted(row: GuardRow, whitelist: WhitelistEntry[]): boolean
export declare function readBaseline(plugin: string): BaselineEntry
export declare function ratchet(name?: string): RatchetResult