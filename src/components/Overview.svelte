<script>
  import Chart from './Chart.svelte'
  import { settings } from '../lib/settings.js'
  import { t } from '../lib/i18n.js'
  import { nameOf } from '../lib/names.js'
  import { recency, weekly, durations, average } from '../lib/overview.js'

  /** Everything comes in from Progress, which already holds these live queries. */
  let { sets = [], sessions = [], logs = [], exById = {}, groups = [] } = $props()

  const grById = $derived(Object.fromEntries(groups.map(g => [g.id, g])))
  const rows = $derived(recency({ sets, exercisesById: exById, activityLogs: logs }))
  const trained = $derived(rows.filter(r => r.days != null))
  const never = $derived(rows.filter(r => r.days == null))

  const label = key =>
    key === 'cardio' ? $t('activitiesTab')
      : key.startsWith('mu:') ? $t(`mu_${key.slice(3)}`)
        : nameOf(grById[key.slice(6)], $settings.lang) || key.slice(6)
  const ago = d => (d === 0 ? $t('todayLower') : d === 1 ? $t('yesterday') : $t('daysAgo', { d }))

  const weeks = $derived(weekly({ sessions, sets, activityLogs: logs }))
  const perWeek = $derived(weeks.map(w => ({ x: w.start, y: w.sessions })))
  const avgSessions = $derived(average(weeks, 'sessions'))
  const avgDays = $derived(average(weeks, 'days'))
  const lengths = $derived(durations(sessions))
  const recent = $derived(lengths.slice(-10))
  const avgLength = $derived(recent.length ? recent.reduce((a, p) => a + p.y, 0) / recent.length : 0)

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
  table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 14px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid var(--line); }
  th { color: var(--muted); font-weight: 400; }
  td:not(:first-child), th:not(:first-child) { text-align: right; }
</style>
