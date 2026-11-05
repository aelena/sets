<script>
  import { liveQuery } from 'dexie'
  import { repo, exercises, activePlan, now, notify } from '../lib/store.js'
  import { settings } from '../lib/settings.js'
  import { t } from '../lib/i18n.js'
  import { nameOf } from '../lib/names.js'
  import { dateKey } from '../lib/time.js'
  import { weekdays } from '../lib/calendar.js'
  import { deliver, jsonBlob } from '../lib/export.js'
  import { planDay, dayStatus, planProgress, phaseOf, targetLabel, exportPlan, planTemplate, planIcs, endOf, addDays, daysBetween, normalizePlan, WEEKDAYS } from '../lib/plan.js'
  import { db } from '../lib/store.js'
  import PlanStartSheet from '../components/PlanStartSheet.svelte'

  // every stored plan but the running one: reusable, started again with a new date
  const stored = liveQuery(() => db.plans.toArray().then(ps => ps.filter(p => !p.active).sort((a, b) => a.name.localeCompare(b.name))))
  let setup = $state.raw(null) // { mode: 'import' | 'start' | 'edit', name, start, days, json?, id? }

  const plan = $derived($activePlan)
  const exById = $derived(Object.fromEntries(($exercises ?? []).map(e => [e.id, e])))
  const today = $derived(dateKey($now))
  const lang = $derived($settings.lang)
  const fmt = (date, opts) => { const [y, m, d] = date.split('-').map(Number); return new Intl.DateTimeFormat(lang, opts).format(new Date(y, m - 1, d)) }

  // the user's own sets over the plan's dates: what each day is judged by
  let logged = $state(new Map())
  $effect(() => {
    const p = plan
    if (!p) { logged = new Map(); return }
    const sub = liveQuery(() => repo.loggedByDate(p.start, endOf(p))).subscribe(v => (logged = v))
    return () => sub.unsubscribe()
  })

  const progress = $derived(plan ? planProgress(plan, logged, today) : null)
  const todayDay = $derived(plan ? planDay(plan, today) : null)
  const phase = $derived(plan && progress?.day ? phaseOf(plan, progress.day) : null)
  const status = date => dayStatus(plan, date, logged.get(date) ?? new Set(), today)

  // the plan's dates as whole weeks, Monday first
  const weeks = $derived.by(() => {
    if (!plan) return []
    const first = addDays(plan.start, -WEEKDAYS.indexOf(planDay(plan, plan.start).weekday))
    const span = daysBetween(first, endOf(plan)) + 1
    return Array.from({ length: Math.ceil(span / 7) }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(first, w * 7 + i)))
  })
  let selected = $state(null)
  const shown = $derived(plan ? planDay(plan, selected ?? today) : null)
  const shownDate = $derived(selected ?? today)

  let error = $state('')
  const fail = e => (error = $t(e.message) !== e.message ? $t(e.message) : e.message)

  async function choose(e) {
    error = ''
    const file = e.currentTarget.files[0]
    e.currentTarget.value = ''
    if (!file) return
    try {
      const json = JSON.parse(await file.text())
      const { plan: p } = normalizePlan(json, $exercises ?? [], today) // checked here, so a bad file fails before the sheet
      setup = { mode: 'import', json, name: p.name, start: today, days: p.days }
    } catch (err) { fail(err instanceof SyntaxError ? new Error('planNotJson') : err) }
  }
  async function save({ name, start }) {
    const s = setup
    setup = null
    selected = null
    try {
      if (s.mode === 'import') {
        const { created } = await repo.importPlan(s.json, { name, start })
        notify($t('planImported', { n: created.length }), null, 5000)
      } else if (s.mode === 'start') await repo.startPlan(s.id, { name, start })
      else await repo.updatePlan(s.id, { name, start })
    } catch (err) { fail(err) }
  }
  const startStored = p => (setup = { mode: 'start', id: p.id, name: p.name, start: today, days: p.days })
  const editActive = () => (setup = { mode: 'edit', id: plan.id, name: plan.name, start: plan.start, days: plan.days })
  async function removeStored(p) { if (confirm($t('confirmDeletePlan'))) await repo.deletePlan(p.id) }
  const template = async () => deliver(jsonBlob(planTemplate($exercises ?? [])), 'sets-plan-template.json')
  const exportIt = () => deliver(jsonBlob(exportPlan(plan, exById)), `sets-plan-${plan.id}.json`)
  const calendar = () => deliver(new Blob([planIcs(plan, exById, { time: $settings.planTime || '18:00', lang, perSide: $t('perSide') })], { type: 'text/calendar' }), `sets-plan-${plan.id}.ics`)
  async function end() {
    if (!confirm($t('confirmStopPlan'))) return
    await repo.stopPlan(plan.id)
    selected = null
  }
  const train = () => { $settings.todayOnly = false; $settings.groupId = '__plan'; $settings.tab = 'train' }
  const doneIn = (date, id) => logged.get(date)?.has(id)
</script>

<main class="view stack">
  <h1 class="page-title">{$t('plan')}</h1>

  {#if !plan}
    <p class="muted">{$t('noPlan')}</p>
  {:else}
    <section class="card pad stack tight" data-testid="plan-head">
      <div class="row"><div class="pname grow">{nameOf(plan, lang)}</div><button class="ghost small" onclick={editActive}>{$t('editPlan')}</button></div>
      {#if plan.goal}<div class="muted small">{plan.goal}</div>{/if}
      <div class="stack small headline">
        <span data-testid="plan-day">
          {#if progress.day}{$t('planDayOf', { n: progress.day, d: plan.days })} · {$t('planWeek', { n: progress.week })}
          {:else if today < plan.start}{$t('planStarts', { date: fmt(plan.start, { day: 'numeric', month: 'short' }) })}
          {:else}{$t('planEnded')}{/if}
        </span>
        <span data-testid="plan-progress"><b class="ok">{progress.done}</b> {$t('planDone')} · <b class="warn">{progress.partial}</b> {$t('planPartial')} · <b class="bad">{progress.missed}</b> {$t('planMissed')}</span>
      </div>
      {#if phase}<div class="small phase">{lang === 'es' && phase.es ? phase.es : phase.focus}</div>{/if}
    </section>

    <div class="cal" role="grid" aria-label={nameOf(plan, lang)}>
      {#each weekdays(lang) as w}<div class="wd" role="columnheader">{w}</div>{/each}
      {#each weeks as week}
        {#each week as date (date)}
          {@const s = status(date)}
          <button role="gridcell" class="day {s ?? 'out'}" class:today={date === today} aria-selected={date === shownDate} data-date={date} data-status={s ?? 'out'}
            disabled={!s} aria-label="{date}{s ? ` · ${s}` : ''}" onclick={() => (selected = date)}>{+date.slice(8)}</button>
        {/each}
      {/each}
    </div>

    {#if shown}
      <section class="card pad stack tight" data-testid="plan-today">
        <div class="row">
          <strong class="grow">{shownDate === today ? $t('planTodayLabel') : fmt(shownDate, { weekday: 'long', day: 'numeric', month: 'long' })} · {shown.rest ? $t('planRest') : nameOf(shown, lang)}</strong>
          <span class="muted small">{$t('planDayOf', { n: shown.n, d: plan.days })}</span>
        </div>
        {#if shown.note}<div class="muted small">{shown.note}</div>{/if}
        {#if !shown.rest}
          <ul class="items">
            {#each shown.items as it}
              <li class:done={doneIn(shownDate, it.exerciseId)}>
                <span class="grow">{doneIn(shownDate, it.exerciseId) ? '✓ ' : ''}{nameOf(exById[it.exerciseId], lang) || it.exerciseId}</span>
                <span class="muted">{targetLabel(it, exById[it.exerciseId], $t('perSide'))}</span>
              </li>
            {/each}
          </ul>
          {#if shownDate === today}<button class="primary" onclick={train}>{$t('trainPlan')}</button>{/if}
        {/if}
      </section>
    {/if}

    <h2>{$t('planWeekTemplate')}</h2>
    <ul class="list card week">
      {#each WEEKDAYS as k, i}
        {@const d = plan.week[k]}
        <li class="row"><span class="wdn">{weekdays(lang)[i]}</span><span class="grow" class:muted={d.rest}>{d.rest ? $t('planRest') : `${nameOf(d, lang)} · ${d.items.length}`}</span></li>
      {/each}
    </ul>

    {#if plan.rules?.length}
      <h2>{$t('planRules')}</h2>
      <ul class="card pad rules small">{#each plan.rules as r}<li>{r}</li>{/each}</ul>
    {/if}

    <section class="card pad stack tight">
      <div class="row">
        <label class="grow">{$t('calendarAt')}<input type="time" bind:value={$settings.planTime} /></label>
        <button class="grow" onclick={calendar}>{$t('addToCalendar')}</button>
      </div>
      <div class="muted small">{$t('calendarHint')}</div>
    </section>
    <div class="grid2">
      <button onclick={exportIt}>{$t('exportPlan')}</button>
      <button class="danger" onclick={end}>{$t('stopPlan')}</button>
    </div>
  {/if}

  {#if $stored?.length}
    <h2>{$t('yourPlans')}</h2>
    <ul class="list card" data-testid="stored-plans">
      {#each $stored as p (p.id)}
        <li class="row stored">
          <div class="grow"><div>{nameOf(p, lang)}</div><div class="muted small">{$t('planDays', { d: p.days })}</div></div>
          <button onclick={() => startStored(p)} aria-label="{$t('startAgain')} {p.name}">{$t('startAgain')}</button>
          <button class="icon ghost danger" aria-label="{$t('delete')} {p.name}" onclick={() => removeStored(p)}>✕</button>
        </li>
      {/each}
    </ul>
  {/if}

  <label class="file">{$t('importPlan')}<input type="file" accept="application/json,.json" onchange={choose} /></label>
  {#if error}<div class="err" role="alert">{error}</div>{/if}
  <button onclick={template}>{$t('planTemplate')}</button>
  <div class="muted small">{$t('planTemplateHint')}</div>
</main>

{#if setup}
  <PlanStartSheet title={setup.mode === 'edit' ? $t('editPlan') : $t('planSetup')} name={setup.name} start={setup.start} days={setup.days}
    action={setup.mode === 'edit' ? $t('save') : $t('startPlan')} onsave={save} onclose={() => (setup = null)} />
{/if}

<style>
  .tight { gap: 6px; }
  .pad { padding: 12px; }
  .pname { font-size: 19px; font-weight: 700; }
  .headline { gap: 2px; }
  .stored { padding: 8px 8px 8px 12px; gap: 8px; }
  .phase { color: var(--accent); }
  .ok { color: var(--ok); } .warn { color: var(--warn); } .bad { color: var(--danger); }
  .cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  .wd { text-align: center; font-size: 12px; color: var(--muted); }
  .day { aspect-ratio: 1; min-height: 0; padding: 0; border-radius: 8px; border: 1px solid var(--line); background: transparent; font-size: 15px; font-variant-numeric: tabular-nums; }
  .day.out { opacity: .25; border-color: transparent; }
  .day.rest { color: var(--muted); border-style: dashed; }
  .day.done { background: var(--ok); border-color: var(--ok); color: #fff; font-weight: 700; }
  .day.partial { background: var(--warn); border-color: var(--warn); color: #fff; font-weight: 700; }
  .day.missed { background: var(--danger); border-color: var(--danger); color: #fff; font-weight: 700; }
  .day.today { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--fg); font-weight: 700; }
  .day[aria-selected='true'] { outline: 2px solid var(--accent); outline-offset: 2px; }
  .items { list-style: none; margin: 0; padding: 0; }
  .items li { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--line); font-size: 15px; }
  .items li:last-child { border-bottom: 0; }
  .items li.done { color: var(--ok); }
  .week li { padding: 10px 12px; gap: 12px; }
  .wdn { width: 1.5em; color: var(--muted); }
  .rules { margin: 0; padding-left: 28px; display: grid; gap: 4px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .file { display: grid; place-items: center; min-height: 44px; border: 1px solid var(--line); border-radius: var(--r); background: var(--card); color: var(--fg); font-size: 15px; cursor: pointer; position: relative; }
  .file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .err { color: var(--danger); }
  input[type='time'], input[type='date'] { font-size: 17px; }
</style>
