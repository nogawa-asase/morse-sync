import { findSegment } from './timeline.js';

/** @typedef {import('./types.js').Timeline} Timeline */
/** @typedef {import('./types.js').PlaybackState} PlaybackState */

/**
 * 現在時刻を含む周期の開始時刻を求める。
 * UNIX時刻0は分の0秒で、周期は60秒の約数なので、どの端末でも同じ時刻になる。
 *
 * @param {number} nowMs 現在のUNIX時刻(ミリ秒)
 * @param {number} periodMs 同期の周期(ミリ秒)
 * @returns {number} 周期の開始時刻(ミリ秒)
 */
export function currentCycleStart(nowMs, periodMs) {
  return Math.floor(nowMs / periodMs) * periodMs;
}

/**
 * 次に来る開始時刻を求める。境界ちょうどなら現在時刻をそのまま返す(即開始)。
 *
 * @param {number} nowMs 現在のUNIX時刻(ミリ秒)
 * @param {number} periodMs 同期の周期(ミリ秒)
 * @returns {number} 次の開始時刻(ミリ秒)
 */
export function nextCycleStart(nowMs, periodMs) {
  return Math.ceil(nowMs / periodMs) * periodMs;
}

/**
 * ある時刻の再生状態を求める。
 * 前回からの経過時間を積み上げず、毎回現在時刻から計算するため、
 * フレーム落ちや長時間の動作でも誤差が蓄積しない。
 *
 * @param {number} nowMs 現在のUNIX時刻(ミリ秒)
 * @param {number} firstStartMs 参加後の最初の開始時刻(ミリ秒)
 * @param {Timeline} timeline 1周分の点灯区間の列
 * @param {number} unitMs 1拍の長さ(ミリ秒)
 * @param {number} periodMs 同期の周期(ミリ秒)
 * @returns {PlaybackState} 再生状態
 */
export function stateAt(nowMs, firstStartMs, timeline, unitMs, periodMs) {
  if (nowMs < firstStartMs) {
    return {
      phase: 'waiting',
      isOn: false,
      charIndex: null,
      msToNextStart: firstStartMs - nowMs,
    };
  }
  const cycleStartMs = currentCycleStart(nowMs, periodMs);
  const elapsedUnits = (nowMs - cycleStartMs) / unitMs;
  const segment = findSegment(timeline.segments, elapsedUnits);
  return {
    phase: 'playing',
    isOn: segment !== null,
    charIndex: segment ? segment.charIndex : null,
    msToNextStart: cycleStartMs + periodMs - nowMs,
  };
}
