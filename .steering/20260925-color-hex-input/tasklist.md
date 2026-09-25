# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

- **全てのタスクを`[x]`にすること**
- 未完了タスク（`[ ]`）を残したまま作業を終了しない
- スキップは技術的理由のみ。理由を明記: `- [x] ~~タスク名~~（理由）`

---

## フェーズ1: 実装

- [x] `ui/messages.js`: `INVALID_COLOR` の文言変更、`colorHexLabel` 追加、`colorPreviewLabel` 削除
- [x] `ui/create-screen.js`: プレビューを削除し、16進の入力欄を追加(300行を超えたため、色の欄は `ui/color-field.js` に分けた)
  - [x] ピッカー → 入力欄の反映
  - [x] 入力欄 → ピッカーの反映(正しい6桁のとき)
  - [x] 不正値でエラー表示・QRコード非表示、`aria-invalid`
  - [x] blur で `#rrggbb`(小文字)に整形
- [x] `public/css/style.css`: `.color-text` / `.color-swatch` を削除、入力欄のスタイルを追加
- [x] `buildFromInput` の色(`#` あり・なし・大文字・不正)のユニットテストがあるか確認し、なければ追加(`#` なし・前後の空白・途中入力のテストを追加。貼り付け時の空白に備え `buildFromInput` で色を trim するよう `core/config-codec.js` も変更)

## フェーズ2: 品質チェック

- [x] `npm test`(114件)
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run check-size`(49.9KB)
- [x] ヘッドレスブラウザで受け入れ条件を確認(ピッカー⇔入力欄、`#`なし・大文字・空白、blur整形、途中入力のエラーとQR非表示、高さ44px以上、幅320pxで同じ行に収まり横スクロールなし、コンソールエラーなし)
- [x] `docs/repository-structure.md` に `ui/color-field.js` を追記

## フェーズ3: ドキュメント更新

- [x] `docs/product-requirements.md` 機能1の受け入れ条件(プレビュー → 相互反映)
- [x] `docs/functional-design.md` 作成画面の図・エラーハンドリングの文言
- [x] `docs/glossary.md` エラー表の `INVALID_COLOR` の文言
- [x] 実装後の振り返り(このファイルの下部に記録)

---

## 実装後の振り返り

### 実装完了日
2026-09-25

### 計画と実績の差分
- `ui/create-screen.js` が320行になったため、点灯色の欄(ピッカー・入力欄・相互反映)を `ui/color-field.js` に分けた(作成画面は279行)
- 入力欄への貼り付けで前後に空白が入る場合に備え、`core/config-codec.js` の `buildFromInput` で色を trim するようにした(ユニットテスト追加)
- 幅320pxで入力欄が次の行に折り返したため、入力欄の幅を 7em → 6em にした

### 学んだこと
- 検証を `core/` の1か所に置いていたため、UI側は「正しい6桁ならピッカーに反映」だけを持てばよく、エラー表示・QRコードの非表示は既存の流れに乗せられた

### 次回への改善提案
- iPhoneで、ソフトウェアキーボードでの入力・貼り付けと、カラーピッカーからの反映を確認する
