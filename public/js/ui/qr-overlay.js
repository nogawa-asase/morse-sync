import { renderQr } from '../platform/qr-view.js';
import { shareUrl } from '../platform/share-helper.js';
import { createElement, setVisible } from './dom.js';
import { MESSAGES } from './messages.js';

/**
 * @typedef {Object} QrOverlayOptions
 * @property {string} closeLabel 閉じるボタンの文言(「戻る」「閉じる」)
 * @property {() => void} onClose 閉じるボタンが押されたとき
 */

/**
 * QRコードを白背景で画面いっぱいに表示する。
 * 作成画面の「拡大表示」と、参加画面の「QRコードを見せる」で共用する。
 *
 * @param {HTMLElement} parent 追加先の要素
 * @param {string} url QRコードにする共有URL
 * @param {QrOverlayOptions} options
 * @returns {() => void} 取り除く関数
 */
export function showQrOverlay(parent, url, options) {
  const qrBox = createElement('div', { className: 'qr-overlay__qr' });
  const status = createElement('p', {
    className: 'qr-overlay__status',
    attrs: { role: 'status', 'aria-live': 'polite' },
  });
  const urlText = createElement('p', {
    className: 'share-url',
    text: url,
  });
  setVisible(urlText, false);

  const shareButton = createElement('button', {
    className: 'button',
    text: MESSAGES.share,
    attrs: { type: 'button' },
    on: {
      click: async () => {
        const result = await shareUrl(url);
        if (result === 'copied') status.textContent = MESSAGES.shareCopied;
        if (result === 'failed') {
          status.textContent = MESSAGES.shareFailed;
          setVisible(urlText, true);
        }
      },
    },
  });
  const closeButton = createElement('button', {
    className: 'button button--primary',
    text: options.closeLabel,
    attrs: { type: 'button' },
    on: { click: () => options.onClose() },
  });

  const overlay = createElement(
    'div',
    {
      className: 'qr-overlay',
      attrs: { role: 'dialog', 'aria-label': MESSAGES.qrSectionLabel },
    },
    [
      qrBox,
      status,
      urlText,
      createElement('div', { className: 'button-row' }, [
        shareButton,
        closeButton,
      ]),
    ]
  );
  renderQr(qrBox, url);
  parent.append(overlay);
  closeButton.focus();

  return () => overlay.remove();
}
