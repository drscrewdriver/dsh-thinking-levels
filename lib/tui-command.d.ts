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
import type { Context } from '@deepseek-ai/cordis';
export type CommandKind = 'success' | 'error';
export interface CommandResult {
    kind: CommandKind;
    text: string;
}
export interface ThinkState {
    enabled: boolean;
    level: string;
    allowDowngrade: boolean;
    allowUpgrade: boolean;
    takeover: boolean;
    /** config = 组合入口的 live config；legacy-section = ≤0.1.6 注册节读取 */
    source: string;
}
export interface ThinkCommandDeps {
    state(): ThinkState;
    /** 写回档位；返回失败原因而不是抛错，命令层统一翻译成 next 行。 */
    write(level: string): Promise<{
        ok: boolean;
        reason?: string;
    }>;
}
export declare function clip(text: string, width?: number): string;
export declare function renderLines(lines: string[], limit?: number): string;
/** 纯函数入口；写操作交给 deps.write（参数校验在这里完成）。 */
export declare function runThinkCommand(rawInput: string, deps: ThinkCommandDeps): Promise<CommandResult>;
/** 注册 `/think`：无 commands 服务时静默跳过（老线安全）。 */
export declare function registerThinkCommand(ctx: Context, deps: ThinkCommandDeps): void;
