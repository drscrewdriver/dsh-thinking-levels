# dsh-thinking-levels

**Rundenweise Denkstufen-Steuerung (`reasoning_effort`) für [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness): Wählen Sie in der Session-Modellauswahl `Auto` (eine Maske) und das Plugin plant `low` / `high` / `max` aus dem recenten Verlauf der Tool-Aufrufe, bevor der Aufwand an die API übermittelt wird — oder fixieren Sie manuell einen Wire-Level (`off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`). Billige Tool-Runden bleiben billig; schwere Arbeiten verhungern nie ohne Reasoning.**

- [Deutsche README](./README.de.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [Installationsanleitung auf Deutsch](./INSTALL.de.md)
- [Installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [Changelog auf Deutsch](./CHANGELOG.de.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

> **v0.7.0-beta.1 (2026-09-06): die Short-Circuit-Route wird eingestellt.** Diese Version hängt nicht mehr von `dsh-llm-openai-completions` ab — Gateway-Fixes für eigene Gateways fahren über die offizielle `llm-pi-ai`-Compat-Oberfläche (erfordert **dsh ≥ v0.1.2-alpha.1**); das Adapter-Plugin sollte deinstalliert bleiben. Siehe [CHANGELOG](./CHANGELOG.md).

> **▼ Unterstützte DSH-Versionen**
>
> Diese Version (4.0.0) unterstützt ausschließlich **DSH v0.2.0-rc.1 bis < 0.2.1**.
>
> | DSH-Version | Status | Hinweise |
> | --- | --- | --- |
> | ≥ 0.2.0-rc.1 | ✅ Unterstützt | Diese Version (4.0.x): dieselbe deklarative Einstellungsoberfläche (`.volatile()`-Schemafelder, vom Host gerendert; pluginübergreifende Lese-/Schreibzugriffe über den `configForms`-Dienst), mit dem Peer-Gate neu auf das 0.2.0-rc-Segment ausgerichtet |
> | ≥ 0.1.7-rc.1 bis < 0.2.0 | ✅ Unterstützt | Nutzen Sie die 3.x-Linie (3.4.3, npm dist-tag `dsh-0.1.7`): deklarative Einstellungen — der Host rendert das Plugins-Formular aus den `.volatile()`-Schemafeldern des Plugins; pluginübergreifende Lese-/Schreibzugriffe laufen über den `configForms`-Dienst |
> | < 0.1.7-rc.1 | ⚠️ Nicht unterstützt | DSH 0.1.7 entfernte die imperative Einstellungsregistrierung und den pro Plugin kartierten Sitz, auf den frühere Linien (3.0.x und älter) setzten — bleiben Sie bei Plugin 3.0.2 für 0.1.2–0.1.6-Hosts. |
>
> Die Grenze ist `0.1.7-rc.1`, wo DSH die imperative Einstellungsregistrierung (`settings.register` / `installSettingsSection`) und den Client-Dienst `settingsScope` entfernte. Seit dieser Grenze sind laufzeitveränderbare Konfigurationsfelder im Schemastery-Schema als `.volatile()` markiert, der Host erzeugt das Einstellungsformular allein aus diesem Schema (kein Registrierungsaufruf, keine Client-Einstellungskarte), und das Plugin liest die Live-Werte pro Anfrage, angetrieben von `loader/volatile-update`. Die Linien 3.1.x–3.4.x zielen auf die deklarative Oberfläche von 0.1.7; die Linie 4.0.x ist dieselbe Oberfläche, neu ausgerichtet auf das 0.2.0-rc-Segment.

> **Versionsbereichs-Politik:** Jede Kompatibilitätslinie pinnt ihren Host-Segment eng. Linien für 0.1.x-Hosts folgen `>=0.1.x-rc.1 <0.1.(x+1)-0` (3.1.x: `>=0.1.7-rc.1 <0.1.8-0`; 3.0.x: `>=0.1.5-alpha.1 <0.1.6-0`; 2.0.x: `>=0.1.2-alpha.1 <0.1.3-0`; 1.0.0-beta: `>=0.1.0-rc.8 <0.1.2-alpha.1`); Linien für das 0.2.x-Segment folgen `>=0.2.0-rc.1 <0.2.1-0` (4.0.x: `>=0.2.0-rc.1 <0.2.1-0`). Keine Linie deklariert je eine offene Obergrenze, sodass ein Kompatibilitätsresolver eine Plugin-Linie niemals auf ein neueres Host-Segment matchen kann, für das sie nicht gebaut wurde. 0.4.0–0.6.0 trugen überhaupt keine dsh-Peer-Deklarationen und sind faktisch kompatibilitätsuntypisiert — nicht installieren.

> **Kompatibilitätshinweis:** Version `0.6.0` enthält japanische (`ja`) und koreanische (`ko`) Wörterbücher und Selektoreinträge, aber die aktuellen offiziellen DSH-Releases stellen über `LocaleRuntime` nur `zh` und `en` bereit. Auf einem unveränderten DSH schlägt die Auswahl von `ja` oder `ko` mit `locale "<id>" is not registered` fehl. Diese Sprachen funktionieren, sobald das offizielle DSH die Locale-IDs ergänzt. Fortgeschrittene Nutzer können einen DSH-Fork pflegen, der `packages/client/locale/src/locale-settings.ts` (`LOCALE_IDS`) und `packages/client/locale/src/client/index.ts` (`LOCALES`-Labels) zusammen mit den zugehörigen Kern-Wörterbüchern und Tests aktualisiert, und dann den geforkten DSH neu bauen und betreiben. Eine Änderung nur an diesem Plugin kann DSHs globale Locale-Liste nicht erweitern.

In einer mehrstufigen Tool-Kette denkt das Modell vor **jedem** Tool-Aufruf neu nach — und dieses Denken dominiert die Wanduhrzeit (eine Agent-Aufgabe mit 50 Schritten kann Minuten zwischen den Tools mit Reasoning verbringen). `dsh-thinking-levels` hängt sich in den `agent/request`-Waterfall, den dsh für jeden Schritt neu auflöst (mit `prepend` registriert, damit die Session-Modellauswahl-Assembly seine Entscheidung nicht überschreiben kann) und injiziert eine Denkstufe in die nächste Modellanfrage.

## Vorschau

Screenshots der laufenden UI (dsh web):

<figure>
  <img width="460" alt="Vom Plugin injiziertes Auto-Dropdown der Modellauswahl: Stufen Off / Low / High / Max / Auto, High aktuell ausgewählt, Auto hervorgehoben — Auto ist eine Maske, das Plugin plant low/high/max pro Schritt aus dem Tool-Verlauf." src="assets/官方模型的自动级别调整.png" />
  <figcaption>Die native Modellauswahl gewinnt <strong>Auto</strong> — wählen Sie es, und das Plugin plant low/high/max pro Schritt statt eines festen Wire-Levels.</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="Denkstufen-Einstellungen (3.0.x-Karte gezeigt): Standardstufe (Auto-Planung), Schalter Aktivieren / Downgrade erlauben / Upgrade erlauben, Modellfähigkeits-Tabelle des Custom-Providers llm-pi-ai mit dem progressiven Editor pro Modell sowie Apply-to-all-Presets (Off/High/Max offizieller DeepSeek-Stil, Off/Low/Medium/High generisch)." src="assets/自动思考级别配置.png" />
  <figcaption>Denkstufen-Einstellungen, 3.0.x-Karte (Screenshot als Referenz erhalten). Seit 3.1.0 / DSH 0.1.7 werden Stufe und Scheduler-Schalter als hostgeneriertes deklaratives Formular gerendert; die eigene Karte samt llm-pi-ai-Fähigkeitseditor wurde mit dem eingestellten Sitz entfernt.</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="Fähigkeits-Editor pro Modell für ein Custom-openai-completions-Modell (local-35b / Qwen3.6-35B-A3B), wie in der 3.0.x-Einstellungskarte ausgeliefert: Thinking-Modell und Vision aktiviert, Support für Think-Effort aus, Thinking-Format qwen-chat-template (automatisch ausgefüllt); kein Takeover-Schalter — das offizielle Compat-Flag liegt auf der Provider-Zeile; Kontextfenster-Limit-Presets 64K/128K/256K/400K/512K/1M mit benutzerdefinierter Eingabe." src="assets/自定义模型的思考接管-短路-上下文窗口限制.png" />
  <figcaption>Fähigkeitskarte pro Modell, 3.0.x (Screenshot als Referenz erhalten). Seit 3.1.0 / DSH 0.1.7 wird der Fähigkeits-Editor nicht mehr ausgeliefert; bearbeiten Sie llm-pi-ai-Modellfähigkeiten über die offiziellen Models-Einstellungen.</figcaption>
</figure>

## Stufen

| Stufe | Bedeutung | Ort |
|---|---|---|
| `off` | Denken deaktiviert (nur manuell — wird nie automatisch gewählt) | Modellauswahl / Standardstufe |
| `on` | Denken aktiviert (nur Toggle-only-Modelle): sendet `enable_thinking`, nie einen Think-Effort | Modellauswahl / Standardstufe |
| `minimal` | geringster Aufwand (sehr leichte Aufgaben) | Modellauswahl / Standardstufe |
| `low` | manuelle Wahl für einfache Chat-Aufgaben (billige Runden bleiben billig) | Modellauswahl / Standardstufe |
| `medium` | mittlerer Aufwand | Modellauswahl / Standardstufe |
| `high` | der offizielle Standard-Aufwand | Modellauswahl / Standardstufe |
| `xhigh` | extra hoher Aufwand | Modellauswahl / Standardstufe |
| `max` | schwere Arbeit | Modellauswahl / Standardstufe |
| `auto` | **Maske**: plant pro Schritt aus dem recenten Tool-Aufruf-Verlauf, wird vor der Übermittlung zu einem Wire-Level aufgelöst | Modellauswahl (vom Plugin injiziert) / Standardstufe |

Wire-Level-Fakten (geprüft gegen die offizielle DeepSeek-Dokumentation und dshs `llm-deepseek`-Adapter): `low` mappt 1:1 auf deepseek-v4-flash / v4-pro, während `medium` / `xhigh` auf `high` kollabieren. Der Adapter akzeptiert nur `off | low | high | max` und weist alles andere mit `UNSUPPORTED_REASONING_EFFORT` zurück — `auto` ist die Maskenschicht des Plugins, wird nie direkt an die API gesendet und vor der Injektion stets zu einem konkreten Wire-Level aufgelöst. `on` ist **kein** Effort-Level: Es wird nur von Toggle-only-Modellen (Qwen3.6-Stil) beworben und schaltet lediglich `enable_thinking` auf true — kein `reasoning_effort` wird gesendet; ein effort-fähiges Modell bewirbt nie `on`, daher wird eine manuelle `on`-Wahl dort entfernt.

## Individuelles Wire-Mapping

Für handdeklarierte `llm-pi-ai`-Modelle mappen Sie jede Stufe auf den exakten Wert, den Ihr Gateway erwartet (von dsh-thinking-effort übernommen): haken Sie eine Stufe ab und tragen Sie ihren Wire-Wert ein, z. B. `high` → `ultra`. Das Mapping wird als `reasoningEfforts`-Tabelle des Modells in der `llm-pi-ai`-Konfiguration gespeichert, sodass die Composer-Auswahl `High` `ultra` an das Gateway sendet. Lässt man `off` leer, bedeutet das „nicht senden“.

- Offizielles Preset: `Off / High / Max` (offizieller DeepSeek-Stil)
- Generisches Preset: `Off / Low / Medium / High`

> Der visuelle Editor für dieses Mapping saß auf der Einstellungskarte des Plugins, die die DSH-0.1.7-Migration entfernte (der Sitz existiert nicht mehr). Bearbeiten Sie die `reasoningEfforts`-Tabelle stattdessen über die offizielle Models-Einstellungsoberfläche — die Host-seitige Erkennung und Injektion lesen diese Konfiguration ohnehin live.

## Kontextfenster-Presets

Die Schnellsteuerung in der Composer-Tool-Zeile (neben der Modell-/Effort-Auswahl) bearbeitet ein **Kontextfenster-Limit**: Preset-Stufen `64K / 128K / 256K / 400K / 512K / 1M`, eine Eingabe für eigene Ganzzahlen und ein Löschen-Button. Der Wert wird in den `contextWindow`-Eintrag des `llm-pi-ai`-Modells (Ganzzahl `2000`–`1000000`) geschrieben — oder in den `llm-deepseek`-Eintrag für offizielle DeepSeek-Modelle.

Stromaufwärts konsumiert der Harness den Wert über `resolveModelInfo(...).context.contextWindow` für Kompaktions-Schwellen, Kontext-Überlauf-Erkennung und Kontextdruck-Projektionen. Da `llm-pi-ai` die Live-Konfiguration bei jeder Auflösung neu liest und der Compat-Sync die Modell-Erkennung nicht blockiert, greift eine Einstellungsänderung bei der nächsten Anfrage ohne Neustart.

Die Plugin-Konfiguration akzeptiert außerdem `models['provider/model'].contextWindow` als validierte Deklaration (Ganzzahl `2000`–`1000000`) auf der Composition/Konfigurationsoberfläche.

## Modellbewusster Schutz (v0.5.0)

Das Plugin sendet nie einen `reasoning_effort` an ein Modell, das keinen bewirbt. Eigene
openai-completions-Routen (z. B. ein lokales Qwen3.6 ohne `reasoningEfforts`) werden über
`ctx.llm.resolveModelInfo` als non-reasoning eingestuft, und jeder Aufwand — geerbter oder
geplanter — wird **entfernt**, statt gesendet zu werden, sodass dshs pro-Anfrage-Zurückweisung
`UNSUPPORTED_REASONING_EFFORT` nicht auslösen kann. Nicht unterstützte Felder werden nie an eine
API weitergegeben, die sie nicht annehmen kann.

Versionsverhalten:

| dsh-Version | `low`-Behandlung |
|---|---|
| rc.6 (alt) | nicht nativ: die Auswahl zeigt ihn nur, wenn eine vom Konfigurierer bestätigte `models`-Übersteuerung ihn nennt; die Stufe wird dann beworben (Auswahl + Anfrage-Validierung) und unverändert durchgereicht |
| rc.7+ (neu) | nativ: das Plugin schreibt ihn weder um noch injiziert ihn erneut; eine manuelle `low`-Wahl geht unverändert durch |

Der Auto-Scheduler kann `low` weiterhin für unterstützende Modelle wählen — der Fähigkeits-Schutz oben hält ihn von Modellen fern, die ihn nicht annehmen können.

## Auto in der Modellauswahl

Die Session-Modellauswahl (neben dem Modell) bietet jetzt **Auto** nach den Wire-Levels an (in die Modellverzeichnis-Metadaten vom Plugin injiziert):

| Auswahl in der Modellauswahl | Verhalten |
|---|---|
| **Auto** | das Plugin plant über Tool-Verlauf + die Upgrade-/Downgrade-Schalter und löst vor der Übermittlung zu `low` / `high` / `max` auf |
| `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max` | **die manuelle Wahl gewinnt** — das Plugin greift nicht ein (`on` bleibt `on` auf Toggle-only-Modellen, wird nie zu einem Effort angehoben; effort-fähige Modelle entfernen es) |
| nicht gesetzt | die Standardstufe des Plugins greift (unten) |

## Auto-Scheduler

Der Hub ist `high` (der offizielle Standard). `auto` plant zwischen `low` / `high` / `max`; es wählt nie `off`.

| Recent Tool-Aufrufe | Stufe |
|---|---|
| keine (frischer Prompt, reiner Chat) | `low` |
| ≥75 % einfache Tools, kleine Argumente, Downgrades erlaubt | `low` |
| gemischte / schwere Tools | `high` |
| sehr schwere Payloads, Upgrades erlaubt | `max` |

Die Planungspolitik stammt aus derselben Quelle wie [dsh-tool-turbo](https://github.com/drscrewdriver/dsh-tool-turbo) (dieselbe Simple-Tool-Whitelist / dieselben Payload-Schwellen / dieselbe 75-%-Regel).

## Installation

Siehe [INSTALL.md](./INSTALL.de.md) für die vollständige Anleitung der offiziellen CLI (Profil-Erkennung, Upgrade, Migration, Verifikation, Fehlerbehebung). Schnellstart:

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

> Hinweis: Die dsh-Runtime nutzt pnpm 11, dessen `minimumReleaseAge`-Supply-Chain-Politik eine frisch veröffentlichte Version mit `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` blockieren kann — fügen Sie die Version zu `minimumReleaseAgeExclude` in `~/.dsh/profiles/web/pnpm-workspace.yaml` hinzu, um die Abklingzeit aufzuheben.

Manuelle `link:`-Registrierung (Alternative zu `dsh plugin add`):

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

## Konfiguration

Zwei Oberflächen teilen sich ein Schema:

- **Assembly** — das `config:` der Plugin-Zeile in der Profil-Composition (z. B. `cordis.yml`):
  ```yaml
  config:
    level: auto            # off | on | minimal | low | medium | high | xhigh | max | auto — the default level when the session picks nothing
    allowDowngrade: true   # let the scheduler drop below `high`
    allowUpgrade: false    # forbid the scheduler lifting to `max`
  ```
- **Laufzeit** — die `.volatile()`-Konfigurationsfelder des Plugins (`enabled`, `level`, `allowDowngrade`, `allowUpgrade`): DSH 0.1.7 erzeugt das Plugins-Einstellungsformular aus dem deklarierten Schema, und bestätigte Änderungen erreichen das Plugin als Live-Konfigurationsreferenzen (`loader/volatile-update`) — sie greifen bei der nächsten Modellanfrage, ohne Neustart. (`models` bleibt ein Feld auf Konfigurierer-Ebene: bearbeiten Sie es in der Profil-Composition.)

Modellfähigkeits-Übersteuerungen (`models`, Schlüssel `provider/model`) bestätigen, was die Auto-Erkennung findet; der Konfigurierer hat das letzte Wort:

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

> Für Qwen-Thinking an/aus + Budget konfigurieren Sie stattdessen die **llm-pi-ai**-Route:
> `compat.thinkingFormat: qwen` (→ Wire-`enable_thinking` + `thinking_budget` über
> `thinkingBudgets`) oder `qwen-chat-template` (→ `chat_template_kwargs.enable_thinking`) für
> Effort-Modelle wie Qwen3.8-27B.

Standardwerte: `{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false, models: {} }`.

> Semantik: Die Wahl in der Modellauswahl rangiert über der Standardstufe des Plugins. Wählen Sie `auto` (Maske) → das Plugin plant; wählen Sie einen Wire-Level → direkt angewendet; nichts wählen → der `level`-Standard des Plugins greift. `allowDowngrade` / `allowUpgrade` beschränken nur die `auto`-Planung.

## Offizielle Compat-Oberfläche: das Short-Circuit-Tool wird eingestellt (0.7.0-beta.1)

Sobald eigene Gateways (vLLM / LM Studio / selbst gehostete OpenAI-kompatible Proxies) Thinking deklarieren, schreibt dieses Plugin die Fixes in die **offizielle `llm-pi-ai`-Compat-Oberfläche** (eingeführt in dsh ≥ **v0.1.0-rc.8**, Commit `884f7b9c41`) — [dsh-llm-openai-completions](https://github.com/drscrewdriver/dsh-llm-openai-completions) wird nicht mehr benötigt und sollte deinstalliert bleiben:

- Scannt `llm-pi-ai.providers` nach Routen, die eigene openai-completions-Gateways sind (`api: openai-completions` oder eine nicht-offizielle baseURL) **und** auf irgendeinem Modell eine `reasoningEfforts`-Tabelle deklarieren (einschließlich `modelOverrides`), und schreibt dann:
  - auf Routen-Ebene `compat.supportsDeveloperRole: false` — der Systemprompt geht als `system` raus und fixiert den vLLM-/SGLang-400er `Unexpected message role`;
  - auf Modellebene `compat.thinkingFormat: 'qwen-chat-template'` für Toggle-artige Thinking-Zeilen (Thinking-Tabelle ohne `supportsReasoningEffort` auf Zeilenebene) — pi-ai sendet dann `chat_template_kwargs.enable_thinking` (nackte vLLM-Server ignorieren das Top-Level-`enable_thinking` des schlichten `qwen`-Formats);
- Schritte laufen über den offiziellen Einstellungskanal (Lesen → reine Transformation → `settings.update('llm-pi-ai', …)` der ganzen Sektion), sodass dshs Schema den Schrieb **dort, wo er geschrieben wird**, validiert: ein dsh älter als rc.8 weist die Felder mit einer Log-Warnung zurück — keine stille Fehlkonfiguration; explizite Werte auf beliebiger Ebene werden nie überschrieben;
- Ausgelöst beim Plugin-Start, bei `llm/adapters-updated` und bei `llm-pi-ai`-Konfigurationsänderungen — kein manuelles Konfigurations-Editing;
- Das clientseitige Inline-`<think>`-Splitting bleibt eine **Gateway-Angelegenheit**: nacktes vLLM braucht `--reasoning-parser qwen3` (pi-ai parst nur `reasoning_content` / `reasoning` / `reasoning_text`).

# Hinweis zu Abhängigkeiten

Die Host-Hälfte hat **keine** Wertabhängigkeit von `@deepseek-ai/dsh-settings` — seit der DSH-0.1.7-Linie gibt es gar keine Einstellungsregistrierung mehr: Das Einstellungsformular wird vom Host aus dem vom Plugin deklarierten Schemastery-Schema (`.volatile()`-Felder) erzeugt, und die Client-Hälfte spricht mit dem `configForms`-Dienst, den die dsh-Runtime bereitstellt. Offizielle Pakete müssen nicht manuell ins Profil installiert werden. `dependencies` ist nur `@deepseek-ai/schemastery` (wird mit dem Paket automatisch installiert).

## Entwicklung

```bash
npm run lint        # eslint (typescript-eslint flat config)
npm run typecheck   # tsc --noEmit
npm test            # vitest — 46 tests
```

Testabdeckung: Stufenpolitik (manuelle Durchreichung inkl. der erweiterten Stufen, `on`-Clamping, Auto-Scheduler, Validierung, Simple-Tool-Grenze), der Modellfähigkeits-Schutz (`reasoningEffortSupported`, Entfernen/Durchreichen in `resolveEffortInjection`), Session-Event-Parsing (Guards, Fenster-Deckel, fehlerhafte Datensätze), das Konfigurationsschema (Defaults-Lockstep, Zurückweisung außerhalb des Bereichs, `models`-Übersteuerungen) und der offizielle Compat-Sync (Identifikation, Respekt expliziter Werte, Identitäts-Idempotenz, Schema-Gating beim Schreiben).

## Lizenz

MIT
