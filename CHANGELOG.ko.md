# 변경 기록

`dsh-thinking-levels`의 주요 변경 사항을 기록합니다.

- [English changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

## [Unreleased]

## [4.0.0] — 2026-09-29

### 변경 — DSH 0.2.0-rc 호환

- **peer 게이트를 0.2.0-rc 세그먼트로 재설정.** 7개 모든 `@deepseek-ai/dsh-*` peer 선언과
  `engines.dsh`를 `>=0.2.0-rc.1 <0.2.1-0`으로 변경(기존 `>=0.1.7-rc.1 <0.1.8-0`에서). 0.1.7-rc.1~
  <0.2.0 호스트는 3.x 라인(npm dist-tag `dsh-0.1.7`, 3.4.3)을, 0.1.7-rc.1 미만 호스트는 3.0.2를
  사용하세요.
- **devDependencies를 0.2.0 라인으로 이동** — `dsh-client-locale` / `dsh-client-ui-renderer` /
  `dsh-client-ui-settings` / `dsh-client-ui-slots` / `dsh-client-store` → `0.2.0-rc.1`, 그리고
  `@deepseek-ai/cordis` → `^4.0.4`(0.2.0-rc.1 클라이언트 패키지의 `~4.0.4` peer 요구)——이로써
  typecheck / 테스트 / 빌드가 실제 0.2.0-rc.1 타입으로 실행됩니다.
- **메타데이터 정합성:** `dsh.plugin.json`의 version과 `engines.dsh`를 4.0.0 및 0.2.0-rc 세그먼트로
  동기화; `publishConfig.tag` → `dsh-0.2.0` 및 신규 `release:4x` 스크립트로 게시가 `dsh-0.1.7` /
  `latest` 태그를 덮어쓰지 않음을 보장; 두 lockfile(`package-lock.json` / `pnpm-lock.yaml`)을
  0.2.0 의존성 트리로 재생성.
- **host 측·client 측 코드 변경 없음.** 본 플러그인이 import하는 패키지(`dsh-client-locale`,
  `dsh-client-store`, `dsh-client-ui-renderer`, `dsh-client-ui-settings`, `dsh-client-ui-slots`)는
  0.1.7-rc.2 → 0.2.0-rc.1 사이에서 패키지 버전만 변동; `settings` / `llm` 서비스 면과 `llm-pi-ai`
  어댑터도 미변경. 전체 스위트(lint / typecheck / 71 테스트 / 빌드)가 0.2.0-rc.1 대상으로 무변경
  통과.

### 수정 — 플러그인 설정 중복 표시 — 2.0.0-beta.4

- **`settings.plugins.tab` 등록 제거.** 0.1.5 호환 작업에서 DSH 0.1.5가 `settings.plugin.item` 슬롯을 폐지했다고 가정했지만, 릴리스된 0.1.5-rc.2(및 0.1.6-alpha.1)의 `ui-settings-plugins`는 내장 구성 탭의 자식으로 해당 슬롯을 유지합니다. 두 슬롯이 모두 선언되어 두 등록이 동시에 발화했고, 설정 → 플러그인에 항목 카드와 전용 탭이 함께 표시되었습니다. 항목 카드만으로 전체 지원 라인을 커버할 수 있으므로 탭 등록(및 `ctx.locale.bind` 라벨 thunk)을 제거했습니다.

## [0.7.0-beta.1] — 2026-09-06

> **베타: 단락(short-circuit) 경로 폐지.** 이 릴리스는 `dsh-llm-openai-completions`(및 모든 transport 인계 사이드 경로)에 의존하지 않습니다. 모든 게이트웨이 수정은 공식 `llm-pi-ai` compat 면(**dsh v0.1.0-rc.8** 이상)으로 처리됩니다.

### 삭제
- 단락 인계 브리지 제거(`llm-openai-completions` 목록 유지 중단). 어댑터 플러그인은 더 이상 필요하지 않습니다.

### 변경
- 자동 compat 브리지를 공식 compat 면으로 재작성: 라우트 수준 `compat.supportsDeveloperRole: false` 및 토글형 사고 모델에 대한 모델 수준 `compat.thinkingFormat: 'qwen-chat-template'`(순수 vLLM은 최상위 `enable_thinking`을 무시).
- 기능 카드에서 단락 제거: 「게이트웨이가 developer 역할 미지원」스위치로 교체, 인계 목록 게이팅 폐지, 사고+시각 → effort 지원 → effort 편집기의 점진적 UI로 변경.
- `declaresThinking`이 `modelOverrides`도 스캔.

### 비고
- dsh ≥ v0.1.0-rc.8 필요. 응답 측 인라인 `<think>` 분할은 게이트웨이 문제(vLLM은 `--reasoning-parser qwen3`).

## [0.7.0] — 2026-08-30

### 추가

- **다중 수준 컨텍스트 창 프리셋**(모델별 기능 편집기): `64K / 128K / 256K / 400K / 512K / 1M` 프리셋 버튼과 사용자 지정 정수 입력 및 지우기 버튼. `llm-pi-ai` 모델의 `contextWindow`에 기록되고 하네스가 다음 요청부터 재시작 없이 라이브로 소비합니다(압축 / 컨텍스트 오버플로 감지 / 컨텍스트 압력 예측).
- 새 순수 모듈 `src/context-window.ts`(범위 상수 `2000`–`1_000_000`, 프리셋 목록, `formatContextWindow`, `validateContextWindow`)를 추가했습니다. 설정 스키마, 설정 카드, 테스트에서 공유합니다.
- 구성 표면: `models[].contextWindow` 오버라이드를 정수 `2000`–`1000000` 검증과 함께 허용합니다(범위 밖 값은 fail-loud).
- 컨텍스트 창 컨트롤의 `zh` / `en` / `ja` / `ko` 문구를 추가했습니다.

### 변경

- 컨텍스트 배지가 공유 `formatContextWindow`를 재사용하여 기록된 프리셋이 그대로 표시됩니다(예: `256000` → `256K`, `1000000` → `1M`).

## [0.6.0] — 2026-02-?

### 추가

- **8개 표준 수준**(dsh-thinking-effort에 맞춤): `off / on / minimal / low / medium / high / xhigh / max`(+ `auto` 스케줄러 마스크). `on`은 사고 활성화 토글로 모델 기본 강도(`high` 또는 가장 높은 선언 사고 수준)로 클램프됩니다. `minimal` / `medium` / `xhigh`는 사용자 지정 게이트웨이가 선언하면 통과하고 공식 어댑터에서는 `high`로 접힙니다.
- **설정 카드의 사용자 지정 전송 값 매핑**(dsh-thinking-effort에서 차용): 각 수준을 체크하고 게이트웨이에 보낼 값을 입력(예: `high` → `ultra`). `off`를 비워 두면 전송되지 않습니다. 모델의 `reasoningEfforts` 테이블로 저장됩니다.
- **설정 카드 표시 개편**(dsh-thinking-effort에서 차용): 제공자가 모델을 그룹화하고, 각 모델 행은 텍스트/이미지/컨텍스트 배지를 표시하며, 모델을 펼치면 수준별 편집기가 되고, 검색 상자로 모델을 필터링하며, 원클릭 프리셋(공식 DeepSeek 방식 / 일반 방식)을 모든 사고 모델에 적용합니다.
- **다국어 지원**: 일본어(`ja`)와 한국어(`ko`) 사전, `README.ja.md` / `README.ko.md`, `INSTALL.{md,zh,ja,ko}.md`, `CHANGELOG.{md,ja,ko}.md`. 참고: 공식 DSH locale 런타임은 아직 `zh` / `en`만 제공하므로 `ja` / `ko` 선택에는 DSH 포크가 필요합니다(README 호환성 참고 참조).

### 변경

- `level` 구성 표면이 9개 값 전체를 받습니다(`off | on | minimal | low | medium | high | xhigh | max | auto`).
- `models[].efforts` 오버라이드가 확장 수준을 받습니다.
- 카드 렌더러 리팩터링. 능력 편집기는 즉시 체크박스 커밋 대신 명시적「수준 적용」버튼이 있는 스테이지형 와이어 드래프트를 사용합니다.

### 수정

- 미사용 헬퍼 `effortLevelsOf` 제거. 레거시 `_N` 미사용 매개변수 lint 경고 억제.

## [0.5.2] — 2026-02-?

### 추가

- **`dsh-llm-openai-completions` 자동 인계**: 사용자 지정 openai-completions 게이트웨이(`api: openai-completions` 또는 비공식 baseURL) **그리고** 어떤 모델이 `reasoningEfforts` 테이블을 선언한 provider를 `llm-openai-completions.providers`에 `enabled: true`로 병합. 플러그인 시작, `llm/adapters-updated`, 설정 변경 시 실행. 소프트 결합(네임스페이스 미등록이면 쓰기 건너뜀).

## [0.5.1] — 2026-02-?

### 추가

- 모델 기능 편집기 카드: 모든 사용자 지정 `llm-pi-ai` 제공자 모델에 시각 / 사고 / effort 지원 / effort 수준 / 사고 형식을 제공하고 `llm-pi-ai` 설정 네임스페이스에 직접 기록(공식 패키지 변경 없음).

## [0.5.0] — 2026-02-?

### 추가

- 모델 기능 가드: 추론 기능을 선언하지 않은 모델에 `reasoning_effort`를 보내지 않음(Qwen3.6 등 사용자 지정 openai-completions 라우트는 제거).
- dsh rc.7+에서 `low` 통과. rc.6 시대 어댑터는 구성자가 확인한 `models` 오버라이드로 `low`를 광고 가능.
- `models` 구성 섹션(`provider/model` → `vision` / `thinking` / `efforts`).

## [0.4.1] — 2026-02-?

### 수정

- adapter `resolveModel` 래핑이 `llm/adapters-updated`에서 다시 실행되어 어댑터가 플러그인 적용 후 등록되어도 `Auto` 마스크가 표시됩니다.

## [0.4.0] — 2026-02-?

### 변경

- `@deepseek-ai/dsh-settings` 값 의존성 제거. 설정 등록은 cordis `settings` 서비스 경유(로컬 `installSettingsSection` 동등물).
- 카드 등록에 `id`와 `key`를 모두 지정하여 CLI(keyed)와 DSH Desktop(list) slot 선언 모두에서 작동.

## [0.3.0] — 2026-02-?

### 추가

- 모델 선택기 `Auto`(마스크): adapter `resolveModel` efforts에 주입. 플러그인이 `agent/request` waterfall(`prepend` 등록)에서 `low` / `high` / `max`를 스텝별로 스케줄링.

## [0.2.1] — 2026-02-?

### 수정

- `exports["./client"]` 추가로 dsh의 client-modules 로더가 client bundle을 발견.

## [0.2.0] — 2026-02-?

### 추가

- 첫 client 설정 카드(수준 선택기 + 스케줄러 토글).

## [0.1.1] — 2026-02-?

### 수정

- 원본 TS 소스 대신 컴파일된 `lib/`를 게시(Node 22는 `node_modules` 아래 `.ts`의 type-stripping 금지).

## [0.1.0] — 2026-02-?

### 추가

- 최초 릴리스: 고정 reasoning effort의 `agent/request` 주입.
