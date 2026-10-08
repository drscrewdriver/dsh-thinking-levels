# Registro de cambios

Todos los cambios notables de `dsh-thinking-levels` se documentan aquí.

- [Changelog en español](./CHANGELOG.es.md)
- [English changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

## [4.2.0-beta.27] — 2026-10-08

### Corregido

- **La fila de pestañas de familia salta de línea** al ancho del contenedor en
  lugar de desbordarse en una barra de desplazamiento horizontal:
  `flexWrap: 'nowrap'` + `overflowX: 'auto'` (063d9fd) se sustituyen por
  `wrap`, y se elimina `flex: 0 0 auto` de los botones. Con 7+ pestañas
  contribuidoras, la fila fluye a las siguientes líneas (todas las
  generaciones ≤0.1.7).

## [4.2.0-beta.26] — 2026-10-08

### Añadido — sección familiar entre versiones (beta.18 → beta.26)

- **Sección de ajustes legacy del lado del servidor (`installLegacySection`).**
  La sección familiar (起子插件设置) ahora registra el espacio de nombres
  `thinking-levels` en el servidor, de modo que se renderiza con datos reales
  en hosts ≤0.1.7, a través de las tres formas generacionales
  (`installSettingsSection` a nivel de módulo, `installSection` por instancia,
  loader-volatile en rc.1+), con un esquema `LegacyConfig` plano no volátil y
  una base plana aplanada (los nodos volátiles y las referencias vivas son
  rechazados por el registro legacy — tres errores apilados corregidos entre
  beta.18 y beta.22).
- **Blindaje de la elección de la sección familiar (beta.26).** La fábrica de
  `settings.section` se retira cuando ya hay un asiento de `dsh-family`
  (superficie nativa del host o un rival): exactamente un propietario sin
  importar el orden de registro. Acompaña a la elección diferida de cesión de
  dsh-session-guard 4.1.11 — los shells ≤0.1.7 dan a cada sección con el mismo
  id su propia fila de navegación, así que el doble registro significaba una
  doble fila de 起子插件设置.
- **Correcciones de UI (beta.23 → beta.25).** La tira de pestañas familiar se
  mantiene en una sola fila (desplazamiento horizontal; 8 pestañas de
  contribuidores ya no dejan huérfana la última en una segunda línea); los
  controles de ajustes siguen el tema oscuro del shell (superficie
  semitransparente en lugar de blanco fijo, `colorScheme` a partir de una
  única sonda de luminancia del body); la declaración de children tolera un
  conflicto aterrizando sin ella; los registros de depuración del ciclo de
  vida se mantienen en producción.

## [Unreleased]

### Añadido — deslizador de nivel de razonamiento (pulgar ballena corredora) — 4.1.0

- El `<select>` de esfuerzo de cada línea pasa a un **deslizador segmentado**: el número de
  paradas se adapta a los niveles del modelo, `auto` queda siempre a la izquierda, el pulgar
  sigue el puntero continuamente y se ajusta al soltar, ←/→/Home/End por teclado, el
  reinicio «predeterminado del proveedor» sobrevive como botón ↺.
- Las líneas DeepSeek muestran la **ballena corredora** (tira de 8 fotogramas, bucle
  ping-pong, 720 ms en reposo / 420 ms al arrastrar, congelada con
  `prefers-reduced-motion`); los demás modelos mantienen el pulgar blanco. Arte de la
  comunidad de HanaAyane/dsh-reasoning-effort, regenerable con `python tools/whale-mascot.py`.
- Helpers puros `orderEffortsForSlider` / `nearestEffortStopIndex` exportados con pruebas.

## [4.0.0] — 2026-09-29

### Cambiado — compatibilidad con DSH 0.2.0-rc

- **El gate de peer reorientado al segmento 0.2.0-rc.** Las siete declaraciones peer
  `@deepseek-ai/dsh-*` y `engines.dsh` ahora leen `>=0.2.0-rc.1 <0.2.1-0` (en sustitución de
  `>=0.1.7-rc.1 <0.1.8-0`). Los hosts en 0.1.7-rc.1 a < 0.2.0 se quedan en la línea 3.x
  (dist-tag npm `dsh-0.1.7`, 3.4.3); los hosts por debajo de 0.1.7-rc.1 se quedan en 3.0.2.
- **devDependencies movidas a la línea 0.2.0** — `dsh-client-locale` / `dsh-client-ui-renderer` /
  `dsh-client-ui-settings` / `dsh-client-ui-slots` / `dsh-client-store` → `0.2.0-rc.1`, y
  `@deepseek-ai/cordis` → `^4.0.4` (exigido por el peer `~4.0.4` de los paquetes cliente
  0.2.0-rc.1) — de modo que typecheck / pruebas / build se ejecutan contra los tipos reales
  0.2.0-rc.1.
- **Higiene de metadatos:** la versión de `dsh.plugin.json` y `engines.dsh` sincronizadas con
  4.0.0 y el segmento 0.2.0-rc; `publishConfig.tag` → `dsh-0.2.0` con un nuevo script `release:4x`
  para que una publicación nunca pueda sobrescribir los tags `dsh-0.1.7` / `latest`; ambos
  lockfiles (`package-lock.json` / `pnpm-lock.yaml`) regenerados contra el árbol de dependencias
  0.2.0.
- **Sin cambios de código ni en la mitad del host ni en la del cliente.** Los paquetes que
  importa este plugin (`dsh-client-locale`, `dsh-client-store`, `dsh-client-ui-renderer`,
  `dsh-client-ui-settings`, `dsh-client-ui-slots`) solo cambian de versión de paquete entre
  0.1.7-rc.2 y 0.2.0-rc.1; las caras de los servicios `settings` / `llm` y el adaptador
  `llm-pi-ai` tampoco cambian. La suite completa (lint / typecheck / 71 pruebas / build) pasa sin
  cambios contra 0.2.0-rc.1.

### Corregido — entrada Plugins duplicada en los ajustes — 2.0.0-beta.4

- **Eliminado el registro de `settings.plugins.tab`.** El trabajo de compat 0.1.5 asumía que DSH
  0.1.5 había eliminado el asiento `settings.plugin.item`, pero el `ui-settings-plugins`
  0.1.5-rc.2 publicado (y 0.1.6-alpha.1) aún lo declara como hijo de la pestaña Plugins
  configurable integrada. Con ambos asientos declarados, los dos registros se disparaban y el
  plugin aparecía dos veces en Ajustes → Plugins: una como tarjeta de elemento en la lista
  configurable y otra como pestaña dedicada de primer nivel. La tarjeta de elemento por sí sola
  cubre todas las líneas admitidas, así que el registro de pestaña desaparece (con su thunk de
  etiqueta `ctx.locale.bind`).

### Cambiado — compatibilidad con DSH 0.1.5-rc — 2.0.0-beta.3

- **La tarjeta de ajustes viaja en el nuevo asiento 0.1.5.** DSH 0.1.5 renombró el asiento de la
  tarjeta de ajustes Plugins de `settings.plugin.item` a `settings.plugins.tab` (`id` = clave de
  pestaña, `order` y una `label` localizada por el registrante). Ambos registros están
  condicionados por declaración vía `ctx.slots.inject`, de modo que la tarjeta se monta en el
  asiento que declara el host en ejecución — los hosts 0.1.5+ obtienen la pestaña, los hosts
  0.1.2–0.1.4 conservan la tarjeta heredada. La etiqueta de la pestaña es un thunk de lectura al
  vuelo sobre `ctx.locale.bind(NS)`, así que sigue a los cambios de locale.
- **Tipado de `ctx.slots` restaurado.** La augmentación `Context.slots` llegaba transitivamente a
  través del paquete (ahora eliminado) `dsh-client-runtime`; 0.1.5 la movió a
  `@deepseek-ai/dsh-client-ui-renderer/client`, que la mitad del cliente ahora importa.
- **devDependencies fijadas en 0.1.5-rc.2** y toda la suite (typecheck / lint / 65 pruebas /
  build) verificada contra ese árbol. Las APIs del lado del host (`settings.register/get/update`,
  `settings/document-updated`, `agent/request`) no cambian en 0.1.5-rc.2 — no hicieron falta
  cambios en el host.
- Verificado contra las superficies contractuales de 0.1.5-rc.2 desempaquetadas de npm:
  `conversation.input.right`, `settingsScope.bind`, las sobrecargas de locale y la cara del
  servicio de ajustes se conservan todas.
- **`lib/` está versionado en git.** `package.json` envía `files: ["lib", …]` y apunta `main` /
  `types` / `exports` a `lib/`, pero `.gitignore` seguía listando `lib/` — así que una
  instalación basada en GitHub (que no ejecuta build) recibía un paquete sin punto de entrada.
  Los artefactos compilados están ahora en el control de versiones, y una recompilación los
  reproduce byte a byte (sin diff de contenido, solo el ruido de fines de línea de
  `core.autocrlf`).
- **`engines.dsh` estrechado al segmento que esta línea implementa realmente**: el anterior
  `>=0.1.2-alpha.1 <0.2.0-0` admitía hosts 0.1.2–0.1.4, donde la mitad del cliente no puede
  compilar contra el asiento de ajustes Plugins renombrado que esta línea registra. Ahora es
  `>=0.1.5-alpha.1 <0.2.0-0` (y `node` estrechado a `^22.19.0 || >=24.0.0`, en línea con la
  cadena de herramientas). `publishConfig` fija `registry` + `tag: beta` para que un `npm publish`
  desnudo no pueda resolver mal el mirror ni sobrescribir la línea estable `latest`, y
  `pnpm-lock.yaml` se rastrea como parte del contrato de compatibilidad en lugar de tratarse como
  un artefacto local.
- **Un placeholder de pnpm `allowBuilds` ya no bloquea las instalaciones.** `pnpm-workspace.yaml`
  llevaba el stub literal de pnpm `set this to true or false`, que abortaba cada `pnpm install`
  con `ERR_PNPM_IGNORED_BUILDS`; ahora dice `esbuild: true`.

### Cambiado — el control de contexto vive en la fila del composer — 2.0.0-beta.2

- **El control rápido de la ventana de contexto vuelve a estar en la fila de herramientas del
  composer** (`conversation.input.right`, junto al control de modelo/effort). La tarjeta de
  modelo no es una opción: el `ModelSelect` enviado llama a `renderSlot` cero veces y posee su
  popup, de modo que el asiento `conversation.input.model.section` declarado en `2.0.0-beta.1`
  no lo renderiza ningún harness publicado — un plugin no puede poner una fila dentro de esa
  tarjeta por sí solo. `conversation.input.right` es un asiento `list` de ámbito de sesión que
  cualquier plugin puede ocupar, y ahí es donde pertenece un control de fila de herramientas.
- **El fallo de la entrada del asiento sigue corregido.** La vieja píldora llamaba a un asiento
  estándar como getter desnudo (`useSession()`) — cada asiento del renderer es un hook selector
  `useSyncExternalStoreWithSelector`, así que la llamada lanzaba
  `TypeError: l is not a function` y tiraba toda la entrada en cada render. El control ahora lee
  el modelo activo a través de un selector obligatorio.
- **La fuente del modelo es independiente del asiento.** Prefiere el asiento de sesión
  `useTrajectory` (el libro de solicitudes, DSH 0.1.2+) y retrocede a `useConversation`
  (`ConversationSnapshot.views.get('trajectory')`) en las líneas de harness que carecen de él;
  un harness que no proporcione ninguno de los dos asientos no renderiza nada en lugar de un
  control muerto.
- **El popover es una sola fila de deslizador**: deslizador de presets (64K / 128K / 256K / 400K /
  512K / 1M) que escribe una vez por gesto (soltar el puntero, soltar la tecla, blur), el valor
  confirmado, un editor de entero personalizado colapsado (`⋯`) y Borrar. La píldora muestra solo
  el valor; los textos `input.context.*` están restaurados en los cuatro diccionarios.
- **Sin cambios: el editor de la tarjeta de ajustes.** Los presets de ventana de contexto por
  modelo, el entero personalizado y Borrar quedan exactamente como están, escribiendo en los
  mismos namespaces `llm-pi-ai` / `llm-deepseek`.

### Ruptura — solo DSH v0.1.2+ (eliminación de `dsh-client-runtime`) — 0.7.2-beta.1

- **`engines.dsh` es ahora `>=0.1.2-alpha.1 <0.2.0-0`.** `@deepseek-ai/dsh-client-runtime` fue
  eliminado por completo en `0.1.2-alpha.1` (commit `be531688f3`); esa versión es la frontera
  dura de segmento. La línea de plugin anterior (`0.7.1-beta.2` y previas) sigue sirviendo a
  DSH 0.1.0 / 0.1.1.
- **`ClientContext` ha desaparecido.** `src/client/index.ts` ahora importa
  `Context as ClientContext` de `@deepseek-ai/cordis`, como todos los plugins cliente oficiales.
  `@deepseek-ai/dsh-client-runtime` se elimina de `peerDependencies`, `peerDependenciesMeta` y
  `devDependencies`, así que ya no bloquea la instalación.
- **`src/types/contracts.d.ts` pierde el espejo ambient
  `declare module '@deepseek-ai/dsh-client-runtime/client'`.** `SettingsScope` gana los campos de
  instantánea `base` / `user` / `revision` y `bind` acepta un `decode` opcional; el espejo
  `SlotsFace` permanece (el `SlotRegistry` real de `@deepseek-ai/dsh-client-ui-renderer` lo
  proporciona en tiempo de ejecución).
- **`dsh.client.inject` lista `@deepseek-ai/dsh-client-ui-renderer`**, el paquete que
  proporciona el servicio `slots` en el que este plugin se registra.
- **Registro localizado dividido por sobrecarga.** La forma masiva
  `register(ns, dicts)` está tipada sobre los IDs de locale integrados (solo `zh` / `en`), así
  que los diccionarios `ja` / `ko` incluidos pasan ahora por la sobrecarga de locale único
  `register(ns, locale, dict)` y se liberan juntos. El comportamiento no cambia; la llamada ahora
  pasa el typecheck contra el paquete real de locales.

### Eliminado

- **Listener `agent/tool` muerto.** La telemetría de tiempo de reloj por herramienta registraba un
  manejador `ctx.on('agent/tool', …)` que mantenía un mapa `started` y registraba
  `tool … took …ms`. DSH no tiene tal evento ni en 0.1.1-rc.2 ni en 0.1.2-rc.1 — el registro de
  eventos de ámbito (`packages/core/scope/src/scoped-events.generated.ts`) lista doce eventos
  `agent/*` y `agent/tool` no es uno de ellos — así que el manejador nunca se ejecutó y la línea
  de log nunca se emitió. Se eliminan el listener, su mapa `started`, el barrido `pruneStale` y
  la constante `TOOL_AGE_LIMIT_MS`.
- **El planificador de effort no se ve afectado.** El reconocimiento de herramientas es una
  *tracción*, no un empuje: el waterfall `agent/request` llama a `recentToolCalls(payload.agent)`,
  que lee los registros `tool/call` de `agent.session.events` y alimenta `scheduleEffort`. Esa
  vía tiene sus propias pruebas (`tests/session-events.spec.ts`, `tests/thinking-level.spec.ts`)
  y no fue tocada.

### Corregido — mainline renumerada a 2.x — 2.0.0-beta.1

- **El control rápido de la ventana de contexto crasheaba su asiento en cada render.**
  `ContextQuick` llamaba al asiento estándar de sesión como getter desnudo (`useSession()`). Cada
  asiento estándar del renderer es un *hook selector* `useSyncExternalStoreWithSelector` ligado
  por `bindSnapshotSelector` (`@deepseek-ai/dsh-client-ui-renderer`), así que la llamada llegaba
  al shim con `selector === undefined` y lanzaba `TypeError: l is not a function`: la entrada
  `conversation.input.right` moría y la error boundary del asiento la relanzaba en cada render.
  El mismo componente también leía `session.views.get('trajectory')`, un campo que
  `SessionSnapshot` nunca llevó (las views pertenecen a `ConversationSnapshot`), así que no
  habría podido resolver un modelo ni siquiera sin el fallo. El modelo activo llega ahora desde
  el asiento de sesión `useTrajectory` a través de un selector estable a nivel de módulo sobre
  el libro de solicitudes.
- **El control se trasladó a la tarjeta del menú de modelo.** Se registra en
  `conversation.input.model.section` — la franja que ui-model-selection renderiza bajo las filas
  Modelo / Esfuerzo de razonamiento — como una fila compacta de deslizador: un deslizador de
  presets (64K / 128K / 256K / 400K / 512K / 1M) que escribe una vez por gesto (soltar el
  puntero, soltar la tecla, blur), el valor confirmado, un editor de entero personalizado
  colapsado y Borrar. Los textos se reducen a la etiqueta de la fila, el valor y Borrar. La
  píldora de la fila del composer desaparece; la tarjeta de ajustes conserva el editor completo
  por modelo. La fila aparece en los harness cuyo asiento de modelo declara ese asiento hijo
  (añadido en `packages/client/ui-model-selection`); en harness más antiguos el registro queda
  pendiente y la tarjeta de ajustes sigue siendo el editor.
- **Versión de `dsh.plugin.json` sincronizada** con `package.json`; el tarball 0.7.2-beta.1 la
  había enviado como 0.7.1-beta.2.
- **Renumeración de versiones: la línea es ahora el dígito mayor.** Esta mainline (DSH 0.1.2+)
  pasa a **2.x**, la línea heredada (DSH < 0.1.2, rama `compat/dsh-0.1.1`) a **1.x**, de modo
  que una versión instalada indica qué segmento de harness sirve. Los dist-tags npm mantienen
  sus roles: `beta` = esta línea, `compat` = la línea heredada. Nada más cambia para las
  instalaciones existentes; un rango `0.7.x` simplemente no coincide con `2.x`, así que el
  cambio es explícito.
- **La fila del menú de modelo necesita un harness que declare el asiento.**
  `conversation.input.model.section` se añade a `packages/client/ui-model-selection` (declaración +
  llamada a `renderSlot`); hasta que una release del harness lo lleve, el registro queda
  pendiente y la tarjeta de ajustes sigue siendo el editor. Ningún harness publicado lo tiene
  hoy.

## [0.7.0] — 2026-09-09

> **Versión estable.** La vía de cortocircuito se retira; todas las correcciones de pasarela
> viajan ahora por la superficie compat oficial `llm-pi-ai` (dsh ≥ **v0.1.0-rc.8**). Esta versión
> también incluye los presets de ventana de contexto del borrador 0.7.0 anterior.

### Añadido

- **Presets de ventana de contexto multinivel** en el editor de capacidades por modelo: botones de
  preset `64K / 128K / 256K / 400K / 512K / 1M` más una entrada de entero personalizado y un
  botón de borrado, escritos en el `contextWindow` del modelo `llm-pi-ai` y consumidos en vivo
  por el harness (compactación / detección de desbordamiento de contexto / proyecciones de
  presión de contexto) en la siguiente solicitud — sin necesidad de reinicio.
- Nuevo módulo puro `src/context-window.ts` (constantes de rango `2000`–`1_000_000`, lista de
  presets, `formatContextWindow`, `validateContextWindow`) compartido por el esquema de
  configuración, la tarjeta de ajustes y las pruebas.
- Superficie de configuración: el override `models[].contextWindow` se acepta con validación de
  entero `2000`–`1000000` (fallo ruidoso ante valores fuera de rango).
- Nuevos textos `zh` / `en` / `ja` / `ko` para el control de ventana de contexto.
- Añadido `dsh.plugin.json` con `engines.dsh: ">=0.1.0-rc.8"`.
- Añadidas `peerDependencies` para `dsh-client-runtime`, `dsh-client-locale`, `dsh-client-ui-settings`,
  `dsh-client-ui-slots` (todas opcionales).

### Eliminado

- **El puente de takeover por cortocircuito**: el plugin ya no mantiene la lista de takeover
  `llm-openai-completions` (`nextTakeoverSection` / `TakeoverSection` desaparecen). El plugin
  adaptador `dsh-llm-openai-completions` NO es necesario junto a esta versión y puede permanecer
  desinstalado.

### Cambiado

- **Puente auto-compat reescrito sobre la superficie compat oficial** (`withOfficialCompatFixes`):
  para cada ruta de pasarela openai-completions personalizada que declare razonamiento, la
  sincronización ahora escribe
  - a nivel de ruta `compat.supportsDeveloperRole: false` (prompt del sistema enviado como
    `system` — corrige el error 400 `Unexpected message role` de vLLM/SGLang), y
  - a nivel de modelo `compat.thinkingFormat: 'qwen-chat-template'` en las filas de razonamiento
    tipo toggle (sin soporte de effort a nivel de fila) para que pi-ai envíe
    `chat_template_kwargs.enable_thinking` — los servidores vLLM desnudos ignoran el
    `enable_thinking` de primer nivel del formato `qwen` simple.
- El patrón de almacenamiento sigue el lado del host de dsh-thinking-effort: lectura →
  transformación pura (identidad cuando no hay nada que cambiar) → `settings.update('llm-pi-ai', …)`
  de la sección completa, de modo que el validador de esquema `llm-pi-ai` de dsh condiciona la
  escritura donde se ESCRIBE; un dsh anterior a rc.8 rechaza el campo desconocido y la
  sincronización registra en el log y conserva la sección anterior. Los valores explícitos en
  cualquier capa se respetan y nunca se sobrescriben.
- **Tarjeta de capacidades des-cortocircuitada**: el interruptor de "takeover por cortocircuito"
  se sustituye por un interruptor por proveedor de **"la pasarela rechaza el rol developer"**
  (escribe/borra la bandera a nivel de ruta; desmarcar restaura la herencia). El condicionado por
  lista de takeover desaparece — los modelos de cada proveedor llm-pi-ai son directamente
  editables, en capas progresivas: ① razonamiento + vision → ② soporte de effort (solo modelos de
  razonamiento) → ③ editor wire de efforts → ④ thinkingFormat → ⑤ ventana de contexto. Activar el
  razonamiento en un modelo tipo toggle autocompleta `thinkingFormat: 'qwen-chat-template'`
  (solo si está ausente); activar el effort lo elimina de nuevo.
- `declaresThinking` ahora también escanea `modelOverrides` (antes solo `models[]`), de modo que
  las rutas solo-con-modelOverrides también se identifican y corrigen.
- El gate de lectura de postura del adaptador (`takeoverOf` / `piAiPosture`) se conserva pero es
  inerte: sin el adaptador produce la semántica nativa de pi-ai.
- La insignia de contexto ahora reutiliza el `formatContextWindow` compartido para que los presets
  escritos se muestren exactamente (p. ej. `256000` → `256K`, `1000000` → `1M`).

### Notas

- Requiere dsh ≥ **v0.1.0-rc.8** para la superficie compat oficial. En dsh más antiguos, el
  esquema rechaza los campos compat (fallo ruidoso, sin mala configuración silenciosa).
- El corte en línea de los `<think>` en el lado de la respuesta sigue siendo un asunto de la
  pasarela: un vLLM desnudo necesita `--reasoning-parser qwen3`; pi-ai (≤ 0.85.1) solo parsea
  `reasoning_content` / `reasoning` / `reasoning_text`. `qwen-chat-template` no lleva
  `reasoning_effort` (las ramas del formato son mutuamente excluyentes) — los niveles de effort
  solo controlan el on/off de `enable_thinking`. El paralelismo real (chat_template_kwargs +
  reasoning_effort) necesita un cambio aguas arriba en pi-ai.
- Los materiales de verificación viven en la rama `check` (`check/CHECK.md`,
  `check/record-proxy.mjs`, `check/settings-route.example.yaml`); no forman parte del paquete
  npm.

## [0.6.0] — 2026-02-?

### Añadido

- **Ocho niveles estándar** alineados con dsh-thinking-effort: `off / on / minimal / low / medium / high / xhigh / max` (más la máscara de planificación `auto`). `on` es el interruptor de activación del razonamiento, acotado a la fuerza predeterminada del modelo (`high` o el nivel de razonamiento anunciado más alto); `minimal` / `medium` / `xhigh` pasan tal cual cuando una pasarela personalizada los anuncia y colapsan sobre `high` en el adaptador oficial.
- **Mapeo wire personalizado en la tarjeta de ajustes** (tomado de dsh-thinking-effort): cada nivel puede marcarse y recibir el valor exacto enviado a la pasarela (p. ej. `high` → `ultra`); `off` vacío significa "no enviar". Se guarda como la tabla `reasoningEfforts` del modelo.
- **Renovación de la presentación de la tarjeta de ajustes** (tomado de dsh-thinking-effort): los proveedores agrupan sus modelos, cada fila de modelo muestra insignias de texto/imagen/contexto, los modelos se despliegan en un editor por nivel, un cuadro de búsqueda filtra los modelos y los presets de un clic (estilo oficial DeepSeek / genérico) se aplican a cada modelo de razonamiento.
- **Multilingüe**: diccionarios japonés (`ja`) y coreano (`ko`), más `README.ja.md` / `README.ko.md`, `INSTALL.{md,zh,ja,ko}.md` y `CHANGELOG.{md,ja,ko}.md`. Nota: el runtime de locales del DSH oficial sigue exponiendo solo `zh` / `en`, así que la selección de `ja` / `ko` requiere un fork de DSH (ver la nota de compatibilidad del README).

### Cambiado

- La superficie de configuración `level` acepta los nueve valores completos (`off | on | minimal | low | medium | high | xhigh | max | auto`).
- El override `models[].efforts` acepta los niveles extendidos.
- Renderer de la tarjeta refactorizado; los editores de capacidades usan ahora un borrador wire por etapas con un botón explícito de **Aplicar niveles** en lugar de confirmaciones inmediatas por casilla.

### Corregido

- Eliminado el helper no usado `effortLevelsOf`; silenciado el aviso de lint del parámetro no usado `_N`.

## [0.5.2] — 2026-02-?

### Añadido

- **Takeover automático de `dsh-llm-openai-completions`**: los proveedores que son pasarelas openai-completions personalizadas (`api: openai-completions` o baseURL no oficial) **y** declaran una tabla `reasoningEfforts` en cualquier modelo se fusionan en `llm-openai-completions.providers` con `enabled: true`. Se ejecuta al arrancar el plugin, en `llm/adapters-updated` y en los cambios de ajustes; acoplamiento suave (omite la escritura cuando el namespace no está registrado).

## [0.5.1] — 2026-02-?

### Añadido

- Tarjeta editor de capacidades de modelos: vision / razonamiento / soporte-de-effort / niveles de effort / formato de razonamiento para cada modelo de proveedor personalizado `llm-pi-ai`, escrita directamente en el namespace de ajustes `llm-pi-ai` (sin cambios en los paquetes oficiales).

## [0.5.0] — 2026-02-?

### Añadido

- Protección consciente del modelo: nunca enviar `reasoning_effort` a un modelo que no lo anuncia (las rutas openai-completions personalizadas como Qwen3.6 se eliminan en su lugar).
- Paso de `low` en dsh rc.7+; los adaptadores de la era rc.6 pueden anunciar `low` mediante un override de `models` confirmado por el configurador.
- Sección de configuración `models` (`provider/model` → `vision` / `thinking` / `efforts`).

## [0.4.1] — 2026-02-?

### Corregido

- El wrapper `resolveModel` del adaptador ahora se vuelve a ejecutar en `llm/adapters-updated` para que la máscara `Auto` aparezca incluso cuando los adaptadores se registran después de aplicar el plugin.

## [0.4.0] — 2026-02-?

### Cambiado

- Eliminada la dependencia de valor de `@deepseek-ai/dsh-settings`; el registro de ajustes pasa por el servicio cordis `settings` (equivalente local de `installSettingsSection`).
- El registro de la tarjeta proporciona tanto `id` como `key` para que funcione en las declaraciones de asientos de la CLI (por clave) y de DSH Desktop (por lista).

## [0.3.0] — 2026-02-?

### Añadido

- `Auto` en el selector de modelo (máscara): inyectado en los efforts de `resolveModel` del adaptador; el plugin programa `low` / `high` / `max` por paso a través del waterfall `agent/request` (registrado con `prepend` para que el ensamblado de selección de modelo de la sesión no pueda sobrescribirlo).

## [0.2.1] — 2026-02-?

### Corregido

- Añadido `exports["./client"]` para que el cargador de módulos cliente de dsh descubra el bundle de cliente.

## [0.2.0] — 2026-02-?

### Añadido

- Primera tarjeta de ajustes de cliente (selector de nivel + interruptores del planificador).

## [0.1.1] — 2026-02-?

### Corregido

- Se publica `lib/` compilado en lugar de las fuentes TS crudas (Node 22 prohíbe el stripping de tipos de los `.ts` bajo `node_modules`).

## [0.1.0] — 2026-02-?

### Añadido

- Versión inicial: inyección de `agent/request` de un effort de razonamiento fijo.
