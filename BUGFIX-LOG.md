# dsh-thinking-levels 修复记录

本文档记录 dsh-thinking-levels 从 v0.1.0 到 v0.4.1 的全部 bug 修复过程：问题现象、根因、修复方案与验证结果。

---

## v0.1.0 → v0.1.1 — Node 22 禁止加载 node_modules 下的 .ts

- **版本**：v0.1.0（问题）/ v0.1.1（修复）
- **现象**：`dsh web` 启动报 `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`，插件无法加载。
- **根因**：v0.1.0 以纯 TS 源码分发（`main` 指向 `src/index.ts`）。Node 22 出于安全原因明确禁止 type-stripping 加载 `node_modules` 下的 `.ts` 文件。
- **修复**：
  - 新增 `tsconfig.build.json`（`rewriteRelativeImportExtensions` 把源码 `.ts` 相对导入改写为 `.js`），编译产物到 `lib/`。
  - `package.json` 的 `main` / `types` / `exports` 指向 `lib/*`；`files` 白名单含 `lib/`。
  - 新增 `prepublishOnly` 构建钩子。
- **验证**：`node import lib/index.js` 成功；`npm pack --dry-run` 确认 tarball 含 `lib/`（`.gitignore` 的 `lib/` 不阻止 files 白名单）。

---

## pnpm 11 供应链冷却期 — minimumReleaseAge

- **现象**：`dsh plugin add dsh-thinking-levels@新版本 -w` 报 `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`。
- **根因**：dsh 运行环境实际使用 pnpm 11.22.0（非 PATH 上的 9.15.6），默认开启 `minimumReleaseAge: 1440`（新发布包 24h 冷却期，防供应链攻击）。
- **修复**：在 `~/.dsh/profiles/web/pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 加入每个新版本：
  ```yaml
  minimumReleaseAgeExclude:
    - dsh-thinking-levels@0.1.0 || 0.1.1 || 0.2.0 || 0.2.1 || 0.3.0 || 0.3.1 || 0.4.0 || 0.4.1
  ```
- **附带**：`node-pty` 原生模块构建脚本被 `allowBuilds` 拦截 → `pnpm-workspace.yaml` 加 `allowBuilds: node-pty: true`。

---

## host 加载失败根因 — @deepseek-ai/dsh-settings 值依赖（0.4.0 根治）

- **版本**：v0.1.1 引入问题，v0.4.0 根治。
- **现象**：插件在插件列表显示"已停用/未挂载"、无错误信息；client 入口不进 `__DSH_BOOT__`；`/plugins/dsh-thinking-levels/client.js` 404。
- **根因**：host `lib/index.js` 值导入 `@deepseek-ai/dsh-settings`，但官方包**默认不在 profile 的 hoisted node_modules 中**（从 dsh 全局嵌套解析，CLI 的 ESM 树够不到）→ import 失败 → fiber 不建立 → `ClientModuleRegistry`（要求 `entry.fiber !== void 0 && !entry.disabled`）跳过该插件。
- **临时方案（后被取代）**：把 `@deepseek-ai/dsh-settings` 装入 profile 作普通依赖。**问题**：插件列表出现"已安装但未成为 profile 层"的困惑条目，且产生双实例/版本漂移风险（profile rc.6 vs dsh 全局 rc.7）。
- **根治（v0.4.0）**：host 端**不再值依赖** dsh-settings——
  - 官方 `installSettingsSection` / `settingsNamespace` 改为本地实现：`ctx.inject(['settings'])` → `sctx.settings.register(ns, schema, { base: entry })` + `scope.get()/watch()` + `sctx.effect` disposer；namespace 为本地字符串常量。
  - `peerDependencies` 精简为仅 `@deepseek-ai/cordis`。
  - profile 彻底移除 `@deepseek-ai/dsh-settings`（含 rc.6 旧版）。
- **验证**：profile 无 dsh-settings 时 `import('dsh-thinking-levels')` 成功导出 `Config, DEFAULT_CONFIG, THINKING_LEVELS_SETTINGS_NAMESPACE, apply`。
- **教训**：host 插件应避免值依赖官方 `@deepseek-ai` 包，通过 cordis 服务注入；官方包不在 profile 解析树是设计使然。

---

## client 发现 — exports["./client"] 必需

- **版本**：v0.2.0 引入，v0.2.1 修复。
- **现象**：client 入口不进 `__DSH_BOOT__`，`/plugins/dsh-thinking-levels/client.js` 404。
- **根因**：dsh client-modules 的 `clientExportOf` 通过解析包的 `exports["./client"]` 发现 client bundle；缺失时该包被判为"非 client 包"（静默失败）。
- **修复**：`package.json` 的 `exports` 增加 `"./client": { "default": "./lib/client.js" }`。
- **验证**：`__DSH_BOOT__` 出现 client 入口，bundle 路由 200。

---

## UI 位置与用户预期不符 — 模型选择器 Auto（v0.3.0）

- **版本**：v0.3.0。
- **背景**：用户明确要求档位控件出现在**会话模型选择器（模型旁）**，而非设置面板；且 `auto` 应是 **mask**（显示 auto，实际提交时由插件按上下文解析为 low/high/max）。
- **模型目录数据流**（注入点调研）：
  ```
  client ModelDirectory.load() → sessions.models remote
    → dsh-host-apiproxy buildModelCatalog → ctx.llm.resolveModelInfo
      → llm.adapters registration → adapter.resolveModel（efforts 列表）
  ```
  模型选择器的档位选项 = `model.reasoning.efforts`，无 slot 可覆盖。
- **注入 Auto**：包装每个 `llm.adapters` registration 的 `adapter.resolveModel`，向 `reasoning.efforts` 追加 `{ id: 'auto', name: 'Auto' }`（同时让 `resolveCallFor` 的 efforts 校验放行）。
- **关键 bug（agent/request 覆盖）**：dsh-agent 在 `agent/request` 事件里用会话模型选择结果**覆盖** `reasoningEffort`（`next()` 之后）；普通注册的插件 listener 在事件链内层，修改被丢弃 → **v0.2.x 的拦截从未生效**。修复：`ctx.on('agent/request', handler, { prepend: true })`（最外层 listener 最后执行，最终值生效；官方 dsh-llm invariant 同款用法）。
- **决策语义**：模型选择器选 wire 档位（off/low/high/max）→ 尊重；选 `auto` → 插件按工具历史 + 升降档开关调度；未选 → 插件默认档位（默认 auto）。

---

## 桌面版 slot 声明差异 — settings.plugin.item keyed vs list

- **版本**：v0.3.0 引入，v0.4.0 修复。
- **现象**：DSH Desktop 启动报 `failed to apply loader entry (dsh-thinking-levels): list slot "settings.plugin.item" requires options.id`。
- **根因**：两个环境的 slot 声明不一致——
  - CLI 版 dsh 0.1.0-rc.7：`settings.plugin.item` 为 `kind: "keyed"`（注册用 `key`）
  - DSH Desktop 内置版：`kind: "list"`（注册用 `id`）
- **修复**：注册时**同时提供 `id` 与 `key`**（slots 服务只校验自己 kind 的字段，两者共存不冲突），双环境兼容。

---

## Auto 档位不显示 — adapter 包装时序（v0.4.1）

- **版本**：v0.4.0 引入，v0.4.1 修复。
- **现象**：模型选择器只有 Off/Low/High/Max，无 Auto；插件本身已启用已挂载无错误，设置卡片正常（默认档位含 auto）。
- **根因**：`advertiseAutoEffort` 只在插件 apply 时**同步遍历一次** `llm.adapters`；当 llm adapter 注册**晚于插件 apply**（DSH Desktop 加载顺序）时，遍历到空 Map，包装永不执行。
- **修复**：监听 `llm/adapters-updated` 事件，**每次 adapter 注册/替换后重新包装**（响应式）：
  ```ts
  advertiseAutoEffort(ctx.get('llm'))
  ctx.on('llm/adapters-updated', () => {
    advertiseAutoEffort(ctx.get('llm'))
  })
  ```
- **附带**：profile 升级时 dsh-at-file 的 GitHub tarball 下载报 `UND_ERR_DESTROYED`（网络问题）→ 设置 `HTTP_PROXY`/`HTTPS_PROXY=127.0.0.1:30987` 重试成功。
- **教训**：对 dsh 运行时注册表（llm adapters 等）的钩子要用 `*-updated` 事件驱动，而非 apply 时快照；CLI 与桌面版的加载顺序不同。

---

## v0.5.0 — 模型能力感知：不支持的 effort 字段绝不乱传（含 rc6 low 显示/透传）

- **背景（用户报告）**：插件对每次 `agent/request` 无条件注入 `reasoningEffort`，把 `low` 强制打进不支持的模型（自定义 llm-pi-ai / openai-completions 的 Qwen3.6-35B-A3B，未声明 `reasoningEfforts` → dsh 判定非推理模型）→ 每请求抛 `UNSUPPORTED_REASONING_EFFORT`。
- **版本差异确认**：
  - dsh rc.6（老）：llm-deepseek `REASONING_EFFORTS = [Off, High, Max]`，serialize 拒绝 `low`（`226600147e` 引入 low 之前）。
  - dsh rc.7+（新）：原生支持 `off/low/high/max`。
  - 当前 profile 为 0.1.1-rc.2（新版本）。
- **修复**：
  1. **模型能力守卫**：`agent/request` 拦截器调 `ctx.llm.resolveModelInfo`（按 `provider/model` 缓存，`llm/adapters-updated` 清缓存）检测 `reasoning.efforts`；非推理模型**剥离** `reasoningEffort`（继承的也删），绝不下发。
  2. **手动档位原样透传**：`low` 在 rc.7+ 是原生级别，拦截器不再重写；`resolveEffortInjection` 纯函数承载"剥离/透传/调度"决策。
  3. **rc.6 low 显示与透传**：`advertiseModelCapability` 包装 adapter.resolveModel——efforts 无 `low` 且配置 `models["provider/model"].efforts` 确认含 `low` 时注入 `{ id: 'low' }`（选择器显示 Low + `resolveCallFor` 校验放行 + 透传）。rc.7+ 已有 low 则不注入。
  4. **auto 调度保留 low 候选**：支持 low 的模型 auto 最低可到 low；不支持的模型由能力守卫整体剥离，天然不误传。
  5. **配置**：新增 `models` 节（`provider/model` → `vision` / `thinking` / `efforts` 手动确认，自动检测给推荐值）。
- **Qwen 落地路径（llm-pi-ai 侧，非插件代码）**：
  - Qwen3.6（非 effort 思考模型）：`thinkingFormat: qwen` + `thinkingBudgets` + `reasoningEfforts` → wire 走 `enable_thinking` + budget（对应官方 `extra_body={"enable_thinking": true, "thinking_budget": N}`），不发 reasoning_effort。
  - Qwen3.8-27B（effort 模型）：`reasoningEfforts` 声明档位 + `thinkingFormat: qwen-chat-template` → 透传 effort + `chat_template_kwargs.enable_thinking`。
- **验证**：`tsc --noEmit` 通过；vitest 28 例全过（新增 reasoningEffortSupported / resolveEffortInjection / models 配置测试）。

---

## v0.5.1 — 插件设置卡片：模型能力可选项（不改官方包）

- **需求（用户）**：自定义 API（llm-pi-ai / openai-completions）配置处应能显示"是否视觉 / 是否思考 / 是否支持 think effort"可选项。官方 `ui-settings-models` 的模型目录面板不暴露这些字段，且官方包不允许改动。
- **方案**：不改任何官方包。dsh-thinking-levels 的设置卡片新增"模型能力"区：
  - client 通过 `settingsScope.bind({ namespace: 'llm-pi-ai' })` **直接读写 llm-pi-ai 的 settings namespace**（settings 服务的 `mutate` 不校验调用者是否 owner，RPC 亦放行）。
  - 每个 provider/model 提供：视觉 checkbox（写 `input`）、思考三态 select（写 `reasoningEfforts`：false / 档位表 / 删除继承）、effort 档位多选（off/low/high/max → 同名 wire，off → null）、thinkingFormat 下拉（openai/deepseek/…/qwen/qwen-chat-template/…）。
  - 写回走 `scope.set('providers', 修改后的 user 层 providers)`；llm-pi-ai 自己的 schema + `assertServiceable` 校验每个写，非法值被拒（settings-rejected），不会弄坏配置。
- **配套（上游能力）**：llm-pi-ai 的 `compat.thinkingFormat` 原 withheld `qwen-chat-template`（Qwen3.8 需要 `chat_template_kwargs.enable_thinking`）。已确认 pi-ai 对 `qwen-chat-template` 自行填充 enable_thinking/preserve_thinking，无需额外 kwargs 字段；`chat-template` 需要配置传入 chatTemplateKwargs（llm-pi-ai schema 无此字段）故仍 withheld。**注意**：放开 qwen-chat-template 需改 llm-pi-ai 官方 `catalog.ts`（用户拒绝改官方包，故本版 UI 仍列出该格式，配置是否接受取决于运行环境的 llm-pi-ai 版本）。
- **验证**：typecheck 通过；vitest 28 例全过；client bundle 重建（8.4kB → 23kB）。

---

## On 档位虚拟化回归 — mimo-v2.5 报 `does not support reasoning effort "on"`

- **版本**：v0.6.0 内（`52e4402` 引入，`bf2c8f0` 修复）。
- **现象**：pi-ai 路由的 toggle-only 模型（xiaomi/mimo-v2.5，`reasoningEfforts: {off, high}` + `supportsReasoningEffort: false`）在会话选择器选 On 后，请求报 `provider "xiaomi" model "mimo-v2.5" does not support reasoning effort "on"`。
- **根因**：`52e4402` 把 toggle 模型的 On 从 advertise `high` 改成 `on`（为满足"on 不映射 high、不传 effort"的语义），但 **pi-ai 的请求路径只认自己解析出的固定档位**（`adapter.ts resolveReasoningLevel` 用 `getSupportedThinkingLevels(model)` 校验，mimo 声明的是 off/high）——`on` 不在其中，每流式请求被拒。
- **修复**：toggle 模型的 On **advertise id 回到 `high`（name "On"）**；`resolveEffortInjection` 把配置/选择器层的 `on` 在 toggle 模型上归一化为 `high`，在 effort 模型上剥离。wire 语义不变：pi-ai 对 `supportsReasoningEffort: false` 模型把非 off effort 序列化为 `enable_thinking`，**不发 reasoning_effort**——正是用户要的"只传 thinking enable"。
- **教训**：展示层虚构档位（On）必须映射到 provider 请求路径认识的**真实档位**；advertise id 会被 `resolveCallFor`/provider 校验消费，不能只满足选择器展示。
- **验证**：vitest 47 例全过（toggle 场景改回 off/high、on→high 归一化、effort 模型剥离 on）；typecheck/lint/build 全过。

---

## 修复版本时间线

| 版本 | 修复内容 |
|---|---|
| v0.1.1 | Node 22 type-stripping：编译产物发布（lib/） |
| v0.2.1 | `exports["./client"]` client 发现 |
| v0.3.0 | 模型选择器 Auto（mask）：adapter efforts 注入 + `prepend` 拦截 |
| v0.4.0 | 去 dsh-settings 值依赖（cordis 服务注入）+ id/key 双环境兼容 |
| v0.4.1 | adapter 包装响应式（`llm/adapters-updated`） |
| v0.5.0 | 模型能力感知：非推理模型剥离 effort（不传不支持字段）；rc.6 注入显示 low + 透传；rc.7+ 不改 low；新增 models 配置节 |

---

## v0.6.0 — 档位体系对标 dsh-thinking-effort + 渲染 + 多语言

- **需求（用户）**：
  1. 思考级别 effort 对标 dsh-thinking-effort：`off/on/minimal/low/medium/high/xhigh/max` 8 档 + 自定义传输字段映射；
  2. 画面渲染借鉴 dsh-thinking-effort（当时设置展示效果不好）；
  3. 多语言说明学习 dsh-thinking-effort（全套四语）。
- **用户确认**：保持 plugins 内部卡片形态（不新增独立设置页），仅借鉴思考级别配置的展示元素/样式；多语言做全套四语（README+INSTALL+CHANGELOG × en/zh/ja/ko + locales 四语）。
- **实现**：
  1. `EffortId` 扩展为 9 值：`off/on/minimal/low/medium/high/xhigh/max/auto`；`on` 语义 = 只传 thinking enable（enable_thinking true），**不传 think effort**——注入层 clamp 到模型默认强度（high），由 thinkingFormat 序列化为 enable_thinking；`minimal/medium/xhigh` 对自定义网关透传、对官方适配器折叠到 high。
  2. 能力编辑器改为 effort 风格：供应商分组折叠、模型行徽标（T/IMG/上下文）、逐档 wire 编辑器（勾选 + 填线上值，如 high → ultra）、搜索、一键预设（官方/通用）、恢复默认。
  3. locales 补 ja/ko 全套 68 key；新增 README.{md,zh,ja,ko} / INSTALL.{md,zh,ja,ko} / CHANGELOG.{md,ja,ko}，语言切换链接同款。
- **关键坑（pi-ai schema 键空间）**：`llm-pi-ai` 的 `reasoningEfforts` 表键是**固定 7 档**（`off/minimal/low/medium/high/xhigh/max`，`z.dict` 键由 `THINKING_LEVELS` 约束），**不接受 `on` 键**。因此能力编辑器档位网格用 7 档（与 effort 的 ALL_LEVELS 一致）；`on` 只存在于选择器/注入层（toggle 模型 Off/On），由 `off`+`high` 表对表达。
- **关键坑（toggle 模型误标 effort）**：初版 `applyDraft`/`applyPreset` 把 `supportsReasoningEffort` 无条件置 true——Qwen3.6 这类 toggle-only 模型（只接受 enable_thinking）会被误标为 effort 模型，导致 reasoning_effort 被发给网关（400）。修复：仅当原值已为 true 或勾选了扩展档位（minimal/low/medium/xhigh/max）才置 true；preset 完全不动 compat。
- **验证**：vitest 46 例全过（含 on clamp、扩展档位透传新用例）；typecheck 0；lint 0（顺手清了遗留 `_N` 与 `effortLevelsOf`）；build 成功（client bundle 50.7 kB）。

---

## 4.4.0 — GitHub issue 批次修复（#2 / #3 / #4 / #5，2026-10-19）

- **#2 能力卡 writeError**：宿主 `dsh-llm-pi-ai` 的兼容闸门按协议分流（两代宿主实物核对）——`RESPONSES_COMPAT_GATE` 不 offer `compat.thinkingFormat` / `compat.supportsReasoningEffort`，严格校验对携带不可配字段的 providers 整写拒绝（`invalid(...not configurable here)`）。插件不分 api 类型一律写这两个字段 → responses 路由必炸 `card.writeError`。修复：`CapabilityEntry` 携带 provider 级 `api`，`effortCompatConfigurable()` 判非 `openai-completions`（含 absent=默认 completions 放行）时三个控件 disabled + `apiUnsupported` 提示，杜绝无效写。
- **#4 加载变慢**：`advertiseModelCapability` JSDoc 声称幂等但函数体无守卫，每次 `llm/adapters-updated` 叠加一层 `resolveModel` 包装，每层带一次全量 `describeSettings` → 模型页成本 O(模型数×层数)（确定性 bug，`tests/advertise.spec.ts` 坐实）。修复：模块级 `WeakSet` 幂等守卫 + `piAiFor` readout 代际缓存（`settings/document-updated` 同点失效）+ `syncTakeover` 仅响应 `TAKEOVER_SYNC_NAMESPACES` 内的提交。另：4.3.0 stateVersion 1→2 的一次性全史重折为升级首载固定成本，不可回滚，已写入发版说明。
- **#3 弹窗搜索丢失**：座位以 priority -1 整体替换官方 ModelSelect，而官方 0.2.x 弹窗自带 `>4` 搜索（client.js `showSearch`），替换品 ModelPanel 无搜索。修复双路：接管态弹窗补搜索（阈值/行为对齐官方）+ 新增 `takeoverUi` 开关（缺省 **关** = 不替换官方弹窗，auto 档位仍经 resolveModel 广告注入出现）。
- **#5 auto 显示被顶掉**：插件把解析值写进请求配置（`{ ...seed, reasoningEffort: decision.level }`），宿主投影 `next = pending ?? lastUsed` 在新会话（无 model/selection 事件）直接取 lastUsed=解析值，chip 显示 low。修复在显示层：ModelPanel trigger 改意图源链（本挂载显式选择 > 合并值即 auto > 配置缺省档为 auto 且模型广告 mask > 合并值），意图为 auto 时解析值降为次级标注 `→ low`；未采纳「每请求断言 pending」（会逐步刷 model/selection 事件污染日志）。官方 chip（takeoverUi 关时）不可插件侧改，README/卡片文案标注语义。
- **附带**：上下文窗口编辑在 takeoverUi 关时迁入设置卡（`DeepSeekContextSection`，写路径与面板 DEEPSEEK 分支同源）；legacy `plainBase` 补 `takeoverUi` 防 ≤0.1.6 宿主丢字段。
- **验证**：typecheck/build/lint 全绿；vitest 160/160（新增 advertise.spec 3 例、model-panel.spec 6 例、config 3 断言、settings-seat 改造含缺省不接管用例）。

---

## 4.4.1 — takeoverUi 坐席看门狗（桌面实测反馈，2026-10-19）

- **现象**：桌面端把「模型界面接管」打开后 ModelPanel 没有接管回来，逐行 context 芯片也不显示；重载页面依旧。
- **根因**：4.4.0 的门控是座位 inject 时的**一次性**镜像读取。真实宿主里 `modelDirectories` 启动可早于配置腰绑定（scopeOf 未绑）与镜像折叠（status loading），两条件任一未满足即永久不坐席；服务启动顺序每次 boot 相同，所以重载也救不了。计划里预留的「重载生效」在真机时序下等于「开关无效」。
- **修复**：坐席判定改为看门狗（watchdog）：`seatDeclared`/`seatDirectories`/腰绑定三路都触发 `startSeatWatch`，订阅 settings 镜像并在每次变更时 `evaluateSeat`——开→ `ctx.slots.register` 坐席（生成器已证明声明在场，迟到 register 合法）；关→ 调 claim disposer 退位，官方 ModelSelect 回来；重复开不双占（seatClaimed 守卫）。卸载随 fiber disposer 退订。
- **卡片形式**（用户定案）：takeoverUi 行改为**乐观态横放药丸 toggle**（PillToggle，sr-only 真 checkbox + 绘制轨道/旋钮；checked 源走 pendingTl 乐观Overlay，写失败自动回滚）；9 语 hint 文案同步改为「即时生效，无需重载」。
- **验证**：typecheck/lint/build 绿；vitest 161/161（新增 hot-flip 用例：off→on 坐席一次、重复 on 不双占、off 退位 disposer 记录、再 on 重坐）。

---

## 通用排查线索

- 插件"已停用/未挂载"无错误：检查 profile 与 `$DSH_HOME/cordis.patch.yml` 的 `disabled` 条目（桌面端可能改写 profile patch 文件）；检查 host 值依赖是否在 profile 解析树内。
- client 入口不在 `__DSH_BOOT__`：确认 `exports["./client"]`、host fiber 已建立、无 disabled。
- 模型选择器档位缺失：确认 adapter `resolveModel` 包装已生效（含事件驱动的补包装）。
- 浏览器静态资源缓存：升级后硬刷新（Ctrl+Shift+R）避免旧 client.js。
