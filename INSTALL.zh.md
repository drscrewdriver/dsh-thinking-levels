# 安装指南（官方 DSH CLI）

本指南只使用官方 `dsh plugin` 命令。该命令会把依赖装进 profile 并同步 `dsh.profile.bundles`。不要用普通 `npm install`、在 profile 里直接 `pnpm add` 或手工编辑 profile 清单代替。

- [安装指南](./INSTALL.zh.md)
- [English installation guide](./INSTALL.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [中文 README](./README.zh.md)
- [English README](./README.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [版本更新日志](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

本指南中的占位符：

- `<profile>`：要修改的 DSH profile，通常是 `web`；
- `dsh-thinking-levels`：npm 包名与运行时插件 ID；
- `thinking-levels`：Cordis 组合条目与设置页 Slot ID。

> **版本要求 —— 仅支持 DSH v0.1.7-rc.1 及以上。**
>
> 安装前先确认版本（`dsh --version`）。
>
> | DSH 版本 | 操作 |
> | --- | --- |
> | ≥ 0.1.7-rc.1 | 安装本版本。 |
> | < 0.1.7-rc.1 | 留在旧版插件（3.0.1）。**不要在 DSH 0.1.7+ 上运行旧版插件，请升级插件。** |
>
> 分界点是 `0.1.7-rc.1`：该版本删除了命令式设置注册（`settings.register` / `installSettingsSection`）与客户端 `settingsScope` 服务。本版本面向 0.1.7 声明式设置表面（`.volatile()` schema 字段 + `configForms`）。

> 旧版 DSH 通过 npm dist-tag 安装对应线：`dsh plugin add dsh-thinking-levels@dsh-0.1.5`（DSH 0.1.5）、`...@dsh-0.1.2`（DSH 0.1.2）、`...@compat`（DSH 0.1.0–0.1.1）。不要安装 ≤ 0.6.0 的旧 0.x 版本——它们没有声明任何 dsh peer 依赖。

## 0. 前置检查与 profile 确认

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

使用你正在运行的 DSH 进程对应的 profile。`web` 很常见，但以实际 `--profile` 参数为准。

## 1. 官方安装

安装最新版本：

```bash
dsh plugin --profile <profile> add dsh-thinking-levels -w
```

（当 profile 是 pnpm workspace root 时必须带 `-w`，`web` 就是。）

显式安装当前发布版：

```bash
dsh plugin --profile <profile> add dsh-thinking-levels@3.1.0 -w
```

官方 CLI 会自动更新 profile 依赖、锁文件与 `dsh.profile.bundles`。不要手工追加 YAML。

### 供应链冷却期

dsh 运行环境使用 pnpm 11，其 `minimumReleaseAge` 策略可能拦截刚发布的版本，报
`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`。把版本加入 `~/.dsh/profiles/web/pnpm-workspace.yaml` 的
`minimumReleaseAgeExclude`：

```yaml
minimumReleaseAgeExclude:
  - dsh-thinking-levels@3.1.0
```

## 2. 升级

升级到 registry 最新版本：

```bash
dsh plugin --profile <profile> update dsh-thinking-levels -w
```

宿主侧改动需重启 DSH；浏览器侧刷新 Web 页面。

## 3. 本地路径 / link: 注册（备选）

开发或离线安装时，可以从本地检出注册插件：

```bash
#    ~/.dsh/profiles/web/package.json dependencies 增加：
#      "dsh-thinking-levels": "link:<dsh-thinking-levels 的绝对路径>"
#    ~/.dsh/profiles/web/cordis.patch.yml：
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

或用官方 CLI 加本地路径（无需网络）：

```bash
dsh plugin --profile <profile> add /dsh-thinking-levels 的绝对路径/ -w
```

## 4. 验证安装

检查依赖与安装版本：

```bash
grep -n "dsh-thinking-levels" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-thinking-levels/package.json').version"
```

本版本的版本号必须是 `3.1.0`。

检查官方组合配置：

```bash
dsh --profile <profile> --dump-default-config
```

应包含：

```yaml
- id: thinking-levels
  name: dsh-thinking-levels
```

## 5. 验证设置表单

重启 DSH 后刷新 Web 页面。打开「设置 → 插件」，找到 **dsh-thinking-levels** 条目——自 DSH 0.1.7 起，表单由宿主按插件声明的 `.volatile()` schema 字段自动生成（不再有自定义客户端卡片）。

1. 表单包含启用开关、档位选择器（8 个标准档位加 `auto`）与调度开关（`allowDowngrade` / `allowUpgrade`）。
2. 提交的改动对下一次模型请求生效，无需重启（实时 volatile 配置）。
3. 逐模型能力编辑器（网关线上值、llm-pi-ai）随被废除的卡片一并移除——请通过官方「模型」设置面编辑 llm-pi-ai 模型能力。
4. 搜索框可筛选模型；官方/通用预设一键应用到全部思考模型。

## 日语与韩语支持状态

插件自带 `ja` 与 `ko` 字典，但当前官方 DSH 只通过 `LocaleRuntime` 暴露 `zh` 和 `en`。在原版 DSH 上选择日语或韩语会报 `locale "<id>" is not registered`。

官方支持落地前要使用它们，请维护 DSH fork 并更新：

- `packages/client/locale/src/locale-settings.ts`：把 `ja` 与 `ko` 加入 `LOCALE_IDS`（Host 偏好 schema 由该列表派生）。
- `packages/client/locale/src/client/index.ts`：在 `LOCALES` 中加入 `{ id: 'ja', label: '日本語' }` 与 `{ id: 'ko', label: '한국어' }`。
- 补齐对应的核心字典与测试，然后重新构建并运行 fork 版本。

仅修改插件无法扩展 DSH 的全局 locale 列表。请使用 fork 文档中的构建与官方 profile 命令；不要手工编辑 profile 清单。

## 6. 排查

| 症状 | 处理 |
| --- | --- |
| 找不到 `dsh` 命令 | 安装或启用官方 DSH CLI。不要用普通 npm/pnpm 命令模拟 profile 安装。 |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | 把版本加入 profile 的 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude`。 |
| 插件显示「已停用/未挂载」且无错误 | 检查 profile 组合；宿主不得值依赖 `@deepseek-ai/dsh-settings`（本插件没有）。 |
| client 入口不在 `__DSH_BOOT__` | 确认 `exports["./client"]` 存在且 host fiber 已建立。 |
| 模型选择器没有 `Auto` | 确认 adapter `resolveModel` 包装已生效（`llm/adapters-updated` 时重新包装）。 |
| 设置表单写入失败 | 值被插件 schema 拒绝；请对齐声明的 `.volatile()` 字段类型。 |
| 子 agent 报 `UNSUPPORTED_REASONING_EFFORT` | 目标模型未声明该档位；改用支持的档位或恢复提供方默认。 |
| 浏览器显示旧 bundle | 升级后硬刷新（Ctrl+Shift+R）。 |

## 7. 卸载

使用官方命令：

```bash
dsh plugin --profile <profile> remove dsh-thinking-levels -w
```

确认组合配置不再包含该 bundle：

```bash
dsh --profile <profile> --dump-default-config
```
