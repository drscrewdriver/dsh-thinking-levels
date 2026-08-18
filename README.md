# dsh-thinking-levels

**Per-round thinking-level (`reasoning_effort`) control for [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness): pick `Auto` (a mask) in the session model selector and the plugin schedules `low` / `high` / `max` from the recent tool-call history before submitting the API effort — or fix a wire level (`off` / `low` / `high` / `max`) manually. Cheap tool rounds stay cheap; heavy work never starves.**

[中文文档](./README.zh.md) · English

In a multi-step tool chain, the model re-thinks before **every** tool call — and that thinking dominates the wall-clock time (a 50-step agent task can spend minutes reasoning between tools). `dsh-thinking-levels` plugs into the `agent/request` waterfall that dsh re-resolves for every step (registered with `prepend` so the session model-selection assembly cannot overwrite its decision) and injects a thinking level into the next model request.

## Levels

| Level | Meaning | Where |
|---|---|---|
| `off` | thinking disabled (manual only — never auto-picked) | model selector / default level |
| `low` | manual pick for simple chat tasks (cheap rounds stay cheap) | model selector / default level |
| `high` | the official default effort | model selector / default level |
| `max` | heavy work | model selector / default level |
| `auto` | **mask**: schedule per step from the recent tool-call history, resolved to a wire level before submission | model selector (injected by the plugin) / default level |

Wire-level facts (verified against the official DeepSeek docs and dsh's `llm-deepseek` adapter): `low` maps 1:1 on deepseek-v4-flash / v4-pro, while `medium` / `xhigh` collapse onto `high`. The adapter accepts `off | low | high | max` and rejects anything else with `UNSUPPORTED_REASONING_EFFORT` — `auto` is the plugin's mask layer, never sent to the API, always resolved to a concrete wire level before injection.

## Model-selector Auto

The session model selector (next to the model) now offers **Auto** after `Off / Low / High / Max` (injected into the model-directory metadata by the plugin):

| Model-selector pick | Behavior |
|---|---|
| **Auto** | plugin schedules via tool history + the upgrade/downgrade toggles, resolves to `low` / `high` / `max` before submission |
| `off` / `low` / `high` / `max` | **manual choice wins** — plugin does not intervene |
| unset | the plugin's default level applies (below) |

## Auto scheduler

The hub is `high` (the official default). `auto` schedules between `low` / `high` / `max`; it never picks `off`.

| Recent tool calls | Level |
|---|---|
| none (fresh prompt, pure chat) | `low` |
| ≥75% simple tools, small args, downgrades allowed | `low` |
| mixed / heavy tools | `high` |
| very heavy payloads, upgrades allowed | `max` |

The scheduling policy is the same source as [dsh-tool-turbo](https://github.com/drscrewdriver/dsh-tool-turbo) (same simple-tool whitelist / payload thresholds / 75% ratio rule).

## Install

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
    level: auto            # off | low | high | max | auto — the default level when the session picks nothing
    allowDowngrade: true   # let the scheduler drop below `high`
    allowUpgrade: false    # forbid the scheduler lifting to `max`
  ```
- **Runtime** — the dsh-settings namespace `thinking-levels` (`level`, `allowDowngrade`, `allowUpgrade`, `enabled`): changes apply to the next model request, no restart needed. A visual editor is available under Settings → Plugins → configurable plugins.

Defaults: `{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false }`.

> Semantics: the model-selector pick outranks the plugin's default level. Pick `auto` (mask) → plugin schedules; pick `off/low/high/max` → applied directly; pick nothing → the plugin's `level` default is used. `allowDowngrade` / `allowUpgrade` constrain `auto` scheduling only.

## Dependency note

The host half does **not** value-depend on `@deepseek-ai/dsh-settings` (settings registration goes through the cordis `settings` service provided by the dsh runtime) — no need to install official packages into the profile manually. `dependencies` is just `@deepseek-ai/schemastery` (installed automatically with the package).

## Development

```bash
npm run lint        # eslint (typescript-eslint flat config)
npm run typecheck   # tsc --noEmit
npm test            # vitest — 21 tests
```

Test coverage: level policy (manual pass-through, auto scheduler, validation, simple-tool boundary), session-event parsing (guards, window cap, malformed records), and the config schema (defaults lockstep, out-of-band rejection).

## License

MIT
