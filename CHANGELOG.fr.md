# Journal des modifications

Tous les changements notables de `dsh-thinking-levels` sont documentés ici.

- [Changelog en français](./CHANGELOG.fr.md)
- [English changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

## [Unreleased]

### Ajout — curseur de niveau de réflexion (pouce baleine-runner) — 4.1.0

- Le `<select>` d'effort de chaque ligne devient un **curseur segmenté** : le nombre de
  crans s'adapte aux niveaux annoncés du modèle, `auto` reste à l'extrême gauche, le pouce
  suit le pointeur en continu et s'aimante au relâchement, ←/→/Home/End pour le clavier,
  la réinitialisation « valeur du fournisseur » devient le bouton ↺.
- Les lignes DeepSeek affichent la **baleine-runner** (bande de 8 images, boucle ping-pong,
  720 ms au repos / 420 ms en glissement, figée sous `prefers-reduced-motion`) ; les autres
  gardent un pouce blanc. Artwork communautaire de HanaAyane/dsh-reasoning-effort,
  régénération via `python tools/whale-mascot.py`.
- Helpers purs `orderEffortsForSlider` / `nearestEffortStopIndex` exportés avec tests.

## [4.0.0] — 2026-09-29

### Modifié — compatibilité DSH 0.2.0-rc

- **Contrainte peer recalée sur le segment 0.2.0-rc.** Les sept déclarations peer
  `@deepseek-ai/dsh-*` et `engines.dsh` lisent désormais `>=0.2.0-rc.1 <0.2.1-0` (en remplacement
  de `>=0.1.7-rc.1 <0.1.8-0`). Les hôtes en 0.1.7-rc.1 à < 0.2.0 restent sur la ligne 3.x
  (dist-tag npm `dsh-0.1.7`, 3.4.3) ; les hôtes inférieurs à 0.1.7-rc.1 restent sur 3.0.2.
- **devDependencies déplacées vers la ligne 0.2.0** — `dsh-client-locale` / `dsh-client-ui-renderer` /
  `dsh-client-ui-settings` / `dsh-client-ui-slots` / `dsh-client-store` → `0.2.0-rc.1`, et
  `@deepseek-ai/cordis` → `^4.0.4` (exigé par le peer `~4.0.4` des paquets clients 0.2.0-rc.1) —
  afin que typecheck / tests / build tournent contre les vrais types 0.2.0-rc.1.
- **Hygiène des métadonnées :** version de `dsh.plugin.json` et `engines.dsh` synchronisées sur 4.0.0
  et le segment 0.2.0-rc ; `publishConfig.tag` → `dsh-0.2.0` avec un nouveau script `release:4x` pour
  qu'une publication ne puisse jamais écraser les tags `dsh-0.1.7` / `latest` ; les deux lockfiles
  (`package-lock.json` / `pnpm-lock.yaml`) régénérés contre l'arbre de dépendances 0.2.0.
- **Aucun changement de code côté hôte ni côté client.** Les paquets importés par ce plugin
  (`dsh-client-locale`, `dsh-client-store`, `dsh-client-ui-renderer`, `dsh-client-ui-settings`,
  `dsh-client-ui-slots`) ne changent que de version de paquet entre 0.1.7-rc.2 et 0.2.0-rc.1 ;
  les faces de services `settings` / `llm` et l'adaptateur `llm-pi-ai` sont inchangés également.
  La suite complète (lint / typecheck / 71 tests / build) passe inchangée contre 0.2.0-rc.1.

### Corrigé — entrée Plugins en double dans les réglages — 2.0.0-beta.4

- **Suppression de l'enregistrement `settings.plugins.tab`.** Le travail de compat 0.1.5 supposait
  que DSH 0.1.5 avait supprimé l'emplacement `settings.plugin.item`, mais le `ui-settings-plugins`
  0.1.5-rc.2 publié (et 0.1.6-alpha.1) le déclare toujours comme enfant de l'onglet Plugins
  configurable intégré. Avec les deux emplacements déclarés, les deux enregistrements se
  déclenchaient et le plugin apparaissait deux fois dans Paramètres → Plugins : une fois comme
  carte d'élément dans la liste configurable et une fois comme onglet de premier niveau dédié. La
  carte d'élément seule couvre toutes les lignes prises en charge, si bien que l'enregistrement
  d'onglet disparaît (avec son thunk de libellé `ctx.locale.bind`).

### Modifié — compatibilité DSH 0.1.5-rc — 2.0.0-beta.3

- **La carte de réglages emprunte le nouvel emplacement 0.1.5.** DSH 0.1.5 a renommé l'emplacement
  de la carte de réglages Plugins de `settings.plugin.item` en `settings.plugins.tab` (`id` = clé
  d'onglet, `order` et `label` localisé par l'enregistreur). Les deux enregistrements sont
  conditionnés par déclaration via `ctx.slots.inject`, si bien que la carte se monte sur
  l'emplacement que l'hôte en cours déclare — les hôtes 0.1.5+ obtiennent l'onglet, les hôtes
  0.1.2–0.1.4 conservent la carte héritée. Le libellé de l'onglet est un thunk lu à la volée sur
  `ctx.locale.bind(NS)`, il suit donc les changements de locale.
- **Typage de `ctx.slots` rétabli.** L'augmentation `Context.slots` arrivait transitivement via le
  paquet `dsh-client-runtime` (désormais supprimé) ; 0.1.5 l'a déplacée vers
  `@deepseek-ai/dsh-client-ui-renderer/client`, que la moitié client importe désormais.
- **devDependencies épinglées à 0.1.5-rc.2** et toute la suite (typecheck / lint / 65 tests /
  build) vérifiée contre cet arbre. Les API côté hôte (`settings.register/get/update`,
  `settings/document-updated`, `agent/request`) sont inchangées en 0.1.5-rc.2 — aucun changement
  côté hôte n'était nécessaire.
- Vérifié contre les surfaces de contrat 0.1.5-rc.2 dépaquetées depuis npm : `conversation.input.right`,
  `settingsScope.bind`, les surcharges de locale et la face du service de réglages sont toutes
  préservées.
- **`lib/` est versionné dans git.** `package.json` livre `files: ["lib", …]` et pointe `main` /
  `types` / `exports` vers `lib/`, mais `.gitignore` listait toujours `lib/` — une installation
  basée sur GitHub (qui n'exécute aucun build) recevait donc un paquet sans point d'entrée. Les
  artefacts compilés sont désormais dans le gestionnaire de versions, et une recompilation les
  reproduit à l'octet près (aucune différence de contenu, seulement le bruit de fins de ligne
  `core.autocrlf`).
- **`engines.dsh` resserré sur le segment que cette ligne implémente réellement** : le
  `>=0.1.2-alpha.1 <0.2.0-0` précédent admettait les hôtes 0.1.2–0.1.4, où la moitié client ne
  peut pas compiler contre l'emplacement de réglages Plugins renommé que cette ligne enregistre.
  C'est désormais `>=0.1.5-alpha.1 <0.2.0-0` (et `node` resserré à `^22.19.0 || >=24.0.0`, à
  l'image de la chaîne d'outils). `publishConfig` épingle `registry` + `tag: beta` pour qu'un
  `npm publish` nu ne puisse ni résoudre le miroir à tort ni écraser la ligne stable `latest`, et
  `pnpm-lock.yaml` est suivi comme partie intégrante du contrat de compatibilité plutôt que traité
  comme un artefact local.
- **Un placeholder pnpm `allowBuilds` ne bloque plus les installations.** `pnpm-workspace.yaml`
  portait le stub littéral de pnpm `set this to true or false`, qui avortait chaque `pnpm install`
  avec `ERR_PNPM_IGNORED_BUILDS` ; il indique désormais `esbuild: true`.

### Modifié — la commande de contexte vit dans la rangée du composer — 2.0.0-beta.2

- **La commande rapide de fenêtre de contexte se trouve de nouveau dans la rangée d'outils du
  composer** (`conversation.input.right`, à côté de la commande modèle/effort). La carte de modèle
  n'est pas une option : le `ModelSelect` livré n'appelle `renderSlot` zéro fois et possède sa
  popup en propre, si bien que l'emplacement `conversation.input.model.section` déclaré dans
  `2.0.0-beta.1` n'est rendu par aucun harnais publié — un plugin ne peut pas y placer une rangée
  dans cette carte de son propre chef. `conversation.input.right` est un emplacement `list` à
  périmètre de session que tout plugin peut occuper, et c'est là qu'une commande de rangée
  d'outils a sa place.
- **Le crash d'entrée d'emplacement reste corrigé.** L'ancienne pastille appelait un emplacement
  standard comme un accesseur nu (`useSession()`) — chaque emplacement de renderer est un hook
  sélecteur `useSyncExternalStoreWithSelector`, l'appel levait donc
  `TypeError: l is not a function` et faisait tomber toute l'entrée à chaque rendu. La commande
  lit désormais le modèle actif via un sélecteur obligatoire.
- **La source du modèle est indépendante de l'emplacement.** Elle préfère l'emplacement de session
  `useTrajectory` (le registre des requêtes, DSH 0.1.2+) et retombe sur `useConversation`
  (`ConversationSnapshot.views.get('trajectory')`) sur les lignes de harnais qui en sont
  dépourvues ; un harnais qui ne fournit ni l'un ni l'autre ne rend rien au lieu d'une commande
  morte.
- **La popup est une rangée à curseur unique** : curseur de préréglages (64K / 128K / 256K / 400K /
  512K / 1M) écrivant une fois par geste (relâchement du pointeur, relâchement de touche, blur),
  la valeur validée, un éditeur d'entier personnalisé replié (`⋯`) et Effacer. La pastille
  n'affiche que la valeur ; les textes `input.context.*` sont restaurés dans les quatre
  dictionnaires.
- **Inchangé : l'éditeur de la carte de réglages.** Les préréglages de fenêtre de contexte par
  modèle, l'entier personnalisé et Effacer restent exactement tels quels, écrivant dans les mêmes
  espaces de noms `llm-pi-ai` / `llm-deepseek`.

### Rupture — DSH v0.1.2+ uniquement (suppression de `dsh-client-runtime`) — 0.7.2-beta.1

- **`engines.dsh` vaut désormais `>=0.1.2-alpha.1 <0.2.0-0`.** `@deepseek-ai/dsh-client-runtime`
  a été supprimé en bloc dans `0.1.2-alpha.1` (commit `be531688f3`) ; cette version est la
  frontière dure de segment. La ligne de plugin précédente (`0.7.1-beta.2` et antérieures) continue
  de servir DSH 0.1.0 / 0.1.1.
- **`ClientContext` a disparu.** `src/client/index.ts` importe désormais
  `Context as ClientContext` depuis `@deepseek-ai/cordis`, à l'instar de chaque plugin client
  officiel. `@deepseek-ai/dsh-client-runtime` est retiré de `peerDependencies`,
  `peerDependenciesMeta` et `devDependencies`, il ne bloque donc plus l'installation.
- **`src/types/contracts.d.ts` perd le miroir ambiant
  `declare module '@deepseek-ai/dsh-client-runtime/client'`.** `SettingsScope` gagne les champs de
  capture `base` / `user` / `revision` et `bind` accepte un `decode` optionnel ; le miroir
  `SlotsFace` reste (le vrai `SlotRegistry` de `@deepseek-ai/dsh-client-ui-renderer` le fournit à
  l'exécution).
- **`dsh.client.inject` liste `@deepseek-ai/dsh-client-ui-renderer`**, le paquet qui fournit le
  service `slots` dans lequel ce plugin s'enregistre.
- **Enregistrement localisé scindé par surcharge.** La forme massive
  `register(ns, dicts)` est typée sur les identifiants de locale intégrés (`zh` / `en`
  uniquement), si bien que les dictionnaires `ja` / `ko` livrés passent désormais par la surcharge
  mono-locale `register(ns, locale, dict)` et sont libérés ensemble. Le comportement est
  inchangé ; l'appel typecheck désormais contre le vrai paquet de locale.

### Supprimé

- **Écouteur `agent/tool` mort.** La télémétrie temps réel par outil enregistrait un gestionnaire
  `ctx.on('agent/tool', …)` qui tenait une map `started` et journalisait `tool … took …ms`. DSH n'a
  pas un tel événement ni en 0.1.1-rc.2 ni en 0.1.2-rc.1 — le registre d'événements de périmètre
  (`packages/core/scope/src/scoped-events.generated.ts`) liste douze événements `agent/*` et
  `agent/tool` n'en fait pas partie — le gestionnaire n'a donc jamais tourné et la ligne de
  journal n'a jamais été émise. Suppression de l'écouteur, de sa map `started`, du balayage
  `pruneStale` et de la constante `TOOL_AGE_LIMIT_MS`.
- **Le planificateur d'effort n'est pas affecté.** La reconnaissance d'outils est une *traction*,
  pas une poussée : la cascade `agent/request` appelle `recentToolCalls(payload.agent)`, qui lit
  les enregistrements `tool/call` dans `agent.session.events` et alimente `scheduleEffort`. Ce
  chemin a ses propres tests (`tests/session-events.spec.ts`, `tests/thinking-level.spec.ts`) et
  n'a pas été touché.

### Corrigé — ligne principale renumérotée en 2.x — 2.0.0-beta.1

- **La commande rapide de fenêtre de contexte faisait crasher son emplacement à chaque rendu.**
  `ContextQuick` appelait l'emplacement standard de session comme un accesseur nu (`useSession()`).
  Chaque emplacement standard de renderer est un *hook sélecteur* `useSyncExternalStoreWithSelector`
  lié par `bindSnapshotSelector` (`@deepseek-ai/dsh-client-ui-renderer`), si bien que l'appel
  atteignait le shim avec `selector === undefined` et levait `TypeError: l is not a function` :
  l'entrée `conversation.input.right` mourait et la barrière d'erreur de l'emplacement la
  relançait à chaque rendu. Le même composant lisait aussi `session.views.get('trajectory')`, un
  champ que `SessionSnapshot` n'a jamais porté (les vues appartiennent à `ConversationSnapshot`),
  il n'aurait donc pu résoudre aucun modèle même sans le crash. Le modèle actif provient désormais
  de l'emplacement de session `useTrajectory` via un sélecteur stable au niveau module sur le
  registre des requêtes.
- **La commande a déménagé dans la carte de menu de modèle.** Elle s'enregistre dans
  `conversation.input.model.section` — la bande que ui-model-selection rend sous les rangées
  Modèle / Effort de raisonnement — comme une rangée à curseur compacte : un curseur de
  préréglages (64K / 128K / 256K / 400K / 512K / 1M) qui écrit une fois par geste (relâchement
  du pointeur, relâchement de touche, blur), la valeur validée, un éditeur d'entier personnalisé
  replié et Effacer. Le texte se réduit au libellé de rangée, à la valeur et à Effacer. La
  pastille de la rangée composer disparaît ; la carte de réglages conserve l'éditeur complet par
  modèle. La rangée apparaît sur les harnais dont l'emplacement de modèle déclare cet emplacement
  enfant (ajouté dans `packages/client/ui-model-selection`) ; sur les harnais plus anciens,
  l'enregistrement reste en attente et la carte de réglages demeure l'éditeur.
- **Version de `dsh.plugin.json` synchronisée** avec `package.json` ; le tarball 0.7.2-beta.1 l'avait
  expédiée en 0.7.1-beta.2.
- **Renumérotation des versions : la ligne est désormais le chiffre majeur.** Cette ligne
  principale (DSH 0.1.2+) passe en **2.x**, la ligne héritée (DSH < 0.1.2, branche
  `compat/dsh-0.1.1`) en **1.x**, si bien qu'une version installée indique quel segment de
  harnais elle sert. Les dist-tags npm gardent leurs rôles : `beta` = cette ligne, `compat` = la
  ligne héritée. Rien d'autre ne change pour les installations existantes ; une plage `0.7.x` ne
  correspond simplement pas à `2.x`, le basculement est donc explicite.
- **La rangée de menu de modèle exige un harnais qui déclare l'emplacement.**
  `conversation.input.model.section` est ajouté à `packages/client/ui-model-selection`
  (déclaration + appel `renderSlot`) ; tant qu'une version de harnais publiée ne la porte pas,
  l'enregistrement reste en attente et la carte de réglages demeure l'éditeur. Aucun harnais
  publié ne la porte aujourd'hui.

## [0.7.0] — 2026-09-09

> **Version stable.** La voie court-circuit est retirée ; tous les correctifs de passerelle
> empruntent désormais la surface compat officielle `llm-pi-ai` (dsh ≥ **v0.1.0-rc.8**). Cette
> version inclut aussi les préréglages de fenêtre de contexte de l'ébauche 0.7.0 antérieure.

### Ajouté

- **Préréglages de fenêtre de contexte multi-niveaux** dans l'éditeur de capacités par modèle :
  boutons de préréglages `64K / 128K / 256K / 400K / 512K / 1M` plus une saisie d'entier
  personnalisé et un bouton d'effacement, écrits dans le `contextWindow` du modèle `llm-pi-ai` et
  consommés à chaud par le harnais (compaction / détection de débordement de contexte /
  projections de pression de contexte) à la requête suivante — sans redémarrage.
- Nouveau module pur `src/context-window.ts` (constantes de plage `2000`–`1_000_000`, liste de
  préréglages, `formatContextWindow`, `validateContextWindow`) partagé par le schéma de
  configuration, la carte de réglages et les tests.
- Surface de configuration : la surcharge `models[].contextWindow` est acceptée avec validation
  entière `2000`–`1000000` (échec bruyant sur les valeurs hors bornes).
- Nouveaux textes `zh` / `en` / `ja` / `ko` pour la commande de fenêtre de contexte.
- Ajout de `dsh.plugin.json` avec `engines.dsh: ">=0.1.0-rc.8"`.
- Ajout de `peerDependencies` pour `dsh-client-runtime`, `dsh-client-locale`, `dsh-client-ui-settings`,
  `dsh-client-ui-slots` (tous optionnels).

### Supprimé

- **Le pont de takeover court-circuit** : le plugin ne tient plus la liste de takeover
  `llm-openai-completions` (`nextTakeoverSection` / `TakeoverSection` disparaissent). Le plugin
  adaptateur `dsh-llm-openai-completions` n'est PAS nécessaire aux côtés de cette version et peut
  rester désinstallé.

### Modifié

- **Pont auto-compat réécrit sur la surface compat officielle** (`withOfficialCompatFixes`) : pour
  chaque route de passerelle openai-completions personnalisée qui déclare la réflexion, la
  synchronisation écrit désormais
  - au niveau de la route `compat.supportsDeveloperRole: false` (prompt système envoyé en tant
    que `system` — corrige l'erreur 400 `Unexpected message role` de vLLM/SGLang), et
  - au niveau du modèle `compat.thinkingFormat: 'qwen-chat-template'` sur les lignes de réflexion
    à bascule (pas de prise en charge d'effort au niveau de la ligne) pour que pi-ai envoie
    `chat_template_kwargs.enable_thinking` — les serveurs vLLM nus ignorent le `enable_thinking`
    de premier niveau du format `qwen` simple.
- Le motif de stockage suit le côté hôte de dsh-thinking-effort : lecture → transformation pure
  (identité quand rien à changer) → `settings.update('llm-pi-ai', …)` de section entière, si bien
  que le validateur de schéma `llm-pi-ai` de dsh conditionne l'écriture là où elle est ÉCRITE ;
  un dsh antérieur à rc.8 rejette le champ inconnu et la synchronisation journalise et conserve
  la section précédente. Les valeurs explicites de toute couche sont respectées et jamais écrasées.
- **Carte de capacités dé-court-circuitée** : le commutateur « takeover court-circuit » est
  remplacé par un commutateur par fournisseur **« la passerelle rejette le rôle developer »**
  (écrit/efface le drapeau au niveau de la route ; décocher restaure l'héritage). Le
  conditionnement par liste de takeover disparaît — les modèles de chaque fournisseur llm-pi-ai
  sont directement modifiables, en couches progressives : ① réflexion + vision → ② prise en charge
  d'effort (modèles de réflexion uniquement) → ③ éditeur wire d'effort → ④ thinkingFormat →
  ⑤ fenêtre de contexte. Activer la réflexion sur un modèle à bascule auto-remplit
  `thinkingFormat: 'qwen-chat-template'` (uniquement si absent) ; activer l'effort le retire à
  nouveau.
- `declaresThinking` scanne désormais aussi `modelOverrides` (auparavant seulement `models[]`),
  si bien que les routes uniquement-modelOverrides sont identifiées et corrigées aussi.
- Le garde de lecture de posture d'adaptateur (`takeoverOf` / `piAiPosture`) est conservé mais
  inerte : en l'absence de l'adaptateur, il produit la sémantique pi-ai native.
- Le badge de contexte réutilise désormais le `formatContextWindow` partagé pour que les
  préréglages écrits s'affichent exactement (par ex. `256000` → `256K`, `1000000` → `1M`).

### Notes

- Exige dsh ≥ **v0.1.0-rc.8** pour la surface compat officielle. Sur un dsh plus ancien, le
  schéma refuse les champs compat (échec bruyant, pas de mauvaise configuration silencieuse).
- La découpe en ligne des `<think>` côté réponse reste une affaire de passerelle : un vLLM nu a
  besoin de `--reasoning-parser qwen3` ; pi-ai (≤ 0.85.1) n'analyse que `reasoning_content` /
  `reasoning` / `reasoning_text`. `qwen-chat-template` ne porte pas de `reasoning_effort` (les
  branches du format sont mutuellement exclusives) — les niveaux d'effort ne pilotent que l'on/off
  de `enable_thinking`. Le parallélisme vrai (chat_template_kwargs + reasoning_effort) exige un
  changement en amont de pi-ai.
- Les matériels de vérification vivent sur la branche `check` (`check/CHECK.md`,
  `check/record-proxy.mjs`, `check/settings-route.example.yaml`) ; ils ne font pas partie du
  paquet npm.

## [0.6.0] — 2026-02-?

### Ajouté

- **Huit niveaux standard** alignés sur dsh-thinking-effort : `off / on / minimal / low / medium / high / xhigh / max` (plus le masque de planification `auto`). `on` est la bascule d'activation de la réflexion, écrêtée sur la force par défaut du modèle (`high` ou le niveau de réflexion annoncé le plus élevé) ; `minimal` / `medium` / `xhigh` passent tels quels quand une passerelle personnalisée les annonce et se replient sur `high` sur l'adaptateur officiel.
- **Mapping wire personnalisé dans la carte de réglages** (emprunté à dsh-thinking-effort) : chaque niveau peut être coché et recevoir la valeur exacte envoyée à la passerelle (par ex. `high` → `ultra`) ; `off` laissé vide signifie « ne pas envoyer ». Stocké dans la table `reasoningEfforts` du modèle.
- **Refonte de la présentation de la carte de réglages** (empruntée à dsh-thinking-effort) : les fournisseurs regroupent leurs modèles, chaque ligne de modèle affiche des badges texte/image/contexte, les modèles se déploient en un éditeur par niveau, une zone de recherche filtre les modèles, et des préréglages en un clic (style officiel DeepSeek / générique) s'appliquent à chaque modèle de réflexion.
- **Multilingue** : dictionnaires japonais (`ja`) et coréen (`ko`), plus `README.ja.md` / `README.ko.md`, `INSTALL.{md,zh,ja,ko}.md` et `CHANGELOG.{md,ja,ko}.md`. Remarque : l'environnement d'exécution des locales du DSH officiel n'expose toujours que `zh` / `en`, donc la sélection `ja` / `ko` exige un fork de DSH (voir la note de compatibilité du README).

### Modifié

- La surface de configuration `level` accepte les neuf valeurs complètes (`off | on | minimal | low | medium | high | xhigh | max | auto`).
- La surcharge `models[].efforts` accepte les niveaux étendus.
- Renderer de carte refactoré ; les éditeurs de capacités utilisent désormais un brouillon wire par étapes avec un bouton explicite **Appliquer les niveaux** au lieu de validations immédiates par case à cocher.

### Corrigé

- Helper inutilisé `effortLevelsOf` supprimé ; avertissement de lint des paramètres inutilisés `_N` silencié.

## [0.5.2] — 2026-02-?

### Ajouté

- **Takeover automatique de `dsh-llm-openai-completions`** : les fournisseurs qui sont des passerelles openai-completions personnalisées (`api: openai-completions` ou baseURL non officielle) **et** déclarent une table `reasoningEfforts` sur un modèle quelconque sont fusionnés dans `llm-openai-completions.providers` avec `enabled: true`. S'exécute au démarrage du plugin, sur `llm/adapters-updated` et sur les changements de réglages ; couplage souple (ignore l'écriture quand l'espace de noms n'est pas enregistré).

## [0.5.1] — 2026-02-?

### Ajouté

- Carte éditeur de capacités de modèles : vision / réflexion / prise en charge d'effort / niveaux d'effort / format de réflexion pour chaque modèle de fournisseur personnalisé `llm-pi-ai`, écrit directement dans l'espace de noms de réglages `llm-pi-ai` (aucune modification des paquets officiels).

## [0.5.0] — 2026-02-?

### Ajouté

- Garde tenant compte du modèle : ne jamais envoyer `reasoning_effort` à un modèle qui ne l'annonce pas (les routes openai-completions personnalisées comme Qwen3.6 sont retirées au lieu).
- Transmission de `low` sur dsh rc.7+ ; les adaptateurs de l'époque rc.6 peuvent annoncer `low` via une surcharge `models` confirmée par le configurateur.
- Section de configuration `models` (`provider/model` → `vision` / `thinking` / `efforts`).

## [0.4.1] — 2026-02-?

### Corrigé

- Le wrapper `resolveModel` de l'adaptateur se relance désormais sur `llm/adapters-updated` pour que le masque `Auto` apparaisse même quand les adaptateurs s'enregistrent après l'application du plugin.

## [0.4.0] — 2026-02-?

### Modifié

- Suppression de la dépendance en valeur à `@deepseek-ai/dsh-settings` ; l'enregistrement des réglages passe par le service cordis `settings` (équivalent local de `installSettingsSection`).
- L'enregistrement de carte fournit à la fois `id` et `key` pour fonctionner sur les déclarations d'emplacement de la CLI (par clé) et de DSH Desktop (par liste).

## [0.3.0] — 2026-02-?

### Ajouté

- `Auto` du sélecteur de modèle (masque) : injecté dans les efforts de `resolveModel` de l'adaptateur ; le plugin planifie `low` / `high` / `max` à chaque étape via la cascade `agent/request` (enregistrée avec `prepend` pour que l'assemblage de sélection de modèle de session ne puisse pas l'écraser).

## [0.2.1] — 2026-02-?

### Corrigé

- Ajout de `exports["./client"]` pour que le bundle client soit découvert par le chargeur de modules clients de dsh.

## [0.2.0] — 2026-02-?

### Ajouté

- Première carte de réglages client (sélecteur de niveau + commutateurs du planificateur).

## [0.1.1] — 2026-02-?

### Corrigé

- Publication de `lib/` compilé au lieu des sources TS brutes (Node 22 interdit le retrait de types des `.ts` sous `node_modules`).

## [0.1.0] — 2026-02-?

### Ajouté

- Version initiale : injection `agent/request` d'un effort de raisonnement fixe.
