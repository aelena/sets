<script>
  import { onMount, onDestroy } from 'svelte'
  import Sheet from './Sheet.svelte'
  import { db, repo } from '../lib/store.js'
  import { settings, FONTS } from '../lib/settings.js'
  import { t, partnerLabel } from '../lib/i18n.js'
  import { recapData, GRADIENTS } from '../lib/recap.js'
  import { drawRecap, toJpeg, loadImage, PHOTOS } from '../lib/recapImage.js'
  import { deliver, deliverAll } from '../lib/export.js'
  import { dateKey, slugify } from '../lib/time.js'

  let { session, onclose } = $props()

  // one recap per person: the user's, and the partner's when they logged sets in this session
  let datas = $state(null) // { me, partner | null }
  let who = $state('me')
  const data = $derived(datas ? datas[who] : null)
  const partnerName = $derived(session.partner?.name ?? partnerLabel($settings, $t))
  const myName = $derived($settings.userName?.trim() || $t('me'))
  const nameFor = w => (w === 'partner' ? partnerName : $settings.userName)
  let picked = $state(null) // { url, img } from the photo library; kept for this sheet only
  let preview = $state('')
  let blob = $state(null)
  let busy = $state(false)
  let title = $state(session.recapTitle ?? '')
  let saveTimer
  // the title is kept with the session, so the recap can be made again with it; both images carry it
  function retitle(v) {
    title = v
    if (datas) datas = { me: { ...datas.me, title: v.trim() }, partner: datas.partner && { ...datas.partner, title: v.trim() } }
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { saveTimer = null; repo.setRecapTitle(session.id, v) }, 400)
  }

  // load once: this session's sets, plus each exercise's whole history for personal bests, per person
  onMount(async () => {
    if ($settings.recapBg === 'picked') $settings.recapBg = 'ink' // a picked photo is not kept between openings
    // the session prop may be a snapshot from before a title was saved: read the stored one
    const stored = await db.sessions.get(session.id)
    if (stored?.recapTitle && !title) title = stored.recapTitle
    const [sets, theirs] = await Promise.all([db.sets.where('sessionId').equals(session.id).toArray(), repo.partnerSetsOf(session.id)])
    const ids = [...new Set([...sets, ...theirs].map(s => s.exerciseId))]
    const [history, theirHistory, exercises, activityLogs, activities, groups] = await Promise.all([
      db.sets.where('exerciseId').anyOf(ids).toArray(), theirs.length ? db.partnerSets.where('exerciseId').anyOf(ids).toArray() : [],
      db.exercises.bulkGet(ids), db.activityLogs.where('sessionId').equals(session.id).toArray(), db.activities.toArray(),
      db.groups.toArray(),
    ])
    const common = {
      session: { ...session, recapTitle: title },
      groupsById: Object.fromEntries(groups.map(g => [g.id, g])), lang: $settings.lang,
      exercisesById: Object.fromEntries(exercises.filter(Boolean).map(e => [e.id, e])),
      activitiesById: Object.fromEntries(activities.map(a => [a.id, a])),
    }
    datas = {
      me: recapData({ ...common, sets, history, activityLogs }),
      // the partner shares the session's time and rests; the activities (a run) are the user's own
      partner: theirs.length ? recapData({ ...common, sets: theirs, history: theirHistory, activityLogs: [] }) : null,
    }
  })

  const bg = $derived($settings.recapBg)
  const photoUrl = id => PHOTOS.find(p => p.id === id)?.url

  async function background(choice) {
    if (choice === 'picked' && picked) return { image: picked.img }
    if (choice?.startsWith('photo:') && photoUrl(choice.slice(6))) return { image: await loadImage(photoUrl(choice.slice(6))) }
    return { gradient: GRADIENTS[choice] ?? GRADIENTS.ink }
  }

  /** The current look (format, detail, background, font, words) applied to one person's data. */
  async function render(d, userName) {
    const family = FONTS[$settings.font] ?? FONTS['JetBrains Mono']
    const L = { sets: $t('sets'), exercises: $t('exercises'), volume: $t('volume'), rests: $t('rests'), bests: $t('bests'), bestOne: `1 ${$t('bestOne')}`, more: n => $t('moreExercises', { n }), pitch: $t('pitch'), untimedSession: $t('untimedSession'), gym: $t('gymPart'),
      muscle: k => (k.startsWith('mu:') ? $t(`mu_${k.slice(3)}`) : k.slice(6)) }
    const canvas = await drawRecap(d, { format: $settings.recapFormat, detail: $settings.recapDetail, background: await background(bg), family, lang: $settings.lang, userName, L })
    return toJpeg(canvas)
  }

  let run = 0
  $effect(() => {
    const d = data, name = nameFor(who)
    // read here so the preview follows every change of look
    void [$settings.recapFormat, $settings.recapDetail, bg, $settings.lang, $settings.font, $t, picked]
    if (!d) return
    const mine = ++run
    ;(async () => {
      const b = await render(d, name)
      if (mine !== run) return
      if (preview) URL.revokeObjectURL(preview)
      blob = b
      preview = URL.createObjectURL(b)
    })()
  })

  const fileName = w => `sets-recap-${dateKey(session.start)}${w === 'partner' ? `-${slugify(partnerName) || 'partner'}` : ''}.jpg`

  /** Both images in one share sheet: the one on screen as it is, the other rendered the same way. */
  async function shareBoth() {
    busy = true
    try {
      const other = who === 'partner' ? 'me' : 'partner'
      const pair = [[blob, fileName(who)], [await render(datas[other], nameFor(other)), fileName(other)]]
      await deliverAll(who === 'partner' ? pair.reverse() : pair)
    } finally { busy = false }
  }

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
    try { await deliver(blob, fileName(who)) } finally { busy = false }
  }

  onDestroy(() => {
    if (saveTimer) { clearTimeout(saveTimer); repo.setRecapTitle(session.id, title) } // closed before the pause: save now
    if (preview) URL.revokeObjectURL(preview)
    if (picked) URL.revokeObjectURL(picked.url)
  })
</script>

<Sheet title={$t('recap')} {onclose}>
  <div class="stack">
    {#if datas?.partner}
      <div class="segmented" role="group" aria-label={$t('whoLogs')} data-testid="recap-who">
        <button aria-pressed={who === 'me'} onclick={() => (who = 'me')}>{myName}</button>
        <button aria-pressed={who === 'partner'} onclick={() => (who = 'partner')}>{partnerName}</button>
      </div>
    {/if}
    <div class="segmented">
      <button aria-pressed={$settings.recapFormat === 'story'} onclick={() => ($settings.recapFormat = 'story')}>{$t('story')}</button>
      <button aria-pressed={$settings.recapFormat === 'post'} onclick={() => ($settings.recapFormat = 'post')}>{$t('post')}</button>
    </div>

    <label>{$t('recapTitle')}
      <input value={title} oninput={e => retitle(e.currentTarget.value)} maxlength="60" placeholder={$t('recapTitleHint')} data-testid="recap-title" />
    </label>

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
    {#if datas?.partner}<button disabled={!blob || busy} onclick={shareBoth}>{$t('shareBoth')}</button>{/if}
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
