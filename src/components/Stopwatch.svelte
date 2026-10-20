<script>
  import { onMount } from 'svelte'
  import Icon from './Icon.svelte'
  import { t } from '../lib/i18n.js'
  import { settings } from '../lib/settings.js'
  import { watch, elapsed, running, start, stop, lap, reset, lapRows, fmt } from '../lib/stopwatch.js'

  let { onclose } = $props()

  // redraw every frame while visible, so hundredths and the second hand move smoothly
  let tick = $state(Date.now())
  onMount(() => {
    let raf
    const loop = () => { tick = Date.now(); raf = requestAnimationFrame(loop) }
    loop()
    return () => cancelAnimationFrame(raf)
  })

  const ms = $derived(elapsed($watch, tick))
  const on = $derived(running($watch))
  const analog = $derived($settings.stopwatchFace === 'analog')
  const laps = $derived(lapRows($watch))

  // analog: one turn of the big hand per minute, the small dial counts 30 minutes
  const secAngle = $derived(((ms % 60000) / 60000) * 360)
  const minAngle = $derived(((ms % 1800000) / 1800000) * 360)
  const ticks = Array.from({ length: 60 }, (_, i) => i)
</script>

<div class="watch" role="dialog" aria-modal="true" aria-label={$t('stopwatch')}>
  <div class="top">
    <div class="segmented face" role="group" aria-label={$t('stopwatch')}>
      <button aria-pressed={!analog} onclick={() => ($settings.stopwatchFace = 'digital')}>{$t('digital')}</button>
      <button aria-pressed={analog} onclick={() => ($settings.stopwatchFace = 'analog')}>{$t('analog')}</button>
    </div>
    <button class="icon ghost" aria-label={$t('close')} onclick={onclose}><Icon name="x" /></button>
  </div>

  {#if analog}
    <svg class="dial" viewBox="0 0 200 200" role="img" aria-label={fmt(ms)}>
      <circle cx="100" cy="100" r="96" class="rim" />
      {#each ticks as i}
        <line x1="100" y1={i % 5 ? 10 : 6} x2="100" y2={i % 5 ? 15 : 20} transform="rotate({i * 6} 100 100)" class:major={i % 5 === 0} />
      {/each}
      {#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as n}
        {@const a = (n / 60) * 2 * Math.PI}
        <text x={100 + 70 * Math.sin(a)} y={104 - 70 * Math.cos(a)}>{n || 60}</text>
      {/each}
      <g transform="translate(100 130)">
        <circle r="20" class="sub" />
        <line x1="0" y1="0" x2="0" y2="-16" class="hand small" transform="rotate({minAngle})" />
      </g>
      <line x1="100" y1="114" x2="100" y2="14" class="hand" transform="rotate({secAngle} 100 100)" />
      <circle cx="100" cy="100" r="4" class="pin" />
    </svg>
    <div class="digits small-digits" data-testid="stopwatch-time">{fmt(ms)}</div>
  {:else}
    <div class="digits" data-testid="stopwatch-time">{fmt(ms)}</div>
  {/if}

  <div class="buttons">
    {#if on}
      <button class="big" onclick={() => ($watch = lap($watch))}>{$t('lap')}</button>
      <button class="big danger" onclick={() => ($watch = stop($watch))}>{$t('stop')}</button>
    {:else}
      <button class="big" disabled={!ms} onclick={() => ($watch = reset())}>{$t('reset')}</button>
      <button class="big primary" onclick={() => ($watch = start($watch))}>{$t('start')}</button>
    {/if}
  </div>

  {#if laps.length}
    <ol class="laps" data-testid="laps">
      {#each laps as l (l.n)}
        <li><span>{$t('lap')} {l.n}</span><span>{fmt(l.split)}</span><span class="muted">{fmt(l.total)}</span></li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .watch {
    position: fixed; inset: 0; z-index: 30; background: var(--bg); display: flex; flex-direction: column; align-items: center;
    padding: calc(env(safe-area-inset-top) + 12px) 16px calc(env(safe-area-inset-bottom) + 16px); gap: 18px; overflow-y: auto;
  }
  .top { display: flex; gap: 8px; width: 100%; max-width: 480px; align-items: center; }
  .face { flex: 1; }
  .digits { font-size: min(18vw, 96px); font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; margin-top: 8vh; }
  .small-digits { font-size: 32px; margin-top: 0; }
  .dial { width: min(78vw, 340px); margin-top: 3vh; }
  .rim { fill: var(--card); stroke: var(--line); stroke-width: 2; }
  line { stroke: var(--muted); stroke-width: 1; }
  line.major { stroke: var(--fg); stroke-width: 2; }
  text { font-size: 11px; fill: var(--fg); text-anchor: middle; font-family: var(--font); }
  .sub { fill: none; stroke: var(--line); stroke-width: 1.5; }
  .hand { stroke: var(--flame); stroke-width: 2.5; stroke-linecap: round; }
  .hand.small { stroke: var(--fg); stroke-width: 2; }
  .pin { fill: var(--flame); }
  .buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; max-width: 480px; }
  .big { min-height: 64px; font-size: 18px; border-radius: 999px; }
  .laps { list-style: none; margin: 0; padding: 0; width: 100%; max-width: 480px; font-variant-numeric: tabular-nums; }
  .laps li { display: grid; grid-template-columns: 1fr auto auto; gap: 16px; padding: 10px 4px; border-bottom: 1px solid var(--line); }
</style>
