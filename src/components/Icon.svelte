<script>
  import { FLAME } from '../lib/recap.js'
  let { name, size = 22 } = $props()
  const filled = ['play', 'stop', 'flame']
  const paths = {
    play: 'M8 5v14l11-7z',
    stop: 'M7 7h10v10H7z',
    rest: 'M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9',
    bubble: 'M4 5h16v11H9l-5 4z',
    plus: 'M12 5v14M5 12h14',
    train: 'M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12',
    chart: 'M4 20V4M4 20h16M8 16l4-5 3 3 5-7',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
    gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1',
    up: 'M6 15l6-6 6 6',
    down: 'M6 9l6 6 6-6',
    back: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
    x: 'M6 6l12 12M18 6 6 18',
    minus: 'M5 12h14',
    video: 'M4 6h12v12H4zM16 10l5-3v10l-5-3',
    flame: FLAME,
  }
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill={filled.includes(name) ? 'currentColor' : 'none'}
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={paths[name]} />
</svg>
