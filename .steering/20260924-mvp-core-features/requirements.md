# 要求内容

## 概要

PRD(`docs/product-requirements.md`)のコア機能(P0: 機能1〜5)を実装し、QRコードを読んでタップするだけで複数台のスマホが端末の時計だけを基準に揃ってモールス信号を画面点滅させられる静的Webページ(`public/`)を完成させる。

## 背景

永続ドキュメント6種が揃い、実装に入れる状態になった。リポジトリには書籍テンプレート(TypeScript / npm)由来のファイル(`src/example.ts`、`tsconfig.json`、`vitest.config.ts` など)しかなく、アプリケーションのコードはまだない。MVPをGitHub Pagesで公開できる状態にすることが今回のゴール。

## 実装対象の機能

### 0. 開発環境の整備(テンプレートからの移行)
- `docs/repository-structure.md`「既存ファイルの扱い」に従い、TypeScriptテンプレートの設定をJavaScript(JSDoc)向けに置き換える
- `jsconfig.json`・`vitest.config.js`・ESLint(レイヤー間の依存ルール・禁止API)・`package.json` のスクリプト(`check-size` `serve`)・husky
- 配信物のサイズ検査(`scripts/check-size.js`)、ローカル配信(`scripts/serve.js`)、CI・デプロイのワークフロー

### 1. 点滅パターンの作成(PRD 機能1)
- メッセージ(既定 `SOS`)・1拍の長さ(既定250ms、200〜2000ms)・点灯色(既定 `#ffcc00`)を入力できる作成画面
- 入力のたびに符号(`・` `−`)と1周の長さ(秒・小数第1位)を即時に表示する
- 対応外の文字の強調表示、各種エラー表示(複数同時)。エラー時はQRコードを出さない
- 同期の周期は内部で自動決定し、画面に表示しない

### 2. QRコードでの設定共有(PRD 機能2)
- 有効な入力から共有URL(`#v=1&l=en&m=…&p=…&u=…&c=…`)を作り、同梱のqrcode-generatorでSVGのQRコードを描く(外部通信なし)
- QRコードの拡大表示(白背景・余白4モジュール)、「共有」(Web Share API / クリップボード)、「このパターンで参加」
- 参加画面のメニューからも同じURLのQRコードを表示・共有できる

### 3. 設定URLの読み込み(PRD 機能3)
- ハッシュの有無で作成画面・参加画面を切り替え、`hashchange` で作り直す
- `parseHash` で全項目を検証し、URLの `p` をそのまま使う(周期を計算し直さない)
- 未知のバージョンは専用の文言、それ以外の不正は「QRコードの内容が正しくありません」+作成画面へのリンク

### 4. 参加開始の操作(PRD 機能4)
- 大きな「タップして参加」ボタン(短辺の30%以上)。タップでWake Lock・フルスクリーン・点滅を開始
- 待機中のカウントダウン、明るさの案内、Wake Lock非対応時の案内
- 画面タップで点滅を続けたままメニュー(「QRコードを見せる」「一時停止」「送信中の文字の表示切替」)。5秒無操作・メニュー外タップで閉じる
- QR表示・一時停止・タブ切替からの復帰は、次の開始時刻から周りと揃って再開する

### 5. 時刻同期による画面点滅(PRD 機能5)
- `Date.now()` から毎フレーム点灯/消灯を計算し、状態が変わったときだけ背景色を切り替える
- 点灯は点灯色、消灯は `#000000`。上部に小さく送信中の文字を表示(既定は表示)

## 受け入れ条件

PRDの機能1〜5の受け入れ条件のうち、ブラウザ・コードで確認できるものをすべて満たすこと。加えて:

### ユニットテスト(ドメイン層)
- [ ] `npm test` がすべて成功する
- [ ] 機能設計書「テスト戦略 > ユニットテスト」に列挙したケースを網羅する(MorseEncoder / Timeline / PeriodPlanner / SyncClock・stateAt / ConfigCodec / 変換表)
- [ ] PRDのURL例(`#v=1&l=en&m=HELLO&p=15&u=250&c=ffcc00`)を固定値の互換性テストとして持つ
- [ ] `public/js/core/` の行・分岐カバレッジ90%以上

### 品質・規約
- [ ] `npm run lint` / `npm run typecheck` がエラー0件
- [ ] `npm run check-size` で配信物の合計が100KB以内(gzip後)
- [ ] `docs/development-guidelines.md` の規約(命名・単位の接尾辞・JSDoc・名前付きexport・`textContent` のみ・文言は `messages.js`・`core/` は時刻を引数で受け取る)に従う
- [ ] `docs/repository-structure.md` のレイヤー間の依存ルールをESLintで検査している

### 動作確認
- [ ] ローカルの静的サーバーで作成画面・参加画面・読込エラーの各画面が表示され、ブラウザのコンソールにエラーが出ない
- [ ] 手動確認(機能設計書「統合テスト」)のチェックリストを `tasklist.md` に残す

## 成功指標

- 初見の主催者がメッセージ入力からQRコード表示まで1分以内に到達できる画面構成であること
- 配信物の合計転送量が100KB以内(gzip後、QRライブラリ込み)

## スコープ外

以下はこのフェーズでは実装しません:

- P1機能(フラッシュ、PWA・オフライン対応、和文モールス)
- P2機能(音、ワンダーリボンライト連動、ネイティブアプリ)
- GitHub Pagesの公開設定(リポジトリ設定の操作のため、開発者が行う)
- 実機(iPhone / Android)での検証・スロー動画による同期精度の計測(実機が必要なため、手順のみ `tasklist.md` に残す)
- 作業用ファイル(`mvp-log.json` / `output.jsonl` / `prompt.md` / `使い方メモ.txt`)の削除(残すかどうかは開発者が判断する)

## 参照ドキュメント

- `docs/product-requirements.md` - プロダクト要求定義書
- `docs/functional-design.md` - 機能設計書
- `docs/architecture.md` - 技術仕様書
- `docs/repository-structure.md` - リポジトリ構造定義書
- `docs/development-guidelines.md` - 開発ガイドライン
- `docs/glossary.md` - 用語集
