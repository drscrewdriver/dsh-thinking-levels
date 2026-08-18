# dsh-tool-turbo

**为 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 按轮次自动调节 `reasoning_effort`，缩短工具调用延迟。**

在多步工具链任务中，模型在**每一次工具调用前**都会重新思考——而这个思考过程占据了绝大部分墙钟时间（一个 50 步的 agent 任务可能在工具之间花费数分钟思考）。`dsh-tool-turbo` 观察当前步骤最近的工具调用，向下一次模型请求注入"尽可能低的合理推理档位"；一旦任务变重，再自动升回。

## 工作原理

DeepSeek API 提供三档 `reasoning_effort`（`low` / `high` / `max`，2026-08-13 上线）。dsh 在**每一步**都会通过 `agent/request` waterfall 重新解析请求配置（见 `packages/core/agent-loop/src/agent.ts`——"plugins propose the next request config"）。`dsh-tool-turbo` 接入该 waterfall：

1. **观察**：从会话中读取当前步骤最近的 `tool/call` 记录。
2. **决策**：简单、确定性工具（`write`、`read`、`grep`、`glob`、`bash`、`fs_*` 等）且载荷小 → `low`；混合/重负载 → `high`；超大载荷 → `max`（可选开启）。
3. **注入**：将决策写入该步骤下一次模型调用的 `agent/request` 配置。

长工具链保持"廉价轮次保持廉价"，同时绝不让困难轮次缺少推理。

## 安装

```bash
# 1. 克隆并安装
git clone https://github.com/Electricitysheep/dsh-tool-turbo.git
cd dsh-tool-turbo && npm install

# 2. 注册进你的 dsh profile（以 web 为例，任意 profile 均可）
#    ~/.dsh/profiles/web/package.json dependencies 增加：
#      "dsh-tool-turbo": "link:<dsh-tool-turbo 的绝对路径>"
#    ~/.dsh/profiles/web/cordis.patch.yml：
#      - insert:
#          - id: tool-turbo
#            name: dsh-tool-turbo
cd ~/.dsh/profiles/web && pnpm install

# 3. 重启 dsh web
dsh web
```

## 验证

- **真实 dsh 实例中注入器生效**（实际运行的日志）：

```
[tool-turbo] agent/request: baseline=high calls=[]                    => reasoningEffort=high
[tool-turbo] agent/request: baseline=high calls=[{"name":"write",…}] => reasoningEffort=low
```

- **6/6 单元测试**覆盖策略（`decideEffort`）：全新提示保持基线档、简单工具链降至 `low`、降档尊重用户开关、超大载荷升至 `max`（可选）、混合工具升至 `high`。
- `tsc --noEmit` 通过。

## 决策策略（纯函数，可测试）

| 最近的工具调用 | 决策 |
|---|---|
| 无（全新提示） | 保持用户选择的档位 |
| ≥75% 简单工具、小载荷、允许降档 | `low` |
| 混合 / 重工具 | `high`（允许升级时） |
| 超大载荷、允许升级 | `max` |
| 其他 | 保持用户选择的档位 |

开关（settings 命名空间规划中）：`allowDowngrade`（默认开）、`allowUpgrade`（默认关——`max` 保持保守）、`baseline`（默认 `high`）。

## 路线图

- [x] 决策核心 + waterfall 注入
- [x] 每次工具耗时遥测（host 日志）
- [ ] settings 命名空间（dsh-settings）控制开关
- [ ] 工具耗时在 UI / agent 上下文呈现
- [ ] 多 profile 安装文档（`headless` / `tui`）

## 许可

MIT
