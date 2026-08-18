/** `thinking-levels` client dictionaries. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'thinking-levels'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'card.title': '思考档位',
  'card.description': '在模型选择器中可选 Auto（mask）：按工具调用历史自动在 low / high / max 间调度后提交 API。此处配置默认档位与调度边界。',
  'card.level': '默认档位',
  'card.level.off': 'off — 关闭思考（仅手动，永不自动选择）',
  'card.level.low': 'low — 低（简单任务，廉价轮保持廉价）',
  'card.level.high': 'high — 高（官方默认）',
  'card.level.max': 'max — 最大（重任务）',
  'card.level.auto': 'auto — 按工具历史自动调度（默认）',
  'card.enabled': '启用',
  'card.allowDowngrade': '允许降档（auto 可降至 low）',
  'card.allowUpgrade': '允许升档（auto 可升至 max）',
  'card.unavailable': '设置命名空间不可用：请确认 dsh-thinking-levels 已装配进 profile。',
  'card.readonly': '只读',
} satisfies Record<string, string>

/** English dictionary (keys mirror zh). */
export const en: Record<keyof typeof zh, string> = {
  'card.title': 'Thinking Levels',
  'card.description': 'Pick Auto in the model selector: the plugin schedules low / high / max per tool round before submitting the API effort. Here you configure the default level and scheduler bounds.',
  'card.level': 'Default level',
  'card.level.off': 'off — disable thinking (manual only, never auto-picked)',
  'card.level.low': 'low — cheap rounds stay cheap',
  'card.level.high': 'high — the official default',
  'card.level.max': 'max — heavy work',
  'card.level.auto': 'auto — schedule from tool history (default)',
  'card.enabled': 'Enabled',
  'card.allowDowngrade': 'Allow downgrade (auto may drop to low)',
  'card.allowUpgrade': 'Allow upgrade (auto may lift to max)',
  'card.unavailable': 'Settings namespace unavailable: make sure dsh-thinking-levels is assembled into this profile.',
  'card.readonly': 'Read-only',
}
