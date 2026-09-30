# Installationsanleitung (offizielle DSH-CLI)

Diese Anleitung nutzt ausschließlich den offiziellen Befehl `dsh plugin`. Der Befehl installiert die Abhängigkeit in ein Profil und synchronisiert `dsh.profile.bundles`. Ersetzen Sie ihn nicht durch ein schlichtes `npm install`, ein direktes `pnpm add` im Profil oder manuelle Bearbeitungen des Profil-Manifests.

- [Installationsanleitung auf Deutsch](./INSTALL.de.md)
- [English installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

Die Platzhalter in dieser Anleitung sind:

- `<profile>`: das zu ändernde DSH-Profil, meist `web`;
- `dsh-thinking-levels`: das npm-Paket und die Laufzeit-Plugin-ID;
- `thinking-levels`: die Cordis-Composition- und Einstellungs-Slot-ID.

> **Versionsanforderung — DSH v0.2.0-rc.1 oder neuer.**
>
> Prüfen Sie zuerst die laufende Version (`dsh --version`).
>
> | DSH-Version | Aktion |
> | --- | --- |
> | ≥ 0.2.0-rc.1 | Installieren Sie diese Version (4.0.x). |
> | ≥ 0.1.7-rc.1 bis < 0.2.0 | Installieren Sie die 3.x-Linie: `dsh plugin --profile <profile> add dsh-thinking-levels@dsh-0.1.7 -w` (3.4.3). |
> | < 0.1.7-rc.1 | Bleiben Sie bei der vorherigen Plugin-Linie (3.0.2). Betreiben Sie keinen älteren Plugin-Build gegen DSH 0.1.7+ — aktualisieren Sie stattdessen das Plugin. |
>
> Die Grenze ist `0.1.7-rc.1`, wo DSH die imperative Einstellungsregistrierung (`settings.register` / `installSettingsSection`) und den Client-Dienst `settingsScope` entfernte. Seit dieser Grenze zielen sowohl die 3.x-Linie (0.1.7-Hosts) als auch diese Version (0.2.0-rc-Hosts) auf dieselbe deklarative Einstellungsoberfläche (`.volatile()`-Schemafelder + `configForms`).

> Ältere DSH-Linien installieren sich von npm über ihren dist-tag: `dsh plugin add dsh-thinking-levels@dsh-0.1.7` (DSH 0.1.7–0.1.x, Plugin 3.4.3), `...@dsh-0.1.5` (DSH 0.1.5), `...@dsh-0.1.2` (DSH 0.1.2), `...@compat` (DSH 0.1.0–0.1.1). Installieren Sie niemals die nackten `0.x`-Versionen aus der `latest`-Ära (≤ 0.6.0) — sie tragen keine dsh-Peer-Deklarationen.

## 0. Voraussetzungen und Profil-Erkennung

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Nutzen Sie das Profil, das Ihr laufender DSH-Prozess nennt. `web` ist üblich, aber das aktive `--profile`-Argument ist maßgeblich.

## 1. Offizielle Installation

Installieren Sie die neueste Version:

```bash
dsh plugin --profile <profile> add dsh-thinking-levels -w
```

(Das Flag `-w` ist erforderlich, wenn das Profil eine pnpm-Workspace-Root ist, wie es `web` ist.)

Installieren Sie die aktuelle Version explizit:

```bash
dsh plugin --profile <profile> add dsh-thinking-levels@4.0.0 -w
```

Die offizielle CLI aktualisiert Profil-Abhängigkeit, Lockfile und `dsh.profile.bundles` automatisch. Fügen Sie keine manuelle YAML-Zeile hinzu.

### Supply-Chain-Abklingzeit

Die dsh-Runtime nutzt pnpm 11, dessen `minimumReleaseAge`-Politik eine frisch veröffentlichte Version mit `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` blockieren kann. Fügen Sie die Version zu `minimumReleaseAgeExclude` in `~/.dsh/profiles/web/pnpm-workspace.yaml` hinzu:

```yaml
minimumReleaseAgeExclude:
  - dsh-thinking-levels@4.0.0
```

## 2. Upgrade

Upgrade auf die neueste Registry-Version:

```bash
dsh plugin --profile <profile> update dsh-thinking-levels -w
```

Starten Sie DSH für Host-Änderungen neu und laden Sie die Webseite für Client-Änderungen neu.

## 3. Lokale Pfad-/link:-Registrierung (Alternative)

Für Entwicklung oder Offline-Installationen registrieren Sie das Plugin aus einem lokalen Checkout:

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

Oder nutzen Sie die offizielle CLI mit einem lokalen Pfad (ohne Netzwerk):

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-thinking-levels -w
```

## 4. Installation verifizieren

Prüfen Sie die Abhängigkeit und die installierte Version:

```bash
grep -n "dsh-thinking-levels" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-thinking-levels/package.json').version"
```

Die Version muss für dieses Release `4.0.0` sein.

Prüfen Sie die offizielle Composition:

```bash
dsh --profile <profile> --dump-default-config
```

Sie muss enthalten:

```yaml
- id: thinking-levels
  name: dsh-thinking-levels
```

## 5. Das Einstellungsformular verifizieren

Starten Sie DSH neu und laden Sie dann die Webseite neu. Öffnen Sie **Einstellungen → Plugins** und suchen Sie den Eintrag **dsh-thinking-levels** — seit DSH 0.1.7 wird das Formular vom Host aus den vom Plugin deklarierten `.volatile()`-Schemafeldern erzeugt (eine eigene Client-Karte gibt es nicht mehr).

1. Das Formular zeigt den Aktivierungsschalter, den Stufen-Wähler (acht Standardstufen plus `auto`) und die Scheduler-Schalter (`allowDowngrade` / `allowUpgrade`).
2. Bestätigte Änderungen greifen bei der nächsten Modellanfrage ohne Neustart (live volatile Konfiguration).
3. Der Fähigkeits-Editor pro Modell (Gateway-Wire-Werte, llm-pi-ai) wurde mit der eingestellten Karte ausgeliefert und ist nicht mehr Teil dieses Plugins — bearbeiten Sie llm-pi-ai-Modellfähigkeiten über die offiziellen Models-Einstellungen.

## Japanisch- und Koreanisch-Unterstützung

Das Plugin liefert `ja`- und `ko`-Wörterbücher mit, aber das aktuelle offizielle DSH-Release stellt über `LocaleRuntime` nur `zh` und `en` bereit. Auf einem unveränderten DSH schlägt die Auswahl von Japanisch oder Koreanisch mit `locale "<id>" is not registered` fehl.

Um sie zu nutzen, bevor die offizielle Unterstützung landet, pflegen Sie einen DSH-Fork und aktualisieren:

- `packages/client/locale/src/locale-settings.ts`: fügen Sie `ja` und `ko` zu `LOCALE_IDS` hinzu (das Host-Präferenzschema leitet sich von dieser Liste ab).
- `packages/client/locale/src/client/index.ts`: fügen Sie `{ id: 'ja', label: '日本語' }` und `{ id: 'ko', label: '한국어' }` zu `LOCALES` hinzu.
- Ergänzen Sie die zugehörigen Kern-Wörterbücher und Tests und bauen und betreiben Sie dann den geforkten DSH neu.

Eine nur am Plugin vorgenommene Änderung kann DSHs globale Locale-Liste nicht erweitern. Nutzen Sie den dokumentierten Build des Forks und die offiziellen Profil-Befehle; bearbeiten Sie kein Profil-Manifest manuell.

## 6. Fehlerbehebung

| Symptom | Aktion |
| --- | --- |
| `dsh` wird nicht gefunden | Installieren oder aktivieren Sie die offizielle DSH-CLI. Simulieren Sie die Profil-Installation nicht mit schlichten npm- oder pnpm-Befehlen. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Fügen Sie die Version zu `minimumReleaseAgeExclude` in der `pnpm-workspace.yaml` des Profils hinzu. |
| Plugin erscheint als „deaktiviert/unmounted“ ohne Fehler | Prüfen Sie die Profil-Composition; der Host darf nicht wertabhängig von `@deepseek-ai/dsh-settings` sein (ist er nicht). |
| Client-Eintrag fehlt in `__DSH_BOOT__` | Bestätigen Sie, dass `exports["./client"]` existiert und die Host-Faser etabliert wurde. |
| Modellauswahl hat kein `Auto` | Bestätigen Sie, dass der `resolveModel`-Wrapper des Adapters lief (er läuft erneut bei `llm/adapters-updated`). |
| Schreiben des Einstellungsformulars schlägt fehl | Der Wert wurde vom Plugin-Schema zurückgewiesen; richten Sie ihn an den deklarierten `.volatile()`-Feldtypen aus. |
| Subagent liefert `UNSUPPORTED_REASONING_EFFORT` | Das Zielmodell bewirbt die Stufe nicht; wählen Sie eine unterstützte oder stellen Sie den Provider-Standard wieder her. |
| Veralteter Client-Bundle | Hard-Refresh des Browsers (Ctrl+Shift+R) nach einem Upgrade. |

## 7. Entfernen

Nutzen Sie den offiziellen Befehl:

```bash
dsh plugin --profile <profile> remove dsh-thinking-levels -w
```

Prüfen Sie, dass die komponierte Profil-Konfiguration das Bundle nicht mehr enthält:

```bash
dsh --profile <profile> --dump-default-config
```
