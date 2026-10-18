# Checklist: thinking-levels 4.3.2（兜底落账 + rc.2 声明）

## Must Pass
- [ ] T1 兜底 commit 存在且在 v4.3.1 tag 之后线性叠加（`feat(billing): …`，16 文件全含、lib↔src 同 commit）
- [ ] vitest 全绿（≥148，含 estimate 兜底/estimated 凭证/态 3 自 parse 用例）；typecheck 仅剩已知 8 个 `readVolatile` 旧报错（不新增）
- [ ] `engines.dsh` + 12 条 peers 全部同串 **ENUM13**（尾项 `0.2.1-rc.2`），逐点位 grep 无漏改（engines=1 / peers=12）
- [ ] semver 三向：`satisfies('0.2.1-rc.2')=true` ∧ `satisfies('0.3.0-rc.1')=false` ∧ `satisfies('0.2.1-alpha.5')=false`
- [ ] 双清单同号 4.3.2（package.json = dsh.plugin.json）
- [ ] CHANGELOG 8 语含：estimate 兜底档位、stateVersion 3 冷重放位移声明、rc.2 兼容声明
- [ ] `npm pack` 产物 V1-V6：lib 四文件逐字节 = 仓内、registry 钉死 `registry.npmjs.org`、无 BOM、JSON 合法
- [ ] `npm publish --tag dsh-0.2.1-rc.2` 后 `dist-tags = {latest: 4.3.2, 'dsh-0.2.1-rc.2': 4.3.2}`（复核输出，不信退出码）
- [ ] L3 深度评审 0 findings（publish 前）
- [ ] git：两 commit + annotated tag v4.3.2 推送 origin/main
- [ ] web profile：npm 通道 4.3.2 装入，`dsh plugin list` 零 FAILED
- [ ] desktop profile：`file:` 指针 → 4.3.2 tgz，链式安装（防 Electron 覆盖/BOM），lib 哈希 MATCH
- [ ] rc.2 宿主装载冒烟：插件激活、目录外模型金额正常显示且页脚标「未校准·仅供参考」、显式 off 档显示「未计价」
- [ ] 目视：1017 徽章（官方 `input.model.label` occupant）与本插件 `input.model`/`input.right` 席位同屏无互相吞没（仅核对，非必改）

## Should Pass
- [ ] 冷重放验证：开一个含旧 ver2 凭证的历史会话，确认重折成功、无双记账、面板无 NaN
- [ ] 即选即热：设置卡"目录外定价"下拉五档（estimate/cn/global/custom/off）切换后 ring 即时变化
- [ ] packument 传播等待策略记录进装机注记（publish→web 装 ≥60s）

## 不在本批（明确排除）
- pricingPolicies 逐 API 策略嵌套面、卡片"计价目录节"展示、海外 USD 行补录（沿用原未完清单，另批）
- publishConfig.tag 修正 / hosts.mjs 单源化（21 仓治理批）
