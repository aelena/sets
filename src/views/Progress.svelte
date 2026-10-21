<script>
  import { liveQuery } from 'dexie'
  import { db, exercises, groups } from '../lib/store.js'
  import { dailyActivity, formatPace, activityLabel } from '../lib/activity.js'
  import { t } from '../lib/i18n.js'
  import { settings } from '../lib/settings.js'
  import { daily, metricsFor } from '../lib/metrics.js'
  import { dateKey, duration, hhmm } from '../lib/time.js'
  import Chart from '../components/Chart.svelte'
  import RecapSheet from '../components/RecapSheet.svelte'
  import Calendar from '../components/Calendar.svelte'
  import Overview from '../components/Overview.svelte'
  import { nameOf, nameById } from '../lib/names.js'
  import { trainingTime } from '../lib/summary.js'

  let seg = $state('overview')
  let exId = $state(null)
  let metric = $state(null)
  let recapFor = $state(null)
  let picked = $state(null) // day selected in the calendar

  const sets = liveQuery(() => db.sets.toArray())
  const sessions = liveQuery(() => db.sessions.orderBy('start').reverse().toArray())
  const notes = liveQuery(() => db.notes.toArray())
  const logs = liveQuery(() => db.activityLogs.toArray())
  const allActivities = liveQuery(() => db.activities.toArray())

  const exById = $derived(Object.fromEntries(($exercises ?? []).map(e => [e.id, e])))
  const acById = $derived(Object.fromEntries(($allActivities ?? []).map(a => [a.id, a])))
  // exercises and activities with anything logged, one picker; keys are prefixed so ids cannot collide
  const withData = $derived([
    ...[...new Set(($sets ?? []).map(s => s.exerciseId))].map(id => exById[id]).filter(Boolean).map(e => ({ key: `e:${e.id}`, name: nameOf(e, $settings.lang), exercise: e })),
    ...[...new Set(($logs ?? []).map(l => l.activityId))].map(id => acById[id]).filter(Boolean).map(a => ({ key: `a:${a.id}`, name: nameOf(a, $settings.lang), activity: a })),
  ].sort((a, b) => a.name.localeCompare(b.name)))
  const ex = $derived(withData.find(e => e.key === exId) ?? withData[0])
  const mine = $derived(ex?.exercise ? ($sets ?? []).filter(s => s.exerciseId === ex.exercise.id) : ($logs ?? []).filter(l => l.activityId === ex?.activity?.id))
  const options = $derived(ex?.exercise ? metricsFor(ex.exercise, mine) : mine.some(l => l.km) ? ['minutes', 'km', 'pace'] : ['minutes'])
  const m = $derived(options.includes(metric) ? metric : options[0])
  const days = $derived(ex?.exercise ? daily(mine) : dailyActivity(mine))
  const midnight = d => { const [y, mo, da] = d.split('-').map(Number); return new Date(y, mo - 1, da).getTime() }
  const points = $derived(days.filter(d => d[m] != null).map(d => ({ x: midnight(d.date), y: d[m] })))
  const unit = { volume: ' kg', maxKg: ' kg', seconds: 's', reps: '', sets: '', minutes: ' min', km: ' km' }
  const fmt = v => (m === 'pace' ? (v ? `${formatPace(v)}/km` : '') : `${Math.round(v * 10) / 10}${unit[m] ?? ''}`)

  /** Every day with anything on it, newest first. */
  const allDays = $derived.by(() => {
    const byDate = new Map()
    const day = d => byDate.get(d) ?? byDate.set(d, { date: d, sets: [], sessions: [], notes: [], logs: [] }).get(d)
    ;($sets ?? []).forEach(s => day(s.date).sets.push(s))
    ;($sessions ?? []).forEach(s => day(dateKey(s.start)).sessions.push(s))
    ;($notes ?? []).forEach(n => day(n.date).notes.push(n))
    ;($logs ?? []).forEach(l => day(l.date).logs.push(l))
    return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date)).map(d => {
      const counts = new Map()
      d.sets.forEach(s => counts.set(s.exerciseId, (counts.get(s.exerciseId) ?? 0) + 1))
      return { ...d, counts: [...counts].map(([id, n]) => `${nameById(exById, id, $settings.lang)} ×${n}`)
        .concat(d.logs.sort((a, b) => a.ts - b.ts).map(l => `${nameById(acById, l.activityId, $settings.lang)} ${activityLabel(l)}`)) }
    })
  })
  const history = $derived(allDays.slice(0, 90))
  const sessionDays = $derived(new Set(($sessions ?? []).filter(s => s.end).map(s => dateKey(s.start))))
  const otherDays = $derived(new Set(allDays.filter(d => d.sets.length || d.logs.length).map(d => d.date)))
  const pickedDay = $derived(allDays.find(d => d.date === picked))
  const longDate = d => new Intl.DateTimeFormat($settings.lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(midnight(d))
</script>

{#snippet dayCard(d)}
  <section class="day">
    <h2>{longDate(d.date)}</h2>
    <div class="card stack inner">
      {#each d.sessions as s (s.id)}
        <details>
          <summary>{s.untimed ? $t('untimedSession') : `${$t('session')} ${hhmm(s.start)}${s.end ? ` · ${duration(trainingTime(s, $logs ?? []).ms)}` : ` · ${$t('running')}`}`}</summary>
          {#if s.summary}<pre class="summary">{s.summary}</pre>{/if}
          {#if s.end}<button class="share" onclick={() => (recapFor = s)}>{$t('shareImage')}</button>{/if}
        </details>
      {/each}
      {#if d.counts.length}<div class="small">{d.counts.join(' · ')}</div>{/if}
      {#each d.notes as n (n.id)}<blockquote>{hhmm(n.ts)} · {n.text}</blockquote>{/each}
    </div>
  </section>
{/snippet}

<main class="view">
  <h1 class="page-title">{$t('progress')}</h1>
  <div class="segmented tabs">
    <button aria-pressed={seg === 'overview'} onclick={() => (seg = 'overview')}>{$t('overview')}</button>
    <button aria-pressed={seg === 'charts'} onclick={() => (seg = 'charts')}>{$t('charts')}</button>
    <button aria-pressed={seg === 'calendar'} onclick={() => (seg = 'calendar')}>{$t('calendar')}</button>
    <button aria-pressed={seg === 'history'} onclick={() => (seg = 'history')}>{$t('history')}</button>
  </div>

  {#if seg === 'overview'}
    <Overview sets={$sets ?? []} sessions={$sessions ?? []} logs={$logs ?? []} {exById} groups={$groups ?? []} />
  {:else if seg === 'charts'}
    {#if !ex}
      <p class="muted">{$t('noData')}</p>
    {:else}
      <div class="stack controls">
        <label>{$t('exercise')}
          <select value={ex.key} onchange={e => (exId = e.currentTarget.value)}>
            {#each withData as e (e.key)}<option value={e.key}>{e.name}</option>{/each}
          </select>
        </label>
        <div class="segmented" role="group" aria-label={$t('metric')}>
          {#each options as o}<button aria-pressed={o === m} onclick={() => (metric = o)}>{$t(`ms_${o}`)}</button>{/each}
        </div>
      </div>
      <h2>{ex.name} · {$t(`m_${m}`)}</h2>
      {#key `${ex.key}|${m}`}<Chart {points} label={$t(`m_${m}`)} format={fmt} />{/key}
      <table>
        <thead><tr><th>{$t('day')}</th><th>{ex.exercise ? $t('m_sets') : $t('entries')}</th><th>{$t(`m_${m}`)}</th></tr></thead>
        <tbody>
          {#each [...days].reverse().slice(0, 30) as d (d.date)}
            <tr><td>{d.date}</td><td>{d.sets ?? d.entries}</td><td>{fmt(d[m] ?? 0)}</td></tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {:else if seg === 'calendar'}
    <Calendar {sessionDays} {otherDays} selected={picked} onselect={d => (picked = picked === d ? null : d)} />
    {#if pickedDay}{@render dayCard(pickedDay)}{:else if picked}<p class="muted">{$t('noData')}</p>{/if}
  {:else}
    {#if !history.length}<p class="muted">{$t('noData')}</p>{/if}
    {#each history as d (d.date)}
      {@render dayCard(d)}
    {/each}
  {/if}
</main>
{#if recapFor}<RecapSheet session={recapFor} onclose={() => (recapFor = null)} />{/if}

<style>
  /* four segments must fit a 375pt-wide phone */
  .tabs button { min-width: 0; padding: 0 4px; font-size: 13px; }
  .controls { margin-top: 12px; }
  .controls .segmented button { font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid var(--line); }
  th { color: var(--muted); font-weight: 400; }
  td:not(:first-child), th:not(:first-child) { text-align: right; }
  .inner { padding: 12px; gap: 8px; }
  summary { cursor: pointer; font-weight: 700; }
  details pre { margin-top: 8px; color: var(--muted); }
  .share { margin-top: 8px; width: 100%; }
  blockquote { margin: 0; padding-left: 10px; border-left: 3px solid var(--line); white-space: pre-wrap; font-size: 14px; }
</style>
