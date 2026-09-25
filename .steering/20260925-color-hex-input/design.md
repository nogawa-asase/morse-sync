# 設計書

## アーキテクチャ概要

`ui/create-screen.js` の点灯色の欄だけを変更する。色の検証は既存の `core/config-codec.js`(`buildFromInput` → `parseColor`、`INVALID_COLOR`)をそのまま使う。

## コンポーネント設計

### ui/create-screen.js

- `colorText`(span)と `colorSwatch` を削除し、`colorHexInput`(`<input type="text">`)を追加する
  - 属性: `inputmode="text"`、`autocapitalize="off"`、`autocomplete="off"`、`spellcheck="false"`、`maxlength="7"`、`aria-label="点灯色(16進)"`
- 検証に渡す色は入力欄の値とする(`#` の有無は `buildFromInput` が吸収する)
- カラーピッカーの `input`: 入力欄に `colorInput.value` を入れて `update()`
- 入力欄の `input`: 値が6桁の16進なら `colorInput.value = '#' + 小文字` にして `update()`。不正でも `update()` を呼び、`INVALID_COLOR` を表示してQRコードを隠す
- 入力欄の `blur`: 値が正しければ `#rrggbb`(小文字)に整える
- 入力欄の `aria-invalid` を、`INVALID_COLOR` があるときに真にする

### ui/messages.js

- `ERROR_MESSAGES.INVALID_COLOR` を「点灯色は #ffcc00 のように6桁で入力してください」に変更(参加画面では従来どおり「QRコードの内容が正しくありません」に丸める)
- `colorHexLabel: '点灯色(16進)'` を追加、使わなくなる `colorPreviewLabel` を削除

### public/css/style.css

- `.color-text` / `.color-swatch` を削除し、`.field__input--hex`(等幅、幅 6.5em 程度)を追加

## テスト戦略

- `core/` の変更はないため、ユニットテストは既存のまま(`buildFromInput` の `#` あり・なし・大文字は既存テストで確認済みか確認し、なければ追加)
- ヘッドレスブラウザで、ピッカー → 入力欄、入力欄 → ピッカー・URL、不正値でのエラーとQRコードの非表示、blur 時の整形を確認

## ディレクトリ構造

```
public/js/ui/create-screen.js  # 変更
public/js/ui/messages.js       # 変更
public/css/style.css           # 変更
```
