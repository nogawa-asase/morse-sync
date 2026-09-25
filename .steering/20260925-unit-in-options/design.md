# 設計書

- HTML標準の `<details>` / `<summary>` を使う(JavaScriptなしで開閉でき、キーボード・読み上げにも対応する)
- `ui/create-screen.js`: 1拍の長さの欄を `<details class="options">` に入れ、`<summary>` の文言は `MESSAGES.options`(「オプション」)
  - 初期値が `DEFAULT_UNIT_MS` 以外なら `open` にする
  - `update()` で `UNIT_OUT_OF_RANGE` があれば `open = true`
- `public/css/style.css`: `summary` を44px以上のボタン風にする。開閉を示す ▸ / ▾ を付ける
