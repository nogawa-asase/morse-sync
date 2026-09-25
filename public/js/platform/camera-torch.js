/**
 * カメラ用ライト(トーチ)を持つ映像トラックの取得と解放。
 * 映像はトーチの制御のためだけに取得し、<video> や <canvas> には接続しない。
 */

/**
 * @typedef {{ ok: true, track: MediaStreamTrack }
 *   | { ok: false, reason: 'unsupported' | 'denied' | 'failed' }} TorchTrackResult
 */

/**
 * カメラの許可を求めずに判定できる範囲で、トーチの制御に対応していそうか判定する。
 * 真でも、実際にトーチを持つかはカメラを取得するまで分からない。
 * @returns {boolean} 対応していそうなら true
 */
export function isTorchLikelySupported() {
  const supported = /** @type {Record<string, boolean> | undefined} */ (
    navigator.mediaDevices?.getSupportedConstraints?.()
  );
  return supported?.torch === true;
}

/**
 * 背面カメラを取得し、トーチを持つ映像トラックを返す。
 * 背面カメラが複数ある端末ではトーチのないカメラが選ばれることがあるため、
 * トーチがなければ他のカメラを順に試す。失敗しても例外を投げない。
 * @returns {Promise<TorchTrackResult>}
 */
export async function acquireTorchTrack() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    const firstTrack = await openVideoTrack({
      facingMode: { ideal: 'environment' },
    });
    if (hasTorch(firstTrack)) return { ok: true, track: firstTrack };
    const firstDeviceId = firstTrack.getSettings().deviceId;
    firstTrack.stop();

    // 許可後はカメラの一覧を取得できる
    const devices = await navigator.mediaDevices.enumerateDevices();
    for (const device of devices) {
      if (device.kind !== 'videoinput' || device.deviceId === firstDeviceId) {
        continue;
      }
      const track = await openVideoTrack({
        deviceId: { exact: device.deviceId },
      });
      if (hasTorch(track)) return { ok: true, track };
      track.stop();
    }
    return { ok: false, reason: 'unsupported' };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      return { ok: false, reason: 'denied' };
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      return { ok: false, reason: 'unsupported' };
    }
    console.warn('カメラを取得できませんでした', error);
    return { ok: false, reason: 'failed' };
  }
}

/**
 * 映像トラックを止めてカメラを解放する(OSのカメラ使用中表示を消す)。
 * @param {MediaStreamTrack} track 解放するトラック
 */
export function releaseTorchTrack(track) {
  track.stop();
}

/**
 * @param {MediaTrackConstraints} video 映像の制約
 * @returns {Promise<MediaStreamTrack>} 映像トラック
 */
async function openVideoTrack(video) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video,
    audio: false,
  });
  return stream.getVideoTracks()[0];
}

/**
 * @param {MediaStreamTrack} track 映像トラック
 * @returns {boolean} トーチを持つなら true
 */
function hasTorch(track) {
  const capabilities = /** @type {Record<string, unknown>} */ (
    track.getCapabilities?.() ?? {}
  );
  return capabilities.torch === true;
}
