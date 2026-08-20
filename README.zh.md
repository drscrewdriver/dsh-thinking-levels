# dsh-thinking-levels

**为 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 提供按轮次的思考档位（`reasoning_effort`）控制：在会话模型选择器中可选 `Auto`（mask）——由插件按工具调用历史自动在 `low` / `high` / `max` 间调度后提交 API；也可手动固定 `off` / `low` / `high` / `max`，让廉价工具轮次保持廉价，同时绝不让重任务缺少推理。**

[中文文档](./README.zh.md) · English

在多步工具链任务中，模型在**每一次工具调用前**都会重新思考——而这个思考过程占据了绝大部分墙钟时间（一个 50 步的 agent 任务可能在工具之间花费数分钟思考）。`dsh-thinking-levels` 接入 dsh 每一步都会重新解析的 `agent/request` waterfall（以 `prepend` 置于最外层，避免被会话模型选择覆盖），向下一次模型请求注入思考档位。

## 档位

| 档位 | 含义 | 位置 |
|---|---|---|
| `off` | 关闭思考（仅手动选择，自动调度永不选用） | 模型选择器 / 默认档位 |
| `low` | 手动低档，对应简单对话任务（廉价轮次保持廉价） | 模型选择器 / 默认档位 |
| `high` | 官方默认档位 | 模型选择器 / 默认档位 |
| `max` | 重任务 | 模型选择器 / 默认档位 |
| `auto` | **mask**：按最近的工具调用历史逐轮调度，提交 API 前解析为具体档位 | 模型选择器（由插件注入元数据）/ 默认档位 |

线缆档位事实（对照官方 DeepSeek 文档与 dsh `llm-deepseek` 适配器核实）：deepseek-v4-flash / v4-pro 上 `low` 1:1 生效，`medium` / `xhigh` 折叠到 `high`。适配器只接受 `off | low | high | max`，其他值抛 `UNSUPPORTED_REASONING_EFFORT`——`auto` 是插件的 mask 层，永不直接发送给 API，注入前必然解析为具体线缆档位。

## 模型选择器 Auto

会话界面模型选择器（模型旁）现在提供 **Auto** 档位（由插件注入模型目录元数据，位于 `Off / Low / High / Max` 之后）：

| 模型选择器选择 | 行为 |
|---|---|
| **Auto** | 插件按工具调用历史 + 升降档开关调度，解析成 `low` / `high` / `max` 后提交 API |
| `off` / `low` / `high` / `max` | **尊重手动选择**，插件不介入 |
| 未选择 | 使用插件的默认档位（见下） |

## 自动调度

中枢为 `high`（官方默认）。`auto` 只在 `low` / `high` / `max` 之间调度；永不选 `off`。

| 最近的工具调用 | 档位 |
|---|---|
| 无（全新提示，纯对话） | `low` |
| ≥75% 简单工具、小载荷、允许降档 | `low` |
| 混合 / 重工具 | `high` |
| 超大载荷、允许升级 | `max` |

调度策略与 [dsh-tool-turbo](https://github.com/drscrewdriver/dsh-tool-turbo) 同源（同一套简单工具白名单 / 载荷阈值 / 75% 比例规则）。

## 安装

```bash
# 1. 从 npm 把插件装进某个 profile（以 web 为例，任意 profile 均可）
#    （web profile 是 pnpm workspace root，必须带 -w）
dsh plugin --profile web add dsh-thinking-levels -w
#    GitHub 安装备选：
#    dsh plugin --profile web add https://github.com/drscrewdriver/dsh-thinking-levels.git -w
#    本地路径备选（无需网络）：
#    dsh plugin --profile web add /dsh-thinking-levels 的绝对路径/

# 2. 重启 dsh web（运行中的实例不会热加载新的 bundle 层）
dsh web
```

> 注意：dsh 运行环境使用 pnpm 11，新发布的版本会受 `minimumReleaseAge` 冷却期约束；如安装报
> `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`，在 `~/.dsh/profiles/web/pnpm-workspace.yaml` 的
> `minimumReleaseAgeExclude` 中加入对应版本即可。

手动 `link:` 注册（`dsh plugin add` 的备选方式）：

```bash
#    ~/.dsh/profiles/web/package.json dependencies 增加：
#      "dsh-thinking-levels": "link:<dsh-thinking-levels 的绝对路径>"
#    ~/.dsh/profiles/web/cordis.patch.yml：
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

## 配置

两个配置面共用同一套 schema：

- **装配层** — profile 组合中插件行的 `config:`（如 `cordis.yml`）：
  ```yaml
  config:
    level: auto            # off | low | high | max | auto —— 会话未显式选择时的默认档位
    allowDowngrade: true   # 允许调度器降到 `high` 以下
    allowUpgrade: false    # 禁止调度器升到 `max`
  ```
- **运行时** — dsh-settings 命名空间 `thinking-levels`（`level`、`allowDowngrade`、`allowUpgrade`、`enabled`）：改动对下一次模型请求生效，无需重启。设置面板（设置 → 插件 → 可配置插件）提供可视化编辑。

默认值：`{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false }`。

> 语义说明：模型选择器选择优先于插件默认档位。选 `auto`（mask）→ 插件调度；选 `off/low/high/max` → 直接生效；未选择 → 使用插件的 `level` 默认档位。`allowDowngrade` / `allowUpgrade` 只约束 `auto` 调度。

## 依赖说明

插件 host 侧**不**值依赖 `@deepseek-ai/dsh-settings`（设置注册通过 cordis 的 `settings` 服务，由 dsh 运行时提供）——无需在 profile 中手动安装官方包。`dependencies` 仅 `@deepseek-ai/schemastery`（随包自动安装）。

## 开发

```bash
npm run lint        # eslint（typescript-eslint flat config）
npm run typecheck   # tsc --noEmit
npm test            # vitest — 21 个测试
```

测试覆盖：档位策略（手动透传、auto 调度、档位校验、简单工具边界）、会话事件解析（守卫、窗口截断、畸形记录）、配置 schema（默认值同步、越界拒绝）。

## drscrewdriver DSH Plugin Family

本项目是 [drscrewdriver](https://github.com/drscrewdriver) 维护的 DSH 插件系列之一。如果这个对你有用，其他插件多半也有用：

| 插件 | 一句话描述 |
|---|---|
| [dsh-input-traffic](https://github.com/drscrewdriver/dsh-input-traffic) | DSH Web GUI 忙时输入队列：三档交通管制，拖拽重排，会话冻结 |
| **[dsh-thinking-levels](https://github.com/drscrewdriver/dsh-thinking-levels)** | 逐轮 reasoning_effort 控制：Auto 智能调度或手动固定档位 |
| [dsh-seatbelt-sandbox](https://github.com/drscrewdriver/dsh-seatbelt-sandbox) | macOS Seatbelt 沙箱适配器：libsandbox 原生 loader，接替弃用的 sandbox-exec |
| [dsh-switch-search](https://github.com/drscrewdriver/dsh-switch-search) | 侧边栏会话搜索增强：标题/内容切换，按用户/回复/工具筛选 |

## 许可

MIT

