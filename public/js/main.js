import { startRouter } from './ui/router.js';

// 想定外の例外は記録だけする。点滅は毎フレーム時刻から判定し直すため止めない
window.addEventListener('error', (event) => {
  console.error('想定外のエラー', event.error ?? event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('想定外のエラー', event.reason);
});

const appRoot = document.getElementById('app');
if (appRoot) {
  startRouter(appRoot);
} else {
  console.error('#app が見つかりません');
}
