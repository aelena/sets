<script>
  /** The shape of an imported run, no map: the track fitted into a box, start marked. */
  import { fitTrack, trackPath } from '../lib/gpx.js'
  let { track, height = 160 } = $props()
  const W = 320
  const pts = $derived(fitTrack(track, W, height, 12))
</script>

{#if pts.length}
  <svg class="route" viewBox="0 0 {W} {height}" role="img" aria-label="route" data-testid="route">
    <path d={trackPath(pts)} />
    <circle cx={pts[0][0]} cy={pts[0][1]} r="5" />
  </svg>
{/if}

<style>
  .route { width: 100%; height: auto; display: block; }
  path { fill: none; stroke: var(--fg); stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }
  circle { fill: var(--accent); }
</style>
