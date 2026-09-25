/**
 * 開始のずれの補正量を、ページを開いている間だけ覚える(端末には保存しない)。
 * 点灯パターンごとに持ち、別のパターンで参加したら0から始める。
 * 参加画面を作り直しても(QR表示・作成画面経由など)同じパターンなら残る。
 */

/** @type {{ patternKey: string, offsetMs: number } | null} */
let saved = null;

/**
 * @param {string} patternKey 点灯パターンを表す文字列(URLのハッシュ)
 * @returns {number} 覚えている補正量(ミリ秒)。別のパターンなら0
 */
export function getOffsetFor(patternKey) {
  return saved?.patternKey === patternKey ? saved.offsetMs : 0;
}

/**
 * @param {string} patternKey 点灯パターンを表す文字列(URLのハッシュ)
 * @param {number} offsetMs 補正量(ミリ秒)
 */
export function setOffsetFor(patternKey, offsetMs) {
  saved = { patternKey, offsetMs };
}
