# dsh-thinking-levels

**[DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness)용 라운드별 사고 수준(`reasoning_effort`) 제어: 세션 모델 선택기에서 `Auto`(마스크)를 고르면 플러그인이 최근 도구 호출 기록에서 `low` / `high` / `max`를 스케줄링하여 API에 제출합니다. 또는 `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`를 수동으로 고정. 가벼운 도구 라운드는 가볍게, 무거운 작업도 추론 부족 없이.**

- [English README](./README.md)
> **v0.7.0-beta.1(2026-09-06): 단락 경로 폐지.** 이 릴리스는 `dsh-llm-openai-completions`에 의존하지 않습니다——게이트웨이 수정은 공식 `llm-pi-ai` compat 면(dsh ≥ v0.1.0-rc.8)으로 처리됩니다. 자세한 내용은 [CHANGELOG](./CHANGELOG.md).

- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [설치 안내](./INSTALL.ko.md)
- [English installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

> **호환성 참고:** `0.6.0`에는 일본어(`ja`)와 한국어(`ko`) 사전 및 선택 항목이 포함되어 있지만, 현재 공식 DSH는 `LocaleRuntime`을 통해 `zh`와 `en`만 제공합니다. 순정 DSH에서 `ja` 또는 `ko`를 선택하면 `locale "<id>" is not registered` 오류가 발생합니다. 공식 DSH가 해당 locale ID를 추가할 때까지 사용할 수 없습니다. 고급 사용자는 DSH 포크를 유지하면서 `packages/client/locale/src/locale-settings.ts`의 `LOCALE_IDS`와 `packages/client/locale/src/client/index.ts`의 `LOCALES` 라벨을 업데이트하고 핵심 사전과 테스트를 추가한 뒤 다시 빌드하여 실행할 수 있습니다. 이 플러그인만으로는 DSH의 전역 locale 목록을 확장할 수 없습니다.

> **버전 호환:** 본 릴리스는 **DSH ≥ 0.1.7-rc.1**만 지원. DSH 0.1.7은 명령형 설정 등록(`settings.register` / `installSettingsSection`)과 클라이언트 `settingsScope` 서비스 및 플러그인별 카드 슬롯을 제거했습니다——구 라인(3.0.x 이하)이 의존하던 표면은 더 이상 존재하지 않습니다. 0.1.2–0.1.6 호스트에서는 플러그인 3.0.1을 사용하세요. 3.1.0은 0.1.7 선언적 표면을 대상으로 합니다: 런타임 조정 가능한 설정 필드는 schemastery 스키마에 `.volatile()`로 표시되고, 설정 폼은 호스트가 스키마에서 자동 생성(등록 호출도 클라이언트 설정 카드도 없음)하며, 플러그인은 `loader/volatile-update`에 따라 요청마다 최신 값을 읽습니다.

멀티스텝 도구 체인에서 모델은 **모든 도구 호출 전에** 다시 생각합니다——그 사고가 벽시계 시간의 대부분을 차지합니다(50스텝 에이전트 작업은 도구 사이에 수 분의 추론을 쓸 수 있습니다). `dsh-thinking-levels`는 dsh가 매 스텝 다시 해석하는 `agent/request` waterfall(`prepend`로 최외곽에 등록하여 세션 모델 선택 어셈블리가 덮어쓰지 못하게 함)에 연결되어 다음 모델 요청에 사고 수준을 주입합니다.

## 수준

| 수준 | 의미 | 위치 |
|---|---|---|
| `off` | 사고 비활성화(수동 전용. 자동 스케줄링에서 선택되지 않음) | 모델 선택기 / 기본 수준 |
| `on` | 사고 활성화(토글 전용 모델용): `enable_thinking`만 전송하고 think effort는 전송하지 않음 | 모델 선택기 / 기본 수준 |
| `minimal` | 최소(매우 가벼운 작업) | 모델 선택기 / 기본 수준 |
| `low` | 단순 채팅 작업용 수동 낮음(가벼운 라운드는 가볍게 유지) | 모델 선택기 / 기본 수준 |
| `medium` | 중간 | 모델 선택기 / 기본 수준 |
| `high` | 공식 기본 수준 | 모델 선택기 / 기본 수준 |
| `xhigh` | 특별히 높음 | 모델 선택기 / 기본 수준 |
| `max` | 무거운 작업 | 모델 선택기 / 기본 수준 |
| `auto` | **마스크**: 최근 도구 호출 기록에서 스텝별로 스케줄링하고 제출 전에 구체적 수준으로 해석 | 모델 선택기(플러그인 주입) / 기본 수준 |

와이어 수준 사실(공식 DeepSeek 문서와 dsh의 `llm-deepseek` 어댑터로 확인): deepseek-v4-flash / v4-pro에서 `low`는 1:1로 유효하며 `medium` / `xhigh`는 `high`로 접힙니다. 어댑터는 `off | low | high | max`만 받고 그 외에는 `UNSUPPORTED_REASONING_EFFORT`로 거부합니다——`auto`는 플러그인의 마스크 계층으로 API에 절대 전송되지 않으며 주입 전에 항상 구체적 와이어 수준으로 해석됩니다. `on`은 **effort 수준이 아닙니다**: 토글 전용 모델(Qwen3.6 방식)만 광고하며 `enable_thinking`만 true로 만듭니다——`reasoning_effort`는 전송되지 않습니다. effort 지원 모델은 `on`을 광고하지 않으므로 수동으로 `on`을 골라도 제거됩니다.

## 사용자 지정 전송 값 매핑

`llm-pi-ai`에 수동 선언한 모델은 각 수준을 게이트웨이가 실제로 받아들이는 값으로 매핑할 수 있습니다(dsh-thinking-effort에서 차용): 수준을 체크하고 전송 값을 입력합니다(예: `high` → `ultra`). 매핑은 모델의 `reasoningEfforts` 테이블로 저장되며, Composer에서 `High`를 선택하면 게이트웨이에는 `ultra`가 전송됩니다. `off`를 비워 두면 전송되지 않습니다.

> 이 매핑의 시각적 편집기는 이전에 플러그인 설정 카드에 탑재되어 있었으나, DSH 0.1.7 마이그레이션에서 제거되었습니다(해당 슬롯 폐지). 공식 「모델」 설정 면에서 `reasoningEfforts` 테이블을 편집하세요——호스트 측 감지와 주입은 원래 그 설정을 라이브로 읽습니다.

- 공식 프리셋: `Off / High / Max`(공식 DeepSeek 방식)
- 일반 프리셋: `Off / Low / Medium / High`

## 모델 기능 가드(v0.5.0)

플러그인은 추론 기능을 선언하지 않은 모델에 `reasoning_effort`를 **절대 전송하지 않습니다**. 사용자 지정 openai-completions 라우트(예: `reasoningEfforts`가 없는 로컬 Qwen3.6)는 `ctx.llm.resolveModelInfo`로 비추론 모델로 분류되며, 상속·스케줄링 여부와 무관하게 모든 수준은 **제거**되어 전송되지 않습니다——dsh의 요청별 `UNSUPPORTED_REASONING_EFFORT` 거부가 발생하지 않습니다. 지원되지 않는 필드가 API에 전달되는 일은 없습니다.

| dsh 버전 | `low` 처리 |
|---|---|
| rc.6(구형) | 비네이티브: `models` 오버라이드로 확인된 경우에만 선택기에 표시. 표시(선택기 + 요청 검증) 후 그대로 통과 |
| rc.7+(신형) | 네이티브: 플러그인이 재작성하거나 재주입하지 않음. 수동 `low`는 그대로 통과 |

auto 스케줄러는 지원 모델에서 `low`를 선택할 수 있습니다——위 가드가 받을 수 없는 모델에서 멀어지게 합니다.

## 모델 선택기 Auto

세션 모델 선택기(모델 옆)에는 와이어 수준 뒤에 **Auto**가 표시됩니다(플러그인이 모델 디렉터리 메타데이터에 주입):

| 선택기 선택 | 동작 |
|---|---|
| **Auto** | 도구 기록 + 승격/강등 토글로 스케줄링하고 제출 전에 `low` / `high` / `max`로 해석 |
| `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max` | **수동 선택 우선**——플러그인 개입 없음(토글 전용 모델에서는 `on`이 `on`으로 유지되며 effort로 끌어올려지지 않고, effort 지원 모델에서는 제거됨) |
| 미선택 | 플러그인 기본 수준 적용(아래) |

## 자동 스케줄러

허브는 `high`(공식 기본값). `auto`는 `low` / `high` / `max` 사이에서만 스케줄링하며 `off`는 선택하지 않습니다.

| 최근 도구 호출 | 수준 |
|---|---|
| 없음(새 프롬프트, 순수 채팅) | `low` |
| ≥75% 단순 도구·작은 인자·강등 허용 | `low` |
| 혼합 / 무거운 도구 | `high` |
| 매우 무거운 페이로드·승격 허용 | `max` |

스케줄링 정책은 [dsh-tool-turbo](https://github.com/drscrewdriver/dsh-tool-turbo)와 동일한 소스입니다(같은 단순 도구 화이트리스트 / 페이로드 임계값 / 75% 비율 규칙).

## 설치

전체 절차(profile 확인, 업그레이드, 마이그레이션, 검증, 트러블슈팅)는 [INSTALL.ko.md](./INSTALL.ko.md)를 참조하세요. 빠른 시작:

```bash
# 1. npm에서 profile로 플러그인 설치(예: web. 아무 profile이나 가능)
#    (web profile은 pnpm workspace root이므로 -w 필수)
dsh plugin --profile web add dsh-thinking-levels -w
#    GitHub 버전:
#    dsh plugin --profile web add https://github.com/drscrewdriver/dsh-thinking-levels.git -w
#    로컬 경로 버전(네트워크 불필요):
#    dsh plugin --profile web add /absolute/path/to/dsh-thinking-levels

# 2. dsh web 재시작(실행 중인 인스턴스는 새 bundle 계층을 핫로드하지 않음)
dsh web
```

> 참고: dsh 런타임은 pnpm 11을 사용하며 새로 게시된 버전은 `minimumReleaseAge` 쿨링 기간의 대상입니다. `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`이 발생하면 `~/.dsh/profiles/web/pnpm-workspace.yaml`의 `minimumReleaseAgeExclude`에 버전을 추가하세요.

수동 `link:` 등록(`dsh plugin add` 대안):

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<dsh-thinking-levels 절대 경로>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

## 구성

두 표면이 같은 스키마를 공유합니다:

- **어셈블리** — profile 구성의 플러그인 행 `config:`(예: `cordis.yml`):
  ```yaml
  config:
    level: auto            # off | on | minimal | low | medium | high | xhigh | max | auto — 세션이 아무것도 고르지 않을 때의 기본 수준
    allowDowngrade: true   # 스케줄러가 `high` 아래로 내리는 것을 허용
    allowUpgrade: false    # 스케줄러가 `max`로 올리는 것을 금지
  ```
- **런타임** — 플러그인의 `.volatile()` 설정 필드(`enabled`, `level`, `allowDowngrade`, `allowUpgrade`): DSH 0.1.7이 선언된 스키마에서 「플러그인」 설정 폼을 생성하고, 확정된 변경은 라이브 설정 참조(`loader/volatile-update`)로 플러그인에 전달되어 다음 모델 요청부터 적용, 재시작 불필요. (`models`는 구성자 수준 필드로 유지: profile 구성에서 편집하세요.)

모델별 능력 오버라이드(`models`, 키는 `provider/model`)는 자동 감지 결과를 확정합니다. 구성자가 최종 결정권을 가집니다:

```yaml
config:
  level: auto
  models:
    llm-pi-ai/Qwen3.6-35B-A3B:   # 비-effort 사고 모델(사고 토글 + budget)
      vision: false
      thinking: true
      efforts: false             # reasoning_effort 전송 안 함(요청 시 제거)
    llm-pi-ai/Qwen3.8-27B:       # effort 지원 모델(rc.6 시대 어댑터에 low 없음)
      efforts: [low, high]       # low 확인 → 선택기 표시 + 통과
```

> Qwen 사고 on/off + budget은 **llm-pi-ai** 라우트에서 구성하세요:
> `compat.thinkingFormat: qwen`(→ 와이어 `enable_thinking` + `thinking_budget`, `thinkingBudgets` 경유), 또는 effort 모델(Qwen3.8-27B 등)에서는 `qwen-chat-template`(→ `chat_template_kwargs.enable_thinking`).

기본값: `{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false, models: {} }`.

> 의미: 모델 선택기 선택이 플러그인 기본 수준보다 우선합니다. `auto`(마스크) → 플러그인 스케줄링. 와이어 수준 → 직접 적용. 미선택 → 플러그인 `level` 기본값. `allowDowngrade` / `allowUpgrade`는 `auto` 스케줄링만 제약합니다.

## 공식 compat 면: 단락 도구 폐지(0.7.0-beta.1)

사용자 지정 게이트웨이가 사고를 선언하면, 본 플러그인은 **공식 `llm-pi-ai` compat 면**(dsh ≥ **v0.1.0-rc.8**)에 수정을 자동 기록합니다——[dsh-llm-openai-completions](https://github.com/drscrewdriver/dsh-llm-openai-completions)는 더 이상 필요하지 않으며, 제거된 상태를 유지하세요:

- 라우트 수준 `compat.supportsDeveloperRole: false`(`Unexpected message role` 400 수정)와 토글형 사고 모델에 대한 모델 수준 `compat.thinkingFormat: 'qwen-chat-template'`(`chat_template_kwargs.enable_thinking` 전송)을 자동 기록;
- 공식 설정 채널로 기록하며 dsh 스키마가 기록 시 검증(rc.8 미만은 거부 및 로그 경고); 명시적 값은 절대 덮어쓰지 않음;
- 응답 측 인라인 `<think>` 분할은 게이트웨이 책임(vLLM은 `--reasoning-parser qwen3`).

# 의존성

호스트 측은 `@deepseek-ai/dsh-settings`에 값 의존하지 않습니다——DSH 0.1.7부터 설정 등록 자체가 존재하지 않습니다: 설정 폼은 호스트가 플러그인 선언 schemastery 스키마(`.volatile()` 필드)에서 생성하고, 클라이언트 측은 dsh 런타임이 제공하는 `configForms` 서비스로 협력합니다. profile에 공식 패키지를 수동 설치할 필요가 없습니다. `dependencies`는 `@deepseek-ai/schemastery`뿐입니다(패키지와 함께 자동 설치).

## 개발

```bash
npm run lint        # eslint(typescript-eslint flat config)
npm run typecheck   # tsc --noEmit
npm test            # vitest — 46개 테스트
```

테스트 커버리지: 수준 정책(수동 통과·확장 수준, `on` 클램프, auto 스케줄러, 검증, 단순 도구 경계), 모델 기능 가드(`reasoningEffortSupported`, `resolveEffortInjection` 제거/통과), 세션 이벤트 파싱(가드, 창 상한, 잘못된 레코드), 구성 스키마(기본값 잠금, 범위 밖 거부, `models` 오버라이드), 인계 동기화(식별, 중복 제거 병합, 소프트 결합).

## 라이선스

MIT
