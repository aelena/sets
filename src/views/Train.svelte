<script>
  import { get } from 'svelte/store'
  import { liveQuery } from 'dexie'
  import { db, repo, groups, exercises, activities, activityLogs, activeSession, setCount, now, shownSummary } from '../lib/store.js'
  import { lastDay, personalBests } from '../lib/history.js'
  import { settings } from '../lib/settings.js'
  import { t, summaryWords } from '../lib/i18n.js'
  import { clock, dateKey } from '../lib/time.js'
  import { backupNow, daysSince } from '../lib/backup.js'
  import Icon from '../components/Icon.svelte'
  import ExerciseRow from '../components/ExerciseRow.svelte'
  import LogSheet from '../components/LogSheet.svelte'
  import NotesSheet from '../components/NotesSheet.svelte'
  import ActivitySheet from '../components/ActivitySheet.svelte'
  import { activityLabel } from '../lib/activity.js'

  let logging = $state(null) // { exercise, set? }
  let notesOpen = $state(false)
  let doing = $state(null) // { activity | null, log?, last? }

  const exById = $derived(Object.fromEntries(($exercises ?? []).map(e => [e.id, e])))
  const group = $derived(($groups ?? []).find(g => g.id === $settings.groupId) ?? $groups?.[0])
  const list = $derived((group?.exerciseIds ?? []).map(id => exById[id]).filter(e => e && !e.archived))
  // every set ever logged for this group's exercises: today's progress, last time, personal bests
  let history = $state([])
  $effect(() => {
    const ids = group?.exerciseIds ?? []
    const sub = liveQuery(() => db.sets.where('exerciseId').anyOf(ids).toArray()).subscribe(v => (history = v))
    return () => sub.unsubscribe()
  })
  const todayKey = $derived(dateKey($now))
  const perExercise = $derived.by(() => {
    const out = {}
    for (const ex of list) {
      const mine = history.filter(s => s.exerciseId === ex.id)
      out[ex.id] = {
        today: mine.filter(s => s.date === todayKey).sort((a, b) => a.ts - b.ts),
        last: lastDay(mine, todayKey),
        bests: personalBests(mine),
      }
    }
    return out
  })
  const empty = { today: [], last: null, bests: new Set() }

  const perActivity = $derived.by(() => {
    const out = {}
    for (const a of $activities ?? []) {
      const mine = ($activityLogs ?? []).filter(l => l.activityId === a.id).sort((x, y) => x.ts - y.ts)
      out[a.id] = { today: mine.filter(l => l.date === todayKey), last: mine.filter(l => l.date < todayKey).at(-1) ?? null }
    }
    return out
  })

  const today = $derived(new Intl.DateTimeFormat($settings.lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format($now))
  const backupDays = $derived(daysSince($settings.lastBackup, $now))
  const nagBackup = $derived($setCount > 0 && (backupDays == null || backupDays >= 7))

  const stop = async () => {
    const closed = await repo.stopSession(summaryWords(get(t)))
    if (closed) shownSummary.set(closed)
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
    <button class="icon" aria-label={$t('rest')} onclick={() => repo.startRest()}><Icon name="rest" /></button>
    <button class="icon" aria-label={$t('notes')} onclick={() => (notesOpen = true)}><Icon name="bubble" /></button>
  </div>
  {#if $groups?.length}
    <div class="groups" role="tablist">
      {#each $groups as g (g.id)}
        <button role="tab" aria-selected={g.id === group?.id} onclick={() => ($settings.groupId = g.id)}>{g.name}</button>
      {/each}
    </div>
  {/if}
</header>

<main class="view">
  {#if nagBackup}
    <div class="nag card row">
      <span class="grow small">{backupDays == null ? $t('backupNever') : $t('backupOld', { d: backupDays })}</span>
      <button onclick={backupNow}>{$t('backupNow')}</button>
    </div>
  {/if}

  {#if !$groups?.length}
    <p class="muted">{$t('noGroups')}</p>
  {:else if !list.length}
    <p class="muted">{$t('noExercises')}</p>
  {:else}
    <ul class="list card">
      {#each list as ex (ex.id)}
        {@const h = perExercise[ex.id] ?? empty}
        <li>
          <ExerciseRow exercise={ex} sets={h.today} last={h.last} bests={h.bests}
            onlog={() => (logging = { exercise: ex })} onedit={set => (logging = { exercise: ex, set })} />
        </li>
      {/each}
    </ul>
  {/if}

  <h2>{$t('activities')}</h2>
  <ul class="list card">
    {#each $activities ?? [] as a (a.id)}
      {@const h = perActivity[a.id] ?? { today: [], last: null }}
      <li class="activity">
        <div class="row">
          <div class="grow name">
            <span class="aname">{a.name}</span>
            {#if h.last}<span class="muted small" data-testid="activity-last">{$t('last')}: {activityLabel(h.last)}</span>{/if}
          </div>
          <button class="icon primary" aria-label="{$t('logActivity')}: {a.name}"
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
    <li class="activity">
      <button class="ghost other" onclick={() => (doing = { activity: null })}>{$t('otherActivity')}</button>
    </li>
  </ul>
</main>

{#if logging}
  <LogSheet exercise={logging.exercise} set={logging.set} groupId={group?.id}
    done={(perExercise[logging.exercise.id] ?? empty).today} onclose={() => (logging = null)} />
{/if}
{#if notesOpen}<NotesSheet onclose={() => (notesOpen = false)} />{/if}
{#if doing}<ActivitySheet activity={doing.activity} log={doing.log} last={doing.last} onclose={() => (doing = null)} />{/if}

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
  .groups [aria-selected='true'] { background: var(--fg); color: var(--bg); border-color: var(--fg); font-weight: 700; }
  main { padding-top: 12px; }
  .nag { padding: 6px 6px 6px 12px; margin-bottom: 12px; }
  .activity { padding: 6px 8px 6px 12px; }
  .activity .name { display: grid; gap: 2px; }
  .aname { font-weight: 700; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 0 6px; }
  .chip { min-height: 34px; padding: 0 10px; border-radius: 999px; font-size: 13px; background: var(--soft); }
  .other { width: 100%; text-align: left; color: var(--muted); padding-left: 0; }
</style>
