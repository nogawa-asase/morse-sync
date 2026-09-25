# 設計書

## 変更の概要

`core/period-planner.js` の周期の決め方と検証だけを変える。開始時刻の計算(`core/sync-clock.js` の `floor(now / periodMs) × periodMs`)は、周期が何秒でも全端末で同じ時刻になるため変更しない。

## core/period-planner.js

```javascript
/** 同期の周期の上限(秒)。途中から参加した人の待ち時間を抑えるため */
export const MAX_PERIOD_SEC = 60;

/** 所要時間を秒単位で切り上げた周期。60秒を超えたら null */
export function choosePeriod(cycleMs) {
  if (cycleMs > MAX_PERIOD_SEC * 1000) return null;
  return Math.max(1, Math.ceil(cycleMs / 1000));
}

/** 1〜60の整数で、所要時間以上なら有効 */
export function isValidPeriod(periodSec, cycleMs) {
  return Number.isInteger(periodSec) && periodSec >= 1
    && periodSec <= MAX_PERIOD_SEC && periodSec * 1000 >= cycleMs;
}
```

- `PERIOD_CANDIDATES_SEC` は削除する(他から参照されているのは `period-planner.js` とそのテストのみ)
- `cycleMs` は `拍数 × 1拍(整数ms)` の整数なので、`Math.ceil` の丸め誤差は起きない

## 互換性

- URLの `p` の意味(周期・秒の整数)は変わらない。検証が緩くなるだけなので `v=1` のまま
- 既存のQRコードは、`p` が60の約数かつ所要時間以上なので、新しい検証でも有効
- 同じ内容でも、新しく作ったQRコードは周期が変わる(例: `SOS` は10秒 → 9秒)。古いQRコードと新しいQRコードを同じ場で混ぜると揃わない(同じQRコードを配る限り問題ない)

## テスト

- `period-planner.test.js`: 切り上げ(8.5→9、14.0→14、31.2→32)、下限(0.4秒→1)、上限(60.0→60、60.1→null)、検証(16は有効、0・61・小数・短いは無効)
- `config-codec.test.js`: `SOS` の周期9秒、60の約数でない `p` の受け入れ、旧URL例 `p=15` の読み込み
- `sync-clock.test.js`: 周期が60の約数でない(例: 32秒)場合も、開始時刻が周期の倍数になり、同じ時刻なら同じ状態になること
