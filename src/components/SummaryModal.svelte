<script>
  import Sheet from './Sheet.svelte'
  import RecapSheet from './RecapSheet.svelte'
  import { notify, now, repo, shownSummary } from '../lib/store.js'
  import { get } from 'svelte/store'
  import { summaryWords } from '../lib/i18n.js'
  import { nameById } from '../lib/names.js'
  import { activityLabel } from '../lib/activity.js'
  import { onMount } from 'svelte'
  import { db } from '../lib/store.js'
  import { settings } from '../lib/settings.js'
  import { t } from '../lib/i18n.js'
  import { backupNow, daysSince } from '../lib/backup.js'
  import { shareSession, uploadSession, driveReady } from '../lib/sessionFiles.js'

  let { session, onclose } = $props()
  let recap = $state(false)

  // a timed session that just ended: anything logged outside it the same day can join it
  let loose = $state(null)
  let dismissed = $state(false)
  onMount(async () => {
    if (session.untimed) return
    const l = await repo.looseOnDayOf(session.id)
    if (!l.sets.length && !l.activityLogs.length) return
    const [ex, ac] = await Promise.all([db.exercises.toArray(), db.activities.toArray()])
    const exById = Object.fromEntries(ex.map(e => [e.id, e])), acById = Object.fromEntries(ac.map(a => [a.id, a]))
    const lang = get(settings).lang
    loose = {
      count: l.sets.length + l.activityLogs.length,
      items: [
        ...l.activityLogs.map(a => `${nameById(acById, a.activityId, lang)} ${activityLabel(a)}`),
        ...(l.sets.length ? [get(t)('looseSets', { n: l.sets.length, names: [...new Set(l.sets.map(s => nameById(exById, s.exerciseId, lang)))].join(', ') })] : []),
      ],
    }
  })
  async function bundle() {
    const updated = await repo.bundleLoose(session.id, summaryWords(get(t)))
    if (updated) shownSummary.set(updated)
    loose = null
    notify(get(t)('bundled'))
  }
  const days = $derived(daysSince($settings.lastBackup, $now))
  const backupText = $derived(days == null ? $t('never') : days === 0 ? $t('todayLower') : $t('daysAgo', { d: days }))

  const copy = async () => {
    try { await navigator.clipboard.writeText(session.summary); notify($t('copied')) } catch {}
  }
</script>

<Sheet title={$t('summary')} {onclose}>
  {#if loose && !dismissed}
    <div class="bundle card stack" data-testid="bundle">
      <div class="small"><strong>{$t('bundleTitle')}</strong></div>
      <ul class="small">{#each loose.items as item}<li>{item}</li>{/each}</ul>
      <div class="row">
        <button class="grow" onclick={() => (dismissed = true)}>{$t('keepSeparate')}</button>
        <button class="primary grow" onclick={bundle}>{$t('bundleAdd')}</button>
      </div>
    </div>
  {/if}
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
  .bundle { padding: 12px; margin-bottom: 12px; border-color: var(--accent); gap: 8px; }
  .bundle ul { margin: 0; padding-left: 18px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  .backup { margin-top: 8px; text-align: center; }
  .warn { color: var(--danger); }
</style>
