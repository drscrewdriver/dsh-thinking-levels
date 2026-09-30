# Guía de instalación (CLI oficial de DSH)

Esta guía usa únicamente el comando oficial `dsh plugin`. El comando instala la dependencia en un perfil y sincroniza `dsh.profile.bundles`. No lo sustituyas por un simple `npm install`, un `pnpm add` directo en el perfil ni ediciones manuales del manifiesto del perfil.

- [Guía de instalación en español](./INSTALL.es.md)
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

Los marcadores de posición de esta guía son:

- `<profile>`: el perfil de DSH a modificar, normalmente `web`;
- `dsh-thinking-levels`: el paquete npm y el ID del plugin en tiempo de ejecución;
- `thinking-levels`: el ID de la composición Cordis y del slot de ajustes.

> **Requisito de versión — DSH v0.2.0-rc.1 o más reciente.**
>
> Comprueba primero la versión en ejecución (`dsh --version`).
>
> | Versión de DSH | Acción |
> | --- | --- |
> | ≥ 0.2.0-rc.1 | Instala esta versión (4.0.x). |
> | ≥ 0.1.7-rc.1 a < 0.2.0 | Instala la línea 3.x: `dsh plugin --profile <profile> add dsh-thinking-levels@dsh-0.1.7 -w` (3.4.3). |
> | < 0.1.7-rc.1 | Quédate en la línea de plugin anterior (3.0.2). No ejecutes una build de plugin más antigua contra DSH 0.1.7+ — actualiza el plugin en su lugar. |
>
> La frontera es `0.1.7-rc.1`, donde DSH eliminó el registro imperativo de ajustes (`settings.register` / `installSettingsSection`) y el servicio cliente `settingsScope`. Desde esa frontera, tanto la línea 3.x (hosts 0.1.7) como esta versión (hosts 0.2.0-rc) apuntan a la misma superficie declarativa de ajustes (campos de esquema `.volatile()` + `configForms`).

> Las líneas de DSH más antiguas se instalan desde npm mediante su dist-tag: `dsh plugin add dsh-thinking-levels@dsh-0.1.7` (DSH 0.1.7–0.1.x, plugin 3.4.3), `...@dsh-0.1.5` (DSH 0.1.5), `...@dsh-0.1.2` (DSH 0.1.2), `...@compat` (DSH 0.1.0–0.1.1). Nunca instales las versiones `0.x` desnudas de la era `latest` (≤ 0.6.0) — no llevan declaraciones peer de dsh.

## 0. Requisitos previos y descubrimiento del perfil

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Usa el perfil que nombra tu proceso de DSH en ejecución. `web` es lo habitual, pero el argumento `--profile` activo es lo que manda.

## 1. Instalación oficial

Instala la última versión:

```bash
dsh plugin --profile <profile> add dsh-thinking-levels -w
```

(La bandera `-w` es necesaria cuando el perfil es la raíz de un workspace de pnpm, como lo es `web`.)

Instala explícitamente la versión actual:

```bash
dsh plugin --profile <profile> add dsh-thinking-levels@4.0.0 -w
```

La CLI oficial actualiza automáticamente la dependencia del perfil, el lockfile y `dsh.profile.bundles`. No añadas una fila YAML manual.

### Periodo de enfriamiento de la cadena de suministro

El entorno de ejecución de dsh usa pnpm 11, cuya política `minimumReleaseAge` puede bloquear una versión recién publicada con `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Añade la versión a `minimumReleaseAgeExclude` en `~/.dsh/profiles/web/pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - dsh-thinking-levels@4.0.0
```

## 2. Actualización

Actualiza a la última versión del registro:

```bash
dsh plugin --profile <profile> update dsh-thinking-levels -w
```

Reinicia DSH para los cambios del host y recarga la página web para los cambios del cliente.

## 3. Registro por ruta local / link: (alternativa)

Para desarrollo o instalaciones sin conexión, registra el plugin desde un checkout local:

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

O usa la CLI oficial con una ruta local (sin necesidad de red):

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-thinking-levels -w
```

## 4. Verificar la instalación

Comprueba la dependencia y la versión instalada:

```bash
grep -n "dsh-thinking-levels" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-thinking-levels/package.json').version"
```

La versión debe ser `4.0.0` para esta release.

Comprueba la composición oficial:

```bash
dsh --profile <profile> --dump-default-config
```

Debe contener:

```yaml
- id: thinking-levels
  name: dsh-thinking-levels
```

## 5. Verificar el formulario de ajustes

Reinicia DSH y, a continuación, recarga la página web. Abre **Ajustes → Plugins** y busca la entrada **dsh-thinking-levels** — desde DSH 0.1.7 el formulario lo genera el host a partir de los campos de esquema `.volatile()` declarados por el plugin (ya no existe una tarjeta cliente personalizada).

1. El formulario muestra el interruptor de habilitación, el selector de nivel (ocho niveles estándar más `auto`) y los interruptores del planificador (`allowDowngrade` / `allowUpgrade`).
2. Los cambios confirmados se aplican a la siguiente solicitud al modelo sin reinicio (configuración volátil en vivo).
3. El editor de capacidades por modelo (valores wire de la pasarela, llm-pi-ai) se enviaba con la tarjeta retirada y ya no forma parte de este plugin — edita las capacidades de los modelos `llm-pi-ai` mediante los ajustes oficiales de modelos.

## Estado del soporte de japonés y coreano

El plugin incluye diccionarios `ja` y `ko`, pero la versión oficial actual de DSH solo expone `zh` y `en` a través de `LocaleRuntime`. En un DSH de fábrica, seleccionar japonés o coreano falla con `locale "<id>" is not registered`.

Para usarlos antes de que llegue el soporte oficial, mantén un fork de DSH y actualiza:

- `packages/client/locale/src/locale-settings.ts`: añade `ja` y `ko` a `LOCALE_IDS` (el esquema de preferencias del Host se deriva de esta lista).
- `packages/client/locale/src/client/index.ts`: añade `{ id: 'ja', label: '日本語' }` y `{ id: 'ko', label: '한국어' }` a `LOCALES`.
- Añade los diccionarios y pruebas de núcleo correspondientes y, a continuación, recompila y ejecuta el DSH bifurcado.

Un cambio limitado al plugin no puede extender la lista global de locales de DSH. Usa la build documentada del fork y los comandos oficiales de perfil; no edites manualmente un manifiesto de perfil.

## 6. Resolución de problemas

| Síntoma | Acción |
| --- | --- |
| `dsh` no se encuentra | Instala o habilita la CLI oficial de DSH. No simules la instalación del perfil con simples comandos de npm o pnpm. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Añade la versión a `minimumReleaseAgeExclude` en el `pnpm-workspace.yaml` del perfil. |
| El plugin aparece como "deshabilitado/desmontado" sin error | Comprueba la composición del perfil; el host no debe depender en valor de `@deepseek-ai/dsh-settings` (y no lo hace). |
| Entrada de cliente ausente en `__DSH_BOOT__` | Confirma que `exports["./client"]` existe y que la fibra del host se estableció. |
| El selector de modelo no tiene `Auto` | Confirma que el wrapper `resolveModel` del adaptador se ejecutó (se vuelve a ejecutar en `llm/adapters-updated`). |
| La escritura del formulario de ajustes falla | El valor fue rechazado por el esquema del plugin; alinéalo con los tipos declarados de los campos `.volatile()`. |
| Un subagente devuelve `UNSUPPORTED_REASONING_EFFORT` | El modelo de destino no anuncia ese nivel; elige uno admitido o restaura el valor predeterminado del proveedor. |
| Bundle de cliente obsoleto | Refresco fuerte del navegador (Ctrl+Shift+R) tras una actualización. |

## 7. Eliminación

Usa el comando oficial:

```bash
dsh plugin --profile <profile> remove dsh-thinking-levels -w
```

Verifica que el perfil compuesto ya no contiene el bundle:

```bash
dsh --profile <profile> --dump-default-config
```
