# 変更履歴

`dsh-thinking-levels` の主な変更を記録します。

- [English changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)
- [Changelog en français](./CHANGELOG.fr.md)
- [Changelog auf Deutsch](./CHANGELOG.de.md)
- [Changelog in italiano](./CHANGELOG.it.md)
- [Список изменений на русском](./CHANGELOG.ru.md)
- [Changelog en español](./CHANGELOG.es.md)

## [4.2.0-beta.28] — 2026-10-08

### 削除

## [4.2.0-beta.27] — 2026-10-08

### 修正

- **ファミリータブ列がコンテナ幅で折り返される**ように：tablist の
  `flexWrap: 'nowrap'` + `overflowX: 'auto'`（063d9fd の単一行ストリップ設計）を
  `wrap` に変更し、ボタンから `flex: 0 0 auto` を除去。contributor タブが 7+ に
  増えても横スクロールバーではなく次の行に流れます（≤0.1.7 全世代）。

## [4.2.0-beta.26] — 2026-10-08

### 追加 — クロスバージョン・ファミリーセクション（beta.18 → beta.26）

- **サーバー側レガシー設定セクション（`installLegacySection`）。** ファミリー
  セクション（起子插件设置）は `thinking-levels` 名前空間をサーバー側で登録する
  ようになり、3 世代の生成形態（モジュールレベル `installSettingsSection`、
  インスタンス `installSection`、rc.1+ の loader-volatile）を横断してホスト
  ≤0.1.7 で実データ付きで描画されます。非 volatile の素の `LegacyConfig` スキーマ
  と、揺らぎを除去した素のベースを使用（volatile ノードもライブ ref もレガシー
  register は拒否 — beta.18 → beta.22 で三重に積み重なったバグを修正）。
- **ファミリーセクション選挙の強化（beta.26）。** `settings.section` ファクトリは、
  `dsh-family` エントリーが既に着席済みなら（ホストネイティブ面や競合）退避します：
  登録順序によらず所有者はちょうど 1 つ。dsh-session-guard 4.1.11 の遅延譲位選挙と
  対応 — ≤0.1.7 シェルは同 ID の各セクションに固有のナビ行を与えるため、二重登録＝
  二重の起子插件设置行でした。
- **UI 修正（beta.23 → beta.25）。** ファミリータブ帯は 1 行に収まるよう横スクロール化
  （8 枚の寄与タブが最後の 1 枚を第二行に孤立させない）；設定コントロールはシェルの
  ダークテーマに追従（白のハードコードを半透明面に、`colorScheme` は body 輝度の
  ワンショット計測から）；children 宣言は競合時に子なしで着地；ライフサイクルの
  デバッグログは本番に保持。

## [Unreleased]

### 追加 — 思考レベルスライダー（鲸魚娘ランナーつまみ） — 4.1.0

- 各行の思考レベル `<select>` をセグメントスライダーに改修：ストップ数はモデルの広告
  レベルに追従、`auto` は常に最左、つまみはポインターに連続追従・リリースでスナップ、
  ←/→/Home/End 対応、「プロバイダーの既定」リセットは ↺ ボタンとして存続。
- DeepSeek 系の行は 8 フレームの側面ランニング立絵をつまみに採用（ピンポンループ、静止
  720ms／ドラッグ中 420ms、`prefers-reduced-motion` で停止）。素材は
  HanaAyane/dsh-reasoning-effort 提供、`python tools/whale-mascot.py` で再生成。
- `thinking-level` に `orderEffortsForSlider` / `nearestEffortStopIndex` を追加（テスト付き）。

## [4.0.0] — 2026-09-29

### 変更 — DSH 0.2.0-rc 互換

- **peer ゲートを 0.2.0-rc セグメントに再設定。** 7 件すべての `@deepseek-ai/dsh-*` peer 宣言と
  `engines.dsh` を `>=0.2.0-rc.1 <0.2.1-0` に変更（旧 `>=0.1.7-rc.1 <0.1.8-0` から）。0.1.7-rc.1〜
  <0.2.0 のホストは 3.x ライン（npm dist-tag `dsh-0.1.7`、3.4.3）を、0.1.7-rc.1 未満のホストは
  3.0.2 を使用してください。
- **devDependencies を 0.2.0 ラインへ移行** — `dsh-client-locale` / `dsh-client-ui-renderer` /
  `dsh-client-ui-settings` / `dsh-client-ui-slots` / `dsh-client-store` → `0.2.0-rc.1`、および
  `@deepseek-ai/cordis` → `^4.0.4`（0.2.0-rc.1 クライアントパッケージの `~4.0.4` peer 要件）——
  これにより typecheck / テスト / ビルドが実際の 0.2.0-rc.1 型に対して実行されます。
- **メタデータ整合：** `dsh.plugin.json` の version と `engines.dsh` を 4.0.0 と 0.2.0-rc セグメントに
  同期；`publishConfig.tag` → `dsh-0.2.0` と新規 `release:4x` スクリプトで、公開が `dsh-0.1.7` /
  `latest` タグを上書きしないことを保証；両 lockfile（`package-lock.json` / `pnpm-lock.yaml`）を
  0.2.0 依存ツリーに対して再生成。
- **host 側・client 側ともコード変更なし。** 本プラグインが import するパッケージ
  （`dsh-client-locale`、`dsh-client-store`、`dsh-client-ui-renderer`、`dsh-client-ui-settings`、
  `dsh-client-ui-slots`）は 0.1.7-rc.2 → 0.2.0-rc.1 間でパッケージバージョンのみ変動；
  `settings` / `llm` サービス面と `llm-pi-ai` アダプタも未変更。全スイート
  （lint / typecheck / 71 テスト / ビルド）が 0.2.0-rc.1 に対して無変更で通過。

### 修正 — プラグイン設定の二重表示 — 2.0.0-beta.4

- **`settings.plugins.tab` 登録を削除。** 0.1.5 互換作業では DSH 0.1.5 が `settings.plugin.item` スロットを廃止したと想定していましたが、リリース済みの 0.1.5-rc.2（および 0.1.6-alpha.1）の `ui-settings-plugins` は内蔵の設定タブの子として同スロットを維持しています。両スロットが宣言されているため 2 つの登録が同時に発火し、設定 → プラグインに項目カードと専用タブの 2 つが表示されていました。項目カードだけで全サポート線をカバーできるため、タブ登録（および `ctx.locale.bind` のラベル thunk）を削除しました。

## [0.7.0-beta.1] — 2026-09-06

> **ベータ版：ショートサーキット経路の廃止。** 本リリースは `dsh-llm-openai-completions`（および一切の transport 引き継ぎサイドパス）に依存しません。すべてのゲートウェイ修正は公式 `llm-pi-ai` compat 面（**dsh v0.1.0-rc.8** 以降で利用可能）に乗ります。

### 削除
- ショートサーキット引き継ぎブリッジを削除（`llm-openai-completions` リストの維持を停止）。アダプタープラグインは不要です。

### 変更
- 自動 compat ブリッジを公式 compat 面へ書き直し：ルートレベル `compat.supportsDeveloperRole: false` と、トグル型思考モデルへのモデルレベル `compat.thinkingFormat: 'qwen-chat-template'`（素の vLLM はトップレベル `enable_thinking` を無視するため）。
- 能力カードからショートサーキットを排除：「ゲートウェイは developer ロール非対応」スイッチに置き換え、引き継ぎリストの門控を廃止し、思考＋視覚 → effort 対応 → effort エディタの段階的 UI に変更。
- `declaresThinking` が `modelOverrides` も走査。

### 備考
- dsh ≥ v0.1.0-rc.8 が必要。応答側のインライン `<think>` 分割はゲートウェイ側の課題（vLLM は `--reasoning-parser qwen3`）。

## [0.7.0] — 2026-08-30

### 追加

- **マルチレベル コンテキストウィンドウ プリセット**（モデル別能力エディター）：`64K / 128K / 256K / 400K / 512K / 1M` のプリセットボタンに加え、カスタム整数入力とクリアボタンを追加。`llm-pi-ai` モデルの `contextWindow` に書き込まれ、ハーネスが次のリクエストから再起動なしでライブに消費します（圧縮 / コンテキストオーバーフロー検出 / コンテキスト圧力予測）。
- 新しい純粋モジュール `src/context-window.ts`（範囲定数 `2000`–`1_000_000`、プリセット一覧、`formatContextWindow`、`validateContextWindow`）を追加。設定スキーマ、設定カード、テストで共有されます。
- 設定面：`models[].contextWindow` オーバーライドを整数 `2000`–`1000000` の検証付きで受け付けます（範囲外の値は fail-loud）。
- コンテキストウィンドウコントロールの `zh` / `en` / `ja` / `ko` コピーを追加。

### 変更

- コンテキストバッジが共有の `formatContextWindow` を再利用するように変更。書き込まれたプリセットがそのまま表示されます（例：`256000` → `256K`、`1000000` → `1M`）。

## [0.6.0] — 2026-02-?

### 追加

- **8 つの標準レベル**（dsh-thinking-effort に合わせて）：`off / on / minimal / low / medium / high / xhigh / max`（+ `auto` スケジューラーマスク）。`on` は思考有効化トグルで、モデルの既定強度（`high` または最高の宣言済み思考レベル）にクランプされます。`minimal` / `medium` / `xhigh` はカスタムゲートウェイが宣言していれば透過し、公式アダプターでは `high` に畳み込まれます。
- **設定カードのカスタム送信値マッピング**（dsh-thinking-effort から借用）：各レベルにチェックを入れ、ゲートウェイに送信する値を入力（例：`high` → `ultra`）。`off` を空欄にすると送信されません。モデルの `reasoningEfforts` テーブルとして保存されます。
- **設定カードの表示刷新**（dsh-thinking-effort から借用）：プロバイダーがモデルをグループ化し、各モデル行はテキスト/画像/コンテキストバッジを表示、モデルはレベル別エディターに展開、検索ボックスでモデルを絞り込み、ワンクリックプリセット（公式 DeepSeek 形式 / 汎用）を全思考モデルに適用。
- **多言語対応**：日本語（`ja`）と韓国語（`ko`）の辞書、`README.ja.md` / `README.ko.md`、`INSTALL.{md,zh,ja,ko}.md`、`CHANGELOG.{md,ja,ko}.md`。注：公式 DSH の locale ランタイムはまだ `zh` / `en` のみ公開しているため、`ja` / `ko` の選択には DSH フォークが必要です（README の互換性注記を参照）。

### 変更

- `level` 設定面は 9 値すべてを受け付けます（`off | on | minimal | low | medium | high | xhigh | max | auto`）。
- `models[].efforts` オーバーライドは拡張レベルを受け付けます。
- カードレンダラーをリファクタリング。能力エディターは即時チェックボックスコミットではなく、明示的な「レベルを適用」ボタン付きのステージ型ワイヤードラフトを使用します。

### 修正

- 未使用ヘルパー `effortLevelsOf` を削除。レガシー `_N` 未使用パラメータの lint 警告を抑制。

## [0.5.2] — 2026-02-?

### 追加

- **`dsh-llm-openai-completions` の自動引き継ぎ**：カスタム openai-completions ゲートウェイ（`api: openai-completions` または非公式 baseURL）**かつ** いずれかのモデルが `reasoningEfforts` テーブルを宣言する provider を `llm-openai-completions.providers` に `enabled: true` でマージ。プラグイン起動、`llm/adapters-updated`、設定変更時に実行。ソフト結合（名前空間未登録なら書き込みをスキップ）。

## [0.5.1] — 2026-02-?

### 追加

- モデル能力エディターカード：すべてのカスタム `llm-pi-ai` プロバイダーモデルに視覚 / 思考 / effort サポート / effort レベル / 思考形式を提供し、`llm-pi-ai` 設定名前空間へ直接書き込み（公式パッケージの変更なし）。

## [0.5.0] — 2026-02-?

### 追加

- モデル能力ガード：推論能力を宣言していないモデルに `reasoning_effort` を送信しない（Qwen3.6 などのカスタム openai-completions ルートは除去）。
- dsh rc.7+ での `low` 透過。rc.6 時代のアダプターは構成者が確認した `models` オーバーライドで `low` を広告可能。
- `models` 設定セクション（`provider/model` → `vision` / `thinking` / `efforts`）。

## [0.4.1] — 2026-02-?

### 修正

- adapter `resolveModel` のラップが `llm/adapters-updated` で再実行されるようにし、アダプターがプラグイン適用後に登録されても `Auto` マスクが表示されるように。

## [0.4.0] — 2026-02-?

### 変更

- `@deepseek-ai/dsh-settings` への値依存を撤廃。設定登録は cordis `settings` サービス経由（ローカルの `installSettingsSection` 相当）。
- カード登録に `id` と `key` の両方を指定し、CLI（keyed）と DSH Desktop（list）の slot 宣言の両方で動作。

## [0.3.0] — 2026-02-?

### 追加

- モデルセレクターの `Auto`（マスク）：adapter `resolveModel` の efforts に注入。プラグインが `agent/request` waterfall（`prepend` 登録）で `low` / `high` / `max` をステップごとにスケジュール。

## [0.2.1] — 2026-02-?

### 修正

- `exports["./client"]` を追加し、dsh の client-modules ローダーが client bundle を発見できるように。

## [0.2.0] — 2026-02-?

### 追加

- 最初の client 設定カード（レベルピッカー + スケジューラートグル）。

## [0.1.1] — 2026-02-?

### 修正

- 生の TS ソースではなくコンパイル済み `lib/` を公開（Node 22 は `node_modules` 配下の `.ts` の type-stripping を禁止）。

## [0.1.0] — 2026-02-?

### 追加

- 初回リリース：固定 reasoning effort の `agent/request` 注入。
