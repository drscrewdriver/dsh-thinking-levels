# dsh-thinking-levels

**Control del nivel de razonamiento (`reasoning_effort`) por ronda para [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness): elige `Auto` (una máscara) en el selector de modelo de la sesión y el plugin programa `low` / `high` / `max` a partir del historial reciente de llamadas a herramientas antes de enviar el effort a la API — o fija manualmente un nivel wire (el nivel que realmente se envía a la API: `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`). Las rondas de herramientas baratas siguen siendo baratas; el trabajo pesado nunca se queda sin razonamiento.**

- [README en español](./README.es.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [Guía de instalación en español](./INSTALL.es.md)
- [Installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [Changelog en español](./CHANGELOG.es.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

> **v0.7.0-beta.1 (2026-09-06): la vía de cortocircuito se retira.** Esta versión ya no depende de `dsh-llm-openai-completions` — las correcciones para pasarelas personalizadas viajan por la superficie compat oficial `llm-pi-ai` (requiere **dsh ≥ v0.1.2-alpha.1**); el plugin adaptador debe permanecer desinstalado. Consulta el [CHANGELOG](./CHANGELOG.md).

> **▼ Versiones de DSH admitidas**
>
> Esta versión (4.0.0) admite únicamente **DSH v0.2.0-rc.1 a < 0.2.1**.
>
> | Versión de DSH | Estado | Notas |
> | --- | --- | --- |
> | ≥ 0.2.0-rc.1 | ✅ Admitida | Esta versión (4.0.x): la misma superficie declarativa de ajustes (campos de esquema `.volatile()` renderizados por el host; lecturas/escrituras entre plugins a través del servicio `configForms`), con el gate de peer reorientado al segmento 0.2.0-rc |
> | ≥ 0.1.7-rc.1 a < 0.2.0 | ✅ Admitida | Usa la línea 3.x (3.4.3, dist-tag npm `dsh-0.1.7`): ajustes declarativos — el host renderiza el formulario Plugins a partir de los campos de esquema `.volatile()` del plugin; las lecturas/escrituras entre plugins pasan por el servicio `configForms` |
> | < 0.1.7-rc.1 | ⚠️ No admitida | DSH 0.1.7 eliminó el registro imperativo de ajustes y el asiento de tarjeta por plugin del que dependían las líneas anteriores (3.0.x y previas) — quédate en el plugin 3.0.2 para hosts 0.1.2–0.1.6. |
>
> La frontera es `0.1.7-rc.1`, donde DSH eliminó el registro imperativo de ajustes (`settings.register` / `installSettingsSection`) y el servicio cliente `settingsScope`. Desde esa frontera, los campos de configuración ajustables en tiempo de ejecución se marcan `.volatile()` en el esquema schemastery, el host genera el formulario de ajustes solo a partir de ese esquema (sin llamada de registro, sin tarjeta de ajustes en el cliente) y el plugin lee los valores en vivo en cada solicitud, guiado por `loader/volatile-update`. Las líneas 3.1.x–3.4.x apuntan a la superficie declarativa de 0.1.7; la línea 4.0.x es la misma superficie reorientada al segmento 0.2.0-rc.

> **Política de rangos de versión:** cada línea de compatibilidad fija su host estrechamente en su propio segmento. Las líneas destinadas a hosts 0.1.x siguen `>=0.1.x-rc.1 <0.1.(x+1)-0` (3.1.x: `>=0.1.7-rc.1 <0.1.8-0`; 3.0.x: `>=0.1.5-alpha.1 <0.1.6-0`; 2.0.x: `>=0.1.2-alpha.1 <0.1.3-0`; 1.0.0-beta: `>=0.1.0-rc.8 <0.1.2-alpha.1`); las líneas destinadas al segmento 0.2.x siguen `>=0.2.0-rc.1 <0.2.1-0` (4.0.x: `>=0.2.0-rc.1 <0.2.1-0`). Ninguna línea declara jamás un límite superior abierto, así un resolutor de compatibilidad nunca puede emparejar una línea de plugin con un segmento de host más reciente para el que no fue construida. Las versiones 0.4.0–0.6.0 no llevaban ninguna declaración peer de dsh y son, en la práctica, sin tipado de compatibilidad — no las instales.

> **Nota de compatibilidad:** la versión `0.6.0` incluye diccionarios y entradas de selector en japonés (`ja`) y coreano (`ko`), pero las versiones oficiales actuales de DSH solo exponen `zh` y `en` a través de `LocaleRuntime`. En un DSH de fábrica, seleccionar `ja` o `ko` falla con `locale "<id>" is not registered`. Estos idiomas funcionarán cuando el DSH oficial añada los identificadores de locale correspondientes. Los usuarios avanzados pueden mantener un fork de DSH que actualice `packages/client/locale/src/locale-settings.ts` (`LOCALE_IDS`) y `packages/client/locale/src/client/index.ts` (etiquetas de `LOCALES`), junto con los diccionarios y pruebas de núcleo correspondientes, y luego recompilar y ejecutar el DSH bifurcado. Cambiar solo este plugin no puede extender la lista global de locales de DSH.

En una cadena de herramientas de varios pasos, el modelo vuelve a pensar antes de **cada** llamada a una herramienta — y ese pensamiento domina el tiempo de reloj (una tarea de agente de 50 pasos puede gastar minutos razonando entre herramientas). `dsh-thinking-levels` se engancha al waterfall `agent/request` que dsh vuelve a resolver en cada paso (registrado con `prepend` para que el ensamblado de selección de modelo de la sesión no pueda sobrescribir su decisión) e inyecta un nivel de razonamiento en la siguiente solicitud al modelo.

## Vista previa

Capturas de pantalla de la interfaz en vivo (dsh web):

<figure>
  <img width="460" alt="Desplegable Auto del selector de modelo inyectado por el plugin: niveles Off / Low / High / Max / Auto, High seleccionado actualmente, Auto resaltado — Auto es una máscara, el plugin programa low/high/max por paso a partir del historial de herramientas." src="assets/官方模型的自动级别调整.png" />
  <figcaption>El selector de modelo nativo gana <strong>Auto</strong> — elígelos y el plugin programa low/high/max por paso en lugar de un nivel wire fijo.</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="Ajustes del nivel de razonamiento (se muestra la tarjeta 3.0.x): nivel predeterminado (programación auto), interruptores habilitar / permitir-descenso / permitir-ascenso, tabla de capacidades de modelos del proveedor personalizado llm-pi-ai con el editor progresivo por modelo y presets de aplicar-a-todos (Off/High/Max estilo oficial DeepSeek, Off/Low/Medium/High genérico)." src="assets/自动思考级别配置.png" />
  <figcaption>Ajustes del nivel de razonamiento, tarjeta 3.0.x (captura conservada como referencia). Desde 3.1.0 / DSH 0.1.7, el nivel y los interruptores del planificador se renderizan como un formulario declarativo generado por el host; la tarjeta personalizada y su editor de capacidades llm-pi-ai se eliminaron junto con el asiento retirado.</figcaption>
</figure>

<figure>
  <img style="max-width:100%" alt="Editor de capacidades por modelo para un modelo openai-completions personalizado (local-35b / Qwen3.6-35B-A3B), tal como se enviaba en la tarjeta de ajustes 3.0.x: modelo de razonamiento y vision activados, soporte de think effort desactivado, formato de razonamiento qwen-chat-template (autocompletado); sin interruptor de takeover — la bandera compat oficial vive en la fila del proveedor; presets de límite de ventana de contexto 64K/128K/256K/400K/512K/1M con entrada personalizada." src="assets/自定义模型的思考接管-短路-上下文窗口限制.png" />
  <figcaption>Tarjeta de capacidades por modelo, 3.0.x (captura conservada como referencia). Desde 3.1.0 / DSH 0.1.7, el editor de capacidades ya no se envía; edita las capacidades de los modelos `llm-pi-ai` mediante los ajustes oficiales de modelos.</figcaption>
</figure>

## Niveles

| Nivel | Significado | Dónde |
|---|---|---|
| `off` | razonamiento desactivado (solo manual — nunca se elige automáticamente) | selector de modelo / nivel predeterminado |
| `on` | razonamiento activado (solo modelos de tipo toggle): envía `enable_thinking`, nunca un think effort | selector de modelo / nivel predeterminado |
| `minimal` | el menor esfuerzo (tareas muy ligeras) | selector de modelo / nivel predeterminado |
| `low` | elección manual para tareas de chat simples (las rondas baratas siguen siendo baratas) | selector de modelo / nivel predeterminado |
| `medium` | esfuerzo medio | selector de modelo / nivel predeterminado |
| `high` | el effort oficial predeterminado | selector de modelo / nivel predeterminado |
| `xhigh` | esfuerzo extra alto | selector de modelo / nivel predeterminado |
| `max` | trabajo pesado | selector de modelo / nivel predeterminado |
| `auto` | **máscara**: programa por paso a partir del historial reciente de llamadas a herramientas, resuelto a un nivel wire antes del envío | selector de modelo (inyectado por el plugin) / nivel predeterminado |

Hechos sobre los niveles wire (verificados contra la documentación oficial de DeepSeek y el adaptador `llm-deepseek` de dsh): en deepseek-v4-flash / v4-pro, `low` mapea 1:1, mientras que `medium` / `xhigh` colapsan sobre `high`. El adaptador acepta solo `off | low | high | max` y rechaza cualquier otra cosa con `UNSUPPORTED_REASONING_EFFORT` — `auto` es la capa de máscara del plugin, nunca enviada tal cual a la API, siempre resuelta a un nivel wire concreto antes de la inyección. `on` **no** es un nivel de effort: solo lo anuncian los modelos de tipo toggle (estilo Qwen3.6), y únicamente pone `enable_thinking` a true — no se envía ningún `reasoning_effort`; un modelo capaz de effort nunca anuncia `on`, así que una elección manual de `on` en uno se elimina.

## Mapeo wire personalizado

Para modelos `llm-pi-ai` declarados a mano, mapea cada nivel al valor exacto que espera tu pasarela (tomado de dsh-thinking-effort): marca un nivel e introduce su valor wire, p. ej. `high` → `ultra`. El mapeo se guarda como la tabla `reasoningEfforts` del modelo en la configuración de `llm-pi-ai`, de modo que la selección `High` del Composer envía `ultra` a la pasarela. Dejar `off` vacío significa "no enviar".

- Preset oficial: `Off / High / Max` (estilo oficial DeepSeek)
- Preset genérico: `Off / Low / Medium / High`

> El editor visual de este mapeo viajaba en la tarjeta de ajustes del plugin, eliminada por la migración de DSH 0.1.7 (el asiento ya no existe). Edita la tabla `reasoningEfforts` mediante la superficie oficial de ajustes de modelos — al fin y al cabo, la detección y la inyección del host leen esa configuración en vivo.

## Presets de ventana de contexto

El control rápido de la fila de herramientas del Composer (junto al selector de modelo/effort) edita un **límite de ventana de contexto**: paradas predefinidas `64K / 128K / 256K / 400K / 512K / 1M`, una entrada de entero personalizado y un botón de borrado. El valor se escribe en la entrada `contextWindow` del modelo `llm-pi-ai` (entero `2000`–`1000000`) — o en la entrada `llm-deepseek` para los modelos DeepSeek oficiales.

Río arriba, el harness lo consume a través de `resolveModelInfo(...).context.contextWindow` para los umbrales de compactación, la detección de desbordamiento de contexto y las proyecciones de presión de contexto. Como `llm-pi-ai` vuelve a leer la configuración en vivo en cada resolución y la sincronización compat no bloquea el descubrimiento de modelos, un cambio de ajustes surte efecto en la siguiente solicitud sin reinicio.

La configuración del plugin también acepta `models['provider/model'].contextWindow` como declaración validada (entero `2000`–`1000000`) en la superficie de composición/configuración.

## Protección consciente del modelo (v0.5.0)

El plugin nunca envía un `reasoning_effort` a un modelo que no lo anuncia. Las rutas
openai-completions personalizadas (p. ej., un Qwen3.6 local sin `reasoningEfforts`) se clasifican
como no-razonadoras vía `ctx.llm.resolveModelInfo`, y cualquier effort — heredado o programado —
se **elimina** en lugar de enviarse, de modo que el rechazo por solicitud `UNSUPPORTED_REASONING_EFFORT`
de dsh no puede dispararse. Los campos no admitidos nunca se pasan a una API que no puede
recibirlos.

Comportamiento por versión:

| versión de dsh | manejo de `low` |
|---|---|
| rc.6 (antigua) | no nativo: el selector solo lo muestra cuando un override de `models` confirmado por el configurador lo nombra; el nivel se anuncia entonces (selector + validación de solicitud) y se pasa tal cual |
| rc.7+ (nueva) | nativo: el plugin ni lo reescribe ni lo reinyecta; una elección manual de `low` pasa sin cambios |

El planificador auto aún puede elegir `low` para los modelos que lo admiten — es la protección de capacidades de arriba la que lo mantiene alejado de los modelos que no pueden recibirlo.

## Auto del selector de modelo

El selector de modelo de la sesión (junto al modelo) ahora ofrece **Auto** después de los niveles wire (inyectado en los metadatos del directorio de modelos por el plugin):

| Elección en el selector de modelo | Comportamiento |
|---|---|
| **Auto** | el plugin programa mediante historial de herramientas + los interruptores de ascenso/descenso y resuelve a `low` / `high` / `max` antes del envío |
| `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max` | **gana la elección manual** — el plugin no interviene (`on` permanece `on` en modelos de tipo toggle, nunca elevado a un effort; los modelos capaces de effort lo eliminan) |
| sin elegir | se aplica el nivel predeterminado del plugin (abajo) |

## Planificador auto

El eje es `high` (el oficial predeterminado). `auto` programa entre `low` / `high` / `max`; nunca elige `off`.

| Llamadas recientes a herramientas | Nivel |
|---|---|
| ninguna (prompt fresco, chat puro) | `low` |
| ≥75 % herramientas simples, argumentos pequeños, descensos permitidos | `low` |
| herramientas mixtas / pesadas | `high` |
| cargas muy pesadas, ascensos permitidos | `max` |

La política de programación comparte la misma fuente que [dsh-tool-turbo](https://github.com/drscrewdriver/dsh-tool-turbo) (la misma lista blanca de herramientas simples / los mismos umbrales de carga / la misma regla del 75 %).

## Instalación

Consulta [INSTALL.md](./INSTALL.es.md) para la guía completa de la CLI oficial (descubrimiento del perfil, actualización, migración, verificación, resolución de problemas). Inicio rápido:

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

> Nota: el entorno de ejecución de dsh usa pnpm 11, cuya política de cadena de suministro `minimumReleaseAge` puede bloquear una versión recién publicada con `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` — añade la versión a `minimumReleaseAgeExclude` en `~/.dsh/profiles/web/pnpm-workspace.yaml` para levantar el periodo de enfriamiento.

Registro manual con `link:` (alternativa a `dsh plugin add`):

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

## Configuración

Dos superficies comparten un mismo esquema:

- **Ensamblado** — el `config:` de la fila del plugin en la composición del perfil (p. ej. `cordis.yml`):
  ```yaml
  config:
    level: auto            # off | on | minimal | low | medium | high | xhigh | max | auto — the default level when the session picks nothing
    allowDowngrade: true   # let the scheduler drop below `high`
    allowUpgrade: false    # forbid the scheduler lifting to `max`
  ```
- **Tiempo de ejecución** — los campos de configuración `.volatile()` del plugin (`enabled`, `level`, `allowDowngrade`, `allowUpgrade`): DSH 0.1.7 genera el formulario de ajustes Plugins a partir del esquema declarado, y los cambios confirmados llegan al plugin como referencias de configuración en vivo (`loader/volatile-update`) — se aplican a la siguiente solicitud al modelo, sin reinicio. (`models` sigue siendo un campo a nivel de configurador: edítalo en la composición del perfil.)

Los overrides de capacidades por modelo (`models`, clave `provider/model`) confirman lo que la detección automática encuentra; la última palabra la tiene el configurador:

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

> Para el interruptor de razonamiento + presupuesto de Qwen, configura en su lugar la ruta **llm-pi-ai**:
> `compat.thinkingFormat: qwen` (→ `enable_thinking` + `thinking_budget` wire vía
> `thinkingBudgets`), o `qwen-chat-template` (→ `chat_template_kwargs.enable_thinking`) para
> modelos con effort como Qwen3.8-27B.

Valores predeterminados: `{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false, models: {} }`.

> Semántica: la elección del selector de modelo prevalece sobre el nivel predeterminado del plugin. Elige `auto` (máscara) → el plugin programa; elige un nivel wire → se aplica directamente; no elijas nada → se usa el `level` predeterminado del plugin. `allowDowngrade` / `allowUpgrade` solo restringen la programación `auto`.

## Superficie compat oficial: la herramienta de cortocircuito se retira (0.7.0-beta.1)

Cuando pasarelas personalizadas (vLLM / LM Studio / proxies compatibles con OpenAI autoalojados) declaran razonamiento, este plugin escribe las correcciones en la **superficie compat oficial `llm-pi-ai`** (introducida en dsh ≥ **v0.1.0-rc.8**, commit `884f7b9c41`) — [dsh-llm-openai-completions](https://github.com/drscrewdriver/dsh-llm-openai-completions) ya no es necesario y debe permanecer desinstalado:

- Escanea `llm-pi-ai.providers` en busca de rutas que sean pasarelas openai-completions personalizadas (`api: openai-completions` o baseURL no oficial) **y** declaren una tabla `reasoningEfforts` en cualquier modelo (incluidos `modelOverrides`), y luego escribe:
  - a nivel de ruta `compat.supportsDeveloperRole: false` — el prompt del sistema sale como `system`, corrigiendo el error 400 `Unexpected message role` de vLLM / SGLang;
  - a nivel de modelo `compat.thinkingFormat: 'qwen-chat-template'` en las filas de razonamiento tipo toggle (tabla de razonamiento sin `supportsReasoningEffort` a nivel de fila) — pi-ai envía entonces `chat_template_kwargs.enable_thinking` (los servidores vLLM desnudos ignoran el `enable_thinking` de primer nivel del formato `qwen` simple);
- Las escrituras pasan por el canal oficial de ajustes (lectura → transformación pura → `settings.update('llm-pi-ai', …)` de la sección completa), de modo que el esquema de dsh valida la escritura **donde se escribe**: un dsh anterior a rc.8 rechaza los campos con un aviso en el log — sin mala configuración silenciosa; los valores explícitos de cualquier capa nunca se sobrescriben;
- Se dispara al arrancar el plugin, en `llm/adapters-updated` y en los cambios de configuración de `llm-pi-ai` — sin edición manual de la configuración;
- El corte en línea de los `<think>` en el lado de la respuesta sigue siendo un **asunto de la pasarela**: un vLLM desnudo necesita `--reasoning-parser qwen3` (pi-ai solo parsea `reasoning_content` / `reasoning` / `reasoning_text`).

# Nota sobre dependencias

La mitad del host **no** tiene dependencia de valor de `@deepseek-ai/dsh-settings` — desde la línea DSH 0.1.7 no existe ningún registro de ajustes: el formulario de ajustes lo genera el host a partir del esquema schemastery declarado por el plugin (campos `.volatile()`), y la mitad cliente dialoga con el servicio `configForms` que proporciona el runtime de dsh. No hace falta instalar los paquetes oficiales en el perfil manualmente. `dependencies` es solo `@deepseek-ai/schemastery` (instalado automáticamente con el paquete).

## Desarrollo

```bash
npm run lint        # eslint (typescript-eslint flat config)
npm run typecheck   # tsc --noEmit
npm test            # vitest — 46 tests
```

Cobertura de pruebas: política de niveles (paso manual, incluidos los niveles extendidos, acotado de `on`, planificador auto, validación, frontera de herramientas simples), la protección de capacidades del modelo (`reasoningEffortSupported`, eliminación/paso de `resolveEffortInjection`), el parseo de eventos de sesión (guardas, tope de ventana, registros malformados), el esquema de configuración (sincronía de valores por defecto, rechazo fuera de rango, overrides de `models`) y la sincronización compat oficial (identificación, respeto de valores explícitos, idempotencia de identidad, validación de esquema en la escritura).

## Licencia

MIT
