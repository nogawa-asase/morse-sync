/** @typedef {import('./screen-output.js').Output} Output */

/**
 * フラッシュ(トーチ)の出力先。
 * 参加画面を作るときにトラックなしで生成して Player に渡し、
 * カメラを取得できたら attach() で取り付ける(Player に出力先の追加・削除の仕組みを持たせないため)。
 * トラックの取得・解放は呼び出し側(platform/camera-torch.js)が行う。
 * @implements {Output}
 */
export class TorchOutput {
  /** @type {MediaStreamTrack | null} */
  #track = null;
  /** 最後に指示された状態 */
  #desiredIsOn = false;
  /** @type {boolean | null} トラックに適用済みの状態。null は未適用 */
  #appliedIsOn = null;
  #isApplying = false;

  /**
   * 点灯・消灯を指示する。applyConstraints を待たずに戻る(毎フレームの処理を止めないため)。
   * @param {boolean} isOn 点灯なら true
   */
  setOn(isOn) {
    this.#desiredIsOn = isOn;
    this.#flush();
  }

  /**
   * トーチを持つ映像トラックを取り付け、現在の指示をすぐ反映する。
   * @param {MediaStreamTrack} track トーチを持つ映像トラック
   */
  attach(track) {
    this.#track = track;
    this.#appliedIsOn = null;
    this.#flush();
  }

  /**
   * 消灯を試みてからトラックを手放す。トラックの解放(stop)は呼び出し側で行う。
   */
  detach() {
    const track = this.#track;
    this.#track = null;
    this.#appliedIsOn = null;
    if (track && track.readyState === 'live') {
      applyTorch(track, false).catch(() => {});
    }
  }

  dispose() {
    this.#desiredIsOn = false;
    this.detach();
  }

  /**
   * 指示と適用済みの状態がずれていれば適用する。
   * 適用中に次の指示が来たら、完了後に最新の指示だけを適用する
   * (古い指示が後から適用されて点灯・消灯が逆転するのを防ぐ)。
   */
  async #flush() {
    if (this.#isApplying) return;
    this.#isApplying = true;
    try {
      while (this.#track && this.#appliedIsOn !== this.#desiredIsOn) {
        const track = this.#track;
        const isOn = this.#desiredIsOn;
        try {
          await applyTorch(track, isOn);
          // 適用中に取り外された場合は、適用済みとして記録しない
          if (track === this.#track) this.#appliedIsOn = isOn;
        } catch (error) {
          console.warn('フラッシュを切り替えられませんでした', error);
          // 同じ指示を繰り返し失敗し続けないよう、次の指示が来るまで待つ
          if (track === this.#track) this.#appliedIsOn = isOn;
        }
      }
    } finally {
      this.#isApplying = false;
    }
  }
}

/**
 * @param {MediaStreamTrack} track 映像トラック
 * @param {boolean} isOn 点灯なら true
 * @returns {Promise<void>}
 */
function applyTorch(track, isOn) {
  // torch は標準の型定義にない制約のため、型を広げて渡す
  const constraints = /** @type {MediaTrackConstraints} */ (
    /** @type {unknown} */ ({ advanced: [{ torch: isOn }] })
  );
  return track.applyConstraints(constraints);
}
