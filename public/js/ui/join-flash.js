import { isUnitTooShortForTorch } from '../core/defaults.js';
import {
  acquireTorchTrack,
  isTorchLikelySupported,
  releaseTorchTrack,
} from '../platform/camera-torch.js';
import { createElement, setVisible } from './dom.js';
import { MESSAGES } from './messages.js';

/** @typedef {import('../player/torch-output.js').TorchOutput} TorchOutput */

/**
 * フラッシュの状態。
 * - off: 使っていない
 * - acquiring: カメラを取得中
 * - on: トーチを取り付けて使っている(中断中はトラックだけ手放している)
 * - unsupported: この端末では使えない(ボタン無効)
 * @typedef {'off' | 'acquiring' | 'on' | 'unsupported'} FlashState
 */

/**
 * @typedef {Object} JoinFlash
 * @property {HTMLElement} element 参加前の画面に置く部分(ボタン+案内)
 * @property {() => boolean} isAvailable 使える可能性があるか(メニューに項目を出すか)
 * @property {() => boolean} isEnabled 参加者がオンにしているか
 * @property {() => Promise<void>} toggle オン/オフを切り替える(オン時にカメラを取得)
 * @property {() => void} suspend タブ切替時にカメラを解放する(オンの選択は保持)
 * @property {() => Promise<void>} resume 表示に戻ったとき、オンならカメラを取り直す
 * @property {(listener: () => void) => void} onChange 状態が変わったときの通知を登録する
 * @property {() => void} dispose カメラを解放する
 */

/**
 * 参加画面の「フラッシュも使う」オプションを作る。
 * カメラの許可は、参加者がオンにしたときに初めて求める(PRD 機能6)。
 *
 * @param {TorchOutput} torchOutput Player に渡してあるフラッシュの出力先
 * @param {number} unitMs 1拍の長さ(ミリ秒)。短いときの案内に使う
 * @returns {JoinFlash}
 */
export function createJoinFlash(torchOutput, unitMs) {
  /** @type {FlashState} */
  let state = isTorchLikelySupported() ? 'off' : 'unsupported';
  /** @type {MediaStreamTrack | null} */
  let track = null;
  // 取得中に中断・破棄されたら、取得できたトラックを捨てるための世代番号
  let generation = 0;
  /** @type {(() => void)[]} */
  const listeners = [];

  const button = createElement('button', {
    className: 'button flash-toggle',
    text: MESSAGES.useFlash,
    attrs: { type: 'button', 'aria-pressed': 'false' },
    on: { click: () => void toggle() },
  });
  const note = createElement('p', {
    className: 'hint hint--small',
    text: MESSAGES.flashPermissionNote,
  });
  const status = createElement('p', {
    className: 'hint flash-status',
    attrs: { role: 'status' },
  });
  const unitHint = createElement('p', {
    className: 'hint',
    text: MESSAGES.flashUnitHint,
  });
  const element = createElement('div', { className: 'flash-option' }, [
    button,
    note,
    status,
    unitHint,
  ]);

  /** @param {string} message 表示する案内(空なら隠す) */
  function showStatus(message) {
    status.textContent = message;
    setVisible(status, message !== '');
  }

  function render() {
    button.setAttribute('aria-pressed', String(state === 'on'));
    button.disabled = state === 'unsupported' || state === 'acquiring';
    setVisible(unitHint, state === 'on' && isUnitTooShortForTorch(unitMs));
    if (state === 'unsupported') showStatus(MESSAGES.flashUnsupported);
    for (const listener of listeners) listener();
  }

  /** トラックを取り外して解放する */
  function dropTrack() {
    torchOutput.detach();
    if (track) releaseTorchTrack(track);
    track = null;
  }

  /** カメラを取得して取り付ける。失敗したら理由を表示する */
  async function attachCamera() {
    const current = ++generation;
    const result = await acquireTorchTrack();
    if (current !== generation) {
      // 取得中に中断・破棄された
      if (result.ok) releaseTorchTrack(result.track);
      return;
    }
    if (result.ok) {
      track = result.track;
      torchOutput.attach(track);
      state = 'on';
      showStatus('');
    } else if (result.reason === 'unsupported') {
      state = 'unsupported';
    } else {
      state = 'off';
      showStatus(
        result.reason === 'denied' ? MESSAGES.flashDenied : MESSAGES.flashFailed
      );
    }
    render();
  }

  async function toggle() {
    if (state === 'unsupported' || state === 'acquiring') return;
    if (state === 'on') {
      generation++;
      dropTrack();
      state = 'off';
      render();
      return;
    }
    state = 'acquiring';
    showStatus('');
    render();
    await attachCamera();
  }

  function suspend() {
    generation++;
    dropTrack();
    // 取得中に中断されたら、オンになりきっていないのでオフに戻す
    if (state === 'acquiring') {
      state = 'off';
      render();
    }
  }

  async function resume() {
    // iOSでは背景に回るとカメラが止まり、戻っても自動で再開しないため取り直す
    if (state === 'on' && !track) await attachCamera();
  }

  setVisible(status, false);
  render();

  return {
    element,
    isAvailable: () => state !== 'unsupported',
    isEnabled: () => state === 'on',
    toggle,
    suspend,
    resume,
    onChange: (listener) => {
      listeners.push(listener);
    },
    dispose: () => {
      generation++;
      dropTrack();
      listeners.length = 0;
    },
  };
}
