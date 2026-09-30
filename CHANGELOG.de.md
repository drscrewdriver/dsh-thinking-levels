# Änderungsprotokoll

Alle nennenswerten Änderungen an `dsh-thinking-levels` werden hier dokumentiert.

- [Changelog auf Deutsch](./CHANGELOG.de.md)
- [English changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

## [Unreleased]

## [4.0.0] — 2026-09-29

### Geändert — DSH-0.2.0-rc-Kompatibilität

- **Peer-Gate auf das 0.2.0-rc-Segment neu ausgerichtet.** Alle sieben `@deepseek-ai/dsh-*`-Peer-
  Deklarationen und `engines.dsh` lesen jetzt `>=0.2.0-rc.1 <0.2.1-0` (statt
  `>=0.1.7-rc.1 <0.1.8-0`). Hosts auf 0.1.7-rc.1 bis < 0.2.0 bleiben auf der 3.x-Linie
  (npm dist-tag `dsh-0.1.7`, 3.4.3); Hosts unter 0.1.7-rc.1 bleiben auf 3.0.2.
- **devDependencies auf die 0.2.0-Linie verschoben** — `dsh-client-locale` / `dsh-client-ui-renderer` /
  `dsh-client-ui-settings` / `dsh-client-ui-slots` / `dsh-client-store` → `0.2.0-rc.1`, und
  `@deepseek-ai/cordis` → `^4.0.4` (gefordert vom `~4.0.4`-Peer der 0.2.0-rc.1-Client-Pakete) —
  damit typecheck / tests / build gegen die echten 0.2.0-rc.1-Typen laufen.
- **Metadaten-Hygiene:** `dsh.plugin.json`-Version und `engines.dsh` auf 4.0.0 und das
  0.2.0-rc-Segment synchronisiert; `publishConfig.tag` → `dsh-0.2.0` mit neuem `release:4x`-Skript,
  damit eine Veröffentlichung die Tags `dsh-0.1.7` / `latest` nie überschreiben kann; beide
  Lockfiles (`package-lock.json` / `pnpm-lock.yaml`) gegen den 0.2.0-Abhängigkeitsbaum regeneriert.
- **Keine Code-Änderungen in Host- oder Client-Hälfte.** Die Pakete, die dieses Plugin importiert
  (`dsh-client-locale`, `dsh-client-store`, `dsh-client-ui-renderer`, `dsh-client-ui-settings`,
  `dsh-client-ui-slots`), ändern zwischen 0.1.7-rc.2 und 0.2.0-rc.1 nur ihre Paketversion; die
  `settings`-/`llm`-Service-Flächen und der `llm-pi-ai`-Adapter sind ebenfalls unverändert. Die
  komplette Suite (lint / typecheck / 71 tests / build) läuft unverändert gegen 0.2.0-rc.1 durch.

### Behoben — doppelter Plugins-Eintrag in den Einstellungen — 2.0.0-beta.4

- **Die `settings.plugins.tab`-Registrierung wurde entfernt.** Die 0.1.5-Compat-Arbeit ging davon
  aus, dass DSH 0.1.5 den Sitz `settings.plugin.item` entfernt hatte, aber das veröffentlichte
  0.1.5-rc.2 (und 0.1.6-alpha.1) `ui-settings-plugins` deklariert ihn weiterhin als Kind des
  eingebauten konfigurierbaren Plugins-Tabs. Mit beiden deklarierten Sitzen feuerten beide
  Registrierungen, und das Plugin erschien zweimal unter Einstellungen → Plugins: einmal als
  Elementkarte in der konfigurierbaren Liste und einmal als eigener Top-Level-Tab. Die
  Elementkarte allein deckt jede unterstützte Linie ab, daher ist die Tab-Registrierung weg
  (mitsamt ihrem `ctx.locale.bind`-Label-Thunk).

### Geändert — DSH-0.1.5-rc-Kompatibilität — 2.0.0-beta.3

- **Die Einstellungskarte nutzt den neuen 0.1.5-Sitz.** DSH 0.1.5 benannte den Sitz der
  Plugins-Einstellungskarte von `settings.plugin.item` in `settings.plugins.tab` um (`id` =
  Tab-Schlüssel, `order` und ein vom Registrant lokalisiertes `label`). Beide Registrierungen
  sind deklarationsgebunden via `ctx.slots.inject`, sodass die Karte auf dem Sitz mountet, den
  der laufende Host deklariert — 0.1.5+-Hosts bekommen den Tab, 0.1.2–0.1.4-Hosts behalten die
  Legacy-Karte. Das Tab-Label ist ein Lesezeit-Thunk über `ctx.locale.bind(NS)` und folgt damit
  Locale-Wechseln.
- **`ctx.slots`-Typisierung wiederhergestellt.** Die `Context.slots`-Augmentation kam transitiv
  über das ( inzwischen gelöschte ) `dsh-client-runtime`-Paket; 0.1.5 verlagerte sie zu
  `@deepseek-ai/dsh-client-ui-renderer/client`, das die Client-Hälfte jetzt importiert.
- **devDependencies auf 0.1.5-rc.2 gepinnt** und die komplette Suite (typecheck / lint / 65 tests /
  build) gegen diesen Baum verifiziert. Host-seitige APIs (`settings.register/get/update`,
  `settings/document-updated`, `agent/request`) sind in 0.1.5-rc.2 unverändert — keine
  Host-Änderungen nötig.
- Verifiziert gegen die aus npm entpackten Vertragsoberflächen von 0.1.5-rc.2: `conversation.input.right`,
  `settingsScope.bind`, Locale-Overloads und die Settings-Service-Fläche sind alle erhalten.
- **`lib/` wird in git versioniert.** `package.json` liefert `files: ["lib", …]` und zeigt `main` /
  `types` / `exports` auf `lib/`, aber `.gitignore` listete `lib/` weiterhin — eine GitHub-basierte
  Installation (die keinen Build ausführt) erhielt also ein Paket ohne Einstiegspunkt. Die
  Build-Artefakte sind jetzt in der Versionskontrolle, und ein Neubau reproduziert sie
  byte-genau (kein Inhaltsdiff, nur das `core.autocrlf`-Zeilenende-Rauschen).
- **`engines.dsh` auf das Segment eingegrenzt, das diese Linie wirklich implementiert**: Das
  bisherige `>=0.1.2-alpha.1 <0.2.0-0` ließ 0.1.2–0.1.4-Hosts zu, bei denen die Client-Hälfte
  nicht gegen den umbenannten Plugins-Einstellungssitz kompilieren kann, den diese Linie
  registriert. Es lautet jetzt `>=0.1.5-alpha.1 <0.2.0-0` (und `node` auf `^22.19.0 || >=24.0.0`
  eingegrenzt, passend zur Toolchain). `publishConfig` pinnt `registry` + `tag: beta`, damit ein
  nacktes `npm publish` weder den Mirror falsch auflösen noch die stabile `latest`-Linie
  überschreiben kann, und `pnpm-lock.yaml` wird als Teil des Kompatibilitätsvertrags verfolgt und
  nicht als lokales Artefakt behandelt.
- **Ein pnpm-`allowBuilds`-Platzhalter blockiert Installationen nicht mehr.** `pnpm-workspace.yaml`
  trug pnpms wörtlichen `set this to true or false`-Stub, der jedes `pnpm install` mit
  `ERR_PNPM_IGNORED_BUILDS` abbrach; er lautet jetzt `esbuild: true`.

### Geändert — die Kontext-Steuerung lebt in der Composer-Zeile — 2.0.0-beta.2

- **Die Kontextfenster-Schnellsteuerung sitzt wieder in der Composer-Tool-Zeile**
  (`conversation.input.right`, neben der Modell-/Effort-Steuerung). Die Modellkarte kommt nicht in
  Frage: Das ausgelieferte `ModelSelect` ruft `renderSlot` nullmal auf und besitzt sein Popup
  selbst, sodass der in `2.0.0-beta.1` deklarierte Sitz `conversation.input.model.section` von
  keinem veröffentlichten Harness gerendert wird — ein Plugin kann dort keine Zeile in dieser
  Karte unterbringen. `conversation.input.right` ist ein session-scoped `list`-Sitz, den jedes
  Plugin belegen darf — genau dorthin gehört eine Tool-Zeilen-Steuerung.
- **Der Slot-Eintrag-Absturz bleibt behoben.** Die alte Pill rief einen Standard-Sitz als nackten
  Getter auf (`useSession()`) — jeder Renderer-Sitz ist ein `useSyncExternalStoreWithSelector`-
  Selector-Hook, der Aufruf warf also `TypeError: l is not a function` und riss bei jedem Render
  den ganzen Eintrag mit. Die Steuerung liest das aktive Modell jetzt über einen verpflichtenden
  Selector.
- **Die Modellquelle ist sitzagnostisch.** Sie bevorzugt den Session-Sitz `useTrajectory` (das
  Anfrage-Ledger, DSH 0.1.2+) und fällt auf `useConversation`
  (`ConversationSnapshot.views.get('trajectory')`) zurück, wenn Harness-Linien ihn nicht haben;
  ein Harness, der keinen der beiden Sitze bereitstellt, rendert nichts statt einer toten
  Steuerung.
- **Das Popover ist eine Slider-Zeile**: Preset-Slider (64K / 128K / 256K / 400K / 512K / 1M), der
  pro Geste einmal schreibt (Pointer-Release, Key-Release, Blur), der bestätigte Wert, ein
  eingeklappter Custom-Integer-Editor (`⋯`) und Clear. Die Pill zeigt nur den Wert; die
  `input.context.*`-Texte sind in allen vier Wörterbüchern wiederhergestellt.
- **Unverändert: der Editor der Einstellungskarte.** Kontextfenster-Presets pro Modell, der
  Custom-Integer und Clear bleiben exakt wie sie sind und schreiben in dieselben
  `llm-pi-ai`-/`llm-deepseek`-Namespaces.

### Breaking — nur DSH v0.1.2+ (`dsh-client-runtime`-Entfernung) — 0.7.2-beta.1

- **`engines.dsh` lautet jetzt `>=0.1.2-alpha.1 <0.2.0-0`.** `@deepseek-ai/dsh-client-runtime`
  wurde in `0.1.2-alpha.1` komplett gelöscht (Commit `be531688f3`); dieses Release ist die harte
  Segmentgrenze. Die bisherige Plugin-Linie (`0.7.1-beta.2` und älter) bedient weiter DSH
  0.1.0 / 0.1.1.
- **`ClientContext` ist weg.** `src/client/index.ts` importiert jetzt
  `Context as ClientContext` aus `@deepseek-ai/cordis`, wie jedes offizielle Client-Plugin.
  `@deepseek-ai/dsh-client-runtime` ist aus `peerDependencies`, `peerDependenciesMeta` und
  `devDependencies` entfernt und blockiert die Installation nicht mehr.
- **`src/types/contracts.d.ts` verliert das ambient
  `declare module '@deepseek-ai/dsh-client-runtime/client'`-Spiegel.** `SettingsScope` gewinnt die
  Snapshot-Felder `base` / `user` / `revision`, und `bind` nimmt ein optionales `decode`; der
  `SlotsFace`-Spiegel bleibt (der echte `SlotRegistry` in `@deepseek-ai/dsh-client-ui-renderer`
  liefert ihn zur Laufzeit).
- **`dsh.client.inject` listet `@deepseek-ai/dsh-client-ui-renderer`**, das Paket, das den
  `slots`-Dienst bereitstellt, in den sich dieses Plugin registriert.
- **Lokalisierte Registrierung nach Overload aufgeteilt.** Die Bulk-Form
  `register(ns, dicts)` ist auf die eingebauten Locale-IDs typisiert (nur `zh` / `en`), sodass
  die mitgelieferten `ja`-/`ko`-Wörterbücher jetzt über den Single-Locale-Overload
  `register(ns, locale, dict)` laufen und gemeinsam disposed werden. Das Verhalten ist
  unverändert; der Aufruf typecheckt jetzt gegen das echte Locale-Paket.

### Entfernt

- **Toter `agent/tool`-Listener.** Die Wall-Clock-Telemetrie pro Tool registrierte einen
  `ctx.on('agent/tool', …)`-Handler, der eine `started`-Map hielt und `tool … took …ms` loggte.
  DSH hat ein solches Event weder in 0.1.1-rc.2 noch in 0.1.2-rc.1 — die Scope-Event-Registry
  (`packages/core/scope/src/scoped-events.generated.ts`) listet zwölf `agent/*`-Events, und
  `agent/tool` ist keines davon — der Handler lief also nie, und die Log-Zeile wurde nie
  ausgegeben. Entfernt wurden der Listener, seine `started`-Map, der `pruneStale`-Durchlauf und
  die Konstante `TOOL_AGE_LIMIT_MS`.
- **Der Effort-Scheduler ist nicht betroffen.** Tool-Erkennung ist ein *Pull*, kein Push: Der
  `agent/request`-Waterfall ruft `recentToolCalls(payload.agent)` auf, das die `tool/call`-
  Einträge aus `agent.session.events` liest und `scheduleEffort` speist. Dieser Pfad hat eigene
  Tests (`tests/session-events.spec.ts`, `tests/thinking-level.spec.ts`) und wurde nicht
  angetastet.

### Behoben — Mainline zu 2.x umnummeriert — 2.0.0-beta.1

- **Die Kontextfenster-Schnellsteuerung crashte ihren Slot bei jedem Render.**
  `ContextQuick` rief den Standard-Session-Sitz als nackten Getter auf (`useSession()`). Jeder
  Renderer-Standard-Sitz ist ein `useSyncExternalStoreWithSelector`-*Selector-Hook*, gebunden von
  `bindSnapshotSelector` (`@deepseek-ai/dsh-client-ui-renderer`), sodass der Aufruf den Shim mit
  `selector === undefined` erreichte und `TypeError: l is not a function` warf: Der Eintrag
  `conversation.input.right` starb, und die Slot-Error-Boundary warf ihn bei jedem Render neu.
  Dieselbe Komponente las auch `session.views.get('trajectory')`, ein Feld, das `SessionSnapshot`
  nie trug (Views gehören zu `ConversationSnapshot`), hätte also auch ohne den Crash kein Modell
  auflösen können. Das aktive Modell kommt jetzt über den Session-Sitz `useTrajectory` durch einen
  stabilen Modul-Level-Selector über das Anfrage-Ledger.
- **Die Steuerung zog in die Modellmenü-Karte.** Sie registriert sich in
  `conversation.input.model.section` — der Leiste, die ui-model-selection unter den Zeilen Modell /
  Reasoning-Effort rendert — als kompakte Slider-Zeile: ein Preset-Slider (64K / 128K / 256K / 400K /
  512K / 1M), der pro Geste einmal schreibt (Pointer-Release, Key-Release, Blur), der bestätigte
  Wert, ein eingeklappter Custom-Integer-Editor und Clear. Die Texte reduzieren sich auf
  Zeilen-Label, Wert und Clear. Die Composer-Zeilen-Pill ist weg; die Einstellungskarte behält den
  vollständigen Editor pro Modell. Die Zeile erscheint auf Harnesses, deren Modellsitz diesen
  Kind-Slot deklariert (hinzugefügt in `packages/client/ui-model-selection`); auf älteren Harnesses
  bleibt die Registrierung pending und die Einstellungskarte bleibt der Editor.
- **`dsh.plugin.json`-Version synchronisiert** mit `package.json`; das 0.7.2-beta.1-Tarball hatte
  sie als 0.7.1-beta.2 ausgeliefert.
- **Versions-Umnummerierung: die Linie ist jetzt die Major-Ziffer.** Diese Mainline (DSH 0.1.2+)
  wird zu **2.x**, die Legacy-Linie (DSH < 0.1.2, Branch `compat/dsh-0.1.1`) zu **1.x**, sodass
  eine installierte Version sagt, welches Harness-Segment sie bedient. npm dist-tags behalten
  ihre Rollen: `beta` = diese Linie, `compat` = die Legacy-Linie. Alles andere bleibt für
  bestehende Installationen gleich; ein `0.7.x`-Range matcht `2.x` schlicht nicht, der Wechsel
  ist also explizit.
- **Die Modellmenü-Zeile braucht einen Harness, der den Sitz deklariert.**
  `conversation.input.model.section` wird zu `packages/client/ui-model-selection` hinzugefügt
  (Deklaration + `renderSlot`-Aufruf); bis ein Harness-Release ihn trägt, bleibt die Registrierung
  pending und die Einstellungskarte bleibt der Editor. Kein veröffentlichter Harness hat ihn heute.

## [0.7.0] — 2026-09-09

> **Stabiles Release.** Die Short-Circuit-Route ist eingestellt; alle Gateway-Fixes fahren jetzt
> über die offizielle `llm-pi-ai`-Compat-Oberfläche (dsh ≥ **v0.1.0-rc.8**). Diese Version enthält
> auch die Kontextfenster-Presets aus dem früheren 0.7.0-Entwurf.

### Hinzugefügt

- **Mehrstufige Kontextfenster-Presets** im Fähigkeits-Editor pro Modell: Preset-Buttons
  `64K / 128K / 256K / 400K / 512K / 1M` plus Custom-Integer-Eingabe und Clear-Button, geschrieben
  in den `llm-pi-ai`-Modell-`contextWindow` und vom Harness live konsumiert (Kompaktion /
  Kontext-Überlauf-Erkennung / Kontextdruck-Projektionen) bei der nächsten Anfrage — kein Neustart
  nötig.
- Neues reines Modul `src/context-window.ts` (Range-Konstanten `2000`–`1_000_000`, Preset-Liste,
  `formatContextWindow`, `validateContextWindow`), geteilt vom Konfigurationsschema, der
  Einstellungskarte und den Tests.
- Konfigurationsoberfläche: `models[].contextWindow`-Übersteuerung mit Ganzzahl-Validierung
  `2000`–`1000000` akzeptiert (Fail-loud bei Werten außerhalb des Bereichs).
- Neue `zh` / `en` / `ja` / `ko`-Texte für die Kontextfenster-Steuerung.
- `dsh.plugin.json` hinzugefügt mit `engines.dsh: ">=0.1.0-rc.8"`.
- `peerDependencies` für `dsh-client-runtime`, `dsh-client-locale`, `dsh-client-ui-settings`,
  `dsh-client-ui-slots` hinzugefügt (alle optional).

### Entfernt

- **Die Short-Circuit-Takeover-Brücke**: das Plugin pflegt keine `llm-openai-completions`-Takeover-
  Liste mehr (`nextTakeoverSection` / `TakeoverSection` sind weg). Das Adapter-Plugin
  `dsh-llm-openai-completions` wird neben diesem Release NICHT benötigt und kann deinstalliert
  bleiben.

### Geändert

- **Auto-Compat-Brücke auf die offizielle Compat-Oberfläche umgeschrieben**
  (`withOfficialCompatFixes`): für jede Custom-openai-completions-Gateway-Route, die Thinking
  deklariert, schreibt der Sync jetzt
  - auf Routen-Ebene `compat.supportsDeveloperRole: false` (Systemprompt als `system` gesendet —
    fixiert den vLLM-/SGLang-400er `Unexpected message role`), und
  - auf Modellebene `compat.thinkingFormat: 'qwen-chat-template'` für Toggle-artige Thinking-Zeilen
    (kein Effort-Support auf Zeilenebene), sodass pi-ai `chat_template_kwargs.enable_thinking`
    sendet — nackte vLLM-Server ignorieren das Top-Level-`enable_thinking` des schlichten
    `qwen`-Formats.
- Das Speichermuster folgt dsh-thinking-efforts Host-Seite: Lesen → reine Transformation (Identität,
  wenn nichts zu ändern) → `settings.update('llm-pi-ai', …)` der ganzen Sektion, sodass dshs
  `llm-pi-ai`-Schema-Validator den Schrieb dort gatet, wo er GESCHRIEBEN wird; ein dsh vor rc.8
  weist das unbekannte Feld zurück, und der Sync loggt und behält die bisherige Sektion. Explizite
  Werte auf beliebiger Ebene werden respektiert und nie überschrieben.
- **Fähigkeitskarte de-short-circuited**: der Schalter „Short-Circuit-Takeover“ wird ersetzt durch
  einen Provider-spezifischen Schalter **„Gateway lehnt die Developer-Rolle ab“** (schreibt/löscht
  das Flag auf Routen-Ebene; Abwählen stellt Vererbung wieder her). Das Takeover-Listen-Gating ist
  weg — die Modelle jedes llm-pi-ai-Providers sind direkt editierbar, in progressiven Schichten:
  ① Thinking + Vision → ② Effort-Support (nur Thinking-Modelle) → ③ Effort-Wire-Editor →
  ④ thinkingFormat → ⑤ Kontextfenster. Das Einschalten von Thinking bei einem Toggle-artigen Modell
  füllt `thinkingFormat: 'qwen-chat-template'` automatisch (nur wenn abwesend); das Einschalten von
  Effort entfernt es wieder.
- `declaresThinking` scannt jetzt auch `modelOverrides` (bisher nur `models[]`), sodass auch
  nur-modelOverrides-Routen identifiziert und gefixt werden.
- Das Adapter-Posture-Lese-Gate (`takeoverOf` / `piAiPosture`) bleibt, ist aber inert: Ohne den
  Adapter liefert es native pi-ai-Semantik.
- Das Kontext-Badge nutzt jetzt das gemeinsame `formatContextWindow`, damit geschriebene Presets
  exakt angezeigt werden (z. B. `256000` → `256K`, `1000000` → `1M`).

### Hinweise

- Erfordert dsh ≥ **v0.1.0-rc.8** für die offizielle Compat-Oberfläche. Auf älterem dsh verweigert
  das Schema die Compat-Felder (Fail-loud, keine stille Fehlkonfiguration).
- Das clientseitige Inline-`<think>`-Splitting bleibt eine Gateway-Angelegenheit: nacktes vLLM
  braucht `--reasoning-parser qwen3`; pi-ai (≤ 0.85.1) parst nur `reasoning_content` /
  `reasoning` / `reasoning_text`. `qwen-chat-template` trägt kein `reasoning_effort` (die
  Format-Branches sind gegenseitig exklusiv) — Effort-Levels schalten nur `enable_thinking` an/aus.
  Echtes Parallelbetrieb (chat_template_kwargs + reasoning_effort) erfordert eine Upstream-Änderung
  an pi-ai.
- Verifikationsmaterialien leben auf dem `check`-Branch (`check/CHECK.md`,
  `check/record-proxy.mjs`, `check/settings-route.example.yaml`); sie sind nicht Teil des
  npm-Pakets.

## [0.6.0] — 2026-02-?

### Hinzugefügt

- **Acht Standardstufen** im Einklang mit dsh-thinking-effort: `off / on / minimal / low / medium / high / xhigh / max` (plus die `auto`-Scheduler-Maske). `on` ist der Thinking-An/Aus-Schalter, geklemmt auf die Standardstärke des Modells (`high` oder die höchste beworbene Thinking-Stufe); `minimal` / `medium` / `xhigh` werden durchgereicht, wenn ein Custom-Gateway sie bewirbt, und kollabieren auf dem offiziellen Adapter auf `high`.
- **Individuelles Wire-Mapping in der Einstellungskarte** (von dsh-thinking-effort übernommen): jede Stufe kann abgehakt und mit dem exakten Wert versehen werden, der an das Gateway gesendet wird (z. B. `high` → `ultra`); leeres `off` bedeutet „nicht senden“. Gespeichert als `reasoningEfforts`-Tabelle des Modells.
- **Überholte Darstellung der Einstellungskarte** (von dsh-thinking-effort übernommen): Provider gruppieren ihre Modelle, jede Modellzeile zeigt Text-/Bild-/Kontext-Badges, Modelle klappen zu einem Editor pro Stufe auf, ein Suchfeld filtert Modelle, und Ein-Klick-Presets (offizieller DeepSeek-Stil / generisch) greifen auf jedes Thinking-Modell.
- **Mehrsprachig**: japanische (`ja`) und koreanische (`ko`) Wörterbücher, plus `README.ja.md` / `README.ko.md`, `INSTALL.{md,zh,ja,ko}.md` und `CHANGELOG.{md,ja,ko}.md`. Hinweis: Die offizielle DSH-Locale-Runtime stellt weiterhin nur `zh` / `en` bereit, daher erfordert die Auswahl von `ja` / `ko` einen DSH-Fork (siehe Kompatibilitätshinweis in der README).

### Geändert

- Die `level`-Konfigurationsoberfläche akzeptiert alle neun Werte (`off | on | minimal | low | medium | high | xhigh | max | auto`).
- Die `models[].efforts`-Übersteuerung akzeptiert die erweiterten Stufen.
- Karten-Renderer refaktoriert; Fähigkeits-Editoren nutzen jetzt einen gestuften Wire-Entwurf mit explizitem **Apply levels**-Button statt sofortiger Checkbox-Commits.

### Behoben

- Unbenutzten Helper `effortLevelsOf` entfernt; die Lint-Warnung des unbenutzten Parameters `_N` zum Schweigen gebracht.

## [0.5.2] — 2026-02-?

### Hinzugefügt

- **Auto-Takeover von `dsh-llm-openai-completions`**: Provider, die Custom-openai-completions-Gateways sind (`api: openai-completions` oder nicht-offizielle baseURL) **und** auf irgendeinem Modell eine `reasoningEfforts`-Tabelle deklarieren, werden mit `enabled: true` in `llm-openai-completions.providers` zusammengeführt. Läuft beim Plugin-Start, bei `llm/adapters-updated` und bei Einstellungsänderungen; weich gekoppelt (überspringt den Schrieb, wenn der Namespace nicht registriert ist).

## [0.5.1] — 2026-02-?

### Hinzugefügt

- Modellfähigkeits-Editor-Karte: Vision / Thinking / Effort-Support / Effort-Levels / Thinking-Format für jedes Modell eines Custom-`llm-pi-ai`-Providers, direkt in den `llm-pi-ai`-Settings-Namespace geschrieben (keine Änderungen an offiziellen Paketen).

## [0.5.0] — 2026-02-?

### Hinzugefügt

- Modellbewusster Schutz: nie einen `reasoning_effort` an ein Modell senden, das ihn nicht bewirbt (Custom-openai-completions-Routen wie Qwen3.6 werden stattdessen entfernt).
- `low`-Durchreichung auf dsh rc.7+; rc.6-Adapter können `low` über eine konfigurierer-bestätigte `models`-Übersteuerung bewerben.
- `models`-Konfigurationssektion (`provider/model` → `vision` / `thinking` / `efforts`).

## [0.4.1] — 2026-02-?

### Behoben

- Der `resolveModel`-Wrapper des Adapters läuft jetzt erneut bei `llm/adapters-updated`, sodass die `Auto`-Maske auch dann erscheint, wenn sich Adapter nach dem Plugin-Apply registrieren.

## [0.4.0] — 2026-02-?

### Geändert

- Wertabhängigkeit von `@deepseek-ai/dsh-settings` entfernt; die Einstellungsregistrierung läuft über den Cordis-`settings`-Dienst (lokales `installSettingsSection`-Äquivalent).
- Die Karten-Registrierung liefert sowohl `id` als auch `key`, sodass sie auf CLI- (keyed) und DSH-Desktop- (list) Slot-Deklarationen funktioniert.

## [0.3.0] — 2026-02-?

### Hinzugefügt

- `Auto` in der Modellauswahl (Maske): injiziert in die `resolveModel`-Efforts des Adapters; das Plugin plant `low` / `high` / `max` pro Schritt über den `agent/request`-Waterfall (mit `prepend` registriert, damit die Session-Modellauswahl-Assembly es nicht überschreiben kann).

## [0.2.1] — 2026-02-?

### Behoben

- `exports["./client"]` hinzugefügt, damit das Client-Bundle vom Client-Module-Loader von dsh gefunden wird.

## [0.2.0] — 2026-02-?

### Hinzugefügt

- Erste Client-Einstellungskarte (Stufen-Wähler + Scheduler-Schalter).

## [0.1.1] — 2026-02-?

### Behoben

- Veröffentlichung des kompilierten `lib/` statt roher TS-Quellen (Node 22 verbietet Type-Stripping von `.ts` unter `node_modules`).

## [0.1.0] — 2026-02-?

### Hinzugefügt

- Erste Version: `agent/request`-Injektion eines festen Reasoning-Efforts.
