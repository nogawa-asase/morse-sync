import { describe, it, expect } from 'vitest';
import {
  DEFAULT_UNIT_MS,
  MIN_UNIT_MS,
  TORCH_RECOMMENDED_MIN_UNIT_MS,
  isUnitTooShortForTorch,
} from '../../../public/js/core/defaults.js';

describe('isUnitTooShortForTorch', () => {
  it('1拍249msなら短すぎると判定する', () => {
    expect(isUnitTooShortForTorch(249)).toBe(true);
  });

  it('1拍250msちょうどなら短すぎないと判定する', () => {
    expect(isUnitTooShortForTorch(250)).toBe(false);
  });

  it('1拍の下限200msなら短すぎると判定する', () => {
    expect(isUnitTooShortForTorch(MIN_UNIT_MS)).toBe(true);
  });

  it('既定値250msのURLでは案内が出ない値になっている', () => {
    expect(TORCH_RECOMMENDED_MIN_UNIT_MS).toBeLessThanOrEqual(DEFAULT_UNIT_MS);
  });
});
