/**
 * @typedef {Object} ElementOptions
 * @property {string} [className] class属性
 * @property {string} [text] 表示する文字列(textContent で設定する)
 * @property {Record<string, string>} [attrs] 属性(style 属性は CSP のため使わない)
 * @property {Record<string, EventListener>} [on] イベントリスナー
 */

/**
 * 要素を作る小さな補助関数。文字列は必ず textContent で設定し、HTMLとして解釈させない。
 *
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag タグ名
 * @param {ElementOptions} [options] 属性・文字列・イベント
 * @param {(Node | null | undefined | false)[]} [children] 子要素(偽値は無視)
 * @returns {HTMLElementTagNameMap[K]} 作った要素
 */
export function createElement(tag, options = {}, children = []) {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.text !== undefined) el.textContent = options.text;
  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    el.setAttribute(name, value);
  }
  for (const [type, listener] of Object.entries(options.on ?? {})) {
    el.addEventListener(type, listener);
  }
  for (const child of children) {
    if (child) el.append(child);
  }
  return el;
}

/**
 * 要素の表示・非表示を切り替える(hidden 属性)。
 *
 * @param {HTMLElement} el 対象の要素
 * @param {boolean} isVisible 表示するなら true
 */
export function setVisible(el, isVisible) {
  el.hidden = !isVisible;
}
