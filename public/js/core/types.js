// 型定義(JSDoc)のみを置くファイル。実行時の値は持たない。

/**
 * 点滅パターンの設定。URLのハッシュに格納される。
 * @typedef {Object} PatternConfig
 * @property {1} version        仕様バージョン(URLの v)
 * @property {'en'} lang        文字の種類(URLの l)
 * @property {string} message   正規化済みメッセージ(URLの m)。1〜50文字
 * @property {number} periodSec 同期の周期・秒(URLの p)。60の約数
 * @property {number} unitMs    1拍の長さ・ミリ秒(URLの u)。200〜2000の整数
 * @property {string} color     点灯色(URLの c)。小文字16進6桁、'#'なし
 */

/**
 * 文字→符号の変換表。
 * @typedef {Object} MorseTable
 * @property {'en'} lang                          文字の種類
 * @property {Readonly<Record<string, string>>} codes 文字 → 符号('.' 短点、'-' 長点)
 * @property {(input: string) => string} normalize 表を引く前の正規化
 */

/**
 * 1文字分の符号化結果。
 * @typedef {Object} EncodedChar
 * @property {string} char          正規化後の文字。空白は ' '
 * @property {string | null} code   符号。空白は ''、対応外は null
 * @property {number} sourceIndex   正規化後メッセージ内の位置(コードポイント単位)
 */

/**
 * メッセージの符号化結果。
 * @typedef {Object} EncodedMessage
 * @property {EncodedChar[]} chars    入力順の文字(空白を含む)
 * @property {string[]} unsupported   対応外の文字(重複なし、出現順)
 */

/**
 * 1つの点灯区間。周期の開始からの拍数で表す。
 * @typedef {Object} OnSegment
 * @property {number} startUnit  点灯開始の拍
 * @property {number} endUnit    消灯する拍(この拍の瞬間は消灯)
 * @property {number} charIndex  どの文字の一部か(EncodedChar.sourceIndex)
 */

/**
 * 1周分の点灯区間の列。
 * @typedef {Object} Timeline
 * @property {OnSegment[]} segments 点灯区間。開始拍の昇順
 * @property {number} totalUnits    1周分の拍数(末尾の区切り7拍を含む)
 */

/**
 * ある時刻の再生状態。
 * @typedef {Object} PlaybackState
 * @property {'waiting' | 'playing'} phase 最初の開始時刻前は waiting
 * @property {boolean} isOn                点灯しているか
 * @property {number | null} charIndex     送信中の文字(区切り・待機中は null)
 * @property {number} msToNextStart        次の開始時刻までのミリ秒
 */

/**
 * @typedef {'UNSUPPORTED_CHARS' | 'EMPTY_MESSAGE' | 'MESSAGE_TOO_LONG'
 *   | 'UNIT_OUT_OF_RANGE' | 'TOO_LONG_FOR_60S' | 'INVALID_COLOR'
 *   | 'UNKNOWN_VERSION' | 'UNKNOWN_LANG' | 'MISSING_FIELD'
 *   | 'INVALID_PERIOD'} ValidationErrorCode
 */

/**
 * 入力・URLの検証エラー。
 * @typedef {Object} ValidationError
 * @property {ValidationErrorCode} code
 * @property {string} [detail] 補足(対応外の文字、欠けている項目のキーなど)
 */

/**
 * 入力・URLの検証結果。
 * @typedef {{ ok: true, config: PatternConfig, cycleMs: number }
 *   | { ok: false, errors: ValidationError[] }} ValidationResult
 */

/**
 * 作成画面の入力欄の生の値。
 * @typedef {Object} CreateInput
 * @property {string} message 入力欄の値
 * @property {string} unitMs  入力欄の値(数値化前)
 * @property {string} color   '#ffcc00' 形式(カラーピッカーの値)
 */

/**
 * 作成画面の表示用の途中結果。検証エラーがあっても符号と所要時間を示すために使う。
 * @typedef {Object} MessagePreview
 * @property {string} normalized      正規化後のメッセージ
 * @property {EncodedMessage} encoded 符号化結果
 * @property {number | null} cycleMs  1周分の所要時間。計算できなければ null
 */

export {};
