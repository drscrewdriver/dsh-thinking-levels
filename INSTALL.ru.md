# Руководство по установке (официальный CLI DSH)

Это руководство использует только официальную команду `dsh plugin`. Она устанавливает зависимость в профиль и синхронизирует `dsh.profile.bundles`. Не заменяйте её обычным `npm install`, прямым `pnpm add` в профиле или ручными правками манифеста профиля.

- [Руководство по установке на русском](./INSTALL.ru.md)
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

Плейсхолдеры в этом руководстве:

- `<profile>`: профиль DSH, который нужно изменить, обычно `web`;
- `dsh-thinking-levels`: npm-пакет и ID плагина в рантайме;
- `thinking-levels`: ID композиции Cordis и слота настроек.

> **Требование к версии — DSH v0.2.0-rc.1 или новее.**
>
> Сначала проверьте запущенную версию (`dsh --version`).
>
> | Версия DSH | Действие |
> | --- | --- |
> | ≥ 0.2.0-rc.1 | Установите этот релиз (4.0.x). |
> | ≥ 0.1.7-rc.1 до < 0.2.0 | Установите линию 3.x: `dsh plugin --profile <profile> add dsh-thinking-levels@dsh-0.1.7 -w` (3.4.3). |
> | < 0.1.7-rc.1 | Оставайтесь на прежней линии плагина (3.0.2). Не запускайте более старую сборку плагина против DSH 0.1.7+ — вместо этого обновите плагин. |
>
> Граница — `0.1.7-rc.1`, где DSH удалил императивную регистрацию настроек (`settings.register` / `installSettingsSection`) и клиентский сервис `settingsScope`. С той границы и линия 3.x (хосты 0.1.7), и этот релиз (хосты 0.2.0-rc) целятся в одну и ту же декларативную поверхность настроек (`.volatile()`-поля схемы + `configForms`).

> Более старые линии DSH устанавливаются из npm через их dist-tag: `dsh plugin add dsh-thinking-levels@dsh-0.1.7` (DSH 0.1.7–0.1.x, плагин 3.4.3), `...@dsh-0.1.5` (DSH 0.1.5), `...@dsh-0.1.2` (DSH 0.1.2), `...@compat` (DSH 0.1.0–0.1.1). Никогда не устанавливайте голые версии `0.x` эпохи `latest` (≤ 0.6.0) — они не несут peer-деклараций dsh.

## 0. Предпосылки и обнаружение профиля

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Используйте профиль, который называет ваш запущенный процесс DSH. Обычно это `web`, но авторитетный аргумент — активный `--profile`.

## 1. Официальная установка

Установите последнюю версию:

```bash
dsh plugin --profile <profile> add dsh-thinking-levels -w
```

(Флаг `-w` обязателен, когда профиль — корень pnpm-workspace, каков `web`.)

Явно установите текущий релиз:

```bash
dsh plugin --profile <profile> add dsh-thinking-levels@4.0.0 -w
```

Официальный CLI автоматически обновляет зависимость профиля, lockfile и `dsh.profile.bundles`. Не добавляйте ручную YAML-строку.

### Период охлаждения supply chain

Среда выполнения dsh использует pnpm 11, чья политика `minimumReleaseAge` может заблокировать свежеопубликованную версию с `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Добавьте версию в `minimumReleaseAgeExclude` в `~/.dsh/profiles/web/pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - dsh-thinking-levels@4.0.0
```

## 2. Обновление

Обновитесь до последней версии из реестра:

```bash
dsh plugin --profile <profile> update dsh-thinking-levels -w
```

Перезапустите DSH ради хостовых изменений и обновите веб-страницу ради клиентских.

## 3. Регистрация по локальному пути / link: (альтернатива)

Для разработки или офлайн-установок зарегистрируйте плагин из локального чекаута:

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<absolute path to dsh-thinking-levels>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

Либо используйте официальный CLI с локальным путём (без сети):

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-thinking-levels -w
```

## 4. Проверка установки

Проверьте зависимость и установленную версию:

```bash
grep -n "dsh-thinking-levels" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-thinking-levels/package.json').version"
```

Для этого релиза версия должна быть `4.0.0`.

Проверьте официальную композицию:

```bash
dsh --profile <profile> --dump-default-config
```

Она должна содержать:

```yaml
- id: thinking-levels
  name: dsh-thinking-levels
```

## 5. Проверка формы настроек

Перезапустите DSH, затем обновите веб-страницу. Откройте **Настройки → Plugins** и найдите запись **dsh-thinking-levels** — с DSH 0.1.7 форма генерируется хостом из объявленных плагином `.volatile()`-полей схемы (пользовательской клиентской карточки больше нет).

1. Форма показывает переключатель включения, селектор уровня (восемь стандартных уровней плюс `auto`) и переключатели планировщика (`allowDowngrade` / `allowUpgrade`).
2. Подтверждённые изменения применяются к следующему запросу к модели без перезапуска (живая volatile-конфигурация).
3. Редактор возможностей по моделям (wire-значения шлюза, llm-pi-ai) поставлялся с упразднённой карточкой и больше не часть этого плагина — правьте возможности моделей `llm-pi-ai` через официальные настройки моделей.

## Статус поддержки японского и корейского

Плагин поставляет словари `ja` и `ko`, но текущий официальный релиз DSH через `LocaleRuntime` предоставляет только `zh` и `en`. На стоковом DSH выбор японского или корейского падает с `locale "<id>" is not registered`.

Чтобы пользоваться ими до появления официальной поддержки, поддерживайте форк DSH и обновите:

- `packages/client/locale/src/locale-settings.ts`: добавьте `ja` и `ko` в `LOCALE_IDS` (схема предпочтений Хоста выводится из этого списка).
- `packages/client/locale/src/client/index.ts`: добавьте `{ id: 'ja', label: '日本語' }` и `{ id: 'ko', label: '한국어' }` в `LOCALES`.
- Добавьте соответствующие базовые словари и тесты, затем пересоберите и запустите форк.

Изменение только плагина не может расширить глобальный список локалей DSH. Используйте документированную сборку форка и официальные профильные команды; не правьте манифест профиля вручную.

## 6. Устранение неполадок

| Симптом | Действие |
| --- | --- |
| `dsh` не найден | Установите или включите официальный CLI DSH. Не имитируйте установку профиля обычными командами npm или pnpm. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Добавьте версию в `minimumReleaseAgeExclude` в `pnpm-workspace.yaml` профиля. |
| Плагин отображается как «отключён/размонтирован» без ошибок | Проверьте композицию профиля; хост не должен иметь value-зависимости от `@deepseek-ai/dsh-settings` (и не имеет). |
| Клиентская запись отсутствует в `__DSH_BOOT__` | Убедитесь, что `exports["./client"]` существует и fiber хоста установлен. |
| В селекторе модели нет `Auto` | Убедитесь, что обёртка `resolveModel` адаптера отработала (она перезапускается на `llm/adapters-updated`). |
| Запись формы настроек падает | Значение отклонено схемой плагина; приведите его к типам объявленных `.volatile()`-полей. |
| Субагент возвращает `UNSUPPORTED_REASONING_EFFORT` | Целевая модель не анонсирует этот уровень; выберите поддерживаемый или восстановите значение провайдера по умолчанию. |
| Устаревший клиентский бандл | Жёстко обновите страницу в браузере (Ctrl+Shift+R) после апгрейда. |

## 7. Удаление

Используйте официальную команду:

```bash
dsh plugin --profile <profile> remove dsh-thinking-levels -w
```

Убедитесь, что в собранной композиции профиля бандла больше нет:

```bash
dsh --profile <profile> --dump-default-config
```
