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
  unitLabel: '1拍の長さ',
  unitSuffix: 'ミリ秒',
  colorLabel: '点灯色',
  colorPreviewLabel: '点灯色のプレビュー',
  codeLabel: '符号',
  cycleLabel: '1周の長さ',
  cycleUnknown: '—',
  qrSectionLabel: '参加用のQRコード',
  enlargeQr: '拡大表示',
  share: '共有',
  joinWithPattern: 'このパターンで参加',

  // 共有
  shareCopied: 'コピーしました',
  shareFailed: '共有できませんでした。URLをコピーしてください',

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

/** @type {Readonly<Record<ValidationErrorCode, string>>} */
export const ERROR_MESSAGES = Object.freeze({
  UNSUPPORTED_CHARS: 'この文字は送れません',
  EMPTY_MESSAGE: 'メッセージを入力してください',
  MESSAGE_TOO_LONG: 'メッセージは50文字以内にしてください',
  UNIT_OUT_OF_RANGE: '1拍の長さは200〜2000ミリ秒で入力してください',
  TOO_LONG_FOR_60S:
    '60秒以内に収まりません。メッセージを短くするか、1拍を短くしてください',
  INVALID_COLOR: '点灯色を選び直してください',
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
 * 1周の長さを表示用にする(小数第1位まで)。
 * @param {number} cycleMs 1周分の所要時間(ミリ秒)
 * @returns {string} 例: '14.0秒'
 */
export function formatCycle(cycleMs) {
  return `${(cycleMs / 1000).toFixed(1)}秒`;
}

/**
 * 1拍の長さを表示用にする。
 * @param {number} unitMs 1拍の長さ(ミリ秒)
 * @returns {string} 例: '250ミリ秒'
 */
export function formatUnit(unitMs) {
  return `${unitMs}${MESSAGES.unitSuffix}`;
}

/**
 * 待機中のカウントダウンの文言を作る。
 * @param {number} secondsLeft 開始までの残り秒数(切り上げ済み)
 * @returns {string} 例: '開始まで あと8秒'
 */
export function formatCountdown(secondsLeft) {
  return `開始まで あと${secondsLeft}秒`;
}
