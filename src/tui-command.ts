/**
 * tui-command.ts — `/think`：思考档位的 dsh-tui 终端面（宿主斜杠命令）。
 *
 * 背景：dsh-tui 不加载插件 client 半边（slider / family-tab / 设置卡都不执行），
 * 也调不到插件 RPC。HUD 里只有 permission mode，没有 reasoning effort —— 所以
 * 在 TUI 下既看不到当前档位，也没法切换。命令面把这个洞补上。
 *
 * 契约（.agents/plans/dsh-tui-faces/spec.md §3）：单行 <=100、总行 <=40、无 ANSI、
 * 写操作走 --yes、--json 单行输出。
 */

import type { Context } from '@deepseek-ai/cordis'
import { assertEffortId, isEffortId, STANDARD_LEVELS } from './thinking-level.ts'

export type CommandKind = 'success' | 'error'
export interface CommandResult { kind: CommandKind; text: string }

export interface ThinkState {
  enabled: boolean
  level: string
  allowDowngrade: boolean
  allowUpgrade: boolean
  takeover: boolean
  /** config = 组合入口的 live config；legacy-section = ≤0.1.6 注册节读取 */
  source: string
}

export interface ThinkCommandDeps {
  state(): ThinkState
  /** 写回档位；返回失败原因而不是抛错，命令层统一翻译成 next 行。 */
  write(level: string): Promise<{ ok: boolean; reason?: string }>
}

const MAX_LINES = 40
const MAX_WIDTH = 100

export function clip(text: string, width = MAX_WIDTH): string {
  const value = String(text ?? '').replace(/[\r\n]+/g, ' ').replace(/\s+$/, '')
  return value.length <= width ? value : `${value.slice(0, width - 1)}…`
}

export function renderLines(lines: string[], limit = MAX_LINES): string {
  const clipped = lines.map((line) => clip(line))
  if (clipped.length <= limit) return clipped.join('\n')
  const kept = clipped.slice(0, limit - 1)
  return [...kept, `… 还有 ${clipped.length - kept.length} 行，加 --all 查看`].join('\n')
}

const ok = (lines: string[]): CommandResult => ({ kind: 'success', text: renderLines(lines) })
const fail = (reason: string, next?: string): CommandResult =>
  ({ kind: 'error', text: renderLines([reason, ...(next ? [`  ${next}`] : [])]) })

function parse(rawInput: string): { argv: string[]; json: boolean; yes: boolean } {
  const argv: string[] = []
  let json = false
  let yes = false
  for (const token of String(rawInput ?? '').trim().split(/\s+/).filter(Boolean)) {
    if (token === '--json') json = true
    else if (token === '--yes') yes = true
    else if (!token.startsWith('--')) argv.push(token)
  }
  return { argv, json, yes }
}

const HELP = [
  'think — 思考档位（reasoning effort）的终端面',
  '  /think               当前档位与开关状态',
  `  /think <level>       ${STANDARD_LEVELS.join('|')}`,
  '  /think auto          每步自动调度',
  '  flags                --json 单行 JSON；写操作需 --yes',
  '  note                 auto 的升降由档位设置控制（allowDowngrade / allowUpgrade）',
]

/** 纯函数入口；写操作交给 deps.write（参数校验在这里完成）。 */
export async function runThinkCommand(rawInput: string, deps: ThinkCommandDeps): Promise<CommandResult> {
  const { argv, json, yes } = parse(rawInput)
  const sub = (argv[0] ?? '').trim().toLowerCase()
  const state = deps.state()

  const payload = (result: CommandResult, data: unknown): CommandResult => {
    if (!json) return result
    const body = result.kind === 'error'
      ? { ok: false, cmd: 'think', error: { message: result.text.split('\n')[0] ?? result.text } }
      : { ok: true, cmd: 'think', data }
    return { kind: result.kind, text: JSON.stringify(body) }
  }

  const snapshot = {
    enabled: state.enabled,
    level: state.level,
    auto: state.level === 'auto',
    allowDowngrade: state.allowDowngrade,
    allowUpgrade: state.allowUpgrade,
    takeover: state.takeover,
    source: state.source,
  }

  if (sub === '' || sub === 'status') {
    return payload(ok([
      `think — ${state.enabled ? state.level : 'off（插件未启用）'}`,
      `  source     ${state.source}`,
      `  schedule   auto=${state.level === 'auto' ? 'yes' : 'no'}  downgrade=${state.allowDowngrade ? 'on' : 'off'}  upgrade=${state.allowUpgrade ? 'on' : 'off'}`,
      `  takeover   ${state.takeover ? 'on' : 'off'}`,
      '  set        /think <level> --yes（或在 Desktop 设置页拖动滑杆）',
    ]), snapshot)
  }

  if (sub === 'help' || sub === '?') return payload(ok(HELP), snapshot)

  const level = sub === 'auto' ? 'auto' : sub
  if (!isEffortId(level)) {
    return payload(fail(`think: 未知档位 "${sub}"`, `next: /think ${STANDARD_LEVELS.join('|')}`), snapshot)
  }
  // 危险动作约定：写配置默认 dry，--yes 才落盘
  if (!yes) {
    return payload(ok([
      `think — dry run：将把档位从 ${state.level} 改为 ${level}`,
      '  确认后加 --yes 执行',
    ]), { ...snapshot, pending: level })
  }
  try {
    assertEffortId(level, '/think')
  } catch (error) {
    return payload(fail(`think: ${(error as Error).message}`), snapshot)
  }
  const written = await deps.write(level)
  if (!written.ok) {
    return payload(fail(`think: 写入失败：${written.reason ?? '未知原因'}`, 'next: 在 Desktop 设置页手动调整，或检查 profile 的 settings 文档'), snapshot)
  }
  return payload(ok([`think — 已切换到 ${level}`, '  下一回合生效（volatile 热更，无需重启）']), { ...snapshot, level })
}

/** 注册 `/think`：无 commands 服务时静默跳过（老线安全）。 */
export function registerThinkCommand(ctx: Context, deps: ThinkCommandDeps): void {
  const registry = (ctx as unknown as { commands?: { register(definition: unknown): unknown } }).commands
  if (!registry || typeof registry.register !== 'function') return
  registry.register({
    definitionId: 'dsh-thinking-levels',
    name: 'think',
    description: 'Thinking level console: show / set reasoning effort (off|on|minimal|low|medium|high|xhigh|max|auto)',
    input: { hint: '[<level>|auto] [--yes] [--json]' },
    handler: (invocation: { rawInput?: string }) => runThinkCommand(invocation?.rawInput ?? '', deps),
  })
}
