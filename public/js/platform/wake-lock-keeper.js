/**
 * Screen Wake Lock API で画面のスリープを防ぐ。
 * タブ切替・画面オフで自動的に解除されるため、表示に戻ったら acquire() を呼び直す。
 */
export class WakeLockKeeper {
  /** @type {WakeLockSentinel | null} */
  #sentinel = null;

  /**
   * ブラウザが Screen Wake Lock API に対応しているか判定する。
   * @returns {boolean} 対応していれば true
   */
  static isSupported() {
    return 'wakeLock' in navigator;
  }

  /**
   * スリープ防止を取得する。取得済みで有効なら何もしない。
   * 失敗しても例外を投げない。
   * @returns {Promise<boolean>} 取得できた(有効な)ら true
   */
  async acquire() {
    if (!WakeLockKeeper.isSupported()) return false;
    if (this.#sentinel && !this.#sentinel.released) return true;
    try {
      this.#sentinel = await navigator.wakeLock.request('screen');
      return true;
    } catch (error) {
      console.warn('Wake Lockを取得できませんでした', error);
      this.#sentinel = null;
      return false;
    }
  }

  /**
   * スリープ防止を解除する。失敗しても例外を投げない。
   * @returns {Promise<void>}
   */
  async release() {
    const sentinel = this.#sentinel;
    this.#sentinel = null;
    if (!sentinel || sentinel.released) return;
    try {
      await sentinel.release();
    } catch (error) {
      console.warn('Wake Lockを解除できませんでした', error);
    }
  }
}
