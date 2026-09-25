# インストールガイド（公式 DSH CLI）

このガイドは公式 `dsh plugin` コマンドのみを使用します。このコマンドは依存関係を profile にインストールし、`dsh.profile.bundles` を同期します。普通の `npm install`、profile での直接 `pnpm add`、profile マニフェストの手動編集で代用しないでください。

- [日本語インストールガイド](./INSTALL.ja.md)
- [English installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [日本語 README](./README.ja.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [한국어 README](./README.ko.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

このガイドのプレースホルダー：

- `<profile>`：変更する DSH profile。通常は `web`；
- `dsh-thinking-levels`：npm パッケージ名とランタイムプラグイン ID；
- `thinking-levels`：Cordis 構成エントリと設定 Slot ID。

> 旧い DSH は npm の dist-tag で対応ラインをインストールします：`dsh plugin add dsh-thinking-levels@dsh-0.1.5`（DSH 0.1.5）、`...@dsh-0.1.2`（DSH 0.1.2）、`...@compat`（DSH 0.1.0–0.1.1）。≤ 0.6.0 の旧 0.x 版は dsh peer 宣言を持たないためインストールしないでください。

## 0. 前提と profile の確認

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

実行中の DSH プロセスが使う profile を使用してください。`web` が一般的ですが、実際の `--profile` 引数が優先されます。

## 1. 公式インストール

最新版をインストール：

```bash
dsh plugin --profile <profile> add dsh-thinking-levels -w
```

（profile が pnpm workspace root の場合は `-w` が必要です。`web` はそうです。）

現在のリリースを明示的にインストール：

```bash
dsh plugin --profile <profile> add dsh-thinking-levels@3.1.0 -w
```

公式 CLI は profile の依存関係、ロックファイル、`dsh.profile.bundles` を自動更新します。手動で YAML を追加しないでください。

### サプライチェーン冷却期間

dsh ランタイムは pnpm 11 を使用し、`minimumReleaseAge` ポリシーが新規公開版を
`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` でブロックすることがあります。`~/.dsh/profiles/web/pnpm-workspace.yaml` の
`minimumReleaseAgeExclude` にバージョンを追加してください：

```yaml
minimumReleaseAgeExclude:
  - dsh-thinking-levels@3.1.0
```

## 2. アップグレード

registry の最新版へアップグレード：

```bash
dsh plugin --profile <profile> update dsh-thinking-levels -w
```

ホスト側の変更は DSH を再起動、ブラウザ側は Web ページをリフレッシュしてください。

## 3. ローカルパス / link: 登録（代替）

開発用やオフラインインストールでは、ローカルチェックアウトから登録できます：

```bash
#    ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-thinking-levels": "link:<dsh-thinking-levels の絶対パス>"
#    ~/.dsh/profiles/web/cordis.patch.yml:
#      - insert:
#          - id: thinking-levels
#            name: dsh-thinking-levels
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

または公式 CLI でローカルパスを追加（ネットワーク不要）：

```bash
dsh plugin --profile <profile> add /dsh-thinking-levels の絶対パス/ -w
```

## 4. インストールの検証

依存関係とインストール済みバージョンを確認：

```bash
grep -n "dsh-thinking-levels" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-thinking-levels/package.json').version"
```

このリリースではバージョンは `3.1.0` でなければなりません。

公式構成を確認：

```bash
dsh --profile <profile> --dump-default-config
```

以下が含まれている必要があります：

```yaml
- id: thinking-levels
  name: dsh-thinking-levels
```

## 5. 設定フォームの検証

DSH を再起動し、Web ページをリフレッシュしてください。「設定 → プラグイン」を開き、**dsh-thinking-levels** のエントリを探します——DSH 0.1.7 からフォームはホストがプラグイン宣言の `.volatile()` スキーマフィールドから自動生成します（カスタムクライアントカードはもうありません）。

1. フォームには有効トグル、レベルセレクター（8 つの標準レベル + `auto`）、スケジューラートグル（`allowDowngrade` / `allowUpgrade`）が表示されます。
2. 確定した変更は次のモデルリクエストから有効、再起動不要（ライブ volatile 設定）。
3. モデル別能力エディター（ゲートウェイ送信値、llm-pi-ai）は廃止されたカードとともに削除されました——llm-pi-ai のモデル能力は公式の「モデル」設定面から編集してください。

## 日本語と韓国語のサポート状況

プラグインには `ja` と `ko` の辞書が含まれていますが、現在の公式 DSH リリースは `LocaleRuntime` 経由で `zh` と `en` のみを提供します。純正 DSH で日本語または韓国語を選択すると `locale "<id>" is not registered` で失敗します。

公式サポートが来る前に使うには、DSH フォークを保守して更新してください：

- `packages/client/locale/src/locale-settings.ts`：`LOCALE_IDS` に `ja` と `ko` を追加（Host プリファレンススキーマはこのリストから派生）。
- `packages/client/locale/src/client/index.ts`：`LOCALES` に `{ id: 'ja', label: '日本語' }` と `{ id: 'ko', label: '한국어' }` を追加。
- 対応するコア辞書とテストを追加し、フォーク版を再ビルドして実行。

プラグイン単体では DSH のグローバル locale 一覧を拡張できません。フォークのドキュメントにあるビルドと公式 profile コマンドを使用してください。profile マニフェストの手動編集はしないでください。

## 6. トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| `dsh` が見つからない | 公式 DSH CLI をインストール/有効化。普通の npm/pnpm コマンドで profile インストールを再現しないでください。 |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | profile の `pnpm-workspace.yaml` の `minimumReleaseAgeExclude` にバージョンを追加。 |
| プラグインが「無効/未マウント」でエラーなし | profile 構成を確認。ホストは `@deepseek-ai/dsh-settings` に値依存してはいけません（本プラグインはしていません）。 |
| client エントリが `__DSH_BOOT__` にない | `exports["./client"]` が存在し、host fiber が確立されていることを確認。 |
| モデルセレクターに `Auto` がない | adapter `resolveModel` のラップが効いているか確認（`llm/adapters-updated` で再ラップ）。 |
| 設定フォームの書き込み失敗 | プラグインスキーマに拒否された。宣言された `.volatile()` フィールド型に合わせる。 |
| Subagent が `UNSUPPORTED_REASONING_EFFORT` | 対象モデルがレベルを宣言していない。対応レベルを使うかプロバイダー既定に戻す。 |
| ブラウザが古い bundle を表示 | アップグレード後にハードリフレッシュ（Ctrl+Shift+R）。 |

## 7. アンインストール

公式コマンドを使用：

```bash
dsh plugin --profile <profile> remove dsh-thinking-levels -w
```

構成から bundle が消えたことを確認：

```bash
dsh --profile <profile> --dump-default-config
```
