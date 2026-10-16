<script>
  import Icon from './Icon.svelte'
  import { t } from '../lib/i18n.js'
  import { settings } from '../lib/settings.js'
  import { setLabel } from '../lib/summary.js'
  import { compact } from '../lib/history.js'

  let { exercise: ex, sets, last = null, bests = new Set(), onlog, onedit } = $props()
  let open = $state(false)

  const target = $derived(
    `${ex.sets} × ${ex.type === 'time' ? `${ex.seconds}s` : ex.reps}${ex.perSide ? ` (${$t('perSide')})` : ''}` +
    (ex.kg != null ? ` · ${ex.kg} kg` : ` · ${$t('bodyweight')}`))
  const done = $derived(sets.length >= ex.sets)
  const bestToday = $derived(sets.some(s => bests.has(s.id)))
  /** "Tue" within the last week, "12 Oct" before that */
  const when = $derived.by(() => {
    if (!last) return ''
    const [y, m, d] = last.date.split('-').map(Number)
    const day = new Date(y, m - 1, d)
    const recent = Date.now() - day < 6 * 864e5
    return new Intl.DateTimeFormat($settings.lang, recent ? { weekday: 'short' } : { day: 'numeric', month: 'short' }).format(day)
  })
</script>

<div class="row main">
  <button class="ghost grow name" onclick={() => (open = !open)} aria-expanded={open}>
    <span class="title">{ex.name}</span>
    <span class="muted small">{target}</span>
    {#if last}<span class="last small" data-testid="last">{$t('last')}: {compact(last.sets)} · {when}</span>{/if}
  </button>
  {#if bestToday}<span class="flame" title={$t('best')}><Icon name="flame" size={18} /></span>{/if}
  <span class="count" class:done data-testid="count">{sets.length}/{ex.sets}</span>
  <button class="icon primary plus" aria-label="{$t('logSet')}: {ex.name}" onclick={onlog}><Icon name="plus" /></button>
</div>

{#if open}
  <div class="more">
    {#if ex.desc}<p class="desc">{ex.desc}</p>{/if}
    {#if ex.link}<a href={ex.link} target="_blank" rel="noopener noreferrer" class="row small"><Icon name="video" size={18} /> {$t('watch')}</a>{/if}
    {#if sets.length}
      <div class="chips">
        {#each sets as s, i (s.id)}
          <button class="chip" onclick={() => onedit(s)}>{i + 1}: {setLabel(s)}{#if bests.has(s.id)}<span class="flame" aria-label={$t('best')}><Icon name="flame" size={15} /></span>{/if}</button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .main { padding: 6px 8px 6px 4px; }
  .name { display: grid; justify-items: start; text-align: left; gap: 2px; padding: 6px 8px; height: auto; }
  .title { font-weight: 700; }
  .last { color: var(--muted); }
  .flame { color: var(--flame); display: inline-flex; vertical-align: -2px; margin-left: 2px; }
  .count { font-variant-numeric: tabular-nums; color: var(--muted); min-width: 3ch; text-align: right; }
  .count.done { color: var(--ok); font-weight: 700; }
  .more { padding: 0 12px 12px; display: grid; gap: 8px; }
  .desc { margin: 0; white-space: pre-wrap; font-size: 14px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { min-height: 34px; padding: 0 10px; border-radius: 999px; font-size: 13px; background: var(--soft); }
</style>
