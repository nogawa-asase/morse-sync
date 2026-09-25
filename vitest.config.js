import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // 自動テストの対象はドメイン層のみ(docs/architecture.md テスト戦略)
      include: ['public/js/core/**/*.js'],
      exclude: ['public/js/core/types.js'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
