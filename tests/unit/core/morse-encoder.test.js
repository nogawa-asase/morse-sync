import { describe, it, expect } from 'vitest';
import {
  normalizeMessage,
  encodeMessage,
  formatCode,
  formatEncodedMessage,
} from '../../../public/js/core/morse-encoder.js';
import { EN_TABLE } from '../../../public/js/core/tables/en.js';

/** @param {string} input */
const encode = (input) =>
  encodeMessage(normalizeMessage(input, EN_TABLE), EN_TABLE);

describe('normalizeMessage', () => {
  it('前後の空白を削除し、連続する空白を1つにまとめ、大文字にする', () => {
    expect(normalizeMessage('  hello   world ', EN_TABLE)).toBe('HELLO WORLD');
  });

  it('全角空白とタブも半角空白1つにまとめる', () => {
    expect(normalizeMessage('A　\tB', EN_TABLE)).toBe('A B');
  });

  it('空白のみの入力は空文字になる', () => {
    expect(normalizeMessage(' 　 ', EN_TABLE)).toBe('');
  });

  it('全角英字は大文字化せず、そのまま残す', () => {
    expect(normalizeMessage('ａb', EN_TABLE)).toBe('ａB');
  });

  it('対応外の文字も消さずに残す', () => {
    expect(normalizeMessage('あa', EN_TABLE)).toBe('あA');
  });
});

describe('encodeMessage', () => {
  it('変換表のすべての文字を表どおりの符号に変換する', () => {
    for (const [char, code] of Object.entries(EN_TABLE.codes)) {
      const result = encodeMessage(char, EN_TABLE);
      expect(result.chars).toEqual([{ char, code, sourceIndex: 0 }]);
      expect(result.unsupported).toEqual([]);
    }
  });

  it('小文字の入力は大文字として符号化される', () => {
    expect(encode('sos').chars.map((ch) => ch.code)).toEqual([
      '...',
      '---',
      '...',
    ]);
  });

  it('空白は符号が空文字の単語の区切りになる', () => {
    expect(encode('A B').chars).toEqual([
      { char: 'A', code: '.-', sourceIndex: 0 },
      { char: ' ', code: '', sourceIndex: 1 },
      { char: 'B', code: '-...', sourceIndex: 2 },
    ]);
  });

  it('日本語は対応外の文字として報告し、符号は null になる', () => {
    const result = encode('AあB');
    expect(result.unsupported).toEqual(['あ']);
    expect(result.chars[1]).toEqual({ char: 'あ', code: null, sourceIndex: 1 });
  });

  it('絵文字を1文字として報告し、位置はコードポイント単位で数える', () => {
    const result = encode('😀A');
    expect(result.unsupported).toEqual(['😀']);
    expect(result.chars[1]).toEqual({ char: 'A', code: '.-', sourceIndex: 1 });
  });

  it('全角英字は対応外の文字として報告する', () => {
    expect(encode('ＳＯＳ').unsupported).toEqual(['Ｓ', 'Ｏ']);
  });

  it('対応外の文字は重複なく出現順に報告する', () => {
    expect(encode('いあいう').unsupported).toEqual(['い', 'あ', 'う']);
  });

  it('Object のプロパティ名と同じ文字も対応外として扱う', () => {
    expect(encodeMessage('{', EN_TABLE).unsupported).toEqual(['{']);
  });
});

describe('formatCode', () => {
  it('短点を・、長点を−に置き換える', () => {
    expect(formatCode('.-')).toBe('・−');
    expect(formatCode('...-..-')).toBe('・・・−・・−');
  });
});

describe('formatEncodedMessage', () => {
  it('文字ごとに空白で区切り、単語の区切りを / で表す', () => {
    expect(formatEncodedMessage(encode('SOS'))).toBe('・・・ −−− ・・・');
    expect(formatEncodedMessage(encode('E T'))).toBe('・ / −');
  });

  it('対応外の文字は ? で表す', () => {
    expect(formatEncodedMessage(encode('EあE'))).toBe('・ ? ・');
  });
});
