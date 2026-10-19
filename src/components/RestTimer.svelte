<script>
  import { onMount } from 'svelte'
  import { repo, now, notify, toast } from '../lib/store.js'
  import { t } from '../lib/i18n.js'
  import { clock, duration } from '../lib/time.js'

  let { rest } = $props()

  // the screen stays on through the App-level wake lock (Settings → Keep the screen on)
  onMount(() => toast.set(null))

  async function stop() {
    const r = await repo.stopRest()
    if (r) notify(`${$t('restDone')} ${duration(r.end - r.start)}${r.sessionId ? '' : ` · ${$t('restNoSession')}`}`)
  }
</script>

<div class="rest" role="dialog" aria-modal="true" aria-label={$t('restRunning')}>
  <div class="muted">{$t('restRunning')}</div>
  <div class="clock" data-testid="rest-clock">{clock(Math.max(0, $now - rest.start))}</div>
  <button class="primary stop" onclick={stop}>{$t('stopRest')}</button>
</div>

<style>
  .rest {
    position: fixed; inset: 0; z-index: 30; background: var(--bg);
    display: grid; place-content: center; justify-items: center; gap: 24px; padding: 16px;
  }
  .clock { font-size: min(28vw, 160px); font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; }
  .stop { min-width: 70vw; min-height: 72px; font-size: 20px; }
</style>
