# Spec: dsh-thinking-levels 4.3.2 —— 价格兜底落账 + 0.2.1-rc.2 兼容声明

> 基线：HEAD `154faec`（v4.3.1，ENUM12 止于 `0.2.1-rc.1`）；工作树含未提交的兜底改动（16 文件）。
> 本批两件事合成一次发版：**先提交兜底（feat），再补 rc.2 串（hosts），一次 bump 4.3.1→4.3.2 发布**。

## 需求
- R1 价格兜底改动入库：目录外模型缺省 `estimate` 典型价入账 + `estimated=true` 诚实标注 + stateVersion 3 + 设置卡"目录外定价"下拉 + 9 语文案（已完成开发，仅缺提交，见 T1）。
- R2 0.2.1-rc.2 兼容声明：`engines.dsh` 与全部 `@deepseek-ai/dsh*` peers 同串追加 ` || 0.2.1-rc.2`（ENUM12→ENUM13）。**硬需求**：该包声明了 `engines.dsh`，≥a.4 闸门由它单独裁决——不补串在 rc.2 宿主上直接 `incompatible-version` 拒载。
- R3 版本与凭证：bump 4.3.1→4.3.2（package.json + dsh.plugin.json 双清单）、CHANGELOG 8 语（含 stateVersion 冷重放一次性位移声明）、README 兼容行。
- R4 发布：`npm publish --tag dsh-0.2.1-rc.2` + `dist-tag add latest`（**禁止裸发**——本仓 `publishConfig.tag` 钉死旧线 `dsh-0.2.0`）。
- R5 装机：desktop（`file:` tgz 通道）+ web（npm 通道）双 profile 升 4.3.2，rc.2 宿主装载冒烟零 FAILED。

## 技术方案
- **提交切分**（两 commit，顺序固定）：
  1. `feat(billing): out-of-catalog estimate fallback ...`（16 文件全量：src×6 + lib×8 + tests×2，lib 与 src 同 commit 防 stale-build）；
  2. `hosts: add 0.2.1-rc.2 to 13-term enumeration (4.3.2)`（package.json engines+12 peers、dsh.plugin.json version、README×2 兼容句、CHANGELOG×8）。
- 声明点位（本仓无 `scripts/hosts.mjs` 单源，手工同串，逐点位 grep 核）：
  - `package.json`：`engines.dsh` 1 处 + peerDependencies 12 处（全部 `0.1.0-rc.8 || … || 0.2.1-rc.1` 同串行尾追加）；
  - `README.md` / `README.zh.md` 兼容版本句（如有枚举行）；
  - `dsh.plugin.json` 仅 version 字段（不含枚举）。
- semver 双向验证（includePrerelease）：`satisfies('0.2.1-rc.2')=true`、`satisfies('0.3.0-rc.1')=false`、`satisfies('0.2.1-alpha.5')=false`（α.5 未在枚举，拒为正确行为须与 4.3.1 现状一致）。
- 发版门禁：typecheck → vitest（148 基线）→ build → pack → V1-V6（双清单同号、同串 13 项逐 peer、lib↔src 哈希、registry 钉死、tag 显式）→ L3 深度评审。
- 装机：`npm pack --pack-destination .` 出 `dsh-thinking-levels-4.3.2.tgz`；desktop 改 `file:` 指针 + "改串+连装一次过+剥 BOM"链式命令（Electron 并发覆盖陷阱）；web 走 npm `4.3.2`。

## 决策记录
| 选项 | 选择 | 理由 |
|------|------|------|
| 兜底与 rc.2 补串分两次发版 vs 合一 | **合一（4.3.2）** | 兜底未发版即无存量用户；rc.2 拒载急修，合一省一轮装机冒烟 |
| 是否顺手删 engines.dsh 走"最大兼容路线" | **保留并补串** | 本仓纪律=精确枚举同串；宽路线把判定权交给巧合 |
| publishConfig.tag | **本批不改，发布显式 --tag** | 改它属另一条治理批（21 仓统一）；本批只保证不踩 |
| stateVersion 3 冷重放 | 发布注记声明，不做迁移垫片 | ver2 凭证缺字段不可原样过新 schema（已裁决） |

## 约束
- 发版前 HEAD 两 commit 必须全部在 v4.3.1 tag 之后线性叠加；禁 rebase 已推送历史。
- `npm publish` 后验证传播（packument 滞后 ~60s，装前 `npm view dsh-thinking-levels@4.3.2` 可达）。
- 计划产物覆盖旧批次四文件的原文在 `git show HEAD:spec.md` 等可找回。
