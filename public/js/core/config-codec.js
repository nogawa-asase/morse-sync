import {
  SPEC_VERSION,
  DEFAULT_LANG,
  DEFAULT_UNIT_MS,
  MIN_UNIT_MS,
  MAX_UNIT_MS,
  MAX_MESSAGE_LENGTH,
  DEFAULT_COLOR,
} from './defaults.js';
import { getTable } from './tables.js';
import { normalizeMessage, encodeMessage } from './morse-encoder.js';
import { buildTimeline, cycleMsOf } from './timeline.js';
import { choosePeriod, isValidPeriod } from './period-planner.js';

/** @typedef {import('./types.js').PatternConfig} PatternConfig */
/** @typedef {import('./types.js').MorseTable} MorseTable */
/** @typedef {import('./types.js').EncodedMessage} EncodedMessage */
/** @typedef {import('./types.js').ValidationError} ValidationError */
/** @typedef {import('./types.js').ValidationResult} ValidationResult */
/** @typedef {import('./types.js').CreateInput} CreateInput */
/** @typedef {import('./types.js').MessagePreview} MessagePreview */

// URLのキー(v l m p u c)はこのファイルの中だけで使う
const DIGITS_PATTERN = /^\d+$/;
const HEX_COLOR_PATTERN = /^[0-9a-fA-F]{6}$/;

/**
 * メッセージを正規化・符号化し、文字数と対応文字を検証する。
 *
 * @param {string} rawMessage 入力またはURLのメッセージ
 * @param {MorseTable} table 変換表
 * @returns {{ normalized: string, encoded: EncodedMessage, errors: ValidationError[] }}
 */
function validateMessage(rawMessage, table) {
  const normalized = normalizeMessage(rawMessage, table);
  const encoded = encodeMessage(normalized, table);
  /** @type {ValidationError[]} */
  const errors = [];
  const length = encoded.chars.length;
  if (length === 0) {
    errors.push({ code: 'EMPTY_MESSAGE' });
  } else if (length > MAX_MESSAGE_LENGTH) {
    errors.push({ code: 'MESSAGE_TOO_LONG' });
  }
  if (encoded.unsupported.length > 0) {
    errors.push({
      code: 'UNSUPPORTED_CHARS',
      detail: encoded.unsupported.join(' '),
    });
  }
  return { normalized, encoded, errors };
}

/**
 * 1拍の長さの文字列を検証して数値にする。
 *
 * @param {string} rawUnitMs 1拍の長さ(ミリ秒)の文字列
 * @returns {number | null} 200〜2000の整数なら数値、それ以外は null
 */
function parseUnitMs(rawUnitMs) {
  const trimmed = rawUnitMs.trim();
  if (!DIGITS_PATTERN.test(trimmed)) return null;
  const unitMs = Number(trimmed);
  return unitMs >= MIN_UNIT_MS && unitMs <= MAX_UNIT_MS ? unitMs : null;
}

/**
 * 点灯色の文字列を検証して小文字の16進6桁にする。
 *
 * @param {string} rawColor '#'なしの16進6桁
 * @returns {string | null} 小文字の16進6桁。不正なら null
 */
function parseColor(rawColor) {
  return HEX_COLOR_PATTERN.test(rawColor) ? rawColor.toLowerCase() : null;
}

/**
 * 点滅パターンをURLのハッシュにする。
 * キーの順序を固定し、既定値と同じ任意項目も省略しない
 * (同じ設定なら常に同じURL・同じQRコードになるように)。
 *
 * @param {PatternConfig} config 検証済みの設定
 * @returns {string} ハッシュ 例: '#v=1&l=en&m=HELLO&p=15&u=250&c=ffcc00'
 */
export function toHash(config) {
  return (
    `#v=${config.version}&l=${config.lang}` +
    `&m=${encodeURIComponent(config.message)}` +
    `&p=${config.periodSec}&u=${config.unitMs}&c=${config.color}`
  );
}

/**
 * 共有URL(QRコードの中身)を作る。
 *
 * @param {PatternConfig} config 検証済みの設定
 * @param {string} baseUrl ページのURL。ハッシュが付いていれば取り除く
 * @returns {string} 共有URL
 */
export function toShareUrl(config, baseUrl) {
  return baseUrl.split('#')[0] + toHash(config);
}

/**
 * URLのハッシュを読み込んで検証する(参加画面用)。
 * 周期はURLの値をそのまま使い、計算し直さない。
 *
 * @param {string} hash location.hash の値('#' は付いていてもなくてもよい)
 * @returns {ValidationResult} 検証結果
 */
export function parseHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));

  const version = params.get('v');
  if (version === null) {
    return { ok: false, errors: [{ code: 'MISSING_FIELD', detail: 'v' }] };
  }
  if (version !== String(SPEC_VERSION)) {
    return {
      ok: false,
      errors: [{ code: 'UNKNOWN_VERSION', detail: version }],
    };
  }

  /** @type {ValidationError[]} */
  const errors = [];

  const lang = params.get('l') ?? DEFAULT_LANG;
  const table = getTable(lang);
  if (table === null) errors.push({ code: 'UNKNOWN_LANG', detail: lang });

  const rawMessage = params.get('m');
  /** @type {ReturnType<typeof validateMessage> | null} */
  let message = null;
  if (rawMessage === null) {
    errors.push({ code: 'MISSING_FIELD', detail: 'm' });
  } else if (table !== null) {
    message = validateMessage(rawMessage, table);
    errors.push(...message.errors);
  }

  const unitMs = parseUnitMs(params.get('u') ?? String(DEFAULT_UNIT_MS));
  if (unitMs === null) errors.push({ code: 'UNIT_OUT_OF_RANGE' });

  const color = parseColor(params.get('c') ?? DEFAULT_COLOR);
  if (color === null) errors.push({ code: 'INVALID_COLOR' });

  const rawPeriod = params.get('p');
  const periodSec =
    rawPeriod !== null && DIGITS_PATTERN.test(rawPeriod)
      ? Number(rawPeriod)
      : null;
  if (rawPeriod === null) {
    errors.push({ code: 'MISSING_FIELD', detail: 'p' });
  } else if (periodSec === null || !isValidPeriod(periodSec, 0)) {
    errors.push({ code: 'INVALID_PERIOD', detail: rawPeriod });
  }

  if (errors.length > 0 || message === null || unitMs === null) {
    return { ok: false, errors };
  }
  const cycleMs = cycleMsOf(buildTimeline(message.encoded), unitMs);
  if (
    periodSec === null ||
    color === null ||
    !isValidPeriod(periodSec, cycleMs)
  ) {
    return {
      ok: false,
      errors: [{ code: 'INVALID_PERIOD', detail: rawPeriod ?? '' }],
    };
  }
  return {
    ok: true,
    config: {
      version: SPEC_VERSION,
      lang: 'en',
      message: message.normalized,
      periodSec,
      unitMs,
      color,
    },
    cycleMs,
  };
}

/**
 * 作成画面の入力から点滅パターンを組み立てる。周期はここで自動決定する。
 * エラーはすべて同時に返す。
 *
 * @param {CreateInput} input 入力欄の生の値
 * @returns {ValidationResult} 検証結果
 */
export function buildFromInput(input) {
  const table = /** @type {MorseTable} */ (getTable(DEFAULT_LANG));
  const message = validateMessage(input.message, table);
  /** @type {ValidationError[]} */
  const errors = [...message.errors];

  const unitMs = parseUnitMs(input.unitMs);
  if (unitMs === null) errors.push({ code: 'UNIT_OUT_OF_RANGE' });

  const color = parseColor(input.color.replace(/^#/, ''));
  if (color === null) errors.push({ code: 'INVALID_COLOR' });

  if (message.errors.length > 0 || unitMs === null) {
    return { ok: false, errors };
  }
  const cycleMs = cycleMsOf(buildTimeline(message.encoded), unitMs);
  const periodSec = choosePeriod(cycleMs);
  if (periodSec === null) errors.push({ code: 'TOO_LONG_FOR_60S' });

  if (periodSec === null || color === null) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    config: {
      version: SPEC_VERSION,
      lang: 'en',
      message: message.normalized,
      periodSec,
      unitMs,
      color,
    },
    cycleMs,
  };
}

/**
 * 作成画面の表示用に、入力の符号化結果と1周分の所要時間を求める。
 * 検証エラー(60秒超など)があっても、分かる範囲で表示できるようにする。
 *
 * @param {CreateInput} input 入力欄の生の値
 * @returns {MessagePreview} 表示用の途中結果
 */
export function previewInput(input) {
  const table = /** @type {MorseTable} */ (getTable(DEFAULT_LANG));
  const normalized = normalizeMessage(input.message, table);
  const encoded = encodeMessage(normalized, table);
  const unitMs = parseUnitMs(input.unitMs);
  const canMeasure =
    encoded.chars.length > 0 &&
    encoded.unsupported.length === 0 &&
    unitMs !== null;
  return {
    normalized,
    encoded,
    cycleMs: canMeasure ? cycleMsOf(buildTimeline(encoded), unitMs) : null,
  };
}

/**
 * 検証済みの設定から、1周分の点灯区間の列を作る(参加画面の再生用)。
 *
 * @param {PatternConfig} config 検証済みの設定
 * @returns {import('./types.js').Timeline} 点灯区間の列
 */
export function buildConfigTimeline(config) {
  const table = /** @type {MorseTable} */ (getTable(config.lang));
  return buildTimeline(encodeMessage(config.message, table));
}
