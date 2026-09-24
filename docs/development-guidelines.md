# 開発ガイドライン (Development Guidelines)

本書は `docs/architecture.md`(ビルドなし・静的ファイルのみ・JavaScript ES2022)と `docs/repository-structure.md`(`public/js/` の4層構成)に基づく、実装の規約と開発の進め方を定める。

## 前提

- 配信するコードは **JavaScript(ES Modules)をそのまま** 書く。TypeScriptの `.ts` ファイルは作らない
- 型は **JSDoc** で書き、`tsc --noEmit`(`jsconfig.json`)で検査する
- 実行時のnpmパッケージは使わない。開発ツールは `devDependencies` にのみ置く

## コーディング規約

### 命名規則

#### 変数・関数

```javascript
// ✅ 良い例
const cycleMs = cycleMsOf(timeline, config.unitMs);
function choosePeriod(cycleMs) { /* ... */ }

// ❌ 悪い例
const t = calc(tl, c.u);          // 何の値か分からない
function period(ms) { /* ... */ } // 動詞で始まっていない
```

**原則**:
- 変数: camelCase、名詞または名詞句
- 関数: camelCase、動詞で始める(`build` `choose` `parse` `render` `is` など)
- 定数(モジュールの最上位で固定の値): UPPER_SNAKE_CASE(例: `PERIOD_CANDIDATES_SEC`、`DEFAULT_UNIT_MS`)
- Boolean: `is` `has` `can` `should` で始める(例: `isOn`、`hasUnsupported`)
- クラス: PascalCase、名詞(例: `Player`、`WakeLockKeeper`)
- JSDocの型名(`@typedef`): PascalCase(例: `PatternConfig`)

#### 単位を名前に含める

時間・長さを扱う変数には単位を接尾辞で付ける。同期のずれの原因になりやすい秒とミリ秒の取り違えを防ぐため。

```javascript
// ✅ 良い例
const periodSec = 15;
const periodMs = periodSec * 1000;
const elapsedUnits = (nowMs - cycleStartMs) / unitMs;

// ❌ 悪い例
const period = 15;             // 秒? ミリ秒?
const elapsed = now - start;   // 単位が分からない
```

| 接尾辞 | 単位 | 例 |
|-------|------|-----|
| `Ms` | ミリ秒 | `unitMs`、`nowMs`、`cycleMs` |
| `Sec` | 秒 | `periodSec` |
| `Units` / `Unit` | 拍 | `totalUnits`、`startUnit` |

#### URLのキーと内部の名前

URLのキー(`v` `l` `m` `p` `u` `c`)は `core/config-codec.js` の中だけで使い、それ以外では `PatternConfig` の名前(`version` `lang` `message` `periodSec` `unitMs` `color`)を使う。

### 型(JSDoc)

型定義は `public/js/core/types.js` に `@typedef` で集め、各ファイルは `@import` 相当のコメントで参照する。

```javascript
// public/js/core/types.js
/**
 * 点滅パターンの設定。URLのハッシュに格納される。
 * @typedef {Object} PatternConfig
 * @property {1} version       仕様バージョン(URLの v)
 * @property {'en'} lang       文字の種類(URLの l)
 * @property {string} message  正規化済みメッセージ(URLの m)
 * @property {number} periodSec 同期の周期・秒(URLの p)。60の約数
 * @property {number} unitMs   1拍の長さ・ミリ秒(URLの u)
 * @property {string} color    点灯色。小文字16進6桁、'#'なし
 */
export {};
```

```javascript
// public/js/core/period-planner.js
/** @typedef {import('./types.js').PatternConfig} PatternConfig */

/**
 * 1周分の所要時間から、同期の周期を自動で決める。
 * 繰り返しの間の消灯を短くするため、所要時間以上の60の約数のうち最短を選ぶ。
 *
 * @param {number} cycleMs 1周分の所要時間(末尾の区切り7拍を含む)
 * @returns {number | null} 周期(秒)。60秒に収まらなければ null
 */
export function choosePeriod(cycleMs) {
  return PERIOD_CANDIDATES_SEC.find((p) => p * 1000 >= cycleMs) ?? null;
}
```

**原則**:
- `export` するすべての関数・クラスにJSDocを書き、引数と戻り値の型を明記する
- `any` 相当の `{*}` `{Object}`(中身の指定なし)は使わない
- 型検査のエラーは0件を保つ(`npm run typecheck`)

### モジュールの書き方

```javascript
// ✅ 相対パスで、拡張子 .js まで書く(ブラウザは拡張子を補わないため)
import { choosePeriod } from './period-planner.js';

// ❌ 拡張子なし・パッケージ名での import は動かない
import { choosePeriod } from './period-planner';
import qrcode from 'qrcode-generator';
```

- 名前付きexportのみ使う(`export default` は使わない)。検索しやすく、名前の揺れを防ぐため
- モジュールの読み込み時に副作用(DOMの操作、イベントの登録、タイマーの開始)を起こさない。副作用は `main.js` から呼ばれる関数の中で起こす
- 使える構文はES2022まで(`docs/architecture.md`)。それより新しいAPIを使うときは、iOS 16.4のSafariでの対応を確認してからにする

### レイヤーごとの規約

#### core/(ドメイン層)

- 純粋な関数として書く。同じ引数なら同じ結果を返し、引数を書き換えない
- 現在時刻は必ず引数で受け取る(`nowMs`)。`Date.now()` を呼ばない

```javascript
// ✅ 良い例: 時刻を引数で受け取るので、テストで任意の時刻を与えられる
export function nextCycleStart(nowMs, periodMs) {
  return Math.ceil(nowMs / periodMs) * periodMs;
}

// ❌ 悪い例: テストのたびに結果が変わる
export function nextCycleStart(periodMs) {
  return Math.ceil(Date.now() / periodMs) * periodMs;
}
```

- `window` `document` `navigator` `location` を参照しない(ESLintで禁止)
- 検証の失敗は例外ではなく `ValidationResult`(`{ ok: false, errors }`)で返す。入力の誤りは想定内の出来事であり、呼び出し側で必ず分岐させたいため

#### player/(再生層)

- 毎フレームの処理(`requestAnimationFrame` のコールバック)でオブジェクト・配列・文字列を新しく作らない(GCによるフレーム落ちを避ける)
- 点灯状態が変わったときだけ `Output.setOn()` を呼ぶ
- 時刻は `Date.now()` を使う。`performance.now()` や rAFの引数のタイムスタンプは、端末ごとに起点が違うため同期の基準に使わない

```javascript
// ✅ 良い例: 状態が変わったときだけ出力に通知する
#tick = () => {
  const state = stateAt(Date.now(), this.#firstStartMs, this.#timeline, this.#unitMs, this.#periodMs);
  if (state.isOn !== this.#lastIsOn) {
    this.#lastIsOn = state.isOn;
    for (const output of this.#outputs) output.setOn(state.isOn);
  }
  this.#rafId = requestAnimationFrame(this.#tick);
};
```

#### platform/(プラットフォーム層)

- ブラウザAPIの失敗(非対応・拒否・例外)は内部で捕捉し、`boolean` や結果の文字列で返す。呼び出し側に `try/catch` を強いない
- 対応判定は機能の有無で行う(`'wakeLock' in navigator`)。ユーザーエージェント文字列で判定しない
- 同梱ライブラリ(`public/vendor/`)を参照してよいのはこの層だけ

**qrcode-generatorの読み込み**: 同梱ファイルはES Modulesではないため、`index.html` で通常の `<script src="./vendor/qrcode-generator.js">` として `main.js` より前に読み込み、グローバルの `qrcode` 関数を `platform/qr-view.js` の中でだけ参照する。

```javascript
// public/js/platform/qr-view.js
/** @type {any} 同梱ライブラリ(public/vendor/qrcode-generator.js)が定義するグローバル */
const qrcodeLib = /** @type {any} */ (globalThis).qrcode;
```

#### ui/(プレゼンテーション層)

- 文字列の表示は `textContent` のみ。`innerHTML` `outerHTML` `insertAdjacentHTML` `document.write` は使わない(ESLintで禁止)
- 文言は `ui/messages.js` に集める。画面のファイルに日本語の文字列を直接書かない

```javascript
// public/js/ui/messages.js
export const MESSAGES = {
  tapToJoin: 'タップして参加',
  brightnessHint: '必要に応じて、画面の明るさを最大にしてください',
  photosensitivityWarning: '光の点滅に敏感な方はご注意ください',
};

/** @type {Record<import('../core/types.js').ValidationError['code'], string>} */
export const ERROR_MESSAGES = {
  TOO_LONG_FOR_60S: '60秒以内に収まりません。メッセージを短くするか、1拍を短くしてください',
  UNKNOWN_VERSION: 'このQRコードは新しいバージョン用です。ページを再読み込みしてください',
  // ...
};
```

- Wake Lock・フルスクリーン・共有・(P1)カメラは、タップのイベントハンドラの中で `await` より前に呼び出しを始める(ユーザー操作の扱いが切れないようにするため)
- 画面を離れるとき(アンマウント関数)に、登録したイベント・タイマー・rAF・Wake Lockをすべて解除する

### コードフォーマット

Prettierの設定(`.prettierrc`)に従い、手で整形しない。

- **インデント**: 2スペース
- **行の長さ**: 最大80文字
- **引用符**: シングルクォート
- **セミコロン**: あり
- **末尾のカンマ**: ES5の範囲で付ける

### コメント規約

**関数・クラス**: JSDocで「何をするか」と、引数・戻り値の意味(単位を含む)を書く。

**インラインコメント**: 「なぜそうするか」を書く。コードを読めば分かる「何をしているか」は書かない。

```javascript
// ✅ 良い例: 理由を説明している
// UNIX時刻0は分の0秒で、周期は60の約数なので、どの端末でも同じ開始時刻になる
const cycleStartMs = Math.floor(nowMs / periodMs) * periodMs;

// ❌ 悪い例: コードの言い換え
// 周期の開始時刻を計算する
const cycleStartMs = Math.floor(nowMs / periodMs) * periodMs;
```

- 仕様の根拠があるものは出典を書く(例: `// ITU-R M.1677: 文字間は3拍`、`// WCAG 2.3.1: 1秒に3回以下`)
- コメント・JSDocは日本語で書く

### エラーハンドリング

**原則**:
- **入力の誤り(想定内)**: `core/` が `ValidationResult` で返し、`ui/` が `ERROR_MESSAGES` の文言で表示する。例外は使わない
- **ブラウザ機能の非対応・拒否(想定内)**: `platform/` が捕捉して結果を返し、`ui/` が案内を表示する。点滅は止めない
- **想定外の例外**: 握りつぶさない。`console.error` で記録したうえで、点滅中なら点滅を継続する(判定は毎フレームやり直されるため)

```javascript
// ✅ 良い例: 想定内の失敗は結果で返す
export async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return false;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    return true;
  } catch (error) {
    console.warn('Wake Lockを取得できませんでした', error);
    return false;
  }
}

// ❌ 悪い例: 失敗を黙って無視する
try { await navigator.wakeLock.request('screen'); } catch {}
```

### セキュリティ

- URL・入力の値は `core/config-codec.js` で検証してから使う。検証前の値を他の層に渡さない
- `eval` `new Function` `innerHTML` 系は使わない(ESLintで禁止)
- 通信処理(`fetch` `XMLHttpRequest` `WebSocket` `navigator.sendBeacon`)を書かない。CSPの `connect-src 'none'` でも遮断される
- 外部ドメインのスクリプト・スタイル・フォント・画像を読み込まない
- `index.html` にインラインスクリプト・`<style>`・`style` 属性を書かない(CSP)。動的な色は `element.style.backgroundColor` で設定する

### パフォーマンス

- 配信物の合計(gzip後)は100KB以内。`npm run check-size` で確認する
- 毎フレームの処理は `Date.now()`・二分探索・比較に限る(`docs/functional-design.md` アルゴリズム4)
- 点滅は1つの全画面要素の `background-color` の切替で行い、要素の追加・削除やレイアウトの変わるスタイル変更をしない

### 安全への配慮

- 1拍の下限200ms(`core/defaults.js` の `MIN_UNIT_MS`)を下げる変更をしない。点滅は1秒に3回以下(WCAG 2.3.1)を守る
- 光過敏の注意書きを作成画面・参加画面から削除しない

## ESLintの設定方針

`eslint.config.js` をJavaScript向けに変更し、以下を設定する。

| ルール | 対象 | 目的 |
|-------|------|------|
| `no-restricted-globals`(`window` `document` `navigator` `location`) | `public/js/core/**` | ドメイン層のDOM非依存を保つ |
| `no-restricted-properties`(`Date.now`) | `public/js/core/**` | 時刻を引数で受け取らせる |
| `no-restricted-imports`(レイヤー間) | `public/js/**` | `docs/repository-structure.md` の依存ルールを守る |
| `no-restricted-properties`(`innerHTML` `outerHTML`)、`no-eval`、`no-implied-eval`、`no-new-func` | `public/js/**` | スクリプト注入を防ぐ |
| `no-restricted-globals`(`fetch` `XMLHttpRequest` `WebSocket`) | `public/js/**` | 通信しない方針を守る |
| `no-restricted-properties`(`insertAdjacentHTML`、`document.write`、`document.writeln`) | `public/js/**` | スクリプト注入を防ぐ |
| `no-restricted-properties`(`navigator.sendBeacon`) | `public/js/**` | 通信しない方針を守る |
| `no-unused-vars`(`_` 始まりの引数は除外) | 全体 | 既存設定を維持 |
| ignores: `public/vendor/**` `coverage/**` `.steering/**` | - | 同梱ライブラリは対象外 |

## Git運用ルール

### ブランチ戦略(GitHub Flow)

個人開発で、`main` へのpushがそのままGitHub Pagesへの公開になるため、Git Flow(`develop` ブランチを挟む運用)ではなく、より単純なGitHub Flowを採用する。

```
main(常に公開可能。pushでGitHub Pagesに公開される)
 ├─ feature/[作業名]   新機能      例: feature/create-screen
 ├─ fix/[作業名]       バグ修正    例: fix/wake-lock-reacquire
 ├─ docs/[作業名]      ドキュメント 例: docs/update-prd
 └─ refactor/[作業名]  リファクタリング
```

**運用ルール**:
- `main` から作業ブランチを作り、プルリクエストで `main` にマージする
- 作業ブランチ名の `[作業名]` は、`.steering/[日付]-[作業名]/` の作業名と揃える
- マージはsquash mergeとし、1つの作業を1コミットにまとめる
- CI(静的解析・型検査・テスト・サイズ検査)が通らないものはマージしない
- 実機での確認が必要な変更(`core/` `player/` `platform/` の変更、同梱ライブラリの更新)は、実機検証の結果を `tasklist.md` に記録してからマージする

### コミットメッセージ規約

Conventional Commits に従う。件名は日本語で書く。

**フォーマット**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: 整形のみ(動作に影響しない)
- `refactor`: リファクタリング
- `test`: テストの追加・修正
- `chore`: 開発ツール・CI・設定

**scope**: レイヤー名または対象(`core` `player` `platform` `ui` `vendor` `ci` `docs`)

**例**:
```
feat(core): 同期の周期を所要時間から自動で決める

1周分の所要時間以上となる60の約数のうち最短を選ぶ。
60秒を超える場合は null を返し、作成画面でQRコードを生成しない。

- PERIOD_CANDIDATES_SEC を追加
- choosePeriod / isValidPeriod を追加
- 境界値(10.0秒・10.1秒・60.1秒)のテストを追加
```

### プルリクエストプロセス

**作成前のチェック**:
- [ ] `npm test` が通る
- [ ] `npm run lint` でエラーがない
- [ ] `npm run typecheck` でエラーがない
- [ ] `npm run check-size` で100KB以内
- [ ] 手動確認・実機検証の結果を `tasklist.md` に記録した(該当する場合)

**PRテンプレート**:
```markdown
## 概要
[変更内容の簡潔な説明]

## 変更理由
[なぜこの変更が必要か。関連するPRDの機能番号・受け入れ条件]

## 変更内容
- [変更点1]
- [変更点2]

## テスト
- [ ] ユニットテストを追加・更新した
- [ ] ブラウザで手動確認した(PC / iPhone / Android)
- [ ] 同期に影響する変更のため、複数台で実機確認した

## スクリーンショット・動画(該当する場合)
[画像やスロー動画]

## ステアリングファイル
.steering/[日付]-[作業名]/
```

**レビュープロセス**:
1. セルフレビュー(下記「コードレビュー基準」で確認)
2. CIの結果を確認
3. 必要に応じて `implementation-validator` サブエージェントでスペックとの整合性を確認
4. 指摘に対応
5. squash merge

## テスト戦略

### テストの種類

| 種類 | 対象 | 方法 | 目標 |
|------|------|------|------|
| ユニットテスト | `public/js/core/` | Vitest(Node.js) | 行・分岐カバレッジ90%以上 |
| 手動確認 | 画面遷移・ブラウザAPI | ローカルの静的サーバー+ブラウザ | 機能設計書「統合テスト」の全項目 |
| 実機検証 | 同期精度・QR読み取り・動作環境 | 実機+240fpsのスロー動画 | PRDのKPI(端末間のずれ最大100msなど) |

`player/` `platform/` `ui/` は自動テストの対象外とする。ブラウザAPIや描画のタイミングに依存し、モックで検証しても実機での動作を保証できないため。そのかわりロジックを `core/` に寄せ、この3層を薄く保つ。

### ユニットテスト

**例**:
```javascript
// tests/unit/core/period-planner.test.js
import { describe, it, expect } from 'vitest';
import { choosePeriod, isValidPeriod } from '../../../public/js/core/period-planner.js';

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

  it('所要時間が60秒を超えたら null を返す', () => {
    expect(choosePeriod(60100)).toBeNull();
  });
});

describe('isValidPeriod', () => {
  it('60の約数でない周期は無効', () => {
    expect(isValidPeriod(7, 1000)).toBe(false);
  });
});
```

### テスト命名規則

- `describe` にテスト対象の関数名、`it` に「条件なら結果」を日本語で書く
- 数値の境界を扱うテストは、条件に具体的な値を書く

```javascript
// ✅ 良い例
it('周期の開始時刻ちょうどなら即座に点灯する', () => {});
it('開始時刻の1ms前なら待機中を返す', () => {});

// ❌ 悪い例
it('動く', () => {});
it('test1', () => {});
```

### 時刻を扱うテスト

- 時刻は固定の値を引数で与える。`vi.useFakeTimers()` や `Date.now()` のモックに頼らない(`core/` は時刻を引数で受け取る設計のため不要)
- 基準時刻には、読みやすい「分の0秒」を使う

```javascript
// 2026-01-01T00:00:00Z(分の0秒)
const MINUTE_START_MS = Date.UTC(2026, 0, 1, 0, 0, 0);

it('1時間後でも同じ位置で同じ状態になる', () => {
  const at = MINUTE_START_MS + 250;
  const later = at + 60 * 60 * 1000;
  expect(stateAt(later, MINUTE_START_MS, timeline, 250, 15000).isOn)
    .toBe(stateAt(at, MINUTE_START_MS, timeline, 250, 15000).isOn);
});
```

### URL仕様の互換性テスト

- `v=1` のURLの実例(PRDのURL例など)を `tests/unit/core/config-codec.test.js` に固定値で残し、読み込み結果が変わらないことを検査する。配布済みのQRコードを壊さないため、このテストを削除・変更する場合は仕様バージョンを上げる

## コードレビュー基準

### レビューポイント

**機能性**:
- [ ] PRD・機能設計書の受け入れ条件を満たしているか
- [ ] 境界値(周期の境界、1拍の上下限、50文字、60秒)を扱えているか
- [ ] ブラウザ機能の非対応・拒否のときに、点滅を止めずに案内を出しているか

**同期の正しさ**:
- [ ] 同期の基準に `Date.now()` を使っているか(`performance.now()` ではない)
- [ ] 経過時間を積み上げず、毎回現在時刻から計算しているか
- [ ] 秒とミリ秒を取り違えていないか(名前の単位の接尾辞)
- [ ] URLの `p` を参加側で計算し直していないか

**可読性・保守性**:
- [ ] レイヤー間の依存ルールを守っているか
- [ ] 文言を `messages.js` に置いているか
- [ ] 1ファイル300行以下か

**パフォーマンス**:
- [ ] 毎フレームの処理でオブジェクトを作っていないか
- [ ] 状態が変わったときだけDOMを更新しているか
- [ ] 配信物が100KB以内か

**セキュリティ・プライバシー**:
- [ ] `textContent` 以外で文字列を表示していないか
- [ ] 通信処理・外部リソースを追加していないか
- [ ] 検証前のURLの値を使っていないか

### レビューコメントの書き方

優先度を先頭に付け、理由と代案を書く。

- `[必須]`: 修正必須
- `[推奨]`: 修正推奨
- `[提案]`: 検討してほしい
- `[質問]`: 理解のための質問

```markdown
[必須] ここで `performance.now()` を使うと、端末ごとに起点が違うため他の端末と揃いません。
`Date.now()` に変えてください。
```

## 品質の自動化

### npmスクリプト

| スクリプト | 内容 |
|-----------|------|
| `npm test` | Vitestでユニットテストを実行 |
| `npm run test:coverage` | カバレッジ付きで実行 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit -p jsconfig.json`(JSDocの型検査) |
| `npm run format` | Prettierで整形 |
| `npm run check-size` | `scripts/check-size.js` で配信物の転送量を検査 |
| `npm run serve` | `public/` をローカルで配信(手動確認用) |

### コミット前(husky + lint-staged)

- ステージした `*.js` にESLint(自動修正)とPrettierを実行
- `npm run typecheck` と `npm test` を実行

### CI(GitHub Actions)

| ワークフロー | きっかけ | 内容 |
|------------|---------|------|
| `ci.yml` | プルリクエスト、`main` へのpush | lint / typecheck / test:coverage / check-size |
| `deploy.yml` | `main` へのpush(CI成功後) | `public/` をそのままGitHub Pagesにアップロード(変換しない) |

## 開発環境セットアップ

### 必要なツール

| ツール | バージョン | インストール方法 |
|--------|-----------|-----------------|
| Docker | 最新版 | 公式サイトから |
| VS Code + Dev Containers拡張 | 最新版 | 公式サイト・拡張機能マーケットプレイス |
| Node.js / npm | LTS(v24)/ 11.x | devcontainerで自動 |

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone https://github.com/nogawa-asase/morse-sync.git
cd morse-sync

# 2. VS Codeで開き「Reopen in Container」を選ぶ
#    (npm install は postCreateCommand で自動実行される)

# 3. テストの実行
npm test

# 4. ローカルで表示
npm run serve
# → 表示されたURLをブラウザで開く
```

### スマホでの確認

Wake Lock・カメラ(P1)・Service Worker(P1)はHTTPSでしか動かないため、スマホ実機での確認は次のいずれかで行う。

- GitHub Pagesに公開した版で確認する(作業ブランチはGitHub Pagesに出ないため、`main` にマージ後に確認する)
- 開発用のHTTPSトンネル(例: VS Codeのポート転送を「Public」にしてHTTPSのURLで開く)を使う

画面点滅だけの確認であれば、同じネットワーク内のHTTPのURLでも可能(Wake Lockは動かない)。

### 推奨開発ツール

- VS Code拡張: ESLint、Prettier
- スロー動画を撮れるスマホ(同期精度の確認用、240fps)
