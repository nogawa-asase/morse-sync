import { describe, it, expect } from 'vitest';
import {
  toHash,
  toShareUrl,
  parseHash,
  buildFromInput,
  previewInput,
  buildConfigTimeline,
} from '../../../public/js/core/config-codec.js';

/** @typedef {import('../../../public/js/core/types.js').PatternConfig} PatternConfig */
/** @typedef {import('../../../public/js/core/types.js').ValidationResult} ValidationResult */

/** @type {PatternConfig} */
const HELLO_CONFIG = {
  version: 1,
  lang: 'en',
  message: 'HELLO',
  periodSec: 15,
  unitMs: 250,
  color: 'ffcc00',
};

/**
 * @param {ValidationResult} result
 * @returns {string[]}
 */
const codesOf = (result) => (result.ok ? [] : result.errors.map((e) => e.code));

describe('URL仕様 v=1 の互換性(配布済みのQRコードを壊さないための固定値テスト)', () => {
  // このテストを変更・削除する場合は仕様バージョンを上げること
  it('PRDのURL例を読み込むと HELLO・周期15秒・1拍250ms・色 ffcc00 になる', () => {
    expect(parseHash('#v=1&l=en&m=HELLO&p=15&u=250&c=ffcc00')).toEqual({
      ok: true,
      config: HELLO_CONFIG,
      cycleMs: 14000,
    });
  });

  it('PRDのURL例と同じ設定を書き出すと、同じハッシュになる', () => {
    expect(toHash(HELLO_CONFIG)).toBe('#v=1&l=en&m=HELLO&p=15&u=250&c=ffcc00');
  });
});

describe('toHash / toShareUrl', () => {
  it('キーの順序は v, l, m, p, u, c に固定される', () => {
    expect(toHash({ ...HELLO_CONFIG, periodSec: 60, unitMs: 2000 })).toBe(
      '#v=1&l=en&m=HELLO&p=60&u=2000&c=ffcc00'
    );
  });

  it('メッセージはURLエンコードされ、空白は %20 になる', () => {
    expect(
      toHash({ ...HELLO_CONFIG, message: 'HI YOU & ME=+?', periodSec: 60 })
    ).toBe('#v=1&l=en&m=HI%20YOU%20%26%20ME%3D%2B%3F&p=60&u=250&c=ffcc00');
  });

  it('共有URLはページのURLのハッシュを置き換える', () => {
    expect(
      toShareUrl(HELLO_CONFIG, 'https://example.github.io/morse-sync/#old')
    ).toBe(
      'https://example.github.io/morse-sync/#v=1&l=en&m=HELLO&p=15&u=250&c=ffcc00'
    );
  });
});

describe('parseHash', () => {
  it('書き出したハッシュを読み込むと元の設定に戻る(記号を含む)', () => {
    for (const message of ['SOS', 'HELLO WORLD', ".,?'!/()&", ':;=+-_"$@']) {
      const built = buildFromInput({
        message,
        unitMs: '200',
        color: '#ABCDEF',
      });
      expect(built.ok).toBe(true);
      if (!built.ok) continue;
      expect(parseHash(toHash(built.config))).toEqual(built);
    }
  });

  it('任意項目(l, u, c)を省略すると既定値で読み込む', () => {
    expect(parseHash('#v=1&m=HELLO&p=15')).toEqual({
      ok: true,
      config: HELLO_CONFIG,
      cycleMs: 14000,
    });
  });

  it('先頭の # がなくても読み込める', () => {
    expect(parseHash('v=1&m=HELLO&p=15').ok).toBe(true);
  });

  it('メッセージは正規化して読み込む(小文字は大文字に)', () => {
    const result = parseHash('#v=1&m=hello&p=15');
    expect(result.ok && result.config.message).toBe('HELLO');
  });

  it('色は小文字に揃える', () => {
    const result = parseHash('#v=1&m=HELLO&p=15&c=FFAA00');
    expect(result.ok && result.config.color).toBe('ffaa00');
  });

  it('未知のキーは無視する', () => {
    expect(parseHash('#v=1&m=HELLO&p=15&x=1&flash=on').ok).toBe(true);
  });

  it('v=2 なら UNKNOWN_VERSION だけを返す', () => {
    expect(codesOf(parseHash('#v=2&m=あ&p=7'))).toEqual(['UNKNOWN_VERSION']);
  });

  it('v がなければ MISSING_FIELD を返す', () => {
    expect(parseHash('#m=HELLO&p=15')).toEqual({
      ok: false,
      errors: [{ code: 'MISSING_FIELD', detail: 'v' }],
    });
  });

  it('m がなければ MISSING_FIELD を返す', () => {
    expect(codesOf(parseHash('#v=1&p=15'))).toEqual(['MISSING_FIELD']);
  });

  it('p がなければ MISSING_FIELD を返す', () => {
    expect(codesOf(parseHash('#v=1&m=HELLO'))).toEqual(['MISSING_FIELD']);
  });

  it('l が未対応なら UNKNOWN_LANG を返す', () => {
    expect(codesOf(parseHash('#v=1&l=ja&m=HELLO&p=15'))).toEqual([
      'UNKNOWN_LANG',
    ]);
  });

  it('p が60の約数でなければ INVALID_PERIOD を返す', () => {
    expect(codesOf(parseHash('#v=1&m=HELLO&p=16'))).toEqual(['INVALID_PERIOD']);
    expect(codesOf(parseHash('#v=1&m=HELLO&p=0'))).toEqual(['INVALID_PERIOD']);
  });

  it('p が整数でなければ INVALID_PERIOD を返す', () => {
    expect(codesOf(parseHash('#v=1&m=HELLO&p=15.0'))).toEqual([
      'INVALID_PERIOD',
    ]);
    expect(codesOf(parseHash('#v=1&m=HELLO&p=abc'))).toEqual([
      'INVALID_PERIOD',
    ]);
  });

  it('p が1周分の所要時間より短ければ INVALID_PERIOD を返す', () => {
    // HELLO は14.0秒
    expect(codesOf(parseHash('#v=1&m=HELLO&p=12'))).toEqual(['INVALID_PERIOD']);
  });

  it('p は自動決定より長くても60の約数で所要時間以上なら、そのまま使う', () => {
    const result = parseHash('#v=1&m=HELLO&p=60');
    expect(result.ok && result.config.periodSec).toBe(60);
  });

  it('u が範囲外・整数でなければ UNIT_OUT_OF_RANGE を返す', () => {
    for (const u of ['199', '2001', '250.5', '', '-250']) {
      expect(codesOf(parseHash(`#v=1&m=E&p=60&u=${u}`))).toEqual([
        'UNIT_OUT_OF_RANGE',
      ]);
    }
  });

  it('u は200と2000ちょうどを受け付ける', () => {
    expect(parseHash('#v=1&m=E&p=2&u=200').ok).toBe(true);
    expect(parseHash('#v=1&m=E&p=60&u=2000').ok).toBe(true);
  });

  it('色が16進6桁でなければ INVALID_COLOR を返す', () => {
    for (const c of ['fff', 'ggcc00', '%23ffcc00', 'ffcc001', 'red']) {
      expect(codesOf(parseHash(`#v=1&m=HELLO&p=15&c=${c}`))).toEqual([
        'INVALID_COLOR',
      ]);
    }
  });

  it('対応外の文字を含むなら UNSUPPORTED_CHARS を返す', () => {
    expect(parseHash(`#v=1&m=${encodeURIComponent('HIあ')}&p=15`)).toEqual({
      ok: false,
      errors: [{ code: 'UNSUPPORTED_CHARS', detail: 'あ' }],
    });
  });

  it('メッセージが空・50文字超ならエラーを返す', () => {
    expect(codesOf(parseHash('#v=1&m=&p=15'))).toEqual(['EMPTY_MESSAGE']);
    expect(codesOf(parseHash(`#v=1&m=${'E'.repeat(51)}&p=60`))).toEqual([
      'MESSAGE_TOO_LONG',
    ]);
  });

  it('複数の誤りはまとめて返す', () => {
    expect(codesOf(parseHash('#v=1&m=&p=7&u=10&c=zzz'))).toEqual([
      'EMPTY_MESSAGE',
      'UNIT_OUT_OF_RANGE',
      'INVALID_COLOR',
      'INVALID_PERIOD',
    ]);
  });
});

describe('buildFromInput', () => {
  it('有効な入力から周期を自動決定した設定を作る', () => {
    expect(
      buildFromInput({ message: ' sos ', unitMs: '250', color: '#FFCC00' })
    ).toEqual({
      ok: true,
      config: { ...HELLO_CONFIG, message: 'SOS', periodSec: 10 },
      cycleMs: 8500,
    });
  });

  it('HELLO WORLD(29.5秒)は周期30秒になる', () => {
    const result = buildFromInput({
      message: 'hello world',
      unitMs: '250',
      color: '#ffcc00',
    });
    expect(result.ok && result.config.periodSec).toBe(30);
  });

  it('50文字ちょうどは受け付け、51文字は MESSAGE_TOO_LONG を返す', () => {
    const input = { unitMs: '200', color: '#ffcc00' };
    expect(buildFromInput({ ...input, message: 'E'.repeat(50) }).ok).toBe(true);
    expect(
      codesOf(buildFromInput({ ...input, message: 'E'.repeat(51) }))
    ).toEqual(['MESSAGE_TOO_LONG']);
  });

  it('空白だけのメッセージは EMPTY_MESSAGE を返す', () => {
    expect(
      codesOf(
        buildFromInput({ message: '   ', unitMs: '250', color: '#ffcc00' })
      )
    ).toEqual(['EMPTY_MESSAGE']);
  });

  it('対応外の文字は重複なく detail に入れて返す', () => {
    expect(
      buildFromInput({ message: 'あいあ', unitMs: '250', color: '#ffcc00' })
    ).toEqual({
      ok: false,
      errors: [{ code: 'UNSUPPORTED_CHARS', detail: 'あ い' }],
    });
  });

  it('1周分が60秒を超えると TOO_LONG_FOR_60S を返す', () => {
    // 0 は19拍+文字間3拍。50文字で約60秒を超える
    expect(
      codesOf(
        buildFromInput({
          message: '0'.repeat(50),
          unitMs: '250',
          color: '#ffcc00',
        })
      )
    ).toEqual(['TOO_LONG_FOR_60S']);
  });

  it('1拍が範囲外・数値でなければ UNIT_OUT_OF_RANGE を返す', () => {
    for (const unitMs of ['199', '2001', '', 'abc', '250.5']) {
      expect(
        codesOf(buildFromInput({ message: 'E', unitMs, color: '#ffcc00' }))
      ).toEqual(['UNIT_OUT_OF_RANGE']);
    }
  });

  it('色の形式が不正なら INVALID_COLOR を返す', () => {
    expect(
      codesOf(buildFromInput({ message: 'E', unitMs: '250', color: 'red' }))
    ).toEqual(['INVALID_COLOR']);
  });

  it('複数のエラーを同時に返す', () => {
    expect(
      codesOf(buildFromInput({ message: 'あ', unitMs: '10', color: 'x' }))
    ).toEqual(['UNSUPPORTED_CHARS', 'UNIT_OUT_OF_RANGE', 'INVALID_COLOR']);
  });
});

describe('previewInput', () => {
  it('有効な入力なら正規化後のメッセージと1周分の所要時間を返す', () => {
    const preview = previewInput({ message: 'sos', unitMs: '250', color: '' });
    expect(preview.normalized).toBe('SOS');
    expect(preview.cycleMs).toBe(8500);
    expect(preview.encoded.unsupported).toEqual([]);
  });

  it('60秒を超える場合も所要時間を返す', () => {
    const preview = previewInput({
      message: '0'.repeat(50),
      unitMs: '250',
      color: '',
    });
    expect(preview.cycleMs).toBeGreaterThan(60000);
  });

  it('対応外の文字・空のメッセージ・不正な1拍では所要時間は null', () => {
    expect(
      previewInput({ message: 'Aあ', unitMs: '250', color: '' }).cycleMs
    ).toBeNull();
    expect(
      previewInput({ message: ' ', unitMs: '250', color: '' }).cycleMs
    ).toBeNull();
    expect(
      previewInput({ message: 'A', unitMs: '0', color: '' }).cycleMs
    ).toBeNull();
  });
});

describe('buildConfigTimeline', () => {
  it('設定のメッセージから点灯区間の列を作る', () => {
    const timeline = buildConfigTimeline(HELLO_CONFIG);
    expect(timeline.totalUnits).toBe(56);
    expect(timeline.segments[0]).toEqual({
      startUnit: 0,
      endUnit: 1,
      charIndex: 0,
    });
  });
});
