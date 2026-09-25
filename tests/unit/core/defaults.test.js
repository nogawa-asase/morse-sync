import { describe, it, expect } from 'vitest';
import {
  MIN_UNIT_MS,
  TORCH_RECOMMENDED_MIN_UNIT_MS,
  isUnitTooShortForTorch,
} from '../../../public/js/core/defaults.js';

describe('isUnitTooShortForTorch', () => {
  it('1拍299msなら短すぎると判定する', () => {
    expect(isUnitTooShortForTorch(299)).toBe(true);
  });

  it('1拍300msちょうどなら短すぎないと判定する', () => {
    expect(isUnitTooShortForTorch(300)).toBe(false);
  });

  it('1拍の下限200msなら短すぎると判定する', () => {
    expect(isUnitTooShortForTorch(MIN_UNIT_MS)).toBe(true);
  });

  it('既定値250msのURLでは案内が出る値になっている', () => {
    expect(TORCH_RECOMMENDED_MIN_UNIT_MS).toBeGreaterThan(250);
  });
});
