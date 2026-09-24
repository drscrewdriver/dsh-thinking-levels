# dsh-thinking-levels

**[DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 向けのラウンド単位思考レベル（`reasoning_effort`）制御：セッションのモデルセレクターで `Auto`（マスク）を選ぶと、プラグインが直近のツール呼び出し履歴から `low` / `high` / `max` をスケジュールして API に提出します。あるいは `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max` を手動で固定。軽いツールラウンドは軽いまま、重い作業も推論不足になりません。**

- [English README](./README.md)
> **v0.7.0-beta.1（2026-09-06）：ショートサーキット経路の廃止。** 本リリースは `dsh-llm-openai-completions` に依存しません——ゲートウェイ修正は公式 `llm-pi-ai` compat 面（dsh ≥ v0.1.0-rc.8）に乗ります。詳しくは [CHANGELOG](./CHANGELOG.md)。

- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [インストールガイド](./INSTALL.ja.md)
- [English installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

> **互換性について：** `0.6.0` には日本語（`ja`）と韓国語（`ko`）の辞書と選択項目が含まれていますが、現在の公式 DSH は `LocaleRuntime` 経由で `zh` と `en` のみを提供しています。純正 DSH で `ja` または `ko` を選択すると `locale "<id>" is not registered` で失敗します。公式 DSH が対応 locale ID を追加するまで利用できません。上級ユーザーは DSH フォークを保守し、`packages/client/locale/src/locale-settings.ts` の `LOCALE_IDS` と `packages/client/locale/src/client/index.ts` の `LOCALES` ラベルを更新し、コア辞書とテストを追加して再ビルド・実行してください。このプラグインだけでは DSH のグローバル locale 一覧を拡張できません。

> **バージョン互換：** 本リリースは **DSH ≥ 0.1.7-rc.1** のみに対応。DSH 0.1.7 は命令的な設定登録（`settings.register` / `installSettingsSection`）とクライアントの `settingsScope` サービスおよびプラグイン別カードスロットを削除しました——旧ライン（3.0.x 以前）が依存する表面は存在しません。0.1.2–0.1.6 ホストではプラグイン 3.0.1 を使用してください。3.1.0 は 0.1.7 の宣言的表面を対象とします：実行時に変更できる設定フィールドは schemastery スキーマで `.volatile()` 付きとし、設定フォームはホストがスキーマから自動生成（登録呼び出しもクライアント設定カードも不要）、プラグインは `loader/volatile-update` に従ってリクエストごとに最新値を読みます。

マルチステップのツールチェーンでは、モデルは**ツール呼び出しのたびに**再思考します——その思考がウォールクロック時間の大半を占めます（50 ステップのエージェントタスクはツール間に数分の推論を費やし得ます）。`dsh-thinking-levels` は、dsh が毎ステップ再解決する `agent/request` waterfall（`prepend` で最外層に登録し、セッションのモデル選択アセンブリに上書きされないようにする）に接続し、次のモデルリクエストに思考レベルを注入します。

## レベル

| レベル | 意味 | 場所 |
|---|---|---|
| `off` | 思考無効（手動のみ。自動スケジュールでは選択されません） | モデルセレクター / 既定レベル |
| `on` | 思考有効化（トグルのみのモデル向け）：`enable_thinking` のみ送信し、think effort は送信しません | モデルセレクター / 既定レベル |
| `minimal` | 最小（非常に軽いタスク） | モデルセレクター / 既定レベル |
| `low` | シンプルなチャットタスク用の手動低レベル（軽いラウンドは軽いまま） | モデルセレクター / 既定レベル |
| `medium` | 中 | モデルセレクター / 既定レベル |
| `high` | 公式既定レベル | モデルセレクター / 既定レベル |
| `xhigh` | 特高 | モデルセレクター / 既定レベル |
| `max` | 重い作業 | モデルセレクター / 既定レベル |
| `auto` | **マスク**：直近のツール呼び出し履歴からステップごとにスケジュールし、提出前に具体レベルへ解決 | モデルセレクター（プラグインが注入）/ 既定レベル |

ワイヤーレベルの事実（公式 DeepSeek ドキュメントと dsh の `llm-deepseek` アダプターで確認）：deepseek-v4-flash / v4-pro では `low` が 1:1 で有効、`medium` / `xhigh` は `high` に畳み込まれます。アダプターは `off | low | high | max` のみ受け付け、それ以外は `UNSUPPORTED_REASONING_EFFORT` で拒否します——`auto` はプラグインのマスク層で、API には送信されず、注入前に必ず具体的なワイヤーレベルへ解決されます。`on` は **effort レベルではありません**：トグルのみのモデル（Qwen3.6 形式）だけが広告し、`enable_thinking` を true にするだけ——`reasoning_effort` は送信されません。effort 対応モデルは `on` を広告しないため、手動で `on` を選んでも除去されます。

## カスタム送信値マッピング

`llm-pi-ai` で手動宣言したモデルでは、各レベルをゲートウェイが実際に受け付ける値にマッピングできます（dsh-thinking-effort から借用）：レベルにチェックを入れ、送信値を入力します（例：`high` → `ultra`）。マッピングはモデルの `reasoningEfforts` テーブルとして保存され、Composer で `High` を選ぶとゲートウェイには `ultra` が送信されます。`off` を空欄にすると送信されません。

> このマッピングのビジュアルエディターは以前プラグイン設定カードに搭載されていましたが、DSH 0.1.7 移行で削除しました（対応スロットが廃止されたため）。公式の「モデル」設定面から `reasoningEfforts` テーブルを編集してください——host 側の検出と注入はもともとその設定をライブで読みます。

- 公式プリセット：`Off / High / Max`（公式 DeepSeek 形式）
- 汎用プリセット：`Off / Low / Medium / High`

## モデル能力ガード（v0.5.0）

このプラグインは、推論能力を宣言していないモデルに `reasoning_effort` を**送信しません**。カスタム openai-completions ルート（例：`reasoningEfforts` のないローカル Qwen3.6）は `ctx.llm.resolveModelInfo` で非推論モデルと判定され、継承・スケジュールを問わずすべてのレベルは**除去**されて送信されません——dsh のリクエスト毎 `UNSUPPORTED_REASONING_EFFORT` 拒否は発生しません。サポートされないフィールドが API に渡されることはありません。

| dsh バージョン | `low` の扱い |
|---|---|
| rc.6（旧） | 非ネイティブ：`models` オーバーライドで確認された場合のみセレクターに表示。表示（セレクター + リクエスト検証）後にそのまま透過 |
| rc.7+（新） | ネイティブ：プラグインは書き換えも再注入もしません。手動 `low` はそのまま透過 |

auto スケジューラーは対応モデルで `low` を選ぶことがあります——上記の能力ガードが受け取れないモデルから遠ざけます。

## モデルセレクターの Auto

セッションのモデルセレクター（モデルの横）には、ワイヤーレベルの後に **Auto** が表示されます（プラグインがモデルディレクトリのメタデータに注入）：

| セレクター選択 | 動作 |
|---|---|
| **Auto** | ツール履歴 + 昇降トグルでスケジュールし、提出前に `low` / `high` / `max` へ解決 |
| `off` / `on` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max` | **手動選択が優先**——プラグインは介入しません（トグルのみのモデルでは `on` は `on` のまま。effort へ引き上げられず、effort 対応モデルでは除去されます） |
| 未選択 | プラグインの既定レベルが適用されます（下記） |

## 自動スケジューラー

ハブは `high`（公式既定）。`auto` は `low` / `high` / `max` の間でのみスケジュールし、`off` は選びません。

| 直近のツール呼び出し | レベル |
|---|---|
| なし（新しいプロンプト、純粋なチャット） | `low` |
| ≥75% がシンプルなツール・小さい引数・降格許可 | `low` |
| 混合 / 重いツール | `high` |
| 非常に重いペイロード・昇格許可 | `max` |

スケジュールポリシーは [dsh-tool-turbo](https://github.com/drscrewdriver/dsh-tool-turbo) と同源です（同じシンプルツールのホワイトリスト / ペイロード閾値 / 75% 比率ルール）。

## インストール

完全な手順（profile の確認、アップグレード、移行、検証、トラブルシューティング）は [INSTALL.ja.md](./INSTALL.ja.md) を参照してください。クイックスタート：

```bash
# 1. npm から profile へプラグインをインストール（例は web。任意の profile で可）
#    （web profile は pnpm workspace root なので -w が必須）
dsh plugin --profile web add dsh-thinking-levels -w
#    GitHub 版：
#    dsh plugin --profile web add https://github.com/drscrewdriver/dsh-thinking-levels.git -w
#    ローカルパス版（ネットワーク不要）：
#    dsh plugin --profile web add /absolute/path/to/dsh-thinking-levels

# 2. dsh web を再起動（実行中のインスタンスは新しい bundle 層をホットロードしない）
dsh web
```

> 注意：dsh ランタイムは pnpm 11 を使用し、新規公開バージョンは `minimumReleaseAge` のクーリング期間の対象です。`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` が発生したら、`~/.dsh/profiles/web/pnpm-workspace.yaml` の `minimumReleaseAgeExclude` にバージョンを追加してください。

手動 `link:` 登録（`dsh plugin add` の代替）：

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<dsh-thinking-levels の絶対パス>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

## 設定

2 つの面が同じスキーマを共有します：

- **アセンブリ** — profile 構成のプラグイン行の `config:`（例：`cordis.yml`）：
  ```yaml
  config:
    level: auto            # off | on | minimal | low | medium | high | xhigh | max | auto — セッションが何も選ばないときの既定レベル
    allowDowngrade: true   # スケジューラーが `high` より下へ下げるのを許可
    allowUpgrade: false    # スケジューラーが `max` へ上げるのを禁止
  ```
- **ランタイム** — プラグインの `.volatile()` 設定フィールド（`enabled`、`level`、`allowDowngrade`、`allowUpgrade`）：DSH 0.1.7 が宣言されたスキーマから「プラグイン」設定フォームを生成し、確定した変更はライブ設定参照（`loader/volatile-update`）としてプラグインへ届き、次のモデルリクエストから有効、再起動不要。（`models` は設定者レベルのフィールドのまま：プロファイル構成で編集してください。）

モデル毎の能力オーバーライド（`models`、キーは `provider/model`）は自動検出の結果を確定します。構成者が最終判断します：

```yaml
config:
  level: auto
  models:
    llm-pi-ai/Qwen3.6-35B-A3B:   # 非 effort 思考モデル（思考トグル + budget）
      vision: false
      thinking: true
      efforts: false             # reasoning_effort を送信しない（リクエスト時に除去）
    llm-pi-ai/Qwen3.8-27B:       # effort 対応モデル（rc.6 時代のアダプターに low なし）
      efforts: [low, high]       # low を確認 → セレクター表示 + 透過
```

> Qwen の思考オン/オフ + budget は **llm-pi-ai** ルート側で設定します：
> `compat.thinkingFormat: qwen`（→ ワイヤー `enable_thinking` + `thinking_budget`、`thinkingBudgets` 経由）、または effort モデル（Qwen3.8-27B 等）では `qwen-chat-template`（→ `chat_template_kwargs.enable_thinking`）。

既定値：`{ enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false, models: {} }`。

> 意味：モデルセレクターの選択はプラグインの既定レベルより優先されます。`auto`（マスク）→ プラグインがスケジュール。ワイヤーレベル → 直接適用。未選択 → プラグインの `level` 既定値。`allowDowngrade` / `allowUpgrade` は `auto` スケジュールのみを制約します。

## 公式 compat 面：ショートサーキットツール廃止（0.7.0-beta.1）

カスタムゲートウェイが思考を宣言したら、本プラグインは**公式 `llm-pi-ai` compat 面**（dsh ≥ **v0.1.0-rc.8**）へ修正を自動書き込みします——[dsh-llm-openai-completions](https://github.com/drscrewdriver/dsh-llm-openai-completions) は不要となり、アンインストールのままにしてください：

- ルートレベル `compat.supportsDeveloperRole: false`（`Unexpected message role` 400 を修正）と、トグル型思考モデルへのモデルレベル `compat.thinkingFormat: 'qwen-chat-template'`（`chat_template_kwargs.enable_thinking` を送信）を自動書き込み；
- 公式設定チャネルで書き込み、dsh のスキーマが書き込み時に検証（rc.8 未満では拒否してログ警告）；明示的な値は決して上書きしません；
- 応答側のインライン `<think>` 分割はゲートウェイの責務（vLLM は `--reasoning-parser qwen3`）。

# 依存関係

host 側は `@deepseek-ai/dsh-settings` に値依存しません——DSH 0.1.7 からは設定登録自体が存在しません：設定フォームはホストがプラグイン宣言の schemastery スキーマ（`.volatile()` フィールド）から生成し、クライアント側は dsh ランタイム提供の `configForms` サービスで連携します。profile への公式パッケージ手動インストールは不要です。`dependencies` は `@deepseek-ai/schemastery` のみ（パッケージと一緒に自動インストール）。

## 開発

```bash
npm run lint        # eslint（typescript-eslint flat config）
npm run typecheck   # tsc --noEmit
npm test            # vitest — 46 テスト
```

テストカバレッジ：レベルポリシー（手動透過・拡張レベル、`on` のクランプ、auto スケジューラー、検証、シンプルツール境界）、モデル能力ガード（`reasoningEffortSupported`、`resolveEffortInjection` の除去/透過）、セッションイベント解析（ガード、ウィンドウ上限、不正レコード）、設定スキーマ（既定値ロックステップ、越界拒否、`models` オーバーライド）、引き継ぎ同期（特定、重複排除マージ、ソフト結合）。

## ライセンス

MIT
