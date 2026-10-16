<script>
  import { get } from 'svelte/store'
  import { repo, groups, exercises, todaySets, activeSession, setCount, now, shownSummary, notify } from '../lib/store.js'
  import { settings, portable } from '../lib/settings.js'
  import { t, summaryWords } from '../lib/i18n.js'
  import { clock, dateKey } from '../lib/time.js'
  import { deliver, jsonBlob } from '../lib/export.js'
  import Icon from '../components/Icon.svelte'
  import ExerciseRow from '../components/ExerciseRow.svelte'
  import LogSheet from '../components/LogSheet.svelte'
  import NotesSheet from '../components/NotesSheet.svelte'

  let logging = $state(null) // { exercise, set? }
  let notesOpen = $state(false)

  const exById = $derived(Object.fromEntries(($exercises ?? []).map(e => [e.id, e])))
  const group = $derived(($groups ?? []).find(g => g.id === $settings.groupId) ?? $groups?.[0])
  const list = $derived((group?.exerciseIds ?? []).map(id => exById[id]).filter(e => e && !e.archived))
  const today = $derived(new Intl.DateTimeFormat($settings.lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format($now))
  const backupDays = $derived($settings.lastBackup ? Math.floor(($now - $settings.lastBackup) / 864e5) : null)
  const nagBackup = $derived($setCount > 0 && (backupDays == null || backupDays >= 7))

  const stop = async () => {
    const closed = await repo.stopSession(summaryWords(get(t)))
    if (closed) shownSummary.set(closed)
  }

  const backupNow = async () => {
    const file = await repo.backup(portable($settings))
    if (await deliver(jsonBlob(file), `exercise-tracker-backup-${dateKey()}.json`)) $settings.lastBackup = Date.now()
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
        <li>
          <ExerciseRow exercise={ex} sets={($todaySets ?? []).filter(s => s.exerciseId === ex.id)}
            onlog={() => (logging = { exercise: ex })} onedit={set => (logging = { exercise: ex, set })} />
        </li>
      {/each}
    </ul>
  {/if}
</main>

{#if logging}
  <LogSheet exercise={logging.exercise} set={logging.set} groupId={group?.id}
    done={($todaySets ?? []).filter(s => s.exerciseId === logging.exercise.id)} onclose={() => (logging = null)} />
{/if}
{#if notesOpen}<NotesSheet onclose={() => (notesOpen = false)} />{/if}

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
</style>
