import { createElement } from './dom.js';
import { MESSAGES } from './messages.js';

/**
 * @typedef {Object} ColorField
 * @property {HTMLInputElement} picker   カラーピッカー(ラベルの for で参照する)
 * @property {HTMLInputElement} hexInput 16進の入力欄
 * @property {() => string} getValue     検証に渡す値(入力欄の値をそのまま返す)
 * @property {(isInvalid: boolean) => void} setInvalid 入力欄のエラー表示を切り替える
 */

/**
 * 点灯色の欄を作る。カラーピッカーと16進の入力欄のどちらからでも設定でき、互いに反映する。
 * 検証は core/config-codec.js の buildFromInput が行う。
 *
 * @param {string} pickerId ラベルと関連付けるカラーピッカーのid
 * @param {string} initialColor 初期の色(小文字16進6桁、'#'なし)
 * @param {() => void} onChange 色が変わったときに呼ぶ(入力途中も含む)
 * @returns {ColorField}
 */
export function createColorField(pickerId, initialColor, onChange) {
  const picker = createElement('input', {
    className: 'field__color',
    attrs: { id: pickerId, type: 'color' },
  });
  picker.value = `#${initialColor}`;

  const hexInput = createElement('input', {
    className: 'field__input field__input--hex',
    attrs: {
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      maxlength: '9',
      'aria-label': MESSAGES.colorHexLabel,
    },
  });
  hexInput.value = picker.value;

  picker.addEventListener('input', () => {
    hexInput.value = picker.value;
    onChange();
  });
  hexInput.addEventListener('input', () => {
    const color = normalizeHexColor(hexInput.value);
    // 入力途中(6桁未満など)はピッカーを変えない。エラー表示は呼び出し側の検証に任せる
    if (color) picker.value = color;
    onChange();
  });
  hexInput.addEventListener('blur', () => {
    const color = normalizeHexColor(hexInput.value);
    if (color) hexInput.value = color;
  });

  return {
    picker,
    hexInput,
    getValue: () => hexInput.value,
    setInvalid: (isInvalid) => {
      hexInput.setAttribute('aria-invalid', String(isInvalid));
    },
  };
}

/**
 * 色コードの入力を、カラーピッカーに渡せる '#rrggbb'(小文字)にそろえる。
 * @param {string} value 入力欄の値('#' の有無・大文字・前後の空白を許す)
 * @returns {string | null} 6桁の16進なら '#rrggbb'、それ以外は null
 */
function normalizeHexColor(value) {
  const hex = value.trim().replace(/^#/, '');
  return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex.toLowerCase()}` : null;
}
