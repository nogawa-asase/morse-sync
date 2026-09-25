/**
 * 同期の周期の候補(秒)。60の約数に限ることで、毎分0秒がどの周期でも
 * 開始時刻になり、端末の時計だけで開始時刻を揃えられる。
 */
export const PERIOD_CANDIDATES_SEC = Object.freeze([
  1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60,
]);

/**
 * 1周分の所要時間から、同期の周期を自動で決める。
 * 繰り返しの間の消灯を短くするため、所要時間以上の60の約数のうち最短を選ぶ。
 *
 * @param {number} cycleMs 1周分の所要時間(ミリ秒、末尾の区切り7拍を含む)
 * @returns {number | null} 周期(秒)。60秒に収まらなければ null
 */
export function choosePeriod(cycleMs) {
  return PERIOD_CANDIDATES_SEC.find((p) => p * 1000 >= cycleMs) ?? null;
}

/**
 * URLで受け取った周期が使えるか判定する。参加側は周期を選び直さない。
 *
 * @param {number} periodSec 周期(秒)
 * @param {number} cycleMs 1周分の所要時間(ミリ秒)
 * @returns {boolean} 60の約数で、かつ1周分の所要時間以上なら true
 */
export function isValidPeriod(periodSec, cycleMs) {
  return (
    PERIOD_CANDIDATES_SEC.includes(periodSec) && periodSec * 1000 >= cycleMs
  );
}
