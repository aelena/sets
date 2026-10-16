<script>
  import Sheet from './Sheet.svelte'
  import { notify } from '../lib/store.js'
  import { t } from '../lib/i18n.js'

  let { session, onclose } = $props()
  const copy = async () => {
    try { await navigator.clipboard.writeText(session.summary); notify($t('copied')) } catch {}
  }
</script>

<Sheet title={$t('summary')} {onclose}>
  <pre class="summary card" data-testid="summary">{session.summary}</pre>
  <div class="row actions">
    <button onclick={copy}>{$t('copy')}</button>
    <button class="primary grow" onclick={onclose}>{$t('close')}</button>
  </div>
</Sheet>

<style>
  pre { padding: 12px; }
  .actions { margin-top: 12px; }
</style>
