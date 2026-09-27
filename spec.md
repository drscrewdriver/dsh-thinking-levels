# Spec: 模型面板 effort 接入 + 深色模式适配（3.4.2 → 3.4.3）

> 前置:3.4.2 已修复座位接管(延迟注入补声明 `sessions`/`remote`/`remote.session`,
> `directoryFor` 防护降级),实机确认面板已顶掉官方选择器(HMR 热生效)。
> 本轮补齐官方弹层原有而面板尚未覆盖的两块:推理等级(effort)选择、深色主题适配。

## 需求
1. **effort 接入**(与官方 ModelSelect 语义对齐):
   - 触发器在模型名旁显示当前生效档位徽章;生效值 = `current.reasoningEffort ?? 当前模型 reasoning.defaultEffort`。
   - 每条声明了 `reasoning` 的模型线提供档位下拉:「提供方默认」+ `reasoning.efforts[]` 各档(显示 `level.name`,提交 `level.id`)。
   - 选择经 `directory.select({provider, model, reasoningEffort?})` 写入会话;「提供方默认」**省略** `reasoningEffort` 字段(与官方 submit 一致:缺省即回到提供方默认)。
   - 回归红线:模型切换、context window 徽章编辑、popup 开合行为不变。
2. **深色模式适配**:面板所有颜色改用宿主真实主题 token(定义在 `body`,随 `data-ds-dark-theme` 翻转),亮暗两套主题目视正确。

## 技术方案

### A. effort(src/client/model-panel.tsx + src/client/locales.ts)
1. 触发器:`triggerName` 后加 `triggerEffort` span(tertiary 色、省略号,对齐官方 `triggerEffort` 形态):
   ```tsx
   const currentReasoning = current?.model.reasoning
   const effectiveEffort = state.current?.reasoningEffort ?? currentReasoning?.defaultEffort
   const effortLabel = currentReasoning === undefined ? undefined
     : effectiveEffort === undefined ? t('input.effort.default')
     : currentReasoning.efforts.find(l => l.id === effectiveEffort)?.name ?? effectiveEffort
   ```
2. 模型线重构:行容器 flex 化 —— [选择按钮(flex:1,名称/描述/✓)] [effort `<select>`(仅 `model.reasoning` 存在时)] [window chip(**移出**按钮成兄弟节点)]。消除 button 内嵌套交互元素(chip 原本嵌在行按钮里,select 再嵌即非法)。
3. `chooseEffort(provider, model, effort | undefined)`:`busy || directory === undefined` 时忽略;调用 `directory.select({provider, model, ...(effort === undefined ? {} : {reasoningEffort: effort})})`;期间 `busy` 禁用该行全部控件。
4. select 展示值:激活线 = 生效值;非激活线 = `defaultEffort`;`value=""` 表「提供方默认」。`onChange` 时 `event.stopPropagation()` 后提交。
5. 新 locale key ×4 语言:`input.effort.title`(思考强度 / Reasoning effort / 思考レベル / 추론 강도)、`input.effort.default`(提供方默认 / Provider default / プロバイダーの既定 / 공급자 기본값)。

### B. 深色适配(src/client/model-panel.tsx 样式区)
臆造 token → 宿主真实 token(实测翻转值):
| 旧(宿主未定义,永远走亮色 fallback) | 新 token | 亮 | 暗 |
|---|---|---|---|
| `--dsw-alias-bg-surface` | `--dsw-alias-bg-layer-1` | `#f8faffb8` | `#121f43e6` |
| `--dsw-alias-danger` | `--dsw-alias-state-error-primary` | `#ec1313` | `#f25a5a` |
| `--dsw-alias-danger-weak` | `--dsw-alias-interactive-bg-hover-danger` | `#ec13130d` | 随主题翻转 |

保留并已验证两套主题均翻转:`--dsw-alias-bg-layer-3`(弹层底)、`--dsw-alias-border-l2`、`--dsw-alias-label-primary/secondary/tertiary`、`--dsw-alias-state-business-primary`。
- 删除颜色 fallback 的硬编码亮色(`#fff`、`#e5484d`、`rgba(229,72,77,.10)`、`rgba(77,107,254,.10)`),fallback 用 `transparent` 或删除;弹层 `boxShadow` 保持中性黑(两主题通用)。
- `--ds-font-family-code` 在 `:root` 已定义,不动。

### C. 版本与部署
- package.json + dsh.plugin.json → `3.4.3`;`npm run typecheck && npx vitest run && npm run build`;产物同步 `~/.dsh/profiles/web/node_modules/dsh-thinking-levels`(服务端 HMR 自动热载;若 `rev` 未变则重启 web 进程)。

## 决策记录
| 选项 | 选择 | 理由 |
|------|------|------|
| effort UI:每模型线下拉 vs 官方式「当前模型档位行列表」 | 每模型线下拉 | 面板是多模型分线布局;官方档位行是它单列布局的产物,照搬会在 320px 弹层里挤压 window 徽章。下拉让任意模型可先设档,功能是官方超集 |
| 下拉用原生 `<select>` | 是 | inline-style 约束(无 CSS 文件)下唯一免样式弹层的控件;官方菜单原语不可复用(client bundle 纯洁性) |
| 深色适配:宿主 token vs `prefers-color-scheme` 自建 | 宿主 token | 主题由 body `data-ds-dark-theme` 驱动(含第三方皮肤如 maid-atelier),跟随宿主才与页面同色系;media query 检测会和皮肤冲突 |
| chip/select 移出行按钮 | 是 | `<button>` 内嵌交互元素非法且点击行为不可靠;顺带修复现有 chip 的非法嵌套 |

## 约束
- client bundle 纯洁性:不 value-import `@deepseek-ai/*`,只走 cordis 服务与 slot(现状不变)。
- inline styles,无 CSS 文件/模块;不新增 npm 依赖。
- 验证环境:`~/.dsh/profiles/web`(DSH 0.1.7-rc.2;`llm-deepseek` 未装配,官方 DeepSeek 分支只做不崩溃回归,写入目标以 `llm-pi-ai` 网关模型为准)。
