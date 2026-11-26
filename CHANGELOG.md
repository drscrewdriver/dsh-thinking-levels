# Changelog

## 4.7.3 (2026-11-26)

**设置卡底栏新增常驻 Star 快车道（panel-star-row S 档）。**

- `src/client/card.tsx` 的 `ThinkingLevelsCard` 卡根容器末尾（`ModelCapabilities` / `DeepSeekContextSection` 之后、卡片闭合前）挂一行常驻条：GitHub 单色 SVG + `drscrewdriver/dsh-thinking-levels` 链接（新标签页、`rel=noreferrer`）+ 一句工程化求星话术 + `★ 留颗 Star` 钮。
- 行本体是生成副本 `src/client/star-row-copy.ts`（真源 `mine-dsh-plugins/_tools/star-row/starRow.ts`，`sync.mjs --check` 把漂移）；副本内嵌 10 语按 `<html lang>` 前缀自选，认不出回落 en。
- 关闭语义：点钮只收起话术与钮（`localStorage` 键 `dsh.star.thinking-levels.dismissed`），**仓库链接永留**；不弹窗、不打断表单。
- `star-row-copy.ts` 登记进本仓 locale 守卫白名单（`tests/_locale-baseline.json`）——C-ui 0 / A-pair 0 棘轮原地不动。
- 行为契约 `tests/star-row.test.ts`（4 例：渲染/链接属性/十语切换/关闭后只剩链接）；全量 369 passed。

## 4.7.2 (2026-11-26)

- style(guide)：「重新查看引导」按钮化为描边胶囊（`guide-kit` sync 产物对齐），跳过标记与三步正文未动。

## 4.7.1 (2026-11-25)

- feat(guide): 「重新查看引导」入口从卡底移到卡顶（`GuidePanel` 之前），与其他八个接了统一引导的插件同形态。跳过标记与三步正文逐字未动（`dsh.guide.thinking-levels.skipped`）。

## 4.7.0 (2026-11-24)

- **新增首次使用引导（3 步）**：设置卡顶部三步——按难度挑档位（简单问答降 low、复杂任务抬 high，默认自动就够用）、允许上浮（别一上来钉死 max，贵且慢）、圆环读数怎么看。底部恒定重开入口；Skip 与「开始使用」都写 `dsh.guide.thinking-levels.skipped`。
- **引导十语外壳**：七个外壳词自带 zh·en·ja·ko·fr·de·it·ru·es·pt，按 `<html lang>` 取词、认不出落 en；步骤正文 zh/en，其余语种回退 en。
- **上下文圆环文案全部搬进字典**：`context-ring.tsx` 此前用 `lang ? zh : en` 内联双语（ru/es 见中文），现收进 `ring.*` 组（29 键 ×10 语），并顺带统一该文件行尾为 LF（HEAD 本就是 LF，工作树漂成 CRLF 制造了整文件假 diff）。
- **附带语言守卫棘轮**：硬编码 CJK 计数只降不升，引导两文件按设计登记白名单。
- **全量**：365 tests / 365 pass。

## Unreleased

- **配色加深：方向色改用固定语义色，降档从琥珀改红。** 之前两处都用主题令牌（`--dsw-alias-state-success-primary` / `-warn-*`），问题有两个：一是这些令牌是为大面积背景调的柔和色，落在 18px 圆环和一个字形上就发灰；二是琥珀色配绿箭头读起来像「警告」，而降档其实只是相反方向，不该是警告色。
  - 方向色：升档 `#18a058`、降档 `#d03050`（红）、起始 `#2b6cb0`、持平沿用弱化灰。方向是固定语义，不跟主题走。
  - 归属色：`scheduler` 用最饱和的 `#0e9f6e`（已知写入者里证据最硬的一档，就该最醒目）、`auto` `#18a058`、`manual` `#2b6cb0`、`unknown` `#d48806`（琥珀，需要留意）。
  - 圆环加重：描边 1px→1.5px、字形 11px→12px 且 700 字重——半透明行底上原来箭头几乎看不见，「往哪边动」读不出来。

- **插件调度现在能真正打标记了（`scheduler` 归属）。** 上一版把无法归属的档位诚实标成「未记录」，但那是「说不清」，不是「说清了」。这次用宿主正式开放的机制把它坐实：
  - 机制：`@deepseek-ai/dsh-session` 的 `appendPluginRecord(session, type, data)` 可写入 `ignorable` 的 `plugin:` 记录——不进模型可见面、fork/resume 随日志保留、不认识的读者跳过而不是拒读。插件每次自写档位后追加一条 `plugin:dsh-thinking-levels/scheduler-write`，投影见到标记就把**下一条** `request/header` 归因为 `scheduler`。
  - 归属优先级：`scheduler`（有标记，证据）> `manual`（记录值 == 本次档位）> `auto` > `default` > `unknown`（无标记且对不上，退路）。标记只声明「是谁写的」，档位永远取自实际发出的 header——不会伪造。
  - 软耦合：宿主包用**变量化说明符的动态 import** 取用（字面量会让它变成硬编译依赖，而这 API 在旧线上不存在）；一切失败——包不可解析、session 不可追加、payload 被拒、logger 抛异常——都解析成 `false`，绝不 reject，因为调用点在一轮对话中间。首次写入探针打一行日志，标明通道 ready / unavailable，避免「静默没标记」和「调度器没写过」无法区分。
  - 视图：新增 `trace.intent.scheduler`（10 语），用成功色而非警示色——它和 `manual` 都是「已知写入者」，「未记录」才是警示。
  - `stateVersion` 5→6（state 新增 `pendingSchedulerWrite`，仅宿主侧，不进 wire）。
  - 测试 +19（标记消费与一次性、跨档位不伪造、foreign record 忽略、wire 不外泄、软耦合四类降级、logger 抛异常不 reject、payload 严格归一化、渲染与汇总）。

- **修复归属造假：档位变化不再一律标「手动」，并全程记录 provider/model。** 现场取证（会话 `7f321902`）：`model/selection` 事件只有 **1 条**（high），而 `request/header` 有 **30 条**、high/low 交替。旧规则是「会话里记录的档位不是 auto ⇒ 每次请求都算 manual」，于是 29 次插件自己的调度全被标成「手动」——那是个伪命题：0.2.2+ 严格线上本插件自己就是 `model/selection` 的写入者，而 `agent.model.select()` 的写入**不进日志**（宿主只在用户主动选择时 append）。
  - 归属改为四值、且以「相等」而非「存在」为判据（`attributionOf`）：记录值 == 本次档位 → `manual`；记录值是 `auto` → `auto`；无任何记录 → `default`；**有记录但对不上 → `unknown`（未记录）**。同一份真实数据：旧规则 30×manual，新规则 15×manual + 15×unknown。
  - 视图面：`unknown` 用中性警示色并带解释性 tooltip（说明严格线写入不进日志），绝不与 `manual` 同色——把它染成决策色就是第二次说谎。汇总条新增「N 未记录」计数。
  - **provider/model 全程记录**：`request/header.config.provider/model` 每个请求都带，此前被丢弃，导致轨迹说不清「这档位发给了哪个模型」。现在折叠进 `lastProvider`/`lastModel`/`modelSwitches`，并给每段 run 打上 `provider`/`model`；同一档位跨模型切换会**拆段**（`foldTrace` 把 route 纳入 run 身份），否则切换会被抹平。视图面每段显示 `provider/model` 徽标，汇总条显示切换次数。
  - `stateVersion` 4→5（state 形状变更）。冷读自动重建，无迁移负担。

- **Effort 轨迹页与「权限审批记录」对齐呈现，并补上 turn/step 位置坐标。** 此前只有一列裸文本（`手动 low`），既看不出是第几轮第几步变的，也没有变化方向的视觉提示；同一条标签栏里的两个页签长得像两个产品。
  - 呈现：标题 + 副标题、汇总条（请求数 / 段数 / auto 段数 / 峰值档位）、每段一张卡片——圆环字形（↑升 / ↓降 / =持平 / •起始）走左侧连线轨，档位用等宽字，意图色标（auto 绿、降档琥珀、持平/起始中性），`× N` 次数徽标，右侧对齐的墙钟时间；全部走 `--dsw-alias-*` 设计令牌与 perm-gate 同款圆角/间距/字号。
  - 位置：`tlAutoSchedule` 新增 `turn` / `step` 折叠（`turn/start`、`step/start`），每段首条请求记下 `T{轮}·S{步}` 与 `time`；`stateVersion` 3→4。历史会话冷读自动重建，无迁移负担。
  - 归属诚实化：页脚常驻提示——0.2.2 起宿主禁止在请求阶段改档位，本插件（严格线）自己会写 `model/selection` 提前一步排程，故「手动」只表示日志最后一笔选择是具体档位，未必是人为点击。这条不写清楚，页签会公然说谎（截图里 auto 摆动被标成「手动」）。

- **修复：投影缺少 `wire`，浏览器侧永远读不到（Effort 轨迹恒为空态）。** 宿主只在 unit 声明了 `wire` 时才把投影送到客户端——`snapshot()` / `cachedSnapshot()` 均 `continue` 于 `def.wire === undefined`（`packages/session/session-projection/src/index.ts`，「Omit for host-only units」）。`tlAutoSchedule` 自 4.5.0 起一直没有 `wire`，于是它是 host-only：`traceOf`（轨迹页签）和 `lastEffectiveOf`（chip 的 issue #11 修复）在真实宿主上全是死读——投影里明明有数据，界面恒渲染空态。`tlCacheBilling` 从一开始就有 `wire`，所以计费卡看得见。
  - 新增 `wire: { viewSchema, view }`：视图只带客户端要渲染的三项（`userEffort` / `lastEffective` / `trace`），`samples` 留在宿主侧（只供调度器读）。
  - 视图带单槽内容 memo：`tool/call` 只增长 `samples`，客户端相关字段没变时复用同一对象身份，`Object.is` 闸门保持关闭——否则每个工具调用都会唤醒每个订阅端（长会话上千次）。
  - 该次只加 `wire`，`stateVersion` 未动；随后位置坐标（turn/step/time）进来才升到 4。
  - 测试 +4（wire 存在性与 schema 校验、samples-only 变更不换身份、同一状态重复读复用、畸形载荷被拒）。

- **修复：投影 face 的读取按 settings 句柄形状解包，读取恒为 `undefined`。** 宿主 `ProjectionValueStore` 的 face 是 `getSnapshot: () => rows.get(key)?.value`，返回的就是**投影状态本身**（`packages/api/session-controller/src/client/sessions/projection-store.ts` 的 `channel()`；宿主内部消费者都是直接强转，如 `faceOf('permissions').getSnapshot() as PermissionSelection`）。`effort-trace.tsx` 与 `index.ts` 却按 `{ status, value }` 的设置句柄形状取 `.value`——那套形状属于 `configForms` / `settingsScope`（`card.tsx` / `model-panel.tsx` 里的 `.value` 是对的）。两套 API 混淆，结果同样是空态。
  - 新增 `src/client/projection-value.ts`：`projectionValueOf()` **正向识别裸状态**（`trace` / `lastEffective` / `userEffort` / `samples` 任一命中即是），包装形状永远不会被误认成状态，反之亦然；同时兼容旧的 `{ value }` 包裹（老宿主 / 测试替身）。
  - 测试替身此前写成与错误实现**同一个**错形状，所以 316 例全绿而读取是死的——这正是本次「假全绿」的成因；替身已改为真实宿主形态，并补两条回归（裸状态必读出、旧包裹仍兼容）。

## 4.6.0

- **新增 `Config.simpleToolsRegex`：简单工具 regex 名单（issue #12）。** 第三方工具家族（如 dsh-ops 的 `ops_*`）可一条 `^ops_.*` 整族进白名单，不再逐个枚举。每条按原生 JavaScript regex 编译（`i` flag、**不自动加锚点**，建议自写 `^`），与字面量名单并存、进同一 ratio 统计；编译失败的条目跳过并告警一次（配置变更粒度，非每请求）。
  - **双面匹配**：regex 与字面量名单统一测完整工具名与剥 `ops_` 后的裸名两面——regex 路径的硬前提（裸名无 `ops_` 前缀，`ops_.*` 对裸名永不命中），顺带修复字面量条目 `ops_bash` 式写法「因剥前缀而永不命中」的隐性坑（行为修复：此前无效的命名空间字面量现在生效）。
  - **内置表语义不动**：`SIMPLE_TOOL_RE` 仍只测裸名（issue #8 契约）；`shell`/`pwsh`/`cmd`/`sh`（terminal 插件）与 `ops_shell` 剥前缀路径逐字不变。
  - **调度双 gate 不动**：simpleRatio 的 `argsSize < HEAVY_ARGS` 二道门与升档面（heaviest args → max）独立驱动——家族级白名单只作用于降档面的 ratio 统计，最坏后果是档位偏好偏一档（会话内自愈），不会把重调用拉进低档、也不会把轻会话推上 max。
  - 实现：`SimpleToolMatcher` 统一分类器替代链路上的裸 `RegExp`；`planStrictStep`/`resolveEffortInjection`/`decideEffort` 加 `extraSimpleRegex` 输入。新增 9 例（家族命中/双面修复/无效跳过+告警/双 gate/终端适配），全量 314/314。

## 4.5.0

- **新增「Effort 轨迹」标签页（conversation.view）**：会话时间线旁以 run-length 时间线展示本会话每次请求实际发出的档位——`↑ auto max ×1` / `= auto high ×12` / `↓ auto low ×3` 式标签，↑/↓/= 为相对上一 run 的升降（escalation 序，复用 effort slider 的显示序表），最新在前。issue #11 的延伸：chip 只回答「最后一发是什么」，标签页回答「一路是怎么变过来的」。
  - 数据面：`tlAutoSchedule` 投影新增 `trace` 环（run-length 折叠 `{level, intent, count}`，`TRACE_MAX=64`），由与 `lastEffective` 相同的 `request/header` 事件折叠；intent 取折叠时刻的会话显式选择（auto / manual / 配置默认=中性）。`stateVersion` 2→3——投影是日志的纯折叠，冷读自动重建历史会话的轨迹，无迁移负担。
  - 无档位 header（非推理模型 / 被剥离）不进轨迹、隐式结束当前 run；语义与 `lastEffective=null` 路径保持一致。
  - 客户端面：`conversation.view` 槽位注册（perm-gate history 同款模式），读取与 chip 同一条投影 face 路径，无 HTTP feed；投影缺失 / trace 为空渲染空态，宿主未声明该槽位时 generator inject 永不触发（无标签页=诚实降级）。调度器零接触，chip 行为逐字不变。
  - locale：10 语补 `trace.label` / `trace.empty` / `trace.intent.auto` / `trace.intent.manual`。
  - 测试：投影折叠 + 轨迹组件两份 spec（20 例），全量 305/305。

## 4.4.20

- **connect 类插件兼容矩阵（issue #10 后续收口，无 src/ 变更）。** 普查四家 connect/聚合插件当日版本的 adapter 形态——`@dmh2002/dsh-connect-qoder` 1.27.1 / `dsh-connect-trae` 4.18.5 / `dsh-connect-workbuddy` 5.30.0（dingminhua，ES class + 自有默认档广告）、`dsh-our-free-model`（Ebony-Vinyl，plain class + prepareCall 内部直调 this.resolveModel）——全部为普通对象形态、无 Proxy/freeze、不回读 `llm.adapters`，4.4.18 的 registry-entry facade 方案零返工成立。
- 新增 `tests/adapter-matrix.spec.ts`（28 例）：六形态（hub write-through Proxy / vision-router 只读 Proxy / connect class / 内调 class / frozen / getter-only）× 四行为（不写第三方对象 / 不递归 / 八成员透传 + this 绑定 / 幂等不套娃）表驱动全绿；handle.replace 拓扑瞬态用例锁死收敛（重挂裸 adapter → `adapters-updated` 重包，`Object.is` 同一 facade）；混合流用例锁死 our-free-model 式「重注册新实例 + 连续 emit」不套娃。全量回归 285/285。
- README 新增「Third-party adapter compatibility」契约段，面向 connect 插件作者写明三承诺：永不写入第三方对象 / 只替换注册表条目 / 每 inner adapter 单一 facade 幂等标记。

## 4.4.19

- **修复 issue #11：选中 auto 时界面看不到实际生效档位。** 报告人观察到「选 Auto 后请求仍以 high 发出，`lastUsed` 一直是 high、`pending` 一直是 auto」。核实结论：auto 不上送**是设计**（它是 scheduler sentinel，请求期由 `decideEffort` 按工具采样窗口解析成具体档位，有降档行为），`lastUsed`/`pending` 是宿主 `modelSelection` 投影的固有语义（`lastUsed` 每次 `request/header` 被重写、`pending` 匹配 header 提交后清空，二者都不承载用户意图 —— 见 `auto-schedule-projection.ts` 模块注释）。**真正的缺陷是显示**：`tlAutoSchedule` 投影新增 `lastEffective` 字段，折叠已提交的 `request/header` 中的 effective effort（宿主在 `dsh-llm` 里把解析结果写进该事件），选择器 chip 据此显示 `Auto → high`。
  - 为什么不能复用 `directory.current.reasoningEffort`：宿主从 `modelSelection.next`（**下一步**要用的选择，即用户意图）派生它（`dsh-client-ui-model-selection/src/client/directory.ts:178`），选中 auto 时它永远是 `'auto'`，所以旧的 `→ level` 提示永远不显示。
  - 投影 `stateVersion` 1 → 2（形状变更）；历史会话不受影响 —— 投影是日志的折叠视图，冷读会重新折叠出 `samples`/`userEffort`/`lastEffective`。
  - 降级：投影通道缺失（旧宿主、冷会话）时 `lastEffectiveEffort` 为 `undefined`，chip 退回只显示意图标签，不报错（抛错的 inject 会让整个座位让回官方选择器）。
  - 新增 7 个用例：`request/header` 折叠（正常/缺失/非字符串）、引用稳定性（`Object.is` 门控）、冷读重建、注入面降级。

## 4.4.18

- **修复 issue #10（同时覆盖 #9 的形态）：与第三方 adapter 包装器同开时 `resolveModel` 互递归爆栈 / 改写报错。**
  旧实现把 `adapter.resolveModel = wrapper` 直接写在第三方拥有的 adapter 对象上，遇到两种真实插件即失效：
  - `dsh-providers-hub` 用**只有 `get` 陷阱**的 Proxy 包装 adapter，其 `resolveModel` 包装器虽缓存但**每次调用重读** `target.resolveModel`。我们的赋值穿透 Proxy 写到裸 adapter，于是 hub 包装器调到我们的包装器、我们的包装器又调回它捕获的 hub 包装器 → 无限互递归（`RangeError: Maximum call stack size exceeded`，issue #10）。
  - `dsh-vision-router` 用**只读** Proxy 包装（`getOwnPropertyDescriptor` 一律报 `writable: false`），赋值在严格模式下抛 `TypeError: Cannot redefine property: resolveModel`（issue #9）。
  现改为**替换 `llm.adapters` 的注册表条目**（宿主每次调用都即时 `adapters.get(provider)`，无跨调用缓存，故替换对宿主透明），不再向第三方对象写入任何属性。新门面是普通对象而非 Proxy，八个宿主调用成员（`providerInfo` / `providerRetryPolicy` / `imageRequestPricing` / `imageRequestTarget` / `listModels` / `resolveModel` / `prepareCall` / `stream`）全部透传且 `this` 绑定为原 adapter；同一 adapter 服务多个 provider 时共用一份门面（宿主 `forAdapter` 按身份比较决定 replay state 是否保留）。
  #4 的幂等语义保留（同一 inner adapter 只包一次），Off/On 折叠、`low` 门控、非推理模型不动等行为逐字不变。新增 `tests/adapter-facade.spec.ts`（9 例）覆盖两种 Proxy 形态、透传完整性、`this` 绑定、多 provider 身份一致、重跑不套娃、第三方换新实例后重新包装。

## 4.4.16

- i18n: add Portuguese (pt-BR) locale — runtime dictionary, package metadata and README/INSTALL/CHANGELOG mirrors.
- 终端面（dsh-tui / Desktop 命令面板同源）：/think 终端面（当前档 + 切换默认 dry，--yes 才写）。
4.4.14: auto 档简单工具判定修复（issue #8）+ 可配置追加名单 `Config.simpleTools`。

## [4.4.14] — 2026-11-10 (auto 降档：命名空间剥离 + shell/pwsh 内置 + 可配置追加名单)

### 修复
- **issue #8：auto 档在带命名空间工具名宿主恒降不到 `low`**。`SIMPLE_TOOL_RE` 词首锚定导致 `ops_bash`/`ops_grep`/`ops_read_files` 一律判非简单 → `simpleRatio()` 恒 0 → 恒 `high`。新增 `TOOL_NAMESPACE_RE` 先剥 `ops_` 前缀再判（`ops_` 系 dsh-ops 插件族的工具前缀，非宿主通用包装）。
- **命令工具名缺项**：内置简单工具表补 `shell`/`pwsh`/`cmd`/`sh`（此前仅 `bash`/`terminal`），使以 `shell`/`pwsh` 为命令入口的宿主（dsh-bash-terminal-ts、官方 pwsh）短调用也能降 `low`。

### 新增
- **`Config.simpleTools`（追加名单，volatile 热生效）**：逗号/空格分隔的工具名并入内置匹配，同样先剥 `ops_` 再按词边界判定；设置面在「模型能力」块上方新增文本框；9 语 `card.simpleTools`/`card.simpleToolsHint`。

### 测试
- 新增 5 条：shell/pwsh→low、ops_shell→low、配置追加名→low、ops_web_fetch 经剥离→low、词边界仍守 codebase_reader 判 high。全量 234/234。

4.4.9: per-model PDF input declaration + host enumeration addendum for DSH 0.2.1-rc.4.

## [4.4.9] — 2026-10-28 (模型级 PDF 输入声明 + rc.4 枚举)

### 新增
- **模型能力卡「PDF 输入」勾选**：`toggleModelModality` 模态扩为 `video|audio|pdf`，声明写接管传输层 `extraInputs`（宿主模型行 input 枚举仅 text|image）；勾选后该 `provider/model` 可收 PDF，按上传件渲染原生 OpenAI `file` 内容块；能力行增 PDF 徽章；9 语 `card.capabilities.pdf`。

### 元数据
- `engines.dsh` 与全部 dsh peer 同串追加 `0.2.1-rc.4`（15 档枚举；宿主契约面 rc.3↔rc.4 零 diff，声明式 bump）。

4.4.5: host enumeration addendum for DSH 0.2.1-rc.3 (declaration-only bump; contract plane zero diff).


## [4.4.8] — 2026-10-27 (双清单同串修正)

### Fixed
- 4.4.7 发版时只改了 `package.json`，`dsh.plugin.json` 的 `version` 仍停在 4.4.6（并行会话所写），两份清单不同串。4.4.8 将两份统一到 `4.4.8`；`engines.dsh`、`peerDependencies` 与运行时行为与 4.4.7 完全一致，仅元数据对齐。

## [4.4.7] — 2026-10-27 (auto 档真正生效：采样改投影 + 打断宿主回灌 — issue #6)

### Fixed
- `auto` 档不再恒落 `low`。工具采样原先读 `agent.session.events`，而该数组属性只在宿主 0.1.0-rc.8 存在（0.1.2-rc.1 起移除），因此在 14 条支持线中的 13 条上采样恒为 `[]`、`high` / `max` 结构性不可达。现改为注册 `tlAutoSchedule` 投影单元：`apply` 把 `tool/call` 折进容量 8 的环形，宿主侧 `stateOf()` O(1) 读取；首次读会自动 fold 整条内存日志，恢复 / 分叉会话同样完整。宿主已明令禁止新增 `eventAt` / `snapshotEvents` / `ownEvents` 生产调用，故不回绑旧读法。
- `auto` 档不再只在会话首个请求生效。宿主每轮把上一轮 `request/header` 的 `reasoningEffort`（即本插件自己的注入值）当作下一轮种子，旧实现视其为“手动选档”直接透传，档位由此被首轮决定永久锁死。现改为同一投影折入 `model/selection` 事件取会话内的显式选择（该事件唯一生产写点即用户选档命令，插件注入永不写入），种子不再参与手动 / 自动判定 —— 回灌在结构上消失，无需记忆上一轮注入值，resume / fork / 压缩后同样正确。
- 档位来源优先级：会话内显式选择 > 插件配置 `level` > 调度器。
- 0.1.0-rc.8 已知限制：该线注册面无 `stateOf`（旧平面契约），跳过投影注册并继续走 `session.events` 老读法 —— 采样照常，但“回灌”修正不生效。

### Tests
- 215/215：新增投影 reducer、能力门控与 schema 容错用例；`session-events.spec.ts` 改为**诱饵夹具**（同一对象同时提供过期 `events` 数组与投影状态，断言优先取投影），并新增跨四轮会话的回灌仿真（首轮 `low` → 重负载 `max` → 显式选档压住调度）。

## [4.4.5] — 2026-10-21 (toggle fold is openai-completions-only — issue #9)

### Fixed
- A taken-over **Responses / Anthropic** route whose model carries a multi-level `reasoningEfforts` table no longer collapses its effort selector to Off/On. The fold lives in `piAiPosture.thinkingOn`, which previously keyed only on "table present + route in the takeover list"; but the physical reason for the fold (pi-ai rejecting a `reasoning_effort` string outside its fixed seven levels) is a completions-only concern, and on a non-completions route the `supportsReasoningEffort` escape hatch cannot even be written (4.4.4). `piAiPosture` now additionally requires the route's `api` to be `openai-completions` (or absent, pi-ai's default) — the same predicate as the card's `completionsCompatConfigurable`. This single gate fixes both the selector advertisement (`advertiseModelCapability`) and the request-time `toggleOnly` stripping (`capabilityResolver`), so a taken-over Responses route keeps its native `thinkingLevelMap` levels end to end.

### Tests
- 186/186: new `piAiPosture` protocol-gate matrix — Responses/Anthropic taken-over routes do NOT fold, completions (and absent-`api`) routes still DO fold, out-of-takeover Responses never folds, and a completions row declaring `supportsReasoningEffort` is not toggle-only.

## [4.4.4] — 2026-10-21 (compat fields moved out, effort map opened everywhere — issues #7 #8)

### Changed
- The two openai-completions-only switches (`支持 think effort` / `思考格式`) are no longer RENDERED on other protocols — they used to be shown greyed with a long note. They now appear only when the model is **declared a thinking model** AND the route speaks `openai-completions`; everywhere else they are absent from the DOM. Thinking itself stays live on every protocol (protocol-neutral `reasoningEfforts`).
- The **per-level wire editor is no longer trapped in completions** (issue #8). It edits `reasoningEfforts` — the table the host turns into pi-ai's `thinkingLevelMap`, which every protocol reads (Anthropic thinking budget, Responses reasoning effort, completions reasoning_effort string). A thinking model now opens the grid on any protocol; only the completions toggle-style guard (needs `支持 think effort` before offering effort levels) still applies there.
- `toggleEffortCapable` refuses a non-completions entry outright, so no code path can write the field where the host would reject it.

### Fixed
- `applyDraft` used to auto-write `compat.supportsReasoningEffort: true` whenever a non-toggle level was ticked. On a Responses/Anthropic route that field makes the host **reject the WHOLE providers payload** — one tick and the entire save was lost. The side effect is now completions-only, so editing levels outside completions is safe.

### Added
- Leftover audit (`staleThinkingCompatFields`) + one-click cleanup (`stripThinkingCompat`): a model row still carrying `thinkingFormat` / `supportsReasoningEffort` from an older version (or a hand-edited `cordis.yml`) now shows which fields block the next write, with a per-row and a card-wide sweep. Sibling compat fields survive; an emptied `compat` object is deleted rather than left as `{}`.

### Tests
- 180/180: the issue-#7 render matrix (absent vs present by protocol × thinking), the issue-#8 grid-on-every-protocol matrix, the write-recorder bomb regression (mutation-verified: removing the guard fails it), the audit, and the strip writer's sibling/empty-object cases.

## [4.4.3] — 2026-10-21 (thinking stays configurable on every protocol — issue #6)

### Fixed
- Capability card: the 思考 (thinking) checkbox is selectable again on every wire protocol, not only openai-completions. It writes the protocol-neutral `reasoningEfforts` (host llm-pi-ai → `reasoning: true` + `thinkingLevelMap`, which pi-ai maps natively per protocol), so the prerequisite the effort selector needs is back on Responses/Anthropic routes too.
- A non-completions thinking declaration no longer carries the completions-only `thinkingFormat` along: the qwen format autofill is skipped there (a model-level write of it made the host reject the WHOLE providers payload), and `off` keeps a real wire token (`none`) so the Off level stays selectable instead of being marked unsupported by pi-ai.
- `thinkingFormat` / 支持 think effort remain gated to openai-completions — those two ARE completions-only compat fields — and the card note now says exactly that instead of claiming thinking itself is unconfigurable.
- Host-side compat sync: an explicitly non-completions `api` is no longer treated as a custom openai-completions gateway (the baseURL heuristic applies only when no protocol is named), so the auto-sync cannot write completions-only compat into a Responses/Anthropic route.

### Tests
- 168/168: new `writeThinkingRow` protocol matrix (completions / responses / anthropic), the 4.4.x alias, and the sync gateway guard.

## [4.4.2] — 2026-10-19 (card toggles, visible explainer — user feedback)

- The settings-card checkboxes (启用 / 接管主控 / 允许降档 / 允许升档 / 模型界面接管) are now optimistic horizontal pill toggles — click flips instantly, a refused write rolls back.
- The 模型界面接管 row gained a VISIBLE explainer under the row (previously tooltip-only): what ON replaces, what OFF keeps, and that the auto mask still arrives either way.

## [4.4.1] — 2026-10-19 (takeoverUi seat watchdog — desktop field report)

- Fixed: `takeoverUi` now applies live, no reload. The 4.4.0 gate read the settings mirror once at seat-inject time; on the real desktop host the model-seat callback can fire BEFORE the settings channel binds or the mirror folds, so with the switch on the panel never seated (and the official popup stayed with no context chips). Seating is now a watchdog re-evaluated whenever the settings waist binds or any settings change lands: flipping the switch seats the ModelPanel — flipping back returns the shipped ModelSelect — immediately.
- Card: the takeoverUi row is an optimistic horizontal pill toggle (flips on click, rolls back on a refused write).

## [4.4.0] — 2026-10-19 (issue batch: #2 #3 #4 #5)

### Fixed
- Capability card (#2): providers whose `api` is not `openai-completions` (openai-responses family, anthropic-messages …) now grey out the Thinking / Supports-effort / thinkingFormat controls with an explanatory note instead of failing the whole providers write with a generic `card.writeError` — the host's Responses compat gate never offers those model-level fields.
- Load cost (#4): the `resolveModel` advertisement is idempotent again — repeated `llm/adapters-updated` used to STACK wrappers, each replaying a full settings readout (O(models × wrappers) on the model page). The readout is generation-cached (invalidated on settings commits) and the takeover mirror re-check only runs for namespaces that can move the judgment. Note: the 4.3.0 projection stateVersion bump keeps a ONE-TIME history re-fold on the first load after upgrading.
- Effort chip (#5): with the level set to `auto` the panel chip keeps showing **Auto** and demotes the step's resolved level to a secondary `→ <level>` hint, instead of being overwritten by the scheduler's wire value.

### Added
- `takeoverUi` setting (default OFF, #3/#4): the composer keeps the official model popup — native search and loading, and the `auto` mask still arrives through the server-side advertisement; official-model context editing lives on the settings card while it is OFF. Flip it ON to restore the ModelPanel takeover. Reload the page after changing.
- ModelPanel popup search (#3): shown past four models, mirroring the shipped selector's rule.

## 4.3.3 (2026-10-18)

- 计价目录化上线：price-catalog 41 条（国内 30 CNY 峰谷/平价 + 海外 11 USD：Claude 4 官方页一手、GPT 4/Gemini 3 Copilot 计费文档×公告交叉核实），注入型号按目录实价入账、目录外走 estimate 典型价兜底并标「未校准·仅供参考」（免费档调用=按标准价折算的花费/白嫖额度感知）。
- 凭证入账 stateVersion 2→3；设置卡目录外定价五档选择器（9 语）；CATALOG_VERSION 1→2；golden 150/150 绿。

## 4.3.2 (2026-10-18)

- hosts: 追加 0.2.1-rc.2 声明面枚举（宿主 peer 逐包 npm 实测 rc.2 在版；不触 ctx.web provider 与 model.label 槽，代码零改动，纯元数据发版；农场 rc.2 格挂账待命）

All notable changes to `dsh-thinking-levels` are documented here.

- [English changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)
- [Changelog en français](./CHANGELOG.fr.md)
- [Changelog em português](./CHANGELOG.pt.md)
- [Changelog auf Deutsch](./CHANGELOG.de.md)
- [Changelog in italiano](./CHANGELOG.it.md)
- [Список изменений на русском](./CHANGELOG.ru.md)
- [Changelog en español](./CHANGELOG.es.md)

## [4.3.1] — 2026-10-17 (host enumeration: +0.2.1-rc.1)

### Fixed
- `engines.dsh` and the seven `@deepseek-ai/dsh-*` peers append `|| 0.2.1-rc.1` (exact 12-term enumeration, no ranges or carets), so the host compatibility gate accepts DSH `0.2.1-rc.1`.
- `dsh.plugin.json` `engines.dsh` carries the same 12-term enumeration — the gate only reads `package.json`, but the two lists must not diverge.
- devDependencies `@deepseek-ai/dsh-client-*` moved 0.2.0-rc.1 → 0.2.1-rc.1; build and the full suite (140 tests) verified against the target line.
- README compatibility statements (en/zh/ja/ko/de/es/fr/it/ru) synced to the enumeration. No behaviour change in this release.

## [4.3.0] — 2026-10-17

### Added
- Price catalog (src/price-catalog.ts): 29 model entries x region — DeepSeek V4.1-Flash / V4-Flash / V4-Pro carry the official peak/off-peak pairs (Beijing 09-12 & 14-18 peak, schedule effective 2026-08-17); GLM / Kimi / Qwen / Doubao / MiniMax / Ernie carry flat CN rates. Every entry prices three slots per million tokens — non-cached input / cache-hit input / output — and ships asOf + source annotations. Overseas (USD) slots are structurally present but intentionally left empty until official pages can be re-verified: no fabricated numbers.
- defaultPricing setting (cn / global / custom / off, default off): models outside the catalog are no longer estimated at Flash rates — they render as unpriced instead.
- 2026 State Council holiday/make-up correction table (39 rows, shared provenance with dsh-session-guard): make-up-workday weekends count as workdays for peak gating; statutory holidays are off-peak all day. Unknown years degrade to natural-weekend rules.

### Changed
- Projection stateVersion 1 -> 2: each usage sample stores a pricing receipt settled at fold time; same-step replacement subtracts the recorded values (no mixed-rate recomputation, no negative ledgers); session/turn totals are bucketed per currency. After upgrading, old checkpoints are discarded and refolded against the CURRENT catalog — historical totals shift once; afterwards pricing edits only affect subsequent samples.
- Billing popover: currency-aware symbols (¥ / $, unknown currency falls back to its ISO code), honest chips for flat/null tiers, "priced as <model>" derived from the catalog label, and mixed-currency sessions list per-currency rows instead of a fake sum.
- matchedModel / unitPricePerM deprecated (dual-written for one more generation).

### Fixed
- settings.describe() shape normalization: in-process array vs RPC {namespaces:[...]} envelope — exotic shapes now read as absent instead of throwing into a swallowed catch (the silent-freeze failure class).
- Projection registration is try/catch-guarded: a billing-unit failure hides the billing section instead of poisoning the whole plugin fiber or cold session history.

## [4.2.1] — 2026-10-12

### Changed — stable promotion (no code changes since 4.2.0-beta.29)

- **The 4.2.0-beta line graduates to stable.** This release carries the beta.18 →
  beta.29 arc: cross-version family section (`installLegacySection`, beta.26),
  family tab strip wrap (beta.27), legacy plugins-page item card retirement
  (beta.28), 0.1.0-rc.8 cold-session history fix (beta.29). `engines.dsh` keeps
  the full 11-line enumeration (0.1.0-rc.8 → 0.2.0-rc.2), so the npm `latest`
  channel now points at a multi-line stable release.
- **Dual-manifest drift fixed:** `dsh.plugin.json` was still stamped
  `4.2.0-beta.28` (the beta.29 bump missed it); both manifests now read 4.2.1.

## [4.2.0-beta.28] — 2026-10-08

### Removed

- **The legacy plugins-page item card (`settings.plugin.item`) is retired.** It
  duplicated the family-tab card on the ≤0.1.5 plugins page; the 起子插件设置
  family tab is now the single settings surface on every host generation
  (matching session-guard / free-search / browser-cdp / preset-manager).

## [4.2.0-beta.27] — 2026-10-08

### Fixed

- **Family tab strip wraps at container width** instead of overflowing into a
  horizontal scrollbar: the tablist drops `flexWrap: 'nowrap'` + `overflowX:
  'auto'` (the single-row-strip design from 063d9fd) for plain `wrap`, and the
  buttons lose their `flex: 0 0 auto`. With seven+ contributor tabs (thinking
  levels, session guard, search index, CDP, MCP registry, steward, input
  traffic — perm-gate and context-compression joining in compat releases) the
  strip now flows onto following rows on every host generation ≤0.1.7.

## [4.2.0-beta.26] — 2026-10-08

### Added — cross-version family section (beta.18 → beta.26)

- **Server-side legacy settings section (`installLegacySection`).** The family
  section (起子插件设置) now registers the `thinking-levels` namespace server-side
  so it renders with real data on hosts ≤0.1.7, across the three generation
  shapes (module-level `installSettingsSection`, instance `installSection`,
  loader-volatile on rc.1+), with a plain non-volatile `LegacyConfig` schema and
  a flattened plain base (volatile nodes and live refs are both rejected by the
  legacy register — three stacked bugs fixed across beta.18 → beta.22).
- **Family section election hardening (beta.26).** The `settings.section`
  factory stands down when a `dsh-family` entry is already seated (host-native
  surface or a rival): exactly one owner regardless of registration order.
  Pairs with dsh-session-guard 4.1.11's deferred yield-election — ≤0.1.7 shells
  give every same-id section its own nav row, so double registration meant a
  double 起子插件设置 row.
- **UI fixes (beta.23 → beta.25).** The family tab strip stays on a single row
  (horizontal scroll; 8 contributor tabs no longer orphan the last one onto a
  second line); settings controls follow the shell dark theme (semi-transparent
  surface instead of hardcoded white, `colorScheme` from a one-shot body
  luminance probe); the children declaration tolerates a conflict by landing
  without it; life-cycle debug logs kept in production.

## [Unreleased]

### Added — effort slider (whale-girl runner thumb) — 4.1.0

- **The model panel's per-line effort `<select>` became a segment slider.** Click a line's
  effort chip and a full-width slider expands under that line: the stop count adapts to the
  model's advertised efforts, `auto` is pinned leftmost (then `off`/`on`, the strength
  gradient, unknown gateway wire values last), the thumb follows the pointer continuously
  and snaps on release (one route write per gesture), ←/→/Home/End step stop-by-stop, and
  the old "Provider default" reset survives as the ↺ button of the slider row.
- **Whale-girl runner thumb on DeepSeek lines.** Official DeepSeek routes and gateway
  models whose id/name says deepseek run an 8-frame side-run strip as the thumb (ping-pong
  loop, 720 ms per direction at rest / 420 ms while dragging, frozen under
  `prefers-reduced-motion`); every other model keeps a plain white knob. Community
  whale-girl artwork sourced from HanaAyane/dsh-reasoning-effort
  (`assets/chibi-runner-strip.png`); regenerate via `python tools/whale-mascot.py`.
- **Pure slider helpers** exported from `thinking-level` (`orderEffortsForSlider`,
  `nearestEffortStopIndex`) with unit coverage.

## [4.0.0] — 2026-09-29

### Changed — DSH 0.2.0-rc compatibility

- **Peer gate retargeted to the 0.2.0-rc segment.** All seven `@deepseek-ai/dsh-*` peer
  declarations and `engines.dsh` now read `>=0.2.0-rc.1 <0.2.1-0` (replacing
  `>=0.1.7-rc.1 <0.1.8-0`). Hosts on 0.1.7-rc.1 to < 0.2.0 stay on the 3.x line
  (npm dist-tag `dsh-0.1.7`, 3.4.3); hosts below 0.1.7-rc.1 stay on 3.0.2.
- **devDependencies moved to the 0.2.0 line** — `dsh-client-locale` / `dsh-client-ui-renderer` /
  `dsh-client-ui-settings` / `dsh-client-ui-slots` / `dsh-client-store` → `0.2.0-rc.1`, and
  `@deepseek-ai/cordis` → `^4.0.4` (required by the 0.2.0-rc.1 client packages' `~4.0.4` peer) —
  so typecheck / tests / build run against the real 0.2.0-rc.1 types.
- **Metadata hygiene:** `dsh.plugin.json` version and `engines.dsh` synced to 4.0.0 and the
  0.2.0-rc segment; `publishConfig.tag` → `dsh-0.2.0` with a new `release:4x` script so a
  publish can never overwrite the `dsh-0.1.7` / `latest` tags; both lockfiles
  (`package-lock.json` / `pnpm-lock.yaml`) regenerated against the 0.2.0 dependency tree.
- **No host-half or client-half code changes.** The packages this plugin imports
  (`dsh-client-locale`, `dsh-client-store`, `dsh-client-ui-renderer`, `dsh-client-ui-settings`,
  `dsh-client-ui-slots`) change only their package version between 0.1.7-rc.2 and 0.2.0-rc.1;
  the `settings` / `llm` service faces and the `llm-pi-ai` adapter are unchanged too. The full
  suite (lint / typecheck / 71 tests / build) passes unchanged against 0.2.0-rc.1.

### Fixed — duplicate Plugins settings entry — 2.0.0-beta.4

- **Removed the `settings.plugins.tab` registration.** The 0.1.5 compat work assumed DSH 0.1.5
  had removed the `settings.plugin.item` seat, but the released 0.1.5-rc.2 (and 0.1.6-alpha.1)
  `ui-settings-plugins` still declares it as the child of the built-in configurable Plugins tab.
  With both seats declared, the two registrations both fired and the plugin appeared twice in
  Settings → Plugins: once as an item card in the configurable list and once as a dedicated
  top-level tab. The item card alone covers every supported line, so the tab registration is
  gone (with its `ctx.locale.bind` label thunk).

### Changed — DSH 0.1.5-rc compatibility — 2.0.0-beta.3

- **The settings card rides the new 0.1.5 seat.** DSH 0.1.5 renamed the Plugins settings card
  seat from `settings.plugin.item` to `settings.plugins.tab` (`id` = tab key, `order`, and a
  registrant-localized `label`). Both registrations are declaration-gated via
  `ctx.slots.inject`, so the card mounts on whichever seat the running host declares —
  0.1.5+ hosts get the tab, 0.1.2–0.1.4 hosts keep the legacy card. The tab label is a
  read-time thunk over `ctx.locale.bind(NS)`, so it follows locale switches.
- **`ctx.slots` typing restored.** The `Context.slots` augmentation used to arrive
  transitively through the (now deleted) `dsh-client-runtime` package; 0.1.5 moved it to
  `@deepseek-ai/dsh-client-ui-renderer/client`, which the client half now imports.
- **devDependencies pinned to 0.1.5-rc.2** and the whole suite (typecheck / lint / 65 tests /
  build) verified against that tree. Host-half APIs (`settings.register/get/update`,
  `settings/document-updated`, `agent/request`) are unchanged in 0.1.5-rc.2 — no host changes
  were needed.
- Verified against 0.1.5-rc.2 contract surfaces unpacked from npm: `conversation.input.right`,
  `settingsScope.bind`, locale overloads, and the settings service face are all preserved.
- **`lib/` is committed to git.** `package.json` ships `files: ["lib", …]` and points `main` /
  `types` / `exports` at `lib/`, but `.gitignore` still listed `lib/` — so a GitHub-based install
  (which runs no build) received a package with no entry point. The built artifacts are now in
  version control, and a rebuild reproduces them byte-for-byte (no content diff, only the
  `core.autocrlf` line-ending noise).
- **`engines.dsh` narrowed to the segment this line actually implements**: the previous
  `>=0.1.2-alpha.1 <0.2.0-0` admitted 0.1.2–0.1.4 hosts, where the client half cannot compile
  against the renamed Plugins settings seat this line registers. It is now
  `>=0.1.5-alpha.1 <0.2.0-0` (and `node` narrowed to `^22.19.0 || >=24.0.0`, matching the
  toolchain). `publishConfig` pins `registry` + `tag: beta` so a bare `npm publish` can neither
  misresolve the mirror nor overwrite the stable `latest` line, and `pnpm-lock.yaml` is
  tracked as part of the compatibility contract rather than treated as a local artifact.
- **A pnpm `allowBuilds` placeholder no longer blocks installs.** `pnpm-workspace.yaml` carried
  pnpm's literal `set this to true or false` stub, which aborted every `pnpm install` with
  `ERR_PNPM_IGNORED_BUILDS`; it now reads `esbuild: true`.

### Changed — the context control lives in the composer row — 2.0.0-beta.2

- **The context-window quick control sits in the composer tool row again**
  (`conversation.input.right`, next to the model/effort control). The model card is not an option:
  the shipped `ModelSelect` calls `renderSlot` zero times and owns its popup outright, so the
  `conversation.input.model.section` seat declared in `2.0.0-beta.1` is rendered by no released
  harness — a plugin cannot put a row inside that card on its own. `conversation.input.right` is a
  session-scoped `list` seat any plugin may occupy, which is where a tool-row control belongs.
- **The slot-entry crash stays fixed.** The old pill called a standard seat as a bare getter
  (`useSession()`) — every renderer seat is a `useSyncExternalStoreWithSelector` selector hook, so
  the call threw `TypeError: l is not a function` and took the whole entry down on each render. The
  control now reads the active model through a mandatory selector.
- **The model source is seat-agnostic.** It prefers the session `useTrajectory` seat (the request
  ledger, DSH 0.1.2+) and falls back to `useConversation`
  (`ConversationSnapshot.views.get('trajectory')`) on harness lines without it; a harness that
  provides neither seat renders nothing instead of a dead control.
- **The popover is one slider row**: preset slider (64K / 128K / 256K / 400K / 512K / 1M) writing
  once per gesture (pointer release, key release, blur), the committed value, a collapsed
  custom-integer editor (`⋯`) and Clear. The pill shows the value only; `input.context.*` copy is
  restored in all four dictionaries.
- **Unchanged: the settings card editor.** Per-model context-window presets, the custom integer and
  Clear stay exactly as they are, writing the same `llm-pi-ai` / `llm-deepseek` namespaces.

### Breaking — DSH v0.1.2+ only (`dsh-client-runtime` removal) — 0.7.2-beta.1

- **`engines.dsh` is now `>=0.1.2-alpha.1 <0.2.0-0`.** `@deepseek-ai/dsh-client-runtime`
  was deleted wholesale in `0.1.2-alpha.1` (commit `be531688f3`); that release is the hard
  segment boundary. The previous plugin line (`0.7.1-beta.2` and earlier) keeps serving
  DSH 0.1.0 / 0.1.1.
- **`ClientContext` is gone.** `src/client/index.ts` now imports
  `Context as ClientContext` from `@deepseek-ai/cordis`, matching every official client
  plugin. `@deepseek-ai/dsh-client-runtime` is removed from `peerDependencies`,
  `peerDependenciesMeta` and `devDependencies`, so it no longer blocks install.
- **`src/types/contracts.d.ts` loses the ambient
  `declare module '@deepseek-ai/dsh-client-runtime/client'` mirror.** `SettingsScope`
  gains the `base` / `user` / `revision` snapshot fields and `bind` takes an optional
  `decode`; the `SlotsFace` mirror stays (the real `SlotRegistry` in
  `@deepseek-ai/dsh-client-ui-renderer` supplies it at runtime).
- **`dsh.client.inject` lists `@deepseek-ai/dsh-client-ui-renderer`**, the package that
  provides the `slots` service this plugin registers into.
- **Localized registration split by overload.** The bulk
  `register(ns, dicts)` form is typed to the built-in locale ids (`zh` / `en` only), so
  the shipped `ja` / `ko` dictionaries now go through the single-locale
  `register(ns, locale, dict)` overload and are disposed together. Behaviour is
  unchanged; the call now typechecks against the real locale package.

### Removed

- **Dead `agent/tool` listener.** The per-tool wall-clock telemetry registered a
  `ctx.on('agent/tool', …)` handler that kept a `started` map and logged
  `tool … took …ms`. DSH has no such event in either 0.1.1-rc.2 or 0.1.2-rc.1 — the
  scope-event registry (`packages/core/scope/src/scoped-events.generated.ts`) lists twelve
  `agent/*` events and `agent/tool` is not one of them — so the handler never ran and the
  log line was never emitted. Removed the listener, its `started` map, the `pruneStale`
  sweep and the `TOOL_AGE_LIMIT_MS` constant.
- **The effort scheduler is unaffected.** Tool recognition is a *pull*, not a push: the
  `agent/request` waterfall calls `recentToolCalls(payload.agent)`, which reads the
  `tool/call` records out of `agent.session.events` and feeds `scheduleEffort`. That path
  has its own tests (`tests/session-events.spec.ts`, `tests/thinking-level.spec.ts`) and
  was untouched.

### Fixed — mainline renumbered to 2.x — 2.0.0-beta.1

- **The context-window quick control crashed its slot on every render.** `ContextQuick`
  called the session standard seat as a bare getter (`useSession()`). Every renderer standard
  seat is a `useSyncExternalStoreWithSelector` *selector hook* bound by `bindSnapshotSelector`
  (`@deepseek-ai/dsh-client-ui-renderer`), so the call reached the shim with
  `selector === undefined` and threw `TypeError: l is not a function`: the
  `conversation.input.right` entry died and the slot error boundary rethrew it on each render.
  The same component also read `session.views.get('trajectory')`, a field `SessionSnapshot`
  never carried (views belong to `ConversationSnapshot`), so it could not have resolved a model
  even without the crash. The active model now comes from the session `useTrajectory` seat
  through a stable module-level selector over the request ledger.
- **The control moved into the model menu card.** It registers into
  `conversation.input.model.section` — the strip ui-model-selection renders under the Model /
  Reasoning-effort rows — as a compact slider row: a preset slider (64K / 128K / 256K / 400K /
  512K / 1M) that writes once per gesture (pointer release, key release, blur), the committed
  value, a collapsed custom-integer editor and Clear. The copy is down to the row label, the
  value and Clear. The composer-row pill is gone; the settings card keeps the full per-model
  editor. The row appears on harnesses whose model seat declares that child slot (added in
  `packages/client/ui-model-selection`); on older harnesses the registration stays pending and
  the settings card remains the editor.
- **`dsh.plugin.json` version synced** with `package.json`; the 0.7.2-beta.1 tarball had
  shipped it as 0.7.1-beta.2.
- **Version renumbering: the line is now the major digit.** This mainline (DSH 0.1.2+) moves
  to **2.x**, the legacy line (DSH < 0.1.2, branch `compat/dsh-0.1.1`) to **1.x**, so an
  installed version states which harness segment it serves. npm dist-tags keep their roles:
  `beta` = this line, `compat` = the legacy line. Nothing else changes for existing installs;
  a `0.7.x` range simply does not match `2.x`, so the switch is explicit.
- **The model-menu row needs a harness that declares the seat.** `conversation.input.model.section`
  is added to `packages/client/ui-model-selection` (declaration + `renderSlot` call); until a
  harness release carries it, the registration stays pending and the settings card remains the
  editor. No released harness has it today.

## [0.7.0] — 2026-09-09

> **Stable release.** The short-circuit route is retired; all gateway fixes now ride the official `llm-pi-ai` compat surface (dsh ≥ **v0.1.0-rc.8**). This version also includes the context-window presets from the earlier 0.7.0 draft.

### Added

- **Multi-level context-window presets** in the per-model capability editor: `64K / 128K / 256K / 400K / 512K / 1M` preset buttons plus a custom integer input and clear button, written to the `llm-pi-ai` model `contextWindow` and consumed live by the harness (compaction / context-overflow detection / context-pressure projections) on the next request — no restart needed.
- New pure module `src/context-window.ts` (range constants `2000`–`1_000_000`, preset list, `formatContextWindow`, `validateContextWindow`) shared by the config schema, the settings card and the tests.
- Config surface: `models[].contextWindow` override accepted with integer `2000`–`1000000` validation (fail-loud on out-of-band values).
- New `zh` / `en` / `ja` / `ko` copy for the context-window control.
- Added `dsh.plugin.json` with `engines.dsh: ">=0.1.0-rc.8"`.
- Added `peerDependencies` for `dsh-client-runtime`, `dsh-client-locale`, `dsh-client-ui-settings`, `dsh-client-ui-slots` (all optional).

### Removed

- **The short-circuit takeover bridge**: the plugin no longer maintains the `llm-openai-completions` takeover list (`nextTakeoverSection` / `TakeoverSection` are gone). The adapter plugin `dsh-llm-openai-completions` is NOT needed alongside this release and can stay uninstalled.

### Changed

- **Auto-compat bridge rewritten onto the official compat surface** (`withOfficialCompatFixes`): for every custom openai-completions gateway route that declares thinking, the sync now writes
  - route-level `compat.supportsDeveloperRole: false` (system prompt sent as `system` — fixes the vLLM/SGLang `Unexpected message role` 400), and
  - model-level `compat.thinkingFormat: 'qwen-chat-template'` on toggle-style thinking rows (no row-level effort support) so pi-ai sends `chat_template_kwargs.enable_thinking` — bare vLLM servers ignore the top-level `enable_thinking` of the plain `qwen` format.
- Storage pattern follows dsh-thinking-effort's host side: read → pure transform (identity when nothing to change) → whole-section `settings.update('llm-pi-ai', …)`, so dsh's `llm-pi-ai` schema validator gates the write where it is WRITTEN; a dsh predating rc.8 rejects the unknown field and the sync logs and keeps the previous section. Explicit values on any layer are respected and never clobbered.
- **Capability card de-short-circuited**: the "short-circuit takeover" switch is replaced by a per-provider **"gateway rejects the developer role"** switch (writes/clears the route-level flag; unchecking restores inheritance). The takeover-list gating is gone — every llm-pi-ai provider's models are directly editable, in progressive layers: ① thinking + vision → ② effort support (thinking models only) → ③ effort wire editor → ④ thinkingFormat → ⑤ context window. Toggling thinking on a toggle-style model auto-fills `thinkingFormat: 'qwen-chat-template'` (only when absent); enabling effort removes it again.
- `declaresThinking` now also scans `modelOverrides` (previously only `models[]`), so modelOverrides-only routes are identified and fixed too.
- The adapter-posture read gate (`takeoverOf` / `piAiPosture`) is kept but inert: with the adapter absent it yields native pi-ai semantics.
- The context badge now reuses the shared `formatContextWindow` so written presets display exactly (e.g. `256000` → `256K`, `1000000` → `1M`).

### Notes

- Requires dsh ≥ **v0.1.0-rc.8** for the official compat surface. On older dsh the schema refuses the compat fields (fail-loud, no silent misconfiguration).
- Response-side inline `<think>` splitting remains a gateway concern: bare vLLM needs `--reasoning-parser qwen3`; pi-ai (≤ 0.85.1) parses only `reasoning_content` / `reasoning` / `reasoning_text`. `qwen-chat-template` does not carry `reasoning_effort` (the format branches are mutually exclusive) — effort levels drive `enable_thinking` on/off only. True parallel (chat_template_kwargs + reasoning_effort) needs an upstream pi-ai change.
- Verification materials live on the `check` branch (`check/CHECK.md`, `check/record-proxy.mjs`, `check/settings-route.example.yaml`); they are not part of the npm package.

## [0.6.0] — 2026-02-?

### Added

- **Eight standard levels** aligned with dsh-thinking-effort: `off / on / minimal / low / medium / high / xhigh / max` (plus the `auto` scheduler mask). `on` is the enable-thinking toggle, clamped to the model's default strength (`high` or the highest advertised thinking level); `minimal` / `medium` / `xhigh` pass through when a custom gateway advertises them and collapse onto `high` on the official adapter.
- **Custom wire mapping in the settings card** (borrowed from dsh-thinking-effort): each level can be ticked and given the exact value sent to the gateway (e.g. `high` → `ultra`); `off` left empty means "do not send". Stored as the model's `reasoningEfforts` table.
- **Settings-card presentation overhaul** (borrowed from dsh-thinking-effort): providers group their models, each model row shows text/image/context badges, models expand into a per-level editor, a search box filters models, and one-click presets (official DeepSeek style / generic) apply to every thinking model.
- **Multilingual**: Japanese (`ja`) and Korean (`ko`) dictionaries, plus `README.ja.md` / `README.ko.md`, `INSTALL.{md,zh,ja,ko}.md`, and `CHANGELOG.{md,ja,ko}.md`. Note: the official DSH locale runtime still exposes only `zh` / `en`, so `ja` / `ko` selection requires a DSH fork (see README compatibility note).

### Changed

- `level` config surface accepts the full nine values (`off | on | minimal | low | medium | high | xhigh | max | auto`).
- `models[].efforts` override accepts the extended levels.
- Card renderer refactored; capability editors now use a staged wire draft with an explicit **Apply levels** button instead of immediate checkbox commits.

### Fixed

- `effortLevelsOf` unused helper removed; legacy `_N` unused-parameter lint warning silenced.

## [0.5.2] — 2026-02-?

### Added

- **Auto-takeover of `dsh-llm-openai-completions`**: providers that are custom openai-completions gateways (`api: openai-completions` or non-official baseURL) **and** declare a `reasoningEfforts` table on any model are merged into `llm-openai-completions.providers` with `enabled: true`. Runs on plugin start, `llm/adapters-updated`, and settings changes; soft-coupled (skips the write when the namespace is unregistered).

## [0.5.1] — 2026-02-?

### Added

- Model-capability editor card: vision / thinking / supports-effort / effort levels / thinking format for every custom `llm-pi-ai` provider model, written straight to the `llm-pi-ai` settings namespace (no official-package changes).

## [0.5.0] — 2026-02-?

### Added

- Model-aware guard: never send `reasoning_effort` to a model that does not advertise it (custom openai-completions routes such as Qwen3.6 are stripped instead).
- `low` passthrough on dsh rc.7+; rc.6-era adapters can advertise `low` via a configurer-confirmed `models` override.
- `models` config section (`provider/model` → `vision` / `thinking` / `efforts`).

## [0.4.1] — 2026-02-?

### Fixed

- Adapter `resolveModel` wrapper now re-runs on `llm/adapters-updated` so the `Auto` mask appears even when adapters register after plugin apply.

## [0.4.0] — 2026-02-?

### Changed

- Removed the value dependency on `@deepseek-ai/dsh-settings`; settings registration goes through the cordis `settings` service (local `installSettingsSection` equivalent).
- Card registration supplies both `id` and `key` so it works on CLI (keyed) and DSH Desktop (list) slot declarations.

## [0.3.0] — 2026-02-?

### Added

- Model-selector `Auto` (mask): injected into adapter `resolveModel` efforts; the plugin schedules `low` / `high` / `max` per step via the `agent/request` waterfall (registered with `prepend` so the session model-selection assembly cannot overwrite it).

## [0.2.1] — 2026-02-?

### Fixed

- Added `exports["./client"]` so the client bundle is discovered by dsh's client-modules loader.

## [0.2.0] — 2026-02-?

### Added

- First client settings card (level picker + scheduler toggles).

## [0.1.1] — 2026-02-?

### Fixed

- Publish compiled `lib/` instead of raw TS sources (Node 22 forbids type-stripping `.ts` under `node_modules`).

## [0.1.0] — 2026-02-?

### Added

- Initial release: `agent/request` injection of a fixed reasoning effort.## 4.2.0-beta.29 - 2026-10-08

### Fixed

- **0.1.0-rc.8 cold-session history killer**: the host's `sessionProjections`
  registry on 0.1.0-rc.8 is the ONLY flat-contract line (`def.schema.parse(
  def.view(state))`); every newer line (0.1.1+) consumes the `stateSchema`/
  `wire` shape the billing unit registers. On 0.1.0 the unit arrived with
  `schema === undefined`, so EVERY cold-session history read threw
  "Cannot read properties of undefined (reading 'parse')" — one schema-less
  unit poisoned the whole workspace's history (2026-10-08 five-cell
  reproduction). The registration now mirrors `wire.viewSchema`/`wire.view`
  into the flat `schema`/`view` keys; both registry generations take what
  they expect and newer lines are unaffected.


