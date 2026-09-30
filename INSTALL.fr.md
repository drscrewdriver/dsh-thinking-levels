# Guide d'installation (CLI DSH officiel)

Ce guide n'utilise que la commande officielle `dsh plugin`. Cette commande installe la dépendance dans un profil et synchronise `dsh.profile.bundles`. Ne la remplacez pas par un simple `npm install`, un `pnpm add` direct dans le profil, ou des éditions manuelles du manifeste du profil.

- [Guide d'installation en français](./INSTALL.fr.md)
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

Les espaces réservés de ce guide sont :

- `<profile>` : le profil DSH à modifier, généralement `web` ;
- `dsh-thinking-levels` : le paquet npm et l'ID du plugin à l'exécution ;
- `thinking-levels` : l'ID de composition Cordis et du Slot de réglages.

> **Exigence de version — DSH v0.2.0-rc.1 ou plus récent.**
>
> Vérifiez d'abord la version en cours d'exécution (`dsh --version`).
>
> | Version de DSH | Action |
> | --- | --- |
> | ≥ 0.2.0-rc.1 | Installez cette version (4.0.x). |
> | ≥ 0.1.7-rc.1 à < 0.2.0 | Installez la ligne 3.x : `dsh plugin --profile <profile> add dsh-thinking-levels@dsh-0.1.7 -w` (3.4.3). |
> | < 0.1.7-rc.1 | Restez sur la ligne de plugin précédente (3.0.2). N'exécutez pas une construction de plugin plus ancienne contre DSH 0.1.7+ — mettez plutôt le plugin à niveau. |
>
> La frontière est `0.1.7-rc.1`, où DSH a supprimé l'enregistrement impératif des réglages (`settings.register` / `installSettingsSection`) et le service client `settingsScope`. Depuis cette frontière, aussi bien la ligne 3.x (hôtes 0.1.7) que cette version (hôtes 0.2.0-rc) ciblent la même surface de réglages déclarative (champs de schéma `.volatile()` + `configForms`).

> Les lignes DSH plus anciennes s'installent depuis npm via leur dist-tag : `dsh plugin add dsh-thinking-levels@dsh-0.1.7` (DSH 0.1.7–0.1.x, plugin 3.4.3), `...@dsh-0.1.5` (DSH 0.1.5), `...@dsh-0.1.2` (DSH 0.1.2), `...@compat` (DSH 0.1.0–0.1.1). N'installez jamais les versions `0.x` de l'époque `latest` nues (≤ 0.6.0) — elles ne portent aucune déclaration peer dsh.

## 0. Prérequis et découverte du profil

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Utilisez le profil nommé par votre processus DSH en cours d'exécution. `web` est courant, mais l'argument `--profile` actif fait foi.

## 1. Installation officielle

Installez la dernière version :

```bash
dsh plugin --profile <profile> add dsh-thinking-levels -w
```

(L'option `-w` est requise quand le profil est une racine d'espace de travail pnpm, comme `web` l'est.)

Installez explicitement la version courante :

```bash
dsh plugin --profile <profile> add dsh-thinking-levels@4.0.0 -w
```

La CLI officielle met à jour automatiquement la dépendance du profil, le lockfile et `dsh.profile.bundles`. N'ajoutez pas de ligne YAML manuelle.

### Période de refroidissement de la chaîne d'approvisionnement

L'environnement d'exécution dsh utilise pnpm 11, dont la politique `minimumReleaseAge` peut bloquer une version fraîchement publiée avec `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Ajoutez la version à `minimumReleaseAgeExclude` dans `~/.dsh/profiles/web/pnpm-workspace.yaml` :

```yaml
minimumReleaseAgeExclude:
  - dsh-thinking-levels@4.0.0
```

## 2. Mise à niveau

Mettez à niveau vers la dernière version du registre :

```bash
dsh plugin --profile <profile> update dsh-thinking-levels -w
```

Redémarrez DSH pour les changements côté hôte et rafraîchissez la page Web pour les changements côté client.

## 3. Enregistrement local par chemin / link: (alternative)

Pour le développement ou les installations hors ligne, enregistrez le plugin depuis un checkout local :

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

Ou utilisez la CLI officielle avec un chemin local (sans réseau) :

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-thinking-levels -w
```

## 4. Vérifier l'installation

Vérifiez la dépendance et la version installée :

```bash
grep -n "dsh-thinking-levels" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-thinking-levels/package.json').version"
```

La version doit être `4.0.0` pour cette release.

Vérifiez la composition officielle :

```bash
dsh --profile <profile> --dump-default-config
```

Elle doit contenir :

```yaml
- id: thinking-levels
  name: dsh-thinking-levels
```

## 5. Vérifier le formulaire de réglages

Redémarrez DSH, puis rafraîchissez la page Web. Ouvrez **Paramètres → Plugins** et cherchez l'entrée **dsh-thinking-levels** — depuis DSH 0.1.7, le formulaire est généré par l'hôte à partir des champs de schéma `.volatile()` déclarés par le plugin (il n'y a plus de carte client personnalisée).

1. Le formulaire affiche la bascule d'activation, le sélecteur de niveau (huit niveaux standard plus `auto`) et les commutateurs du planificateur (`allowDowngrade` / `allowUpgrade`).
2. Les modifications validées s'appliquent à la requête de modèle suivante sans redémarrage (configuration volatile à jour).
3. L'éditeur de capacités par modèle (valeurs wire de passerelle, llm-pi-ai) était livré avec la carte retirée et ne fait plus partie de ce plugin — modifiez les capacités des modèles `llm-pi-ai` via les réglages officiels des modèles.

## État de la prise en charge du japonais et du coréen

Le plugin livre des dictionnaires `ja` et `ko`, mais la version officielle actuelle de DSH n'expose que `zh` et `en` via `LocaleRuntime`. Sur un DSH d'origine, sélectionner le japonais ou le coréen échoue avec `locale "<id>" is not registered`.

Pour les utiliser avant l'arrivée de la prise en charge officielle, maintenez un fork de DSH et mettez à jour :

- `packages/client/locale/src/locale-settings.ts` : ajoutez `ja` et `ko` à `LOCALE_IDS` (le schéma de préférences de l'Hôte dérive de cette liste).
- `packages/client/locale/src/client/index.ts` : ajoutez `{ id: 'ja', label: '日本語' }` et `{ id: 'ko', label: '한국어' }` à `LOCALES`.
- Ajoutez les dictionnaires et tests de base correspondants, puis recompilez et exécutez le DSH forké.

Un changement limité au plugin ne peut pas étendre la liste globale des locales de DSH. Utilisez les commandes de build documentées du fork et les commandes officielles de profil ; n'éditez pas manuellement un manifeste de profil.

## 6. Dépannage

| Symptôme | Action |
| --- | --- |
| `dsh` est introuvable | Installez ou activez la CLI DSH officielle. Ne simulez pas l'installation de profil avec de simples commandes npm ou pnpm. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Ajoutez la version à `minimumReleaseAgeExclude` dans le `pnpm-workspace.yaml` du profil. |
| Le plugin apparaît comme « désactivé/démonté » sans erreur | Vérifiez la composition du profil ; l'hôte ne doit pas dépendre en valeur de `@deepseek-ai/dsh-settings` (c'est le cas). |
| Entrée client absente de `__DSH_BOOT__` | Confirmez que `exports["./client"]` existe et que la fibre de l'hôte a été établie. |
| Le sélecteur de modèle n'a pas de `Auto` | Confirmez que le wrapper `resolveModel` de l'adaptateur a tourné (il se relance sur `llm/adapters-updated`). |
| L'écriture du formulaire de réglages échoue | La valeur a été rejetée par le schéma du plugin ; alignez-la sur les types des champs `.volatile()` déclarés. |
| Un sous-agent renvoie `UNSUPPORTED_REASONING_EFFORT` | Le modèle cible n'annonce pas ce niveau ; choisissez-en un pris en charge ou restaurez la valeur par défaut du fournisseur. |
| Bundle client périmé | Effectuez un rafraîchissement forcé du navigateur (Ctrl+Shift+R) après une mise à niveau. |

## 7. Suppression

Utilisez la commande officielle :

```bash
dsh plugin --profile <profile> remove dsh-thinking-levels -w
```

Vérifiez que le profil composé ne contient plus le bundle :

```bash
dsh --profile <profile> --dump-default-config
```
