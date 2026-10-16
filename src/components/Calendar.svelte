<script>
  import Icon from './Icon.svelte'
  import { settings } from '../lib/settings.js'
  import { t } from '../lib/i18n.js'
  import { monthGrid, weekdays } from '../lib/calendar.js'
  import { dateKey } from '../lib/time.js'

  /** sessionDays / otherDays: Sets of 'YYYY-MM-DD'. */
  let { sessionDays, otherDays, selected = null, onselect } = $props()

  const today = dateKey()
  const now = new Date()
  let year = $state(now.getFullYear())
  let month = $state(now.getMonth())

  const weeks = $derived(monthGrid(year, month))
  // first letter only: CSS capitalize would give "Octubre De 2026"
  const title = $derived(new Intl.DateTimeFormat($settings.lang, { month: 'long', year: 'numeric' }).format(new Date(year, month, 1)).replace(/^./, c => c.toUpperCase()))
  const prefix = $derived(`${year}-${String(month + 1).padStart(2, '0')}-`)
  const count = $derived([...sessionDays].filter(d => d.startsWith(prefix)).length)

  const shift = d => {
    const x = new Date(year, month + d, 1)
    year = x.getFullYear()
    month = x.getMonth()
  }
</script>

<div class="cal">
  <div class="head row">
    <button class="icon ghost" aria-label="‹" onclick={() => shift(-1)}><Icon name="back" /></button>
    <div class="grow center">
      <div class="month" aria-live="polite">{title}</div>
      <div class="muted small" data-testid="cal-count">{count} {$t('sessionsLower')}</div>
    </div>
    <button class="icon ghost" aria-label="›" onclick={() => shift(1)}><Icon name="right" /></button>
  </div>
  <div class="grid" role="grid" aria-label={title}>
    {#each weekdays($settings.lang) as w}<div class="wd" role="columnheader">{w}</div>{/each}
    {#each weeks as week}
      {#each week as c (c.date)}
        <button role="gridcell" class="day" data-date={c.date}
          class:out={!c.inMonth} class:session={sessionDays.has(c.date)} class:other={!sessionDays.has(c.date) && otherDays.has(c.date)}
          class:today={c.date === today} aria-selected={selected === c.date}
          aria-label="{c.date}{sessionDays.has(c.date) ? ` · ${$t('session')}` : ''}"
          onclick={() => onselect(c.date)}>{c.day}</button>
      {/each}
    {/each}
  </div>
</div>

<style>
  .head { margin: 12px 0 8px; }
  .center { text-align: center; }
  .month { font-weight: 700; font-size: 17px; }
  .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  .wd { text-align: center; font-size: 12px; color: var(--muted); padding-bottom: 2px; }
  .day {
    aspect-ratio: 1; min-height: 0; padding: 0; border-radius: 8px; border: 1px solid transparent;
    background: transparent; font-variant-numeric: tabular-nums; font-size: 15px;
  }
  .day.out { color: var(--muted); opacity: .45; }
  .day.session { background: var(--cal-day); color: #ffffff; font-weight: 700; }
  .day.other { border-color: var(--cal-day); }
  .day.today:not(.session) { border-color: var(--fg); font-weight: 700; }
  .day.today.session { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--fg); }
  .day[aria-selected='true'] { outline: 2px solid var(--fg); outline-offset: 2px; }
</style>
