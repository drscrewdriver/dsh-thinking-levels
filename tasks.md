# Tasks: thinking-levels 4.3.2（兜底落账 + rc.2 声明）

## Phase 1: 地基——兜底改动入库（不新增代码，纯核验+提交）
- [ ] T1.1 `npm run build` 重出 lib（确保工作树 lib 与 src 逐字节对应；有差异以 rebuild 为准）
- [ ] T1.2 `npx vitest run` 全绿（≥148）+ typecheck（仅允许既有 8 个 readVolatile 报错，新增即停）
- [ ] T1.3 抽查兜底语义四点：`PricingPolicy` 含 `estimate`／`BILLING_FALLBACK`=V4.1-Flash 谷时行 0.02/1/4／`stateVersion: 3`／defaultPricing 缺省 `estimate`
- [ ] T1.4 commit①：`git add src lib tests && git commit -m "feat(billing): out-of-catalog estimate fallback - BILLING_FALLBACK typical-price accrual with estimated flag, defaultPricing off->estimate, receipt stateVersion 3, settings picker (estimate/cn/global/custom/off), uncalibrated footer, 9 locales"`

## Phase 2: rc.2 兼容声明（纯元数据）
- [ ] T2.1 `package.json`：`engines.dsh` 串尾追加 ` || 0.2.1-rc.2`
- [ ] T2.2 `package.json`：12 条 `@deepseek-ai/dsh*` peerDependencies 逐一同步同串（grep 计数 engines=1 + peers=12 全部含 `0.2.1-rc.2`，漏一改即拒载不一致）
- [ ] T2.3 `README.md` / `README.zh.md`：兼容版本句补 `0.2.1-rc.2`
- [ ] T2.4 双清单 bump：package.json `version` 与 `dsh.plugin.json` `version` → `4.3.2`
- [ ] T2.5 CHANGELOG 8 语新增 4.3.2 条目：estimate 兜底档、stateVersion 3 冷重放一次性位移声明、rc.2 兼容声明
- [ ] T2.6 semver 三向脚本验证（node -e + semver，`includePrerelease:true`；rc.2=true / 0.3.0-rc.1=false / alpha.5=false）
- [ ] T2.7 commit②：`hosts: add 0.2.1-rc.2 to 13-term enumeration (4.3.2)`

## Phase 3: 包门禁与发布
- [ ] T3.1 `npm run build` 复跑（commit② 后产物终态）+ `npm test`
- [ ] T3.2 `npm pack` → 解包核验 V1-V6：三 manifest 同号 4.3.2、ENUM13 同串、lib 关键文件哈希 = 仓内、JSON 无 BOM、`publishConfig.registry=registry.npmjs.org`
- [ ] T3.3 L3 深度安全评审（qodersec review --layer=l3）→ 0 findings
- [ ] T3.4 `npm publish --tag dsh-0.2.1-rc.2`（**显式 tag，勿信 publishConfig.tag=dsh-0.2.0**）
- [ ] T3.5 `npm view dsh-thinking-levels dist-tags --json` 复核：`latest=4.3.2` ∧ `dsh-0.2.1-rc.2=4.3.2`；不符则 `dist-tag add latest 4.3.2` 修正
- [ ] T3.6 git：`git tag -a v4.3.2 -m "4.3.2: estimate fallback + 0.2.1-rc.2 enumeration"` + `git push origin main v4.3.2`

## Phase 4: 双通道装机与 rc.2 冒烟
- [ ] T4.1 备份两 profile package.json 至工作区外目录（`_artifacts/` 下带时间戳）
- [ ] T4.2 `npm pack --pack-destination .` 出 `dsh-thinking-levels-4.3.2.tgz`（仓内）
- [ ] T4.3 desktop：链式一次过——剥 BOM → 改 `file:` 指针至 4.3.2.tgz → `pnpm install` → 复读 package.json + node_modules 实装版本双重确认（防 Electron 并发回写）
- [ ] T4.4 web：依赖行 `4.3.1`→`4.3.2`（npm 通道，等传播 ≥60s）+ `pnpm install --registry=https://registry.npmjs.org`
- [ ] T4.5 重启桌面端/web 服务；`dsh plugin list` 零 FAILED、thinking-levels=4.3.2
- [ ] T4.6 运行态四点：目录外模型显示估算金额+「未校准·仅供参考」／显式 off 显「未计价」／设置下拉五档即选即热／旧 ver2 会话冷重放无双记账
- [ ] T4.7 目视核对 1017 徽章与 `conversation.input.model`/`input.right` 席位共存（记录截图，不改码）
- [ ] T4.8 checklist.md 回写勾选 + 本计划收尾注记（含"兜底 commit 原不存在"的事实纠偏）
