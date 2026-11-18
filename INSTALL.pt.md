# Guia de instalação (CLI oficial do DSH)

Este guia usa somente o comando oficial `dsh plugin`. O comando instala a dependência em um perfil e sincroniza `dsh.profile.bundles`. Não o substitua por um simples `npm install`, um `pnpm add` direto no perfil nem edições manuais do manifesto do perfil.

- [Guia de instalação em português](./INSTALL.pt.md)
- [Guía de instalación en español](./INSTALL.es.md)
- [English installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [README em português](./README.pt.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)
- [Changelog em português](./CHANGELOG.pt.md)

Os marcadores de posição deste guia são:

- `<profile>`: o perfil DSH a modificar, normalmente `web`;
- `dsh-thinking-levels`: o pacote npm e o ID do plugin em tempo de execução;
- `thinking-levels`: o ID da composição Cordis e do slot de configurações.

> **Requisito de versão — DSH v0.2.0-rc.1 ou mais recente.**
>
> Verifique primeiro a versão em execução (`dsh --version`).
>
> | Versão do DSH | Ação |
> | --- | --- |
> | ≥ 0.2.0-rc.1 | Instala esta versão (4.0.x). |
> | ≥ 0.1.7-rc.1 a < 0.2.0 | Instala a linha 3.x: `dsh plugin --profile <profile> add dsh-thinking-levels@dsh-0.1.7 -w` (3.4.3). |
> | < 0.1.7-rc.1 | Fique na linha de plugin anterior (3.0.2). Não execute uma build de plugin mais antiga contra o DSH 0.1.7+ — atualize o plugin em vez disso. |
>
> A fronteira é `0.1.7-rc.1`, onde o DSH removeu o registro imperativo de configurações (`settings.register` / `installSettingsSection`) e o serviço cliente `settingsScope`. A partir dessa fronteira, tanto a linha 3.x (hosts 0.1.7) quanto esta versão (hosts 0.2.0-rc) miram a mesma superfície declarativa de configurações (campos de esquema `.volatile()` + `configForms`).

> As linhas mais antigas do DSH são instaladas do npm pelo dist-tag: `dsh plugin add dsh-thinking-levels@dsh-0.1.7` (DSH 0.1.7–0.1.x, plugin 3.4.3), `...@dsh-0.1.5` (DSH 0.1.5), `...@dsh-0.1.2` (DSH 0.1.2), `...@compat` (DSH 0.1.0–0.1.1). Nunca instale as versões `0.x` nuas da era `latest` (≤ 0.6.0) — elas não trazem declarações peer de dsh.

## 0. Pré-requisitos e descoberta do perfil

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Use o perfil que o seu processo DSH em execução nomeia. `web` é o habitual, mas é o argumento `--profile` ativo que manda.

## 1. Instalação oficial

Instale a última versão:

```bash
dsh plugin --profile <profile> add dsh-thinking-levels -w
```

(A bandeira `-w` é necessária quando o perfil é a raiz de um workspace pnpm, como é o caso do `web`.)

Instale explicitamente a versão atual:

```bash
dsh plugin --profile <profile> add dsh-thinking-levels@4.0.0 -w
```

A CLI oficial atualiza automaticamente a dependência do perfil, o lockfile e o `dsh.profile.bundles`. Não adicione uma linha YAML manual.

### Período de espera da cadeia de suprimentos

O ambiente de execução do dsh usa pnpm 11, cuja política `minimumReleaseAge` pode bloquear uma versão recém-publicada com `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Adicione a versão a `minimumReleaseAgeExclude` em `~/.dsh/profiles/web/pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - dsh-thinking-levels@4.0.0
```

## 2. Atualização

Atualize para a última versão do registro:

```bash
dsh plugin --profile <profile> update dsh-thinking-levels -w
```

Reinicie o DSH para mudanças do host e recarregue a página web para mudanças do cliente.

## 3. Registro por caminho local / link: (alternativa)

Para desenvolvimento ou instalações sem conexão, registre o plugin a partir de um checkout local:

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

Ou use a CLI oficial com um caminho local (sem precisar de rede):

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-thinking-levels -w
```

## 4. Verificar a instalação

Confira a dependência e a versão instalada:

```bash
grep -n "dsh-thinking-levels" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-thinking-levels/package.json').version"
```

A versão deve ser `4.0.0` para esta release.

Confira a composição oficial:

```bash
dsh --profile <profile> --dump-default-config
```

Ela deve conter:

```yaml
- id: thinking-levels
  name: dsh-thinking-levels
```

## 5. Verificar o formulário de configurações

Reinicie o DSH e, em seguida, recarregue a página web. Abra **Configurações → Plugins** e procure a entrada **dsh-thinking-levels** — desde o DSH 0.1.7 o formulário é gerado pelo host a partir dos campos de esquema `.volatile()` declarados pelo plugin (já não existe um cartão cliente personalizado).

1. O formulário mostra o interruptor de habilitação, o seletor de nível (oito níveis padrão mais `auto`) e os interruptores do planejador (`allowDowngrade` / `allowUpgrade`).
2. As alterações confirmadas se aplicam à próxima requisição ao modelo sem reinício (configuração volátil ao vivo).
3. O editor de capacidades por modelo (valores wire do gateway, llm-pi-ai) viajava com o cartão aposentado e já não faz parte deste plugin — edite as capacidades dos modelos `llm-pi-ai` pelas configurações oficiais de modelos.

## Estado do suporte a japonês e coreano

O plugin inclui dicionários `ja` e `ko`, mas a versão oficial atual do DSH só expõe `zh` e `en` por meio do `LocaleRuntime`. Em um DSH de fábrica, selecionar japonês ou coreano falha com `locale "<id>" is not registered`.

Para usá-los antes de chegar o suporte oficial, mantenha um fork do DSH e atualize:

- `packages/client/locale/src/locale-settings.ts`: adicione `ja` e `ko` a `LOCALE_IDS` (o esquema de preferências do Host deriva dessa lista).
- `packages/client/locale/src/client/index.ts`: adicione `{ id: 'ja', label: '日本語' }` e `{ id: 'ko', label: '한국어' }` a `LOCALES`.
- Adicione os dicionários e testes de núcleo correspondentes e, então, recompile e execute o DSH bifurcado.

Uma mudança limitada ao plugin não pode estender a lista global de locales do DSH. Use a build documentada do fork e os comandos oficiais de perfil; não edite manualmente um manifesto de perfil.

## 6. Solução de problemas

| Sintoma | Ação |
| --- | --- |
| `dsh` não encontrado | Instale ou habilite a CLI oficial do DSH. Não simule a instalação no perfil com simples comandos npm ou pnpm. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Adicione a versão a `minimumReleaseAgeExclude` no `pnpm-workspace.yaml` do perfil. |
| O plugin aparece como "desabilitado/desmontado" sem erro | Confira a composição do perfil; o host não deve ter dependência de valor de `@deepseek-ai/dsh-settings` (e não tem). |
| Entrada de cliente ausente em `__DSH_BOOT__` | Confirme que `exports["./client"]` existe e que a fibra do host foi estabelecida. |
| O seletor de modelo não tem `Auto` | Confirme que o wrapper `resolveModel` do adaptador foi executado (ele é reexecutado em `llm/adapters-updated`). |
| A gravação do formulário de configurações falha | O valor foi rejeitado pelo esquema do plugin; alinhe-o aos tipos declarados dos campos `.volatile()`. |
| Um subagente devolve `UNSUPPORTED_REASONING_EFFORT` | O modelo de destino não anuncia esse nível; escolha um suportado ou restaure o padrão do provedor. |
| Bundle de cliente desatualizado | Recarga forte do navegador (Ctrl+Shift+R) após uma atualização. |

## 7. Remoção

Use o comando oficial:

```bash
dsh plugin --profile <profile> remove dsh-thinking-levels -w
```

Verifique que a composição do perfil já não contém o bundle:

```bash
dsh --profile <profile> --dump-default-config
```
