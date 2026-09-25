import { describe, it, expect } from 'vitest';
import {
  PERIOD_CANDIDATES_SEC,
  choosePeriod,
  isValidPeriod,
} from '../../../public/js/core/period-planner.js';

describe('PERIOD_CANDIDATES_SEC', () => {
  it('候補はすべて60の約数で、小さい順に並んでいる', () => {
    for (const p of PERIOD_CANDIDATES_SEC) expect(60 % p).toBe(0);
    expect([...PERIOD_CANDIDATES_SEC]).toEqual(
      [...PERIOD_CANDIDATES_SEC].sort((a, b) => a - b)
    );
    expect(PERIOD_CANDIDATES_SEC).toHaveLength(12);
  });
});

describe('choosePeriod', () => {
  it('所要時間8.5秒なら周期10秒を返す', () => {
    expect(choosePeriod(8500)).toBe(10);
  });

  it('所要時間が候補とちょうど同じ10.0秒なら周期10秒を返す', () => {
    expect(choosePeriod(10000)).toBe(10);
  });

  it('所要時間10.1秒なら次の候補の12秒を返す', () => {
    expect(choosePeriod(10100)).toBe(12);
  });

  it('所要時間2.0秒(E)なら周期2秒を返す', () => {
    expect(choosePeriod(2000)).toBe(2);
  });

  it('所要時間60.0秒なら周期60秒を返す', () => {
    expect(choosePeriod(60000)).toBe(60);
  });

  it('所要時間60.1秒なら null を返す', () => {
    expect(choosePeriod(60100)).toBeNull();
  });
});

describe('isValidPeriod', () => {
  it('60の約数で所要時間以上なら有効', () => {
    expect(isValidPeriod(15, 14000)).toBe(true);
    expect(isValidPeriod(10, 10000)).toBe(true);
  });

  it('自動決定より長い周期でも、60の約数で所要時間以上なら有効', () => {
    expect(isValidPeriod(60, 8500)).toBe(true);
  });

  it('60の約数でない周期は無効', () => {
    expect(isValidPeriod(7, 1000)).toBe(false);
    expect(isValidPeriod(0, 0)).toBe(false);
  });

  it('所要時間より短い周期は無効', () => {
    expect(isValidPeriod(10, 10100)).toBe(false);
  });
});
