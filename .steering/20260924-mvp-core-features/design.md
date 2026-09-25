# 設計書

## アーキテクチャ概要

`docs/architecture.md` の4層構成(`ui/` → `player/` / `platform/` / `core/`)を、ビルドなしのES Modulesで `public/js/` に実装する。ドメイン層(`core/`)はDOMと `Date.now()` に依存しない純粋関数とし、Vitestでテストする。

```
public/index.html
 ├─ vendor/qrcode-generator.js   (通常のscript。グローバル qrcode を定義)
 └─ js/main.js                   (module)
     └─ ui/router.js ── hash なし ─→ ui/create-screen.js ─→ core/config-codec.js(buildFromInput / previewInput / toShareUrl)
                    ├─ 有効な hash ─→ ui/join-screen.js ─→ player/player.js ─→ core/sync-clock.js(stateAt)
                    │                                  ├─→ player/screen-output.js
                    │                                  └─→ platform/(wake-lock-keeper / fullscreen-helper / share-helper / qr-view)
                    └─ 無効な hash ─→ ui/error-view.js
```

## コンポーネント設計

### 1. core/(ドメイン層)

| ファイル | 公開するもの | 要点 |
|---------|------------|------|
| `defaults.js` | `SPEC_VERSION` `DEFAULT_LANG` `DEFAULT_MESSAGE` `DEFAULT_UNIT_MS` `MIN_UNIT_MS` `MAX_UNIT_MS` `MAX_MESSAGE_LENGTH` `DEFAULT_COLOR` | 既定値と上下限を1か所に集める |
| `types.js` | `@typedef` のみ | PatternConfig / MorseTable / EncodedMessage / EncodedChar / Timeline / OnSegment / PlaybackState / ValidationError / ValidationResult / CreateInput / MessagePreview |
| `tables/en.js` | `EN_TABLE` | 機能設計書の付録の表。`normalize` は前後の空白削除・連続空白(全角空白・タブ含む)を1つに・半角英字のみ大文字化 |
| `tables.js` | `getTable(lang)` | 対応していない `lang` は `null` |
| `morse-encoder.js` | `normalizeMessage` `encodeMessage` `formatCode` `formatEncodedMessage` | 文字はコードポイント単位で扱う(絵文字を1文字として報告するため)。`sourceIndex` もコードポイント単位 |
| `timeline.js` | `buildTimeline` `cycleMsOf` `findSegment` | 符号が `null`(対応外)の文字は無視する。`findSegment` は二分探索 |
| `period-planner.js` | `PERIOD_CANDIDATES_SEC` `choosePeriod` `isValidPeriod` | 機能設計書アルゴリズム3の通り |
| `sync-clock.js` | `currentCycleStart` `nextCycleStart` `stateAt` | 機能設計書アルゴリズム4の通り。時刻は引数 `nowMs` |
| `config-codec.js` | `toHash` `toShareUrl` `parseHash` `buildFromInput` `previewInput` | 検証はすべてここ。エラーは複数同時に返す(`UNKNOWN_VERSION`・`MISSING_FIELD(v)` のみ即時終了) |

**実装の要点**:
- `cycleMs` は機能設計書では関数名だが、変数名と衝突するため関数は `cycleMsOf` とする(開発ガイドラインの例と同じ)
- 作成画面は、エラーがあっても符号と1周の長さを表示したい(例: 60秒超のときも「75.0秒」と表示する)。そのため検証とは別に `previewInput(input)` を用意し、`{ normalized, encoded, cycleMs }` を返す(`cycleMs` は空・対応外の文字あり・1拍が不正のとき `null`)
- `stateAt` は機能設計書のインターフェース通り新しいオブジェクトを返す。1フレームに1つの小さなオブジェクトであり、純粋関数として保つ利点を優先する
- `TOO_LONG_FOR_60S` と `INVALID_PERIOD` は、メッセージと1拍がともに有効で所要時間を計算できたときだけ判定する

### 2. player/(再生層)

- `player.js`: `Player` クラス。`start()` で `firstStartMs = nextCycleStart(Date.now(), periodMs)` を記録し、rAFループを開始。毎フレーム `stateAt` を計算し、`isOn` が変わったときだけ `Output.setOn` を呼ぶ。`onFrame` のリスナーに状態を渡す。`stop()` でループを止めて全出力を消灯
  - rAFの再登録はフレーム処理の最初に行い、リスナーで想定外の例外が出ても次のフレームで判定をやり直せるようにする
- `screen-output.js`: `ScreenOutput(element, color)`。`style.backgroundColor` を `#` + 検証済みの色 / `#000000` に切り替える

### 3. platform/(プラットフォーム層)

- `wake-lock-keeper.js`: `WakeLockKeeper`(`isSupported` / `acquire` / `release`)。失敗は `false`
- `fullscreen-helper.js`: `enterFullscreen(el)` / `exitFullscreen()`。非対応・失敗は `false`
- `share-helper.js`: `shareUrl(url)` → `'shared' | 'copied' | 'cancelled' | 'failed'`。`AbortError` はキャンセル、それ以外の共有失敗はクリップボードにフォールバック
- `qr-view.js`: `renderQr(el, url, { margin })`。グローバル `qrcode`(誤り訂正M、型番自動)で行列を作り、`createElementNS` でSVGの `<rect>`(白背景)と1本の `<path>`(黒モジュール)を組み立てる。`innerHTML` を使わない

### 4. ui/(プレゼンテーション層)

- `router.js`: `startRouter(root)`。ハッシュが空なら作成画面、あれば `parseHash` → 参加画面 / 読込エラー。`hashchange` で前の画面をアンマウントして作り直す。画面には `navigate` オブジェクト(`toCreate(config?)` / `toJoin(config)`)を渡す
  - `toJoin`: `location.hash = toHash(config)`(`hashchange` で参加画面になる)
  - `toCreate`: `history.pushState` でハッシュを消し、設定を引き継いで作成画面を表示する
- `create-screen.js`: 入力 → `previewInput` と `buildFromInput` → 符号・1周の長さ・対応外の文字の強調・エラーを即時更新。有効ならURLを表示し、QRコードは100ms間引いて再生成。無効ならQR領域を即座に隠す
- `join-screen.js`: 状態 `before` / `running` / `qr` / `paused` を管理(メニューは `running` に重ねる)。`visibilitychange` で hidden → `player.stop()`、visible → Wake Lock再取得+`running` なら `player.start()`
- `join-menu.js`: 画面下部のメニュー。開いてから5秒無操作で閉じる(メニュー内の操作でタイマーを延長)
- `qr-overlay.js`: 白背景の全画面QRコード+「共有」「戻る(閉じる)」+共有結果の表示。作成画面の拡大表示と参加画面の「QRコードを見せる」で共用
- `error-view.js`: 読込エラーの文言+「パターンを作る」
- `messages.js`: 文言、エラーコード → 文言、所要時間・カウントダウンの書式
- `dom.js`: `createElement(tag, { className, text, attrs, on }, children)`。文字列は `textContent` のみ

## データフロー

### 作成 → 共有
```
1. 入力イベント → CreateInput { message, unitMs, color }
2. previewInput → 符号・対応外の文字の強調・1周の長さを即時表示
3. buildFromInput → ok: toShareUrl → URL表示+(100ms後)renderQr / ng: エラー表示・QR非表示
4. 「このパターンで参加」 → navigate.toJoin(config) → hashchange → 参加画面
```

### 参加 → 点滅
```
1. parseHash(location.hash) → ok: mountJoinScreen(root, config, cycleMs, navigate)
2. 「タップして参加」 → (同期的に)wakeLock.acquire() / enterFullscreen() / player.start()
3. 毎フレーム stateAt → isOn の変化時のみ ScreenOutput.setOn、表示の変化時のみカウントダウン・送信中の文字を更新
4. QR表示・一時停止 → player.stop() / 戻る・再開 → player.start()(次の開始時刻から)
```

## エラーハンドリング戦略

### カスタムエラークラス

作らない。入力・URLの誤りは `ValidationResult`(`{ ok: false, errors }`)、ブラウザ機能の失敗は `platform/` の戻り値で表す(開発ガイドライン)。

### エラーハンドリングパターン

- 作成画面: エラーコードごとに `ERROR_MESSAGES` の文言を入力欄の下に全件表示。`UNSUPPORTED_CHARS` は `detail`(対応外の文字を空白区切り)を付けて表示
- 参加画面: `UNKNOWN_VERSION` は専用の文言、それ以外は「QRコードの内容が正しくありません」に丸め、エラーコードは `console.warn`
- Wake Lock失敗: 案内文を表示して点滅は継続。フルスクリーン失敗: 何も表示しない
- 共有失敗: 「共有できませんでした。URLをコピーしてください」+選択可能なURL
- 想定外の例外: `main.js` で `error` / `unhandledrejection` を `console.error` に記録(点滅はrAFの再登録を先に行っているため継続する)

## テスト戦略

### ユニットテスト
- `tests/unit/core/tables/en.test.js`: 付録の表との一致、符号の文字種(`.` `-` のみ)、最大7要素
- `morse-encoder.test.js`: 全対応文字、小文字の大文字化、空白の正規化(全角空白・タブ)、対応外(日本語・絵文字・全角英字)、`formatCode`
- `timeline.test.js`: `E` / `SOS` / `HELLO` / `HELLO WORLD` の `totalUnits` と区間、`findSegment` の境界
- `period-planner.test.js`: 8.5→10、10.0→10、10.1→12、60.0→60、60.1→null、`isValidPeriod`
- `sync-clock.test.js`: 境界ちょうど・前後1ms、待機中→点滅中、1時間後の一致、`msToNextStart`
- `config-codec.test.js`: 往復、任意項目の省略、`v=2`、`v` なし、`l` 不正、`p` 不正(約数でない・短すぎる・非整数)、色の不正・小文字化、未知のキー、`m` のエンコード、PRDのURL例の固定値テスト、`buildFromInput` の各エラーと複数同時、`previewInput`

### 統合テスト
- ローカルサーバー(`npm run serve`)+ブラウザで手動確認。チェックリストは `tasklist.md` に残す

## 依存ライブラリ

- 配信物に同梱: `qrcode-generator` 2.0.4(`dist/qrcode.js` を `public/vendor/qrcode-generator.js` にコピー、先頭に取得元・版・ライセンスを追記)
- devDependencies に追加: `globals`(ESLintでブラウザ・Node.jsのグローバル変数を定義するため)
- `dependencies` は空のまま

## ディレクトリ構造

```
public/
├── index.html
├── css/style.css
├── js/
│   ├── main.js
│   ├── core/  defaults.js types.js tables.js tables/en.js morse-encoder.js timeline.js period-planner.js sync-clock.js config-codec.js
│   ├── player/  player.js screen-output.js
│   ├── platform/  wake-lock-keeper.js fullscreen-helper.js share-helper.js qr-view.js
│   └── ui/  router.js create-screen.js join-screen.js join-menu.js qr-overlay.js error-view.js messages.js dom.js
└── vendor/qrcode-generator.js
tests/unit/core/  (上記テスト)
scripts/  check-size.js serve.js
.github/workflows/  ci.yml deploy.yml
jsconfig.json  vitest.config.js  eslint.config.js(変更)  package.json(変更)  .husky/pre-commit(変更)
削除: src/  tsconfig.json  vitest.config.ts
```

## 実装の順序

1. 開発環境の整備(設定ファイルの置き換え、テンプレートの削除)
2. ドメイン層(defaults / types / 変換表 → encoder → timeline → period-planner → sync-clock → config-codec)とユニットテスト
3. 同梱ライブラリ・プラットフォーム層
4. 再生層
5. プレゼンテーション層・HTML・CSS
6. スクリプト(サイズ検査・ローカル配信)とCI
7. 品質チェック・ブラウザでの確認・ドキュメント更新

## セキュリティ考慮事項

- CSP(`connect-src 'none'` など)を `index.html` の `<meta>` で指定。インラインスクリプト・`<style>`・`style` 属性を使わない(動的な色はCSSOMで設定)
- URLの値は `config-codec.js` で検証済みのものだけを使う。色は16進6桁のみ
- 文字列の表示は `textContent` のみ。ESLintで `innerHTML` 系・`eval` 系・通信APIを禁止

## パフォーマンス考慮事項

- 毎フレームの処理は `Date.now()`・二分探索・比較のみ。DOMは値が変わったときだけ書き換える
- 点滅は1つの全画面要素の `background-color` の切替のみ
- QRコードは作成画面では有効な入力の100ms後、参加画面では「QRコードを見せる」のときだけ生成

## 将来の拡張性

- 和文(P1): `tables/ja.js` を追加し `tables.js` と `config-codec.js` の許可する `lang` に加える
- フラッシュ(P1): `player/torch-output.js` が `Output` を実装し、`JoinScreen` のメニューに項目を追加する。`Player` は変更しない
