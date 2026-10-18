# Findings

## 关键事实纠偏
- **价格兜底没有 commit**（用户原以为有）：`git log` HEAD=`154faec`（tag v4.3.1，"hosts: add 0.2.1-rc.1 to 12-term enumeration"）；兜底全部改动处于**工作树未提交**态——16 文件：`src/price-catalog.ts`、`src/billing-projection.ts`、`src/index.ts`、`src/client/card.tsx`、`src/client/context-ring.tsx`、`src/client/locales.ts` + `tests/{price-catalog,billing-projection}.spec.ts` + `lib/*` 8 件重建产物。
- 兜底代码实体已核实在工作树：`PricingPolicy` 含 `'estimate'`（price-catalog.ts:38）、注释"目录外典型价兜底估算，未校准仅供参考"、`billing-projection.ts:528 stateVersion: 3`。
- 本计划的地基 = **T1 先把兜底落成 commit**，rc.2 补串叠在其上（用户说的"那之上做"语义按此实现）。

## 发布与闸门判定事实
- 本仓**声明了 `engines.dsh`**（ENUM12 串尾 `0.2.1-rc.1`）→ 宿主 ≥0.2.1-alpha.4 起该 range **单独裁决、peers 全忽略**（闸门换代，官方指南 `plugin-engines-dsh`；台账 VD-020-021-01）→ **不补 rc.2 串 = rc.2 宿主拒载，无侥幸**。
- `publishConfig.tag = 'dsh-0.2.0'`（钉死旧线）：裸 `npm publish` 会静默打旧 tag——本批必须显式 `--tag dsh-0.2.1-rc.2`（纪律记忆 §6 点名仓之一）。
- npm 现状（registry.npmjs.org 实测）：`latest=4.3.1`、`dsh-0.2.1-rc.1=4.3.1`、`dsh-0.2.0=4.3.0`；4.3.2 未占用。
- 装机双通道不同构：**desktop = 本地 tgz `file:` 指针**（`dsh-thinking-levels-4.3.1.tgz`）、**web = npm 版本号** `4.3.1`——升 4.3.2 需分别处理（desktop 先 pack 新 tgz 再改指针）。

## rc.2 触面核查（零代码依据）
- rc.1→rc.2 插件可见面仅两处（tag 探针全量核过）：`ctx.web` 缝 +provider（不触）；`conversation.input.model.label` 槽新增官方 occupant。
- thinking-levels 注入槽实测为 `conversation.input.model` / `conversation.input.right` / `settings.section` / `plugins.bundle.config` / `dsh-family.tab`——**与 1017 徽章槽名不同、不相撞**；但物理同区（模型选择器附近），冒烟阶段目视一眼即可，不是代码风险。
- 闸门/settings/vendor/slot 结构/会话 V4 在 rc.2 零 diff（探针 13 列全等）→ 除枚举串外无任何必改项。

## 架构决策沿用
- 兜底基线（2026-10-18 裁决）：目录外非 off/custom 档一律 `BILLING_FALLBACK` 典型价入账 + `estimated=true`；显式 `off` 才显示「未计价」；页脚「未校准·仅供参考」。
- stateVersion 2→3：ver2 凭证缺 `estimated` 字段不可原样过新 schema，冷重放按当前目录重折、总额一次性位移——**发布注记必须声明**（无迁移垫片）。
- 本仓无 `scripts/hosts.mjs` 单源（与 21 仓治理批差异点）：同串靠手工逐点位 + grep 核验；hosts:check prepack 门禁在本仓**不存在**，勿写进验收。

## 约束与风险
- 工作树含 lib 重建产物：commit 1 必须 src+lib+tests 同提交（prepack-stale-build 防线）；提交前跑一遍 build 确认 lib 与 src 逐字节对应。
- Electron 桌面端会并发重写 profile package.json（含 UTF-8 BOM 陷阱）：desktop 换 tgz 用"改指针+pnpm install+核验"链式一次过。
- 旧批次（3.4.3）四件套内容已被本批覆盖，原文可 `git show HEAD:spec.md` 找回。
- npm packument 传播滞后 ~60s：publish 后先 `npm view dsh-thinking-levels@4.3.2` 可达再装 web profile。
