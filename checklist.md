# Checklist — 模型面板 effort 接入 + 深色适配（3.4.3）

## Must Pass
- [ ] `npx tsc --noEmit` 零错误;`npx vitest run` 全绿(270+);`npm run build` 产出完整
- [x] 触发器显示「模型名 + 当前生效档位徽章」;选模型后徽章随 `defaultEffort` 变化
- [x] 模型线 effort 下拉:列出「提供方默认」+ `reasoning.efforts[]` 全部档位(显示 name)
- [ ] 选档位后会话生效:触发器徽章立即更新;发一条消息请求体 `reasoning_effort` 与所选档位映射一致(或经插件映射表)
- [x] 选「提供方默认」→ 提交模型声明的 `defaultEffort`（宿主 select 省略字段=保持当前值，无法省略重置；与官方 UI 语义一致；无 `defaultEffort` 的模型不渲染该选项）
- [x] context window 徽章:点击 → 行内编辑 → 滑条/自定义/清除 全部仍可用(回归红线)
- [x] 模型切换仍可用:点行 → 触发器文案更新 → 下一条请求走新模型(回归红线)
- [x] 深色模式(当前环境):面板无白底 —— 触发器/弹层/行内编辑行/徽章/select 底色均为暗色系,与页面同色系
- [x] 亮色模式(切 `data-ds-dark-theme` 验证):同上,亮色系正确,无暗色残留
- [ ] 控制台零新增报错(尤其无 slot abdication / TypeError)

## Should Pass
- [x] 编辑行独占整行（行容器 `flexWrap: wrap` + 编辑行 `flex: 1 1 100%`；修复编辑行被 flex 挤到右侧、左侧留白的错位）——深色截图复验通过
- [x] `select` 原生弹层跟随主题(`colorScheme: "dark light"`)
- [ ] 非激活模型线的下拉显示其 `defaultEffort`;`reasoning` 缺失的模型线不渲染下拉
- [x] busy 期间(切模型/写窗口)行内控件禁用,无并发写入
- [x] manifest 版本 package.json = dsh.plugin.json = 3.4.3;页面 boot roster rev 更新
- [x] 四语 locale key 齐全(zh/en/ja/ko),无缺 key 回退到 key 名
