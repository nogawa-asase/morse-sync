// 配信物(public/)の転送量(gzip後)の合計が上限以内か検査する。
// 会場で大勢が同時に読み込んでも回線が詰まらないようにするため(PRD 非機能要件)。
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const PUBLIC_DIR = new URL('../public/', import.meta.url).pathname;
const LIMIT_BYTES = 100 * 1024;

/**
 * ディレクトリ以下のファイルのパスをすべて集める。
 * @param {string} dir ディレクトリ
 * @returns {string[]} ファイルのパス
 */
function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

const sizes = listFiles(PUBLIC_DIR).map((path) => ({
  path: relative(PUBLIC_DIR, path),
  gzipBytes: gzipSync(readFileSync(path), { level: 9 }).length,
}));
sizes.sort((a, b) => b.gzipBytes - a.gzipBytes);
const totalBytes = sizes.reduce((sum, file) => sum + file.gzipBytes, 0);

for (const file of sizes) {
  console.log(
    `${(file.gzipBytes / 1024).toFixed(1).padStart(7)} KB  ${file.path}`
  );
}
console.log(
  `合計 ${(totalBytes / 1024).toFixed(1)} KB / 上限 ${LIMIT_BYTES / 1024} KB(gzip後)`
);

if (totalBytes > LIMIT_BYTES) {
  console.error('配信物の転送量が上限を超えています');
  process.exit(1);
}
