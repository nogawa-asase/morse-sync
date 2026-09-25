/** @typedef {import('./types.js').EncodedMessage} EncodedMessage */
/** @typedef {import('./types.js').EncodedChar} EncodedChar */
/** @typedef {import('./types.js').Timeline} Timeline */
/** @typedef {import('./types.js').OnSegment} OnSegment */

// ITU-R M.1677 の拍数の比率
const DOT_UNITS = 1;
const DASH_UNITS = 3;
const INTRA_CHAR_GAP_UNITS = 1;
const INTER_CHAR_GAP_UNITS = 3;
const WORD_GAP_UNITS = 7;
// 周の末尾の区切り。次の周の先頭と続けて読まれないよう、単語間の間隔と同じ長さにする
const CYCLE_GAP_UNITS = WORD_GAP_UNITS;

/**
 * 符号化結果を空白で単語に分ける。符号のない文字(空白・対応外)は含めない。
 *
 * @param {EncodedChar[]} chars 符号化結果の文字
 * @returns {EncodedChar[][]} 単語ごとの文字の並び
 */
function splitWords(chars) {
  /** @type {EncodedChar[][]} */
  const words = [];
  /** @type {EncodedChar[]} */
  let word = [];
  for (const ch of chars) {
    if (ch.char === ' ') {
      if (word.length > 0) words.push(word);
      word = [];
    } else if (ch.code) {
      word.push(ch);
    }
  }
  if (word.length > 0) words.push(word);
  return words;
}

/**
 * 符号化結果を、1周分の点灯区間の列に展開する。
 * 対応外の文字(符号が null)は無視する。
 *
 * @param {EncodedMessage} encoded 符号化結果
 * @returns {Timeline} 点灯区間の列と1周分の拍数(末尾の区切りを含む)
 */
export function buildTimeline(encoded) {
  /** @type {OnSegment[]} */
  const segments = [];
  let t = 0;
  splitWords(encoded.chars).forEach((word, wordIndex) => {
    if (wordIndex > 0) t += WORD_GAP_UNITS;
    word.forEach((ch, charPos) => {
      if (charPos > 0) t += INTER_CHAR_GAP_UNITS;
      [...(ch.code ?? '')].forEach((symbol, symbolPos) => {
        if (symbolPos > 0) t += INTRA_CHAR_GAP_UNITS;
        const lengthUnits = symbol === '.' ? DOT_UNITS : DASH_UNITS;
        segments.push({
          startUnit: t,
          endUnit: t + lengthUnits,
          charIndex: ch.sourceIndex,
        });
        t += lengthUnits;
      });
    });
  });
  return { segments, totalUnits: t + CYCLE_GAP_UNITS };
}

/**
 * 1周分の所要時間を求める。
 *
 * @param {Timeline} timeline 点灯区間の列
 * @param {number} unitMs 1拍の長さ(ミリ秒)
 * @returns {number} 1周分の所要時間(ミリ秒、末尾の区切りを含む)
 */
export function cycleMsOf(timeline, unitMs) {
  return timeline.totalUnits * unitMs;
}

/**
 * 周期内の位置(拍)を含む点灯区間を二分探索で探す。
 *
 * @param {OnSegment[]} segments 点灯区間。開始拍の昇順で重ならないこと
 * @param {number} elapsedUnits 周期の開始からの経過拍数(小数可)
 * @returns {OnSegment | null} 含む区間。消灯中なら null
 */
export function findSegment(segments, elapsedUnits) {
  let low = 0;
  let high = segments.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const segment = segments[mid];
    if (elapsedUnits < segment.startUnit) {
      high = mid - 1;
    } else if (elapsedUnits >= segment.endUnit) {
      low = mid + 1;
    } else {
      return segment;
    }
  }
  return null;
}
