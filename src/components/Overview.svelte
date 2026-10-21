<script>
  import Chart from './Chart.svelte'
  import MuscleWeeks from './MuscleWeeks.svelte'
  import { settings } from '../lib/settings.js'
  import { t } from '../lib/i18n.js'
  import { nameOf } from '../lib/names.js'
  import { recency, weekly, durations, average, setsPerMuscle, restPerSession, streaks, weeksSinceFirst, timeOfDay, STREAK_DAYS } from '../lib/overview.js'

  /** Everything comes in from Progress, which already holds these live queries. */
  let { sets = [], sessions = [], logs = [], exById = {}, groups = [] } = $props()

  const grById = $derived(Object.fromEntries(groups.map(g => [g.id, g])))
  const rows = $derived(recency({ sets, exercisesById: exById, activityLogs: logs }))
  const trained = $derived(rows.filter(r => r.days != null))
  const never = $derived(rows.filter(r => r.days == null))

  const label = key =>
    key === 'cardio' ? $t('cardio')
      : key.startsWith('mu:') ? $t(`mu_${key.slice(3)}`)
        : nameOf(grById[key.slice(6)], $settings.lang) || key.slice(6)
  const ago = d => (d === 0 ? $t('todayLower') : d === 1 ? $t('yesterday') : $t('daysAgo', { d }))

  const weeks = $derived(weekly({ sessions, sets, activityLogs: logs }))
  const perWeek = $derived(weeks.map(w => ({ x: w.start, y: w.sessions })))
  const avgSessions = $derived(average(weeks, 'sessions'))
  const avgDays = $derived(average(weeks, 'days'))
  const lengths = $derived(durations(sessions, logs))
  const recent = $derived(lengths.slice(-10))
  const avgLength = $derived(recent.length ? recent.reduce((a, p) => a + p.y, 0) / recent.length : 0)

  // round 2
  const muscleWeeks = $derived(setsPerMuscle({ sets, exercisesById: exById, weeks: 8 }))
  const muscleStarts = $derived(weekly({ sessions: [], weeks: 8 }).map(w => w.start))
  const volume = $derived(weeks.map(w => ({ x: w.start, y: w.volume })))
  const avgVolume = $derived(average(weeks, 'volume'))
  const cardio = $derived(weeks.map(w => ({ x: w.start, y: w.cardioMin, km: w.cardioKm })))
  const rest = $derived(restPerSession(sessions))
  const allWeeks = $derived(weekly({ sessions, sets, activityLogs: logs, weeks: weeksSinceFirst([...sets, ...logs]) }))
  const streak = $derived(streaks(allWeeks))
  const parts = $derived(timeOfDay([...sets, ...logs]))
  const partsMax = $derived(Math.max(1, ...parts.map(p => p.n)))
  const nf = v => new Intl.NumberFormat($settings.lang).format(Math.round(v))

  const one = v => (Math.round(v * 10) / 10).toLocaleString($settings.lang)
  const weekOf = ms => $t('weekOf', { d: new Intl.DateTimeFormat($settings.lang, { day: 'numeric', month: 'short' }).format(ms) })
  const dayOf = ms => new Intl.DateTimeFormat($settings.lang, { weekday: 'short', day: 'numeric', month: 'short' }).format(ms)
</script>

<section>
  <h2>{$t('sinceLast')}</h2>
  {#if !trained.length}
    <p class="muted">{$t('noData')}</p>
  {:else}
    <ul class="list card recency" data-testid="recency">
      {#each trained as r (r.key)}
        <li class="row {r.status}">
          <span class="mark" aria-hidden="true"></span>
          <span class="grow name">{label(r.key)}</span>
          <span class="ago">{ago(r.days)}</span>
          {#if r.status !== 'ok'}<span class="tag">{$t(`st_${r.status}`)}</span>{/if}
        </li>
      {/each}
    </ul>
    {#if never.length}
      <p class="muted small">{$t('notYet')}: {never.map(r => label(r.key)).join(', ')}</p>
    {/if}
  {/if}
</section>

<section>
  <h2>{$t('sessionsPerWeek')}</h2>
  <p class="small muted" data-testid="avg-sessions">{$t('avgPerWeek', { n: one(avgSessions) })} · {$t('trainingDaysAvg', { n: one(avgDays) })}</p>
  <div class="tiles">
    <div class="tile card" data-testid="streak">
      <div class="big">{streak.current}</div>
      <div class="small">{$t('streakNow')}</div>
    </div>
    <div class="tile card">
      <div class="big">{streak.best}</div>
      <div class="small">{$t('streakBest')}</div>
    </div>
  </div>
  <p class="muted small">{$t('streakRule', { n: STREAK_DAYS })}</p>
  {#if sessions.some(s => s.end)}
    <Chart points={perWeek} kind="bar" step={7} label={$t('sessionsPerWeek')} format={v => `${v} ${$t('sessionsLower')}`} when={weekOf} />
    <details class="table">
      <summary class="small">{$t('showTable')}</summary>
      <table>
        <thead><tr><th>{$t('week')}</th><th>{$t('sessions')}</th><th>{$t('trainingDays')}</th><th>min</th></tr></thead>
        <tbody>{#each [...weeks].reverse() as w (w.start)}<tr><td>{weekOf(w.start)}</td><td>{w.sessions}</td><td>{w.days}</td><td>{w.minutes}</td></tr>{/each}</tbody>
      </table>
    </details>
  {:else}
    <p class="muted">{$t('noData')}</p>
  {/if}
</section>

<section>
  <h2>{$t('sessionLength')}</h2>
  {#if lengths.length}
    <p class="small muted" data-testid="avg-length">{$t('avgLength', { n: Math.round(avgLength), k: recent.length })}</p>
    <Chart points={lengths} label={$t('sessionLength')} format={v => `${v} min`} when={dayOf} />
    <details class="table">
      <summary class="small">{$t('showTable')}</summary>
      <table>
        <thead><tr><th>{$t('day')}</th><th>min</th></tr></thead>
        <tbody>{#each [...lengths].reverse().slice(0, 30) as p (p.x)}<tr><td>{dayOf(p.x)}</td><td>{p.y}</td></tr>{/each}</tbody>
      </table>
    </details>
  {:else}
    <p class="muted">{$t('noData')}</p>
  {/if}
</section>

<section>
  <h2>{$t('setsPerMuscle')}</h2>
  {#if muscleWeeks.length}
    <p class="small muted">{$t('setsPerMuscleHint')}</p>
    <MuscleWeeks items={muscleWeeks.map(m => ({ ...m, label: label(m.key) }))} starts={muscleStarts} weekLabel={weekOf} />
    <details class="table">
      <summary class="small">{$t('showTable')}</summary>
      <table>
        <thead><tr><th></th>{#each muscleStarts as w}<th>{new Date(w).getDate()}/{new Date(w).getMonth() + 1}</th>{/each}</tr></thead>
        <tbody>{#each muscleWeeks as m (m.key)}<tr><td>{label(m.key)}</td>{#each m.counts as n}<td>{one(n)}</td>{/each}</tr>{/each}</tbody>
      </table>
    </details>
  {:else}
    <p class="muted">{$t('noData')}</p>
  {/if}
</section>

<section>
  <h2>{$t('weeklyVolume')}</h2>
  {#if weeks.some(w => w.volume)}
    <p class="small muted" data-testid="avg-volume">{$t('avgVolume', { n: nf(avgVolume) })}</p>
    <Chart points={volume} kind="bar" step={7} label={$t('weeklyVolume')} format={v => `${nf(v)} kg`} when={weekOf} />
  {:else}
    <p class="muted">{$t('noData')}</p>
  {/if}
</section>

<section>
  <h2>{$t('weeklyCardio')}</h2>
  {#if weeks.some(w => w.cardioMin || w.cardioKm)}
    <Chart points={cardio} kind="bar" step={7} label={$t('weeklyCardio')}
      format={(v, p) => `${v} min · ${one(p.km ?? 0)} km`} when={weekOf} />
    <details class="table">
      <summary class="small">{$t('showTable')}</summary>
      <table>
        <thead><tr><th>{$t('week')}</th><th>min</th><th>km</th></tr></thead>
        <tbody>{#each [...weeks].reverse() as w (w.start)}<tr><td>{weekOf(w.start)}</td><td>{w.cardioMin}</td><td>{one(w.cardioKm)}</td></tr>{/each}</tbody>
      </table>
    </details>
  {:else}
    <p class="muted">{$t('noData')}</p>
  {/if}
</section>

<section>
  <h2>{$t('restPerSession')}</h2>
  {#if rest.length}
    <Chart points={rest} label={$t('restPerSession')} format={v => `${one(v)} min`} when={dayOf} />
  {:else}
    <p class="muted">{$t('noData')}</p>
  {/if}
</section>

<section>
  <h2>{$t('timeOfDay')}</h2>
  {#if parts.some(p => p.n)}
    <ul class="list parts" data-testid="time-of-day">
      {#each parts as p (p.key)}
        <li>
          <span class="pname">{$t(`tod_${p.key}`)} <span class="muted hours">{({ morning: '5–12', afternoon: '12–17', evening: '17–22', night: '22–5' })[p.key]}</span></span>
          <span class="bar"><span style="width: {(p.n / partsMax) * 100}%"></span></span>
          <span class="pn">{p.n}</span>
        </li>
      {/each}
    </ul>
    <p class="muted small">{$t('timeOfDayHint')}</p>
  {:else}
    <p class="muted">{$t('noData')}</p>
  {/if}
</section>

<style>
  .recency li { padding: 10px 12px; gap: 10px; }
  .mark { width: 12px; height: 12px; border-radius: 50%; flex: none; background: var(--ok); }
  .due .mark { background: transparent; border: 3px solid var(--warn); }
  .stale .mark { background: var(--danger); }
  .name { font-weight: 700; }
  .ago { font-variant-numeric: tabular-nums; color: var(--muted); }
  .tag { font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 999px; border: 1px solid currentColor; }
  .due .tag { color: var(--warn); }
  .stale .tag { color: var(--danger); }
  .table { margin-top: 8px; }
  .tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0 4px; }
  .tile { padding: 10px 12px; }
  .big { font-size: 30px; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1.1; }
  .parts li { display: grid; grid-template-columns: 10.5em 1fr 2.5em; align-items: center; gap: 10px; padding: 6px 0; border: 0; }
  .pname { font-size: 14px; }
  .hours { font-size: 12px; }
  .bar { height: 12px; background: var(--soft); border-radius: 6px; overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--accent); border-radius: 6px; }
  .pn { text-align: right; font-variant-numeric: tabular-nums; color: var(--muted); }
  details table { display: block; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 14px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid var(--line); }
  th { color: var(--muted); font-weight: 400; }
  td:not(:first-child), th:not(:first-child) { text-align: right; }
</style>
