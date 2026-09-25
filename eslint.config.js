import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

// スクリプト注入・通信を防ぐため、配信物のすべてのコードで禁止するプロパティ
const FORBIDDEN_PROPERTIES = [
  { property: 'innerHTML', message: 'textContent を使ってください' },
  { property: 'outerHTML', message: 'textContent を使ってください' },
  { property: 'insertAdjacentHTML', message: 'textContent を使ってください' },
  { object: 'document', property: 'write', message: '使用禁止です' },
  { object: 'document', property: 'writeln', message: '使用禁止です' },
  {
    object: 'navigator',
    property: 'sendBeacon',
    message: '通信しない方針です',
  },
];

// 通信しない方針(docs/architecture.md 基本方針)
const FORBIDDEN_GLOBALS = ['fetch', 'XMLHttpRequest', 'WebSocket'].map(
  (name) => ({ name, message: '通信しない方針です' })
);

/**
 * レイヤー間の依存ルール(docs/repository-structure.md)を
 * no-restricted-imports の設定にする。
 * @param {string[]} layers import を禁止するディレクトリ名
 */
function forbidLayers(layers) {
  return [
    'error',
    {
      patterns: layers.map((layer) => ({
        regex: `(^|/)${layer}/`,
        message: `このレイヤーから ${layer}/ への依存は禁止です`,
      })),
    },
  ];
}

export default [
  eslint.configs.recommended,
  prettierConfig,
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'public/vendor/**',
      '.steering/**',
    ],
  },
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['public/js/**/*.js'],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-properties': ['error', ...FORBIDDEN_PROPERTIES],
      'no-restricted-globals': ['error', ...FORBIDDEN_GLOBALS],
    },
  },
  {
    // ドメイン層: DOM非依存、時刻は引数で受け取る
    files: ['public/js/core/**/*.js'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...FORBIDDEN_GLOBALS,
        ...['window', 'document', 'navigator', 'location'].map((name) => ({
          name,
          message: 'core/ はDOMに依存しません',
        })),
      ],
      'no-restricted-properties': [
        'error',
        ...FORBIDDEN_PROPERTIES,
        {
          object: 'Date',
          property: 'now',
          message: '現在時刻は引数(nowMs)で受け取ってください',
        },
      ],
      'no-restricted-imports': forbidLayers([
        'ui',
        'player',
        'platform',
        'vendor',
      ]),
    },
  },
  {
    files: ['public/js/player/**/*.js'],
    rules: {
      'no-restricted-imports': forbidLayers(['ui', 'platform', 'vendor']),
    },
  },
  {
    files: ['public/js/platform/**/*.js'],
    rules: {
      'no-restricted-imports': forbidLayers(['core', 'player', 'ui']),
    },
  },
  {
    files: ['public/js/ui/**/*.js'],
    rules: {
      'no-restricted-imports': forbidLayers(['vendor']),
    },
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
];
