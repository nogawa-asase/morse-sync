import { buildConfigTimeline, toShareUrl } from '../core/config-codec.js';
import { Player } from '../player/player.js';
import { ScreenOutput } from '../player/screen-output.js';
import { TorchOutput } from '../player/torch-output.js';
import { WakeLockKeeper } from '../platform/wake-lock-keeper.js';
import {
  enterFullscreen,
  exitFullscreen,
} from '../platform/fullscreen-helper.js';
import { createElement, setVisible } from './dom.js';
import { MESSAGES, formatCountdown } from './messages.js';
import { createJoinMenu } from './join-menu.js';
import { createJoinFlash } from './join-flash.js';
import { createJoinBeforeView } from './join-before.js';
import { showQrOverlay } from './qr-overlay.js';

/** @typedef {import('../core/types.js').PatternConfig} PatternConfig */
/** @typedef {import('../core/types.js').PlaybackState} PlaybackState */
/** @typedef {import('./router.js').Navigate} Navigate */

/**
 * 参加画面の状態。メニュー表示は running に重ねるオーバーレイなので状態に含めない。
 * タブ切替・画面オフ(中断)は running のまま Player だけを止めて表す。
 * @typedef {'before' | 'running' | 'qr' | 'paused'} JoinState
 */

// 点滅中の送信中の文字は、背景に対して読める色に切り替える(機能設計書 カラーコーディング)
const CHAR_COLOR_ON = '#000000';
const CHAR_COLOR_OFF = '#666666';

/**
 * 参加画面を表示する。
 *
 * @param {HTMLElement} root 表示先の要素
 * @param {PatternConfig} config 検証済みの設定
 * @param {Navigate} navigate 画面遷移
 * @returns {() => void} アンマウント関数
 */
export function mountJoinScreen(root, config, navigate) {
  /** @type {JoinState} */
  let state = 'before';
  let isCharVisible = true;
  let hasEnteredFullscreen = false;
  /** @type {(() => void) | null} */
  let closeQrOverlay = null;
  // 表示の変化時だけDOMを書き換えるための、前回表示した値
  let lastSecondsLeft = -1;
  /** @type {number | null} */
  let lastCharIndex = null;
  /** @type {boolean | null} */
  let lastIsOn = null;

  const messageChars = [...config.message];
  const wakeLock = new WakeLockKeeper();
  const shareUrlText = toShareUrl(config, location.href);
  const torchOutput = new TorchOutput();
  const flash = createJoinFlash(torchOutput, config.unitMs);

  // ---- 参加前 ----
  const beforeView = createJoinBeforeView({
    message: config.message,
    flashElement: flash.element,
    onJoin: () => join(),
    onCreate: () => navigate.toCreate(config),
  });

  // ---- 実行中(待機中・点滅中) ----
  const currentChar = createElement('p', {
    className: 'stage__char',
    attrs: { 'aria-live': 'off' },
  });
  const countdown = createElement('p', { className: 'stage__countdown' });
  const menuHint = createElement('p', {
    className: 'stage__hint',
    text: MESSAGES.menuHint,
  });
  const wakeLockNotice = createElement('p', {
    className: 'stage__hint',
    text: MESSAGES.wakeLockUnsupported,
  });
  setVisible(wakeLockNotice, false);

  const pausedPanel = createElement('div', { className: 'stage__paused' }, [
    createElement('p', { text: MESSAGES.pausedLabel }),
    createElement('button', {
      className: 'button button--primary',
      text: MESSAGES.resume,
      attrs: { type: 'button' },
      on: {
        click: (event) => {
          event.stopPropagation();
          resume();
        },
      },
    }),
    // 参加後に作成画面へ戻る手段がないため、一時停止の画面から戻れるようにする
    createElement('button', {
      className: 'button',
      text: MESSAGES.backToCreate,
      attrs: { type: 'button' },
      on: {
        click: (event) => {
          event.stopPropagation();
          navigate.toCreate(config);
        },
      },
    }),
  ]);
  setVisible(pausedPanel, false);

  const menu = createJoinMenu({
    onShowQr: () => showQr(),
    onPause: () => pause(),
    onToggleFlash: flash.isAvailable() ? () => void flash.toggle() : undefined,
    onToggleChar: () => {
      isCharVisible = !isCharVisible;
      menu.setCharVisible(isCharVisible);
      setVisible(currentChar, isCharVisible);
    },
  });
  menu.setCharVisible(isCharVisible);
  const syncMenuFlash = () =>
    menu.setFlashState(flash.isAvailable(), flash.isEnabled());
  flash.onChange(syncMenuFlash);
  syncMenuFlash();

  const stage = createElement(
    'div',
    {
      className: 'stage',
      on: {
        click: () => {
          if (state !== 'running') return;
          if (menu.isOpen()) menu.close();
          else menu.open();
        },
      },
    },
    [
      currentChar,
      countdown,
      menuHint,
      wakeLockNotice,
      pausedPanel,
      menu.element,
    ]
  );
  setVisible(stage, false);

  const screenOutput = new ScreenOutput(stage, config.color);
  const player = new Player(
    buildConfigTimeline(config),
    config.unitMs,
    config.periodSec,
    [screenOutput, torchOutput]
  );
  player.onFrame(renderFrame);

  /**
   * カウントダウン・送信中の文字を、値が変わったときだけ書き換える。
   * @param {PlaybackState} playback
   */
  function renderFrame(playback) {
    const secondsLeft =
      playback.phase === 'waiting'
        ? Math.ceil(playback.msToNextStart / 1000)
        : 0;
    if (secondsLeft !== lastSecondsLeft) {
      lastSecondsLeft = secondsLeft;
      countdown.textContent =
        secondsLeft > 0 ? formatCountdown(secondsLeft) : '';
      setVisible(menuHint, secondsLeft > 0);
    }
    if (playback.charIndex !== lastCharIndex) {
      lastCharIndex = playback.charIndex;
      currentChar.textContent =
        playback.charIndex === null ? '' : messageChars[playback.charIndex];
    }
    if (playback.isOn !== lastIsOn) {
      lastIsOn = playback.isOn;
      currentChar.style.color = playback.isOn ? CHAR_COLOR_ON : CHAR_COLOR_OFF;
    }
  }

  function startPlayback() {
    lastSecondsLeft = -1;
    lastCharIndex = null;
    lastIsOn = null;
    player.start();
  }

  function stopPlayback() {
    player.stop();
    countdown.textContent = '';
    // 一時停止・QRコード表示中は画面をタップしてもメニューは開かないため隠す
    setVisible(menuHint, false);
    currentChar.textContent = '';
    lastSecondsLeft = -1;
    lastCharIndex = null;
  }

  function join() {
    // Wake Lock・全画面はユーザー操作のイベント内で要求する必要があるため、await より前に呼ぶ
    wakeLock.acquire().then((isAcquired) => {
      setVisible(wakeLockNotice, !isAcquired);
    });
    enterFullscreen(document.documentElement).then((isEntered) => {
      hasEnteredFullscreen = isEntered;
    });
    state = 'running';
    setVisible(beforeView, false);
    setVisible(stage, true);
    startPlayback();
  }

  function showQr() {
    menu.close();
    stopPlayback();
    state = 'qr';
    // 検証済みの設定から作り直した(正規化済みの)URLで配る
    closeQrOverlay = showQrOverlay(root, shareUrlText, {
      closeLabel: MESSAGES.back,
      onClose: () => {
        closeQrOverlay?.();
        closeQrOverlay = null;
        state = 'running';
        startPlayback();
      },
    });
  }

  function pause() {
    menu.close();
    stopPlayback();
    state = 'paused';
    setVisible(pausedPanel, true);
  }

  function resume() {
    setVisible(pausedPanel, false);
    state = 'running';
    startPlayback();
  }

  const handleVisibilityChange = () => {
    // iOSは背景に回るとカメラを止めるため、参加前でもフラッシュは手放して取り直す
    const isHidden = document.visibilityState === 'hidden';
    if (isHidden) flash.suspend();
    else void flash.resume();
    if (state === 'before') return;
    if (isHidden) {
      menu.close();
      if (state === 'running') stopPlayback();
      return;
    }
    // 画面オフ・タブ切替で Wake Lock は解除されるため、戻ったら取り直す
    wakeLock.acquire().then((isAcquired) => {
      setVisible(wakeLockNotice, !isAcquired);
    });
    if (state === 'running') startPlayback();
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  root.append(beforeView, stage);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    player.dispose();
    flash.dispose();
    menu.dispose();
    closeQrOverlay?.();
    wakeLock.release();
    if (hasEnteredFullscreen) exitFullscreen();
    beforeView.remove();
    stage.remove();
  };
}
