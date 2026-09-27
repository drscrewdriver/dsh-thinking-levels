# Tasks — 模型面板 effort 接入 + 深色适配（3.4.3）

## Phase 1: effort 接入（src/client）
- [x] task_1: `src/client/locales.ts` 四语各加 `input.effort.title`、`input.effort.default`(文案见 spec §A.5)
- [x] task_2: `src/client/model-panel.tsx` 触发器 effort 徽章:`current` memo 后计算 `effectiveEffort`/`effortLabel`(spec §A.1),渲染 `triggerEffort` span(新样式:tertiary 色、省略号、`flex: 0 0 auto`)
- [x] task_3: `src/client/model-panel.tsx` 模型行重构:行容器 `div`(flex, gap 6, padding `6px 8px 6px 18px`)承载 [行按钮(flex:1, 名称/描述/✓)] [effort select] [window chip 移出按钮];chip 的 onClick/onKeyDown/title/aria 原样迁移
- [x] task_4: `src/client/model-panel.tsx` 新增 `chooseEffort(provider, model, effort | undefined)`(spec §A.3)+ 新样式 `selectStyle`(chip 同族、`colorScheme: "dark light"`);select `value` = 激活线生效值 ?? 非激活线 defaultEffort ?? `""`
- [x] task_5: 回归自查:chooseModel/close/backdrop 不受重构影响;busy 禁用 select

## Phase 2: 深色适配（src/client/model-panel.tsx 样式区）
- [x] task_6: token 替换(spec §B 表):`bg-surface`→`bg-layer-1`(triggerStyle/chipStyle/chipDisabledStyle/editorRowStyle/inputStyle 的 background)、`danger`→`state-error-primary`(errorStyle)、`danger-weak`→`interactive-bg-hover-danger`(errorBannerStyle)
- [x] task_7: 删硬编码亮色 fallback:`#fff`、`rgba(127,127,127,0.05)`(popStyle 背景改纯 `var(--dsw-alias-bg-layer-3)`)、`#e5484d`、`rgba(229,72,77,0.10)`、`rgba(77,107,254,0.10)`(modelRowActiveStyle 改 `var(--dsw-alias-state-business-primary-weak, transparent)`,若该 token 未定义则用 `--dsw-alias-interactive-bg-hover`);复核全部 `var()` 引用无臆造名残留

## Phase 3: 构建与部署
- [x] task_8: `npx tsc --noEmit` + `npx vitest run` + `npm run build` 全绿;版本 → 3.4.3(package.json + dsh.plugin.json)
- [x] task_9: 同步 `lib/*.js|d.ts|map` + 两份 manifest 到 `~/.dsh/profiles/web/node_modules/dsh-thinking-levels/`;确认页面 boot roster 中该插件 `rev` 变化(HMR),未变化则重启 web 进程并重取 token

## Phase 4: 实机验证（checklist.md 全项）
- [x] task_10: 深色环境(当前):触发器徽章、下拉选档、窗口编辑、模型切换逐项过
- [x] task_11: 亮色验证:临时 `body.removeAttribute('data-ds-dark-theme')` 目检后恢复
- [x] task_12: 回归:context window 行内编辑全流程 + 控制台零新增报错
