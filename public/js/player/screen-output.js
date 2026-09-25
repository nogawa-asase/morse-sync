// 消灯色は黒に固定(PRD 未決定事項1)
const OFF_COLOR = '#000000';

/**
 * 出力先の共通インターフェース。Player は出力先の種類を知らずに通知する。
 * @typedef {Object} Output
 * @property {(isOn: boolean) => void} setOn 点灯・消灯を切り替える
 * @property {() => void} dispose            後片付け(消灯して解放)
 */

/**
 * 画面点滅の出力先。全画面の要素の背景色を点灯色 / 黒に切り替える。
 * レイアウトの再計算を起こさないよう、background-color だけを変える。
 * @implements {Output}
 */
export class ScreenOutput {
  /** @type {HTMLElement} */
  #element;
  /** @type {string} */
  #onColor;

  /**
   * @param {HTMLElement} element 背景色を切り替える全画面の要素
   * @param {string} color 検証済みの点灯色(小文字16進6桁、'#'なし)
   */
  constructor(element, color) {
    this.#element = element;
    this.#onColor = `#${color}`;
    this.setOn(false);
  }

  /**
   * @param {boolean} isOn 点灯なら true
   */
  setOn(isOn) {
    // CSP の style-src 'self' でも許可される CSSOM 経由で色を設定する
    this.#element.style.backgroundColor = isOn ? this.#onColor : OFF_COLOR;
  }

  dispose() {
    this.#element.style.backgroundColor = '';
  }
}
