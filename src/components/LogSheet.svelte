<script>
  import { untrack } from 'svelte'
  import Sheet from './Sheet.svelte'
  import Icon from './Icon.svelte'
  import { repo, notify } from '../lib/store.js'
  import { t } from '../lib/i18n.js'

  /** `set` given: edit that logged set. Otherwise log a new one, prefilled from the last set today or the target. */
  let { exercise: ex, set = null, groupId, done, onclose } = $props()

  // the sheet is mounted per tap, so it works on a snapshot of what was on screen at that moment
  const { timed, index, initial } = untrack(() => {
    const timed = ex.type === 'time'
    const source = set ?? done.at(-1)
    return {
      timed,
      index: set ? done.findIndex(s => s.id === set.id) + 1 : done.length + 1,
      initial: {
        amount: timed ? source?.seconds ?? ex.seconds : source?.reps ?? ex.reps,
        kg: source ? source.kg ?? '' : ex.kg ?? '',
      },
    }
  })
  let amount = $state(initial.amount)
  let kg = $state(initial.kg)

  const step = (field, d) => {
    if (field === 'amount') amount = Math.max(0, (+amount || 0) + d)
    else kg = Math.max(0, (+kg || 0) + d)
  }
  const values = () => ({
    reps: timed ? null : +amount || 0,
    seconds: timed ? +amount || 0 : null,
    kg: kg === '' || kg == null ? null : +kg,
  })

  async function submit(e) {
    e.preventDefault()
    if (set) {
      await repo.updateSet(set.id, values())
      notify($t('saved'))
    } else {
      const id = await repo.logSet({ exerciseId: ex.id, groupId, ...values() })
      notify(`${$t('logged')} · ${ex.name} ${index}/${ex.sets}`, { label: $t('undo'), run: () => repo.deleteSet(id) })
    }
    onclose()
  }

  async function remove() {
    await repo.deleteSet(set.id)
    notify($t('deleted'), { label: $t('undo'), run: () => repo.restoreSet(set) })
    onclose()
  }
</script>

<Sheet title={ex.name} {onclose}>
  <form onsubmit={submit} class="stack">
    <div class="muted">{$t('set')} {index} {$t('of')} {ex.sets}{ex.perSide ? ` · ${$t('perSide')}` : ''}</div>
    <div class="field">
      <span class="muted">{timed ? $t('seconds') : $t('reps')}</span>
      <div class="row">
        <button type="button" class="icon" aria-label="−" onclick={() => step('amount', timed ? -5 : -1)}><Icon name="minus" /></button>
        <input name="amount" type="number" inputmode="numeric" min="0" bind:value={amount} aria-label={timed ? $t('seconds') : $t('reps')} />
        <button type="button" class="icon" aria-label="+" onclick={() => step('amount', timed ? 5 : 1)}><Icon name="plus" /></button>
      </div>
    </div>
    <div class="field">
      <span class="muted">{$t('kg')} <span class="small">({$t('weightHint')})</span></span>
      <div class="row">
        <button type="button" class="icon" aria-label="−" onclick={() => step('kg', -1)}><Icon name="minus" /></button>
        <input name="kg" type="number" inputmode="decimal" min="0" step="0.5" bind:value={kg} aria-label={$t('kg')} />
        <button type="button" class="icon" aria-label="+" onclick={() => step('kg', 1)}><Icon name="plus" /></button>
      </div>
    </div>
    <div class="row">
      {#if set}<button type="button" class="danger" onclick={remove}>{$t('delete')}</button>{/if}
      <button type="submit" class="primary grow">{set ? $t('save') : $t('logSet')}</button>
    </div>
  </form>
</Sheet>

<style>
  .field { display: grid; gap: 4px; }
  input { text-align: center; font-size: 26px; font-weight: 700; min-height: 56px; }
  .field button { width: 56px; min-height: 56px; }
  button[type='submit'] { min-height: 56px; font-size: 17px; }
</style>
