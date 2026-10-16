<script>
  import { liveQuery } from 'dexie'
  import { db, exercises } from '../lib/store.js'
  import { t } from '../lib/i18n.js'
  import { settings } from '../lib/settings.js'
  import { daily, metricsFor } from '../lib/metrics.js'
  import { dateKey, duration, hhmm } from '../lib/time.js'
  import Chart from '../components/Chart.svelte'

  let seg = $state('charts')
  let exId = $state(null)
  let metric = $state(null)

  const sets = liveQuery(() => db.sets.toArray())
  const sessions = liveQuery(() => db.sessions.orderBy('start').reverse().toArray())
  const notes = liveQuery(() => db.notes.toArray())

  const exById = $derived(Object.fromEntries(($exercises ?? []).map(e => [e.id, e])))
  const withData = $derived([...new Set(($sets ?? []).map(s => s.exerciseId))].map(id => exById[id]).filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name)))
  const ex = $derived(withData.find(e => e.id === exId) ?? withData[0])
  const mine = $derived(($sets ?? []).filter(s => s.exerciseId === ex?.id))
  const options = $derived(metricsFor(ex, mine))
  const m = $derived(options.includes(metric) ? metric : options[0])
  const days = $derived(daily(mine))
  const midnight = d => { const [y, mo, da] = d.split('-').map(Number); return new Date(y, mo - 1, da).getTime() }
  const points = $derived(days.map(d => ({ x: midnight(d.date), y: d[m] ?? 0 })))
  const unit = { volume: ' kg', maxKg: ' kg', seconds: 's', reps: '', sets: '' }
  const fmt = v => `${Math.round(v * 10) / 10}${unit[m] ?? ''}`

  /** History: one entry per day with anything on it, newest first. */
  const history = $derived.by(() => {
    const byDate = new Map()
    const day = d => byDate.get(d) ?? byDate.set(d, { date: d, sets: [], sessions: [], notes: [] }).get(d)
    ;($sets ?? []).forEach(s => day(s.date).sets.push(s))
    ;($sessions ?? []).forEach(s => day(dateKey(s.start)).sessions.push(s))
    ;($notes ?? []).forEach(n => day(n.date).notes.push(n))
    return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 90).map(d => {
      const counts = new Map()
      d.sets.forEach(s => counts.set(s.exerciseId, (counts.get(s.exerciseId) ?? 0) + 1))
      return { ...d, counts: [...counts].map(([id, n]) => `${exById[id]?.name ?? id} ×${n}`) }
    })
  })
  const longDate = d => new Intl.DateTimeFormat($settings.lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(midnight(d))
</script>

<main class="view">
  <h1 class="page-title">{$t('progress')}</h1>
  <div class="segmented">
    <button aria-pressed={seg === 'charts'} onclick={() => (seg = 'charts')}>{$t('charts')}</button>
    <button aria-pressed={seg === 'history'} onclick={() => (seg = 'history')}>{$t('history')}</button>
  </div>

  {#if seg === 'charts'}
    {#if !ex}
      <p class="muted">{$t('noData')}</p>
    {:else}
      <div class="stack controls">
        <label>{$t('exercise')}
          <select value={ex.id} onchange={e => (exId = e.currentTarget.value)}>
            {#each withData as e (e.id)}<option value={e.id}>{e.name}</option>{/each}
          </select>
        </label>
        <div class="segmented" role="group" aria-label={$t('metric')}>
          {#each options as o}<button aria-pressed={o === m} onclick={() => (metric = o)}>{$t(`ms_${o}`)}</button>{/each}
        </div>
      </div>
      <h2>{ex.name} · {$t(`m_${m}`)}</h2>
      {#key `${ex.id}|${m}`}<Chart {points} label={$t(`m_${m}`)} format={fmt} />{/key}
      <table>
        <thead><tr><th>{$t('day')}</th><th>{$t('m_sets')}</th><th>{$t(`m_${m}`)}</th></tr></thead>
        <tbody>
          {#each [...days].reverse().slice(0, 30) as d (d.date)}
            <tr><td>{d.date}</td><td>{d.sets}</td><td>{fmt(d[m] ?? 0)}</td></tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {:else}
    {#if !history.length}<p class="muted">{$t('noData')}</p>{/if}
    {#each history as d (d.date)}
      <section class="day">
        <h2>{longDate(d.date)}</h2>
        <div class="card stack inner">
          {#each d.sessions as s (s.id)}
            <details>
              <summary>{$t('session')} {hhmm(s.start)}{s.end ? ` · ${duration(s.end - s.start)}` : ` · ${$t('running')}`}</summary>
              {#if s.summary}<pre class="summary">{s.summary}</pre>{/if}
            </details>
          {/each}
          {#if d.counts.length}<div class="small">{d.counts.join(' · ')}</div>{/if}
          {#each d.notes as n (n.id)}<blockquote>{hhmm(n.ts)} · {n.text}</blockquote>{/each}
        </div>
      </section>
    {/each}
  {/if}
</main>

<style>
  .controls { margin-top: 12px; }
  .controls .segmented button { font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid var(--line); }
  th { color: var(--muted); font-weight: 400; }
  td:not(:first-child), th:not(:first-child) { text-align: right; }
  .inner { padding: 12px; gap: 8px; }
  summary { cursor: pointer; font-weight: 700; }
  details pre { margin-top: 8px; color: var(--muted); }
  blockquote { margin: 0; padding-left: 10px; border-left: 3px solid var(--line); white-space: pre-wrap; font-size: 14px; }
</style>
