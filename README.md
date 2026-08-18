# dsh-tool-turbo

**Cut tool-call latency in [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) by auto-adjusting `reasoning_effort` per tool round.**

[中文文档](./README.zh.md) · English

In a multi-step tool chain, the model re-thinks before **every** tool call — and that thinking dominates the wall-clock time (a 50-step agent task can spend minutes in reasoning between tools). `dsh-tool-turbo` watches the recent tool calls of a step and injects the *lowest sensible* reasoning effort into the next model request, then lifts it again the moment the work gets heavy.

## How it works

DeepSeek's API exposes `reasoning_effort` in three steps (`low` / `high` / `max`, shipped 2026-08-13). dsh re-resolves the request config for **every step** through an `agent/request` waterfall (see `packages/core/agent-loop/src/agent.ts` — "plugins propose the next request config"). `dsh-tool-turbo` plugs into that waterfall:

1. **Watch** the step's recent `tool/call` records from the session.
2. **Decide**: simple, deterministic tools (`write`, `read`, `grep`, `glob`, `bash`, `fs_*`, …) with small payloads → `low`; mixed/heavy work → `high`; very heavy payloads → `max` (opt-in).
3. **Inject** the decision into the `agent/request` config for the next model call of that step.

Long tool chains keep the cheap rounds cheap, and never starve the hard rounds of reasoning.

## Install

```bash
# 1. clone + build the plugin
git clone https://github.com/Electricitysheep/dsh-tool-turbo.git
cd dsh-tool-turbo && npm install

# 2. register into your dsh profile (web shown; any profile works)
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-tool-turbo": "link:<absolute path to dsh-tool-turbo>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: tool-turbo
#            name: dsh-tool-turbo
cd ~/.dsh/profiles/web && pnpm install

# 3. restart dsh web
dsh web
```

## Verified

- **Injector works in a live dsh instance** (log lines from a real run):

```
[tool-turbo] agent/request: baseline=high calls=[]                    => reasoningEffort=high
[tool-turbo] agent/request: baseline=high calls=[{"name":"write",…}] => reasoningEffort=low
```

- **6/6 unit tests** on the effort policy (`decideEffort`): fresh prompt keeps the baseline, simple-tool chains downgrade to `low`, downgrades respect the user toggle, heavy payloads upgrade to `max` (opt-in), mixed tools lift to `high`.
- `tsc --noEmit` clean.

## Policy (pure, testable)

| Recent tool calls | Decision |
|---|---|
| none (fresh prompt) | keep user's selected effort |
| ≥75% simple tools, small args, downgrade allowed | `low` |
| mixed / heavy tools | `high` (when upgrades allowed) |
| very heavy payloads, upgrade allowed | `max` |
| otherwise | keep user's selected effort |

Toggles (settings namespace planned): `allowDowngrade` (default on), `allowUpgrade` (default off — keep `max` conservative), `baseline` (default `high`).

## Roadmap

- [x] effort-decision core + waterfall injection
- [x] per-tool duration telemetry (host log)
- [ ] settings namespace (dsh-settings) for the toggles
- [ ] tool timing surfaced in the UI / agent context
- [ ] profile-agnostic install docs (`headless`/`tui`)

## License

MIT
