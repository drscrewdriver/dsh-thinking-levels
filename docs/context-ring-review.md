# Context Ring — 变更审阅单（feat/context-ring）

> 本分支保全圆环全部工作（3e9725f 快照 + 本文）。main（e29ee45）已摘除圆环 UI，
> 保留自建 tlCacheBilling 投影单元与 zod 依赖（自包含、有测试）。

## 为什么拆出来
- 复盘发现**官方 ContextMeter 从未被移除**：它挂在 dock 容器，无读数
  （contextOccupancy null）时自隐藏——"容量显示被顶掉"的前提部分不成立。
- 圆环本体在模型位内无法渲染的运行时谜题未解（见下），不宜继续占用主线。

## 提交序列（本分支，自旧到新）
| commit | 内容 | 状态 |
|---|---|---|
| 501ab5c | ring v1：挂 conversation.input.right，容量检查弹窗 | 挂载实证（3091） |
| eebf97b | 字段映射修复：projectedTokens/pressureTokens（照抄官方 contextOccupancy） | 读数 1% 与官方口径一致 |
| a58f3c2 等 | （主线全 rc 合并，非圆环） | — |
| e294f1f | ring 挪进模型位面板、选择器右侧 | 位置符合要求但**未渲染** |
| 94511f6 | 数据改走 input.right 零尺寸 hook → 模块 store | hook 挂载实证（fiber props 含 useProjection） |
| 1254b64 | store 发布改不可变替换（useSyncExternalStore 引用比较） | 修复理论根因 |
| bdf0ac2 | 容量回退：投影无 contextWindow 时用模型目录声明 | 未真机复验 |
| 3e9725f | 诊断插桩快照（含一个已知 ReferenceError：data-seat effect 引用了 ContextRing 作用域的变量） | 诊断用 |

## 未解谜题（接手者先读）
ring 在模型位内 return null（hasSeat=false）——即 store.seatMounted 未置。
但运行时实证：①input.right 条目的 standard seats **确实含 useProjection**
（fiber props 链探测）；②hook span 在 DOM。publish 走不可变替换后理论链路
完整，ring 仍不渲染。下一步排查建议：
1. React effect 执行顺序：input.right 与 model seat 分属两个 slot entry 的
   提交/Effect 批次，ring 的 useSyncExternalStore 订阅时机是否错过 publish
   且 getSnapshot 比较未触发重渲（可试把 store 改为 useReducer 形态）；
2. hook 的 `useProjection?.('contextPressure')` 在条目渲染上下文里是否真的
   拿到值（0.2.0 探针显示调用抛 React #321——evaluate 环境调用非法，需在
   组件渲染内插桩打印）；
3. **注意 3e9725f 的已知 ReferenceError**（data-seat effect 引用错作用域）会
   让 hook 的第二个 effect 每次渲染抛错——先修它再复测。

## 与官方环的关系
- 官方 ContextMeter（dock 容器）与圆环数据同源（contextPressure/breakdown）。
- 官方有的：百分比、~used/window、三段条、官方弹层（三段明细）。
- 圆环增量：容量回退（模型目录声明）、缓存账单（tlCacheBilling 三级嵌套）、
  ≥85% 预警、与档位滑块同面板。若产品上官方环够用，圆环可以不回主线。
