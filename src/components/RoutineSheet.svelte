<script>
  import { untrack } from 'svelte'
  import Sheet from './Sheet.svelte'
  import { repo, notify } from '../lib/store.js'
  import { t } from '../lib/i18n.js'
  import { parseSteps, schedule, totalSeconds } from '../lib/intervals.js'

  /** An interval routine written as text ("30 s climbers - 30 s burpees"), parsed as you type. */
  let { routine = null, onclose, onrun } = $props()

  const init = untrack(() => routine ?? {})
  let name = $state(init.name ?? '')
  let text = $state(init.text ?? '')
  let rounds = $state(init.rounds ?? 1)
  let restBetween = $state(init.restBetween ?? 0)

  const parsed = $derived(parseSteps(text))
  // "x3" or "3 rounds" in the text sets the rounds field
  $effect(() => { if (parsed.rounds) rounds = parsed.rounds })
  const steps = $derived(parsed.steps)
  const total = $derived(totalSeconds(schedule({ steps, rounds: +rounds || 1, restBetween: +restBetween || 0, prep: 0 })))
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  async function save(andRun = false) {
    if (!steps.length) return
    const row = await repo.saveRoutine({ ...(routine?.id ? { id: routine.id } : {}), name, text, steps, rounds: Math.max(1, Math.round(+rounds || 1)), restBetween: Math.max(0, Math.round(+restBetween || 0)) })
    if (andRun) return onrun(row)
    notify($t('saved'))
    onclose()
  }
  async function remove() {
    if (!confirm($t('confirmDeleteRoutine'))) return
    await repo.deleteRoutine(routine.id)
    onclose()
  }
</script>

<Sheet title={routine ? routine.name : $t('newRoutine')} {onclose}>
  <form class="stack" onsubmit={e => { e.preventDefault(); save() }}>
    <label>{$t('routineName')}<input bind:value={name} placeholder="Core blast" /></label>
    <label>{$t('routineSteps')}
      <textarea bind:value={text} rows="5" placeholder="30 s climbers - 30 s cross climbers - 30 s burpees - 30 s elbow plank"></textarea>
    </label>
    <div class="muted small">{$t('routineStepsHint')}</div>
    <div class="row">
      <label class="grow">{$t('rounds')}<input type="number" inputmode="numeric" min="1" bind:value={rounds} /></label>
      <label class="grow">{$t('restBetween')}<input type="number" inputmode="numeric" min="0" bind:value={restBetween} /></label>
    </div>
    {#if steps.length}
      <ol class="steps card" data-testid="routine-steps">
        {#each steps as s}<li class:rest={s.rest}><span class="sec">{s.seconds} s</span> {s.name || '—'}</li>{/each}
      </ol>
      <div class="muted small center" data-testid="routine-total">{$t('routineTotal', { n: steps.length * Math.max(1, +rounds || 1), t: mmss(total) })}</div>
    {/if}
    <div class="row">
      {#if routine}<button type="button" class="danger" onclick={remove}>{$t('delete')}</button>{/if}
      <button type="submit" class="grow" disabled={!steps.length}>{$t('save')}</button>
      <button type="button" class="primary grow" disabled={!steps.length} onclick={() => save(true)}>{$t('run')}</button>
    </div>
  </form>
</Sheet>

<style>
  textarea { min-height: 110px; font-size: 16px; }
  .steps { margin: 0; padding: 8px 8px 8px 36px; display: grid; gap: 4px; font-size: 15px; }
  .steps .rest { color: var(--muted); }
  .sec { font-variant-numeric: tabular-nums; font-weight: 700; }
  .center { text-align: center; }
</style>
