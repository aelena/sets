<script>
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { repo, activeRest, shownSummary } from './lib/store.js'
  import { settings } from './lib/settings.js'
  import { t, summaryWords } from './lib/i18n.js'
  import TabBar from './components/TabBar.svelte'
  import Toast from './components/Toast.svelte'
  import RestTimer from './components/RestTimer.svelte'
  import SummaryModal from './components/SummaryModal.svelte'
  import Train from './views/Train.svelte'
  import Progress from './views/Progress.svelte'
  import Edit from './views/Edit.svelte'
  import Settings from './views/Settings.svelte'

  let ready = $state(false)

  const closeStale = async () => {
    const closed = await repo.autoCloseStale(summaryWords(get(t)))
    if (closed) shownSummary.set(closed)
  }

  onMount(async () => {
    await repo.seedIfEmpty()
    navigator.storage?.persist?.().catch(() => {})
    await closeStale()
    ready = true
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
{/if}
