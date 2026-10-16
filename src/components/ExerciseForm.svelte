<script>
  import { untrack } from 'svelte'
  import { t } from '../lib/i18n.js'
  import { groups } from '../lib/store.js'

  /** `exercise` null creates a new one. */
  let { exercise = null, onsave, oncancel, ondelete = null } = $props()
  // the form edits a copy; nothing is written until Save
  let f = $state(untrack(() => ({ name: '', type: 'reps', sets: 3, reps: 10, seconds: 30, desc: '', link: '', ...exercise,
    kg: exercise?.kg ?? '', perSide: !!exercise?.perSide })))
  const inGroups = $derived(exercise ? ($groups ?? []).filter(g => g.exerciseIds.includes(exercise.id)).map(g => g.name) : [])

  const submit = e => {
    e.preventDefault()
    if (!f.name.trim()) return
    onsave({ ...f, kg: f.kg === '' ? null : f.kg, reps: f.type === 'reps' ? f.reps : null, seconds: f.type === 'time' ? f.seconds : null })
  }
</script>

<form class="stack" onsubmit={submit}>
  <label>{$t('name')}<input bind:value={f.name} required /></label>
  <div class="segmented" role="group" aria-label={$t('type')}>
    <button type="button" aria-pressed={f.type === 'reps'} onclick={() => (f.type = 'reps')}>{$t('typeReps')}</button>
    <button type="button" aria-pressed={f.type === 'time'} onclick={() => (f.type = 'time')}>{$t('typeTime')}</button>
  </div>
  <div class="row">
    <label class="grow">{$t('targetSets')}<input type="number" inputmode="numeric" min="1" bind:value={f.sets} /></label>
    {#if f.type === 'reps'}
      <label class="grow">{$t('targetReps')}<input type="number" inputmode="numeric" min="0" bind:value={f.reps} /></label>
    {:else}
      <label class="grow">{$t('targetSeconds')}<input type="number" inputmode="numeric" min="0" bind:value={f.seconds} /></label>
    {/if}
    <label class="grow">{$t('weight')}<input type="number" inputmode="decimal" min="0" step="0.5" bind:value={f.kg} placeholder="—" /></label>
  </div>
  <label class="check"><input type="checkbox" bind:checked={f.perSide} /> {$t('perSide')}</label>
  <label>{$t('description')}<textarea bind:value={f.desc}></textarea></label>
  <label>{$t('link')}<input type="url" inputmode="url" bind:value={f.link} placeholder="https://youtube.com/…" /></label>
  {#if inGroups.length}<div class="muted small">{$t('inGroups')}: {inGroups.join(', ')}</div>{/if}
  <div class="row">
    {#if ondelete}<button type="button" class="danger" onclick={ondelete}>{$t('delete')}</button>{/if}
    <span class="grow"></span>
    <button type="button" onclick={oncancel}>{$t('cancel')}</button>
    <button type="submit" class="primary">{$t('save')}</button>
  </div>
</form>

<style>
  .check { display: flex; align-items: center; gap: 8px; color: var(--fg); font-size: 15px; }
  .check input { width: 22px; min-height: 22px; }
  textarea { min-height: 80px; }
</style>
