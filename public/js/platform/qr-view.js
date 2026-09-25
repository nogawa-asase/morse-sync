const SVG_NS = 'http://www.w3.org/2000/svg';
// 誤り訂正レベルM: 読み取りやすさとモジュールの粗さ(離れて読めること)の釣り合い
const ERROR_CORRECTION_LEVEL = 'M';
// 型番0は、データ量から自動で決める指定
const AUTO_TYPE_NUMBER = 0;
// QRコードの規格が求めるクワイエットゾーン(4モジュール)
const DEFAULT_MARGIN_MODULES = 4;

/**
 * 同梱ライブラリ(public/vendor/qrcode-generator.js)が定義するグローバル関数を返す。
 * @returns {any} qrcode 関数。読み込まれていなければ undefined
 */
function getQrcodeLib() {
  return /** @type {any} */ (globalThis).qrcode;
}

/**
 * URLからQRコードをSVGで生成し、要素の中身を置き換える。
 * SVGは createElementNS で組み立て、文字列をHTMLとして解釈させない。
 *
 * @param {Element} el 描画先の要素
 * @param {string} url QRコードにするURL
 * @param {{ margin?: number }} [options] margin: 余白(モジュール数)
 * @returns {boolean} 描画できたら true
 */
export function renderQr(el, url, options = {}) {
  const marginModules = options.margin ?? DEFAULT_MARGIN_MODULES;
  const qrcodeLib = getQrcodeLib();
  if (typeof qrcodeLib !== 'function') {
    console.error('QRコード生成ライブラリが読み込まれていません');
    el.replaceChildren();
    return false;
  }
  try {
    const qr = qrcodeLib(AUTO_TYPE_NUMBER, ERROR_CORRECTION_LEVEL);
    qr.addData(url, 'Byte');
    qr.make();
    const moduleCount = /** @type {number} */ (qr.getModuleCount());
    const sizeModules = moduleCount + marginModules * 2;

    const pathCommands = [];
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        if (qr.isDark(row, col)) {
          pathCommands.push(
            `M${col + marginModules} ${row + marginModules}h1v1h-1z`
          );
        }
      }
    }

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${sizeModules} ${sizeModules}`);
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', url);
    svg.classList.add('qr-svg');

    const background = document.createElementNS(SVG_NS, 'rect');
    background.setAttribute('width', String(sizeModules));
    background.setAttribute('height', String(sizeModules));
    background.setAttribute('fill', '#ffffff');

    const modules = document.createElementNS(SVG_NS, 'path');
    modules.setAttribute('d', pathCommands.join(''));
    modules.setAttribute('fill', '#000000');

    svg.append(background, modules);
    el.replaceChildren(svg);
    return true;
  } catch (error) {
    console.error('QRコードを生成できませんでした', error);
    el.replaceChildren();
    return false;
  }
}
