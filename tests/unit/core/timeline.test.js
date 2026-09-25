import { describe, it, expect } from 'vitest';
import {
  buildTimeline,
  cycleMsOf,
  findSegment,
} from '../../../public/js/core/timeline.js';
import {
  normalizeMessage,
  encodeMessage,
} from '../../../public/js/core/morse-encoder.js';
import { EN_TABLE } from '../../../public/js/core/tables/en.js';

/** @param {string} message */
const timelineOf = (message) =>
  buildTimeline(encodeMessage(normalizeMessage(message, EN_TABLE), EN_TABLE));

describe('buildTimeline', () => {
  // docs/functional-design.md アルゴリズム2 の検算例
  it.each([
    ['E', 8, 2000],
    ['SOS', 34, 8500],
    ['HELLO', 56, 14000],
    ['HELLO WORLD', 118, 29500],
  ])('%s は %i 拍(1拍250msで %i ms)になる', (message, units, ms) => {
    const timeline = timelineOf(message);
    expect(timeline.totalUnits).toBe(units);
    expect(cycleMsOf(timeline, 250)).toBe(ms);
  });

  it('E は区間 [0, 1) の1つだけになる', () => {
    expect(timelineOf('E').segments).toEqual([
      { startUnit: 0, endUnit: 1, charIndex: 0 },
    ]);
  });

  it('SOS は短点3・長点3・短点3の区間を ITU の間隔で並べる', () => {
    expect(timelineOf('SOS').segments).toEqual([
      { startUnit: 0, endUnit: 1, charIndex: 0 },
      { startUnit: 2, endUnit: 3, charIndex: 0 },
      { startUnit: 4, endUnit: 5, charIndex: 0 },
      // 文字間の間隔3拍
      { startUnit: 8, endUnit: 11, charIndex: 1 },
      { startUnit: 12, endUnit: 15, charIndex: 1 },
      { startUnit: 16, endUnit: 19, charIndex: 1 },
      { startUnit: 22, endUnit: 23, charIndex: 2 },
      { startUnit: 24, endUnit: 25, charIndex: 2 },
      { startUnit: 26, endUnit: 27, charIndex: 2 },
    ]);
  });

  it('単語間は7拍の間隔を空け、文字間の3拍は加えない', () => {
    const { segments } = timelineOf('E E');
    expect(segments).toEqual([
      { startUnit: 0, endUnit: 1, charIndex: 0 },
      { startUnit: 8, endUnit: 9, charIndex: 2 },
    ]);
  });

  it('対応外の文字は無視する', () => {
    expect(timelineOf('EあE').totalUnits).toBe(timelineOf('EE').totalUnits);
  });

  it('空のメッセージは区切りの7拍だけになる', () => {
    expect(timelineOf('')).toEqual({ segments: [], totalUnits: 7 });
  });
});

describe('findSegment', () => {
  const { segments } = timelineOf('SOS');

  it('区間の開始拍ちょうどなら、その区間を返す', () => {
    expect(findSegment(segments, 8)).toEqual(segments[3]);
  });

  it('区間の終了拍ちょうどなら消灯(null)を返す', () => {
    expect(findSegment(segments, 11)).toBeNull();
  });

  it('区間の途中(小数の拍)なら、その区間を返す', () => {
    expect(findSegment(segments, 26.999)).toEqual(segments[8]);
  });

  it('区間の間・末尾の区切りでは null を返す', () => {
    expect(findSegment(segments, 1.5)).toBeNull();
    expect(findSegment(segments, 30)).toBeNull();
  });

  it('区間が空なら null を返す', () => {
    expect(findSegment([], 0)).toBeNull();
  });
});
