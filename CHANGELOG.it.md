# Registro delle modifiche

Tutte le modifiche notevoli a `dsh-thinking-levels` sono documentate qui.

- [Changelog in italiano](./CHANGELOG.it.md)
- [English changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

## [4.2.0-beta.26] — 2026-10-08

### Aggiunto — sezione famiglia cross-versione (beta.18 → beta.26)

- **Sezione impostazioni legacy lato server (`installLegacySection`).** La
  sezione famiglia (起子插件设置) ora registra il namespace `thinking-levels`
  lato server e si rende quindi con dati reali sugli host ≤0.1.7, attraverso
  le tre forme generazionali (`installSettingsSection` a livello modulo,
  `installSection` per istanza, loader-volatile da rc.1+), con uno schema
  `LegacyConfig` semplice non volatile e una base piatta appiattita (i nodi
  volatile come i riferimenti vivi sono rifiutati dal registro legacy — tre
  bug impilati corretti tra beta.18 e beta.22).
- **Indurimento dell'elezione della sezione famiglia (beta.26).** La factory
  `settings.section` si ritira quando una voce `dsh-family` è già seduta
  (superficie nativa dell'host o un rivale): esattamente un proprietario,
  indipendentemente dall'ordine di registrazione. In coppia con l'elezione di
  cessione differita di dsh-session-guard 4.1.11 — le shell ≤0.1.7 danno a
  ogni sezione con lo stesso id la propria riga di navigazione, così la doppia
  registrazione significava una doppia riga 起子插件设置.
- **Correzioni UI (beta.23 → beta.25).** La striscia di tab della famiglia
  resta su una singola riga (scorrimento orizzontale; 8 tab contributore non
  lasciano più orfana l'ultima su una seconda riga); i controlli delle
  impostazioni seguono il tema scuro della shell (superficie semitrasparente
  al posto del bianco cablato, `colorScheme` da una sonda di luminanza
  una-tantum del body); la dichiarazione children tollera un conflitto
  atterrando senza; i log di debug del ciclo di vita restano in produzione.

## [Unreleased]

### Aggiunto — slider del livello di ragionamento (pollice balena-runner) — 4.1.0

- Il `<select>` di riga diventa uno **slider a segmenti**: il numero di tacche si adatta ai
  livelli dichiarati del modello, `auto` resta all'estrema sinistra, il pollice segue il
  puntatore e aggancia al rilascio, ←/→/Home/End da tastiera, il reset «predefinito del
  provider» sopravvive come pulsante ↺.
- Le righe DeepSeek mostrano la **balena-runner** (striscia di 8 fotogrammi, ciclo
  ping-pong, 720 ms a riposo / 420 ms durante il trascinamento, bloccata con
  `prefers-reduced-motion`); gli altri modelli mantengono il pollice bianco. Artwork della
  community da HanaAyane/dsh-reasoning-effort, rigenerabile con `python tools/whale-mascot.py`.
- Helper puri `orderEffortsForSlider` / `nearestEffortStopIndex` esportati con test.

## [4.0.0] — 2026-09-29

### Modificato — compatibilità DSH 0.2.0-rc

- **Gate peer riportato al segmento 0.2.0-rc.** Tutte le sette dichiarazioni peer
  `@deepseek-ai/dsh-*` e `engines.dsh` ora leggono `>=0.2.0-rc.1 <0.2.1-0` (al posto di
  `>=0.1.7-rc.1 <0.1.8-0`). Gli host su 0.1.7-rc.1 fino a < 0.2.0 restano sulla linea 3.x
  (dist-tag npm `dsh-0.1.7`, 3.4.3); gli host sotto 0.1.7-rc.1 restano su 3.0.2.
- **devDependencies spostate sulla linea 0.2.0** — `dsh-client-locale` / `dsh-client-ui-renderer` /
  `dsh-client-ui-settings` / `dsh-client-ui-slots` / `dsh-client-store` → `0.2.0-rc.1`, e
  `@deepseek-ai/cordis` → `^4.0.4` (richiesto dal peer `~4.0.4` dei pacchetti client 0.2.0-rc.1) —
  così typecheck / test / build girano contro i veri tipi 0.2.0-rc.1.
- **Igiene dei metadati:** versione di `dsh.plugin.json` e `engines.dsh` sincronizzate su 4.0.0 e
  sul segmento 0.2.0-rc; `publishConfig.tag` → `dsh-0.2.0` con un nuovo script `release:4x` così
  una pubblicazione non può mai sovrascrivere i tag `dsh-0.1.7` / `latest`; entrambi i lockfile
  (`package-lock.json` / `pnpm-lock.yaml`) rigenerati contro l'albero delle dipendenze 0.2.0.
- **Nessuna modifica al codice né lato host né lato client.** I pacchetti importati da questo
  plugin (`dsh-client-locale`, `dsh-client-store`, `dsh-client-ui-renderer`, `dsh-client-ui-settings`,
  `dsh-client-ui-slots`) cambiano solo versione di pacchetto tra 0.1.7-rc.2 e 0.2.0-rc.1; anche le
  facce dei servizi `settings` / `llm` e l'adattatore `llm-pi-ai` sono invariate. La suite completa
  (lint / typecheck / 71 test / build) passa invariata contro 0.2.0-rc.1.

### Corretto — voce Plugins duplicata nelle impostazioni — 2.0.0-beta.4

- **Rimossa la registrazione `settings.plugins.tab`.** Il lavoro di compat 0.1.5 assumeva che DSH
  0.1.5 avesse rimosso il posto `settings.plugin.item`, ma il `ui-settings-plugins` 0.1.5-rc.2
  pubblicato (e 0.1.6-alpha.1) lo dichiara ancora come figlio della tab Plugins configurabile
  integrata. Con entrambi i posti dichiarati, entrambe le registrazioni scattavano e il plugin
  appariva due volte in Impostazioni → Plugins: una come scheda-voce nell'elenco configurabile e
  una come tab dedicato di primo livello. La scheda-voce da sola copre ogni linea supportata, così
  la registrazione della tab è sparita (con il suo thunk di etichetta `ctx.locale.bind`).

### Modificato — compatibilità DSH 0.1.5-rc — 2.0.0-beta.3

- **La scheda impostazioni viaggia sul nuovo posto 0.1.5.** DSH 0.1.5 ha rinominato il posto della
  scheda impostazioni Plugins da `settings.plugin.item` a `settings.plugins.tab` (`id` = chiave
  della tab, `order` e un'`label` localizzata dal registrante). Entrambe le registrazioni sono
  vincolate alla dichiarazione tramite `ctx.slots.inject`, così la scheda si monta sul posto che
  l'host in esecuzione dichiara — gli host 0.1.5+ ottengono la tab, gli host 0.1.2–0.1.4 mantengono
  la scheda legacy. L'etichetta della tab è un thunk letto al momento su `ctx.locale.bind(NS)`, così
  segue i cambi di locale.
- **Tipizzazione di `ctx.slots` ripristinata.** L'augmentation `Context.slots` arrivava
  transitivamente tramite il (ormai eliminato) pacchetto `dsh-client-runtime`; 0.1.5 la spostata su
  `@deepseek-ai/dsh-client-ui-renderer/client`, che la metà client ora importa.
- **devDependencies bloccate su 0.1.5-rc.2** e l'intera suite (typecheck / lint / 65 test /
  build) verificata contro quell'albero. Le API lato host (`settings.register/get/update`,
  `settings/document-updated`, `agent/request`) sono invariate in 0.1.5-rc.2 — nessuna modifica
  lato host necessaria.
- Verificato contro le superfici contrattuali 0.1.5-rc.2 spacchettate da npm: `conversation.input.right`,
  `settingsScope.bind`, gli overload di locale e la faccia del servizio impostazioni sono tutti
  preservati.
- **`lib/` è versionato in git.** `package.json` spedisce `files: ["lib", …]` e punta `main` /
  `types` / `exports` su `lib/`, ma `.gitignore` elencava ancora `lib/` — quindi un'installazione
  basata su GitHub (che non esegue build) riceveva un pacchetto senza punto di ingresso. Gli
  artefatti compilati sono ora nel controllo di versione, e una ricompilazione li riproduce
  byte per byte (nessun diff di contenuto, solo il rumore dei fine riga di `core.autocrlf`).
- **`engines.dsh` ristretto al segmento che questa linea implementa davvero**: il precedente
  `>=0.1.2-alpha.1 <0.2.0-0` ammetteva host 0.1.2–0.1.4, dove la metà client non può compilare
  contro il posto impostazioni Plugins rinominato che questa linea registra. Ora è
  `>=0.1.5-alpha.1 <0.2.0-0` (e `node` ristretto a `^22.19.0 || >=24.0.0`, in linea con la
  toolchain). `publishConfig` blocca `registry` + `tag: beta` così un `npm publish` nudo non può
  né risolvere male il mirror né sovrascrivere la linea stabile `latest`, e `pnpm-lock.yaml` è
  tracciato come parte del contratto di compatibilità anziché trattato come artefatto locale.
- **Un segnaposto pnpm `allowBuilds` non blocca più le installazioni.** `pnpm-workspace.yaml`
  portava il letterale stub di pnpm `set this to true or false`, che interrompeva ogni
  `pnpm install` con `ERR_PNPM_IGNORED_BUILDS`; ora riporta `esbuild: true`.

### Modificato — il controllo del contesto vive nella riga del composer — 2.0.0-beta.2

- **Il controllo rapido della finestra di contesto torna nella riga strumenti del composer**
  (`conversation.input.right`, accanto al controllo modello/sforzo). La scheda modello non è
  un'opzione: il `ModelSelect` fornito chiama `renderSlot` zero volte e possiede il suo popup, così
  il posto `conversation.input.model.section` dichiarato in `2.0.0-beta.1` non è renderizzato da
  nessun harness pubblicato — un plugin non può metterci una riga dentro quella carta da solo.
  `conversation.input.right` è un posto `list` a portata di sessione che qualsiasi plugin può
  occupare, ed è lì che appartiene un controllo di riga strumenti.
- **Il crash della voce dello slot resta corretto.** La vecchia pill richiamava un posto standard
  come getter nudo (`useSession()`) — ogni posto del renderer è un hook selettore
  `useSyncExternalStoreWithSelector`, quindi la chiamata lanciava `TypeError: l is not a function`
  e buttava giù l'intera voce a ogni render. Il controllo ora legge il modello attivo tramite un
  selettore obbligatorio.
- **La sorgente del modello è agnostica rispetto al posto.** Preferisce il posto di sessione
  `useTrajectory` (il registro delle richieste, DSH 0.1.2+) e ricade su `useConversation`
  (`ConversationSnapshot.views.get('trajectory')`) sulle linee di harness prive di esso; un
  harness che non fornisce nessuno dei due posti non renderizza nulla invece di un controllo morto.
- **Il popover è una sola riga con slider**: slider dei preset (64K / 128K / 256K / 400K / 512K /
  1M) che scrive una volta per gesto (rilascio del puntatore, rilascio del tasto, blur), il valore
  confermato, un editor di intero personalizzato richiuso (`⋯`) e Cancella. La pill mostra solo il
  valore; i testi `input.context.*` sono ripristinati in tutti e quattro i dizionari.
- **Invariato: l'editor della scheda impostazioni.** I preset della finestra di contesto per
  modello, l'intero personalizzato e Cancella restano esattamente come sono, scrivendo negli stessi
  namespace `llm-pi-ai` / `llm-deepseek`.

### Rottura — solo DSH v0.1.2+ (rimozione di `dsh-client-runtime`) — 0.7.2-beta.1

- **`engines.dsh` ora è `>=0.1.2-alpha.1 <0.2.0-0`.** `@deepseek-ai/dsh-client-runtime` è stato
  eliminato completamente in `0.1.2-alpha.1` (commit `be531688f3`); quella release è il confine
  rigido di segmento. La linea plugin precedente (`0.7.1-beta.2` e anteriori) continua a servire
  DSH 0.1.0 / 0.1.1.
- **`ClientContext` è sparito.** `src/client/index.ts` ora importa `Context as ClientContext` da
  `@deepseek-ai/cordis`, come ogni plugin client ufficiale. `@deepseek-ai/dsh-client-runtime` è
  rimosso da `peerDependencies`, `peerDependenciesMeta` e `devDependencies`, quindi non blocca più
  l'installazione.
- **`src/types/contracts.d.ts` perde il mirror ambientale
  `declare module '@deepseek-ai/dsh-client-runtime/client'`.** `SettingsScope` guadagna i campi di
  snapshot `base` / `user` / `revision` e `bind` accetta un `decode` opzionale; il mirror
  `SlotsFace` resta (il vero `SlotRegistry` in `@deepseek-ai/dsh-client-ui-renderer` lo fornisce a
  runtime).
- **`dsh.client.inject` elenca `@deepseek-ai/dsh-client-ui-renderer`**, il pacchetto che fornisce
  il servizio `slots` in cui questo plugin si registra.
- **Registrazione localizzata divisa per overload.** La forma massiva
  `register(ns, dicts)` è tipizzata sugli ID di locale integrati (solo `zh` / `en`), così i
  dizionari `ja` / `ko` forniti passano ora dall'overload a locale singolo
  `register(ns, locale, dict)` e vengono disposti insieme. Il comportamento è invariato; la
  chiamata ora typechecka contro il vero pacchetto di locale.

### Rimosso

- **Listener `agent/tool` morto.** La telemetria a tempo di muro per strumento registrava un
  handler `ctx.on('agent/tool', …)` che teneva una mappa `started` e loggava `tool … took …ms`.
  DSH non ha un tale evento né in 0.1.1-rc.2 né in 0.1.2-rc.1 — il registro degli eventi di scope
  (`packages/core/scope/src/scoped-events.generated.ts`) elenca dodici eventi `agent/*` e
  `agent/tool` non è uno di essi — quindi l'handler non è mai girato e la riga di log non è mai
  stata emessa. Rimossi il listener, la sua mappa `started`, la scansione `pruneStale` e la
  costante `TOOL_AGE_LIMIT_MS`.
- **Lo scheduler degli sforzi non è toccato.** Il riconoscimento degli strumenti è una *trazione*,
  non una spinta: il waterfall `agent/request` chiama `recentToolCalls(payload.agent)`, che legge i
  record `tool/call` da `agent.session.events` e alimenta `scheduleEffort`. Quel percorso ha i suoi
  test (`tests/session-events.spec.ts`, `tests/thinking-level.spec.ts`) e non è stato toccato.

### Corretto — mainline rinumerata in 2.x — 2.0.0-beta.1

- **Il controllo rapido della finestra di contesto faceva crashare il suo slot a ogni render.**
  `ContextQuick` richiamava il posto standard di sessione come getter nudo (`useSession()`). Ogni
  posto standard del renderer è un *hook selettore* `useSyncExternalStoreWithSelector` vincolato da
  `bindSnapshotSelector` (`@deepseek-ai/dsh-client-ui-renderer`), così la chiamata raggiungeva lo
  shim con `selector === undefined` e lanciava `TypeError: l is not a function`: la voce
  `conversation.input.right` moriva e la error boundary dello slot la rilanciava a ogni render. Lo
  stesso componente leggeva anche `session.views.get('trajectory')`, un campo che `SessionSnapshot`
  non ha mai portato (le view appartengono a `ConversationSnapshot`), quindi non avrebbe potuto
  risolvere alcun modello anche senza il crash. Il modello attivo ora arriva dal posto di sessione
  `useTrajectory` tramite un selettore stabile a livello di modulo sul registro delle richieste.
- **Il controllo si è spostato nella carta del menu modello.** Si registra in
  `conversation.input.model.section` — la striscia che ui-model-selection renderizza sotto le righe
  Modello / Sforzo di ragionamento — come riga slider compatta: uno slider dei preset (64K / 128K /
  256K / 400K / 512K / 1M) che scrive una volta per gesto (rilascio del puntatore, rilascio del
  tasto, blur), il valore confermato, un editor di intero personalizzato richiuso e Cancella. I
  testi si riducono all'etichetta della riga, al valore e a Cancella. La pill della riga composer
  è sparita; la scheda impostazioni mantiene l'editor completo per modello. La riga appare sugli
  harness il cui posto modello dichiara quello slot figlio (aggiunto in
  `packages/client/ui-model-selection`); sugli harness più vecchi la registrazione resta in
  attesa e la scheda impostazioni resta l'editor.
- **Versione di `dsh.plugin.json` sincronizzata** con `package.json`; il tarball 0.7.2-beta.1 l'aveva
  spedita come 0.7.1-beta.2.
- **Rinumerazione delle versioni: la linea è ora la cifra major.** Questa mainline (DSH 0.1.2+)
  passa a **2.x**, la linea legacy (DSH < 0.1.2, branch `compat/dsh-0.1.1`) a **1.x**, così una
  versione installata dichiara quale segmento di harness serve. I dist-tag npm mantengono i loro
  ruoli: `beta` = questa linea, `compat` = la linea legacy. Null'altro cambia per le
  installazioni esistenti; un range `0.7.x` semplicemente non corrisponde a `2.x`, il passaggio è
  quindi esplicito.
- **La riga del menu modello richiede un harness che dichiara il posto.**
  `conversation.input.model.section` è aggiunto a `packages/client/ui-model-selection` (dichiarazione +
  chiamata `renderSlot`); finché una release dell'harness non lo porta, la registrazione resta in
  attesa e la scheda impostazioni resta l'editor. Nessun harness pubblicato lo ha oggi.

## [0.7.0] — 2026-09-09

> **Release stabile.** Il percorso short-circuit va in pensione; tutte le correzioni per gateway
> viaggiano ora sulla superficie compat ufficiale `llm-pi-ai` (dsh ≥ **v0.1.0-rc.8**). Questa
> versione include anche i preset della finestra di contesto della precedente bozza 0.7.0.

### Aggiunto

- **Preset della finestra di contesto multi-livello** nell'editor di capacità per modello: pulsanti
  preset `64K / 128K / 256K / 400K / 512K / 1M` più un input di intero personalizzato e un
  pulsante di cancellazione, scritti nel `contextWindow` del modello `llm-pi-ai` e consumati live
  dall'harness (compaction / rilevamento overflow di contesto / proiezioni di pressione di
  contesto) alla richiesta successiva — nessun riavvio richiesto.
- Nuovo modulo puro `src/context-window.ts` (costanti di intervallo `2000`–`1_000_000`, elenco dei
  preset, `formatContextWindow`, `validateContextWindow`) condiviso da schema di configurazione,
  scheda impostazioni e test.
- Superficie di configurazione: override `models[].contextWindow` accettato con validazione di
  intero `2000`–`1000000` (fail-loud sui valori fuori intervallo).
- Nuovi testi `zh` / `en` / `ja` / `ko` per il controllo della finestra di contesto.
- Aggiunto `dsh.plugin.json` con `engines.dsh: ">=0.1.0-rc.8"`.
- Aggiunte `peerDependencies` per `dsh-client-runtime`, `dsh-client-locale`, `dsh-client-ui-settings`,
  `dsh-client-ui-slots` (tutti opzionali).

### Rimosso

- **Il ponte takeover short-circuit**: il plugin non mantiene più l'elenco takeover
  `llm-openai-completions` (`nextTakeoverSection` / `TakeoverSection` sono spariti). Il plugin
  adattatore `dsh-llm-openai-completions` NON è necessario accanto a questa release e può restare
  disinstallato.

### Modificato

- **Ponte auto-compat riscritto sulla superficie compat ufficiale** (`withOfficialCompatFixes`):
  per ogni route di gateway openai-completions personalizzato che dichiara il pensiero, la
  sincronizzazione ora scrive
  - a livello di route `compat.supportsDeveloperRole: false` (prompt di sistema inviato come
    `system` — corregge l'errore 400 `Unexpected message role` di vLLM/SGLang), e
  - a livello di modello `compat.thinkingFormat: 'qwen-chat-template'` sulle righe di pensiero a
    toggle (nessun supporto sforzo a livello di riga) così pi-ai invia
    `chat_template_kwargs.enable_thinking` — i server vLLM nudi ignorano il `enable_thinking` di
    primo livello del formato `qwen` semplice.
- Il pattern di memorizzazione segue il lato host di dsh-thinking-effort: lettura → trasformazione
  pura (identità quando non c'è nulla da cambiare) → `settings.update('llm-pi-ai', …)` dell'intera
  sezione, così il validatore di schema `llm-pi-ai` di dsh limita la scrittura dove viene SCRITTA;
  un dsh precedente a rc.8 rifiuta il campo sconosciuto e la sincronizzazione logga e mantiene la
  sezione precedente. I valori espliciti su qualsiasi livello sono rispettati e mai sovrascritti.
- **Scheda capacità de-short-circuitata**: l'interruttore "takeover short-circuit" è sostituito da
  un interruttore per provider **"il gateway rifiuta il ruolo developer"** (scrive/cancella il flag
  a livello di route; deselezionando si ripristina l'ereditarietà). Il gating per elenco takeover
  è sparito — i modelli di ogni provider llm-pi-ai sono direttamente modificabili, a strati
  progressivi: ① pensiero + vision → ② supporto sforzo (solo modelli di pensiero) → ③ editor wire
  degli sforzi → ④ thinkingFormat → ⑤ finestra di contesto. Attivare il pensiero su un modello a
  toggle compila automaticamente `thinkingFormat: 'qwen-chat-template'` (solo se assente);
  attivare lo sforzo lo rimuove di nuovo.
- `declaresThinking` ora scansiona anche `modelOverrides` (prima solo `models[]`), così anche le
  route solo-modelOverrides vengono identificate e corrette.
- Il gate di lettura della postura dell'adattatore (`takeoverOf` / `piAiPosture`) è mantenuto ma
  inerte: senza l'adattatore produce la semantica pi-ai nativa.
- Il badge del contesto ora riusa il `formatContextWindow` condiviso così i preset scritti vengono
  mostrati esattamente (es. `256000` → `256K`, `1000000` → `1M`).

### Note

- Richiede dsh ≥ **v0.1.0-rc.8** per la superficie compat ufficiale. Su dsh più vecchi lo schema
  rifiuta i campi compat (fail-loud, nessuna configurazione errata silenziosa).
- Lo split inline dei `<think>` lato risposta resta una questione di gateway: un vLLM nudo richiede
  `--reasoning-parser qwen3`; pi-ai (≤ 0.85.1) parsa solo `reasoning_content` / `reasoning` /
  `reasoning_text`. `qwen-chat-template` non porta `reasoning_effort` (i rami del formato sono
  mutuamente esclusivi) — i livelli di sforzo pilotano solo l'on/off di `enable_thinking`. Il vero
  parallelismo (chat_template_kwargs + reasoning_effort) richiede una modifica a monte di pi-ai.
- I materiali di verifica vivono sul branch `check` (`check/CHECK.md`, `check/record-proxy.mjs`,
  `check/settings-route.example.yaml`); non fanno parte del pacchetto npm.

## [0.6.0] — 2026-02-?

### Aggiunto

- **Otto livelli standard** allineati a dsh-thinking-effort: `off / on / minimal / low / medium / high / xhigh / max` (più la maschera scheduler `auto`). `on` è l'interruttore di attivazione del pensiero, limitato alla forza predefinita del modello (`high` o il livello di pensiero pubblicato più alto); `minimal` / `medium` / `xhigh` passano tali e quali quando un gateway personalizzato li pubblica e collassano su `high` sull'adattatore ufficiale.
- **Mappatura wire personalizzata nella scheda impostazioni** (presa in prestito da dsh-thinking-effort): ogni livello può essere spuntato e ricevere il valore esatto inviato al gateway (es. `high` → `ultra`); `off` lasciato vuoto significa "non inviare". Memorizzata nella tabella `reasoningEfforts` del modello.
- **Rifacimento della presentazione della scheda impostazioni** (preso in prestito da dsh-thinking-effort): i provider raggruppano i loro modelli, ogni riga modello mostra badge testo/immagine/contesto, i modelli si espandono in un editor per livello, una casella di ricerca filtra i modelli e i preset a un clic (stile ufficiale DeepSeek / generico) si applicano a ogni modello di pensiero.
- **Multilingua**: dizionari giapponese (`ja`) e coreano (`ko`), più `README.ja.md` / `README.ko.md`, `INSTALL.{md,zh,ja,ko}.md` e `CHANGELOG.{md,ja,ko}.md`. Nota: il runtime delle locale del DSH ufficiale espone ancora solo `zh` / `en`, quindi la selezione `ja` / `ko` richiede un fork di DSH (vedi la nota di compatibilità nel README).

### Modificato

- La superficie di configurazione `level` accetta tutti e nove i valori (`off | on | minimal | low | medium | high | xhigh | max | auto`).
- L'override `models[].efforts` accetta i livelli estesi.
- Renderer della scheda rifattorizzato; gli editor di capacità usano ora una bozza wire a stadi con un pulsante esplicito **Applica livelli** al posto delle conferme immediate via checkbox.

### Corretto

- Rimosso l'helper inutilizzato `effortLevelsOf`; silenziato l'avviso di lint sul parametro inutilizzato `_N`.

## [0.5.2] — 2026-02-?

### Aggiunto

- **Takeover automatico di `dsh-llm-openai-completions`**: i provider che sono gateway openai-completions personalizzati (`api: openai-completions` o baseURL non ufficiale) **e** dichiarano una tabella `reasoningEfforts` su un qualsiasi modello vengono uniti in `llm-openai-completions.providers` con `enabled: true`. Gira all'avvio del plugin, su `llm/adapters-updated` e sulle modifiche delle impostazioni; accoppiamento morbido (salta la scrittura quando il namespace non è registrato).

## [0.5.1] — 2026-02-?

### Aggiunto

- Scheda editor di capacità dei modelli: vision / pensiero / supporto-sforzo / livelli di sforzo / formato di pensiero per ogni modello di provider personalizzato `llm-pi-ai`, scritta direttamente nel namespace impostazioni `llm-pi-ai` (nessuna modifica ai pacchetti ufficiali).

## [0.5.0] — 2026-02-?

### Aggiunto

- Guardia consapevole del modello: non inviare mai `reasoning_effort` a un modello che non lo pubblica (le route openai-completions personalizzate come Qwen3.6 vengono invece rimosse).
- Pass-through di `low` su dsh rc.7+; gli adattatori dell'era rc.6 possono pubblicare `low` tramite un override `models` confermato dal configuratore.
- Sezione di configurazione `models` (`provider/model` → `vision` / `thinking` / `efforts`).

## [0.4.1] — 2026-02-?

### Corretto

- Il wrapper `resolveModel` dell'adattatore ora si riesegue su `llm/adapters-updated` così la maschera `Auto` appare anche quando gli adattatori si registrano dopo l'applicazione del plugin.

## [0.4.0] — 2026-02-?

### Modificato

- Rimossa la dipendenza per valore da `@deepseek-ai/dsh-settings`; la registrazione delle impostazioni passa dal servizio cordis `settings` (equivalente locale di `installSettingsSection`).
- La registrazione della scheda fornisce sia `id` sia `key` così funziona sulle dichiarazioni di slot della CLI (per chiave) e di DSH Desktop (per elenco).

## [0.3.0] — 2026-02-?

### Aggiunto

- `Auto` nel selettore di modello (maschera): iniettato negli sforzi di `resolveModel` dell'adattatore; il plugin pianifica `low` / `high` / `max` a ogni passo tramite il waterfall `agent/request` (registrato con `prepend` così l'assemblaggio della selezione modello di sessione non può sovrascriverlo).

## [0.2.1] — 2026-02-?

### Corretto

- Aggiunto `exports["./client"]` così il bundle client viene scoperto dal caricatore di moduli client di dsh.

## [0.2.0] — 2026-02-?

### Aggiunto

- Prima scheda impostazioni client (selettore di livello + interruttori dello scheduler).

## [0.1.1] — 2026-02-?

### Corretto

- Pubblicato `lib/` compilato al posto delle sorgenti TS grezze (Node 22 vieta lo stripping dei tipi dai `.ts` sotto `node_modules`).

## [0.1.0] — 2026-02-?

### Aggiunto

- Release iniziale: iniezione `agent/request` di uno sforzo di ragionamento fisso.
