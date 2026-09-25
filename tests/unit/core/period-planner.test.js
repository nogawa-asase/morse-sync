import { describe, it, expect } from 'vitest';
import {
  MAX_PERIOD_SEC,
  toWholeSeconds,
  choosePeriod,
  isValidPeriod,
} from '../../../public/js/core/period-planner.js';

describe('toWholeSeconds', () => {
  it('秒単位で切り上げる(8.5秒→9、14.0秒→14、14.001秒→15)', () => {
    expect(toWholeSeconds(8500)).toBe(9);
    expect(toWholeSeconds(14000)).toBe(14);
    expect(toWholeSeconds(14001)).toBe(15);
  });

  it('1秒未満は1秒、60秒を超えても値を返す(表示用)', () => {
    expect(toWholeSeconds(400)).toBe(1);
    expect(toWholeSeconds(75000)).toBe(75);
  });
});

describe('choosePeriod', () => {
  it('所要時間8.5秒(SOS)なら切り上げて周期9秒を返す', () => {
    expect(choosePeriod(8500)).toBe(9);
  });

  it('所要時間がちょうど14.0秒(HELLO)なら周期14秒を返す', () => {
    expect(choosePeriod(14000)).toBe(14);
  });

  it('所要時間31.2秒なら周期32秒を返す(60の約数でなくてよい)', () => {
    expect(choosePeriod(31200)).toBe(32);
  });

  it('所要時間14.001秒なら周期15秒を返す', () => {
    expect(choosePeriod(14001)).toBe(15);
  });

  it('所要時間が1秒未満でも周期は最小1秒', () => {
    expect(choosePeriod(400)).toBe(1);
  });

  it('所要時間60.0秒なら周期60秒を返す', () => {
    expect(choosePeriod(60000)).toBe(MAX_PERIOD_SEC);
  });

  it('所要時間60.1秒なら null を返す', () => {
    expect(choosePeriod(60100)).toBeNull();
  });
});

describe('isValidPeriod', () => {
  it('60の約数でない周期でも、1〜60の整数で所要時間以上なら有効', () => {
    expect(isValidPeriod(16, 14000)).toBe(true);
    expect(isValidPeriod(32, 31200)).toBe(true);
  });

  it('以前の版が作った60の約数の周期(p=15、p=60)も有効', () => {
    expect(isValidPeriod(15, 14000)).toBe(true);
    expect(isValidPeriod(60, 8500)).toBe(true);
  });

  it('0以下・61以上・小数の周期は無効', () => {
    expect(isValidPeriod(0, 0)).toBe(false);
    expect(isValidPeriod(61, 1000)).toBe(false);
    expect(isValidPeriod(1.5, 1000)).toBe(false);
  });

  it('所要時間より短い周期は無効', () => {
    expect(isValidPeriod(14, 14001)).toBe(false);
  });
});
