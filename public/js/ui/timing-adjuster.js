import {
  MAX_OFFSET_MS,
  OFFSET_STEP_MS,
  adjustOffset,
} from '../core/timing-offset.js';
import { createElement } from './dom.js';
import { MESSAGES, formatOffset } from './messages.js';

/**
 * 点滅中のメニューに置く「◀ 早く / 補正量 / 遅く ▶ / 0に戻す」の行を作る。
 * 端末の時計のずれで開始が早い・遅いとき、周りを見ながら50msずつ合わせる。
 *
 * @param {number} initialMs 補正量の初期値(ミリ秒)
 * @param {(offsetMs: number) => void} onChange 補正量が変わったとき
 * @returns {HTMLElement}
 */
export function createTimingAdjuster(initialMs, onChange) {
  let offsetMs = initialMs;

  const value = createElement('span', {
    className: 'timing-adjuster__value',
    attrs: { 'aria-live': 'polite' },
  });
  const earlier = createElement('button', {
    className: 'button',
    text: MESSAGES.earlier,
    attrs: { type: 'button' },
    on: { click: () => change(adjustOffset(offsetMs, OFFSET_STEP_MS)) },
  });
  const later = createElement('button', {
    className: 'button',
    text: MESSAGES.later,
    attrs: { type: 'button' },
    on: { click: () => change(adjustOffset(offsetMs, -OFFSET_STEP_MS)) },
  });
  const reset = createElement('button', {
    className: 'button',
    text: MESSAGES.resetOffset,
    attrs: { type: 'button' },
    on: { click: () => change(0) },
  });

  function render() {
    value.textContent = formatOffset(offsetMs);
    earlier.disabled = offsetMs >= MAX_OFFSET_MS;
    later.disabled = offsetMs <= -MAX_OFFSET_MS;
    reset.disabled = offsetMs === 0;
  }

  /** @param {number} nextMs 新しい補正量(ミリ秒) */
  function change(nextMs) {
    offsetMs = nextMs;
    render();
    onChange(offsetMs);
  }

  render();
  return createElement(
    'div',
    {
      className: 'timing-adjuster',
      attrs: { role: 'group', 'aria-label': MESSAGES.offsetLabel },
    },
    [earlier, value, later, reset]
  );
}
