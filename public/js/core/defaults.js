/** 仕様バージョン(URLの v)。URLの形式・意味を変えるときに上げる */
export const SPEC_VERSION = 1;

/** 文字の種類の既定値(URLの l を省略したとき) */
export const DEFAULT_LANG = 'en';

/** 作成画面を開いたときのメッセージ */
export const DEFAULT_MESSAGE = 'SOS';

/** 1拍の長さの既定値(ミリ秒) */
export const DEFAULT_UNIT_MS = 250;

/**
 * 1拍の長さの下限(ミリ秒)。
 * WCAG 2.3.1: 点滅は1秒に3回以下。200msなら短点の連続でも1秒に2.5回。
 * 光過敏への配慮のため下げないこと。
 */
export const MIN_UNIT_MS = 200;

/** 1拍の長さの上限(ミリ秒) */
export const MAX_UNIT_MS = 2000;

/** メッセージの最大文字数(正規化後) */
export const MAX_MESSAGE_LENGTH = 50;

/** 点灯色の既定値(小文字16進6桁、'#'なし) */
export const DEFAULT_COLOR = 'ffcc00';
