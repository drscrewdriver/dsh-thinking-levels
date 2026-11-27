# dsh-thinking-levels

**Controle do nível de raciocínio (`reasoning_effort`) por rodada para o [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness): escolha `Auto` (uma máscara) no seletor de modelo da sessão e o plugin programa `low` / `high` / `max` a partir do histórico recente de chamadas de ferramentas antes de enviar o effort à API — ou fixe manualmente um nível wire (`off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`). Rodadas baratas de ferramentas continuam baratas; o trabalho pesado nunca fica sem raciocínio.**

- [README em português](./README.pt.md)
- [README en español](./README.es.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [Guia de instalação em português](./INSTALL.pt.md)
- [Guía de instalación en español](./INSTALL.es.md)
- [Installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [Changelog em português](./CHANGELOG.pt.md)
- [Changelog en español](./CHANGELOG.es.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

> **Dependência de transporte opcional.** A partir da linha 4.4.x, o *Third-party takeover* (opt-in) conduz o transporte `dsh-llm-openai-completions` em três protocolos wire (openai-completions / openai-responses / anthropic) e é declarado como **peer opcional** — o mesmo nível de transporte LLM do qual outros plugins dependem. Sem ele, as correções de compatibilidade para gateways personalizados seguem pela superfície compat oficial `llm-pi-ai`. Consulte o [CHANGELOG](./CHANGELOG.md).

> **▼ Versões do DSH suportadas**
>
> Esta versão declara os hosts DSH como **um intervalo delimitado** — `>=0.1.0-rc.8 <0.3.0-0` — cada rc listado individualmente, sem intervalos nem carets; o 0.2.1 estável só é declarado após a sua publicação.
>
> | Versão do DSH | Estado | Notas |
> | --- | --- | --- |
> | ≥ 0.2.0-rc.1 | ✅ Suportada | Esta versão (4.0.x): a mesma superfície declarativa de configurações (campos de esquema `.volatile()` renderizados pelo host; leituras/escrituras entre plugins pelo serviço `configForms`), com o gate de peer reorientado ao segmento 0.2.0-rc |
> | ≥ 0.1.7-rc.1 a < 0.2.0 | ✅ Suportada | Use a linha 3.x (3.4.3, dist-tag npm `dsh-0.1.7`): configurações declarativas — o host renderiza o formulário Plugins a partir dos campos de esquema `.volatile()` do plugin; as leituras/escrituras entre plugins passam pelo serviço `configForms` |
> | < 0.1.7-rc.1 | ⚠️ Não suportada | O DSH 0.1.7 removeu o registro imperativo de configurações (`settings.register` / `installSettingsSection`) e o assento de cartão por plugin de que as linhas anteriores (3.0.x e anteriores) dependiam — fique no plugin 3.0.2 para hosts 0.1.2–0.1.6. |
>
> A fronteira é `0.1.7-rc.1`, onde o DSH removeu o registro imperativo de configurações (`settings.register` / `installSettingsSection`) e o serviço cliente `settingsScope`. A partir dessa fronteira, os campos de configuração ajustáveis em tempo de execução são marcados `.volatile()` no esquema schemastery, o host gera o formulário de configurações sozinho a partir desse esquema (sem chamada de registro, sem cartão de configurações no cliente) e o plugin lê os valores ao vivo em cada requisição, guiado por `loader/volatile-update`. As linhas 3.1.x–3.4.x miram a superfície declarativa do 0.1.7; a linha 4.0.x é a mesma superfície reorientada ao segmento 0.2.0-rc.

> **Política de intervalos de versão:** cada linha de compatibilidade fixa o seu host com rigor no próprio segmento. As linhas destinadas a hosts 0.1.x seguem `>=0.1.x-rc.1 <0.1.(x+1)-0` (3.1.x: `>=0.1.7-rc.1 <0.1.8-0`; 3.0.x: `>=0.1.5-alpha.1 <0.1.6-0`; 2.0.x: `>=0.1.2-alpha.1 <0.1.3-0`; 1.0.0-beta: `>=0.1.0-rc.8 <0.1.2-alpha.1`); as linhas destinadas ao segmento 0.2.x seguem `>=0.2.0-rc.1 <0.2.1-0` (4.0.x: `>=0.2.0-rc.1 <0.2.1-0`). Nenhuma linha declara jamais um limite superior aberto, assim um resolvedor de compatibilidade nunca pode parear uma linha do plugin com um segmento de host mais recente para o qual ela não foi construída. As versões 0.4.0–0.6.0 não traziam nenhuma declaração peer de dsh e são, na prática, sem tipagem de compatibilidade — não as instale.

> **Suporte a idiomas:** este plugin registra `ja`/`ko`/`fr`/`de`/`it`/`ru`/`es`/`pt` como selecionáveis em tempo de execução via `LocaleRuntime.addLanguage` (sonda da API; em host sem ela recua para `zh`/`en` e instala todos os dicionários mesmo assim). Não é necessário fork do DSH.

Em uma cadeia de ferramentas de vários passos, o modelo volta a pensar antes de **cada** chamada de ferramenta — e esse pensamento domina o tempo de relógio (uma tarefa de agente de 50 passos pode gastar minutos raciocinando entre ferramentas). O `dsh-thinking-levels` se conecta ao waterfall `agent/request` que o dsh resolve de novo a cada passo (registrado com `prepend` para que a montagem de seleção de modelo da sessão não possa sobrescrever a sua decisão) e injeta um nível de raciocínio na próxima requisição ao modelo.

## Prévia

Capturas de tela da interface ao vivo (dsh web):

<figure>
  <img width="460" alt="Menu suspenso Auto do seletor de modelo injetado pelo plugin: níveis Off / Low / High / Max / Auto, High selecionado no momento, Auto destacado — Auto é uma máscara, o plugin programa low/high/max por passo a partir do histórico de ferramentas." src="assets/官方模型的自动级别调整.png" />
  <figcaption>O seletor de modelo nativo ganha <strong>Auto</strong> — escolha-o e o plugin programa low/high/max por passo em vez de um nível wire fixo.</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="Configurações do nível de raciocínio (o cartão 3.0.x é exibido): nível padrão (programação auto), interruptores habilitar / permitir-descenso / permitir-elevação, tabela de capacidades de modelos do provedor personalizado llm-pi-ai com o editor progressivo por modelo e presets de aplicar-a-todos (Off/High/Max estilo oficial DeepSeek, Off/Low/Medium/High genérico)." src="assets/自动思考级别配置.png" />
  <figcaption>Configurações do nível de raciocínio, cartão 3.0.x (captura preservada como referência). Desde 3.1.0 / DSH 0.1.7, o nível e os interruptores do planejador são renderizados como um formulário declarativo gerado pelo host; o cartão personalizado e o seu editor de capacidades llm-pi-ai foram removidos junto com o assento aposentado.</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="Editor de capacidades por modelo para um modelo openai-completions personalizado (local-35b / Qwen3.6-35B-A3B), como era enviado no cartão de configurações 3.0.x: modelo de raciocínio e vision ativados, suporte a think effort desativado, formato de raciocínio qwen-chat-template (autocompletado); sem interruptor de takeover — a bandeira compat oficial vive na linha do provedor; presets de limite de janela de contexto 64K/128K/256K/400K/512K/1M com entrada personalizada." src="assets/自定义模型的思考接管-短路-上下文窗口限制.png" />
  <figcaption>Cartão de capacidades por modelo, 3.0.x (captura preservada como referência). Desde 3.1.0 / DSH 0.1.7, o editor de capacidades não é mais enviado; edite as capacidades dos modelos `llm-pi-ai` pelas configurações oficiais de modelos.</figcaption>
</figure>

## Níveis

| Nível | Significado | Onde |
|---|---|---|
| `off` | raciocínio desativado (somente manual — nunca é escolhido automaticamente) | seletor de modelo / nível padrão |
| `on` | raciocínio ativado (somente modelos do tipo alternância): envia `enable_thinking`, nunca um think effort | seletor de modelo / nível padrão |
| `minimal` | o menor esforço (tarefas muito leves) | seletor de modelo / nível padrão |
| `low` | escolha manual para tarefas simples de chat (rodadas baratas continuam baratas) | seletor de modelo / nível padrão |
| `medium` | esforço médio | seletor de modelo / nível padrão |
| `high` | o effort oficial padrão | seletor de modelo / nível padrão |
| `xhigh` | esforço extra alto | seletor de modelo / nível padrão |
| `max` | trabalho pesado | seletor de modelo / nível padrão |
| `auto` | **máscara**: programa por passo a partir do histórico recente de chamadas de ferramentas, resolvido para um nível wire antes do envio | seletor de modelo (injetado pelo plugin) / nível padrão |

Fatos sobre os níveis wire (verificados contra a documentação oficial da DeepSeek e o adaptador `llm-deepseek` do dsh): em deepseek-v4-flash / v4-pro, `low` mapeia 1:1, enquanto `medium` / `xhigh` colapsam sobre `high`. O adaptador aceita apenas `off | low | high | max` e rejeita qualquer outra coisa com `UNSUPPORTED_REASONING_EFFORT` — `auto` é a camada de máscara do plugin, nunca enviada como está à API, sempre resolvida para um nível wire concreto antes da injeção. `on` **não** é um nível de effort: só o anunciam modelos do tipo alternância (estilo Qwen3.6), e ele apenas põe `enable_thinking` em true — nenhum `reasoning_effort` é enviado; um modelo capaz de effort nunca anuncia `on`, então uma escolha manual de `on` em um é descartada.

## Mapeamento wire personalizado

Para modelos `llm-pi-ai` declarados manualmente, mapeie cada nível ao valor exato que o seu gateway espera (herdado do dsh-thinking-effort): marque um nível e digite o seu valor wire, p. ex. `high` → `ultra`. O mapeamento é salvo como a tabela `reasoningEfforts` do modelo na configuração do `llm-pi-ai`, de modo que a seleção `High` no Composer envia `ultra` ao gateway. Deixar `off` vazio significa "não enviar".

- Preset oficial: `Off / High / Max` (estilo oficial DeepSeek)
- Preset genérico: `Off / Low / Medium / High`

> O editor visual desse mapeamento viajava no cartão de configurações do plugin, removido pela migração do DSH 0.1.7 (o assento não existe mais). Edite a tabela `reasoningEfforts` pela superfície oficial de configurações de modelos — afinal, a detecção e a injeção do host leem essa configuração ao vivo.

## Presets de janela de contexto

O controle rápido da barra de ferramentas do Composer (junto ao seletor de modelo/effort) edita um **limite de janela de contexto**: paradas predefinidas `64K / 128K / 256K / 400K / 512K / 1M`, uma entrada de inteiro personalizado e um botão de limpeza. O valor é escrito na entrada `contextWindow` do modelo `llm-pi-ai` (inteiro `2000`–`1000000`) — ou na entrada `llm-deepseek` para os modelos DeepSeek oficiais.

Rio acima, o harness consome isso por meio de `resolveModelInfo(...).context.contextWindow` para os limiares de compactação, a detecção de estouro de contexto e as projeções de pressão de contexto. Como o `llm-pi-ai` relê a configuração ao vivo em cada resolução e a sincronização compat não bloqueia a descoberta de modelos, uma mudança de configuração surte efeito na próxima requisição sem reinício.

A configuração do plugin também aceita `models['provedor/modelo'].contextWindow` como declaração validada (inteiro `2000`–`1000000`) na superfície de composição/configuração.

## Proteção consciente do modelo (v0.5.0)

O plugin nunca envia um `reasoning_effort` a um modelo que não o anuncia. As rotas
openai-completions personalizadas (p. ex., um Qwen3.6 local sem `reasoningEfforts`) são classificadas
como não-raciocinantes via `ctx.llm.resolveModelInfo`, e qualquer effort — herdado ou programado —
é **removido** em vez de enviado, de modo que a rejeição por requisição `UNSUPPORTED_REASONING_EFFORT`
do dsh não pode ser disparada. Campos não suportados nunca são passados a uma API que não pode
recebê-los.

Comportamento por versão:

| versão do dsh | tratamento de `low` |
|---|---|
| rc.6 (antiga) | não nativo: o seletor só o mostra quando um override de `models` confirmado pelo configurador o nomeia; o nível é então anunciado (seletor + validação de requisição) e passado como está |
| rc.7+ (nova) | nativo: o plugin nem o reescreve nem o reinjeta; uma escolha manual de `low` passa sem mudanças |

O planejador auto ainda pode escolher `low` para os modelos que o suportam — é a proteção de capacidades acima que o mantém longe dos modelos que não podem recebê-lo.

## Auto do seletor de modelo

O seletor de modelo da sessão (junto ao modelo) agora oferece **Auto** depois dos níveis wire (injetado nos metadados do diretório de modelos pelo plugin):

| Escolha no seletor de modelo | Comportamento |
|---|---|
| **Auto** | o plugin programa pelo histórico de ferramentas + os interruptores de elevação/rebaixamento e resolve para `low` / `high` / `max` antes do envio |
| `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max` | **a escolha manual vence** — o plugin não intervém (`on` permanece `on` em modelos do tipo alternância, nunca elevado a um effort; modelos capazes de effort o descartam) |
| sem escolha | aplica-se o nível padrão do plugin (abaixo) |

## Planejador auto

O eixo é `high` (o oficial padrão). `auto` programa entre `low` / `high` / `max`; nunca escolhe `off`.

| Chamadas recentes de ferramentas | Nível |
|---|---|
| nenhuma (prompt novo, chat puro) | `low` |
| ≥75 % ferramentas simples, argumentos pequenos, descensos permitidos | `low` |
| ferramentas mistas / pesadas | `high` |
| cargas muito pesadas, elevações permitidas | `max` |

A política de programação compartilha a mesma fonte que o [dsh-tool-turbo](https://github.com/drscrewdriver/dsh-tool-turbo) (a mesma lista branca de ferramentas simples / os mesmos limiares de carga / a mesma regra dos 75 %).

**De onde vêm as amostras (4.4.7+).** O planejador recolhe os eventos `tool/call` em uma projeção de Session (`tlAutoSchedule`) e portanto vê o histórico real de ferramentas em qualquer host desde 0.1.2-rc.1; a leitura `session.events` anterior à 4.4.7 só produzia amostras no 0.1.0-rc.8. A escolha explícita da sessão é recolhida de eventos `model/selection`, então um nível devolvido em eco pelo host nunca pode ser confundido com uma escolha manual. Limite conhecido: o host `0.1.0-rc.8` não expõe `stateOf` na sua superfície de registro (contrato plano antigo); essa linha mantém a leitura antiga do array — a programação funciona, a correção do eco não.

## Instalação

Consulte [INSTALL.pt.md](./INSTALL.pt.md) para o guia completo da CLI oficial (descoberta do perfil, atualização, migração, verificação, solução de problemas). Início rápido:

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

> Nota: o ambiente de execução do dsh usa pnpm 11, cuja política de cadeia de suprimentos `minimumReleaseAge` pode bloquear uma versão recém-publicada com `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` — adicione a versão a `minimumReleaseAgeExclude` em `~/.dsh/profiles/web/pnpm-workspace.yaml` para suspender o período de espera.

Registro manual com `link:` (alternativa a `dsh plugin add`):

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

## Configuração

Duas superfícies compartilham um mesmo esquema:

- **Montado** — o `config:` da linha do plugin na composição do perfil (p. ex. `cordis.yml`):
  ```yaml
  config:
    level: auto            # off | on | minimal | low | medium | high | xhigh | max | auto — the default level when the session picks nothing
    allowDowngrade: true   # let the scheduler drop below `high`
    allowUpgrade: false    # forbid the scheduler lifting to `max`
  ```
- **Tempo de execução** — os campos de configuração `.volatile()` do plugin (`enabled`, `level`, `allowDowngrade`, `allowUpgrade`): o DSH 0.1.7 gera o formulário de configurações Plugins a partir do esquema declarado, e as alterações confirmadas chegam ao plugin como referências de configuração ao vivo (`loader/volatile-update`) — aplicam-se à próxima requisição ao modelo, sem reinício. (`models` continua sendo um campo em nível de configurador: edite-o na composição do perfil.)

Os overrides de capacidades por modelo (`models`, chave `provedor/modelo`) confirmam o que a detecção automática encontra; a última palavra é do configurador:

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

> Para o interruptor de raciocínio + orçamento do Qwen, configure na rota **llm-pi-ai**:
> `compat.thinkingFormat: qwen` (→ `enable_thinking` + `thinking_budget` wire via
> `thinkingBudgets`), ou `qwen-chat-template` (→ `chat_template_kwargs.enable_thinking`) para
> modelos com effort como o Qwen3.8-27B.

Valores padrão: `{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false, models: {} }`.

> Semântica: a escolha do seletor de modelo prevalece sobre o nível padrão do plugin. Escolha `auto` (máscara) → o plugin programa; escolha um nível wire → ele é aplicado diretamente; não escolha nada → usa-se o `level` padrão do plugin. `allowDowngrade` / `allowUpgrade` só restringem a programação `auto`.

## Superfície compat oficial: a ferramenta de curto-circuito é aposentada (0.7.0-beta.1)

Quando gateways personalizados (vLLM / LM Studio / proxies compatíveis com OpenAI auto-hospedados) declaram raciocínio, este plugin escreve as correções na **superfície compat oficial do `llm-pi-ai`** (introduzida no dsh ≥ **v0.1.0-rc.8**, commit `884f7b9c41`) — o [dsh-llm-openai-completions](https://github.com/drscrewdriver/dsh-llm-openai-completions) não é mais necessário e deve permanecer desinstalado:

- Examina `llm-pi-ai.providers` em busca de rotas que sejam gateways openai-completions personalizados (`api: openai-completions` ou baseURL não oficial) **e** declarem uma tabela `reasoningEfforts` em qualquer modelo (incluindo `modelOverrides`), e então escreve:
  - em nível de rota `compat.supportsDeveloperRole: false` — o prompt de sistema sai como `system`, corrigindo o erro 400 `Unexpected message role` de vLLM / SGLang;
  - em nível de modelo `compat.thinkingFormat: 'qwen-chat-template'` nas linhas de raciocínio do tipo alternância (tabela de raciocínio sem `supportsReasoningEffort` em nível de linha) — o pi-ai envia então `chat_template_kwargs.enable_thinking` (servidores vLLM nus ignoram o `enable_thinking` de primeiro nível do formato `qwen` simples);
- As escrituras passam pelo canal oficial de configurações (leitura → transformação pura → `settings.update('llm-pi-ai', …)` da seção inteira), de modo que o esquema do dsh valida a escrita **onde ela acontece**: um dsh anterior ao rc.8 rejeita os campos com um aviso no log — sem configuração ruim silenciosa; valores explícitos de qualquer camada nunca são sobrescritos;
- É disparada ao iniciar o plugin, em `llm/adapters-updated` e nas mudanças de configuração do `llm-pi-ai` — sem edição manual da configuração;
- O corte em linha dos `<think>` no lado da resposta continua sendo um **assunto do gateway**: um vLLM nu precisa de `--reasoning-parser qwen3` (o pi-ai só analisa `reasoning_content` / `reasoning` / `reasoning_text`).

# Nota sobre dependências

A metade do host **não** tem dependência de valor `@deepseek-ai/dsh-settings` — desde a linha DSH 0.1.7 não existe nenhum registro de configurações: o formulário de configurações é gerado pelo host a partir do esquema schemastery declarado pelo plugin (campos `.volatile()`), e a metade cliente dialoga com o serviço `configForms` fornecido pelo runtime do dsh. Não é preciso instalar os pacotes oficiais no perfil manualmente. `dependencies` é apenas `@deepseek-ai/schemastery` (instalado automaticamente com o pacote).

## Desenvolvimento

```bash
npm run lint        # eslint (typescript-eslint flat config)
npm run typecheck   # tsc --noEmit
npm test            # vitest — 46 tests
```

Cobertura de testes: política de níveis (passo manual, incluindo os níveis estendidos, contenção de `on`, planejador auto, validação, fronteira de ferramentas simples), a proteção de capacidades do modelo (`reasoningEffortSupported`, remoção/passo de `resolveEffortInjection`), a análise de eventos de sessão (guardas, teto de janela, registros malformados), o esquema de configuração (sincronia dos valores padrão, rejeição fora do intervalo, overrides de `models`) e a sincronização compat oficial (identificação, respeito a valores explícitos, idempotência de identidade, validação de esquema na escrita).

## Licença

MIT

## Effort-tier catalog, one-click sync, per-model compaction (4.8.0–4.13.0)

- **Selectable languages (4.8.0):** eight more UI languages become selectable via `LocaleRuntime.addLanguage`, capability-probed with a per-entry fallback.
- **Mainstream-model tier catalog (4.9.0):** a built-in 9-family catalog (OpenAI / Claude / Gemini 4 / Gemini 3 / DeepSeek / Grok / Qwen / GLM-Kimi-MiniMax) records each family's supported levels, wire spellings, vendor default and whether thinking can be disabled; each model line shows a read-only family badge. Every entry carries a source URL + retrieval date; unverified families show the name but no suggested ladder.
- **One-click sync (4.10.0):** the settings card's "Model tier" section previews every model (family / current / to-write / skip reason), then writes `reasoningEfforts` through the existing `llm-pi-ai` scope. By default it only fills undeclared models; overwriting an existing declaration needs the explicit checkbox, and the official `llm-deepseek` route is never written.
- **Auto failure signal + downward clamp (4.11.0):** repeated same-argument tool failures or an errored turn hold the auto tier at `high` (or lift to `max`); an unsupported scheduled level now clamps DOWN to the highest supported level ≤ the target.
- **Subagent tier (4.12.0):** delegated subagents can carry their own level, detected capability-style from `agent.options.subagentDepth`; `inherit` (default) keeps pre-4.12 behavior on hosts without the field.
- **Per-model compaction threshold (4.13.0):** when the host's `dsh-compaction-basic` config exposes `modelPolicies`, the settings card offers per-model trigger/retain ratios. It only writes edited models, never touches the `auto` switch or global ratios, and never calls the private `compactRegion()`.
