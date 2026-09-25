import { describe, it, expect } from 'vitest';
import {
  currentCycleStart,
  nextCycleStart,
  stateAt,
} from '../../../public/js/core/sync-clock.js';
import { buildTimeline } from '../../../public/js/core/timeline.js';
import { encodeMessage } from '../../../public/js/core/morse-encoder.js';
import { EN_TABLE } from '../../../public/js/core/tables/en.js';

// 2026-01-01T00:00:00Z(分の0秒)
const MINUTE_START_MS = Date.UTC(2026, 0, 1, 0, 0, 0);
const UNIT_MS = 250;
// SOS: 34拍 = 8.5秒 → 周期10秒
const PERIOD_MS = 10000;
const timeline = buildTimeline(encodeMessage('SOS', EN_TABLE));

describe('currentCycleStart', () => {
  it('周期の途中なら、その周期の開始時刻を返す', () => {
    expect(currentCycleStart(MINUTE_START_MS + 12345, 15000)).toBe(
      MINUTE_START_MS
    );
    expect(currentCycleStart(MINUTE_START_MS + 15001, 15000)).toBe(
      MINUTE_START_MS + 15000
    );
  });

  it('境界ちょうどなら、その時刻を返す', () => {
    expect(currentCycleStart(MINUTE_START_MS, 15000)).toBe(MINUTE_START_MS);
  });

  it('毎分0秒・15秒・30秒・45秒が周期15秒の開始時刻になる', () => {
    for (const offsetSec of [0, 15, 30, 45]) {
      const startMs = MINUTE_START_MS + offsetSec * 1000;
      expect(currentCycleStart(startMs + 1, 15000)).toBe(startMs);
    }
  });
});

describe('nextCycleStart', () => {
  it('境界の1ms後なら次の周期の開始時刻を返す', () => {
    expect(nextCycleStart(MINUTE_START_MS + 1, PERIOD_MS)).toBe(
      MINUTE_START_MS + PERIOD_MS
    );
  });

  it('境界の1ms前なら直後の境界を返す', () => {
    expect(nextCycleStart(MINUTE_START_MS - 1, PERIOD_MS)).toBe(
      MINUTE_START_MS
    );
  });

  it('境界ちょうどなら現在時刻を返す(即開始)', () => {
    expect(nextCycleStart(MINUTE_START_MS, PERIOD_MS)).toBe(MINUTE_START_MS);
  });
});

describe('stateAt', () => {
  /** @param {number} nowMs */
  const at = (nowMs) =>
    stateAt(nowMs, MINUTE_START_MS, timeline, UNIT_MS, PERIOD_MS);

  it('開始時刻の1ms前なら待機中を返す', () => {
    expect(at(MINUTE_START_MS - 1)).toEqual({
      phase: 'waiting',
      isOn: false,
      charIndex: null,
      msToNextStart: 1,
    });
  });

  it('待機中は最初の開始時刻までの残りミリ秒を返す', () => {
    expect(at(MINUTE_START_MS - 8000).msToNextStart).toBe(8000);
  });

  it('周期の開始時刻ちょうどなら即座に点灯する', () => {
    expect(at(MINUTE_START_MS)).toEqual({
      phase: 'playing',
      isOn: true,
      charIndex: 0,
      msToNextStart: PERIOD_MS,
    });
  });

  it('短点の終わり(1拍後)ちょうどで消灯し、その1ms前は点灯している', () => {
    expect(at(MINUTE_START_MS + UNIT_MS - 1).isOn).toBe(true);
    expect(at(MINUTE_START_MS + UNIT_MS).isOn).toBe(false);
    expect(at(MINUTE_START_MS + UNIT_MS).charIndex).toBeNull();
  });

  it('長点(2文字目の O)の区間では点灯し、送信中の文字は1になる', () => {
    // O の最初の長点は8〜11拍
    const state = at(MINUTE_START_MS + 9 * UNIT_MS);
    expect(state.isOn).toBe(true);
    expect(state.charIndex).toBe(1);
  });

  it('1周を送り終えた後は次の開始時刻まで消灯したまま待つ', () => {
    // 送信は27拍(6750ms)で終わり、周期10秒の残りは消灯
    for (const offsetMs of [6750, 8500, 9999]) {
      const state = at(MINUTE_START_MS + offsetMs);
      expect(state.phase).toBe('playing');
      expect(state.isOn).toBe(false);
    }
    expect(at(MINUTE_START_MS + 9999).msToNextStart).toBe(1);
  });

  it('次の周期の開始時刻ちょうどで再び点灯する', () => {
    expect(at(MINUTE_START_MS + PERIOD_MS).isOn).toBe(true);
    expect(at(MINUTE_START_MS + PERIOD_MS - 1).isOn).toBe(false);
  });

  it('1時間後でも同じ位置で同じ状態になる', () => {
    const hourMs = 60 * 60 * 1000;
    for (let offsetMs = 0; offsetMs < PERIOD_MS; offsetMs += 50) {
      const nowMs = MINUTE_START_MS + offsetMs;
      expect(at(nowMs + hourMs)).toEqual(at(nowMs));
    }
  });

  it('参加した時刻にかかわらず、同じ時刻なら同じ状態になる', () => {
    const nowMs = MINUTE_START_MS + 60000 + 2600;
    const early = stateAt(nowMs, MINUTE_START_MS, timeline, UNIT_MS, PERIOD_MS);
    const late = stateAt(
      nowMs,
      MINUTE_START_MS + 60000,
      timeline,
      UNIT_MS,
      PERIOD_MS
    );
    expect(late).toEqual(early);
  });
});
