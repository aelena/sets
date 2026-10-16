<script>
  import { onMount, onDestroy } from 'svelte'
  import Sheet from './Sheet.svelte'
  import { db } from '../lib/store.js'
  import { settings, FONTS } from '../lib/settings.js'
  import { t } from '../lib/i18n.js'
  import { recapData, GRADIENTS } from '../lib/recap.js'
  import { BESTS_AFTER_SESSIONS } from '../lib/history.js'
  import { drawRecap, toJpeg, loadImage, PHOTOS } from '../lib/recapImage.js'
  import { deliver } from '../lib/export.js'
  import { dateKey } from '../lib/time.js'

  let { session, onclose } = $props()

  let data = $state(null)
  let picked = $state(null) // { url, img } from the photo library; kept for this sheet only
  let preview = $state('')
  let blob = $state(null)
  let busy = $state(false)

  // load once: this session's sets, plus each exercise's whole history for personal bests
  onMount(async () => {
    if ($settings.recapBg === 'picked') $settings.recapBg = 'ink' // a picked photo is not kept between openings
    const sets = await db.sets.where('sessionId').equals(session.id).toArray()
    const ids = [...new Set(sets.map(s => s.exerciseId))]
    const [history, exercises, activityLogs, activities, done, groups] = await Promise.all([
      db.sets.where('exerciseId').anyOf(ids).toArray(), db.exercises.bulkGet(ids),
      db.activityLogs.where('sessionId').equals(session.id).toArray(), db.activities.toArray(),
      db.sessions.filter(s => !!s.end).count(), db.groups.toArray(),
    ])
    data = recapData({
      session, sets, history, activityLogs, bestsEnabled: done >= BESTS_AFTER_SESSIONS,
      groupsById: Object.fromEntries(groups.map(g => [g.id, g])),
      exercisesById: Object.fromEntries(exercises.filter(Boolean).map(e => [e.id, e])),
      activitiesById: Object.fromEntries(activities.map(a => [a.id, a])),
    })
  })

  const bg = $derived($settings.recapBg)
  const photoUrl = id => PHOTOS.find(p => p.id === id)?.url

  async function background(choice) {
    if (choice === 'picked' && picked) return { image: picked.img }
    if (choice?.startsWith('photo:') && photoUrl(choice.slice(6))) return { image: await loadImage(photoUrl(choice.slice(6))) }
    return { gradient: GRADIENTS[choice] ?? GRADIENTS.ink }
  }

  let run = 0
  $effect(() => {
    const d = data, format = $settings.recapFormat, detail = $settings.recapDetail, choice = bg, lang = $settings.lang, name = $settings.userName
    const family = FONTS[$settings.font] ?? FONTS['JetBrains Mono']
    const L = { sets: $t('sets'), exercises: $t('exercises'), volume: $t('volume'), rests: $t('rests'), bests: $t('bests'), bestOne: `1 ${$t('bestOne')}`, more: n => $t('moreExercises', { n }), pitch: $t('pitch'),
      muscle: k => (k.startsWith('mu:') ? $t(`mu_${k.slice(3)}`) : k.slice(6)) }
    picked // re-render when a new photo is picked
    if (!d) return
    const mine = ++run
    ;(async () => {
      const canvas = await drawRecap(d, { format, detail, background: await background(choice), family, lang, userName: name, L })
      const b = await toJpeg(canvas)
      if (mine !== run) return
      if (preview) URL.revokeObjectURL(preview)
      blob = b
      preview = URL.createObjectURL(b)
    })()
  })

  async function pick(e) {
    const file = e.currentTarget.files[0]
    e.currentTarget.value = ''
    if (!file) return
    if (picked) URL.revokeObjectURL(picked.url)
    const url = URL.createObjectURL(file)
    picked = { url, img: await loadImage(url) }
    $settings.recapBg = 'picked'
  }

  async function share() {
    busy = true
    try { await deliver(blob, `sets-recap-${dateKey(session.start)}.jpg`) } finally { busy = false }
  }

  onDestroy(() => { if (preview) URL.revokeObjectURL(preview); if (picked) URL.revokeObjectURL(picked.url) })
</script>

<Sheet title={$t('recap')} {onclose}>
  <div class="stack">
    <div class="segmented">
      <button aria-pressed={$settings.recapFormat === 'story'} onclick={() => ($settings.recapFormat = 'story')}>{$t('story')}</button>
      <button aria-pressed={$settings.recapFormat === 'post'} onclick={() => ($settings.recapFormat = 'post')}>{$t('post')}</button>
    </div>

    <div class="segmented" role="group" aria-label={$t('detail')}>
      <button aria-pressed={$settings.recapDetail === 'sparse'} onclick={() => ($settings.recapDetail = 'sparse')}>{$t('sparse')}</button>
      <button aria-pressed={$settings.recapDetail === 'full'} onclick={() => ($settings.recapDetail = 'full')}>{$t('full')}</button>
    </div>

    <div class="preview" class:post={$settings.recapFormat === 'post'}>
      {#if preview}<img src={preview} alt={$t('recap')} data-testid="recap-preview" />{/if}
    </div>

    <div class="muted small">{$t('background')}</div>
    <div class="bgs" role="radiogroup" aria-label={$t('background')}>
      {#each Object.entries(GRADIENTS) as [id, [a, b]]}
        <button class="bg" role="radio" aria-checked={bg === id} aria-label={id} style="background: linear-gradient(160deg, {a}, {b})"
          onclick={() => ($settings.recapBg = id)}></button>
      {/each}
      {#each PHOTOS as p (p.id)}
        <button class="bg" role="radio" aria-checked={bg === `photo:${p.id}`} aria-label={p.id} style="background-image: url({p.url})"
          onclick={() => ($settings.recapBg = `photo:${p.id}`)}></button>
      {/each}
      {#if picked}
        <button class="bg" role="radio" aria-checked={bg === 'picked'} aria-label={$t('fromPhotos')} style="background-image: url({picked.url})"
          onclick={() => ($settings.recapBg = 'picked')}></button>
      {/if}
      <label class="bg pick">{$t('fromPhotos')}<input type="file" accept="image/*" onchange={pick} /></label>
    </div>

    <button class="primary" disabled={!blob || busy} onclick={share}>{$t('share')}</button>
  </div>
</Sheet>

<style>
  .preview { display: grid; place-items: center; background: var(--soft); border-radius: var(--r); padding: 8px; }
  .preview img { height: 38dvh; max-width: 100%; aspect-ratio: 9 / 16; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 12px #0004; }
  .preview.post img { aspect-ratio: 4 / 5; }
  .bgs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
  .bg {
    flex: none; width: 64px; height: 64px; min-height: 64px; border-radius: var(--r); padding: 0;
    background-size: cover; background-position: center; border: 2px solid var(--line);
  }
  .bg[aria-checked='true'] { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent); }
  .pick { display: grid; place-items: center; font-size: 11px; text-align: center; color: var(--fg); position: relative; background: var(--card); cursor: pointer; }
  .pick input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
</style>
