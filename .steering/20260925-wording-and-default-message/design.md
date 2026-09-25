# 設計書

- `core/period-planner.js` に `toWholeSeconds(cycleMs)`(`max(1, ceil(cycleMs / 1000))`)を追加し、`choosePeriod` もこれを使う。作成画面の「メッセージの長さ」は同じ関数で表示するため、URLの `p` と必ず一致する(60秒超でも値を表示できる)
- `ui/messages.js`: `colorLabel`、`QR_INFO.structure`、`QR_INFO.keys.v/p/c` を変更。`formatCycle` を秒の整数表示(`toWholeSeconds` を使う)に変更
- `core/defaults.js`: `DEFAULT_MESSAGE = 'NO WAR'`
- `NO WAR` の検算: N(5)+3+O(11) = 19、単語間7、W(9)+3+A(5)+3+R(7) = 27 → 送信53拍 + 区切り7拍 = 60拍 = 15.0秒 → 周期15秒
- テスト: `toWholeSeconds` の境界(8500→9、14000→14、14001→15、400→1、75000→75)、`NO WAR` の周期15秒
