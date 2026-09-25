/**
 * @typedef {'shared' | 'copied' | 'cancelled' | 'failed'} ShareResult
 */

/**
 * URLをクリップボードにコピーする。失敗しても例外を投げない。
 *
 * @param {string} url コピーするURL
 * @returns {Promise<boolean>} コピーできたら true
 */
async function copyToClipboard(url) {
  if (
    !navigator.clipboard ||
    typeof navigator.clipboard.writeText !== 'function'
  ) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.warn('クリップボードにコピーできませんでした', error);
    return false;
  }
}

/**
 * URLを共有する。Web Share API があればOSの共有シートを開き、
 * なければ(または共有に失敗したら)クリップボードにコピーする。
 *
 * @param {string} url 共有するURL
 * @returns {Promise<ShareResult>} 共有シートで共有 / コピー / キャンセル / 失敗
 */
export async function shareUrl(url) {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ url });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
      console.warn('共有シートを開けませんでした', error);
    }
  }
  return (await copyToClipboard(url)) ? 'copied' : 'failed';
}
