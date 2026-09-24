# dsh-thinking-levels

**为 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 提供按轮次的思考档位（`reasoning_effort`）控制：在会话模型选择器中可选 `Auto`（mask）——由插件按工具调用历史自动在 `low` / `high` / `max` 间调度后提交 API；也可手动固定 `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`，让廉价工具轮次保持廉价，同时绝不让重任务缺少推理。**

> **v0.7.0-beta.1（2026-09-06）：短路路线退役。** 本版本不再依赖 `dsh-llm-openai-completions`——自定义网关修复全部改走 dsh 官方 `llm-pi-ai` compat 面（要求 **dsh ≥ v0.1.0-rc.8**），短路插件应保持卸载。详见 [CHANGELOG](./CHANGELOG.md)。

- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [安装指南](./INSTALL.zh.md)
- [English installation guide](./INSTALL.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [版本更新日志](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

> **兼容性说明：** `0.6.0` 已包含日本語（`ja`）和한국어（`ko`）字典及选择项，但当前官方 DSH 只通过 `LocaleRuntime` 提供 `zh` 和 `en`。在原版 DSH 中选择 `ja` 或 `ko` 会失败，并提示 `locale "<id>" is not registered`。需要等待官方 DSH 增加对应 locale ID 后才能正常使用。高级用户可以维护 DSH fork，在 `packages/client/locale/src/locale-settings.ts` 更新 `LOCALE_IDS`，在 `packages/client/locale/src/client/index.ts` 更新 `LOCALES` 标签，并补齐核心字典和测试，然后重新构建并运行 fork 版本。仅修改本插件无法扩展 DSH 的全局 locale 列表。

> **版本兼容：** 本版本仅支持 **DSH ≥ 0.1.7-rc.1**。DSH 0.1.7 移除了命令式设置注册（`settings.register` / `installSettingsSection`）与客户端 `settingsScope` 服务及每插件卡片槽位，旧版本线（3.0.x 及更早）依赖的表面已不存在——0.1.2–0.1.6 宿主请继续使用插件 3.0.1。3.1.0 面向 0.1.7 声明式表面：可运行时调整的配置字段在 schemastery schema 中标 `.volatile()`，设置表单由宿主按 schema 自动生成（无注册调用、无客户端设置卡片），插件按请求读取实时值（由 `loader/volatile-update` 驱动）。

在多步工具链任务中，模型在**每一次工具调用前**都会重新思考——而这个思考过程占据了绝大部分墙钟时间（一个 50 步的 agent 任务可能在工具之间花费数分钟思考）。`dsh-thinking-levels` 接入 dsh 每一步都会重新解析的 `agent/request` waterfall（以 `prepend` 置于最外层，避免被会话模型选择覆盖），向下一次模型请求注入思考档位。

## 档位

| 档位 | 含义 | 位置 |
|---|---|---|
| `off` | 关闭思考（仅手动选择，自动调度永不选用） | 模型选择器 / 默认档位 |
| `on` | 开启思考（仅 toggle 型模型）：只发 `enable_thinking`，不发 think effort | 模型选择器 / 默认档位 |
| `minimal` | 最低档（极轻任务） | 模型选择器 / 默认档位 |
| `low` | 手动低档，对应简单对话任务（廉价轮次保持廉价） | 模型选择器 / 默认档位 |
| `medium` | 中档 | 模型选择器 / 默认档位 |
| `high` | 官方默认档位 | 模型选择器 / 默认档位 |
| `xhigh` | 特高档 | 模型选择器 / 默认档位 |
| `max` | 重任务 | 模型选择器 / 默认档位 |
| `auto` | **mask**：按最近的工具调用历史逐轮调度，提交 API 前解析为具体档位 | 模型选择器（由插件注入元数据）/ 默认档位 |

线缆档位事实（对照官方 DeepSeek 文档与 dsh `llm-deepseek` 适配器核实）：deepseek-v4-flash / v4-pro 上 `low` 1:1 生效，`medium` / `xhigh` 折叠到 `high`。适配器只接受 `off | low | high | max`，其他值抛 `UNSUPPORTED_REASONING_EFFORT`——`auto` 是插件的 mask 层，永不直接发送给 API，注入前必然解析为具体线缆档位。`on` **不是** effort 档位：它只由 toggle 型模型（Qwen3.6 类）广告，且只把 `enable_thinking` 置 true——不发送 `reasoning_effort`；effort 能力模型永不广告 `on`，所以手动选 `on` 会被剥离。

## 自定义传输字段映射

对 `llm-pi-ai` 手工声明的模型，可以把每个档位映射为你网关真正接受的值（借鉴 dsh-thinking-effort）：勾选档位并填写线上值，例如 `high` → `ultra`。映射存为该模型的 `reasoningEfforts` 表——Composer 选中 `High` 时，网关实际收到 `ultra`。`off` 留空表示不发送。

> 该映射的可视化编辑器原先搭载在插件设置卡片上，DSH 0.1.7 迁移已将其移除（对应槽位不复存在）。请改为通过官方「模型」设置面编辑 `reasoningEfforts` 表——host 侧的检测与注入本就实时读取该配置。

- 官方预设：`Off / High / Max`（官方 DeepSeek 风格）
- 通用预设：`Off / Low / Medium / High`

## 模型能力守卫（v0.5.0）

插件**绝不向未声明推理能力的模型发送 `reasoning_effort`**。自定义 openai-completions 路由（如未配置 `reasoningEfforts` 的本地 Qwen3.6）通过 `ctx.llm.resolveModelInfo` 被判定为非推理模型，任何档位（继承的或调度产生的）都会被**剥离**而不是下发——dsh 的逐请求 `UNSUPPORTED_REASONING_EFFORT` 拒绝因此不会触发。不支持的字段绝不打进 API。

版本行为：

| dsh 版本 | `low` 处理 |
|---|---|
| rc.6（老） | 非原生：仅当配置 `models` 覆盖确认该档位时选择器才显示；注入展示（选择器 + 请求校验放行）后原样透传 |
| rc.7+（新） | 原生：插件既不重写也不重复注入；手动选 `low` 原样透传 |

auto 调度对支持的模型仍可选出 `low`——由上面的能力守卫负责让它远离不能接收它的模型。

## 模型选择器 Auto

会话界面模型选择器（模型旁）现在提供 **Auto** 档位（由插件注入模型目录元数据，位于线缆档位之后）：

| 模型选择器选择 | 行为 |
|---|---|
| **Auto** | 插件按工具调用历史 + 升降档开关调度，解析成 `low` / `high` / `max` 后提交 API |
| `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max` | **尊重手动选择**，插件不介入（toggle 型模型上 `on` 保持 `on`，绝不升为 effort；effort 能力模型剥离它） |
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

完整流程（profile 确认、升级、迁移、验证、排查）见 [INSTALL.zh.md](./INSTALL.zh.md)。快速开始：

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
    level: auto            # off | on | minimal | low | medium | high | xhigh | max | auto —— 会话未显式选择时的默认档位
    allowDowngrade: true   # 允许调度器降到 `high` 以下
    allowUpgrade: false    # 禁止调度器升到 `max`
  ```
- **运行时** — 插件的 `.volatile()` 配置字段（`enabled`、`level`、`allowDowngrade`、`allowUpgrade`）：DSH 0.1.7 按声明的 schema 自动生成「插件」设置表单，提交的改动以实时配置引用送达插件（`loader/volatile-update`），对下一次模型请求生效，无需重启。（`models` 仍是配置级字段：请在 profile 组合中编辑。）

按模型的 `models` 覆盖（键为 `provider/model`）用于确认自动检测结果，配置者拥有最终决定权：

```yaml
config:
  level: auto
  models:
    llm-pi-ai/Qwen3.6-35B-A3B:   # 非 effort 思考模型（思考开关 + budget）
      vision: false
      thinking: true
      efforts: false             # 永不发送 reasoning_effort（请求时剥离）
    llm-pi-ai/Qwen3.8-27B:       # effort 模型（rc.6 时代适配器没有 low）
      efforts: [low, high]       # 确认 low → 选择器展示 + 透传
```

> 对 Qwen 思考开关 + budget，请配置 **llm-pi-ai** 路由：
> `compat.thinkingFormat: qwen`（→ 线缆 `enable_thinking` + `thinking_budget`，经
> `thinkingBudgets`），或 `qwen-chat-template`（→ `chat_template_kwargs.enable_thinking`）
> 用于 Qwen3.8-27B 这类 effort 模型。

默认值：`{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false, models: {} }`。

> 语义说明：模型选择器选择优先于插件默认档位。选 `auto`（mask）→ 插件调度；选线缆档位 → 直接生效；未选择 → 使用插件的 `level` 默认档位。`allowDowngrade` / `allowUpgrade` 只约束 `auto` 调度。

## 官方 compat 面：短路工具退役（0.7.0-beta.1）

自定义网关（vLLM / LM Studio / 自建 OpenAI 兼容代理）**声明思考功能后**，本插件自动把修复写入 **dsh 官方 `llm-pi-ai` compat 面**（dsh ≥ **v0.1.0-rc.8** 引入，commit `884f7b9c41`）——不再需要 [dsh-llm-openai-completions](https://github.com/drscrewdriver/dsh-llm-openai-completions) 接管路由，短路插件应保持卸载：

- 扫描 `llm-pi-ai.providers`，识别「自定义 openai-completions 网关（`api: openai-completions` 或非官方 baseURL）**且** 任一模型（含 `modelOverrides`）声明 `reasoningEfforts` 表」的路由，自动写入：
  - 路由级 `compat.supportsDeveloperRole: false`——系统提示词按 `system` 角色发送，修复 vLLM / SGLang 的 `Unexpected message role` 400；
  - toggle 型思考模型（思考表存在、行级无 `supportsReasoningEffort`）自动补模型级 `compat.thinkingFormat: 'qwen-chat-template'`——pi-ai 发 `chat_template_kwargs.enable_thinking`（裸 vLLM 忽略顶层 `enable_thinking`）；
- 写入走官方设置通道（读 → 纯变换 → 整段 `settings.update('llm-pi-ai', …)`），dsh 的 schema 在**写入处**校验：低于 rc.8 的 dsh 会拒绝并日志告警，绝不静默错配；任何层级的显式值（true/false、已声明格式）永不覆盖；
- 触发时机：插件启动、`llm/adapters-updated`、`llm-pi-ai` 的 settings 变化——无需手动改配置；
- 响应侧的内联 `<think>` 拆分是**网关职责**：裸 vLLM 请加 `--reasoning-parser qwen3`（pi-ai 只解析 `reasoning_content` / `reasoning` / `reasoning_text`）。

# 依赖说明

插件 host 侧**不**值依赖 `@deepseek-ai/dsh-settings`——DSH 0.1.7 起不再有任何设置注册：设置表单由宿主按插件声明的 schemastery schema（`.volatile()` 字段）生成，客户端通过 dsh 运行时提供的 `configForms` 服务协作。无需在 profile 中手动安装官方包。`dependencies` 仅 `@deepseek-ai/schemastery`（随包自动安装）。

## 开发

```bash
npm run lint        # eslint（typescript-eslint flat config）
npm run typecheck   # tsc --noEmit
npm test            # vitest — 65 个测试
```

测试覆盖：档位策略（手动透传含扩展档位、`on` 钳制、auto 调度、档位校验、简单工具边界）、模型能力守卫（`reasoningEffortSupported`、`resolveEffortInjection` 剥离/透传）、会话事件解析（守卫、窗口截断、畸形记录）、配置 schema（默认值同步、越界拒绝、`models` 覆盖）、官方 compat 同步（识别、显式值尊重、身份幂等、写入处 schema 校验）。

## 许可

MIT
