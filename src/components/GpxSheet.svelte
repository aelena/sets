<script>
  import { get } from 'svelte/store'
  import { liveQuery } from 'dexie'
  import Sheet from './Sheet.svelte'
  import Route from './Route.svelte'
  import { repo, activities, notify, shownSummary } from '../lib/store.js'
  import { t, summaryWords } from '../lib/i18n.js'
  import { settings } from '../lib/settings.js'
  import { nameOf } from '../lib/names.js'
  import { dateKey, hhmm } from '../lib/time.js'
  import { formatPace } from '../lib/activity.js'

  /** A parsed GPX run (parseGpx) waiting to be logged: which activity, notes, and whether it joins the day's timed session. */
  let { run, fileName = '', onclose } = $props()

  const OTHER = '__other'
  let activityId = $state('running')
  let name = $state('')
  let notes = $state('')
  let join = $state(true)
  let error = $state('')
  let target = $state(null) // the finished timed session of the run's day, if any

  const day = $derived(run.start != null ? dateKey(run.start) : dateKey())
  $effect(() => {
    const d = day
    const sub = liveQuery(() => repo.timedSessionOn(d)).subscribe(v => (target = v))
    return () => sub.unsubscribe()
  })
  $effect(() => {
    const list = $activities ?? []
    if (list.length && !list.some(a => a.id === activityId && !a.archived)) activityId = list.find(a => !a.archived)?.id ?? OTHER
  })

  const when = $derived(run.start != null
    ? `${new Intl.DateTimeFormat($settings.lang, { weekday: 'short', day: 'numeric', month: 'short' }).format(run.start)} · ${hhmm(run.start)}${run.end ? ` → ${hhmm(run.end)}` : ''}`
    : '')
  const mins = v => (v == null ? '—' : v >= 60 ? `${Math.floor(v / 60)}h ${String(Math.round(v % 60)).padStart(2, '0')}m` : `${Math.round(v)} min`)
  const pace = $derived(run.minutes && run.km ? `${formatPace(run.minutes / run.km)}/km` : '—')

  async function submit(e) {
    e.preventDefault()
    error = ''
    const other = activityId === OTHER
    if (other && !name.trim()) return
    try {
      const activity = other ? await repo.ensureActivity(name) : ($activities ?? []).find(a => a.id === activityId)
      const id = await repo.importGpx($state.snapshot(run), { activityId: activity.id, notes }) // a plain object: IndexedDB cannot clone a state proxy
      if (join && target) {
        const updated = await repo.bundleLoose(target.id, summaryWords(get(t)))
        if (updated) shownSummary.set(updated)
      }
      notify(`${$t('runImported')} · ${nameOf(activity, $settings.lang)} ${run.km} km`, { label: $t('undo'), run: () => repo.deleteActivityLog(id) })
      onclose()
    } catch (err) {
      error = $t(err.message === 'gpxDuplicate' ? 'gpxDuplicate' : 'gpxBad')
    }
  }
</script>

<Sheet title={$t('importRun')} {onclose}>
  <form class="stack" onsubmit={submit}>
    <div class="head">
      <strong class="name">{run.name || fileName}</strong>
      {#if when}<span class="muted small" data-testid="gpx-when">{when}</span>{/if}
    </div>
    <Route track={run.track} />
    <div class="stats" data-testid="gpx-stats">
      <div><b>{run.km}</b><span>km</span></div>
      <div><b>{mins(run.minutes)}</b><span>{$t('moving')}</span></div>
      <div><b>{pace}</b><span>{$t('pace').replace(/ \(.*\)/, '')}</span></div>
      <div><b>↑{run.ascent} m</b><span>{$t('ascent')}</span></div>
    </div>
    {#if run.elapsedMinutes != null && run.elapsedMinutes !== run.minutes}
      <div class="muted small center">{$t('elapsed')}: {mins(run.elapsedMinutes)}</div>
    {/if}
    <label>{$t('logAs')}
      <select bind:value={activityId}>
        {#each ($activities ?? []).filter(a => !a.archived) as a (a.id)}<option value={a.id}>{nameOf(a, $settings.lang)}</option>{/each}
        <option value={OTHER}>{$t('otherActivity')}</option>
      </select>
    </label>
    {#if activityId === OTHER}
      <label>{$t('activityName')}<input bind:value={name} required placeholder="Hike, Bike…" /></label>
    {/if}
    <label>{$t('activityNotes')}<input bind:value={notes} /></label>
    {#if target}
      <label class="check"><input type="checkbox" bind:checked={join} />{$t('joinSession', { when: `${hhmm(target.start)} → ${hhmm(target.end)}` })}</label>
    {/if}
    <div class="muted small">{$t('gpxHint')}</div>
    {#if error}<div class="err" role="alert">{error}</div>{/if}
    <button type="submit" class="primary">{$t('importRun')}</button>
  </form>
</Sheet>

<style>
  .head { display: grid; gap: 2px; }
  .name { font-size: 17px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center; font-variant-numeric: tabular-nums; }
  .stats div { display: grid; gap: 2px; }
  .stats b { font-size: 20px; }
  .stats span { font-size: 12px; color: var(--muted); }
  .center { text-align: center; }
  select { font-size: 17px; }
  .check { display: flex; align-items: center; gap: 8px; color: var(--fg); font-size: 15px; }
  .check input { width: 22px; min-height: 22px; }
  .err { color: var(--danger); }
  button[type='submit'] { min-height: 56px; font-size: 17px; }
</style>
