<script>
  import { get } from 'svelte/store'
  import { liveQuery } from 'dexie'
  import { db, repo, groups, exercises, activities, activityLogs, activeSession, setCount, now, shownSummary, notify, activePlan, routines, askAbout } from '../lib/store.js'
  import { planDay, nudges as planNudges, low, targetLabel, addDays } from '../lib/plan.js'
  import { schedule, totalSeconds } from '../lib/intervals.js'
  import RoutineSheet from '../components/RoutineSheet.svelte'
  import IntervalRun from '../components/IntervalRun.svelte'
  import { lastBatch, personalBests, isOpen } from '../lib/history.js'
  import { settings } from '../lib/settings.js'
  import { t, summaryWords, partnerLabel } from '../lib/i18n.js'
  import { volume } from '../lib/summary.js'
  import { clock, dateKey } from '../lib/time.js'
  import { backupNow, daysSince } from '../lib/backup.js'
  import { uploadSession, driveReady } from '../lib/sessionFiles.js'
  import Icon from '../components/Icon.svelte'
  import ExerciseRow from '../components/ExerciseRow.svelte'
  import LogSheet from '../components/LogSheet.svelte'
  import NotesSheet from '../components/NotesSheet.svelte'
  import ActivitySheet from '../components/ActivitySheet.svelte'
  import GpxSheet from '../components/GpxSheet.svelte'
  import { parseGpx } from '../lib/gpx.js'
  import Stopwatch from '../components/Stopwatch.svelte'
  import { watch, running as watchRunning } from '../lib/stopwatch.js'
  import { activityLabel } from '../lib/activity.js'
  import { nameOf } from '../lib/names.js'

  let logging = $state(null) // { exercise, set? }
  let notesOpen = $state(false)
  let watchOpen = $state(false)
  let doing = $state(null) // { activity | null, log?, last? }
  let gpx = $state.raw(null) // { run, fileName }: a GPX file read, waiting in its sheet (raw: the track goes to IndexedDB as is)

  /** A GPX file from the Files picker: parsed here, logged from the sheet. */
  async function chooseGpx(e) {
    const file = e.currentTarget.files[0]
    e.currentTarget.value = ''
    if (!file) return
    try { gpx = { run: parseGpx(await file.text()), fileName: file.name.replace(/\.gpx$/i, '') } }
    catch (err) { notify($t(err.message === 'gpxNoTrack' ? 'gpxNoTrack' : 'gpxBad')) }
  }

  const exById = $derived(Object.fromEntries(($exercises ?? []).map(e => [e.id, e])))
  const ACTIVITIES_TAB = '__activities'
  const PLAN_TAB = '__plan'
  const todayKey = $derived(dateKey($now))
  const onActivities = $derived(!$settings.todayOnly && $settings.groupId === ACTIVITIES_TAB)
  // the active plan's day today: its exercises, with the plan's targets, as a tab of their own
  // keyed on the date, not the clock: a new object every second would rebuild the list and its history query
  const planToday = $derived($activePlan ? planDay($activePlan, todayKey) : null)
  const planTabOn = $derived(!!planToday && !planToday.rest)
  const onPlan = $derived(!$settings.todayOnly && planTabOn && $settings.groupId === PLAN_TAB)
  const planned = $derived(Object.fromEntries((planTabOn ? planToday.items : []).map(i => [i.exerciseId, i])))
  const group = $derived(($groups ?? []).find(g => g.id === $settings.groupId) ?? $groups?.[0])

  // partner mode: every set is logged for one of the two; the screen shows the chosen person's workout
  const partnerOn = $derived(!!$settings.partnerMode)
  const who = $derived(partnerOn && $settings.who === 'partner' ? 'partner' : 'me')
  const myName = $derived($settings.userName?.trim() || $t('me'))
  const theirName = $derived(partnerLabel($settings, $t))
  const whoName = $derived(partnerOn ? (who === 'partner' ? theirName : myName) : '')
  const otherName = $derived(who === 'partner' ? myName : theirName)
  const bodyKg = $derived(who === 'partner' ? $settings.partnerKg : $settings.bodyKg)
  const tableOf = by => (by === 'partner' ? db.partnerSets : db.sets)

  // the workout in progress (running timed session, or loose sets not completed yet), per person
  const activeId = $derived($activeSession?.id ?? null)
  let openSets = $state([])
  let openPartner = $state([])
  const openOf = (table, id) => (id ? table.where('sessionId').equals(id).sortBy('ts') : table.filter(s => !s.sessionId).sortBy('ts'))
  $effect(() => {
    const id = activeId
    const sub = liveQuery(() => openOf(db.sets, id)).subscribe(v => (openSets = v))
    return () => sub.unsubscribe()
  })
  $effect(() => {
    const id = activeId
    if (!partnerOn) { openPartner = []; return }
    const sub = liveQuery(() => openOf(db.partnerSets, id)).subscribe(v => (openPartner = v))
    return () => sub.unsubscribe()
  })
  // Today mode: everything in the current workout, any group, in the order first done
  const todaySets = $derived(who === 'partner' ? openPartner : openSets)
  const otherSets = $derived(who === 'partner' ? openSets : openPartner)
  const todayOnly = $derived(!!$settings.todayOnly)
  const todayIds = $derived([...new Set(todaySets.map(s => s.exerciseId))])
  const ids = $derived(todayOnly ? todayIds : onActivities ? [] : onPlan ? Object.keys(planned) : (group?.exerciseIds ?? []))
  /** An exercise as the plan sets it today: its sets, reps or seconds (the low end of a range) and kg. */
  const asPlanned = (ex, it) => {
    const timed = ex.type === 'time'
    return { ...ex, sets: it.sets, ...(timed ? { seconds: low(it.seconds) ?? ex.seconds } : { reps: low(it.reps) ?? ex.reps }),
      ...(it.kg != null ? { kg: it.kg } : {}), perSide: !!it.perSide || ex.perSide, planTarget: targetLabel(it, ex, $t('perSide')) }
  }
  const list = $derived(ids.map(id => exById[id]).filter(e => e && (todayOnly || onPlan || !e.archived)).map(e => (onPlan ? asPlanned(e, planned[e.id]) : e)))
  // the kg tally of the current workout: what the ✓ view shows
  const tally = $derived({ sets: todaySets.length, exercises: todayIds.length, kg: Math.round(volume(todaySets, exById)) })
  const nf = $derived(new Intl.NumberFormat($settings.lang))
  /** In Today mode a new set goes to the group the exercise was last logged from today. */
  const groupFor = id => (todayOnly ? todaySets.filter(s => s.exerciseId === id).at(-1)?.groupId ?? null : onPlan ? null : group?.id)

  // opening the app: today's plan day, yesterday missed (Settings can turn these off)
  let recent = $state(new Map())
  $effect(() => {
    const p = $activePlan, day = todayKey
    if (!p) { recent = new Map(); return }
    const sub = liveQuery(() => repo.loggedByDate(addDays(day, -1), day)).subscribe(v => (recent = v))
    return () => sub.unsubscribe()
  })
  const nudgeList = $derived($settings.planNudges !== false && $settings.nudgeDismissed !== todayKey && $activePlan ? planNudges($activePlan, recent, todayKey) : [])
  const openPlanTab = () => { $settings.todayOnly = false; $settings.groupId = PLAN_TAB }

  // interval routines: written as text, run full screen
  let editing = $state(null) // { routine? }
  let running = $state(null) // routine on the timer
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const routineTotal = r => totalSeconds(schedule({ steps: r.steps, rounds: r.rounds, restBetween: r.restBetween, prep: 0 }))
  // every set the person ever logged for the listed exercises: last time, personal bests
  let history = $state([])
  $effect(() => {
    const want = ids, table = tableOf(who)
    history = [] // switching person: never show the other one's history meanwhile
    const sub = liveQuery(() => table.where('exerciseId').anyOf(want).toArray()).subscribe(v => (history = v))
    return () => sub.unsubscribe()
  })
  const perExercise = $derived.by(() => {
    const out = {}
    for (const ex of list) {
      const mine = history.filter(s => s.exerciseId === ex.id)
      out[ex.id] = {
        today: todaySets.filter(s => s.exerciseId === ex.id),
        last: lastBatch(mine, activeId),
        bests: personalBests(mine),
        other: partnerOn ? { name: otherName, n: otherSets.filter(s => s.exerciseId === ex.id).length } : null,
      }
    }
    return out
  })
  const empty = { today: [], last: null, bests: new Set(), other: null }

  // anything logged outside a timed session: "Complete" files it into its day's untimed session
  let loose = $state({ sets: [], activityLogs: [], days: [] })
  $effect(() => {
    const sub = liveQuery(() => repo.pendingAdHoc()).subscribe(v => (loose = v))
    return () => sub.unsubscribe()
  })
  const looseCount = $derived(loose.sets.length + loose.activityLogs.length + (loose.partnerSets?.length ?? 0))
  const looseText = $derived(loose.days.length === 1 && loose.days[0] === todayKey
    ? $t('looseToday', { n: looseCount })
    : $t('looseDays', { n: looseCount, k: loose.days.length }))
  // a timed session already finished today: loose rows logged after it (a run on the way home) can still join it
  let todaySession = $state(null)
  $effect(() => {
    const day = todayKey
    const sub = liveQuery(() => repo.timedSessionOn(day)).subscribe(v => (todaySession = v))
    return () => sub.unsubscribe()
  })
  const canJoin = $derived(!!todaySession && !$activeSession && loose.days.includes(todayKey))
  const addToSession = async () => {
    const updated = await repo.bundleLoose(todaySession.id, summaryWords(get(t)))
    if (updated) shownSummary.set(updated)
  }
  const complete = async () => {
    const touched = await repo.completeAdHoc(summaryWords(get(t)))
    if (touched.length) { askAbout.set(touched.at(-1).id); shownSummary.set(touched.at(-1)) }
  }
  const todayActivities = $derived(($activities ?? []).filter(a => ($activityLogs ?? []).some(l => l.activityId === a.id && isOpen(l, activeId))))

  const perActivity = $derived.by(() => {
    const out = {}
    for (const a of $activities ?? []) {
      const mine = ($activityLogs ?? []).filter(l => l.activityId === a.id).sort((x, y) => x.ts - y.ts)
      out[a.id] = { today: mine.filter(l => isOpen(l, activeId)), last: mine.filter(l => !isOpen(l, activeId)).at(-1) ?? null }
    }
    return out
  })

  const today = $derived(new Intl.DateTimeFormat($settings.lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format($now))
  const backupDays = $derived(daysSince($settings.lastBackup, $now))
  const nagBackup = $derived($setCount > 0 && (backupDays == null || backupDays >= 7))

  const stop = async () => {
    const closed = await repo.stopSession(summaryWords(get(t)))
    if (closed) { askAbout.set(closed.id); shownSummary.set(closed) }
    if (closed && $settings.driveAuto && driveReady()) uploadSession(closed.id, { quiet: true })
  }

</script>

<header>
  <div class="top">
    <div class="grow">
      <div class="date">{today}</div>
      {#if $settings.userName}<div class="muted small">{$settings.userName}</div>{/if}
    </div>
    {#if $activeSession}<span class="elapsed" aria-label={$t('session')}>{clock($now - $activeSession.start)}</span>{/if}
  </div>
  <div class="controls">
    <button class="icon" aria-label={$t('startSession')} disabled={!!$activeSession} onclick={() => repo.startSession()}><Icon name="play" /></button>
    <button class="icon" aria-label={$t('stopSession')} disabled={!$activeSession} onclick={stop}><Icon name="stop" /></button>
    <button class="icon" aria-label={$t('rest')} disabled={!$activeSession} onclick={() => repo.startRest()}><Icon name="pause" /></button>
    <button class="icon" aria-label={$t('notes')} onclick={() => (notesOpen = true)}><Icon name="bubble" /></button>
    <button class="icon" class:ticking={watchRunning($watch)} aria-label={$t('stopwatch')} onclick={() => (watchOpen = true)}><Icon name="stopwatch" /></button>
    <span class="grow"></span>
    <button class="icon toggle" aria-label={$t('todayOnly')} aria-pressed={todayOnly} onclick={() => ($settings.todayOnly = !todayOnly)}><Icon name="check" /></button>
  </div>
  {#if partnerOn}
    <div class="segmented who" role="group" aria-label={$t('whoLogs')}>
      <button aria-pressed={who === 'me'} onclick={() => ($settings.who = 'me')}>{myName}</button>
      <button aria-pressed={who === 'partner'} class="partner" onclick={() => ($settings.who = 'partner')}>{theirName}</button>
    </div>
  {/if}
  {#if todayOnly}
    <div class="today-bar small" data-testid="today-bar">{$t('todayOnlyOn')}</div>
    {#if tally.sets}
      <div class="tally" data-testid="today-tally">{tally.sets} {$t('sets')} · {tally.exercises} {$t('exercises')} · {nf.format(tally.kg)} kg</div>
    {/if}
  {:else if $groups?.length}
    <div class="groups" role="tablist">
      {#if planTabOn}
        <button role="tab" class="plan-tab" aria-selected={onPlan} onclick={openPlanTab}>{$t('planTab')} · {nameOf(planToday, $settings.lang)}</button>
      {/if}
      {#each $groups as g (g.id)}
        <button role="tab" aria-selected={!onActivities && !onPlan && g.id === group?.id} onclick={() => ($settings.groupId = g.id)}>{nameOf(g, $settings.lang)}</button>
      {/each}
      <button role="tab" class="act-tab" aria-selected={onActivities} onclick={() => ($settings.groupId = ACTIVITIES_TAB)}>{$t('activitiesTab')}</button>
    </div>
  {/if}
</header>

<main class="view">
  {#if looseCount}
    <div class="loose card row" data-testid="loose-bar">
      <span class="grow small" class:full={canJoin}>{looseText}</span>
      {#if canJoin}<button class="grow" onclick={addToSession}>{$t('addToSession')}</button>{/if}
      <button class="primary" class:grow={canJoin} onclick={complete}>{$t('complete')}</button>
    </div>
  {/if}
  {#if nudgeList.length}
    <div class="nudge card stack" data-testid="plan-nudge">
      {#each nudgeList as n}
        {#if n.kind === 'today'}
          <div class="row"><span class="grow small"><strong>{$t('planNudgeToday', { n: n.day.n, name: nameOf(n.day, $settings.lang) })}</strong></span>
            {#if !onPlan}<button class="primary" onclick={openPlanTab}>{$t('trainPlan')}</button>{/if}</div>
        {:else if n.kind === 'missed'}
          <div class="small missed">{$t('planNudgeMissed', { name: nameOf(n.day, $settings.lang) })}</div>
        {:else}
          <div class="small">{$t('planNudgeEnded')}</div>
        {/if}
      {/each}
      <button class="ghost small dismiss" onclick={() => ($settings.nudgeDismissed = todayKey)}>{$t('dismiss')}</button>
    </div>
  {/if}
  {#if nagBackup}
    <div class="nag card row">
      <span class="grow small">{backupDays == null ? $t('backupNever') : $t('backupOld', { d: backupDays })}</span>
      <button onclick={backupNow}>{$t('backupNow')}</button>
    </div>
  {/if}

  {#if onActivities}
    <!-- activities have their own tab: rarely used, out of the way of the groups -->
  {:else if todayOnly && !list.length && !todayActivities.length}
    <p class="muted">{$t('nothingToday')}</p>
  {:else if todayOnly && !list.length}
    <!-- only activities today -->
  {:else if !$groups?.length}
    <p class="muted">{$t('noGroups')}</p>
  {:else if !list.length}
    <p class="muted">{$t('noExercises')}</p>
  {:else}
    <ul class="list card">
      {#each list as ex (ex.id)}
        {@const h = perExercise[ex.id] ?? empty}
        <li>
          <ExerciseRow exercise={ex} sets={h.today} last={h.last} bests={h.bests} other={h.other} kg={todayOnly ? volume(h.today, exById) : null}
            onlog={() => (logging = { exercise: ex })} onedit={set => (logging = { exercise: ex, set })} />
        </li>
      {/each}
    </ul>
  {/if}

  {#if onActivities || (todayOnly && todayActivities.length)}
  {#if todayOnly}<h2>{$t('activities')}</h2>{/if}
  <ul class="list card">
    {#each todayOnly ? todayActivities : $activities ?? [] as a (a.id)}
      {@const h = perActivity[a.id] ?? { today: [], last: null }}
      <li class="activity">
        <div class="row">
          <div class="grow name">
            <span class="aname">{nameOf(a, $settings.lang)}</span>
            {#if h.last}<span class="muted small" data-testid="activity-last">{$t('last')}: {activityLabel(h.last)}</span>{/if}
          </div>
          <button class="icon primary" aria-label="{$t('logActivity')}: {nameOf(a, $settings.lang)}"
            onclick={() => (doing = { activity: a, last: h.today.at(-1) ?? h.last })}><Icon name="plus" /></button>
        </div>
        {#if h.today.length}
          <div class="chips">
            {#each h.today as l (l.id)}
              <button class="chip" onclick={() => (doing = { activity: a, log: l })}>{activityLabel(l)}</button>
            {/each}
          </div>
        {/if}
      </li>
    {/each}
    {#if !todayOnly}
      <li class="activity">
        <button class="ghost other" onclick={() => (doing = { activity: null })}>{$t('otherActivity')}</button>
      </li>
      <li class="activity">
        <label class="ghost other file">{$t('importGpx')}<input type="file" accept=".gpx,application/gpx+xml" onchange={chooseGpx} /></label>
      </li>
    {/if}
  </ul>
  {/if}

  {#if onActivities}
    <h2>{$t('intervals')}</h2>
    <ul class="list card">
      {#each $routines ?? [] as r (r.id)}
        <li class="activity">
          <div class="row">
            <button class="ghost grow name routine" onclick={() => (editing = { routine: r })}>
              <span class="aname">{r.name}</span>
              <span class="muted small">{$t('routineTotal', { n: r.steps.length * Math.max(1, r.rounds), t: mmss(routineTotal(r)) })}</span>
            </button>
            <button class="icon primary" aria-label="{$t('run')}: {r.name}" onclick={() => (running = r)}><Icon name="play" /></button>
          </div>
        </li>
      {/each}
      <li class="activity"><button class="ghost other" onclick={() => (editing = {})}>{$t('newRoutine')}</button></li>
    </ul>
  {/if}
</main>

{#if logging}
  <LogSheet exercise={logging.exercise} set={logging.set} groupId={groupFor(logging.exercise.id)} by={who} who={whoName} bw={bodyKg}
    done={(perExercise[logging.exercise.id] ?? empty).today} last={who === 'partner' ? (perExercise[logging.exercise.id] ?? empty).last?.sets.at(-1) ?? null : null}
    onclose={() => (logging = null)} />
{/if}
{#if notesOpen}<NotesSheet onclose={() => (notesOpen = false)} />{/if}
{#if watchOpen}<Stopwatch onclose={() => (watchOpen = false)} />{/if}
{#if doing}<ActivitySheet activity={doing.activity} log={doing.log} last={doing.last} onclose={() => (doing = null)} />{/if}
{#if gpx}<GpxSheet run={gpx.run} fileName={gpx.fileName} onclose={() => (gpx = null)} />{/if}
{#if editing}<RoutineSheet routine={editing.routine} onclose={() => (editing = null)} onrun={r => { editing = null; running = r }} />{/if}
{#if running}<IntervalRun routine={running} onclose={() => (running = null)} />{/if}

<style>
  header {
    position: sticky; top: 0; z-index: 5; background: var(--bg); border-bottom: 1px solid var(--line);
    padding: calc(env(safe-area-inset-top) + 10px) 16px 8px;
  }
  .top { display: flex; align-items: center; gap: 8px; max-width: 608px; margin: 0 auto; }
  .date { font-weight: 700; font-size: 17px; text-transform: capitalize; }
  .elapsed { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--accent); }
  .controls { display: flex; gap: 8px; margin: 8px auto 0; max-width: 608px; }
  .groups { display: flex; gap: 6px; overflow-x: auto; margin: 10px -16px 0; padding: 0 16px; scrollbar-width: none; }
  .groups::-webkit-scrollbar { display: none; }
  .groups button { white-space: nowrap; min-height: 36px; border-radius: 999px; flex: none; }
  .act-tab { border-style: dashed; }
  .groups [aria-selected='true'] { background: var(--fg); color: var(--bg); border-color: var(--fg); font-weight: 700; }
  main { padding-top: 12px; }
  .nag { padding: 6px 6px 6px 12px; margin-bottom: 12px; }
  .nudge { padding: 8px 8px 4px 12px; margin-bottom: 12px; border-color: var(--accent); gap: 6px; }
  .nudge .missed { color: var(--danger); }
  .nudge .dismiss { align-self: flex-end; min-height: 32px; color: var(--muted); }
  .plan-tab { color: var(--accent); font-weight: 700; }
  .routine { display: grid; gap: 2px; text-align: left; padding-left: 0; }
  .ticking { color: var(--flame); border-color: var(--flame); }
  .loose { padding: 6px 6px 6px 12px; margin-bottom: 12px; border-color: var(--accent); flex-wrap: wrap; }
  .loose .full { flex-basis: 100%; padding: 6px 0 2px; }
  .loose button { padding: 0 10px; }
  .toggle[aria-pressed='true'] { background: var(--ok); border-color: var(--ok); color: var(--bg); }
  .today-bar { max-width: 608px; margin: 10px auto 0; color: var(--ok); font-weight: 700; }
  .tally { max-width: 608px; margin: 4px auto 0; font-weight: 700; font-variant-numeric: tabular-nums; }
  .who { max-width: 608px; margin: 8px auto 0; }
  .who button { min-height: 34px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .who .partner[aria-pressed='true'] { color: var(--accent); }
  .activity { padding: 6px 8px 6px 12px; }
  .activity .name { display: grid; gap: 2px; }
  .aname { font-weight: 700; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 0 6px; }
  .chip { min-height: 34px; padding: 0 10px; border-radius: 999px; font-size: 13px; background: var(--soft); }
  .other { width: 100%; text-align: left; color: var(--muted); padding-left: 0; }
  .file { position: relative; display: flex; align-items: center; min-height: 44px; cursor: pointer; }
  .file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
</style>
