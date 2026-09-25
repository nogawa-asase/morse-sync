import { nextCycleStart, stateAt } from '../core/sync-clock.js';

/** @typedef {import('../core/types.js').Timeline} Timeline */
/** @typedef {import('../core/types.js').PlaybackState} PlaybackState */
/** @typedef {import('./screen-output.js').Output} Output */

/**
 * 毎フレーム現在時刻から点灯・消灯を判定し、出力先に通知する。
 * 同期の基準は端末間で共有できる壁時計(Date.now)だけを使う。
 * performance.now や rAF のタイムスタンプは端末ごとに起点が違うため使わない。
 */
export class Player {
  /** @type {Timeline} */
  #timeline;
  /** @type {number} */
  #unitMs;
  /** @type {number} */
  #periodMs;
  /** @type {Output[]} */
  #outputs;
  /** @type {((state: PlaybackState) => void)[]} */
  #listeners = [];
  /** @type {number} */
  #firstStartMs = 0;
  /** @type {boolean | null} null は「まだ出力に通知していない」 */
  #lastIsOn = null;
  /** @type {number | null} */
  #rafId = null;
  /** 開始のずれの手動補正(ミリ秒)。正なら早く点灯する */
  #clockOffsetMs = 0;

  /**
   * @param {Timeline} timeline 1周分の点灯区間の列
   * @param {number} unitMs 1拍の長さ(ミリ秒)
   * @param {number} periodSec 同期の周期(秒)。URLの値をそのまま使う
   * @param {Output[]} outputs 出力先
   */
  constructor(timeline, unitMs, periodSec, outputs) {
    this.#timeline = timeline;
    this.#unitMs = unitMs;
    this.#periodMs = periodSec * 1000;
    this.#outputs = outputs;
  }

  /**
   * 開始のずれの手動補正を設定する。再生中でも次のフレームから反映する。
   * 点灯判定に使う時刻をずらすだけなので、点灯の間隔は変わらない。
   * @param {number} offsetMs 補正量(ミリ秒)。正なら早く、負なら遅く
   */
  setClockOffsetMs(offsetMs) {
    this.#clockOffsetMs = offsetMs;
  }

  /**
   * 点灯判定に使う時刻。端末間で共有できる壁時計に、手動補正を加えたもの。
   * @returns {number}
   */
  #now() {
    return Date.now() + this.#clockOffsetMs;
  }

  /**
   * 再生中かどうか。
   * @returns {boolean}
   */
  get isRunning() {
    return this.#rafId !== null;
  }

  /**
   * 次の開始時刻を記録し、待機中から再生を始める。再生中なら最初からやり直す。
   * 点灯判定は毎回時刻から計算するため、再開しても周りの端末と揃う。
   */
  start() {
    this.stop();
    this.#firstStartMs = nextCycleStart(this.#now(), this.#periodMs);
    this.#lastIsOn = null;
    this.#rafId = requestAnimationFrame(this.#tick);
  }

  /**
   * ループを止め、全出力を消灯する。
   */
  stop() {
    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
    this.#notifyOutputs(false);
  }

  /**
   * 毎フレームの再生状態を受け取るリスナーを登録する(カウントダウン・送信中の文字の表示用)。
   * @param {(state: PlaybackState) => void} listener
   */
  onFrame(listener) {
    this.#listeners.push(listener);
  }

  /**
   * 停止し、出力先とリスナーを解放する。
   */
  dispose() {
    this.stop();
    this.#listeners = [];
    for (const output of this.#outputs) output.dispose();
  }

  /**
   * @param {boolean} isOn
   */
  #notifyOutputs(isOn) {
    if (isOn === this.#lastIsOn) return;
    this.#lastIsOn = isOn;
    for (const output of this.#outputs) output.setOn(isOn);
  }

  #tick = () => {
    // 次のフレームの予約を先に行い、以降で想定外の例外が出ても点滅を続ける
    this.#rafId = requestAnimationFrame(this.#tick);
    const state = stateAt(
      this.#now(),
      this.#firstStartMs,
      this.#timeline,
      this.#unitMs,
      this.#periodMs
    );
    this.#notifyOutputs(state.isOn);
    for (const listener of this.#listeners) listener(state);
  };
}
