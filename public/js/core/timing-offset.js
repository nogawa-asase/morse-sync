/**
 * 開始のずれの手動補正。
 * 端末の時計のずれは通信なしでは測れないため、参加者が目で見ながら合わせる。
 * 補正量は正なら「早く」、負なら「遅く」(点灯判定に使う時刻を補正量だけ進める)。
 */

/** 1回の補正の幅(ミリ秒)。画面の更新間隔(約17ms)より大きく、1拍(既定250ms)より十分小さい */
export const OFFSET_STEP_MS = 50;

/** 補正の上限(ミリ秒)。これより大きいずれは、端末の時刻の自動設定を直すのが本来の対処 */
export const MAX_OFFSET_MS = 1000;

/**
 * 補正量を変え、±MAX_OFFSET_MS に収める。
 * @param {number} currentMs 今の補正量(ミリ秒)
 * @param {number} deltaMs 変える量(ミリ秒)。早くするなら正
 * @returns {number} 新しい補正量(ミリ秒)
 */
export function adjustOffset(currentMs, deltaMs) {
  return Math.min(MAX_OFFSET_MS, Math.max(-MAX_OFFSET_MS, currentMs + deltaMs));
}
