import { WakeLockKeeper } from '../platform/wake-lock-keeper.js';
import { createElement } from './dom.js';
import { MESSAGES } from './messages.js';

/**
 * @typedef {Object} JoinBeforeOptions
 * @property {string} message 送るメッセージ(検証済み)
 * @property {HTMLElement} flashElement 「フラッシュも使う」の部分
 * @property {() => void} onJoin 「タップして参加」
 * @property {() => void} onCreate 「パターンを作る」
 */

/**
 * 参加画面のうち、参加前(「タップして参加」を押す前)の表示を作る。
 * @param {JoinBeforeOptions} options
 * @returns {HTMLElement}
 */
export function createJoinBeforeView(options) {
  return createElement('main', { className: 'screen join-before' }, [
    createElement('h1', { text: MESSAGES.appTitle }),
    createElement('p', {
      className: 'warning',
      text: `⚠ ${MESSAGES.photosensitivityWarning}`,
    }),
    createElement('dl', { className: 'pattern-summary' }, [
      createElement('dt', { text: MESSAGES.messageLabel }),
      createElement('dd', {
        className: 'pattern-summary__message',
        text: options.message,
      }),
    ]),
    options.flashElement,
    createElement('button', {
      className: 'join-button',
      text: MESSAGES.tapToJoin,
      attrs: { type: 'button' },
      on: { click: () => options.onJoin() },
    }),
    createElement('p', { className: 'hint', text: MESSAGES.brightnessHint }),
    WakeLockKeeper.isSupported()
      ? null
      : createElement('p', {
          className: 'hint',
          text: MESSAGES.wakeLockUnsupported,
        }),
    createElement('p', {
      className: 'hint hint--small',
      text: MESSAGES.clockHelp,
    }),
    createElement('button', {
      className: 'link-button',
      text: MESSAGES.createPattern,
      attrs: { type: 'button' },
      on: { click: () => options.onCreate() },
    }),
  ]);
}
