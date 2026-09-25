import { DEFAULT_UNIT_MS, MAX_UNIT_MS, MIN_UNIT_MS } from '../core/defaults.js';
import { createElement } from './dom.js';
import { MESSAGES } from './messages.js';

/**
 * @typedef {Object} UnitOption
 * @property {HTMLDetailsElement} element 「オプション」の開閉部分
 * @property {() => string} getValue 検証に渡す値(入力欄の値をそのまま返す)
 * @property {() => void} open 開く(範囲外のエラーを見せるときに使う)
 */

/**
 * 作成画面の「1拍の長さ」を、「オプション」を押すと開く形で作る。
 * 1拍の長さは変えると分かりにくいため、普段は隠しておく。
 * 検証は core/config-codec.js の buildFromInput が行う。
 *
 * @param {number | undefined} initialUnitMs 引き継いだ1拍の長さ(なければ既定値)
 * @param {() => void} onChange 値が変わったときに呼ぶ
 * @returns {UnitOption}
 */
export function createUnitOption(initialUnitMs, onChange) {
  const input = createElement('input', {
    className: 'field__input field__input--number',
    attrs: {
      id: 'unit-input',
      type: 'number',
      inputmode: 'numeric',
      min: String(MIN_UNIT_MS),
      max: String(MAX_UNIT_MS),
      step: '1',
    },
  });
  input.value = String(initialUnitMs ?? DEFAULT_UNIT_MS);
  input.addEventListener('input', onChange);

  const element = createElement('details', { className: 'options' }, [
    createElement('summary', { text: MESSAGES.options }),
    createElement('div', { className: 'field field--inline' }, [
      createElement('label', {
        className: 'field__label',
        text: MESSAGES.unitLabel,
        attrs: { for: 'unit-input' },
      }),
      input,
      createElement('span', { text: MESSAGES.unitSuffix }),
    ]),
  ]);
  // 既定値以外の設定を引き継いだときは、隠れて気づけなくならないよう開いておく
  element.open = input.value !== String(DEFAULT_UNIT_MS);

  return {
    element,
    getValue: () => input.value,
    open: () => {
      element.open = true;
    },
  };
}
