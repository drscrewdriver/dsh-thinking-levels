# 변경 기록

`dsh-thinking-levels`의 주요 변경 사항을 기록합니다.

- [English changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)
- [Changelog en français](./CHANGELOG.fr.md)
- [Changelog auf Deutsch](./CHANGELOG.de.md)
- [Changelog in italiano](./CHANGELOG.it.md)
- [Список изменений на русском](./CHANGELOG.ru.md)
- [Changelog en español](./CHANGELOG.es.md)

## [4.4.2] — 2026-10-19(카드 토글·가시 설명 — 사용자 피드백)

- 설정 카드의 체크박스(활성화/인수 마스터/강등 허용/승격 허용/모델 UI 인수)를 낙관적 횡형 알약 토글로 변경 — 클릭 즉시 반전, 쓰기 거부 시 롤백.
- 모델 UI 인수 행 아래에 상시 표시 설명 추가(기존엔 툴팁만): ON이 무엇을 대체하고 OFF가 무엇을 유지하며 auto 마스크는 양쪽 모두 계속 제공됨.

## [4.4.1] — 2026-10-19（takeoverUi 시트 감시 — 데스크톱 실측 피드백）

- 수정: `takeoverUi` 즉시 반영(새로고침 불필요). 4.4.0은 시트 inject 시 설정 미러를 1회만 읽어, 실제 호스트에서 설정 바인딩/미러 접힘보다 모델 시트 콜백이 먼저 실행되면 ON이어도 착석하지 않았다. 이제 웨이스트 바인딩과 모든 설정 변경 시 재평가하는 감시 방식으로 전환.
- 카드: takeoverUi 줄을 낙관적 횡형 알약 토글로 변경.

## [4.4.0] — 2026-10-19（issue 일괄 처리: #2 #3 #4 #5）

### 수정
- 기능 카드(#2): `api`가 openai-completions이 아닌 제공자에서는 Thinking / Supports-effort / thinkingFormat 컨트롤을 안내 문구와 함께 비활성화 — 잘못된 쓰기로 인한 `card.writeError` 제거(호스트 Responses 호환 게이트는 이 모델 필드를 제공하지 않음).
- 로딩 비용(#4): `resolveModel` 광고를 멱등화(WeakSet 가드). 기존에는 `llm/adapters-updated`마다 래퍼가 중첩되어 해석마다 전체 settings 읽기가 발생. readout 세대 캐시화, 설정 커밋 시 무효화, takeover 미러 재동기는 관련 namespace에서만 실행.
- 단계 chip(#5): `auto` 선택 시 chip은 **Auto**를 유지하고 해당 스텝의 해석 값은 `→ <level>` 보조 표기로 격하.

### 추가
- `takeoverUi` 설정(기본 OFF, #3/#4): 공식 모델 팝업 유지(검색·로딩은 네이티브, `auto`는 서버측 광고로 계속 제공). OFF일 때 공식 모델 컨텍스트 편집은 설정 카드로. ON이면 ModelPanel 인수 복원. 변경 후 새로고침 필요.
- ModelPanel 팝업 검색(#3): 4개 모델 초과 시 표시, 공식 규칙과 동일.

## [4.3.1] — 2026-10-17(호스트 열거 갱신: 0.2.1-rc.1 추가)

### Fixed
- `engines.dsh`와 7개의 `@deepseek-ai/dsh-*` peer에 `|| 0.2.1-rc.1` 추가(12항 정확 열거, 구간/caret 미사용). 호스트 호환 게이트가 DSH `0.2.1-rc.1`을 수락합니다.
- `dsh.plugin.json`의 `engines.dsh`도 동일한 12항 열거로 통일(게이트는 `package.json`만 읽지만 두 목록은 일치 필수).
- devDependencies `@deepseek-ai/dsh-client-*`를 0.2.0-rc.1 → 0.2.1-rc.1로 전환, 빌드·전체 테스트(140건) 대상 라인에서 검증.
- README 호환 서술(en/zh/ja/ko/de/es/fr/it/ru)을 열거와 동기화. 동작 변경 없음.

## [4.3.0] — 2026-10-17

### 추가
- 가격 카탈로그(src/price-catalog.ts): 29개 모델 x 지역 — DeepSeek V4.1-Flash / V4-Flash / V4-Pro는 공식 봉우/곡선 2단(베이징 09-12, 14-18 봉우리; 2026-08-17 시행), GLM / Kimi / Qwen / Doubao / MiniMax / Ernie는 평일 가격. 각 항목은 백만 토큰당 3개 슬롯(비캐시 입력 / 캐시 히트 입력 / 출력)과 asOf + 출처 표기를 가짐. 해외(USD) 항목은 구조만 확보, 공식 페이지 검증 전까지 의도적 비움(날조 없음).
- defaultPricing 설정(cn / global / custom / off, 기본 off): 카탈로그 밖 모델은 더 이상 Flash 가격으로 추정하지 않고 "미과금"으로 표시.
- 2026 국무원 공휴/보근 수정표(39항목, dsh-session-guard 와 동일 출처): 보근 주말은 평일처럼 봉우리의 대상, 법정 공휴는 종일 곡선. 표 밖 연도는 주말 규칙으로 축퇴.

### 변경
- 프로젝션 stateVersion 1 -> 2: 사용 샘플에 절입 시점 계산 전표를 영속화, 동일 단계 교체는 기록값 차감(혼합 요율 재계산·음수 제거), 합계는 통화별 버킷. 업그레이드 후 옛 세션은 현재 카탈로그로 재절입되어 총액이 한 번 변동, 이후 설정 변경은 신규 샘플에만 반영.
- 과금 팝오버: 통화별 기호(¥ / $, 미지는 ISO 코드), flat/null 정직한 표시, "모댔 기반 과금", 혼통화 세션은 합산 대신 통화별 행.

### 수정
- settings.describe() 모양 정규화(프로세스 내 배열 vs RPC ​​{namespaces:[...]} 봉투): 이상 모양은 예외 대신 결측 처리(조용한 동결 classe 해소).
- 프로젝션 등록 try/catch 보호: 과금 단위 실패가 플러그인 전체/콜드 세션 히스토리를 오염시키지 않음.

## [4.2.1] — 2026-10-12

### 변경 — 안정 버전 승격 (4.2.0-beta.29 이후 코드 변경 없음)

- **4.2.0-beta 라인을 안정 버전으로 승격.** beta.18 → beta.29 전체 내용(세대 간
  패밀리 섹션, 탭 스트립 줄바꿈, 구 plugins 페이지 카드 퇴역, 0.1.0-rc.8 콜드
  세션 수정) 포함. `engines.dsh`는 11개 호스트 라인 열거를 유지하며, npm
  `latest` 채널이 이제 멀티라인 안정 버전을 가리킵니다.
- **이중 매니페스트 불일치 수정:** `dsh.plugin.json`이 `4.2.0-beta.28`에
  머물러 있었음(beta.29 bump 누락) → 두 매니페스트 모두 4.2.1로 통일.

## [4.2.0-beta.28] — 2026-10-08

### 제거

- **구 plugins 페이지 항목 카드(`settings.plugin.item`) 퇴역.** ≤0.1.5 plugins
  페이지에서 패밀리 탭 카드와 중복되었음 — 이제 起子插件設定 패밀리 탭이 모든
  호스트 세대의 유일한 설정면이다.

## [4.2.0-beta.27] — 2026-10-08

### 수정

- **패밀리 탭 행이 컨테이너 폭에서 줄바꿈**: tablist의 `flexWrap: 'nowrap'` +
  `overflowX: 'auto'`(063d9fd의 단일 행 스트립 설계)를 `wrap`으로 바꾸고 버튼에서
  `flex: 0 0 auto` 제거. contributor 탭이 7개 이상이어도 가로 스크롤바 대신 다음
  행으로 흐릅니다(≤0.1.7 전 세대).

## [4.2.0-beta.26] — 2026-10-08

### 추가 — 크로스 버전 패밀리 섹션 (beta.18 → beta.26)

- **서버 측 레거시 설정 섹션(`installLegacySection`).** 패밀리 섹션(起子插件设置)은
  이제 `thinking-levels` 네임스페이스를 서버 측에 등록하여, 세 가지 세대 형태
  (모듈 수준 `installSettingsSection`, 인스턴스 `installSection`, rc.1+ 의
  loader-volatile)를 아우르며 호스트 ≤0.1.7 에서 실제 데이터로 렌더링됩니다.
  비휘발성 순수 `LegacyConfig` 스키마와 평탄화된 플레인 베이스를 사용(volatile
  노드도 라이브 ref 도 레거시 register 는 거부 — beta.18 → beta.22 에 걸쳐 세 겹으로
  쌓인 버그 수정).
- **패밀리 섹션 선출 강화 (beta.26).** `settings.section` 팩토리는 `dsh-family`
  엔트리가 이미 착석해 있으면(호스트 네이티브 면이나 경쟁자) 물러납니다: 등록
  순서와 무관하게 소유자는 정확히 하나. dsh-session-guard 4.1.11 의 지연 양보
  선출과 짝 — ≤0.1.7 셸은 동일 id 의 각 섹션에 고유한 내비 행을 부여하므로,
  이중 등록 = 이중의 起子插件设置 행이었습니다.
- **UI 수정 (beta.23 → beta.25).** 패밀리 탭 띠는 한 줄에 머무릅니다(가로
  스크롤; 8 개의 기여 탭이 마지막 하나를 두 번째 줄에 고아로 남기지 않음);
  설정 컨트롤은 셸의 다크 테마를 따름(하드코딩된 흰색 대신 반투명 면,
  `colorScheme` 은 body 밝기 원샷 측정에서); children 선언은 충돌을 허용하며
  없이 착지; 라이프사이클 디버그 로그는 프로덕션에 유지.

## [Unreleased]

### 추가 — 사고 레벨 슬라이더(고래소녀 러너 썸) — 4.1.0

- 각 행의 사고 레벨 `<select>`를 세그먼트 슬라이더로 개편: 스톱 수는 모델이 광고하는
  레벨에 적응, `auto`는 항상 최좌측, 썸은 포인터 연속 추적 후 놓을 때 스냅,
  ←/→/Home/End 지원, "공급자 기본값" 초기화는 ↺ 버튼으로 존속.
- DeepSeek 계열 행은 8프레임 측면 주행 입썸을 썸으로 사용(핑퐁 루프, 대기 720ms/드래그 중
  420ms, `prefers-reduced-motion` 시 정지). 소스: HanaAyane/dsh-reasoning-effort,
  `python tools/whale-mascot.py`로 재생성.
- `thinking-level`에 `orderEffortsForSlider` / `nearestEffortStopIndex` 추가(테스트 포함).

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
