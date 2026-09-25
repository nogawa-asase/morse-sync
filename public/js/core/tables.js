import { EN_TABLE } from './tables/en.js';

/** @typedef {import('./types.js').MorseTable} MorseTable */

/** @type {Readonly<Record<string, MorseTable>>} */
const TABLES = Object.freeze({ en: EN_TABLE });

/**
 * 文字の種類(URLの l)から変換表を選ぶ。
 *
 * @param {string} lang 文字の種類
 * @returns {MorseTable | null} 変換表。対応していない文字の種類なら null
 */
export function getTable(lang) {
  return Object.hasOwn(TABLES, lang) ? TABLES[lang] : null;
}
