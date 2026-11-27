# Registro de mudanças

Todas as mudanças notáveis de `dsh-thinking-levels` estão documentadas aqui.

- [Changelog em português](./CHANGELOG.pt.md)
- [Changelog en español](./CHANGELOG.es.md)
- [English changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)
- [Changelog en français](./CHANGELOG.fr.md)
- [Changelog auf Deutsch](./CHANGELOG.de.md)
- [Changelog in italiano](./CHANGELOG.it.md)
- [Список изменений на русском](./CHANGELOG.ru.md)

## 4.13.0 (2026-11-27)
- Limiares de compactação por modelo gravados em modelPolicies do dsh-compaction-basic (nunca auto nem razões globais; renderiza só se modelPolicies existir).
## 4.12.0 (2026-11-27)
- Nível de subagente separado (ramo A): detecção de agent.options.subagentDepth. Config.subagentLevel (inherit padrão, volatile). Sem o campo = comportamento 4.11.0.
## 4.11.0 (2026-11-27)
- Auto ganha um sinal de falha determinístico; clamp PARA BAIXO (nível suportado mais alto ≤ alvo); ≥ high diante de falha.
## 4.10.0 (2026-11-27)
- Sincronização em um clique: prévia → confirmação → gravação de reasoningEfforts. Por padrão só os não declarados; a rota oficial llm-deepseek não é tocada.
## 4.9.0 (2026-11-27)
- Catálogo integrado de níveis de modelo (9 famílias). Selo de família somente leitura em cada linha. Nenhuma gravação.
## 4.8.0 (2026-11-27)
- Oito idiomas de fato selecionáveis via LocaleRuntime.addLanguage (sonda de capacidade, senão recua para zh/en). Removida do README a afirmação errônea de que é preciso fork.

## 4.4.16

- i18n: adiciona o locale português (pt-BR) — dicionário de tempo de execução, metadados do pacote e espelhos README/INSTALL/CHANGELOG.
- Área de terminal (dsh-tui / paleta de comandos do Desktop, mesma fonte): `/think` na área de terminal (nível atual + troca com dry por padrão, só grava com `--yes`).
- 4.4.14: correção do julgamento de ferramentas simples do nível auto (issue #8) + lista de acrescento configurável `Config.simpleTools`.

## [4.4.14] — 2026-11-10 (rebaixamento auto: remoção de namespace + shell/pwsh embutidos + lista de acrescento configurável)

### Corrigido
- **issue #8: o nível `auto` nunca descia a `low` em hosts com nomes de ferramenta namespaceados.** A âncora de início de palavra em `SIMPLE_TOOL_RE` fazia `ops_bash`/`ops_grep`/`ops_read_files` contarem como não simples → `simpleRatio()` sempre 0 → sempre `high`. Um novo `TOOL_NAMESPACE_RE` remove o prefixo `ops_` antes do julgamento (o prefixo é da família dsh-ops, não uma embalagem universal do host).
- **Nomes de ferramentas de comando faltando**: a tabela embutida ganhou `shell`/`pwsh`/`cmd`/`sh` (antes só `bash`/`terminal`), para que chamadas curtas em hosts cujo ponto de entrada é `shell`/`pwsh` também desçam a `low`.

### Adicionado
- **`Config.simpleTools` (lista de acrescento, volatile com efeito a quente)**: nomes separados por vírgula/espaço entram no julgamento embutido, também com remoção de `ops_` antes da fronteira de palavra; a área de configurações ganhou uma caixa de texto acima do bloco "capacidades do modelo"; `card.simpleTools`/`card.simpleToolsHint` em 9 idiomas.

### Testes
- 5 casos novos: shell/pwsh→low, ops_shell→low, nome acrescentado pela configuração→low, ops_web_fetch após remoção→low, fronteira de palavra ainda protege `codebase_reader` (fica high). Total 234/234.

## [4.4.9] — 2026-10-28 (declaração de entrada PDF por modelo + enumeração rc.4)

### Adicionado
- **Caixa "Entrada de PDF" no cartão de capacidades**: `toggleModelModality` ampliou para `video|audio|pdf`; a declaração é gravada em `extraInputs` da camada de transporte assumida (a enumeração `input` da linha de modelo do host só aceita text|image); marcada, aquele `provider/model` recebe PDFs e renderiza blocos de conteúdo `file` nativos do OpenAI a partir dos anexos; a linha de capacidade ganhou o selo PDF; `card.capabilities.pdf` em 9 idiomas.

### Metadados
- `engines.dsh` e todos os peers dsh acrescentam `0.2.1-rc.4` à mesma enumeração (15 termos; o plano de contrato do host rc.3↔rc.4 tem diff zero, bump apenas declarativo).

## [4.4.8] — 2026-10-27 (correção da concordância entre as duas listas)

### Corrigido
- O 4.4.7 mudou apenas o `package.json`: o campo `version` do `dsh.plugin.json` ainda dizia 4.4.6 (escrito por uma sessão paralela). O 4.4.8 unifica ambos em `4.4.8`; `engines.dsh`, `peerDependencies` e o comportamento de execução são idênticos aos do 4.4.7 — só o alinhamento de metadados.

## [4.4.7] — 2026-10-27 (o nível auto funciona de verdade: amostragem por projeção + corte do eco do host — issue #6)

### Corrigido
- `auto` não cai mais sempre em `low`. A amostragem de ferramentas lia `agent.session.events`, uma propriedade de array que só existe no host 0.1.0-rc.8 (removida desde 0.1.2-rc.1); em 13 das 14 linhas suportadas a amostra ficava `[]` e `high` / `max` eram estruturalmente inalcançáveis. Agora o plugin registra a unidade de projeção `tlAutoSchedule`: `apply` recolhe os `tool/call` num anel de capacidade 8 e o host lê em O(1) via `stateOf()`; a primeira leitura recolhe todo o registro em memória, então sessões retomadas/forkeadas ficam completas. O host proíbe novas chamadas de produção a `eventAt` / `snapshotEvents` / `ownEvents`, por isso não se volta aos leitores antigos.
- `auto` não age mais só na primeira requisição de uma sessão. A cada turno o host reutiliza o `reasoningEffort` do `request/header` anterior (a injeção do próprio plugin) como semente; a implementação antiga tomava isso por escolha manual e a deixava passar, congelando o nível na primeira decisão. Agora a mesma projeção recolhe os eventos `model/selection` para obter a escolha explícita da sessão (o seu único escritor de produção é o comando de seleção do usuário; a injeção do plugin nunca escreve). A semente não decide mais entre manual e auto — o eco desaparece por construção, sem memorizar a última injeção, e continua correto após resume / fork / compactação.
- Prioridade da origem do nível: escolha explícita da sessão > configuração `level` do plugin > planejador.
- Limite conhecido do 0.1.0-rc.8: a superfície de registro daquela linha não tem `stateOf` (contrato plano antigo); o registro da projeção é pulado e a leitura antiga de `session.events` continua — a amostragem funciona, a correção do eco não.

### Testes
- 215/215: novos casos para o reducer da projeção, a barreira de capacidade e a tolerância do esquema; `session-events.spec.ts` virou uma **fixture isca** (o mesmo objeto oferece um array `events` obsoleto e o estado da projeção, e a asserção exige a projeção), mais uma simulação do eco em quatro turnos (primeiro `low` → carga pesada `max` → a escolha explícita segura o planejador).

## [4.4.5] — 2026-10-21 (a dobra de alternância é exclusiva de openai-completions — issue #9)

### Corrigido
- Uma rota **Responses / Anthropic** assumida cujo modelo traz uma tabela `reasoningEfforts` multinível não colapsa mais o seletor para Off/On. A dobra vive em `piAiPosture.thinkingOn`, que antes só olhava "tabela presente + rota na lista de assunção"; mas a razão física da dobra (o pi-ai rejeitar uma string `reasoning_effort` fora dos seus sete níveis fixos) é uma preocupação exclusiva de completions, e numa rota não-completions a saída `supportsReasoningEffort` nem pode ser escrita (4.4.4). `piAiPosture` passa a exigir também que o `api` da rota seja `openai-completions` (ou ausente, o padrão do pi-ai) — o mesmo predicado do `completionsCompatConfigurable` do cartão. Uma única barreira corrige tanto o anúncio no seletor (`advertiseModelCapability`) quanto a remoção `toggleOnly` em tempo de requisição (`capabilityResolver`): uma rota Responses assumida mantém de ponta a ponta os seus níveis nativos de `thinkingLevelMap`.

### Testes
- 186/186: matriz nova de barreira de protocolo em `piAiPosture` — rotas Responses/Anthropic assumidas NÃO dobram, completions (e `api` ausente) continuam dobrando, Responses fora da assunção nunca dobra, e uma linha completions que declara `supportsReasoningEffort` não é toggle-only.

## [4.4.4] — 2026-10-21 (campos compat para fora da tela, mapa de effort aberto em toda parte — issues #7 #8)

### Alterado
- Os dois interruptores exclusivos de openai-completions (`支持 think effort` / `思考格式`) deixaram de ser RENDERIZADOS em outros protocolos — antes apareciam cinzentos com uma nota longa. Só surgem quando o modelo é **declarado de thinking** E a rota fala `openai-completions`; fora isso estão ausentes do DOM. O thinking em si segue vivo em todo protocolo (`reasoningEfforts`, neutro quanto ao protocolo).
- **O editor de valores wire por nível deixou de ficar preso em completions** (issue #8). Ele edita `reasoningEfforts` — a tabela que o host converte no `thinkingLevelMap` do pi-ai, lida por todos os protocolos (orçamento de thinking da Anthropic, reasoning effort do Responses, string reasoning_effort das completions). Um modelo de thinking abre a grade em qualquer protocolo; só a guarda de estilo toggle das completions (exige `支持 think effort` antes de oferecer níveis de effort) permanece ali.
- `toggleEffortCapable` recusa de imediato uma entrada não-completions, para que nenhum caminho de código escreva o campo onde o host o rejeitaria.

### Corrigido
- `applyDraft` escrevia `compat.supportsReasoningEffort: true` automaticamente sempre que um nível não-toggle era marcado. Numa rota Responses/Anthropic esse campo faz o host **rejeitar o payload inteiro de providers** — um clique e o salvamento todo se perdia. O efeito colateral agora é exclusivo de completions.

### Adicionado
- Auditoria de resíduos (`staleThinkingCompatFields`) + limpeza em um clique (`stripThinkingCompat`): uma linha de modelo que ainda carregue `thinkingFormat` / `supportsReasoningEffort` de uma versão anterior (ou de um `cordis.yml` editado à mão) mostra quais campos bloqueiam a próxima escrita, com varredura por linha e por cartão. Campos compat vizinhos sobrevivem; um objeto `compat` esvaziado é removido em vez de ficar como `{}`.

### Testes
- 180/180: a matriz de renderização do issue #7 (ausente vs presente por protocolo × thinking), a matriz do issue #8 de grade em todo protocolo, a regressão da bomba do gravador de escritas (verificada por mutação: remover a guarda a quebra), a auditoria e os casos de vizinho/objeto vazio do escritor de limpeza.

## [4.4.3] — 2026-10-21 (o thinking continua configurável em todo protocolo — issue #6)

### Corrigido
- Cartão de capacidades: a caixa 思考 (thinking) volta a ser selecionável em todos os protocolos de wire, não só em openai-completions. Ela escreve o `reasoningEfforts` neutro quanto ao protocolo (o host llm-pi-ai → `reasoning: true` + `thinkingLevelMap`, que o pi-ai mapeia nativamente por protocolo), então o pré-requisito que o seletor de effort precisa retorna também às rotas Responses/Anthropic.
- Uma declaração de thinking não-completions não arrasta mais o `thinkingFormat` exclusivo de completions: o autocompletado do formato qwen é pulado ali (uma gravação em nível de modelo fazia o host rejeitar o payload inteiro de providers), e `off` mantém um token wire real (`none`) para que o nível Off continue selecionável em vez de ser marcado como não suportado pelo pi-ai.
- `thinkingFormat` / 支持 think effort seguem barreirados a openai-completions — esses dois SÃO campos compat exclusivos de completions — e a nota do cartão agora diz exatamente isso, em vez de afirmar que o thinking em si não é configurável.
- Sincronização compat no host: um `api` explicitamente não-completions deixou de ser tratado como gateway openai-completions personalizado (a heurística de baseURL só se aplica quando nenhum protocolo é nomeado), então o auto-sync não pode escrever compat de completions numa rota Responses/Anthropic.

### Testes
- 168/168: nova matriz de protocolo do `writeThinkingRow` (completions / responses / anthropic), o alias 4.4.x e a guarda de gateway do sync.

## [4.4.2] — 2026-10-19 (interruptores do cartão, explicação visível — retorno de usuários)

- As caixas do cartão de configurações (Ativar / Assunção mestre / Permitir rebaixamento / Permitir elevação / Assunção da interface de modelo) viraram pill toggles horizontais otimistas — o clique inverte na hora, uma escrita recusada faz rollback.
- A linha de assunção da interface de modelo ganhou uma explicação VISÍVEL sob a linha (antes só tooltip): o que ON substitui, o que OFF conserva e que a máscara auto chega de qualquer forma.

## [4.4.1] — 2026-10-19 (cão de guarda do assento takeoverUi — relatório de campo do desktop)

- Corrigido: `takeoverUi` agora se aplica ao vivo, sem recarregar. A barreira 4.4.0 lia o espelho de configurações uma única vez no inject do assento; no desktop real o callback do assento de modelo pode disparar ANTES do vínculo do canal de configurações ou do recolhimento do espelho, e com o interruptor ligado o painel nunca se assentava (e o pop-up oficial ficava sem os selos de contexto). O assentamento virou um cão de guarda reavaliado sempre que a cintura de configurações se vincula ou qualquer mudança chega: ligar assenta o ModelPanel — desligar devolve o ModelSelect nativo, imediatamente.
- Cartão: a linha takeoverUi passou a ser um pill toggle horizontal otimista (inverte no clique, faz rollback se a escrita for recusada).

## [4.4.0] — 2026-10-19 (lote de issues #2 #3 #4 #5)

### Corrigido
- Cartão de capacidades (#2): provedores cujo `api` não é `openai-completions` (família openai-responses, anthropic-messages …) agora acinzentam Thinking / Supports-effort / thinkingFormat com uma nota explicativa, em vez de fazer a escrita inteira dos providers falhar com um genérico `card.writeError` — a barreira compat Responses do host nunca oferece esses campos em nível de modelo.
- Custo de carregamento (#4): o anúncio do `resolveModel` voltou a ser idempotente — `llm/adapters-updated` repetidos EMPILHAVAM wrappers, cada um relendo a configuração inteira (O(modelos × wrappers) na página de modelos). A leitura é cacheada por geração (invalidada em commits de configuração) e a re-verificação do espelho de assunção só roda para namespaces que podem mover o julgamento. Nota: o bump de stateVersion da projeção feito no 4.3.0 mantém um RE-FOLD histórico ÚNICO no primeiro carregamento após a atualização.
- Selo de effort (#5): com o nível em `auto`, o selo do painel continua mostrando **Auto** e rebaixa o nível resolvido do passo a uma dica secundária `→ <level>`, em vez de ser sobrescrito pelo valor wire do planejador.

### Adicionado
- Configuração `takeoverUi` (padrão OFF, #3/#4): o compositor mantém o pop-up oficial de modelo — busca nativa e carregamento, e a máscara `auto` chega mesmo assim pelo anúncio do lado do servidor; a edição de contexto dos modelos oficiais vive no cartão de configurações enquanto estiver OFF. Ligue para restaurar a assunção do ModelPanel. Recarregue a página após mudar.
- Busca no pop-up do ModelPanel (#3): exibida a partir de cinco modelos, espelhando a regra do seletor nativo.
## 4.3.3 (2026-10-18)

- Catálogo de preços no ar: 41 entradas no price-catalog (30 nacionais em CNY com pares de pico/fora de pico e tarifas planas + 11 estrangeiras em USD: Claude 4 direto da página oficial, GPT 4/Gemini 3 cruzando documentação de cobrança × anúncios); modelos injetados lançam o preço real do catálogo, fora do catálogo cai no preço típico de estimate marcado "não calibrado · só referência" (chamadas do nível gratuito = gasto/sensa de cota convertida ao preço padrão).
- stateVersion do lançamento de credenciais 2→3; seletor de cinco vias de preço fora do catálogo no cartão de configurações (todos os idiomas); CATALOG_VERSION 1→2; golden 150/150 verde.

## 4.3.2 (2026-10-18)

- hosts: acrescentada a enumeração declarativa 0.2.1-rc.2 (cada peer dsh npm-verificado ao vivo em rc.2; não toca o provedor ctx.web nem o slot model.label, zero mudança de código, release só de metadados; célula rc.2 da fazenda em espera).

## [4.3.1] — 2026-10-17 (enumeração de hosts: +0.2.1-rc.1)

### Corrigido
- `engines.dsh` e os sete peers `@deepseek-ai/dsh-*` acrescentam `|| 0.2.1-rc.1` (enumeração exata de 12 termos, sem intervalos nem carets), e a barreira de compatibilidade do host passa a aceitar DSH `0.2.1-rc.1`.
- O `engines.dsh` do `dsh.plugin.json` traz a mesma enumeração de 12 termos — a barreira só lê o `package.json`, mas as duas listas não podem divergir.
- devDependencies `@deepseek-ai/dsh-client-*` movidos de 0.2.0-rc.1 para 0.2.1-rc.1; build e suíte completa (140 testes) verificados contra a linha-alvo.
- As declarações de compatibilidade dos README (en/zh/ja/ko/de/es/fr/it/ru) sincronizadas com a enumeração. Sem mudança de comportamento nesta release.

## [4.3.0] — 2026-10-17

### Adicionado
- Catálogo de preços (src/price-catalog.ts): 29 entradas de modelo × região — DeepSeek V4.1-Flash / V4-Flash / V4-Pro carregam os pares oficiais de pico e fora de pico (pico de Pequim 09-12 e 14-18, grade vigente desde 2026-08-17); GLM / Kimi / Qwen / Doubao / MiniMax / Ernie carregam tarifas planas em CNY. Cada entrada cobra três lacunas por milhão de tokens — entrada sem cache / entrada com acerto de cache / saída — e traz anotações asOf + source. As lacunas estrangeiras (USD) existem estruturalmente mas ficam intencionalmente vazias até as páginas oficiais poderem ser reverificadas: nada de números inventados.
- Configuração `defaultPricing` (cn / global / custom / off, padrão off): modelos fora do catálogo deixam de ser estimados às tarifas do Flash — aparecem sem preço.
- Tabela de correção de feriados e dias compensados do Conselho de Estado 2026 (39 linhas, proveniência compartilhada com o dsh-session-guard): fins de semana de trabalho compensado contam como dias úteis para a barreira de pico; feriados legais são vale o dia inteiro. Anos desconhecidos degradam para a regra de fim de semana natural.

### Alterado
- Projeção stateVersion 1 → 2: cada amostra de uso guarda um recibo de cobrança liquidado no momento do recolhimento; a substituição no mesmo passo subtrai os valores registrados (sem recomputação de tarifas mistas, sem ledger negativo); os totais de sessão/turno são separados por moeda. Após atualizar, os checkpoints antigos são descartados e re-colhidos contra o catálogo ATUAL — o total histórico desloca uma vez; depois disso, edições de preço só afetam amostras futuras.
- Popover de cobrança: símbolos cientes de moeda (¥ / $, moeda desconhecida cai no código ISO), selos honestos para faixas planas/nulas, "preço de <modelo>" derivado do rótulo do catálogo, e sessões de moeda mista listam linhas por moeda em vez de uma soma falsa.
- `matchedModel` / `unitPricePerM` deprecados (escrita dupla por mais uma geração).

### Corrigido
- Normalização da forma de `settings.describe()`: array em processo vs envelope RPC `{namespaces:[...]}` — formas exóticas agora leem como ausentes em vez de lançar numa catch engolida (a classe de falha de congelamento silencioso).
- O registro da projeção é protegido por try/catch: uma unidade de cobrança quebrada esconde a seção de cobrança em vez de envenenar a fibra inteira do plugin ou o histórico de sessões frias.

## [4.2.1] — 2026-10-12

### Alterado — promoção a estável (sem mudanças de código desde 4.2.0-beta.29)

- **A linha 4.2.0-beta se forma em estável.** Esta release traz o arco beta.18 → beta.29: seção de família entre versões (`installLegacySection`, beta.26), quebra de linha da tira de abas da família (beta.27), aposentadoria do cartão legacy da página de plugins (beta.28), correção de histórico de sessão fria no 0.1.0-rc.8 (beta.29). `engines.dsh` mantém a enumeração completa de 11 linhas (0.1.0-rc.8 → 0.2.0-rc.2), então o canal npm `latest` agora aponta para uma release estável multilinha.
- **Deriva dos dois manifestos corrigida:** o `dsh.plugin.json` ainda dizia `4.2.0-beta.28` (o bump beta.29 o esqueceu); os dois manifestos agora leem 4.2.1.

## [4.2.0-beta.29] — 2026-10-08

### Corrigido
- **Assassino do histórico frio no 0.1.0-rc.8**: no 0.1.0-rc.8 o registro `sessionProjections` do host é a ÚNICA linha de contrato plano (`def.schema.parse(def.view(state))`); todas as linhas seguintes (0.1.1+) consomem a forma `stateSchema`/`wire` que a unidade de cobrança registra. No 0.1.0 a unidade chegava com `schema === undefined`, então TODA leitura de histórico frio lançava "Cannot read properties of undefined (reading 'parse')" — uma unidade sem schema envenenava o histórico do workspace inteiro (reprodução de cinco células em 2026-10-08). O registro agora espelha `wire.viewSchema`/`wire.view` nas chaves planas `schema`/`view`; as duas gerações do registro recebem o que esperam e as linhas mais novas não são afetadas.

## [4.2.0-beta.28] — 2026-10-08

### Removido
- **O cartão de item legacy da página de plugins (`settings.plugin.item`) é aposentado.** Ele duplicava o cartão da aba de família na página de plugins ≤0.1.5; a aba de família 起子插件设置 é agora a única superfície de configurações em toda geração do host (alinhado com session-guard / free-search / browser-cdp / preset-manager).

## [4.2.0-beta.27] — 2026-10-08

### Corrigido
- **A tira de abas da família quebra linha na largura do contêiner** em vez de transbordar numa barra de rolagem horizontal: o tablist abandona `flexWrap: 'nowrap'` + `overflowX: 'auto'` (o desenho de linha única herdado de 063d9fd) por `wrap` puro, e os botões perdem `flex: 0 0 auto`. Com sete ou mais abas contribuidoras (thinking levels, session guard, search index, CDP, MCP registry, steward, input traffic — perm-gate e context-compression entrando em releases compat), a tira agora flui para as linhas seguintes em toda geração de host ≤0.1.7.

## [4.2.0-beta.26] — 2026-10-08

### Adicionado — seção de família entre versões (beta.18 → beta.26)

- **Seção de configurações legacy do lado do servidor (`installLegacySection`).** A seção de família (起子插件设置) agora registra o namespace `thinking-levels` no servidor para renderizar com dados reais em hosts ≤0.1.7, através das três formas geracionais (`installSettingsSection` de nível de módulo, `installSection` de instância, loader-volatile no rc.1+), com um esquema `LegacyConfig` plano não volátil e uma base plana achatada (o registro legacy rejeita tanto nós voláteis quanto referências vivas — três bugs empilhados corrigidos entre beta.18 e beta.22).
- **Blindagem da eleição da seção de família (beta.26).** A fábrica `settings.section` recua quando já há uma entrada `dsh-family` assentada (superfície nativa do host ou um rival): exatamente um dono independentemente da ordem de registro. Acompanha a eleição de cessão diferida do dsh-session-guard 4.1.11 — shells ≤0.1.7 dão a cada seção de mesmo id a sua própria linha de navegação, então o registro duplo significava uma linha 起子插件设置 duplicada.
- **Correções de UI (beta.23 → beta.25).** A tira de abas da família se mantém numa única linha (rolagem horizontal; 8 abas contribuidoras já não órfanavam a última numa segunda linha); os controles de configurações seguem o tema escuro do shell (superfície semitransparente em vez de branco fixo, `colorScheme` a partir de uma sonda de luminância do body); a declaração de children tolera um conflito pousando sem ele; os logs de depuração de ciclo de vida ficam em produção.

## [Unreleased]

### Adicionado — deslizador de effort (runner de baleia-nerd) — 4.1.0

- **O `<select>` de effort por linha do painel de modelo virou um deslizador de segmentos.** Clique no selo de effort de uma linha e um deslizador de largura total se expande sob ela: o número de paradas se adapta aos efforts anunciados do modelo, `auto` fica preso à esquerda (depois `off`/`on`, o gradiente de força, valores wire de gateway desconhecidos por último), o polegar segue o ponteiro continuamente e encaixa ao soltar (uma escrita de rota por gesto), ←/→/Home/End passo a passo, e o antigo reset "Padrão do provedor" sobrevive como o botão ↺ da linha do deslizador.
- **Polegar runner de baleia-nerd nas linhas DeepSeek.** Rotas DeepSeek oficiais e modelos de gateway cujo id/nome diz deepseek rodam uma tira de corrida lateral de 8 quadros como polegar (pingue-pongue, 720 ms por direção em repouso / 420 ms ao arrastar, congelada sob `prefers-reduced-motion`); todo outro modelo mantém um botão branco simples. Arte comunitária da baleia-nerd obtida de HanaAyane/dsh-reasoning-effort (`assets/chibi-runner-strip.png`); regenere com `python tools/whale-mascot.py`.
- **Helpers puros do deslizador** exportados de `thinking-level` (`orderEffortsForSlider`, `nearestEffortStopIndex`) com cobertura unitária.

## [4.0.0] — 2026-09-29

### Alterado — compatibilidade com DSH 0.2.0-rc

- **Barreira de peer reorientada ao segmento 0.2.0-rc.** As sete declarações de peer `@deepseek-ai/dsh-*` e o `engines.dsh` agora leem `>=0.2.0-rc.1 <0.2.1-0` (substituindo `>=0.1.7-rc.1 <0.1.8-0`). Hosts em 0.1.7-rc.1 a < 0.2.0 ficam na linha 3.x (dist-tag npm `dsh-0.1.7`, 3.4.3); hosts abaixo de 0.1.7-rc.1 ficam no 3.0.2.
- **devDependencies movidos à linha 0.2.0** — `dsh-client-locale` / `dsh-client-ui-renderer` / `dsh-client-ui-settings` / `dsh-client-ui-slots` / `dsh-client-store` → `0.2.0-rc.1`, e `@deepseek-ai/cordis` → `^4.0.4` (exigido pelo peer `~4.0.4` dos pacotes cliente 0.2.0-rc.1) — para que typecheck / testes / build rodem contra os tipos reais do 0.2.0-rc.1.
- **Higiene de metadados:** versão e `engines.dsh` do `dsh.plugin.json` sincronizados a 4.0.0 e ao segmento 0.2.0-rc; `publishConfig.tag` → `dsh-0.2.0` com um script `release:4x` novo, para que uma publicação jamais sobrescreva as tags `dsh-0.1.7` / `latest`; os dois lockfiles (`package-lock.json` / `pnpm-lock.yaml`) regenerados contra a árvore 0.2.0.
- **Nenhuma mudança de código na metade do host nem do cliente.** Os pacotes que este plugin importa (`dsh-client-locale`, `dsh-client-store`, `dsh-client-ui-renderer`, `dsh-client-ui-settings`, `dsh-client-ui-slots`) mudam apenas a versão do pacote entre 0.1.7-rc.2 e 0.2.0-rc.1; as faces dos serviços `settings` / `llm` e o adaptador `llm-pi-ai` também ficam intactos. A suíte completa (lint / typecheck / 71 testes / build) passa sem mudanças contra 0.2.0-rc.1.

### Corrigido — entrada Plugins duplicada nas configurações — 2.0.0-beta.4

- **Removido o registro `settings.plugins.tab`.** O trabalho de compat 0.1.5 presumiu que o DSH 0.1.5 havia removido o assento `settings.plugin.item`, mas o 0.1.5-rc.2 liberado (e 0.1.6-alpha.1) ainda o declara no `ui-settings-plugins` como filho da aba Plugins configurável embutida. Com os dois assentos declarados, os dois registros disparavam e o plugin aparecia duas vezes em Configurações → Plugins: uma como cartão de item na lista configurável, outra como aba própria de nível superior. O cartão de item sozinho cobre todas as linhas suportadas, então o registro de aba saiu (junto com o thunk de rótulo `ctx.locale.bind`).

### Alterado — compatibilidade com DSH 0.1.5-rc — 2.0.0-beta.3

- **O cartão de configurações pega o novo assento 0.1.5.** O DSH 0.1.5 renomeou o assento do cartão de configurações de Plugins de `settings.plugin.item` para `settings.plugins.tab` (`id` = chave da aba, `order` e um `label` localizado pelo registrante). Os dois registros são barreirados por declaração via `ctx.slots.inject`, então o cartão monta em qualquer assento que o host em execução declarar — hosts 0.1.5+ ganham a aba, hosts 0.1.2–0.1.4 mantêm o cartão legado. O rótulo da aba é um thunk de leitura sobre `ctx.locale.bind(NS)`, seguindo trocas de locale.
- **Tipagem de `ctx.slots` restaurada.** O aumento `Context.slots` chegava transitivamente pelo pacote `dsh-client-runtime` (agora apagado); o 0.1.5 o moveu a `@deepseek-ai/dsh-client-ui-renderer/client`, que a metade cliente agora importa.
- **devDependencies fixados em 0.1.5-rc.2** e a suíte inteira (typecheck / lint / 65 testes / build) verificada contra aquela árvore. As APIs do lado do host (`settings.register/get/update`, `settings/document-updated`, `agent/request`) não mudaram no 0.1.5-rc.2 — nada no host precisou mudar.
- Verificado contra as superfícies de contrato do 0.1.5-rc.2 descompactadas do npm: `conversation.input.right`, `settingsScope.bind`, as sobrecargas de locale e a face do serviço de configurações estão todos preservados.
- **`lib/` é commitado no git.** O `package.json` publica `files: ["lib", …]` e aponta `main` / `types` / `exports` para `lib/`, mas o `.gitignore` ainda listava `lib/` — então uma instalação via GitHub (que não roda build) recebia um pacote sem ponto de entrada. Os artefatos compilados agora estão sob controle de versão, e um rebuild os reproduz byte a byte (sem diff de conteúdo, só o ruído de final de linha do `core.autocrlf`).
- **`engines.dsh` estreitado ao segmento que esta linha realmente implementa**: o `>=0.1.2-alpha.1 <0.2.0-0` anterior admitia hosts 0.1.2–0.1.4, onde a metade cliente não compila contra o assento de configurações de Plugins renomeado que esta linha registra. Agora é `>=0.1.5-alpha.1 <0.2.0-0` (e `node` estreitado a `^22.19.0 || >=24.0.0`, casando a toolchain). O `publishConfig` fixa `registry` + `tag: beta` para que um `npm publish` nu não possa nem resolver errado o espelho nem sobrescrever a linha estável `latest`, e o `pnpm-lock.yaml` é rastreado como parte do contrato de compatibilidade em vez de tratado como artefato local.
- **Um placeholder `allowBuilds` do pnpm não bloqueia mais instalações.** O `pnpm-workspace.yaml` carregava o stub literal do pnpm "set this to true or false", que abortava todo `pnpm install` com `ERR_PNPM_IGNORED_BUILDS`; agora lê `esbuild: true`.

### Alterado — o controle de contexto vive na linha do compositor — 2.0.0-beta.2

- **O controle rápido de janela de contexto voltou à barra de ferramentas do compositor** (`conversation.input.right`, ao lado do controle de modelo/effort). O cartão de modelo não é opção: o `ModelSelect` nativo chama `renderSlot` zero vezes e é dono do próprio pop-up, então o assento `conversation.input.model.section` declarado em `2.0.0-beta.1` não é renderizado por nenhum harness publicado — um plugin não consegue pôr uma linha dentro daquele cartão sozinho. `conversation.input.right` é um assento de lista com escopo de sessão que qualquer plugin pode ocupar, e é onde um controle de barra de ferramentas pertence.
- **A queda da entrada de slot continua corrigida.** A pílula antiga chamava um assento padrão como getter nu (`useSession()`) — todo assento de renderer é um hook seletor `useSyncExternalStoreWithSelector`, então a chamada lançava `TypeError: l is not a function` e derrubava a entrada inteira a cada render. O controle agora lê o modelo ativo por um seletor obrigatório.
- **A fonte do modelo é agnóstica de assento.** Ela prefere o assento `useTrajectory` da sessão (o ledger de requisições, DSH 0.1.2+) e cai para `useConversation` (`ConversationSnapshot.views.get('trajectory')`) em linhas de harness sem ele; um harness que não forneça nenhum dos assentos renderiza nada em vez de um controle morto.
- **O pop-up é uma linha de deslizador**: deslizador de presets (64K / 128K / 256K / 400K / 512K / 1M) escrevendo uma vez por gesto (soltar o ponteiro, soltar a tecla, blur), o valor confirmado, um editor de inteiro personalizado colapsado (`⋯`) e Limpar. A pílula mostra só o valor; a cópia `input.context.*` foi restaurada nos quatro dicionários.
- **Inalterado: o editor do cartão de configurações.** Os presets de janela de contexto por modelo, o inteiro personalizado e Limpar permanecem exatamente como estão, gravando nos mesmos namespaces `llm-pi-ai` / `llm-deepseek`.

### Quebra — só DSH v0.1.2+ (remoção do `dsh-client-runtime`) — 0.7.2-beta.1

- **`engines.dsh` agora é `>=0.1.2-alpha.1 <0.2.0-0`.** O `@deepseek-ai/dsh-client-runtime` foi apagado por inteiro em `0.1.2-alpha.1` (commit `be531688f3`); aquela release é a fronteira dura de segmento. A linha anterior do plugin (`0.7.1-beta.2` e anteriores) continua servindo DSH 0.1.0 / 0.1.1.
- **`ClientContext` se foi.** O `src/client/index.ts` agora importa `Context as ClientContext` de `@deepseek-ai/cordis`, como todo plugin cliente oficial. `@deepseek-ai/dsh-client-runtime` sai de `peerDependencies`, `peerDependenciesMeta` e `devDependencies`, deixando de bloquear a instalação.
- **`src/types/contracts.d.ts` perde o espelho ambiente `declare module '@deepseek-ai/dsh-client-runtime/client'`.** `SettingsScope` ganha os campos de instantâneo `base` / `user` / `revision` e `bind` aceita um `decode` opcional; o espelho `SlotsFace` fica (o `SlotRegistry` real de `@deepseek-ai/dsh-client-ui-renderer` o fornece em tempo de execução).
- **`dsh.client.inject` lista `@deepseek-ai/dsh-client-ui-renderer`**, o pacote que fornece o serviço `slots` em que este plugin registra.
- **Divisão de registro localizado por sobrecarga.** A forma em bloco `register(ns, dicts)` é tipada aos ids de locale embutidos (só `zh` / `en`), então os dicionários `ja` / `ko` publicados agora passam pela sobrecarga de locale único `register(ns, locale, dict)` e são descartados juntos. O comportamento não muda; a chamada agora passa no typecheck contra o pacote locale real.

### Removido
- **O ouvinte morto `agent/tool`.** O tratamento de tempo de relógio por ferramenta registrava um handler `ctx.on('agent/tool', …)` que mantinha um mapa `started` e logava `tool … took …ms`. O DSH não tem esse evento nem no 0.1.1-rc.2 nem no 0.1.2-rc.1 — o registro de eventos de escopo (`packages/core/scope/src/scoped-events.generated.ts`) lista doze eventos `agent/*` e `agent/tool` não é um deles —, então o handler nunca rodava e a linha de log nunca foi emitida. Removidos o listener, o mapa `started`, a varredura `pruneStale` e a constante `TOOL_AGE_LIMIT_MS`.
- **O planejador de effort não é afetado.** O reconhecimento de ferramentas é um *pull*, não um push: o waterfall `agent/request` chama `recentToolCalls(payload.agent)`, que lê os registros `tool/call` de `agent.session.events` e alimenta o `scheduleEffort`. Esse caminho tem testes próprios (`tests/session-events.spec.ts`, `tests/thinking-level.spec.ts`) e ficou intacto.

### Corrigido — linha principal renumerada para 2.x — 2.0.0-beta.1

- **O controle rápido de contexto quebrava o seu assento a cada render.** O `ContextQuick` chamava o assento padrão da sessão como getter nu (`useSession()`). Todo assento padrão de renderer é um *hook seletor* `useSyncExternalStoreWithSelector` vinculado por `bindSnapshotSelector` (`@deepseek-ai/dsh-client-ui-renderer`), então a chamada chegava ao shim com `selector === undefined` e lançava `TypeError: l is not a function`: a entrada `conversation.input.right` morria e a barreira de erro do assento a relançava em todo render. O mesmo componente também lia `session.views.get('trajectory')`, campo que `SessionSnapshot` nunca carregou (views pertencem ao `ConversationSnapshot`), então nem teria conseguido resolver um modelo sem a queda. O modelo ativo agora vem do assento `useTrajectory` da sessão por um seletor estável de nível de módulo sobre o ledger de requisições.
- **O controle se mudou para o cartão do menu de modelo.** Ele registra em `conversation.input.model.section` — a faixa que o ui-model-selection renderiza sob as linhas Model / Reasoning-effort — como uma linha de deslizador compacta: presets (64K / 128K / 256K / 400K / 512K / 1M) escrevendo uma vez por gesto, o valor confirmado, um editor de inteiro personalizado colapsado e Limpar. A cópia ficou no rótulo, no valor e em Limpar. A pílula da barra do compositor saiu; o cartão de configurações mantém o editor completo por modelo. A linha aparece em harnesses cujo assento de modelo declara aquele slot filho (adicionado em `packages/client/ui-model-selection`); em harnesses antigos o registro fica pendente e o cartão de configurações segue sendo o editor.
- **Versão do `dsh.plugin.json` sincronizada** com o `package.json`; o tarball 0.7.2-beta.1 o havia publicado como 0.7.1-beta.2.
- **Renumeramento de versão: a linha passa a ser o dígito major.** Esta linha principal (DSH 0.1.2+) vai para **2.x**, a linha legada (DSH < 0.1.2, branch `compat/dsh-0.1.1`) para **1.x**, para que uma versão instalada declare a que segmento de harness serve. As dist-tags npm mantêm seus papéis: `beta` = esta linha, `compat` = a linha legada. Nada mais muda para instalações existentes; um intervalo `0.7.x` simplesmente não casa com `2.x`, então a troca é explícita.
- **A linha do menu de modelo exige um harness que declare o assento.** `conversation.input.model.section` foi adicionado ao `packages/client/ui-model-selection` (declaração + chamada `renderSlot`); até uma release do harness carregá-lo, o registro fica pendente e o cartão de configurações segue sendo o editor. Nenhum harness publicado o tem hoje.

## [0.7.0] — 2026-09-09

> **Release estável.** A rota de curto-circuito é aposentada; todas as correções de gateway agora viajam pela superfície compat oficial `llm-pi-ai` (dsh ≥ **v0.1.0-rc.8**). Esta versão também inclui os presets de janela de contexto do rascunho 0.7.0 anterior.

### Adicionado
- **Presets multinível de janela de contexto** no editor de capacidades por modelo: botões `64K / 128K / 256K / 400K / 512K / 1M` mais uma entrada de inteiro personalizado e um botão de limpeza, gravados no `contextWindow` do modelo `llm-pi-ai` e consumidos ao vivo pelo harness (compactação / detecção de estouro de contexto / projeções de pressão de contexto) já na próxima requisição — sem reinício.
- Novo módulo puro `src/context-window.ts` (constantes de faixa `2000`–`1_000_000`, lista de presets, `formatContextWindow`, `validateContextWindow`) compartilhado pelo esquema de configuração, pelo cartão de configurações e pelos testes.
- Superfície de configuração: override `models[].contextWindow` aceito com validação de inteiro `2000`–`1000000` (falha ruidosa fora da faixa).
- Nova cópia `zh` / `en` / `ja` / `ko` para o controle de janela de contexto.
- Adicionado `dsh.plugin.json` com `engines.dsh: ">=0.1.0-rc.8"`.
- Adicionados `peerDependencies` para `dsh-client-runtime`, `dsh-client-locale`, `dsh-client-ui-settings`, `dsh-client-ui-slots` (todos opcionais).

### Removido
- **A ponte de assunção de curto-circuito**: o plugin não mantém mais a lista de assunção `llm-openai-completions` (`nextTakeoverSection` / `TakeoverSection` se foram). O plugin adaptador `dsh-llm-openai-completions` NÃO é necessário junto desta release e pode ficar desinstalado.

### Alterado
- **A ponte auto-compat foi reescrita sobre a superfície oficial** (`withOfficialCompatFixes`): para toda rota de gateway openai-completions personalizada que declare thinking, o sync agora escreve
  - em nível de rota `compat.supportsDeveloperRole: false` (prompt de sistema enviado como `system` — corrige o 400 `Unexpected message role` do vLLM/SGLang), e
  - em nível de modelo `compat.thinkingFormat: 'qwen-chat-template'` nas linhas de thinking de estilo toggle (sem suporte de effort em nível de linha), para que o pi-ai envie `chat_template_kwargs.enable_thinking` — servidores vLLM nus ignoram o `enable_thinking` de primeiro nível do formato `qwen` simples.
- O padrão de armazenamento segue o lado do host do dsh-thinking-effort: ler → transformação pura (identidade quando nada muda) → `settings.update('llm-pi-ai', …)` da seção inteira, de modo que o validador de esquema `llm-pi-ai` do dsh barre a escrita **onde ela é escrita**; um dsh anterior ao rc.8 rejeita o campo desconhecido e o sync loga e mantém a seção anterior. Valores explícitos de qualquer camada são respeitados e nunca sobrescritos.
- **O cartão de capacidades foi des-curto-circuitado**: o interruptor "assunção de curto-circuito" foi substituído por um interruptor por provedor **"o gateway rejeita a função developer"** (grava/limpa a bandeira de nível de rota; desmarcar restaura a herança). A barreira de lista de assunção saiu — os modelos de todo provedor llm-pi-ai são diretamente editáveis, em camadas progressivas: ① thinking + vision → ② suporte de effort (só modelos de thinking) → ③ editor wire de effort → ④ thinkingFormat → ⑤ janela de contexto. Ligar o thinking num modelo de estilo toggle autocompleta `thinkingFormat: 'qwen-chat-template'` (só quando ausente); habilitar effort o remove de novo.
- `declaresThinking` agora também examina `modelOverrides` (antes só `models[]`), então rotas só com modelOverrides são identificadas e corrigidas.
- A barreira de leitura da postura do adaptador (`takeoverOf` / `piAiPosture`) fica mas inerte: com o adaptador ausente produz a semântica nativa do pi-ai.
- O selo de contexto agora reutiliza o `formatContextWindow` compartilhado, então presets gravados exibem exatamente (p. ex. `256000` → `256K`, `1000000` → `1M`).

### Notas
- Requer dsh ≥ **v0.1.0-rc.8** para a superfície compat oficial. Em dsh mais antigo o esquema recusa os campos compat (falha ruidosa, sem configuração ruim silenciosa).
- A separação inline de `<think>` no lado da resposta continua sendo um assunto do gateway: um vLLM nu precisa de `--reasoning-parser qwen3`; o pi-ai (≤ 0.85.1) só analisa `reasoning_content` / `reasoning` / `reasoning_text`. `qwen-chat-template` não carrega `reasoning_effort` (os ramos de formato são mutuamente exclusivos) — os níveis de effort só ligam/desligam o `enable_thinking`. Paralelismo de verdade (chat_template_kwargs + reasoning_effort) exige uma mudança rio acima no pi-ai.
- Os materiais de verificação vivem no branch `check` (`check/CHECK.md`, `check/record-proxy.mjs`, `check/settings-route.example.yaml`); não fazem parte do pacote npm.

## [0.6.0] — 2026-02-?

### Adicionado
- **Oito níveis padrão** alinhados ao dsh-thinking-effort: `off / on / minimal / low / medium / high / xhigh / max` (mais a máscara `auto` do planejador). `on` é o interruptor de habilitar thinking, contido à força ao valor padrão do modelo (`high` ou o nível de thinking mais alto anunciado); `minimal` / `medium` / `xhigh` passam quando um gateway personalizado os anuncia e colapsam sobre `high` no adaptador oficial.
- **Mapeamento wire personalizado no cartão de configurações** (herdado do dsh-thinking-effort): cada nível pode ser marcado e receber o valor exato enviado ao gateway (p. ex. `high` → `ultra`); `off` vazio significa "não enviar". Armazenado como a tabela `reasoningEfforts` do modelo.
- **Reforma da apresentação do cartão** (herdada do dsh-thinking-effort): provedores agrupam seus modelos, cada linha de modelo mostra selos de texto/imagem/contexto, modelos expandem num editor por nível, uma caixa de busca filtra modelos e presets de um clique (estilo oficial DeepSeek / genérico) se aplicam a todo modelo de thinking.
- **Multilíngue**: dicionários japonês (`ja`) e coreano (`ko`), mais `README.ja.md` / `README.ko.md`, `INSTALL.{md,zh,ja,ko}.md` e `CHANGELOG.{md,ja,ko}.md`. Nota: o runtime de locale oficial do DSH ainda expõe só `zh` / `en`, então selecionar `ja` / `ko` exige um fork do DSH (veja a nota de compatibilidade do README).

### Alterado
- A superfície de configuração `level` aceita os nove valores completos (`off | on | minimal | low | medium | high | xhigh | max | auto`).
- O override `models[].efforts` aceita os níveis estendidos.
- O renderizador do cartão foi refactorado; os editores de capacidades agora usam um rascunho de wire em etapas com um botão explícito **Aplicar níveis** em vez de confirmar cada clique de caixa.

### Corrigido
- Helper `effortLevelsOf` não usado removido; aviso de lint do parâmetro sem uso `_N` silenciado.

## [0.5.2] — 2026-02-?

### Adicionado
- **Assunção automática do `dsh-llm-openai-completions`**: provedores que são gateways openai-completions personalizados (`api: openai-completions` ou baseURL não oficial) **e** declaram uma tabela `reasoningEfforts` em qualquer modelo são mesclados em `llm-openai-completions.providers` com `enabled: true`. Roda ao iniciar o plugin, em `llm/adapters-updated` e em mudanças de configurações; acoplamento brando (pula a escrita quando o namespace não está registrado).

## [0.5.1] — 2026-02-?

### Adicionado
- Cartão de editor de capacidades por modelo: vision / thinking / suporte de effort / níveis de effort / formato de thinking para todo modelo de provedor `llm-pi-ai` personalizado, gravado direto no namespace de configurações `llm-pi-ai` (sem mudanças em pacotes oficiais).

## [0.5.0] — 2026-02-?

### Adicionado
- Guarda consciente do modelo: nunca enviar `reasoning_effort` a um modelo que não o anuncia (rotas openai-completions personalizadas como o Qwen3.6 têm o campo removido).
- Passagem de `low` em dsh rc.7+; adaptadores da era rc.6 podem anunciar `low` via um override `models` confirmado pelo configurador.
- Seção de configuração `models` (`provider/model` → `vision` / `thinking` / `efforts`).

## [0.4.1] — 2026-02-?

### Corrigido
- O wrapper `resolveModel` do adaptador agora é reexecutado em `llm/adapters-updated`, então a máscara `Auto` aparece mesmo quando os adaptadores se registram depois do apply do plugin.

## [0.4.0] — 2026-02-?

### Alterado
- Removida a dependência de valor de `@deepseek-ai/dsh-settings`; o registro de configurações passa pelo serviço `settings` do cordis (equivalente local do `installSettingsSection`).
- O registro do cartão fornece `id` e `key`, para funcionar tanto nas declarações de assento por chave (CLI) quanto por lista (DSH Desktop).

## [0.3.0] — 2026-02-?

### Adicionado
- `Auto` no seletor de modelo (máscara): injetado nos efforts do `resolveModel` do adaptador; o plugin programa `low` / `high` / `max` por passo através do waterfall `agent/request` (registrado com `prepend` para que a montagem de seleção de modelo da sessão não possa sobrescrevê-lo).

## [0.2.1] — 2026-02-?

### Corrigido
- Adicionado `exports["./client"]` para que o carregador de módulos cliente do dsh descubra o bundle de cliente.

## [0.2.0] — 2026-02-?

### Adicionado
- Primeiro cartão de configurações de cliente (seletor de nível + interruptores do planejador).

## [0.1.1] — 2026-02-?

### Corrigido
- Publique o `lib/` compilado em vez dos fontes TS cruas (o Node 22 proíbe o type-stripping de `.ts` sob `node_modules`).

## [0.1.0] — 2026-02-?

### Adicionado
- Versão inicial: injeção de um effort de raciocínio fixo no waterfall `agent/request`.
