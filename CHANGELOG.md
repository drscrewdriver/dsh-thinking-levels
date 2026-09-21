# Changelog

All notable changes to `dsh-thinking-levels` are documented here.

- [English changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

## [Unreleased]

### Fixed — the auto scheduler never saw a tool call, so every request ran at `low`

`engines.dsh` (`>=0.1.2-alpha.1 <0.2.0-0`) spans a rename of the session-log accessor that this plugin
never followed, so the sampler read nothing and the scheduler answered its "no tool calls yet" rule on
**every** step:

| Harness segment | Session log access |
|---|---|
| `0.1.2-alpha.*` | `session.events` — a plain array member |
| `0.1.2-rc.1` … `0.1.5-*` | `session.eventAt(seq)` + `session.snapshotEvents()` / `session.ownEvents()`; no `events` member |

Verified against the published packages: `Session.prototype` carries `events` in `0.1.2-alpha.2` and
does not in `0.1.2-rc.1` or `0.1.5-rc.2`. On the newer half of the supported range the window came back
empty on every request, and an empty window was indistinguishable from a session that never called a
tool — so a 206-step session of shell commands and multi-agent orchestration ran at the cheapest level
end to end, with no `high` and no `max` anywhere in its request headers.

- **The sampler reads whichever accessor the installed harness exposes** — `eventAt` + `seq` first
  (random access, no array materialization), then `snapshotEvents()` / `ownEvents()`, then the legacy
  `events` array.
- **An unreadable log is reported as unreadable**, not as an empty window, and the scheduler answers
  the hub (`high`) instead of the cheapest level. "Cannot observe" is not "nothing heavy happened".
- **The scheduler is fail-safe, not fail-cheap.** A log that will not open, a window with fewer than
  three calls, and a fresh prompt (nothing to schedule from yet) all stay at the hub; a failed tool
  round floors the window at the hub instead of downgrading it. Positive evidence of heaviness — a
  large recent payload — still escalates to `max` when upgrades are allowed.
- **Escalation is bounded to the most recent calls** (`ESCALATION_RECENCY = 2`) and a failure no longer
  escalates on its own. Measured on a real coding workload: over the full 8-call window one 48 KB
  `write` put 43 % of all steps at `max`, and a failure-to-`max` rule added another ~14 %. Bounded to
  the recent two calls the same traffic lands at ~13 % `max` / ~80 % `high` / ~7 % `low`.
- **The regression test builds a real `@deepseek-ai/dsh-session` object** instead of a hand-rolled
  double. The old double *was* `{ events: [...] }`, the accessor the harness had already removed, which
  is why the suite stayed green while production sampled nothing. `@deepseek-ai/dsh-session` joins
  `devDependencies`, pinned to the same `0.1.2-rc.1` segment as the client pins.

> The README, CHANGELOG and locale mirrors for `ja` / `ko` (and the `zh` README) are not translated
> here; only the English sources carry this change.

### Added — `publishConfig` pins the registry and the dist-tag

Publishing this line went wrong twice by hand: a bare `npm publish` resolved against the
npmmirror registry (`ENEEDAUTH`), and the prerelease then had to be kept off `latest` by
remembering `--tag beta` every single time. Both are now machine-enforced:

```json
"publishConfig": { "registry": "https://registry.npmjs.org", "tag": "beta" }
```

> **When this line goes stable**, change `tag` to `latest` in the same commit that drops the
> `-beta.N` suffix — otherwise the stable release lands under `beta` and `latest` stays on
> the previous major. (Recoverable, but only via `npm dist-tag add`.)

### Added — `pnpm-lock.yaml` is tracked

It was previously untracked, so every fresh clone re-resolved the whole tree — including the
four `@deepseek-ai/dsh-client-*` pins this line's compatibility depends on. The lock is now
committed; treat it as part of the contract, not as a local artifact.

### Fixed — the `slots` service face on the 0.1.2 segment — 2.0.0-beta.3

- **The browser half acquires the `slots` service structurally again.** `0.1.2-rc.1` turned
  `@deepseek-ai/dsh-client-ui-slots` into a pure registry ("no cordis") and dropped its cordis
  Context augmentation, so `ctx.slots` stopped type-resolving — the client half no longer compiled
  against the very segment `engines.dsh` declares. It now reads the service through
  `ctx.get('slots')` (the name `inject` declares) and bails out early when it is absent, mirroring
  `dsh-search-index` on the same harness segment. Both registrations — the `settings.plugin.item`
  card and the `conversation.input.right` context control — are unchanged.
- **`devDependencies` realign with the supported segment.** The four `@deepseek-ai/dsh-client-*`
  entries were still pinned at `^0.1.0-rc.7` (resolving `0.1.0-rc.8`), so `typecheck` and `build`
  compiled against the 0.1.0 contract while the runtime is 0.1.2. All four are now pinned at
  `0.1.2-rc.1`, the release this line is verified against.
- **`pnpm-workspace.yaml` carries a resolved `allowBuilds`.** The placeholder pnpm wrote
  (`esbuild: set this to true or false`) blocked every install with `ERR_PNPM_IGNORED_BUILDS`.

### Changed — the context control lives in the composer row — 2.0.0-beta.2

- **The context-window quick control sits in the composer tool row again**
  (`conversation.input.right`, next to the model/effort control). The model card is not an option:
  the shipped `ModelSelect` calls `renderSlot` zero times and owns its popup outright, so the
  `conversation.input.model.section` seat declared in `2.0.0-beta.1` is rendered by no released
  harness — a plugin cannot put a row inside that card on its own. `conversation.input.right` is a
  session-scoped `list` seat any plugin may occupy, which is where a tool-row control belongs.
- **The slot-entry crash stays fixed.** The old pill called a standard seat as a bare getter
  (`useSession()`) — every renderer seat is a `useSyncExternalStoreWithSelector` selector hook, so
  the call threw `TypeError: l is not a function` and took the whole entry down on each render. The
  control now reads the active model through a mandatory selector.
- **The model source is seat-agnostic.** It prefers the session `useTrajectory` seat (the request
  ledger, DSH 0.1.2+) and falls back to `useConversation`
  (`ConversationSnapshot.views.get('trajectory')`) on harness lines without it; a harness that
  provides neither seat renders nothing instead of a dead control.
- **The popover is one slider row**: preset slider (64K / 128K / 256K / 400K / 512K / 1M) writing
  once per gesture (pointer release, key release, blur), the committed value, a collapsed
  custom-integer editor (`⋯`) and Clear. The pill shows the value only; `input.context.*` copy is
  restored in all four dictionaries.
- **Unchanged: the settings card editor.** Per-model context-window presets, the custom integer and
  Clear stay exactly as they are, writing the same `llm-pi-ai` / `llm-deepseek` namespaces.

### Breaking — DSH v0.1.2+ only (`dsh-client-runtime` removal) — 0.7.2-beta.1

- **`engines.dsh` is now `>=0.1.2-alpha.1 <0.2.0-0`.** `@deepseek-ai/dsh-client-runtime`
  was deleted wholesale in `0.1.2-alpha.1` (commit `be531688f3`); that release is the hard
  segment boundary. The previous plugin line (`0.7.1-beta.2` and earlier) keeps serving
  DSH 0.1.0 / 0.1.1.
- **`ClientContext` is gone.** `src/client/index.ts` now imports
  `Context as ClientContext` from `@deepseek-ai/cordis`, matching every official client
  plugin. `@deepseek-ai/dsh-client-runtime` is removed from `peerDependencies`,
  `peerDependenciesMeta` and `devDependencies`, so it no longer blocks install.
- **`src/types/contracts.d.ts` loses the ambient
  `declare module '@deepseek-ai/dsh-client-runtime/client'` mirror.** `SettingsScope`
  gains the `base` / `user` / `revision` snapshot fields and `bind` takes an optional
  `decode`; the `SlotsFace` mirror stays (the real `SlotRegistry` in
  `@deepseek-ai/dsh-client-ui-renderer` supplies it at runtime).
- **`dsh.client.inject` lists `@deepseek-ai/dsh-client-ui-renderer`**, the package that
  provides the `slots` service this plugin registers into.
- **Localized registration split by overload.** The bulk
  `register(ns, dicts)` form is typed to the built-in locale ids (`zh` / `en` only), so
  the shipped `ja` / `ko` dictionaries now go through the single-locale
  `register(ns, locale, dict)` overload and are disposed together. Behaviour is
  unchanged; the call now typechecks against the real locale package.

### Removed

- **Dead `agent/tool` listener.** The per-tool wall-clock telemetry registered a
  `ctx.on('agent/tool', …)` handler that kept a `started` map and logged
  `tool … took …ms`. DSH has no such event in either 0.1.1-rc.2 or 0.1.2-rc.1 — the
  scope-event registry (`packages/core/scope/src/scoped-events.generated.ts`) lists twelve
  `agent/*` events and `agent/tool` is not one of them — so the handler never ran and the
  log line was never emitted. Removed the listener, its `started` map, the `pruneStale`
  sweep and the `TOOL_AGE_LIMIT_MS` constant.
- **The effort scheduler is unaffected.** Tool recognition is a *pull*, not a push: the
  `agent/request` waterfall calls `recentToolCalls(payload.agent)`, which reads the
  `tool/call` records out of `agent.session.events` and feeds `scheduleEffort`. That path
  has its own tests (`tests/session-events.spec.ts`, `tests/thinking-level.spec.ts`) and
  was untouched.

### Fixed — mainline renumbered to 2.x — 2.0.0-beta.1

- **The context-window quick control crashed its slot on every render.** `ContextQuick`
  called the session standard seat as a bare getter (`useSession()`). Every renderer standard
  seat is a `useSyncExternalStoreWithSelector` *selector hook* bound by `bindSnapshotSelector`
  (`@deepseek-ai/dsh-client-ui-renderer`), so the call reached the shim with
  `selector === undefined` and threw `TypeError: l is not a function`: the
  `conversation.input.right` entry died and the slot error boundary rethrew it on each render.
  The same component also read `session.views.get('trajectory')`, a field `SessionSnapshot`
  never carried (views belong to `ConversationSnapshot`), so it could not have resolved a model
  even without the crash. The active model now comes from the session `useTrajectory` seat
  through a stable module-level selector over the request ledger.
- **The control moved into the model menu card.** It registers into
  `conversation.input.model.section` — the strip ui-model-selection renders under the Model /
  Reasoning-effort rows — as a compact slider row: a preset slider (64K / 128K / 256K / 400K /
  512K / 1M) that writes once per gesture (pointer release, key release, blur), the committed
  value, a collapsed custom-integer editor and Clear. The copy is down to the row label, the
  value and Clear. The composer-row pill is gone; the settings card keeps the full per-model
  editor. The row appears on harnesses whose model seat declares that child slot (added in
  `packages/client/ui-model-selection`); on older harnesses the registration stays pending and
  the settings card remains the editor.
- **`dsh.plugin.json` version synced** with `package.json`; the 0.7.2-beta.1 tarball had
  shipped it as 0.7.1-beta.2.
- **Version renumbering: the line is now the major digit.** This mainline (DSH 0.1.2+) moves
  to **2.x**, the legacy line (DSH < 0.1.2, branch `compat/dsh-0.1.1`) to **1.x**, so an
  installed version states which harness segment it serves. npm dist-tags keep their roles:
  `beta` = this line, `compat` = the legacy line. Nothing else changes for existing installs;
  a `0.7.x` range simply does not match `2.x`, so the switch is explicit.
- **The model-menu row needs a harness that declares the seat.** `conversation.input.model.section`
  is added to `packages/client/ui-model-selection` (declaration + `renderSlot` call); until a
  harness release carries it, the registration stays pending and the settings card remains the
  editor. No released harness has it today.

## [0.7.0] — 2026-09-09

> **Stable release.** The short-circuit route is retired; all gateway fixes now ride the official `llm-pi-ai` compat surface (dsh ≥ **v0.1.0-rc.8**). This version also includes the context-window presets from the earlier 0.7.0 draft.

### Added

- **Multi-level context-window presets** in the per-model capability editor: `64K / 128K / 256K / 400K / 512K / 1M` preset buttons plus a custom integer input and clear button, written to the `llm-pi-ai` model `contextWindow` and consumed live by the harness (compaction / context-overflow detection / context-pressure projections) on the next request — no restart needed.
- New pure module `src/context-window.ts` (range constants `2000`–`1_000_000`, preset list, `formatContextWindow`, `validateContextWindow`) shared by the config schema, the settings card and the tests.
- Config surface: `models[].contextWindow` override accepted with integer `2000`–`1000000` validation (fail-loud on out-of-band values).
- New `zh` / `en` / `ja` / `ko` copy for the context-window control.
- Added `dsh.plugin.json` with `engines.dsh: ">=0.1.0-rc.8"`.
- Added `peerDependencies` for `dsh-client-runtime`, `dsh-client-locale`, `dsh-client-ui-settings`, `dsh-client-ui-slots` (all optional).

### Removed

- **The short-circuit takeover bridge**: the plugin no longer maintains the `llm-openai-completions` takeover list (`nextTakeoverSection` / `TakeoverSection` are gone). The adapter plugin `dsh-llm-openai-completions` is NOT needed alongside this release and can stay uninstalled.

### Changed

- **Auto-compat bridge rewritten onto the official compat surface** (`withOfficialCompatFixes`): for every custom openai-completions gateway route that declares thinking, the sync now writes
  - route-level `compat.supportsDeveloperRole: false` (system prompt sent as `system` — fixes the vLLM/SGLang `Unexpected message role` 400), and
  - model-level `compat.thinkingFormat: 'qwen-chat-template'` on toggle-style thinking rows (no row-level effort support) so pi-ai sends `chat_template_kwargs.enable_thinking` — bare vLLM servers ignore the top-level `enable_thinking` of the plain `qwen` format.
- Storage pattern follows dsh-thinking-effort's host side: read → pure transform (identity when nothing to change) → whole-section `settings.update('llm-pi-ai', …)`, so dsh's `llm-pi-ai` schema validator gates the write where it is WRITTEN; a dsh predating rc.8 rejects the unknown field and the sync logs and keeps the previous section. Explicit values on any layer are respected and never clobbered.
- **Capability card de-short-circuited**: the "short-circuit takeover" switch is replaced by a per-provider **"gateway rejects the developer role"** switch (writes/clears the route-level flag; unchecking restores inheritance). The takeover-list gating is gone — every llm-pi-ai provider's models are directly editable, in progressive layers: ① thinking + vision → ② effort support (thinking models only) → ③ effort wire editor → ④ thinkingFormat → ⑤ context window. Toggling thinking on a toggle-style model auto-fills `thinkingFormat: 'qwen-chat-template'` (only when absent); enabling effort removes it again.
- `declaresThinking` now also scans `modelOverrides` (previously only `models[]`), so modelOverrides-only routes are identified and fixed too.
- The adapter-posture read gate (`takeoverOf` / `piAiPosture`) is kept but inert: with the adapter absent it yields native pi-ai semantics.
- The context badge now reuses the shared `formatContextWindow` so written presets display exactly (e.g. `256000` → `256K`, `1000000` → `1M`).

### Notes

- Requires dsh ≥ **v0.1.0-rc.8** for the official compat surface. On older dsh the schema refuses the compat fields (fail-loud, no silent misconfiguration).
- Response-side inline `<think>` splitting remains a gateway concern: bare vLLM needs `--reasoning-parser qwen3`; pi-ai (≤ 0.85.1) parses only `reasoning_content` / `reasoning` / `reasoning_text`. `qwen-chat-template` does not carry `reasoning_effort` (the format branches are mutually exclusive) — effort levels drive `enable_thinking` on/off only. True parallel (chat_template_kwargs + reasoning_effort) needs an upstream pi-ai change.
- Verification materials live on the `check` branch (`check/CHECK.md`, `check/record-proxy.mjs`, `check/settings-route.example.yaml`); they are not part of the npm package.

## [0.6.0] — 2026-02-?

### Added

- **Eight standard levels** aligned with dsh-thinking-effort: `off / on / minimal / low / medium / high / xhigh / max` (plus the `auto` scheduler mask). `on` is the enable-thinking toggle, clamped to the model's default strength (`high` or the highest advertised thinking level); `minimal` / `medium` / `xhigh` pass through when a custom gateway advertises them and collapse onto `high` on the official adapter.
- **Custom wire mapping in the settings card** (borrowed from dsh-thinking-effort): each level can be ticked and given the exact value sent to the gateway (e.g. `high` → `ultra`); `off` left empty means "do not send". Stored as the model's `reasoningEfforts` table.
- **Settings-card presentation overhaul** (borrowed from dsh-thinking-effort): providers group their models, each model row shows text/image/context badges, models expand into a per-level editor, a search box filters models, and one-click presets (official DeepSeek style / generic) apply to every thinking model.
- **Multilingual**: Japanese (`ja`) and Korean (`ko`) dictionaries, plus `README.ja.md` / `README.ko.md`, `INSTALL.{md,zh,ja,ko}.md`, and `CHANGELOG.{md,ja,ko}.md`. Note: the official DSH locale runtime still exposes only `zh` / `en`, so `ja` / `ko` selection requires a DSH fork (see README compatibility note).

### Changed

- `level` config surface accepts the full nine values (`off | on | minimal | low | medium | high | xhigh | max | auto`).
- `models[].efforts` override accepts the extended levels.
- Card renderer refactored; capability editors now use a staged wire draft with an explicit **Apply levels** button instead of immediate checkbox commits.

### Fixed

- `effortLevelsOf` unused helper removed; legacy `_N` unused-parameter lint warning silenced.

## [0.5.2] — 2026-02-?

### Added

- **Auto-takeover of `dsh-llm-openai-completions`**: providers that are custom openai-completions gateways (`api: openai-completions` or non-official baseURL) **and** declare a `reasoningEfforts` table on any model are merged into `llm-openai-completions.providers` with `enabled: true`. Runs on plugin start, `llm/adapters-updated`, and settings changes; soft-coupled (skips the write when the namespace is unregistered).

## [0.5.1] — 2026-02-?

### Added

- Model-capability editor card: vision / thinking / supports-effort / effort levels / thinking format for every custom `llm-pi-ai` provider model, written straight to the `llm-pi-ai` settings namespace (no official-package changes).

## [0.5.0] — 2026-02-?

### Added

- Model-aware guard: never send `reasoning_effort` to a model that does not advertise it (custom openai-completions routes such as Qwen3.6 are stripped instead).
- `low` passthrough on dsh rc.7+; rc.6-era adapters can advertise `low` via a configurer-confirmed `models` override.
- `models` config section (`provider/model` → `vision` / `thinking` / `efforts`).

## [0.4.1] — 2026-02-?

### Fixed

- Adapter `resolveModel` wrapper now re-runs on `llm/adapters-updated` so the `Auto` mask appears even when adapters register after plugin apply.

## [0.4.0] — 2026-02-?

### Changed

- Removed the value dependency on `@deepseek-ai/dsh-settings`; settings registration goes through the cordis `settings` service (local `installSettingsSection` equivalent).
- Card registration supplies both `id` and `key` so it works on CLI (keyed) and DSH Desktop (list) slot declarations.

## [0.3.0] — 2026-02-?

### Added

- Model-selector `Auto` (mask): injected into adapter `resolveModel` efforts; the plugin schedules `low` / `high` / `max` per step via the `agent/request` waterfall (registered with `prepend` so the session model-selection assembly cannot overwrite it).

## [0.2.1] — 2026-02-?

### Fixed

- Added `exports["./client"]` so the client bundle is discovered by dsh's client-modules loader.

## [0.2.0] — 2026-02-?

### Added

- First client settings card (level picker + scheduler toggles).

## [0.1.1] — 2026-02-?

### Fixed

- Publish compiled `lib/` instead of raw TS sources (Node 22 forbids type-stripping `.ts` under `node_modules`).

## [0.1.0] — 2026-02-?

### Added

- Initial release: `agent/request` injection of a fixed reasoning effort.
