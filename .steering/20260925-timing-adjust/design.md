# 設計書

## 補正の仕組み

- 補正量 `clockOffsetMs`(ミリ秒)。正なら「早く」、負なら「遅く」
- Player は点灯判定に使う時刻を `Date.now() + clockOffsetMs` にする。開始時刻の計算(`nextCycleStart`)にも同じ時刻を使う
  - 例: 50ms早くすると、周期の開始時刻の50ms前に点灯し始める(= 50ms先の状態を表示する)
- 点灯間隔は1拍の長さで決まるため、補正しても変わらない

## コンポーネント

### core/timing-offset.js(追加、DOM非依存)

```javascript
export const OFFSET_STEP_MS = 50;
export const MAX_OFFSET_MS = 1000;
/** 補正量を delta だけ変え、±MAX_OFFSET_MS に収める */
export function adjustOffset(currentMs, deltaMs): number;
```

### player/player.js(変更)

- `setClockOffsetMs(ms)` を追加。`#now()` = `Date.now() + this.#clockOffsetMs` を `start()` と `#tick` で使う
- 再生中に変えてもよい(次のフレームから反映)

### ui/timing-offset-store.js(追加)

- ページを開いている間だけ補正量を覚えるモジュール内の変数。点灯パターン(`toHash(config)`)ごとに持ち、別のパターンになったら0から
```javascript
export function getOffsetFor(patternKey): number;
export function setOffsetFor(patternKey, offsetMs): void;
```

### ui/timing-adjuster.js(追加)

- 「◀ 早く」「補正量」「遅く ▶」「0に戻す」の1行を作る。ボタンの有効・無効(上限)と表示を管理する
```javascript
export function createTimingAdjuster(initialMs, onChange: (ms) => void): { element: HTMLElement };
```

### ui/join-menu.js(変更)

- 任意の追加の行(`extraRow`)をメニューの最後に置けるようにする

### ui/join-screen.js(変更)

- 参加画面を作るときに `getOffsetFor(key)` で補正量を取り出し、`player.setClockOffsetMs` と `createTimingAdjuster` に渡す。変わったら `setOffsetFor` と `player.setClockOffsetMs`

### ui/messages.js(変更)

- `earlier`(◀ 早く)、`later`(遅く ▶)、`resetOffset`(0に戻す)、`formatOffset(ms)`(「補正なし」「50ms早く」「100ms遅く」)

## テスト

- `core/timing-offset.js`: 50msずつの増減、±1000msでの頭打ち
- ヘッドレスブラウザ: 補正前後で点灯の開始が50ms単位でずれること、QR表示・一時停止・作成画面経由で補正が残ること、別パターンで0に戻ること
