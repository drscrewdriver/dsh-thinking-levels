# dsh-thinking-levels

**Contrôle du niveau de réflexion (`reasoning_effort`) par tour pour [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) : choisissez `Auto` (un masque) dans le sélecteur de modèle de session et le plugin planifie `low` / `high` / `max` à partir de l'historique récent des appels d'outils avant de soumettre l'effort à l'API — ou fixez manuellement un niveau wire (`off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`). Les tours d'outils bon marché restent bon marché ; les tâches lourdes ne manquent jamais de raisonnement.**

- [README en français](./README.fr.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [Guide d'installation en français](./INSTALL.fr.md)
- [Installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [Changelog en français](./CHANGELOG.fr.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

> **v0.7.0-beta.1 (2026-09-06) : la voie court-circuit est retirée.** Cette version ne dépend plus de `dsh-llm-openai-completions` — les correctifs pour passerelles personnalisées empruntent la surface compat officielle `llm-pi-ai` (nécessite **dsh ≥ v0.1.2-alpha.1**) ; laissez le plugin adaptateur désinstallé. Voir le [CHANGELOG](./CHANGELOG.md).

> **▼ Prise en charge des versions de DSH**
>
> Cette version (4.0.0) prend en charge **DSH v0.2.0-rc.1 à < 0.2.1** uniquement.
>
> | Version de DSH | Statut | Notes |
> | --- | --- | --- |
> | ≥ 0.2.0-rc.1 | ✅ Pris en charge | Cette version (4.0.x) : même surface de réglages déclarative (champs de schéma `.volatile()` rendus par l'hôte ; lectures/écritures inter-plugins via le service `configForms`), avec la contrainte peer recalée sur le segment 0.2.0-rc |
> | ≥ 0.1.7-rc.1 à < 0.2.0 | ✅ Pris en charge | Utilisez la ligne 3.x (3.4.3, dist-tag npm `dsh-0.1.7`) : réglages déclaratifs — l'hôte rend le formulaire Plugins à partir des champs de schéma `.volatile()` du plugin ; les lectures/écritures inter-plugins passent par le service `configForms` |
> | < 0.1.7-rc.1 | ⚠️ Non pris en charge | DSH 0.1.7 a supprimé l'enregistrement impératif des réglages et l'emplacement de carte par plugin dont dépendaient les lignes antérieures (3.0.x et avant) — restez sur le plugin 3.0.2 pour les hôtes 0.1.2–0.1.6. |
>
> La frontière est `0.1.7-rc.1`, où DSH a supprimé l'enregistrement impératif des réglages (`settings.register` / `installSettingsSection`) et le service client `settingsScope`. Depuis cette frontière, les champs de configuration ajustables à l'exécution sont marqués `.volatile()` dans le schéma schemastery, l'hôte génère le formulaire de réglages à partir de ce seul schéma (aucun appel d'enregistrement, aucune carte de réglages côté client), et le plugin lit les valeurs à jour à chaque requête, piloté par `loader/volatile-update`. Les lignes 3.1.x–3.4.x ciblent la surface déclarative de 0.1.7 ; la ligne 4.0.x est la même surface recalée sur le segment 0.2.0-rc.

> **Politique de plages de versions :** chaque ligne de compatibilité cale étroitement son hôte sur son propre segment. Les lignes ciblant des hôtes 0.1.x suivent `>=0.1.x-rc.1 <0.1.(x+1)-0` (3.1.x : `>=0.1.7-rc.1 <0.1.8-0` ; 3.0.x : `>=0.1.5-alpha.1 <0.1.6-0` ; 2.0.x : `>=0.1.2-alpha.1 <0.1.3-0` ; 1.0.0-beta : `>=0.1.0-rc.8 <0.1.2-alpha.1`) ; les lignes ciblant le segment 0.2.x suivent `>=0.2.0-rc.1 <0.2.1-0` (4.0.x : `>=0.2.0-rc.1 <0.2.1-0`). Aucune ligne ne déclare jamais de borne haute ouverte : un résolveur de compatibilité ne peut donc jamais apparier une ligne de plugin à un segment d'hôte plus récent pour lequel elle n'a pas été conçue. Les versions 0.4.0–0.6.0 ne portaient aucune déclaration peer dsh et sont de fait sans typage de compatibilité — ne les installez pas.

> **Note de compatibilité :** la version `0.6.0` inclut les dictionnaires et entrées de sélecteur japonais (`ja`) et coréen (`ko`), mais les versions officielles actuelles de DSH n'exposent que `zh` et `en` via `LocaleRuntime`. Sur un DSH d'origine, sélectionner `ja` ou `ko` échoue avec `locale "<id>" is not registered`. Ces langues fonctionneront une fois que le DSH officiel aura ajouté les identifiants de locale correspondants. Les utilisateurs avancés peuvent utiliser un fork de DSH qui met à jour `packages/client/locale/src/locale-settings.ts` (`LOCALE_IDS`) et `packages/client/locale/src/client/index.ts` (libellés `LOCALES`), ainsi que les dictionnaires et tests de base correspondants, puis recompiler et exécuter le DSH forké. Modifier ce plugin seul ne peut pas étendre la liste globale des locales de DSH.

Dans une chaîne d'outils multi-étapes, le modèle re-réfléchit avant **chaque** appel d'outil — et cette réflexion domine le temps réel (une tâche d'agent de 50 étapes peut passer des minutes à raisonner entre les outils). `dsh-thinking-levels` se branche sur la cascade `agent/request` que dsh réévalue à chaque étape (enregistrée avec `prepend` pour que l'assemblage de sélection de modèle de session ne puisse pas écraser sa décision) et injecte un niveau de réflexion dans la prochaine requête de modèle.

## Aperçu

Captures d'écran de l'interface en direct (dsh web) :

<figure>
  <img width="460" alt="Menu déroulant Auto du sélecteur de modèle injecté par le plugin : niveaux Off / Low / High / Max / Auto, High actuellement sélectionné, Auto en surbrillance — Auto est un masque, le plugin planifie low/high/max à chaque étape à partir de l'historique d'outils." src="assets/官方模型的自动级别调整.png" />
  <figcaption>Le sélecteur de modèle natif gagne <strong>Auto</strong> — choisissez-le et le plugin planifie low/high/max à chaque étape au lieu d'un niveau wire fixe.</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="Réglages du niveau de réflexion (carte 3.0.x affichée) : niveau par défaut (planification auto), commutateurs activer / autoriser-descente / autoriser-montée, table des capacités de modèles du fournisseur personnalisé llm-pi-ai avec l'éditeur progressif par modèle, et préréglages appliquer-à-tous (Off/High/Max style officiel DeepSeek, Off/Low/Medium/High générique)." src="assets/自动思考级别配置.png" />
  <figcaption>Réglages du niveau de réflexion, carte 3.0.x (capture conservée pour référence). Depuis 3.1.0 / DSH 0.1.7, le niveau et les commutateurs du planificateur s'affichent sous forme de formulaire déclaratif généré par l'hôte ; la carte personnalisée et son éditeur de capacités llm-pi-ai ont été supprimés avec l'emplacement retiré.</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="Éditeur de capacités par modèle pour un modèle openai-completions personnalisé (local-35b / Qwen3.6-35B-A3B), tel que livré dans la carte de réglages 3.0.x : modèle de réflexion et vision activés, prise en charge de l'effort désactivée, format de réflexion qwen-chat-template (auto-rempli) ; pas de commutateur de takeover — le drapeau compat officiel se trouve sur la ligne du fournisseur ; préréglages de limite de fenêtre de contexte 64K/128K/256K/400K/512K/1M avec saisie personnalisée." src="assets/自定义模型的思考接管-短路-上下文窗口限制.png" />
  <figcaption>Carte de capacités par modèle, 3.0.x (capture conservée pour référence). Depuis 3.1.0 / DSH 0.1.7, l'éditeur de capacités n'est plus livré ; modifiez les capacités des modèles `llm-pi-ai` via les réglages officiels des modèles.</figcaption>
</figure>

## Niveaux

| Niveau | Signification | Emplacement |
|---|---|---|
| `off` | réflexion désactivée (manuel uniquement — jamais choisi automatiquement) | sélecteur de modèle / niveau par défaut |
| `on` | réflexion activée (modèles à bascule uniquement) : envoie `enable_thinking`, jamais d'effort de réflexion | sélecteur de modèle / niveau par défaut |
| `minimal` | effort minimal (tâches très légères) | sélecteur de modèle / niveau par défaut |
| `low` | choix manuel pour les tâches de chat simples (les tours bon marché restent bon marché) | sélecteur de modèle / niveau par défaut |
| `medium` | effort moyen | sélecteur de modèle / niveau par défaut |
| `high` | l'effort officiel par défaut | sélecteur de modèle / niveau par défaut |
| `xhigh` | effort extra-haut | sélecteur de modèle / niveau par défaut |
| `max` | travail lourd | sélecteur de modèle / niveau par défaut |
| `auto` | **masque** : planifie à chaque étape à partir de l'historique récent des appels d'outils, résolu en un niveau wire avant soumission | sélecteur de modèle (injecté par le plugin) / niveau par défaut |

Faits sur les niveaux wire (vérifiés contre la documentation officielle DeepSeek et l'adaptateur `llm-deepseek` de dsh) : `low` correspond 1:1 sur deepseek-v4-flash / v4-pro, tandis que `medium` / `xhigh` se replient sur `high`. L'adaptateur n'accepte que `off | low | high | max` et rejette tout le reste avec `UNSUPPORTED_REASONING_EFFORT` — `auto` est la couche masque du plugin, jamais envoyée telle quelle à l'API, toujours résolue en un niveau wire concret avant injection. `on` n'est **pas** un niveau d'effort : seuls les modèles à bascule (style Qwen3.6) l'annoncent, et il se contente de passer `enable_thinking` à true — aucun `reasoning_effort` n'est envoyé ; un modèle capable d'effort n'annonce jamais `on`, donc une sélection manuelle de `on` sur un tel modèle est retirée.

## Mapping wire personnalisé

Pour les modèles `llm-pi-ai` déclarés à la main, mappez chaque niveau vers la valeur exacte qu'attend votre passerelle (emprunté à dsh-thinking-effort) : cochez un niveau et saisissez sa valeur wire, par ex. `high` → `ultra`. Le mapping est stocké dans la table `reasoningEfforts` du modèle dans la configuration `llm-pi-ai`, si bien que la sélection `High` du Composer envoie `ultra` à la passerelle. Laisser `off` vide signifie « ne pas envoyer ».

- Préréglage officiel : `Off / High / Max` (style officiel DeepSeek)
- Préréglage générique : `Off / Low / Medium / High`

> L'éditeur visuel de ce mapping figurait sur la carte de réglages du plugin, supprimée par la migration DSH 0.1.7 (l'emplacement n'existe plus). Modifiez plutôt la table `reasoningEfforts` via la surface officielle de réglages des modèles — de toute façon, la détection et l'injection côté hôte lisent cette configuration en direct.

## Préréglages de fenêtre de contexte

La commande rapide de la rangée d'outils du Composer (à côté du sélecteur de modèle/d'effort) édite une **limite de fenêtre de contexte** : paliers prédéfinis `64K / 128K / 256K / 400K / 512K / 1M`, une saisie d'entier personnalisé et un bouton d'effacement. La valeur est écrite dans l'entrée `contextWindow` du modèle `llm-pi-ai` (entier `2000`–`1000000`) — ou dans l'entrée `llm-deepseek` pour les modèles DeepSeek officiels.

En amont, le harnais la consomme via `resolveModelInfo(...).context.contextWindow` pour les seuils de compaction, la détection de débordement de contexte et les projections de pression de contexte. Comme `llm-pi-ai` relit la configuration à jour à chaque résolution et que la synchronisation compat ne bloque pas la découverte de modèles, une modification de réglages prend effet à la requête suivante sans redémarrage.

La configuration du plugin accepte aussi `models['provider/model'].contextWindow` comme déclaration validée (entier `2000`–`1000000`) sur la surface de composition/configuration.

## Garde-fou tenant compte du modèle (v0.5.0)

Le plugin n'envoie jamais de `reasoning_effort` à un modèle qui n'en annonce pas. Les routes
openai-completions personnalisées (par ex. un Qwen3.6 local sans `reasoningEfforts`) sont classées
non raisonneuses via `ctx.llm.resolveModelInfo`, et tout effort — hérité ou planifié — est
**retiré** au lieu d'être envoyé, si bien que le rejet par requête `UNSUPPORTED_REASONING_EFFORT` de
dsh ne peut pas se déclencher. Les champs non pris en charge ne sont jamais transmis à une API qui
ne peut pas les accepter.

Comportement par version :

| version de dsh | gestion de `low` |
|---|---|
| rc.6 (ancien) | non natif : le sélecteur ne l'affiche que si une surcharge `models` confirmée par le configurateur le nomme ; le niveau est alors annoncé (sélecteur + validation de requête) et transmis tel quel |
| rc.7+ (nouveau) | natif : le plugin ne le réécrit ni ne le réinjecte ; une sélection manuelle de `low` passe inchangée |

Le planificateur auto peut toujours choisir `low` pour les modèles qui le prennent en charge — c'est le garde-fou de capacités ci-dessus qui l'en éloigne pour les modèles inaptes.

## Auto du sélecteur de modèle

Le sélecteur de modèle de session (à côté du modèle) propose désormais **Auto** après les niveaux wire (injecté dans les métadonnées du répertoire de modèles par le plugin) :

| Choix du sélecteur de modèle | Comportement |
|---|---|
| **Auto** | le plugin planifie via l'historique d'outils + les commutateurs descente/montée, résout en `low` / `high` / `max` avant soumission |
| `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max` | **le choix manuel l'emporte** — le plugin n'intervient pas (`on` reste `on` sur les modèles à bascule, jamais élevé en effort ; les modèles capables d'effort le retirent) |
| non défini | le niveau par défaut du plugin s'applique (ci-dessous) |

## Planificateur auto

Le pivot est `high` (l'officiel par défaut). `auto` planifie entre `low` / `high` / `max` ; il ne choisit jamais `off`.

| Appels d'outils récents | Niveau |
|---|---|
| aucun (prompt frais, pur chat) | `low` |
| ≥75 % d'outils simples, petits arguments, descentes autorisées | `low` |
| outils mixtes / lourds | `high` |
| charges très lourdes, montées autorisées | `max` |

La politique de planification partage la même source que [dsh-tool-turbo](https://github.com/drscrewdriver/dsh-tool-turbo) (même liste blanche d'outils simples / mêmes seuils de charge / même règle des 75 %).

## Installation

Voir [INSTALL.md](./INSTALL.fr.md) pour le guide complet de la CLI officielle (découverte du profil, mise à niveau, migration, vérification, dépannage). Démarrage rapide :

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

> Remarque : l'environnement d'exécution dsh utilise pnpm 11, dont la politique de chaîne d'approvisionnement `minimumReleaseAge` peut bloquer une version fraîchement publiée avec `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` — ajoutez la version à `minimumReleaseAgeExclude` dans `~/.dsh/profiles/web/pnpm-workspace.yaml` pour lever la période de refroidissement.

Enregistrement manuel via `link:` (alternative à `dsh plugin add`) :

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

## Configuration

Deux surfaces partagent un même schéma :

- **Assemblage** — le `config:` de la ligne du plugin dans la composition du profil (par ex. `cordis.yml`) :
  ```yaml
  config:
    level: auto            # off | on | minimal | low | medium | high | xhigh | max | auto — the default level when the session picks nothing
    allowDowngrade: true   # let the scheduler drop below `high`
    allowUpgrade: false    # forbid the scheduler lifting to `max`
  ```
- **Exécution** — les champs de configuration `.volatile()` du plugin (`enabled`, `level`, `allowDowngrade`, `allowUpgrade`) : DSH 0.1.7 génère le formulaire de réglages Plugins à partir du schéma déclaré, et les modifications validées parviennent au plugin sous forme de références de configuration à jour (`loader/volatile-update`) — elles s'appliquent à la requête de modèle suivante, sans redémarrage. (`models` reste un champ de niveau configurateur : modifiez-le dans la composition du profil.)

Les surcharges de capacités par modèle (`models`, clé `provider/model`) confirment ce que la détection auto trouve ; le configurateur a le dernier mot :

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

> Pour la bascule de réflexion + budget de Qwen, configurez plutôt la route **llm-pi-ai** :
> `compat.thinkingFormat: qwen` (→ `enable_thinking` + `thinking_budget` wire via
> `thinkingBudgets`), ou `qwen-chat-template` (→ `chat_template_kwargs.enable_thinking`) pour
> les modèles à effort comme Qwen3.8-27B.

Valeurs par défaut : `{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false, models: {} }`.

> Sémantique : le choix du sélecteur de modèle prime sur le niveau par défaut du plugin. Choisissez `auto` (masque) → le plugin planifie ; choisissez un niveau wire → appliqué directement ; ne choisissez rien → le `level` par défaut du plugin est utilisé. `allowDowngrade` / `allowUpgrade` ne contraignent que la planification `auto`.

## Surface compat officielle : l'outil court-circuit est retiré (0.7.0-beta.1)

Dès que des passerelles personnalisées (vLLM / LM Studio / proxys OpenAI-compatibles auto-hébergés) déclarent la réflexion, ce plugin écrit les correctifs dans la **surface compat officielle `llm-pi-ai`** (introduite dans dsh ≥ **v0.1.0-rc.8**, commit `884f7b9c41`) — [dsh-llm-openai-completions](https://github.com/drscrewdriver/dsh-llm-openai-completions) n'est plus nécessaire et doit rester désinstallé :

- Scanne `llm-pi-ai.providers` à la recherche de routes qui sont des passerelles openai-completions personnalisées (`api: openai-completions` ou baseURL non officielle) **et** déclarent une table `reasoningEfforts` sur un modèle quelconque (y compris `modelOverrides`), puis écrit :
  - au niveau de la route `compat.supportsDeveloperRole: false` — le prompt système part en tant que `system`, corrigeant l'erreur 400 `Unexpected message role` de vLLM / SGLang ;
  - au niveau du modèle `compat.thinkingFormat: 'qwen-chat-template'` sur les lignes de réflexion à bascule (table de réflexion sans `supportsReasoningEffort` au niveau de la ligne) — pi-ai envoie alors `chat_template_kwargs.enable_thinking` (les serveurs vLLM nus ignorent le `enable_thinking` de premier niveau du format `qwen` simple) ;
- Les écritures passent par le canal officiel de réglages (lecture → transformation pure → `settings.update('llm-pi-ai', …)` de section entière), si bien que le schéma de dsh valide l'écriture **là où elle est écrite** : un dsh antérieur à rc.8 rejette les champs avec un avertissement dans les journaux — pas de mauvaise configuration silencieuse ; les valeurs explicites de toute couche ne sont jamais écrasées ;
- Déclenché au démarrage du plugin, sur `llm/adapters-updated` et sur les changements de configuration de `llm-pi-ai` — pas d'édition manuelle de configuration ;
- La découpe en ligne des `<think>` côté réponse reste une **affaire de passerelle** : un vLLM nu a besoin de `--reasoning-parser qwen3` (pi-ai n'analyse que `reasoning_content` / `reasoning` / `reasoning_text`).

# Note sur les dépendances

La moitié hôte ne dépend **pas** en valeur de `@deepseek-ai/dsh-settings` — depuis la ligne DSH 0.1.7, il n'y a plus aucun enregistrement de réglages : le formulaire de réglages est généré par l'hôte à partir du schéma schemastery déclaré par le plugin (champs `.volatile()`), et la moitié client dialogue avec le service `configForms` fourni par l'environnement d'exécution dsh. Inutile d'installer manuellement les paquets officiels dans le profil. `dependencies` ne contient que `@deepseek-ai/schemastery` (installé automatiquement avec le paquet).

## Développement

```bash
npm run lint        # eslint (typescript-eslint flat config)
npm run typecheck   # tsc --noEmit
npm test            # vitest — 46 tests
```

Couverture des tests : politique de niveaux (transmission manuelle y compris les niveaux étendus, écrêtage de `on`, planificateur auto, validation, frontière des outils simples), garde-fou de capacités de modèles (`reasoningEffortSupported`, retrait/transmission de `resolveEffortInjection`), analyse des événements de session (gardes, plafonnement de fenêtre, enregistrements malformés), schéma de configuration (synchronisation des valeurs par défaut, rejet hors bornes, surcharges `models`) et synchronisation compat officielle (identification, respect des valeurs explicites, idempotence identité, validation de schéma à l'écriture).

## Licence

MIT
