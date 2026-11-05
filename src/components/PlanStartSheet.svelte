<script>
  import { untrack } from 'svelte'
  import Sheet from './Sheet.svelte'
  import { t } from '../lib/i18n.js'
  import { settings } from '../lib/settings.js'
  import { addDays } from '../lib/plan.js'
  import { dateKey } from '../lib/time.js'

  /** The two things decided when a plan starts (import, start again, edit): its name and its first day. */
  let { title, name: initialName = '', start: initialStart = dateKey(), days, action, onsave, onclose } = $props()

  let name = $state(untrack(() => initialName))
  let start = $state(untrack(() => initialStart))
  const fmt = date => { const [y, m, d] = date.split('-').map(Number); return new Intl.DateTimeFormat($settings.lang, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d)) }
  const span = $derived(/^\d{4}-\d\d-\d\d$/.test(start) ? $t('planSpan', { start: fmt(start), end: fmt(addDays(start, days - 1)) }) : '')

  function submit(e) {
    e.preventDefault()
    if (!name.trim() || !span) return
    onsave({ name: name.trim(), start })
  }
</script>

<Sheet {title} {onclose}>
  <form class="stack" onsubmit={submit} data-testid="plan-start">
    <label>{$t('planName')}<input bind:value={name} required /></label>
    <label>{$t('planStart')}<input type="date" bind:value={start} required /></label>
    {#if span}<div class="muted small" data-testid="plan-span">{span} · {$t('planDays', { d: days })}</div>{/if}
    <button type="submit" class="primary" disabled={!name.trim() || !span}>{action}</button>
  </form>
</Sheet>

<style>
  input { font-size: 17px; }
  button[type='submit'] { min-height: 56px; font-size: 17px; }
</style>
