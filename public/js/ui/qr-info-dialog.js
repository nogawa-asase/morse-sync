import { createElement } from './dom.js';
import { MESSAGES, QR_INFO } from './messages.js';

/**
 * 「QRコードの中身」を小さなウインドウ(モーダル)で表示する。
 * URLと、その仕組み(各記号の意味)をコンピュータに詳しくない人向けに説明する。
 *
 * @param {HTMLElement} parent 追加先の要素
 * @param {string} url 共有URL(QRコードの中身そのもの)
 * @returns {() => void} 閉じて取り除く関数
 */
export function showQrInfoDialog(parent, url) {
  const rows = parseSettings(url).map(([key, value]) =>
    createElement('tr', {}, [
      createElement('th', { text: key, attrs: { scope: 'row' } }),
      createElement('td', { className: 'qr-info__value', text: value }),
      createElement('td', { text: QR_INFO.keys[key] ?? QR_INFO.unknownKey }),
    ])
  );

  const dialog = createElement('dialog', {
    className: 'qr-info',
    attrs: { 'aria-labelledby': 'qr-info-title' },
  });
  // 余白は内側の要素に持たせ、dialog 自体への click を「背景を押した」と判定できるようにする
  const body = createElement('div', { className: 'qr-info__body' }, [
    createElement('h2', {
      className: 'qr-info__title',
      text: QR_INFO.title,
      attrs: { id: 'qr-info-title' },
    }),
    createElement('p', { className: 'qr-info__url', text: url }),
    createElement('p', { className: 'qr-info__text', text: QR_INFO.structure }),
    createElement('div', { className: 'qr-info__table-wrap' }, [
      createElement('table', { className: 'qr-info__table' }, [
        createElement('thead', {}, [
          createElement('tr', {}, [
            createElement('th', { text: QR_INFO.keyHeader }),
            createElement('th', { text: QR_INFO.valueHeader }),
            createElement('th', { text: QR_INFO.meaningHeader }),
          ]),
        ]),
        createElement('tbody', {}, rows),
      ]),
    ]),
    createElement('p', { className: 'qr-info__text', text: QR_INFO.privacy }),
    createElement('button', {
      className: 'button button--primary',
      text: MESSAGES.close,
      attrs: { type: 'button' },
      on: { click: () => dialog.close() },
    }),
  ]);
  dialog.append(body);

  // 「閉じる」ボタンでも Esc キーでも close イベントが来るので、ここで取り除く
  dialog.addEventListener('close', () => dialog.remove());
  // ウインドウの外側(背景)を押したときも閉じる
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  parent.append(dialog);
  dialog.showModal();

  return () => {
    if (dialog.open) dialog.close();
    dialog.remove();
  };
}

/**
 * URLの '#' より後ろを「記号」と「URLに入っている形のままの値」の組に分ける。
 * @param {string} url 共有URL
 * @returns {[string, string][]} 例: [['v', '1'], ['m', 'HELLO%20WORLD']]
 */
function parseSettings(url) {
  const hash = url.split('#')[1] ?? '';
  return hash
    .split('&')
    .filter((pair) => pair !== '')
    .map((pair) => {
      const [key, ...rest] = pair.split('=');
      return [key, rest.join('=')];
    });
}
