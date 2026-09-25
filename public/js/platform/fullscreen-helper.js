/**
 * 対応ブラウザでのみ要素を全画面表示にする。
 * iPhone の Safari など非対応のブラウザでは何もしない。失敗しても例外を投げない。
 *
 * @param {Element} el 全画面にする要素
 * @returns {Promise<boolean>} 全画面になったら true
 */
export async function enterFullscreen(el) {
  if (
    !document.fullscreenEnabled ||
    typeof el.requestFullscreen !== 'function'
  ) {
    return false;
  }
  if (document.fullscreenElement) return true;
  try {
    await el.requestFullscreen({ navigationUI: 'hide' });
    return true;
  } catch (error) {
    console.warn('全画面表示にできませんでした', error);
    return false;
  }
}

/**
 * 全画面表示を終了する。全画面でなければ何もしない。失敗しても例外を投げない。
 *
 * @returns {Promise<void>}
 */
export async function exitFullscreen() {
  if (!document.fullscreenElement) return;
  try {
    await document.exitFullscreen();
  } catch (error) {
    console.warn('全画面表示を終了できませんでした', error);
  }
}
