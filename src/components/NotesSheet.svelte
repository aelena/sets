<script>
  import { liveQuery } from 'dexie'
  import Sheet from './Sheet.svelte'
  import { db, repo, activeSession } from '../lib/store.js'
  import { t } from '../lib/i18n.js'
  import { dateKey, hhmm } from '../lib/time.js'

  let { onclose } = $props()
  let text = $state('')

  /** Notes of the running session, or of today when training ad hoc. */
  const notes = liveQuery(async () => {
    const s = await repo.activeSession()
    return s ? db.notes.where('sessionId').equals(s.id).sortBy('ts') : db.notes.where('date').equals(dateKey()).sortBy('ts')
  })

  async function save(e) {
    e.preventDefault()
    if (!text.trim()) return
    await repo.addNote(text)
    text = ''
  }
</script>

<Sheet title={$t('notes')} {onclose}>
  <form onsubmit={save} class="stack">
    <textarea bind:value={text} placeholder={$t('notePlaceholder')} aria-label={$t('notes')}></textarea>
    <div class="row">
      <span class="grow muted small">{$t('noteFor')} {$activeSession ? $t('thisSession') : $t('thisDay')}</span>
      <button type="submit" class="primary" disabled={!text.trim()}>{$t('addNote')}</button>
    </div>
  </form>
  {#if $notes?.length}
    <ul class="list notes">
      {#each [...$notes].reverse() as n (n.id)}
        <li class="row">
          <div class="grow"><span class="muted small">{hhmm(n.ts)}</span><p>{n.text}</p></div>
          <button class="icon ghost danger" aria-label={$t('delete')} onclick={() => repo.deleteNote(n.id)}>✕</button>
        </li>
      {/each}
    </ul>
  {/if}
</Sheet>

<style>
  .notes { margin-top: 12px; }
  .notes li { padding: 8px 0; align-items: flex-start; }
  p { margin: 2px 0 0; white-space: pre-wrap; }
</style>
