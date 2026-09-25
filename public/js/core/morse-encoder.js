/** @typedef {import('./types.js').MorseTable} MorseTable */
/** @typedef {import('./types.js').EncodedMessage} EncodedMessage */
/** @typedef {import('./types.js').EncodedChar} EncodedChar */

const WORD_SEPARATOR = ' ';

/**
 * 変換表の規則でメッセージを正規化する(大文字化・空白の整理など)。
 *
 * @param {string} input 入力された文字列
 * @param {MorseTable} table 変換表
 * @returns {string} 正規化後のメッセージ
 */
export function normalizeMessage(input, table) {
  return table.normalize(input);
}

/**
 * 正規化済みのメッセージを文字ごとの符号に変換し、対応外の文字を集める。
 * 文字はコードポイント単位で扱う(絵文字を1文字として報告するため)。
 *
 * @param {string} normalized 正規化済みのメッセージ
 * @param {MorseTable} table 変換表
 * @returns {EncodedMessage} 符号化結果
 */
export function encodeMessage(normalized, table) {
  /** @type {EncodedChar[]} */
  const chars = [];
  /** @type {string[]} */
  const unsupported = [];
  [...normalized].forEach((char, sourceIndex) => {
    if (char === WORD_SEPARATOR) {
      chars.push({ char, code: '', sourceIndex });
      return;
    }
    const code = Object.hasOwn(table.codes, char) ? table.codes[char] : null;
    if (code === null && !unsupported.includes(char)) {
      unsupported.push(char);
    }
    chars.push({ char, code, sourceIndex });
  });
  return { chars, unsupported };
}

/**
 * 内部の符号('.' と '-')を画面表示用の記号に置き換える。
 *
 * @param {string} code 符号 例: '.-'
 * @returns {string} 表示用の符号 例: '・−'
 */
export function formatCode(code) {
  return code.replaceAll('.', '・').replaceAll('-', '−');
}

/**
 * 符号化結果全体を画面表示用の文字列にする。
 * 文字ごとに空白で区切り、単語の区切りは '/'、対応外の文字は '?' で表す。
 *
 * @param {EncodedMessage} encoded 符号化結果
 * @returns {string} 表示用の文字列 例: '・・・ −−− ・・・'
 */
export function formatEncodedMessage(encoded) {
  return encoded.chars
    .map((ch) => {
      if (ch.char === WORD_SEPARATOR) return '/';
      return ch.code === null ? '?' : formatCode(ch.code);
    })
    .join(' ');
}
