<script>
  import Sheet from './Sheet.svelte'
  import RecapSheet from './RecapSheet.svelte'
  import { notify, now } from '../lib/store.js'
  import { settings } from '../lib/settings.js'
  import { t } from '../lib/i18n.js'
  import { backupNow, daysSince } from '../lib/backup.js'
  import { shareSession, uploadSession, driveReady } from '../lib/sessionFiles.js'

  let { session, onclose } = $props()
  let recap = $state(false)
  const days = $derived(daysSince($settings.lastBackup, $now))
  const backupText = $derived(days == null ? $t('never') : days === 0 ? $t('todayLower') : $t('daysAgo', { d: days }))

  const copy = async () => {
    try { await navigator.clipboard.writeText(session.summary); notify($t('copied')) } catch {}
  }
</script>

<Sheet title={$t('summary')} {onclose}>
  <pre class="summary card" data-testid="summary">{session.summary}</pre>
  <div class="grid">
    <button class="primary" onclick={() => (recap = true)}>{$t('shareImage')}</button>
    <button onclick={backupNow}>{$t('backupNow')}</button>
    <button onclick={() => shareSession(session.id)}>{$t('exportSession')}</button>
    {#if driveReady()}<button onclick={() => uploadSession(session.id)}>{$t('uploadDrive')}</button>{/if}
    <button onclick={copy}>{$t('copy')}</button>
    <button onclick={onclose}>{$t('close')}</button>
  </div>
  <div class="muted small backup" class:warn={days == null || days >= 7}>{$t('lastBackup')}: {backupText}</div>
</Sheet>
{#if recap}<RecapSheet {session} onclose={() => (recap = false)} />{/if}

<style>
  pre { padding: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  .backup { margin-top: 8px; text-align: center; }
  .warn { color: var(--danger); }
</style>
