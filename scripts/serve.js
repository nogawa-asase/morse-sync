// 手動確認用に public/ をローカルで配信する(開発時のみ。配信物には含めない)。
// 使い方: npm run serve [-- ポート番号]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const PUBLIC_DIR = normalize(new URL('../public/', import.meta.url).pathname);
const DEFAULT_PORT = 8080;
const port = Number(process.argv[2] ?? process.env.PORT ?? DEFAULT_PORT);

/** @type {Record<string, string>} */
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/**
 * URLのパスを public/ 内のファイルパスにする。public/ の外を指すなら null。
 * @param {string} urlPath リクエストのパス
 * @returns {string | null} ファイルパス
 */
function resolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const path = normalize(join(PUBLIC_DIR, decoded));
  return path.startsWith(PUBLIC_DIR) || path + sep === PUBLIC_DIR ? path : null;
}

const server = createServer(async (req, res) => {
  let path = resolvePath(req.url ?? '/');
  try {
    if (path === null) throw new Error('forbidden');
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    const body = await readFile(path);
    res.writeHead(200, {
      'Content-Type':
        CONTENT_TYPES[extname(path)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`http://localhost:${port}/ で public/ を配信しています`);
});
