# dsh-thinking-levels

**为 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 提供按轮次的思考档位（`reasoning_effort`）控制：`off` / `low` / `high` / `max` 四档手动固定，外加 `auto` 自动调度——让廉价工具轮次保持廉价，同时绝不让重任务缺少推理。**

[中文文档](./README.zh.md) · English

在多步工具链任务中，模型在**每一次工具调用前**都会重新思考——而这个思考过程占据了绝大部分墙钟时间（一个 50 步的 agent 任务可能在工具之间花费数分钟思考）。`dsh-thinking-levels` 接入 dsh 每一步都会重新解析的 `agent/request` waterfall，向下一次模型请求注入思考档位。

## 档位

| 档位 | 含义 |
|---|---|
| `off` | 关闭思考（仅手动选择，自动调度永不选用） |
| `low` | 手动低档，对应简单对话任务（廉价轮次保持廉价） |
| `high` | 官方默认档位 |
| `max` | 重任务 |
| `auto` | 依据最近的工具调用历史逐轮调度 |

线缆档位事实（对照官方 DeepSeek 文档与 dsh `llm-deepseek` 适配器核实）：deepseek-v4-flash / v4-pro 上 `low` 1:1 生效，`medium` / `xhigh` 折叠到 `high`。适配器只接受 `off | low | high | max`，其他值抛 `UNSUPPORTED_REASONING_EFFORT`——本插件在注入前 fail-loud 校验配置档位。

## 自动调度

中枢为 `high`（官方默认）。`auto` 只在 `low` / `high` / `max` 之间调度；永不选 `off`，且注入前必然解析为具体线缆档位。

| 最近的工具调用 | 档位 |
|---|---|
| 无（全新提示，纯对话） | `low` |
| ≥75% 简单工具、小载荷、允许降档 | `low` |
| 混合 / 重工具 | `high` |
| 超大载荷、允许升级 | `max` |

## 安装

```bash
# 1. 从 GitHub 把插件装进某个 profile（以 web 为例，任意 profile 均可）
dsh plugin --profile web add https://github.com/drscrewdriver/dsh-thinking-levels.git
#    本地路径备选（无需网络）：
#    dsh plugin --profile web add /dsh-thinking-levels 的绝对路径/

# 2. 重启 dsh web
#    （运行中的实例不会热加载新的 bundle 层）
dsh web
```

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
    level: high            # off | low | high | max | auto
    allowDowngrade: false  # 禁止调度器降到 `high` 以下
    allowUpgrade: false    # 禁止调度器升到 `max`
  ```
- **运行时** — dsh-settings 命名空间 `thinking-levels`（`level`、`allowDowngrade`、`allowUpgrade`、`enabled`）：改动对下一次模型请求生效，无需重启。

默认值：`{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false }`。

## 开发

```bash
npm run lint        # eslint（typescript-eslint flat config）
npm run typecheck   # tsc --noEmit
npm test            # vitest — 21 个测试
```

测试覆盖：档位策略（手动透传、auto 调度、档位校验、简单工具边界）、会话事件解析（守卫、窗口截断、畸形记录）、配置 schema（默认值同步、越界拒绝）。

## 许可

MIT
