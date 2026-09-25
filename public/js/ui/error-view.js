import { createElement } from './dom.js';
import { MESSAGES, ERROR_MESSAGES } from './messages.js';

/** @typedef {import('../core/types.js').ValidationError} ValidationError */
/** @typedef {import('./router.js').Navigate} Navigate */

/**
 * URLの読み込みエラーを表示する。
 * 参加者はURLを直せず取るべき行動も同じなので、未知のバージョン以外は
 * 1種類の文言に丸める。詳しいエラーコードは開発者向けにコンソールへ出す。
 *
 * @param {HTMLElement} root 表示先の要素
 * @param {ValidationError[]} errors 検証エラー
 * @param {Navigate} navigate 画面遷移
 * @returns {() => void} アンマウント関数
 */
export function mountErrorView(root, errors, navigate) {
  console.warn('設定URLを読み込めませんでした', errors);
  const isUnknownVersion = errors.some((e) => e.code === 'UNKNOWN_VERSION');
  const screen = createElement('main', { className: 'screen error-view' }, [
    createElement('h1', { text: MESSAGES.appTitle }),
    createElement('p', {
      className: 'error-view__message',
      attrs: { role: 'alert' },
      text: isUnknownVersion
        ? ERROR_MESSAGES.UNKNOWN_VERSION
        : MESSAGES.invalidUrl,
    }),
    createElement('button', {
      className: 'button button--primary',
      text: MESSAGES.createPattern,
      attrs: { type: 'button' },
      on: { click: () => navigate.toCreate() },
    }),
  ]);
  root.append(screen);
  return () => screen.remove();
}
