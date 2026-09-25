# 設計書

## 変更の概要

| 対象 | 変更 |
|------|------|
| `ui/messages.js` | `cycleLabel` を「メッセージの長さ」に。`shareFailed` を「QRコードの中身」への案内に。QRコードの中身の説明文(`QR_INFO`)を追加。`backToCreate`(パターンの作成に戻る)を追加 |
| `ui/qr-info-dialog.js`(追加) | 「QRコードの中身」の小さなウインドウ。`<dialog>` と `showModal()` を使う(iOS 15.4以降のSafariが対応) |
| `ui/create-screen.js` | URLの表示(`urlText`)を削除。「QRコードの中身」ボタンを追加し、押したときに現在の設定でウインドウを開く |
| `ui/join-screen.js` | 参加前の画面から1拍の長さを削除。一時停止の画面に「パターンの作成に戻る」(`navigate.toCreate(config)`)を追加 |
| `public/css/style.css` | ウインドウ・説明の表のスタイル、`share-url`(作成画面)の不要なスタイルの整理 |

## qr-info-dialog.js

```javascript
/**
 * @param {HTMLElement} parent 追加先
 * @param {string} url 共有URL(toShareUrl の結果)
 * @returns {() => void} 取り除く関数
 */
export function showQrInfoDialog(parent, url)
```

- URLの `#` より後ろを `&` と `=` で分け、キーごとに「記号=値」と説明を並べる(値はURLに入っている形のまま表示する。`m` の空白は `%20` と表示されるので、その旨も説明する)
- 説明文はすべて `messages.js` の `QR_INFO` に置く
- 閉じると `<dialog>` を DOM から取り除く。`close` イベント(Escキー)でも取り除く
- 文字列はすべて `textContent` で設定する

### 説明の方針(コンピュータに詳しくない人向け)

- `#` より前は「このページの住所」、後ろは「光らせ方の設定」
- 設定は「記号=値」を `&` でつないだもので、記号は1文字にしてQRコードを読み取りやすくしている
- 各記号の意味を日常の言葉で書く(ミリ秒は「1000分の1秒」と補足)
- `#` より後ろはインターネットに送られず、スマホの中だけで読み取ることを書く

## 参加画面の一時停止

- `pausedPanel` に `button`(`MESSAGES.backToCreate`)を追加。`click` で `event.stopPropagation()` してから `navigate.toCreate(config)`
- 画面の切替時に既存のアンマウント関数が Wake Lock・全画面・Player・フラッシュを解放する(追加の処理は不要)

## テスト戦略

- `core/` の変更はないため、ユニットテストは既存のまま
- ヘッドレスブラウザで受け入れ条件を確認(幅320px、コンソールエラーなし、CSP違反なし)
