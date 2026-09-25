# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

- **全てのタスクを`[x]`にすること**
- 未完了タスク（`[ ]`）を残したまま作業を終了しない
- スキップは技術的理由のみ。理由を明記: `- [x] ~~タスク名~~（理由）`

---

## フェーズ1: ドメイン層・再生層

- [x] `core/timing-offset.js` と `tests/unit/core/timing-offset.test.js`
- [x] `player/player.js` に `setClockOffsetMs` を追加

## フェーズ2: プレゼンテーション層

- [x] `ui/messages.js` に文言と `formatOffset` を追加
- [x] `ui/timing-offset-store.js` を作成
- [x] `ui/timing-adjuster.js` を作成
- [x] `ui/join-menu.js` に追加の行を置けるようにする
- [x] `ui/join-screen.js` に組み込む(300行以下を確認。298行)
- [x] `public/css/style.css` に補正の行のスタイル

## フェーズ3: 品質チェック

- [x] `npm test` / `npm run test:coverage` / `npm run lint` / `npm run typecheck` / `npm run check-size`(124件、core/ 行100%・分岐98.5%、57.1KB)
- [x] ヘッドレスブラウザで受け入れ条件を確認(点灯の位相: 補正なし+13ms、早く2回で−88ms、50ms遅くで+63ms。QR表示・作成画面経由で残る、別パターン・読み込み直しで0、上限で無効、44px、幅320px)

## フェーズ4: ドキュメント更新

- [x] `docs/product-requirements.md`(機能4に補正を追加)
- [x] `docs/functional-design.md`(Player、アルゴリズム4、参加画面のメニュー)
- [x] `docs/repository-structure.md`(追加ファイル)
- [x] `docs/glossary.md`(補正の用語)
- [x] README.md(使い方)
- [x] 実機確認のチェックリストを記載
- [x] 実装後の振り返り

---

## 実機で確認すること(開発者が実施)

- 未実施: 2台以上を並べ、ずれている端末で「早く」「遅く」を押して揃えられる
- 未実施: QRコードを見せて戻っても、補正が残っている

---

## 実装後の振り返り

### 実装完了日
2026-09-25

### 計画と実績の差分
- 幅320pxで補正の行が「早く・補正量」「遅く・0に戻す」と分かれて並び、分かりにくかったため、補正量の表示幅を詰めて「◀ 早く / 補正量 / 遅く ▶」を1行、「0に戻す」を次の行にした
- `ui/join-screen.js` は298行。次にこの画面へ機能を足すときは、先に分割が必要

### 学んだこと
- 点灯判定の時刻を1か所(`Player.#now()`)に集めていたため、補正は時刻に足すだけで、画面・フラッシュの両方に効いた

### 次回への改善提案
- 実機で並べて、50msの幅が合わせやすいか確認する。粗ければ25ms、細かすぎれば100msを検討する
