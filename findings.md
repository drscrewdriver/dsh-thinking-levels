# Findings — 模型面板 effort 接入 + 深色适配（2026-09-27）

> 证据来源:活页面运行时探针(内置浏览器 evaluate React fiber / 宿主 slot host face)、
> 宿主包源码(dsh-client-ui-slots@0.1.7-rc.2 未压缩 lib、served dsh-client-ui-model-selection bundle)。

## 官方 ModelSelect 的 effort 语义(served bundle 反编译证据)
- 模型行选择即提交:`selection = {provider: group.id, model: model.id, ...model.reasoning?.defaultEffort === void 0 ? {} : {reasoningEffort: model.reasoning.defaultEffort}}` —— 选模型默认带上该模型 `defaultEffort`。
- 生效档位:`effectiveEffort = state.current?.reasoningEffort ?? reasoning?.defaultEffort`;目录不可用时回落 `state.retainedEffort`(store 上的名称字符串)。
- 档位标签:`reasoning.efforts.find(level => level.id === effectiveEffort)?.name ?? effectiveEffort`;无 reasoning 时显示 `t("effort.providerDefault")`。
- 档位行:`pending.reasoningEffort === level.effort` 判定进行中,`effectiveEffort === level.effort` 判定当前(带 StateDot)。
- 提交通道:`directory.select(selection)` → `sessions.selectModel({sessionId, provider, model, reasoningEffort?})`;缺省 `reasoningEffort` = 回提供方默认(官方 submit 的省略语义)。
- 触发器:`triggerEffort` span 显示 effortLabel;aria-label 格式「选择模型，当前 X，推理等级 Y」。

## 槽位选举与 abdication(接管 3.4.1 失败的完整机制,已由 3.4.2 修复)
- `conversation.input.model` 是 `kind: "single", scope: "session"`;渲染取 `entriesOfSlot(key)[0]`。
- 选举:`entries` 按 `priority` 升序稳定排序,`entriesOfSlot` 返回每 cell 第一个**未 abdicated** 条目。我们 `priority: -1` > 官方缺省 0。
- abdication:条目 render/inject 抛错 → `SlotErrorBoundary` → `reportEntryError(abdicate: true)` → 永久罢黜,官方条目(下一顺位)顶上;DOM 无任何可见痕迹(无 `data-slot-error`)。
- 3.4.1 根因:cordis `Service` 经 traceable proxy 把 `this.ctx` 重绑到**访问方** ctx(`createTraceable` get trap:`if (prop === tracker.property) return ctx`)。`directoryFor()` 读 `this.ctx.sessions`;我们延迟注入 fiber 只声明了 `modelDirectories` → `sessions` 解析为 undefined → TypeError → 整条目罢黜。`ModelDirectoryResolver.static inject = ["sessions", "remote", "remote.session"]` 即访问方必须声明的依赖集。
- 运行时证据(修复前):`entriesOf('conversation.input.model')` 返回 2 条(我们 + 官方),`entriesOfSlot` 只剩官方 —— 与上述机制吻合。

## 主题 token 事实(深色适配依据)
- token 定义在 **`body`**(computed 487 个自定义属性),不在 `:root`(仅 radius/font 等静态 token)。随 `body[data-ds-dark-theme]` 翻转;本机当前深色(`data-ds-theme-source=system` + `prefers-color-scheme: dark`),装了第三方皮肤 maid-atelier。
- 插件样式引用的 10 个名字中 **5 个不存在**(永远走亮色 fallback):`--dsw-alias-bg-surface`、`--dsw-alias-danger`、`--dsw-alias-danger-weak`(及 `--dsw-alias-state-business-primary-weak` 需复核)——这就是深色下底色偏白的根因。
- 实测翻转值(body 作用域解析):`bg-layer-1` #f8faffb8/#121f43e6、`bg-layer-2` #ebf0fad6/#182850eb、`bg-layer-3` #e0e7f6e0/#20315bf0、`border-l2` #475b914d/#97a9d857、`label-primary` #172347/#e7ecf7、`label-secondary` #4d5d7f/#bdc9e3、`label-tertiary` #6f7c99/#96a6c9、`state-business-primary` #536eae/#9bb0e1、`state-error-primary` #ec1313/#f25a5a、`interactive-bg-hover-danger` #ec13130d/(暗随主题)。
- `--ds-font-family-code` 在 `:root` 定义,现有引用有效。

## 技术选型
- 原生 `<select>` 做档位下拉:inline-style 约束下唯一自带弹层、免定位/免键盘处理的控件;官方菜单原语(`_7KE1Ra_menu`)是 CSS module,client bundle 纯洁性约束下不可复用。
- chip 从行 `<button>` 移出:`<button>` 内嵌 `role="button"` span 本就属非法交互嵌套(现有代码),加 select 后必须重构为兄弟节点。

## 约束与依赖
- 本机 profile 无 `llm-deepseek` → 官方 DeepSeek 分支(`deepseek-official`)无实机写入路径,仅做「徽章禁用、不崩溃」回归。
- 服务端 HMR 已证实:改 `~/.dsh/profiles/web/node_modules/.../lib/client.js` 后页面 boot roster 的 per-file `rev` 自动更新(`8533d66f67cc` → `e9957d026371`),无需重启进程。

## 风险识别
- `<select>` 在深色下的 option 列表底色由浏览器/OS 决定,inline style 只能控制闭合态;可给 select 加 `color-scheme: dark light` 让原生弹层跟随主题(计划内)。
- 第三方皮肤(maid-atelier)下 `bg-layer-*` 可能被皮肤重定义 → 面板与页面仍同色系(预期行为),不做像素断言,验证以「亮暗一致、无白底」为准。
- `state.retainedEffort` 未纳入契约(目录不可用时的档位名回落)——目录不可用时面板本身已降级,YAGNI 不补。
