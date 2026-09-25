import { createElement, setVisible } from './dom.js';
import { MESSAGES } from './messages.js';

// うっかり触っても点滅が止まらないよう、操作がなければ自動で閉じる
const AUTO_CLOSE_MS = 5000;

/**
 * @typedef {Object} JoinMenuHandlers
 * @property {() => void} onShowQr     「QRコードを見せる」
 * @property {() => void} onPause      「一時停止」
 * @property {() => void} onToggleChar 送信中の文字の表示切替
 * @property {() => void} [onToggleFlash] フラッシュの切替(指定したときだけ項目を出す)
 */

/**
 * @typedef {Object} JoinMenu
 * @property {HTMLElement} element             メニューの要素
 * @property {() => void} open                 開く(自動で閉じるタイマーを開始)
 * @property {() => void} close                閉じる
 * @property {() => boolean} isOpen            開いているか
 * @property {(isVisible: boolean) => void} setCharVisible 表示切替ボタンの文言を合わせる
 * @property {(isAvailable: boolean, isEnabled: boolean) => void} setFlashState フラッシュ項目の表示と文言を合わせる
 * @property {() => void} dispose              タイマーを止める
 */

/**
 * 参加画面の下部に出すメニューを作る。点滅は止めずに重ねて表示する。
 *
 * @param {JoinMenuHandlers} handlers 各項目の処理
 * @param {HTMLElement} [extraRow] メニューの最後に置く行(開始のずれの補正など)
 * @returns {JoinMenu}
 */
export function createJoinMenu(handlers, extraRow) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let closeTimerId;

  const restartTimer = () => {
    clearTimeout(closeTimerId);
    closeTimerId = setTimeout(close, AUTO_CLOSE_MS);
  };

  const toggleCharButton = createElement('button', {
    className: 'button',
    attrs: { type: 'button' },
    on: { click: () => handlers.onToggleChar() },
  });

  const element = createElement(
    'div',
    {
      className: 'join-menu',
      attrs: { role: 'menu' },
      on: {
        // メニュー内のタップは「メニュー外のタップ」として扱わない
        click: (event) => event.stopPropagation(),
        pointerdown: restartTimer,
      },
    },
    [
      createElement('button', {
        className: 'button button--primary',
        text: MESSAGES.showQr,
        attrs: { type: 'button', role: 'menuitem' },
        on: { click: () => handlers.onShowQr() },
      }),
      createElement('button', {
        className: 'button',
        text: MESSAGES.pause,
        attrs: { type: 'button', role: 'menuitem' },
        on: { click: () => handlers.onPause() },
      }),
      toggleCharButton,
    ]
  );
  toggleCharButton.setAttribute('role', 'menuitem');

  const { onToggleFlash } = handlers;
  const flashButton = onToggleFlash
    ? createElement('button', {
        className: 'button',
        text: MESSAGES.menuFlashOn,
        attrs: { type: 'button', role: 'menuitem' },
        on: { click: () => onToggleFlash() },
      })
    : null;
  if (flashButton) element.append(flashButton);
  if (extraRow) element.append(extraRow);
  setVisible(element, false);

  function open() {
    setVisible(element, true);
    restartTimer();
  }

  function close() {
    clearTimeout(closeTimerId);
    setVisible(element, false);
  }

  return {
    element,
    open,
    close,
    isOpen: () => !element.hidden,
    setCharVisible: (isVisible) => {
      toggleCharButton.textContent = isVisible
        ? MESSAGES.hideCurrentChar
        : MESSAGES.showCurrentChar;
    },
    setFlashState: (isAvailable, isEnabled) => {
      if (!flashButton) return;
      setVisible(flashButton, isAvailable);
      flashButton.textContent = isEnabled
        ? MESSAGES.menuFlashOff
        : MESSAGES.menuFlashOn;
    },
    dispose: () => clearTimeout(closeTimerId),
  };
}
