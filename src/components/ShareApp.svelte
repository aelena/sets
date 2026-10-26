<script>
  /** The app's QR code, big enough to scan off the phone, plus the link to send. */
  import Sheet from './Sheet.svelte'
  import { t } from '../lib/i18n.js'
  import { notify } from '../lib/store.js'
  import { deliver } from '../lib/export.js'
  import { QR_URL, QR_LABEL, QR_ROWS, qrPath } from '../lib/qr.js'

  let { onclose } = $props()
  const n = QR_ROWS.length
  const path = qrPath()

  async function shareLink() {
    const data = { title: 'Sets', text: $t('shareText'), url: QR_URL }
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      try { await navigator.share(data); return } catch (e) { if (e.name === 'AbortError') return }
    }
    await copyLink()
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(QR_URL); notify($t('copied')) } catch {}
  }

  /** The QR as a PNG with the address under it, so it can be sent or printed. */
  async function shareImage() {
    const m = 4, cell = 24, w = (n + 2 * m) * cell, h = w + 3 * cell
    const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h })
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#000'
    QR_ROWS.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') ctx.fillRect((m + x) * cell, (m + y) * cell, cell, cell) }))
    ctx.font = `${cell * 1.4}px ui-monospace, Menlo, monospace`
    ctx.textAlign = 'center'
    ctx.fillText(QR_LABEL, w / 2, w + cell * 0.6)
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'))
    await deliver(blob, 'sets-qr.png')
  }
</script>

<Sheet title={$t('shareApp')} {onclose}>
  <div class="stack">
    <div class="muted small">{$t('shareAppHint')}</div>
    <div class="qr card">
      <svg viewBox="0 0 {n} {n}" shape-rendering="crispEdges" role="img" aria-label={QR_URL} data-testid="qr">
        <path d={path} fill="#000" />
      </svg>
    </div>
    <div class="url">{QR_LABEL}</div>
    <div class="grid">
      <button class="primary" onclick={shareLink}>{$t('shareLink')}</button>
      <button onclick={shareImage}>{$t('shareQr')}</button>
      <button onclick={copyLink}>{$t('copyLink')}</button>
      <button onclick={onclose}>{$t('close')}</button>
    </div>
  </div>
</Sheet>

<style>
  .qr { background: #fff; padding: 16px; display: grid; place-items: center; }
  .qr svg { width: min(72vw, 320px); height: auto; display: block; }
  .url { text-align: center; font-size: 20px; font-weight: 700; letter-spacing: .02em; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>
