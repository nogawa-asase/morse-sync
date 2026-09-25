import { describe, it, expect } from 'vitest';
import { EN_TABLE } from '../../../../public/js/core/tables/en.js';
import { getTable } from '../../../../public/js/core/tables.js';

// docs/functional-design.md 付録「欧文の変換表」の写し。
// 仕様書と変換表の食い違いを検出するため、ここに固定値で持つ。
// prettier-ignore
const SPEC_TABLE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
  H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
  O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
  V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', _: '..--.-', '"': '.-..-.',
  $: '...-..-', '@': '.--.-.',
};

describe('EN_TABLE', () => {
  it('機能設計書の付録の表と完全に一致する', () => {
    expect({ ...EN_TABLE.codes }).toEqual(SPEC_TABLE);
  });

  it('英字26・数字10・記号18の54文字を持つ', () => {
    expect(Object.keys(EN_TABLE.codes)).toHaveLength(54);
  });

  it('符号は短点と長点だけからなり、1文字あたり1〜7要素である', () => {
    for (const code of Object.values(EN_TABLE.codes)) {
      expect(code).toMatch(/^[.-]{1,7}$/);
    }
  });

  it('同じ符号を持つ文字がない', () => {
    const codes = Object.values(EN_TABLE.codes);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('文字の種類は en である', () => {
    expect(EN_TABLE.lang).toBe('en');
  });
});

describe('getTable', () => {
  it('en なら欧文の変換表を返す', () => {
    expect(getTable('en')).toBe(EN_TABLE);
  });

  it('未対応の文字の種類なら null を返す', () => {
    expect(getTable('ja')).toBeNull();
    expect(getTable('toString')).toBeNull();
  });
});
