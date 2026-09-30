# dsh-thinking-levels

**Controllo del livello di pensiero (`reasoning_effort`) per turno per [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness): scegli `Auto` (una maschera) nel selettore di modello della sessione e il plugin pianifica `low` / `high` / `max` dalla recente cronologia delle chiamate agli strumenti prima di inviare l'effort all'API — oppure fissa manualmente un livello wire (`off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`). I turni di strumenti economici restano economici; il lavoro pesante non resta mai senza ragionamento.**

- [README in italiano](./README.it.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [Guida all'installazione in italiano](./INSTALL.it.md)
- [Installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [Changelog in italiano](./CHANGELOG.it.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

> **v0.7.0-beta.1 (2026-09-06): il percorso short-circuit va in pensione.** Questa versione non dipende più da `dsh-llm-openai-completions` — le correzioni per gateway personalizzati viaggiano sulla superficie compat ufficiale `llm-pi-ai` (richiede **dsh ≥ v0.1.2-alpha.1**); il plugin adattatore deve restare disinstallato. Vedi il [CHANGELOG](./CHANGELOG.md).

> **▼ Versioni di DSH supportate**
>
> Questa versione (4.0.0) supporta solo **DSH v0.2.0-rc.1 fino a < 0.2.1**.
>
> | Versione DSH | Stato | Note |
> | --- | --- | --- |
> | ≥ 0.2.0-rc.1 | ✅ Supportata | Questa versione (4.0.x): stessa superficie di impostazioni dichiarativa (campi schema `.volatile()` renderizzati dall'host; letture/scritture tra plugin tramite il servizio `configForms`), con il gate peer riportato al segmento 0.2.0-rc |
> | ≥ 0.1.7-rc.1 fino a < 0.2.0 | ✅ Supportata | Usa la linea 3.x (3.4.3, dist-tag npm `dsh-0.1.7`): impostazioni dichiarative — l'host renderizza il form Plugins dai campi schema `.volatile()` del plugin; letture/scritture tra plugin passano dal servizio `configForms` |
> | < 0.1.7-rc.1 | ⚠️ Non supportata | DSH 0.1.7 ha rimosso la registrazione imperativa delle impostazioni e il posto a scheda per plugin su cui contavano le linee precedenti (3.0.x e anteriori) — resta su plugin 3.0.2 per host 0.1.2–0.1.6. |
>
> Il confine è `0.1.7-rc.1`, dove DSH ha rimosso la registrazione imperativa delle impostazioni (`settings.register` / `installSettingsSection`) e il servizio client `settingsScope`. Da quel confine i campi di configurazione modificabili a runtime sono marcati `.volatile()` nello schema schemastery, l'host genera il form delle impostazioni da quel solo schema (nessuna chiamata di registrazione, nessuna scheda impostazioni lato client) e il plugin legge i valori live a ogni richiesta, guidato da `loader/volatile-update`. Le linee 3.1.x–3.4.x puntano alla superficie dichiarativa di 0.1.7; la linea 4.0.x è la stessa superficie riportata al segmento 0.2.0-rc.

> **Politica degli intervalli di versione:** ogni linea di compatibilità aggancia il proprio host al proprio segmento in modo stretto. Le linee per host 0.1.x seguono `>=0.1.x-rc.1 <0.1.(x+1)-0` (3.1.x: `>=0.1.7-rc.1 <0.1.8-0`; 3.0.x: `>=0.1.5-alpha.1 <0.1.6-0`; 2.0.x: `>=0.1.2-alpha.1 <0.1.3-0`; 1.0.0-beta: `>=0.1.0-rc.8 <0.1.2-alpha.1`); le linee per il segmento 0.2.x seguono `>=0.2.0-rc.1 <0.2.1-0` (4.0.x: `>=0.2.0-rc.1 <0.2.1-0`). Nessuna linea dichiara mai un limite superiore aperto, così un resolver di compatibilità non può mai abbinare una linea di plugin a un segmento host più recente per cui non è stata costruita. Le versioni 0.4.0–0.6.0 non portavano alcuna dichiarazione peer dsh e sono di fatto senza tipizzazione di compatibilità — non installarle.

> **Nota di compatibilità:** la versione `0.6.0` include dizionari e voci del selettore in giapponese (`ja`) e coreano (`ko`), ma le release ufficiali attuali di DSH espongono solo `zh` e `en` tramite `LocaleRuntime`. Su un DSH originale, selezionare `ja` o `ko` fallisce con `locale "<id>" is not registered`. Queste lingue funzioneranno quando il DSH ufficiale aggiungerà gli ID locale corrispondenti. Gli utenti avanzati possono usare un fork di DSH che aggiorna `packages/client/locale/src/locale-settings.ts` (`LOCALE_IDS`) e `packages/client/locale/src/client/index.ts` (etichette `LOCALES`), insieme ai dizionari e ai test di base corrispondenti, per poi ricompilare ed eseguire il DSH forkato. Modificare solo questo plugin non può estendere l'elenco globale delle locale di DSH.

In una catena di strumenti a più passi, il modello ripensa prima di **ogni** chiamata a uno strumento — e quel pensiero domina il tempo di muro (un compito agent di 50 passi può spendere minuti a ragionare tra gli strumenti). `dsh-thinking-levels` si innesta nel waterfall `agent/request` che dsh risolve di nuovo a ogni passo (registrato con `prepend` così l'assemblaggio della selezione modello di sessione non può sovrascrivere la sua decisione) e inietta un livello di pensiero nella prossima richiesta al modello.

## Anteprima

Screenshot dell'interfaccia live (dsh web):

<figure>
  <img width="460" alt="Menu a tendina Auto del selettore di modello iniettato dal plugin: livelli Off / Low / High / Max / Auto, High attualmente selezionato, Auto evidenziato — Auto è una maschera, il plugin pianifica low/high/max a ogni passo dalla cronologia degli strumenti." src="assets/官方模型的自动级别调整.png" />
  <figcaption>Il selettore di modello nativo guadagna <strong>Auto</strong> — sceglicelo e il plugin pianifica low/high/max a ogni passo invece di un livello wire fisso.</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="Impostazioni del livello di pensiero (mostrata la scheda 3.0.x): livello predefinito (pianificazione auto), interruttori abilita / consenti-downgrade / consenti-upgrade, tabella delle capacità dei modelli del provider personalizzato llm-pi-ai con l'editor progressivo per modello e preset applica-a-tutti (Off/High/Max stile ufficiale DeepSeek, Off/Low/Medium/High generico)." src="assets/自动思考级别配置.png" />
  <figcaption>Impostazioni del livello di pensiero, scheda 3.0.x (screenshot conservato come riferimento). Dal 3.1.0 / DSH 0.1.7 il livello e gli interruttori dello scheduler vengono renderizzati come form dichiarativo generato dall'host; la scheda personalizzata e il suo editor di capacità llm-pi-ai sono stati rimossi insieme al posto dismesso.</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="Editor di capacità per modello per un modello openai-completions personalizzato (local-35b / Qwen3.6-35B-A3B), come fornito nella scheda impostazioni 3.0.x: modello di pensiero e vision abilitati, supporto think effort disattivato, formato di pensiero qwen-chat-template (compilato automaticamente); nessun interruttore di takeover — il flag compat ufficiale sta sulla riga del provider; preset di limite della finestra di contesto 64K/128K/256K/400K/512K/1M con input personalizzato." src="assets/自定义模型的思考接管-短路-上下文窗口限制.png" />
  <figcaption>Scheda di capacità per modello, 3.0.x (screenshot conservato come riferimento). Dal 3.1.0 / DSH 0.1.7 l'editor di capacità non è più fornito; modifica le capacità dei modelli `llm-pi-ai` tramite le impostazioni ufficiali dei modelli.</figcaption>
</figure>

## Livelli

| Livello | Significato | Dove |
|---|---|---|
| `off` | pensiero disattivato (solo manuale — mai scelto automaticamente) | selettore di modello / livello predefinito |
| `on` | pensiero attivato (solo modelli a toggle): invia `enable_thinking`, mai un think effort | selettore di modello / livello predefinito |
| `minimal` | sforzo minimo (compiti molto leggeri) | selettore di modello / livello predefinito |
| `low` | scelta manuale per compiti di chat semplici (i turni economici restano economici) | selettore di modello / livello predefinito |
| `medium` | sforzo medio | selettore di modello / livello predefinito |
| `high` | lo sforzo predefinito ufficiale | selettore di modello / livello predefinito |
| `xhigh` | sforzo extra alto | selettore di modello / livello predefinito |
| `max` | lavoro pesante | selettore di modello / livello predefinito |
| `auto` | **maschera**: pianifica a ogni passo dalla recente cronologia delle chiamate agli strumenti, risolto in un livello wire prima dell'invio | selettore di modello (iniettato dal plugin) / livello predefinito |

Fatti sui livelli wire (verificati contro la documentazione ufficiale DeepSeek e l'adattatore `llm-deepseek` di dsh): `low` corrisponde 1:1 su deepseek-v4-flash / v4-pro, mentre `medium` / `xhigh` collassano su `high`. L'adattatore accetta solo `off | low | high | max` e rifiuta tutto il resto con `UNSUPPORTED_REASONING_EFFORT` — `auto` è lo strato maschera del plugin, mai inviato tale e quale all'API, sempre risolto in un livello wire concreto prima dell'iniezione. `on` **non** è un livello di sforzo: viene pubblicizzato solo dai modelli a toggle (stile Qwen3.6) e si limita a portare `enable_thinking` a true — nessun `reasoning_effort` viene inviato; un modello capace di sforzo non pubblica mai `on`, quindi una scelta manuale di `on` su di esso viene rimossa.

## Mappatura wire personalizzata

Per i modelli `llm-pi-ai` dichiarati a mano, mappa ogni livello sul valore esatto che il tuo gateway si aspetta (preso in prestito da dsh-thinking-effort): spunta un livello e inserisci il suo valore wire, es. `high` → `ultra`. La mappatura è memorizzata nella tabella `reasoningEfforts` del modello nella configurazione `llm-pi-ai`, così la selezione `High` del Composer invia `ultra` al gateway. Lasciare `off` vuoto significa "non inviare".

- Preset ufficiale: `Off / High / Max` (stile ufficiale DeepSeek)
- Preset generico: `Off / Low / Medium / High`

> L'editor visivo di questa mappatura viaggiava sulla scheda impostazioni del plugin, rimossa dalla migrazione DSH 0.1.7 (il posto non esiste più). Modifica la tabella `reasoningEfforts` tramite la superficie ufficiale delle impostazioni dei modelli — del resto, rilevamento e iniezione lato host leggono quella configurazione live.

## Preset della finestra di contesto

Il controllo rapido della riga strumenti del Composer (accanto al selettore modello/sforzo) modifica un **limite della finestra di contesto**: tacche predefinite `64K / 128K / 256K / 400K / 512K / 1M`, un input per intero personalizzato e un pulsante di cancellazione. Il valore viene scritto nella voce `contextWindow` del modello `llm-pi-ai` (intero `2000`–`1000000`) — o nella voce `llm-deepseek` per i modelli DeepSeek ufficiali.

A monte, l'harness lo consuma tramite `resolveModelInfo(...).context.contextWindow` per le soglie di compaction, il rilevamento dell'overflow di contesto e le proiezioni della pressione di contesto. Poiché `llm-pi-ai` rilegge la configurazione live a ogni risoluzione e la sincronizzazione compat non blocca la scoperta dei modelli, una modifica delle impostazioni ha effetto alla richiesta successiva senza riavvio.

La configurazione del plugin accetta anche `models['provider/model'].contextWindow` come dichiarazione validata (intero `2000`–`1000000`) sulla superficie di composizione/configurazione.

## Guardia consapevole del modello (v0.5.0)

Il plugin non invia mai un `reasoning_effort` a un modello che non lo pubblica. Le route
openai-completions personalizzate (es. un Qwen3.6 locale senza `reasoningEfforts`) sono classificate
non-reasoning tramite `ctx.llm.resolveModelInfo`, e qualsiasi sforzo — ereditato o pianificato — viene
**rimosso** invece di essere inviato, così il rifiuto per richiesta `UNSUPPORTED_REASONING_EFFORT` di
dsh non può scattare. I campi non supportati non vengono mai passati a un'API che non può accoglierli.

Comportamento per versione:

| versione dsh | gestione di `low` |
|---|---|
| rc.6 (vecchia) | non nativo: il selettore lo mostra solo se un override `models` confermato dal configuratore lo nomina; il livello viene allora pubblicato (selettore + validazione della richiesta) e passato tale e quale |
| rc.7+ (nuova) | nativo: il plugin né lo riscrive né lo re-inietta; una scelta manuale di `low` passa invariata |

Lo scheduler auto può comunque scegliere `low` per i modelli che lo supportano — è la guardia delle capacità qui sopra a tenerlo lontano dai modelli che non possono accoglierlo.

## Auto del selettore di modello

Il selettore di modello della sessione (accanto al modello) ora offre **Auto** dopo i livelli wire (iniettato nei metadati della directory dei modelli dal plugin):

| Scelta nel selettore di modello | Comportamento |
|---|---|
| **Auto** | il plugin pianifica tramite cronologia strumenti + gli interruttori upgrade/downgrade e risolve in `low` / `high` / `max` prima dell'invio |
| `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max` | **vince la scelta manuale** — il plugin non interviene (`on` resta `on` sui modelli a toggle, mai elevato a sforzo; i modelli capaci di sforzo lo rimuovono) |
| non impostato | si applica il livello predefinito del plugin (sotto) |

## Scheduler auto

Il perno è `high` (il predefinito ufficiale). `auto` pianifica tra `low` / `high` / `max`; non sceglie mai `off`.

| Chiamate agli strumenti recenti | Livello |
|---|---|
| nessuna (prompt fresco, pura chat) | `low` |
| ≥75% strumenti semplici, argomenti piccoli, downgrade consentiti | `low` |
| strumenti misti / pesanti | `high` |
| payload molto pesanti, upgrade consentiti | `max` |

La politica di pianificazione condivide la stessa origine di [dsh-tool-turbo](https://github.com/drscrewdriver/dsh-tool-turbo) (stessa whitelist di strumenti semplici / stesse soglie di payload / stessa regola del 75%).

## Installazione

Vedi [INSTALL.md](./INSTALL.it.md) per la guida completa alla CLI ufficiale (scoperta del profilo, aggiornamento, migrazione, verifica, risoluzione dei problemi). Avvio rapido:

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

> Nota: il runtime dsh usa pnpm 11, la cui politica supply-chain `minimumReleaseAge` può bloccare una versione appena pubblicata con `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` — aggiungi la versione a `minimumReleaseAgeExclude` in `~/.dsh/profiles/web/pnpm-workspace.yaml` per rimuovere il periodo di raffreddamento.

Registrazione manuale con `link:` (alternativa a `dsh plugin add`):

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

## Configurazione

Due superfici condividono uno stesso schema:

- **Assemblaggio** — il `config:` della riga del plugin nella composizione del profilo (es. `cordis.yml`):
  ```yaml
  config:
    level: auto            # off | on | minimal | low | medium | high | xhigh | max | auto — the default level when the session picks nothing
    allowDowngrade: true   # let the scheduler drop below `high`
    allowUpgrade: false    # forbid the scheduler lifting to `max`
  ```
- **Runtime** — i campi di configurazione `.volatile()` del plugin (`enabled`, `level`, `allowDowngrade`, `allowUpgrade`): DSH 0.1.7 genera il form delle impostazioni Plugins dallo schema dichiarato, e le modifiche confermate arrivano al plugin come riferimenti di configurazione live (`loader/volatile-update`) — si applicano alla prossima richiesta al modello, senza riavvio. (`models` resta un campo di livello configuratore: modificalo nella composizione del profilo.)

Gli override di capacità per modello (`models`, chiave `provider/model`) confermano ciò che il rilevamento automatico trova; la parola finale è del configuratore:

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

> Per il toggle di pensiero + budget di Qwen, configura invece la route **llm-pi-ai**:
> `compat.thinkingFormat: qwen` (→ `enable_thinking` + `thinking_budget` wire tramite
> `thinkingBudgets`), oppure `qwen-chat-template` (→ `chat_template_kwargs.enable_thinking`) per
> modelli con sforzo come Qwen3.8-27B.

Valori predefiniti: `{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false, models: {} }`.

> Semantica: la scelta del selettore di modello prevale sul livello predefinito del plugin. Scegli `auto` (maschera) → il plugin pianifica; scegli un livello wire → applicato direttamente; non scegliere nulla → viene usato il `level` predefinito del plugin. `allowDowngrade` / `allowUpgrade` vincolano solo la pianificazione `auto`.

## Superficie compat ufficiale: lo strumento short-circuit va in pensione (0.7.0-beta.1)

Quando gateway personalizzati (vLLM / LM Studio / proxy OpenAI-compatibili self-hosted) dichiarano il pensiero, questo plugin scrive le correzioni nella **superficie compat ufficiale `llm-pi-ai`** (introdotta in dsh ≥ **v0.1.0-rc.8**, commit `884f7b9c41`) — [dsh-llm-openai-completions](https://github.com/drscrewdriver/dsh-llm-openai-completions) non è più necessario e deve restare disinstallato:

- Scansiona `llm-pi-ai.providers` alla ricerca di route che sono gateway openai-completions personalizzati (`api: openai-completions` o baseURL non ufficiale) **e** dichiarano una tabella `reasoningEfforts` su un qualsiasi modello (inclusi `modelOverrides`), poi scrive:
  - a livello di route `compat.supportsDeveloperRole: false` — il prompt di sistema parte come `system`, correggendo l'errore 400 `Unexpected message role` di vLLM / SGLang;
  - a livello di modello `compat.thinkingFormat: 'qwen-chat-template'` sulle righe di pensiero a toggle (tabella di pensiero senza `supportsReasoningEffort` a livello di riga) — pi-ai invia allora `chat_template_kwargs.enable_thinking` (i server vLLM nudi ignorano il `enable_thinking` di primo livello del formato `qwen` semplice);
- Le scritture passano dal canale ufficiale delle impostazioni (lettura → trasformazione pura → `settings.update('llm-pi-ai', …)` dell'intera sezione), così lo schema di dsh valida la scrittura **dove viene scritta**: un dsh precedente a rc.8 rifiuta i campi con un avviso nel log — nessuna configurazione errata silenziosa; i valori espliciti su qualsiasi livello non vengono mai sovrascritti;
- Si attiva all'avvio del plugin, su `llm/adapters-updated` e sulle modifiche di configurazione di `llm-pi-ai` — nessuna modifica manuale della configurazione;
- Lo split inline dei `<think>` lato risposta resta una **questione di gateway**: un vLLM nudo richiede `--reasoning-parser qwen3` (pi-ai parsa solo `reasoning_content` / `reasoning` / `reasoning_text`).

# Nota sulle dipendenze

La metà host **non** dipende per valore da `@deepseek-ai/dsh-settings` — dalla linea DSH 0.1.7 non esiste più alcuna registrazione delle impostazioni: il form delle impostazioni è generato dall'host dallo schema schemastery dichiarato dal plugin (campi `.volatile()`), e la metà client dialoga con il servizio `configForms` fornito dal runtime dsh. Non serve installare manualmente i pacchetti ufficiali nel profilo. `dependencies` è solo `@deepseek-ai/schemastery` (installato automaticamente con il pacchetto).

## Sviluppo

```bash
npm run lint        # eslint (typescript-eslint flat config)
npm run typecheck   # tsc --noEmit
npm test            # vitest — 46 tests
```

Copertura dei test: politica dei livelli (pass-through manuale inclusi i livelli estesi, clamping di `on`, scheduler auto, validazione, confine degli strumenti semplici), la guardia delle capacità dei modelli (`reasoningEffortSupported`, rimozione/pass-through di `resolveEffortInjection`), il parsing degli eventi di sessione (guardie, tetto della finestra, record malformati), lo schema di configurazione (lockstep dei predefiniti, rifiuto fuori intervallo, override `models`) e la sincronizzazione compat ufficiale (identificazione, rispetto dei valori espliciti, idempotenza identità, validazione dello schema alla scrittura).

## Licenza

MIT
