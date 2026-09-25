# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

- **全てのタスクを`[x]`にすること**
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

- [x] `ui/messages.js` に `options`(オプション)を追加
- [x] (300行を超えたため `ui/unit-option.js` に分割) `ui/create-screen.js`: 1拍の長さを `<details>` に入れ、並び順を変更、既定値以外・範囲外エラーで開く
- [x] `public/css/style.css`: `summary` のスタイル
- [x] `npm test` / `npm run lint` / `npm run typecheck`
- [x] ヘッドレスブラウザで確認(初期は閉じている、開閉、既定値以外で開いている、範囲外で自動で開く、44px、幅320px)
- [x] `docs/product-requirements.md` / `docs/functional-design.md` を更新(`docs/repository-structure.md` に `ui/unit-option.js` も追記)
- [x] 実装後の振り返り

---

## 実装後の振り返り

### 実装完了日
2026-09-25

### 計画と実績の差分
- 作成画面が308行になったため、1拍の長さの欄と開閉部分を `ui/unit-option.js` に分けた(作成画面は275行)

### 次回への改善提案
- 他にも「普段は触らない設定」が増えたら、同じ「オプション」の中にまとめる
