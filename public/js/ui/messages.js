import { toWholeSeconds } from '../core/period-planner.js';

/** @typedef {import('../core/types.js').ValidationError} ValidationError */
/** @typedef {import('../core/types.js').ValidationErrorCode} ValidationErrorCode */

/** 画面の文言。画面のファイルには日本語の文字列を直接書かず、ここに集める */
export const MESSAGES = Object.freeze({
  appTitle: 'モールスシンク',
  appTagline:
    'QRコードを読むだけで、みんなのスマホが揃ってモールス信号を光らせます',
  photosensitivityWarning: '光の点滅に敏感な方はご注意ください',

  // 作成画面
  messageLabel: 'メッセージ',
  messageHint:
    '英字・数字・一部の記号(. , ? \' ! / ( ) & : ; = + - _ " $ @)と空白',
  options: 'オプション',
  unitLabel: '1拍の長さ',
  unitSuffix: 'ミリ秒',
  colorLabel: '画面の点灯色',
  colorHexLabel: '点灯色(16進)',
  codeLabel: '符号',
  cycleLabel: 'メッセージの長さ',
  cycleUnknown: '—',
  qrSectionLabel: '参加用のQRコード',
  enlargeQr: '拡大表示',
  share: '共有',
  joinWithPattern: 'このパターンで参加',

  // 共有
  shareCopied: 'コピーしました',
  shareFailed: '共有できませんでした。URLをコピーしてください',
  shareFailedSeeQrInfo:
    '共有できませんでした。「QRコードの中身」からURLをコピーしてください',
  qrInfo: 'QRコードの中身',

  // 参加画面
  tapToJoin: 'タップして参加',
  brightnessHint: '必要に応じて、画面の明るさを最大にしてください',
  wakeLockUnsupported: '画面が自動で消えないよう、端末の設定を確認してください',
  clockHelp:
    '端末の時刻が「自動設定」になっていないと、周りとずれることがあります',
  createPattern: 'パターンを作る',
  menuHint: '画面をタップするとメニューが開きます',
  showQr: 'QRコードを見せる',
  pause: '一時停止',
  resume: '再開',
  earlier: '◀ 早く',
  later: '遅く ▶',
  resetOffset: '0に戻す',
  offsetLabel: '開始のずれの補正',
  backToCreate: 'パターンの作成に戻る',
  pausedLabel: '一時停止中',
  showCurrentChar: '送信中の文字を表示',
  hideCurrentChar: '送信中の文字を隠す',
  back: '戻る',

  // フラッシュ
  useFlash: 'フラッシュも使う',
  flashPermissionNote:
    'フラッシュを使うためにカメラの許可が必要です。撮影・録画はしません',
  flashUnsupported: 'この端末ではフラッシュを使えません',
  flashDenied: 'カメラが許可されなかったため、フラッシュは使えません',
  flashFailed: 'フラッシュを使えませんでした。もう一度お試しください',
  flashUnitHint:
    'フラッシュは切り替えが遅れることがあるため、1拍250ミリ秒以上をおすすめします',
  menuFlashOn: 'フラッシュを使う',
  menuFlashOff: 'フラッシュを止める',
  close: '閉じる',

  // 読込エラー
  invalidUrl: 'QRコードの内容が正しくありません',
});

/** 「QRコードの中身」のウインドウの説明。コンピュータに詳しくない人にも分かる言葉で書く */
export const QR_INFO = Object.freeze({
  title: 'このQRコードの内容は以下のとおりです。',
  structure:
    '「#」より前はこのページの住所で、「#」より後ろに点灯パターンの設定が入っています。設定は「記号=値」を「&」でつないだものです。',
  privacy:
    '「#」より後ろの設定はインターネットには送られず、読み取ったスマホの中だけで使われます。',
  keyHeader: '記号',
  valueHeader: '値',
  meaningHeader: '意味',
  /** @type {Readonly<Record<string, string>>} */
  keys: Object.freeze({
    v: 'このサービスのバージョン',
    l: '文字の種類。en は英字・数字のモールス信号です',
    m: '送るメッセージ。空白は %20 のように、記号の一部は「%」で始まる形に置き換えて入っています',
    p: '繰り返しの間隔(秒)',
    u: '1拍の長さ(ミリ秒。1000ミリ秒で1秒)。短い光がこの長さになり、長い光はその3倍です',
    c: '光る色。色を6桁の番号で表したものです',
  }),
  unknownKey: 'このページでは使わない設定です',
});

/** @type {Readonly<Record<ValidationErrorCode, string>>} */
export const ERROR_MESSAGES = Object.freeze({
  UNSUPPORTED_CHARS: 'この文字は送れません',
  EMPTY_MESSAGE: 'メッセージを入力してください',
  MESSAGE_TOO_LONG: 'メッセージは50文字以内にしてください',
  UNIT_OUT_OF_RANGE: '1拍の長さは200〜2000ミリ秒で入力してください',
  TOO_LONG_FOR_60S:
    '60秒以内に収まりません。メッセージを短くするか、1拍を短くしてください',
  INVALID_COLOR: '点灯色は #ffcc00 のように6桁で入力してください',
  UNKNOWN_VERSION:
    'このQRコードは新しいバージョン用です。ページを再読み込みしてください',
  UNKNOWN_LANG: MESSAGES.invalidUrl,
  MISSING_FIELD: MESSAGES.invalidUrl,
  INVALID_PERIOD: MESSAGES.invalidUrl,
});

/**
 * 作成画面に表示するエラーの文言を作る。
 * @param {ValidationError} error 検証エラー
 * @returns {string} 文言 例: 'この文字は送れません: あ'
 */
export function formatError(error) {
  const text = ERROR_MESSAGES[error.code];
  return error.code === 'UNSUPPORTED_CHARS' && error.detail
    ? `${text}: ${error.detail}`
    : text;
}

/**
 * 作成画面の「メッセージの長さ」を表示用にする。
 * URLの p(周期)と同じ値になるよう、秒単位で切り上げる。
 * @param {number} cycleMs 1周分の所要時間(ミリ秒)
 * @returns {string} 例: '15秒'
 */
export function formatCycle(cycleMs) {
  return `${toWholeSeconds(cycleMs)}秒`;
}

/**
 * 開始のずれの補正量を表示用にする。
 * @param {number} offsetMs 補正量(ミリ秒)。正なら早く、負なら遅く
 * @returns {string} 例: '補正なし'、'50ms早く'、'100ms遅く'
 */
export function formatOffset(offsetMs) {
  if (offsetMs === 0) return '補正なし';
  return offsetMs > 0 ? `${offsetMs}ms早く` : `${-offsetMs}ms遅く`;
}

/**
 * 待機中のカウントダウンの文言を作る。
 * @param {number} secondsLeft 開始までの残り秒数(切り上げ済み)
 * @returns {string} 例: '開始まで あと8秒'
 */
export function formatCountdown(secondsLeft) {
  return `開始まで あと${secondsLeft}秒`;
}
