import { parseHash, toHash } from '../core/config-codec.js';
import { mountCreateScreen } from './create-screen.js';
import { mountJoinScreen } from './join-screen.js';
import { mountErrorView } from './error-view.js';

/** @typedef {import('../core/types.js').PatternConfig} PatternConfig */

/**
 * 画面遷移の操作。各画面にはこのオブジェクトを渡し、location を直接触らせない。
 * @typedef {Object} Navigate
 * @property {(config: PatternConfig) => void} toJoin      参加画面へ(ハッシュを設定)
 * @property {(config?: PatternConfig) => void} toCreate   作成画面へ(ハッシュを消し、設定を引き継ぐ)
 */

/**
 * location.hash の有無で作成画面・参加画面を切り替え、hashchange を監視する。
 *
 * @param {HTMLElement} root 画面を表示する要素
 */
export function startRouter(root) {
  /** @type {(() => void) | null} */
  let unmount = null;

  /** @type {Navigate} */
  const navigate = {
    toJoin(config) {
      const previousHash = location.hash;
      // 通常は hashchange を契機に render される。同じハッシュなら発生しないので自分で描き直す
      location.hash = toHash(config);
      if (location.hash === previousHash) render();
    },
    toCreate(config) {
      // ページを再読み込みせずにハッシュを消す(hashchange は発生しない)
      history.pushState(null, '', location.pathname + location.search);
      render(config);
    },
  };

  /**
   * @param {PatternConfig} [initialConfig] 作成画面に引き継ぐ設定
   */
  function render(initialConfig) {
    unmount?.();
    unmount = null;
    root.replaceChildren();
    window.scrollTo(0, 0);

    const hash = location.hash;
    if (hash === '' || hash === '#') {
      unmount = mountCreateScreen(root, initialConfig, navigate);
      return;
    }
    const result = parseHash(hash);
    unmount = result.ok
      ? mountJoinScreen(root, result.config, navigate)
      : mountErrorView(root, result.errors, navigate);
  }

  window.addEventListener('hashchange', () => render());
  render();
}
