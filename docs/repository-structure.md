# リポジトリ構造定義書 (Repository Structure Document)

本書は `docs/architecture.md` のレイヤー構成と「ビルドなし・静的ファイルのみ」の方針を、具体的なディレクトリとファイルの配置に落とし込む。

## 基本方針

- **配信物は `public/` にまとめる**: GitHub Pagesに公開するのは `public/` の中身だけ。ドキュメント・テスト・開発ツールの設定が公開されないようにする
- **`public/` の中身はそのまま動く**: ビルドしないので、`public/` のファイルがブラウザで実行されるソースそのものである
- **レイヤーをディレクトリで表す**: `docs/architecture.md` の4層(`ui/` `player/` `core/` `platform/`)を `public/js/` 直下のディレクトリにする

## プロジェクト構造

```
morse-sync/
├── public/                        # 配信物(GitHub Pagesに公開する唯一のディレクトリ)
│   ├── index.html                 # 唯一のHTML。作成画面・参加画面を切り替えて表示
│   ├── css/
│   │   └── style.css              # 全画面共通のスタイル
│   ├── js/
│   │   ├── main.js                # エントリーポイント。Routerを起動するだけ
│   │   ├── core/                  # ドメイン層(DOM非依存)
│   │   ├── player/                # 再生層
│   │   ├── platform/              # プラットフォーム層(ブラウザAPIのラッパー)
│   │   └── ui/                    # プレゼンテーション層
│   ├── vendor/                    # 同梱する外部ライブラリ(改変しない)
│   │   └── qrcode-generator.js
│   ├── sw.js                      # (P1) Service Worker。スコープの都合でルートに置く
│   ├── manifest.webmanifest       # (P1) Webアプリマニフェスト
│   └── icons/                     # (P1) ホーム画面用アイコン
├── tests/                         # テストコード(公開しない)
│   └── unit/
│       └── core/                  # public/js/core/ と同じ構造
├── scripts/                       # 開発・CI用のNode.jsスクリプト(公開しない)
│   ├── check-size.js              # 配信物の転送量(gzip後)が100KB以内か検査
│   └── serve.js                   # public/ をローカルで配信(手動確認用)
├── docs/                          # 永続ドキュメント
│   └── ideas/                     # 壁打ち・アイデアメモ
├── .steering/                     # 作業単位のドキュメント
├── .github/
│   └── workflows/
│       ├── ci.yml                 # 静的解析・型検査・テスト・サイズ検査
│       └── deploy.yml             # public/ をGitHub Pagesに公開
├── .claude/                       # Claude Codeの設定・スキル・コマンド
├── .devcontainer/                 # 開発環境の定義
├── .husky/                        # コミット前チェック
├── package.json                   # 開発ツールの定義(dependenciesは空)
├── package-lock.json
├── eslint.config.js
├── vitest.config.js
├── jsconfig.json                  # JSDocの型検査設定(tsc --noEmit -p jsconfig.json)
├── .prettierrc / .prettierignore
├── .gitignore
├── CLAUDE.md
├── README.md
└── LICENSE
```

## ディレクトリ詳細

### public/js/core/(ドメイン層)

**役割**: モールスの規則、正規化・符号化、点灯区間の展開、周期の決定、時刻からの点灯判定、URLハッシュの変換と検証。同期の正しさを担う中心部分

**配置ファイル**:
```
core/
├── tables/
│   ├── en.js              # 欧文の変換表(文字 → '.-' 形式の符号)
│   └── ja.js              # (P1) 和文の変換表
├── tables.js              # lang('en' / 'ja')から変換表を選ぶ
├── morse-encoder.js       # normalizeMessage / encodeMessage / formatCode
├── timeline.js            # buildTimeline / cycleMs / findSegment
├── period-planner.js      # PERIOD_CANDIDATES_SEC / choosePeriod / isValidPeriod
├── sync-clock.js          # currentCycleStart / nextCycleStart / stateAt
├── config-codec.js        # toHash / toShareUrl / parseHash / buildFromInput
├── defaults.js            # 既定値と上下限(1拍250ms、200〜2000ms、50文字、色 ffcc00 など)
└── types.js               # JSDocの @typedef のみ(PatternConfig、Timeline など)
```

**命名規則**:
- ファイル名は kebab-case、機能設計書のコンポーネント名に対応させる(例: `MorseEncoder` → `morse-encoder.js`)
- 変換表は `tables/[lang].js`。`lang` はURLの `l` の値と一致させる

**依存関係**:
- 依存可能: `core/` 内のファイルのみ
- 依存禁止: `ui/` `player/` `platform/` `vendor/`、およびブラウザのグローバル(`window` `document` `navigator` `location`)と `Date.now()`

### public/js/player/(再生層)

**役割**: `requestAnimationFrame` のループで毎フレーム点灯状態を求め、出力先に通知する

**配置ファイル**:
```
player/
├── player.js              # Player クラス
├── screen-output.js       # ScreenOutput(全画面要素の背景色を切替)。Output インターフェースの @typedef もここに置く
├── torch-output.js        # (P1) TorchOutput(フラッシュ)
└── beep-output.js         # (P2) BeepOutput(音)
```

**命名規則**:
- 出力先は `[出力先]-output.js`。すべて `Output` インターフェース(`setOn` / `dispose`)を実装する

**依存関係**:
- 依存可能: `core/`
- 依存禁止: `ui/` `platform/`(出力先に必要な要素・トラックはコンストラクタで受け取る)

### public/js/platform/(プラットフォーム層)

**役割**: ブラウザAPIの薄いラッパー。対応判定を行い、失敗しても例外を投げずに結果を返す

**配置ファイル**:
```
platform/
├── wake-lock-keeper.js    # WakeLockKeeper
├── fullscreen-helper.js   # enter / exit
├── share-helper.js        # share(url) → 'shared' | 'copied' | 'cancelled' | 'failed'
├── qr-view.js             # renderQr(el, url, options)。vendor のライブラリでSVGを生成
└── camera-torch.js        # (P1) トーチ対応の判定とトラック取得
```

**依存関係**:
- 依存可能: `vendor/`
- 依存禁止: `core/` `player/` `ui/`

### public/js/ui/(プレゼンテーション層)

**役割**: 画面の組み立て、ユーザー操作の受付、状態遷移の管理、文言の表示

**配置ファイル**:
```
ui/
├── router.js              # startRouter。ハッシュで画面を切替、hashchange を監視
├── create-screen.js       # 作成画面
├── join-screen.js         # 参加画面(状態遷移の管理)
├── join-menu.js           # 参加画面のメニュー(自動で閉じるタイマーを含む)
├── qr-overlay.js          # QRコードの全画面表示(作成画面の拡大・参加画面の「見せる」で共用)
├── error-view.js          # URL読込エラーの表示
├── messages.js            # 画面の文言とエラーコード → 文言の対応表
└── dom.js                 # 要素生成の小さな補助関数(textContent のみ使用)
```

**命名規則**:
- 画面は `[画面名]-screen.js`、画面の一部品は `[画面名]-[部品名].js` または用途名
- 文言はすべて `messages.js` に集め、各ファイルに日本語の文字列を直接書かない(文言の一覧性を保つため)

**依存関係**:
- 依存可能: `core/` `player/` `platform/`
- 依存禁止: `vendor/`(必ず `platform/qr-view.js` を経由する)

### public/vendor/(同梱ライブラリ)

**役割**: 配信物に含める外部ライブラリの置き場所。現在は qrcode-generator のみ

**規則**:
- 取得したファイルを改変しない。ESLint・Prettierの対象外にする
- ファイル先頭のコメントに、ライブラリ名・版・ライセンス・取得元URLを記載する(元のファイルにない場合は追記のみ行う)
- ES Modulesでないライブラリは `<script>` ではなく、`platform/qr-view.js` から扱える形にする方法を開発ガイドラインで定める

### public/ 直下

| ファイル | 役割 |
|---------|------|
| `index.html` | CSPの `<meta>`、`<link rel="stylesheet">`、`<div id="app">`、同梱ライブラリの `<script src="./vendor/qrcode-generator.js">`、`<script type="module" src="./js/main.js">` を、この順に持つ(同梱ライブラリはES Modulesでないため main.js より前に通常のscriptとして読み込む。`docs/development-guidelines.md` 参照)。P1で `<link rel="manifest">` を追加する |
| `css/style.css` | 全画面共通のスタイル。インラインスタイル・`<style>` は使わない(CSPのため) |
| `sw.js`(P1) | Service Workerはスコープ(制御範囲)が自身の置き場所以下になるため、`public/` 直下に置く |

- パスはすべて相対パス(`./js/main.js`)で書く。GitHub Pagesでは `/morse-sync/` 配下に公開されるため、`/` 始まりの絶対パスを使わない

### tests/(テストディレクトリ)

#### unit/

**役割**: ドメイン層(`public/js/core/`)のユニットテスト

**構造**:
```
tests/unit/
└── core/                         # public/js/core/ と同じ構造
    ├── morse-encoder.test.js
    ├── timeline.test.js
    ├── period-planner.test.js
    ├── sync-clock.test.js
    ├── config-codec.test.js
    └── tables/
        └── en.test.js            # 変換表の整合性(符号の文字種、重複なし)
```

**命名規則**:
- パターン: `[テスト対象ファイル名].test.js`
- 例: `public/js/core/timeline.js` → `tests/unit/core/timeline.test.js`

#### 統合テスト・E2Eテスト

自動テストのファイルは置かない(`docs/architecture.md` テスト戦略)。手動確認・実機検証の手順と結果は、作業ごとの `.steering/[日付]-[作業名]/tasklist.md` に記録する。

### scripts/(開発・CI用スクリプト)

**役割**: 配信物には含めない、Node.jsで実行する補助スクリプト

**配置ファイル**:
- `check-size.js`: `public/` の全ファイルをgzip圧縮した合計サイズを計算し、100KBを超えたら失敗する
- `serve.js`: `public/` をローカルで配信する(`npm run serve`。開発時のみ。依存パッケージを増やさないためNode.js標準の `http` で実装)

**規則**:
- ビルド・変換を行うスクリプトは置かない(ビルドなしの方針)

### docs/(ドキュメントディレクトリ)

**配置ドキュメント**:
- `product-requirements.md`: プロダクト要求定義書
- `functional-design.md`: 機能設計書
- `architecture.md`: 技術仕様書
- `repository-structure.md`: リポジトリ構造定義書(本ドキュメント)
- `development-guidelines.md`: 開発ガイドライン
- `glossary.md`: 用語集
- `ideas/`: 壁打ち・アイデアメモ(正式な仕様ではない)

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| ドメインのロジック | `public/js/core/` | kebab-case.js | `period-planner.js` |
| 変換表 | `public/js/core/tables/` | `[lang].js` | `en.js` |
| 出力先 | `public/js/player/` | `[出力先]-output.js` | `screen-output.js` |
| ブラウザAPIのラッパー | `public/js/platform/` | kebab-case.js | `wake-lock-keeper.js` |
| 画面・画面部品 | `public/js/ui/` | `[画面名]-screen.js` など | `join-screen.js` |
| 型定義(JSDoc) | `public/js/core/types.js` | - | `@typedef {Object} PatternConfig` |
| スタイル | `public/css/` | kebab-case.css | `style.css` |
| 同梱ライブラリ | `public/vendor/` | 配布元のファイル名を基本とする | `qrcode-generator.js` |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| ユニットテスト | `tests/unit/core/` | `[対象].test.js` | `sync-clock.test.js` |
| 統合テスト・実機検証 | `.steering/[日付]-[作業名]/tasklist.md` | チェックリスト | - |

### 設定ファイル

| ファイル種別 | 配置先 | 命名規則 |
|------------|--------|---------|
| ツール設定 | プロジェクトルート | `[ツール名].config.js` / `.prettierrc` |
| 型検査設定 | プロジェクトルート | `jsconfig.json` |
| CI・デプロイ | `.github/workflows/` | `[用途].yml` |

## 命名規則

### ディレクトリ名
- レイヤーを表すディレクトリは `docs/architecture.md` の名前に合わせる: `core/` `player/` `platform/` `ui/`
- それ以外は複数形・kebab-case: `tables/` `tests/` `scripts/` `icons/`

### ファイル名
- JavaScript・CSSはすべて kebab-case(例: `morse-encoder.js`)。クラスを定義するファイルも同じ(例: `Player` クラス → `player.js`)
  - 理由: GitHub Pagesは大文字・小文字を区別するため、表記を1つに揃えて読み込みの誤りを防ぐ
- ファイル名は、そのファイルが主に公開するもの(クラス・関数群)の名前を kebab-case にしたもの

### テストファイル名
- `[テスト対象].test.js`

## 依存関係のルール

### レイヤー間の依存

```
ui/  ─────────────┬──────────────┐
  ↓               ↓              ↓
player/         platform/      core/
  ↓               ↓
core/           vendor/
```

**禁止される依存**:
- `core/` → 他のすべて(❌)
- `player/` → `ui/` `platform/`(❌)
- `platform/` → `core/` `player/` `ui/`(❌)
- `ui/` → `vendor/`(❌、`platform/qr-view.js` を経由する)

これらはESLintの `no-restricted-imports`(ディレクトリごとの設定)で検出する(`docs/development-guidelines.md` で定義)。

### モジュール間の依存

- 循環依存を禁止する。共通の型は `core/types.js`、共通の定数は `core/defaults.js` に置いて、そこから参照する
- `import` のパスは相対パスで、拡張子 `.js` まで書く(ブラウザのES Modulesは拡張子を補わないため)
  - 例: `import { choosePeriod } from './period-planner.js';`

## スケーリング戦略

### 機能の追加

| 追加する機能 | 配置 |
|------------|------|
| 和文モールス(P1) | `core/tables/ja.js` を追加、`core/tables.js` に登録 |
| フラッシュ(P1) | `player/torch-output.js`、`platform/camera-torch.js` を追加 |
| オフライン(P1) | `public/sw.js`、`public/manifest.webmanifest`、`public/icons/` を追加 |
| 音(P2) | `player/beep-output.js` を追加 |
| 新しい画面(将来) | `ui/[画面名]-screen.js` を追加し、`ui/router.js` に登録 |

- 1つのレイヤー内で関連ファイルが5本を超えたら、機能名のサブディレクトリにまとめることを検討する(例: `ui/join/`)

### ファイルサイズの管理

- 1ファイル300行以下を推奨。300〜500行はリファクタリングを検討、500行以上は分割する
- 変換表(`core/tables/*.js`)はデータのため行数の目安の対象外とする
- 配信物全体の転送量(gzip後100KB以内)は `scripts/check-size.js` でCIが検査する

## 特殊ディレクトリ

### .steering/(ステアリングファイル)

**役割**: 特定の開発作業における「今回何をするか」を定義し、履歴として残す

**構造**:
```
.steering/
└── [YYYYMMDD]-[task-name]/
    ├── requirements.md      # 今回の作業の要求内容
    ├── design.md            # 変更内容の設計
    └── tasklist.md          # タスクリスト(手動確認・実機検証の記録を含む)
```

**命名規則**: `20260924-add-create-screen` 形式

- 本プロジェクトでは履歴として保持する方針(CLAUDE.md)のため、Gitで管理する

### .claude/(Claude Code設定)

```
.claude/
├── commands/                # スラッシュコマンド
├── skills/                  # タスクモード別スキル
└── agents/                  # サブエージェント定義
```

## 除外設定

### .gitignore

既存の設定に加えて、以下を除外する:
- `node_modules/`
- `coverage/`
- `.env*`
- `*.log`
- `.DS_Store`

`.steering/` は除外しない(履歴として保持するため)。

### .prettierignore / ESLintの ignores

- `node_modules/`
- `coverage/`
- `public/vendor/`(同梱ライブラリは改変しない)
- `.steering/`

## 既存ファイルの扱い(初回の実装時に整理する)

本リポジトリは書籍のテンプレート(TypeScript向け)から作成したため、以下を初回の実装作業(`.steering/20260924-mvp-core-features/`)で整理した。作業用のファイル(表の最終行)は未整理で、開発者の判断を待つ。

| 既存ファイル | 扱い |
|------------|------|
| `src/example.ts` / `src/example.test.ts` | 削除(テンプレートのサンプル) |
| `tsconfig.json` | `jsconfig.json` に置き換える(`allowJs` / `checkJs` / `noEmit`、対象は `public/js/`) |
| `vitest.config.ts` | `vitest.config.js` に置き換え、`include` を `tests/**/*.test.js` にする |
| `eslint.config.js` | JavaScript向けに変更し、レイヤー間の依存ルールを追加 |
| `package.json` | `name` を `morse-sync` に変更。`build` / `dev` スクリプトを削除し、`typecheck` を `tsc -p jsconfig.json` に変更、`check-size` と `serve`(`public/` をローカル配信)を追加 |
| `.husky/pre-commit` | lint-staged の対象を `*.js` に変更 |
| `mvp-log.json` / `output.jsonl` / `prompt.md` / `使い方メモ.txt` | 作業用のファイル。リポジトリに残すかどうかを初回の実装時に確認する |
