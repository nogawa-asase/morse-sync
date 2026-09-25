import { describe, it, expect } from 'vitest';
import {
  MAX_OFFSET_MS,
  OFFSET_STEP_MS,
  adjustOffset,
} from '../../../public/js/core/timing-offset.js';

describe('adjustOffset', () => {
  it('1回の幅は50msで、早く(正)・遅く(負)に変えられる', () => {
    expect(OFFSET_STEP_MS).toBe(50);
    expect(adjustOffset(0, OFFSET_STEP_MS)).toBe(50);
    expect(adjustOffset(50, -OFFSET_STEP_MS)).toBe(0);
    expect(adjustOffset(0, -OFFSET_STEP_MS)).toBe(-50);
  });

  it('早くは1000msで頭打ちになる', () => {
    expect(MAX_OFFSET_MS).toBe(1000);
    expect(adjustOffset(1000, OFFSET_STEP_MS)).toBe(1000);
    expect(adjustOffset(980, OFFSET_STEP_MS)).toBe(1000);
  });

  it('遅くは-1000msで頭打ちになる', () => {
    expect(adjustOffset(-1000, -OFFSET_STEP_MS)).toBe(-1000);
  });
});
