import {
  buildFromInput,
  previewInput,
  toShareUrl,
} from '../core/config-codec.js';
import { formatEncodedMessage } from '../core/morse-encoder.js';
import { DEFAULT_MESSAGE, DEFAULT_COLOR } from '../core/defaults.js';
import { renderQr } from '../platform/qr-view.js';
import { shareUrl } from '../platform/share-helper.js';
import { createElement, setVisible } from './dom.js';
import { MESSAGES, formatError, formatCycle } from './messages.js';
import { showQrOverlay } from './qr-overlay.js';
import { createColorField } from './color-field.js';
import { createUnitOption } from './unit-option.js';
import { showQrInfoDialog } from './qr-info-dialog.js';

/** @typedef {import('../core/types.js').PatternConfig} PatternConfig */
/** @typedef {import('../core/types.js').EncodedMessage} EncodedMessage */
/** @typedef {import('./router.js').Navigate} Navigate */

// 入力のたびにQRコードを作り直さないよう、最後の入力から少し待つ
const QR_RENDER_DELAY_MS = 100;

/**
 * 対応外の文字を <mark> で強調した、入力内容の写しを作る。
 * @param {EncodedMessage} encoded 符号化結果
 * @returns {Node[]} 表示用のノード
 */
function buildHighlightedMessage(encoded) {
  return encoded.chars.map((ch) =>
    ch.code === null
      ? createElement('mark', { text: ch.char })
      : document.createTextNode(ch.char)
  );
}

/**
 * 作成画面を表示する。
 *
 * @param {HTMLElement} root 表示先の要素
 * @param {PatternConfig | undefined} initial 引き継ぐ設定(参加画面から戻ったときなど)
 * @param {Navigate} navigate 画面遷移
 * @returns {() => void} アンマウント関数
 */
export function mountCreateScreen(root, initial, navigate) {
  /** @type {PatternConfig | null} */
  let currentConfig = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let qrTimerId;
  /** @type {(() => void) | null} */
  let closeOverlay = null;

  const messageInput = createElement('input', {
    className: 'field__input',
    attrs: {
      id: 'message-input',
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'characters',
      spellcheck: 'false',
      'aria-describedby': 'message-hint',
    },
  });
  messageInput.value = initial?.message ?? DEFAULT_MESSAGE;

  const unitOption = createUnitOption(initial?.unitMs, () => update());

  const colorField = createColorField(
    'color-input',
    initial?.color ?? DEFAULT_COLOR,
    () => update()
  );
  const highlighted = createElement('p', { className: 'highlighted' });
  const codeText = createElement('p', {
    className: 'code-text',
    attrs: { 'aria-label': MESSAGES.codeLabel },
  });
  const cycleValue = createElement('strong');
  const errorList = createElement('ul', {
    className: 'errors',
    attrs: { 'aria-live': 'polite' },
  });

  const qrBox = createElement('div', { className: 'qr-box' });
  const shareStatus = createElement('p', {
    className: 'share-status',
    attrs: { role: 'status', 'aria-live': 'polite' },
  });

  const handleShare = async () => {
    if (!currentConfig) return;
    shareStatus.textContent = '';
    const result = await shareUrl(toShareUrl(currentConfig, location.href));
    if (result === 'copied') shareStatus.textContent = MESSAGES.shareCopied;
    // URLは画面に出していないため、「QRコードの中身」から写してもらう
    if (result === 'failed') {
      shareStatus.textContent = MESSAGES.shareFailedSeeQrInfo;
    }
  };

  const handleEnlarge = () => {
    if (!currentConfig) return;
    const close = showQrOverlay(
      root,
      toShareUrl(currentConfig, location.href),
      {
        closeLabel: MESSAGES.close,
        onClose: () => {
          close();
          closeOverlay = null;
        },
      }
    );
    closeOverlay = close;
  };

  const handleQrInfo = () => {
    if (!currentConfig) return;
    closeOverlay?.();
    closeOverlay = showQrInfoDialog(
      root,
      toShareUrl(currentConfig, location.href)
    );
  };

  const qrSection = createElement(
    'section',
    {
      className: 'card qr-section',
      attrs: { 'aria-label': MESSAGES.qrSectionLabel },
    },
    [
      qrBox,
      createElement('button', {
        className: 'link-button qr-info-link',
        text: MESSAGES.qrInfo,
        attrs: { type: 'button', 'aria-haspopup': 'dialog' },
        on: { click: handleQrInfo },
      }),
      createElement('div', { className: 'button-row' }, [
        createElement('button', {
          className: 'button',
          text: MESSAGES.enlargeQr,
          attrs: { type: 'button' },
          on: { click: handleEnlarge },
        }),
        createElement('button', {
          className: 'button',
          text: MESSAGES.share,
          attrs: { type: 'button' },
          on: { click: handleShare },
        }),
        createElement('button', {
          className: 'button button--primary',
          text: MESSAGES.joinWithPattern,
          attrs: { type: 'button' },
          on: {
            click: () => {
              if (currentConfig) navigate.toJoin(currentConfig);
            },
          },
        }),
      ]),
      shareStatus,
    ]
  );

  const screen = createElement('main', { className: 'screen create-screen' }, [
    createElement('header', { className: 'screen__header' }, [
      createElement('h1', { text: MESSAGES.appTitle }),
      createElement('p', { className: 'tagline', text: MESSAGES.appTagline }),
      createElement('p', {
        className: 'warning',
        text: `⚠ ${MESSAGES.photosensitivityWarning}`,
      }),
    ]),
    createElement('section', { className: 'card' }, [
      createElement('div', { className: 'field' }, [
        createElement('label', {
          className: 'field__label',
          text: MESSAGES.messageLabel,
          attrs: { for: 'message-input' },
        }),
        messageInput,
        createElement('p', {
          className: 'field__hint',
          text: MESSAGES.messageHint,
          attrs: { id: 'message-hint' },
        }),
        highlighted,
        codeText,
      ]),
      createElement('div', { className: 'field field--inline' }, [
        createElement('label', {
          className: 'field__label',
          text: MESSAGES.colorLabel,
          attrs: { for: 'color-input' },
        }),
        colorField.picker,
        colorField.hexInput,
      ]),
      unitOption.element,
      createElement('p', { className: 'cycle' }, [
        document.createTextNode(`${MESSAGES.cycleLabel}: `),
        cycleValue,
      ]),
      errorList,
    ]),
    qrSection,
  ]);

  const update = () => {
    const input = {
      message: messageInput.value,
      unitMs: unitOption.getValue(),
      color: colorField.getValue(),
    };
    const preview = previewInput(input);
    const result = buildFromInput(input);

    codeText.textContent = formatEncodedMessage(preview.encoded);
    const hasUnsupported = preview.encoded.unsupported.length > 0;
    highlighted.replaceChildren(
      ...(hasUnsupported ? buildHighlightedMessage(preview.encoded) : [])
    );
    setVisible(highlighted, hasUnsupported);
    cycleValue.textContent =
      preview.cycleMs === null
        ? MESSAGES.cycleUnknown
        : formatCycle(preview.cycleMs);

    errorList.replaceChildren(
      ...(result.ok
        ? []
        : result.errors.map((error) =>
            createElement('li', { text: formatError(error) })
          ))
    );
    messageInput.setAttribute('aria-invalid', String(!result.ok));
    colorField.setInvalid(
      !result.ok && result.errors.some((e) => e.code === 'INVALID_COLOR')
    );
    if (
      !result.ok &&
      result.errors.some((e) => e.code === 'UNIT_OUT_OF_RANGE')
    ) {
      unitOption.open();
    }

    clearTimeout(qrTimerId);
    shareStatus.textContent = '';
    if (!result.ok) {
      // 読み取れる古いQRコードが残らないよう、無効になったら即座に隠す
      currentConfig = null;
      qrBox.replaceChildren();
      setVisible(qrSection, false);
      return;
    }
    currentConfig = result.config;
    const url = toShareUrl(result.config, location.href);
    setVisible(qrSection, true);
    qrTimerId = setTimeout(() => renderQr(qrBox, url), QR_RENDER_DELAY_MS);
  };

  messageInput.addEventListener('input', update);

  root.append(screen);
  update();

  return () => {
    clearTimeout(qrTimerId);
    closeOverlay?.();
    screen.remove();
  };
}
