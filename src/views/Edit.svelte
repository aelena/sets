<script>
  import { repo, groups, exercises, activities, notify } from '../lib/store.js'
  import { t } from '../lib/i18n.js'
  import Icon from '../components/Icon.svelte'
  import ExerciseForm from '../components/ExerciseForm.svelte'
  import { settings } from '../lib/settings.js'
  import { nameOf } from '../lib/names.js'

  let seg = $state('groups')
  let groupId = $state(null) // group being edited
  let form = $state(null) // { exercise | null, addTo?: groupId }
  let picking = $state('')

  const exById = $derived(Object.fromEntries(($exercises ?? []).map(e => [e.id, e])))
  const group = $derived(($groups ?? []).find(g => g.id === groupId))
  const library = $derived(($exercises ?? []).filter(e => !e.archived).sort((a, b) => nameOf(a, $settings.lang).localeCompare(nameOf(b, $settings.lang))))
  const addable = $derived(library.filter(e => !group?.exerciseIds.includes(e.id)))

  const setIds = ids => repo.saveGroup({ ...$state.snapshot(group), exerciseIds: ids })
  const move = (i, d) => {
    const ids = [...group.exerciseIds]
    ;[ids[i], ids[i + d]] = [ids[i + d], ids[i]]
    setIds(ids)
  }

  async function newGroup() {
    const g = await repo.saveGroup({ name: $t('newGroup') })
    groupId = g.id
  }

  async function removeGroup() {
    if (!confirm($t('confirmDeleteGroup'))) return
    await repo.deleteGroup(group.id)
    groupId = null
  }

  async function saveExercise(raw) {
    const ex = await repo.saveExercise(raw)
    if (form.addTo && group && !group.exerciseIds.includes(ex.id)) await setIds([...group.exerciseIds, ex.id])
    form = null
    notify($t('saved'))
  }

  async function deleteExercise() {
    if (!confirm($t('confirmDeleteExercise'))) return
    await repo.deleteExercise(form.exercise.id)
    form = null
  }
</script>

<main class="view">
  {#if form}
    <h1 class="page-title">{form.exercise ? nameOf(form.exercise, $settings.lang) : $t('newExercise')}</h1>
    <ExerciseForm exercise={form.exercise} onsave={saveExercise} oncancel={() => (form = null)}
      ondelete={form.exercise ? deleteExercise : null} />
  {:else if group}
    <div class="row page-title">
      <button class="icon ghost" aria-label="Back" onclick={() => (groupId = null)}><Icon name="back" /></button>
      <strong class="grow">{$t('groups')}</strong>
    </div>
    <label>{$t('groupName')}
      <input value={group.name} onchange={e => e.currentTarget.value.trim() && repo.saveGroup({ ...$state.snapshot(group), name: e.currentTarget.value.trim() })} />
    </label>
    <label>{$t('nameEs')}
      <input value={group.names?.es ?? ''} onchange={e => repo.saveGroup({ ...$state.snapshot(group), names: { ...group.names, es: e.currentTarget.value.trim() } })} />
    </label>
    <ul class="list card items">
      {#each group.exerciseIds as id, i (id)}
        {@const ex = exById[id]}
        <li class="row">
          <button class="ghost grow left" onclick={() => (form = { exercise: ex })}>{ex ? nameOf(ex, $settings.lang) : id}</button>
          <button class="icon ghost" aria-label={$t('up')} disabled={i === 0} onclick={() => move(i, -1)}><Icon name="up" /></button>
          <button class="icon ghost" aria-label={$t('down')} disabled={i === group.exerciseIds.length - 1} onclick={() => move(i, 1)}><Icon name="down" /></button>
          <button class="icon ghost danger" aria-label="{$t('remove')}: {ex ? nameOf(ex, $settings.lang) : id}" onclick={() => setIds(group.exerciseIds.filter(x => x !== id))}><Icon name="x" /></button>
        </li>
      {/each}
    </ul>
    <div class="stack add">
      {#if addable.length}
        <div class="row">
          <select class="grow" bind:value={picking} aria-label={$t('addExisting')}>
            <option value="">{$t('addExisting')}…</option>
            {#each addable as e (e.id)}<option value={e.id}>{nameOf(e, $settings.lang)}</option>{/each}
          </select>
          <button disabled={!picking} onclick={() => { setIds([...group.exerciseIds, picking]); picking = '' }}><Icon name="plus" /></button>
        </div>
      {/if}
      <button onclick={() => (form = { exercise: null, addTo: group.id })}>{$t('newExercise')}</button>
      <button class="danger" onclick={removeGroup}>{$t('deleteGroup')}</button>
    </div>
  {:else}
    <h1 class="page-title">{$t('edit')}</h1>
    <div class="segmented">
      <button aria-pressed={seg === 'groups'} onclick={() => (seg = 'groups')}>{$t('groups')}</button>
      <button aria-pressed={seg === 'library'} onclick={() => (seg = 'library')}>{$t('library')}</button>
      <button aria-pressed={seg === 'activities'} onclick={() => (seg = 'activities')}>{$t('activity')}</button>
    </div>
    {#if seg === 'groups'}
      <ul class="list card items">
        {#each $groups ?? [] as g, i (g.id)}
          <li class="row">
            <button class="ghost grow left" onclick={() => (groupId = g.id)}>
              {nameOf(g, $settings.lang)} <span class="muted small">({g.exerciseIds.length})</span>
            </button>
            <button class="icon ghost" aria-label={$t('up')} disabled={i === 0} onclick={() => repo.moveGroup(g.id, -1)}><Icon name="up" /></button>
            <button class="icon ghost" aria-label={$t('down')} disabled={i === $groups.length - 1} onclick={() => repo.moveGroup(g.id, 1)}><Icon name="down" /></button>
          </li>
        {/each}
      </ul>
      <button class="add-btn" onclick={newGroup}>{$t('newGroup')}</button>
    {:else if seg === 'activities'}
      <ul class="list card items">
        {#each $activities ?? [] as a (a.id)}
          <li class="row">
            <input class="grow plain" value={a.name} aria-label="{$t('rename')}: {a.name}"
              onchange={e => repo.renameActivity(a.id, e.currentTarget.value)} />
            <input class="grow plain" value={a.names?.es ?? ''} placeholder="ES" aria-label="{$t('nameEs')}: {a.name}"
              onchange={e => repo.renameActivity(a.id, a.name, e.currentTarget.value)} />
            <button class="icon ghost danger" aria-label="{$t('remove')}: {a.name}"
              onclick={() => confirm($t('confirmDeleteActivity')) && repo.deleteActivity(a.id)}><Icon name="x" /></button>
          </li>
        {/each}
      </ul>
      <p class="muted small">{$t('otherActivity')} → {$t('train')}</p>
    {:else}
      <ul class="list card items">
        {#each library as e (e.id)}
          <li><button class="ghost left full" onclick={() => (form = { exercise: e })}>{nameOf(e, $settings.lang)}</button></li>
        {/each}
      </ul>
      <button class="add-btn" onclick={() => (form = { exercise: null })}>{$t('newExercise')}</button>
    {/if}
  {/if}
</main>

<style>
  .items { margin-top: 12px; }
  .items li { padding: 2px 4px; }
  .left { text-align: left; justify-content: flex-start; }
  .full { width: 100%; }
  .add { margin-top: 16px; }
  .add-btn { width: 100%; margin-top: 12px; }
  .plain { border-color: transparent; background: transparent; }
</style>
