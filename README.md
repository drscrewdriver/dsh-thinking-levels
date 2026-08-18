# dsh-thinking-levels

**Per-round thinking-level (`reasoning_effort`) control for [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness): five levels — `off` / `low` / `high` / `max` for manual control, plus an `auto` scheduler that keeps cheap tool rounds cheap and never starves heavy work.**

[中文文档](./README.zh.md) · English

In a multi-step tool chain, the model re-thinks before **every** tool call — and that thinking dominates the wall-clock time (a 50-step agent task can spend minutes reasoning between tools). `dsh-thinking-levels` plugs into the `agent/request` waterfall that dsh re-resolves for every step, and injects a thinking level into the next model request.

## Levels

| Level | Meaning |
|---|---|
| `off` | thinking disabled (manual only — never auto-picked) |
| `low` | manual pick for simple chat tasks (cheap rounds stay cheap) |
| `high` | the official default effort |
| `max` | heavy work |
| `auto` | schedule per step from the recent tool-call history |

Wire-level facts (verified against the official DeepSeek docs and dsh's `llm-deepseek` adapter): `low` maps 1:1 on deepseek-v4-flash / v4-pro, while `medium` / `xhigh` collapse onto `high`. The adapter accepts `off | low | high | max` and rejects anything else with `UNSUPPORTED_REASONING_EFFORT` — this plugin validates the configured level before injecting, fail-loud.

## Auto scheduler

The hub is `high` (the official default). `auto` schedules between `low` / `high` / `max`; it never picks `off`, and it always resolves to a wire level before injecting.

| Recent tool calls | Level |
|---|---|
| none (fresh prompt, pure chat) | `low` |
| ≥75% simple tools, small args, downgrades allowed | `low` |
| mixed / heavy tools | `high` |
| very heavy payloads, upgrades allowed | `max` |

## Install

```bash
# 1. clone + install
git clone <repo-url>/dsh-thinking-levels.git
cd dsh-thinking-levels && npm install

# 2. register into your dsh profile (web shown; any profile works)
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install

# 3. restart dsh web
dsh web
```

## Configuration

Two surfaces share one schema:

- **Assembly** — the plugin row's `config:` in the profile composition (e.g. `cordis.yml`):
  ```yaml
  config:
    level: high            # off | low | high | max | auto
    allowDowngrade: false  # forbid the scheduler dropping below `high`
    allowUpgrade: false    # forbid the scheduler lifting to `max`
  ```
- **Runtime** — the dsh-settings namespace `thinking-levels` (`level`, `allowDowngrade`, `allowUpgrade`, `enabled`): changes apply to the next model request, no restart needed.

Defaults: `{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false }`.

## Development

```bash
npm run lint        # eslint (typescript-eslint flat config)
npm run typecheck   # tsc --noEmit
npm test            # vitest — 21 tests
```

Test coverage: level policy (manual pass-through, auto scheduler, validation, simple-tool boundary), session-event parsing (guards, window cap, malformed records), and the config schema (defaults lockstep, out-of-band rejection).

## License

MIT
