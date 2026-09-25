/**
 * 同期の周期の上限(秒)。途中から参加した人が最初の開始時刻まで待つ時間を抑えるため。
 */
export const MAX_PERIOD_SEC = 60;

/**
 * 1周分の所要時間から、同期の周期を自動で決める。
 * 繰り返しの間の消灯を短くするため、所要時間を秒単位で切り上げる(最小1秒)。
 * 開始時刻は「UNIX時刻0から周期の倍数の時刻」なので、周期が何秒でも全端末で揃う。
 * 秒の整数にするのは、URLの p(秒の整数)の形式を変えずに済ませるため。
 *
 * @param {number} cycleMs 1周分の所要時間(ミリ秒、末尾の区切り7拍を含む)
 * @returns {number | null} 周期(秒)。60秒に収まらなければ null
 */
export function choosePeriod(cycleMs) {
  if (cycleMs > MAX_PERIOD_SEC * 1000) return null;
  return Math.max(1, Math.ceil(cycleMs / 1000));
}

/**
 * URLで受け取った周期が使えるか判定する。参加側は周期を選び直さない。
 * 以前の版が作った60の約数の周期(例: p=10、p=60)も、この条件で有効になる。
 *
 * @param {number} periodSec 周期(秒)
 * @param {number} cycleMs 1周分の所要時間(ミリ秒)
 * @returns {boolean} 1〜60の整数で、かつ1周分の所要時間以上なら true
 */
export function isValidPeriod(periodSec, cycleMs) {
  return (
    Number.isInteger(periodSec) &&
    periodSec >= 1 &&
    periodSec <= MAX_PERIOD_SEC &&
    periodSec * 1000 >= cycleMs
  );
}
