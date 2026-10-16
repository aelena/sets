<script>
  import { untrack } from 'svelte'
  import Sheet from './Sheet.svelte'
  import { repo, notify } from '../lib/store.js'
  import { t } from '../lib/i18n.js'
  import { settings } from '../lib/settings.js'
  import { nameOf } from '../lib/names.js'
  import { parsePace, formatPace, activityLabel } from '../lib/activity.js'

  /**
   * activity null: a free-form "other" activity, named here.
   * log given: edit that entry. Otherwise a new one, prefilled from `last`.
   */
  let { activity = null, log = null, last = null, onclose } = $props()

  const round = (v, d) => String(Math.round(v * 10 ** d) / 10 ** d)
  const init = untrack(() => {
    const src = log ?? last
    return {
      minutes: src?.minutes != null ? round(src.minutes, 1) : '',
      km: src?.km != null ? round(src.km, 2) : '',
      pace: src?.minutes && src?.km ? formatPace(src.minutes / src.km) : '',
      notes: log?.notes ?? '',
    }
  })
  let name = $state('')
  let minutes = $state(init.minutes)
  let km = $state(init.km)
  let pace = $state(init.pace)
  let notes = $state(init.notes)
  let error = $state('')

  // the two fields touched last decide the third, which is filled in as you type
  let recent = ['minutes', 'km']
  const value = f => (f === 'pace' ? parsePace(pace) : +String({ minutes, km }[f]).replace(',', '.') || null)
  function edited(field) {
    recent = [field, ...recent.filter(f => f !== field)].slice(0, 2)
    const [a, b] = recent
    if (!value(a) || !value(b)) return
    const m = value('minutes'), k = value('km'), p = value('pace')
    const third = ['minutes', 'km', 'pace'].find(f => !recent.includes(f))
    if (third === 'km') km = round(m / p, 2)
    if (third === 'minutes') minutes = round(k * p, 1)
    if (third === 'pace') pace = formatPace(m / k)
  }

  const preview = $derived.by(() => {
    const m = +String(minutes).replace(',', '.') || null, k = +String(km).replace(',', '.') || null
    return activityLabel({ minutes: m, km: k })
  })

  async function submit(e) {
    e.preventDefault()
    error = ''
    const values = { minutes: String(minutes).replace(',', '.'), km: String(km).replace(',', '.'), pace, notes }
    if (log) {
      await repo.updateActivityLog(log.id, values)
      notify($t('saved'))
      return onclose()
    }
    if (!activity && !name.trim()) return
    const target = activity ?? (await repo.ensureActivity(name))
    const id = await repo.logActivity({ activityId: target.id, ...values })
    if (id == null) { error = $t('nothingMeasured'); return }
    notify(`${$t('logged')} · ${nameOf(target, $settings.lang)} ${preview}`, { label: $t('undo'), run: () => repo.deleteActivityLog(id) })
    onclose()
  }

  async function remove() {
    await repo.deleteActivityLog(log.id)
    notify($t('deleted'), { label: $t('undo'), run: () => repo.restoreActivityLog(log) })
    onclose()
  }
</script>

<Sheet title={activity ? nameOf(activity, $settings.lang) : $t('otherActivity')} {onclose}>
  <form class="stack" onsubmit={submit}>
    {#if !activity}
      <label>{$t('activityName')}<input bind:value={name} required placeholder="Swimming, Hike, Yoga…" /></label>
    {/if}
    <div class="muted small">{$t('fillTwo')}</div>
    <div class="row">
      <label class="grow">{$t('duration')}
        <input inputmode="decimal" bind:value={minutes} oninput={() => edited('minutes')} placeholder="30" />
      </label>
      <label class="grow">{$t('distance')}
        <input inputmode="decimal" bind:value={km} oninput={() => edited('km')} placeholder="5" />
      </label>
    </div>
    <label>{$t('pace')}
      <input inputmode="text" bind:value={pace} oninput={() => edited('pace')} placeholder={$t('paceHint')} autocapitalize="off" autocomplete="off" />
    </label>
    <label>{$t('activityNotes')}<input bind:value={notes} /></label>
    {#if preview}<div class="preview" data-testid="activity-preview">{preview}</div>{/if}
    {#if error}<div class="err" role="alert">{error}</div>{/if}
    <div class="row">
      {#if log}<button type="button" class="danger" onclick={remove}>{$t('delete')}</button>{/if}
      <button type="submit" class="primary grow">{log ? $t('save') : $t('logActivity')}</button>
    </div>
  </form>
</Sheet>

<style>
  input { font-size: 18px; }
  .preview { font-size: 20px; font-weight: 700; text-align: center; font-variant-numeric: tabular-nums; }
  .err { color: var(--danger); }
  button[type='submit'] { min-height: 56px; font-size: 17px; }
</style>
