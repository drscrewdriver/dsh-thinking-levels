# Guida all'installazione (CLI DSH ufficiale)

Questa guida usa solo il comando ufficiale `dsh plugin`. Il comando installa la dipendenza in un profilo e sincronizza `dsh.profile.bundles`. Non sostituirlo con un semplice `npm install`, un `pnpm add` diretto nel profilo o modifiche manuali al manifest del profilo.

- [Guida all'installazione in italiano](./INSTALL.it.md)
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

I segnaposto in questa guida sono:

- `<profile>`: il profilo DSH da modificare, di solito `web`;
- `dsh-thinking-levels`: il pacchetto npm e l'ID del plugin a runtime;
- `thinking-levels`: l'ID della composizione Cordis e dello slot delle impostazioni.

> **Requisito di versione — DSH v0.2.0-rc.1 o più recente.**
>
> Verifica prima la versione in esecuzione (`dsh --version`).
>
> | Versione DSH | Azione |
> | --- | --- |
> | ≥ 0.2.0-rc.1 | Installa questa versione (4.0.x). |
> | ≥ 0.1.7-rc.1 fino a < 0.2.0 | Installa la linea 3.x: `dsh plugin --profile <profile> add dsh-thinking-levels@dsh-0.1.7 -w` (3.4.3). |
> | < 0.1.7-rc.1 | Resta sulla linea plugin precedente (3.0.2). Non eseguire una build plugin più vecchia contro DSH 0.1.7+ — aggiorna invece il plugin. |
>
> Il confine è `0.1.7-rc.1`, dove DSH ha rimosso la registrazione imperativa delle impostazioni (`settings.register` / `installSettingsSection`) e il servizio client `settingsScope`. Da quel confine sia la linea 3.x (host 0.1.7) sia questa versione (host 0.2.0-rc) puntano alla stessa superficie dichiarativa delle impostazioni (campi schema `.volatile()` + `configForms`).

> Le linee DSH più vecchie si installano da npm tramite il loro dist-tag: `dsh plugin add dsh-thinking-levels@dsh-0.1.7` (DSH 0.1.7–0.1.x, plugin 3.4.3), `...@dsh-0.1.5` (DSH 0.1.5), `...@dsh-0.1.2` (DSH 0.1.2), `...@compat` (DSH 0.1.0–0.1.1). Non installare mai le versioni `0.x` nude dell'era `latest` (≤ 0.6.0) — non portano dichiarazioni peer dsh.

## 0. Prerequisiti e scoperta del profilo

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Usa il profilo indicato dal tuo processo DSH in esecuzione. `web` è comune, ma l'argomento `--profile` attivo fa fede.

## 1. Installazione ufficiale

Installa l'ultima versione:

```bash
dsh plugin --profile <profile> add dsh-thinking-levels -w
```

(Il flag `-w` è richiesto quando il profilo è una root di workspace pnpm, com'è il caso di `web`.)

Installa esplicitamente la versione corrente:

```bash
dsh plugin --profile <profile> add dsh-thinking-levels@4.0.0 -w
```

La CLI ufficiale aggiorna automaticamente la dipendenza del profilo, il lockfile e `dsh.profile.bundles`. Non aggiungere una riga YAML manuale.

### Periodo di raffreddamento della supply chain

Il runtime dsh usa pnpm 11, la cui politica `minimumReleaseAge` può bloccare una versione appena pubblicata con `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Aggiungi la versione a `minimumReleaseAgeExclude` in `~/.dsh/profiles/web/pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - dsh-thinking-levels@4.0.0
```

## 2. Aggiornamento

Aggiorna all'ultima versione del registry:

```bash
dsh plugin --profile <profile> update dsh-thinking-levels -w
```

Riavvia DSH per le modifiche lato host e ricarica la pagina web per le modifiche lato client.

## 3. Registrazione locale via percorso / link: (alternativa)

Per sviluppo o installazioni offline, registra il plugin da un checkout locale:

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

Oppure usa la CLI ufficiale con un percorso locale (senza rete):

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-thinking-levels -w
```

## 4. Verificare l'installazione

Controlla la dipendenza e la versione installata:

```bash
grep -n "dsh-thinking-levels" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-thinking-levels/package.json').version"
```

La versione deve essere `4.0.0` per questa release.

Controlla la composizione ufficiale:

```bash
dsh --profile <profile> --dump-default-config
```

Deve contenere:

```yaml
- id: thinking-levels
  name: dsh-thinking-levels
```

## 5. Verificare il form delle impostazioni

Riavvia DSH, poi ricarica la pagina web. Apri **Impostazioni → Plugins** e cerca la voce **dsh-thinking-levels** — da DSH 0.1.7 il form è generato dall'host dai campi schema `.volatile()` dichiarati dal plugin (non esiste più una scheda client personalizzata).

1. Il form mostra l'interruttore di abilitazione, il selettore del livello (otto livelli standard più `auto`) e gli interruttori dello scheduler (`allowDowngrade` / `allowUpgrade`).
2. Le modifiche confermate si applicano alla prossima richiesta al modello senza riavvio (configurazione volatile live).
3. L'editor di capacità per modello (valori wire del gateway, llm-pi-ai) viaggiava con la scheda dismessa e non fa più parte di questo plugin — modifica le capacità dei modelli `llm-pi-ai` tramite le impostazioni ufficiali dei modelli.

## Stato del supporto per giapponese e coreano

Il plugin include dizionari `ja` e `ko`, ma la release ufficiale attuale di DSH espone solo `zh` e `en` tramite `LocaleRuntime`. Su un DSH originale, selezionare giapponese o coreano fallisce con `locale "<id>" is not registered`.

Per usarli prima che arrivi il supporto ufficiale, mantieni un fork di DSH e aggiorna:

- `packages/client/locale/src/locale-settings.ts`: aggiungi `ja` e `ko` a `LOCALE_IDS` (lo schema delle preferenze dell'Host deriva da questo elenco).
- `packages/client/locale/src/client/index.ts`: aggiungi `{ id: 'ja', label: '日本語' }` e `{ id: 'ko', label: '한국어' }` a `LOCALES`.
- Aggiungi i dizionari e i test di base corrispondenti, poi ricompila ed esegui il DSH forkato.

Una modifica limitata al plugin non può estendere l'elenco globale delle locale di DSH. Usa la build documentata del fork e i comandi ufficiali del profilo; non modificare manualmente un manifest del profilo.

## 6. Risoluzione dei problemi

| Sintomo | Azione |
| --- | --- |
| `dsh` non trovato | Installa o abilita la CLI DSH ufficiale. Non simulare l'installazione del profilo con semplici comandi npm o pnpm. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Aggiungi la versione a `minimumReleaseAgeExclude` nella `pnpm-workspace.yaml` del profilo. |
| Il plugin appare come "disabilitato/unmounted" senza errori | Controlla la composizione del profilo; l'host non deve dipendere per valore da `@deepseek-ai/dsh-settings` (e non lo fa). |
| Voce client assente da `__DSH_BOOT__` | Conferma che `exports["./client"]` esista e che la fiber dell'host sia stata stabilita. |
| Il selettore di modello non ha `Auto` | Conferma che il wrapper `resolveModel` dell'adattatore sia girato (si riesegue su `llm/adapters-updated`). |
| La scrittura del form delle impostazioni fallisce | Il valore è stato rifiutato dallo schema del plugin; allinealo ai tipi dei campi `.volatile()` dichiarati. |
| Un subagent restituisce `UNSUPPORTED_REASONING_EFFORT` | Il modello di destinazione non pubblica quel livello; scegline uno supportato o ripristina il predefinito del provider. |
| Bundle client obsoleto | Hard-refresh del browser (Ctrl+Shift+R) dopo un aggiornamento. |

## 7. Rimozione

Usa il comando ufficiale:

```bash
dsh plugin --profile <profile> remove dsh-thinking-levels -w
```

Verifica che il profilo composto non contenga più il bundle:

```bash
dsh --profile <profile> --dump-default-config
```
