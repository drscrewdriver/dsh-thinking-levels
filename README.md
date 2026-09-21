# dsh-thinking-levels

**Per-round thinking-level (`reasoning_effort`) control for [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness): pick `Auto` (a mask) in the session model selector and the plugin schedules `low` / `high` / `max` from the recent tool-call history before submitting the API effort — or fix a wire level (`off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`) manually. Cheap tool rounds stay cheap; heavy work never starves.**

- [English README](./README.md)
> **v0.7.0-beta.1 (2026-09-06): the short-circuit route is retired.** This release no longer depends on `dsh-llm-openai-completions` — custom-gateway fixes ride the official `llm-pi-ai` compat surface (requires **dsh ≥ v0.1.2-alpha.1**); keep the adapter plugin uninstalled. See the [CHANGELOG](./CHANGELOG.md).

- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [Installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

> **▼ DSH version support**
>
> This release supports **DSH v0.1.2 or newer** only.
>
> | DSH version | Status | Notes |
> | --- | --- | --- |
> | ≥ 0.1.2-alpha.1 | ✅ Supported | Covers the 0.1.2 / 0.1.3 / 0.1.4 / 0.1.5 lines |
> | < 0.1.2-alpha.1 | ⚠️ Not recommended | Stay on the previous plugin line (0.7.1-beta.2 or earlier). Do not run an older plugin build against DSH v0.1.2+ — upgrade the plugin instead. |
>
> The boundary is `0.1.2-alpha.1`, where DSH removed `@deepseek-ai/dsh-client-runtime`. This release imports `Context` from `@deepseek-ai/cordis` instead of the deleted `ClientContext`, matching the official client plugins.

> **Compatibility note:** Version `0.6.0` includes Japanese (`ja`) and Korean (`ko`) dictionaries and selector entries, but the current official DSH releases expose only `zh` and `en` through `LocaleRuntime`. On stock DSH, selecting `ja` or `ko` fails with `locale "<id>" is not registered`. These languages will work after official DSH adds the locale IDs. Advanced users can use a DSH fork that updates `packages/client/locale/src/locale-settings.ts` (`LOCALE_IDS`) and `packages/client/locale/src/client/index.ts` (`LOCALES` labels), together with the corresponding core dictionaries and tests, then rebuild and run the forked DSH. Changing this plugin alone cannot extend DSH's global locale list.

In a multi-step tool chain, the model re-thinks before **every** tool call — and that thinking dominates the wall-clock time (a 50-step agent task can spend minutes reasoning between tools). `dsh-thinking-levels` plugs into the `agent/request` waterfall that dsh re-resolves for every step (registered with `prepend` so the session model-selection assembly cannot overwrite its decision) and injects a thinking level into the next model request.

## Preview

Screenshots of the live UI (dsh web):

<figure>
  <img width="460" alt="Model selector Auto dropdown injected by the plugin: levels Off / Low / High / Max / Auto, High currently selected, Auto highlighted — Auto is a mask, the plugin schedules low/high/max per step from the tool history." src="assets/官方模型的自动级别调整.png" />
  <figcaption>Native model selector gains <strong>Auto</strong> — pick it and the plugin schedules low/high/max per step instead of a fixed wire level.</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="思考档位 settings card: default level (auto scheduling), enable / allow-downgrade / allow-upgrade toggles, llm-pi-ai custom-provider model-capability table with the progressive per-model editor, and apply-to-all presets (Off/High/Max official DeepSeek style, Off/Low/Medium/High generic)." src="assets/自动思考级别配置.png" />
  <figcaption>Thinking-level settings card: the auto scheduler plus its boundaries, and llm-pi-ai model-capability mapping (gear → gateway wire values).</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="Per-model capability editor for a custom openai-completions model (local-35b / Qwen3.6-35B-A3B): thinking model and vision enabled, support think effort off, thinking format qwen-chat-template (auto-filled); no takeover switch — the official compat flag lives on the provider row; context-window limit presets 64K/128K/256K/400K/512K/1M with a custom input." src="assets/自定义模型的思考接管-短路-上下文窗口限制.png" />
  <figcaption>Per-model capability card — pairs with <a href="https://github.com/drscrewdriver/dsh-llm-openai-completions">dsh-llm-openai-completions</a>: this card detects &amp; writes capabilities into the official llm-pi-ai compat surface (no adapter needed since 0.7.0-beta.1).</figcaption>
</figure>

## Levels

| Level | Meaning | Where |
|---|---|---|
| `off` | thinking disabled (manual only — never auto-picked) | model selector / default level |
| `on` | thinking enabled (toggle-only models only): sends `enable_thinking`, never a think effort | model selector / default level |
| `minimal` | least effort (very light tasks) | model selector / default level |
| `low` | manual pick for simple chat tasks (cheap rounds stay cheap) | model selector / default level |
| `medium` | medium effort | model selector / default level |
| `high` | the official default effort | model selector / default level |
| `xhigh` | extra high effort | model selector / default level |
| `max` | heavy work | model selector / default level |
| `auto` | **mask**: schedule per step from the recent tool-call history, resolved to a wire level before submission | model selector (injected by the plugin) / default level |

Wire-level facts (verified against the official DeepSeek docs and dsh's `llm-deepseek` adapter): `low` maps 1:1 on deepseek-v4-flash / v4-pro, while `medium` / `xhigh` collapse onto `high`. The adapter accepts `off | low | high | max` and rejects anything else with `UNSUPPORTED_REASONING_EFFORT` — `auto` is the plugin's mask layer, never sent to the API, always resolved to a concrete wire level before injection. `on` is **not** an effort level: it is advertised only by toggle-only models (Qwen3.6-style), and it only flips `enable_thinking` true — no `reasoning_effort` is sent; an effort-capable model never advertises `on`, so a manual `on` pick on one is stripped.

## Custom wire mapping

For hand-declared `llm-pi-ai` models the settings card lets you map each level to the exact value your gateway expects (borrowed from dsh-thinking-effort): tick a level and enter its wire value, e.g. `high` → `ultra`. The mapping is stored as the model's `reasoningEfforts` table, so the Composer selection `High` sends `ultra` to the gateway. Leaving `off` empty means "do not send".

- Official preset: `Off / High / Max` (official DeepSeek style)
- Generic preset: `Off / Low / Medium / High`

## Context-window presets

The settings card's per-model editor now includes a **context window limit** control: preset buttons `64K / 128K / 256K / 400K / 512K / 1M`, a custom integer input, and a clear button. The value is written to the `llm-pi-ai` model entry `contextWindow` (integer `2000`–`1000000`).

Upstream, the harness consumes it through `resolveModelInfo(...).context.contextWindow` for compaction thresholds, context-overflow detection and context-pressure projections. Because `llm-pi-ai` re-reads the live config on every resolve and the compat sync does not block model discovery, a settings edit takes effect on the next request without a restart.

The plugin config also accepts `models['provider/model'].contextWindow` as a validated (integer `2000`–`1000000`) declaration at the composition/config surface.

## Model-aware guard (v0.5.0)

The plugin never sends a `reasoning_effort` to a model that does not advertise one. Custom
openai-completions routes (e.g. a local Qwen3.6 without `reasoningEfforts`) are classified
non-reasoning via `ctx.llm.resolveModelInfo`, and any effort — inherited or scheduled — is
**stripped** instead of sent, so dsh's per-request `UNSUPPORTED_REASONING_EFFORT` rejection
cannot fire. Unsupported fields are never passed to an API that cannot take them.

Version behavior:

| dsh version | `low` handling |
|---|---|
| rc.6 (old) | not native: the selector only shows it when a configurer-confirmed `models` override names it; the level is then advertised (selector + request validation) and passed through verbatim |
| rc.7+ (new) | native: the plugin neither rewrites nor re-injects it; a manual `low` pick passes through unchanged |

The auto scheduler may still pick `low` for supporting models — the capability guard above is
what keeps it away from models that cannot take it.

## Model-selector Auto

The session model selector (next to the model) now offers **Auto** after the wire levels (injected into the model-directory metadata by the plugin):

| Model-selector pick | Behavior |
|---|---|
| **Auto** | plugin schedules via tool history + the upgrade/downgrade toggles, resolves to `low` / `high` / `max` before submission |
| `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max` | **manual choice wins** — plugin does not intervene (`on` stays `on` on toggle-only models, never lifted to an effort; effort-capable models strip it) |
| unset | the plugin's default level applies (below) |

## Auto scheduler

The hub is `high` (the official default). `auto` schedules between `low` / `high` / `max`; it never picks `off`.

The scheduler is **fail-safe, not fail-cheap**: thin evidence stays at the hub. Guessing `low` on heavy
work costs quality and extra steps; guessing `high` on simple work costs part of one round.

| Recent tool calls | Level |
|---|---|
| the session log cannot be read (unreadable accessor) | `high` |
| a *recent* payload ≥ 4× the simple-call ceiling (3200 chars), upgrades allowed | `max` |
| any other window containing a failed tool round | `high` |
| fewer than 3 calls yet (fresh prompt, or too little to judge) | `high` |
| ≥75% simple tools, small args, downgrades allowed | `low` |
| mixed / heavy tools | `high` |

Two bounds are deliberate and measured:

- **Escalation looks at the most recent calls only** (`ESCALATION_RECENCY = 2`), not the whole 8-call
  window. Over a full window a single large payload keeps escalating for the next eight requests: on a
  real coding workload one 48 KB `write` put **43 %** of all steps at `max`. Over the recent two calls
  the same traffic lands at ~**13 %**.
- **A failed tool round is a floor, not an escalation.** It says the round was not routine, so it must
  not be downgraded to `low`; it is not evidence that maximal reasoning is required, so it does not
  raise to `max` by itself (on the same workload that would have been another ~14 % of steps).

`max` is only reachable when `allowUpgrade` is on — and that option **defaults to `false`**, so out of
the box this is a two-level scheduler (`low` / `high`). Set `allowUpgrade: true` (assembly config or the
settings card) to put the third level in play.

The scheduling policy is the same source as [dsh-tool-turbo](https://github.com/drscrewdriver/dsh-tool-turbo) (same simple-tool whitelist / payload thresholds / 75% ratio rule), with the hub as the default answer.

### Which session-log accessor is read

The plugin pulls the recent tool calls from the session log, whose accessor moved inside this plugin's
declared `engines.dsh` range (`>=0.1.2-alpha.1 <0.2.0-0`):

| Harness segment | Session log access |
|---|---|
| `0.1.2-alpha.*` | `session.events` (a plain array member) |
| `0.1.2-rc.1` … `0.1.5-*` | `session.eventAt(seq)` + `session.snapshotEvents()` / `session.ownEvents()`; no `events` member |

Reading only `events` samples nothing on the newer half of that range — the window comes back empty on
every step, and an empty window is indistinguishable from a session that never called a tool. The
sampler therefore reads whichever accessor is present, newest first, and reports an unreadable log as
unreadable (the scheduler then stays at the hub) instead of as an empty one.

## Install

See [INSTALL.md](./INSTALL.md) for the full official-CLI guide (profile discovery, upgrade, migration, verification, troubleshooting). Quick start:

```bash
# 1. install the plugin into a profile from npm (web shown; any profile works)
#    (the web profile is a pnpm workspace root, so -w is required)
dsh plugin --profile web add dsh-thinking-levels -w
#    GitHub alternative:
#    dsh plugin --profile web add https://github.com/drscrewdriver/dsh-thinking-levels.git -w
#    local-path alternative (no network needed):
#    dsh plugin --profile web add /absolute/path/to/dsh-thinking-levels

# 2. restart dsh web (a running instance does not hot-load new bundle layers)
dsh web
```

> Note: the dsh runtime uses pnpm 11, whose `minimumReleaseAge` supply-chain policy may block a
> freshly published version with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` — add the version to
> `minimumReleaseAgeExclude` in `~/.dsh/profiles/web/pnpm-workspace.yaml` to lift the cooling period.

Manual `link:` registration (alternative to `dsh plugin add`):

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

## Configuration

Two surfaces share one schema:

- **Assembly** — the plugin row's `config:` in the profile composition (e.g. `cordis.yml`):
  ```yaml
  config:
    level: auto            # off | on | minimal | low | medium | high | xhigh | max | auto — the default level when the session picks nothing
    allowDowngrade: true   # let the scheduler drop below `high`
    allowUpgrade: false    # forbid the scheduler lifting to `max`
  ```
- **Runtime** — the dsh-settings namespace `thinking-levels` (`level`, `allowDowngrade`, `allowUpgrade`, `enabled`, `models`): changes apply to the next model request, no restart needed. A visual editor is available under Settings → Plugins → configurable plugins.

Per-model capability overrides (`models`, keyed `provider/model`) confirm what auto-detection
finds; the configurer has the final word:

```yaml
config:
  level: auto
  models:
    llm-pi-ai/Qwen3.6-35B-A3B:   # non-reasoning thinking model (thinking toggle + budget)
      vision: false
      thinking: true
      efforts: false             # never send reasoning_effort (stripped at request time)
    llm-pi-ai/Qwen3.8-27B:       # effort-capable model (rc.6-era adapter without low)
      efforts: [low, high]       # confirm low → advertised in the selector + passed through
```

> For Qwen thinking on/off + budget, configure the **llm-pi-ai** route instead:
> `compat.thinkingFormat: qwen` (→ wire `enable_thinking` + `thinking_budget` via
> `thinkingBudgets`), or `qwen-chat-template` (→ `chat_template_kwargs.enable_thinking`) for
> effort models like Qwen3.8-27B.

Defaults: `{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false, models: {} }`.

> Semantics: the model-selector pick outranks the plugin's default level. Pick `auto` (mask) → plugin schedules; pick a wire level → applied directly; pick nothing → the plugin's `level` default is used. `allowDowngrade` / `allowUpgrade` constrain `auto` scheduling only.

## Official compat surface: the short-circuit tool is retired (0.7.0-beta.1)

Once custom gateways (vLLM / LM Studio / self-hosted OpenAI-compatible proxies) declare
thinking, this plugin writes the fixes into the **official `llm-pi-ai` compat surface**
(introduced in dsh ≥ **v0.1.0-rc.8**, commit `884f7b9c41`) —
[dsh-llm-openai-completions](https://github.com/drscrewdriver/dsh-llm-openai-completions)
is no longer needed and should stay uninstalled:

- Scans `llm-pi-ai.providers` for routes that are custom openai-completions gateways
  (`api: openai-completions` or a non-official baseURL) **and** declare a `reasoningEfforts`
  table on any model (including `modelOverrides`), then writes:
  - route-level `compat.supportsDeveloperRole: false` — the system prompt goes out as
    `system`, fixing the vLLM / SGLang `Unexpected message role` 400;
  - model-level `compat.thinkingFormat: 'qwen-chat-template'` on toggle-style thinking rows
    (thinking table without row-level `supportsReasoningEffort`) — pi-ai then sends
    `chat_template_kwargs.enable_thinking` (bare vLLM servers ignore the top-level
    `enable_thinking` of the plain `qwen` format);
- Writes go through the official settings channel (read → pure transform → whole-section
  `settings.update('llm-pi-ai', …)`), so dsh's schema validates the write **where it is
  written**: a dsh older than rc.8 rejects the fields with a log warning — no silent
  misconfiguration; explicit values on any layer are never clobbered;
- Triggers on plugin start, `llm/adapters-updated`, and `llm-pi-ai` settings changes — no
  manual config editing;
- The capability card is de-short-circuited too: the provider-level switch is now
  "**gateway rejects the developer role**" (writes/clears the route-level flag; unchecking
  restores inheritance), and the model editor is progressive
  (thinking/vision → effort support → effort editor);
- Response-side inline `<think>` splitting remains a **gateway concern**: bare vLLM needs
  `--reasoning-parser qwen3` (pi-ai parses only `reasoning_content` / `reasoning` /
  `reasoning_text`).

# Dependency note

The host half does **not** value-depend on `@deepseek-ai/dsh-settings` (settings registration goes through the cordis `settings` service provided by the dsh runtime) — no need to install official packages into the profile manually. `dependencies` is just `@deepseek-ai/schemastery` (installed automatically with the package).

## Development

```bash
npm run lint        # eslint (typescript-eslint flat config)
npm run typecheck   # tsc --noEmit
npm test            # vitest — 46 tests
```

Test coverage: level policy (manual pass-through incl. the extended levels, `on` clamping, auto scheduler, validation, simple-tool boundary), the model-capability guard (`reasoningEffortSupported`, `resolveEffortInjection` stripping/passthrough), session-event parsing (guards, window cap, malformed records), the config schema (defaults lockstep, out-of-band rejection, `models` overrides), and the official-compat sync (identification, explicit-value respect, identity idempotence, write-time schema gating).

## License

MIT
