# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

### タスクスキップが許可される唯一のケース
以下の技術的理由に該当する場合のみスキップ可能:
- 実装方針の変更により、機能自体が不要になった
- アーキテクチャ変更により、別の実装方法に置き換わった
- 依存関係の変更により、タスクが実行不可能になった

スキップ時は必ず理由を明記:
```markdown
- [x] ~~タスク名~~（実装方針変更により不要: 具体的な技術的理由）
```

---

## フェーズ1: 開発環境の整備

- [x] テンプレートのファイルを整理する
  - [x] `src/example.ts` / `src/example.test.ts` を削除
  - [x] `tsconfig.json` を `jsconfig.json`(allowJs / checkJs / noEmit、DOM型)に置き換え
  - [x] `vitest.config.ts` を `vitest.config.js`(`tests/**/*.test.js`、`core/` のカバレッジ90%)に置き換え
- [x] `package.json` を更新する(name、scripts: typecheck / check-size / serve、build・dev削除、lint-staged を `*.js` に、`globals` を追加)
- [x] `eslint.config.js` をJavaScript向けに書き換える(禁止API・レイヤー間の依存ルール・vendor除外)
- [x] `.husky/pre-commit` と `.prettierignore` を更新する

## フェーズ2: ドメイン層(core/)とユニットテスト

- [x] `core/defaults.js` と `core/types.js` を作成
- [x] 変換表 `core/tables/en.js` と `core/tables.js` を作成し、`tests/unit/core/tables/en.test.js` を書く
- [x] `core/morse-encoder.js` と `morse-encoder.test.js`
- [x] `core/timeline.js` と `timeline.test.js`
- [x] `core/period-planner.js` と `period-planner.test.js`
- [x] `core/sync-clock.js` と `sync-clock.test.js`
- [x] `core/config-codec.js` と `config-codec.test.js`(PRDのURL例の互換性テストを含む)
- [x] `npm test` とカバレッジ(90%以上)を確認

## フェーズ3: 同梱ライブラリ・プラットフォーム層・再生層

- [x] qrcode-generator 2.0.4 を `public/vendor/qrcode-generator.js` に同梱(先頭に取得元・版・ライセンスを追記)
- [x] `platform/qr-view.js`
- [x] `platform/wake-lock-keeper.js`
- [x] `platform/fullscreen-helper.js`
- [x] `platform/share-helper.js`
- [x] `player/screen-output.js`
- [x] `player/player.js`

## フェーズ4: プレゼンテーション層・HTML・CSS

- [x] `ui/messages.js` と `ui/dom.js`
- [x] `ui/qr-overlay.js`
- [x] `ui/create-screen.js`
- [x] `ui/join-menu.js`
- [x] `ui/join-screen.js`
- [x] `ui/error-view.js`
- [x] `ui/router.js` と `js/main.js`
- [x] `public/index.html`(CSP、読み込み順)
- [x] `public/css/style.css`(320〜1920px、タップ領域44px以上、参加ボタンは短辺の30%以上)

## フェーズ5: スクリプトとCI

- [x] `scripts/check-size.js`(gzip後の合計が100KB以内か検査)
- [x] `scripts/serve.js`(`public/` をローカル配信。開発時のみ)
- [x] `.github/workflows/ci.yml` と `.github/workflows/deploy.yml`

## フェーズ6: 品質チェックと修正

- [x] すべてのテストが通ることを確認
  - [x] `npm test`
  - [x] `npm run test:coverage`(`core/` 90%以上)
- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] 型エラーがないことを確認
  - [x] `npm run typecheck`
- [x] 配信物のサイズを確認
  - [x] `npm run check-size`
- [x] ブラウザでの動作確認(ローカルサーバー+ヘッドレスブラウザ、またはHTTPでの取得確認)
  - [x] 作成画面・参加画面・読込エラー画面が表示され、コンソールエラーがない(Playwright の一時スクリプトで17項目を自動操作して確認。点灯状態を Date.now() と照合し不一致0)

## フェーズ7: ドキュメント更新

- [x] README.md を更新(概要・使い方・開発コマンド)
- [x] 永続ドキュメントに実装との差分があれば更新(functional-design / repository-structure / architecture / development-guidelines)
- [x] 手動確認・実機検証のチェックリストをこのファイルに記載
- [x] 実装後の振り返り(このファイルの下部に記録)

---

## 手動確認・実機検証のチェックリスト

### ヘッドレスブラウザで確認済み(2026-09-24、Chromium、`npm run serve`)

一時的なPlaywrightスクリプト(リポジトリには含めない)で自動操作して確認した。

- [x] 作成画面の初期表示: `SOS` の符号 `・・・ −−− ・・・`、1周の長さ `8.5秒`、URL `#v=1&l=en&m=SOS&p=10&u=250&c=ffcc00`、QRコード(SVG)
- [x] 入力で符号・所要時間・URLが即時に更新される(`hello world` → `29.5秒`、`p=30`)
- [x] 対応外の文字(`あ` `😀`)を強調表示し「この文字は送れません: あ 😀」、QRコードを隠す
- [x] 60秒超・1拍100msでエラー表示、QRコードを隠す。200msに戻すとQRコードを再表示
- [x] 拡大表示 → 閉じる
- [x] 「このパターンで参加」でハッシュ付きURLの参加画面へ。参加ボタンは幅360pxで216×130px(短辺の30%以上)
- [x] 参加後、待機中のカウントダウン(「開始まで あとN秒」)
- [x] 点灯・消灯を `Date.now()` から計算した期待値と照合し、切替の前後40msを除く全サンプルで一致
- [x] メニューは5秒で自動で閉じる / メニュー外のタップで閉じる
- [x] 「QRコードを見せる」 → 白背景のQRコード → 「戻る」で待機中から再開
- [x] 「一時停止」で消灯・「再開」ボタン → 再開
- [x] 参加画面の「パターンを作る」でハッシュを消し、メッセージを引き継ぐ
- [x] 不正なURL(`p=7`)で「QRコードの内容が正しくありません」、`v=2` で新しいバージョンの文言、`hashchange` で再描画
- [x] 幅320pxで横スクロールなし
- [x] 読み込み後の外部通信なし・コンソールエラーなし(CSP違反なし)

### 実機で確認すること(MVP公開前に開発者が実施)

- [x]: iPhone(Safari)、作成・参加・点滅ができる
- 未実施: Android(Chrome)、作成・参加・点滅ができる
- [x]: PC各ブラウザで、作成・参加・点滅ができる
- [x]: `HELLO` のQRコードを主催者のスマホに表示し、1m離れて標準カメラで読み取れる
- [x]: Wake Lockが効き、タブ切替・画面オフから戻ると自動で再取得して次の開始時刻から再開する
- 未実施: Android Chromeで参加時にフルスクリーンになり、QRコード表示中も維持される
- [x]: 「共有」でOSの共有シートが開く(非対応端末では「コピーしました」)
- 未実施: 異なる機種5台以上を並べ、240fpsのスロー動画で点灯開始のずれが最大100ms以内
- 未実施: 1時間点滅させて、開始時刻のずれが増加しない
- 未実施: 初見の参加者5人で、説明なしで待機状態まで到達できる

※ 実機検証は実機が必要なため、このリストは開発者が実施し「未実施」を結果に書き換える(本作業の完了条件には含めない。requirements.md「スコープ外」)。

---

## 実装後の振り返り

### 実装完了日
2026-09-24

### 計画と実績の差分

**計画と異なった点**:
- 参加画面のインターフェースを `mountJoinScreen(root, config, cycleMs)` から `mountJoinScreen(root, config, navigate)` に変更した。`cycleMs` は画面で使わず、「パターンを作る」のために画面遷移の操作(`Navigate`)が必要だったため。作成画面・読込エラー画面も同じ `navigate` を受け取る形にそろえ、`docs/functional-design.md` を更新した
- 参加画面で点灯区間の列を作るため、`core/config-codec.js` に `buildConfigTimeline(config)` を追加した(`ui/` にモールスの規則を持ち込まないため)
- 機能設計書の関数名 `cycleMs` は変数名と衝突するため `cycleMsOf` にした(開発ガイドラインの例に合わせた)
- `jsconfig.json` に `maxNodeModuleJsDepth: 0` が必要だった(既定値2だと、テストが読み込む `node_modules` のJSまで型検査されてエラーになる)
- TypeScript 5.3 はJSDocの `@import` タグに未対応のため、`@typedef {import('...').X}` の形で型を参照した(開発ガイドラインの表現を修正)
- ローカル配信は `npx serve` ではなく `scripts/serve.js`(Node.js標準の `http`)にした。依存パッケージを増やさず、オフラインの開発環境でも動くため

**新たに必要になったタスク**:
- ESLintのブラウザ・Node.jsのグローバル変数定義のため、devDependencies に `globals` を追加した
- ブラウザでの動作確認のため、リポジトリ外(`/tmp`)に Playwright と Chromium を一時的に入れた(配信物・`package.json` には含めない)

**技術的理由でスキップしたタスク**: なし

### 学んだこと

**技術的な学び**:
- 検証(`buildFromInput`)と表示用の途中結果(`previewInput`)を分けると、「60秒超でも所要時間は見せたい」という作成画面の要件と「検証済みの値だけを使う」という方針を両立できる
- `core/` で `Date.now` をESLintで禁止すると、時刻を引数で受け取る設計が機械的に守られ、境界ちょうど・1ms前後・1時間後のテストを固定値だけで書ける
- rAFの再予約をフレーム処理の先頭で行うと、表示更新で想定外の例外が出ても点滅が止まらない
- ヘッドレスブラウザで点灯状態を `Date.now()` から計算した期待値と照合すると、同期ロジックが実際の描画まで正しくつながっていることを実機なしで確かめられる(実機での端末間のずれは別途必要)
- `location.hash` の代入はブラウザがエンコードを正規化することがあるため、「同じハッシュなら hashchange が来ない」ケースは代入前後の値の比較で判定した

**プロセス上の改善点**:
- 機能設計書に検算表(`SOS` = 34拍など)と境界値の表があったため、テストケースを迷わず決められた
- `implementation-validator` の検証で必須・推奨の指摘はなし。提案のうち「到達不能な分岐」2か所(`config-codec.js` の `rawPeriod ?? ''`、`timeline.js` の `ch.code ?? ''`)は、JSDocの型検査で null を外すために必要なため残した

### 実機での確認結果(2026-09-25、GitHub Pagesに公開した版)
- iPhone(Safari)とPC各ブラウザで、作成・参加・点滅・QRコードの読み取り(1m)・共有・Wake Lockの再取得を確認し、基本的に問題なく動作した
- Android端末が手元にないため、Android(Chrome)の動作とフルスクリーンは未確認
- 5台以上での同期精度・1時間の連続点滅・初見の参加者5人でのテストは未実施

### 次回への改善提案
- MVP公開前に、上の「実機で確認すること」を実施して結果を記入する(特に複数台の同期精度・QRコードの読み取り距離・iOSのWake Lock)
- `ui/create-screen.js` と `ui/join-screen.js` はどちらも約290行で、300行の目安に近い。P1(フラッシュ・和文)の追加時には、参加画面の状態遷移と描画を分けるなど分割から始める
- 点滅中もメニューの存在に気づけるよう、「画面をタップするとメニューが開きます」を点滅開始後もしばらく表示するか、ユーザーテストで確かめる
- 作業用ファイル(`mvp-log.json` / `output.jsonl` / `prompt.md` / `使い方メモ.txt`)を残すかどうかを開発者が決める(`docs/repository-structure.md`「既存ファイルの扱い」)
- ~~GitHub Pagesの Source を「GitHub Actions」に設定する~~(2026-09-25 設定・公開済み)
- Android端末を借りて、Android(Chrome)の動作とフルスクリーンを確認する
- 1時間の連続点滅(iPhone 1台で可)と、複数台での同期精度を確認する
