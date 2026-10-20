<script>
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { repo, activeRest, shownSummary } from './lib/store.js'
  import { settings } from './lib/settings.js'
  import { t, summaryWords } from './lib/i18n.js'
  import { resumeDrive } from './lib/sessionFiles.js'
  import * as wake from './lib/wakeLock.js'
  import { watch, running as watchRunning } from './lib/stopwatch.js'
  import { activeSession, now, notify } from './lib/store.js'
  import { dateKey } from './lib/time.js'
  import TabBar from './components/TabBar.svelte'
  import Toast from './components/Toast.svelte'
  import RestTimer from './components/RestTimer.svelte'
  import SummaryModal from './components/SummaryModal.svelte'
  import Train from './views/Train.svelte'
  import Progress from './views/Progress.svelte'
  import Edit from './views/Edit.svelte'
  import Settings from './views/Settings.svelte'
  import Splash from './components/Splash.svelte'

  let ready = $state(false)

  // keep the screen on: always, or while a timed session or a rest is running, per Settings
  $effect(() => {
    const mode = $settings.keepAwake ?? 'session'
    wake.want(mode === 'always' || (mode === 'session' && (!!$activeSession || !!$activeRest || watchRunning($watch))))
  })

  const closeStale = async () => {
    const closed = await repo.autoCloseStale(summaryWords(get(t)))
    if (closed) shownSummary.set(closed)
    // a new day: loose sets from earlier days become their day's untimed session, counters start at 0
    const rolled = await repo.completeAdHoc(summaryWords(get(t)), { before: dateKey() })
    if (rolled.length) notify(get(t)('rolledOver', { n: rolled.length }), null, 6000)
  }

  // still open at midnight: roll over when the date changes
  const day = $derived(dateKey($now))
  let lastDay = null
  $effect(() => {
    const d = day
    if (lastDay && d !== lastDay && ready) closeStale()
    lastDay = d
  })

  onMount(async () => {
    await repo.applyPacks() // built-in groups this phone has not had yet; add-only
    navigator.storage?.persist?.().catch(() => {})
    await closeStale()
    ready = true
    resumeDrive() // back from Google's sign-in page?
    const onVisible = () => document.visibilityState === 'visible' && closeStale()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  })
</script>

{#if ready}
  {#if $settings.tab === 'progress'}<Progress />
  {:else if $settings.tab === 'edit'}<Edit />
  {:else if $settings.tab === 'settings'}<Settings />
  {:else}<Train />{/if}
  <TabBar />
  {#if $activeRest}<RestTimer rest={$activeRest} />{/if}
  {#if $shownSummary}<SummaryModal session={$shownSummary} onclose={() => shownSummary.set(null)} />{/if}
  <Toast />
{:else}
  <Splash />
{/if}
