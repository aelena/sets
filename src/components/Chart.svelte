<script>
  import uPlot from 'uplot'
  import 'uplot/dist/uPlot.min.css'
  import { settings } from '../lib/settings.js'

  /**
   * One series over time, one axis. `points`: [{ x: epoch ms, y }].
   * kind 'line' (default) or 'bar'; `step` is the spacing of the x values in days (7 for weekly bars),
   * `when` formats the hovered x for the readout; `format(y, point)` its value.
   */
  let { points, label, format = v => String(v), kind = 'line', step = 1, when = null } = $props()
  const DAY = 86400
  // from the data, not uPlot's arguments: with one point uPlot widens the span by years
  const xRange = () => {
    const xs = points.map(p => p.x / 1000), lo = Math.min(...xs), hi = Math.max(...xs)
    const pad = kind === 'bar' ? DAY * step * 0.6 : DAY * (hi - lo < 2 * DAY ? 3 : 0.5)
    return [lo - pad, hi + pad]
  }
  let el = $state()
  let hover = $state(null)

  const fmtDate = ms => new Intl.DateTimeFormat($settings.lang, { day: 'numeric', month: 'short' }).format(ms)
  const shown = $derived(hover ?? points.at(-1))

  $effect(() => {
    $settings.theme; $settings.font // repaint when either changes
    if (!el || !points.length) return
    const css = getComputedStyle(document.documentElement)
    const v = name => css.getPropertyValue(name).trim()
    const font = `12px ${v('--font')}`
    const axis = { stroke: v('--muted'), font, grid: { stroke: v('--line'), width: 1 }, ticks: { show: false } }
    const series = kind === 'bar'
      ? { label, fill: v('--accent'), stroke: v('--accent'), width: 0, paths: uPlot.paths.bars({ size: [0.6, 36], radius: 0.25 }), points: { show: false } }
      : { label, stroke: v('--accent'), width: 2, points: { show: true, size: 8, fill: v('--accent'), stroke: v('--card') } }
    const plot = new uPlot({
      width: el.clientWidth, height: 200,
      legend: { show: false },
      cursor: { y: false, points: { size: kind === 'bar' ? 0 : 10 } },
      scales: { x: { time: true, range: () => xRange() }, y: { range: (u, min, max) => [0, max ? max * 1.15 : 1] } },
      axes: [
        { ...axis, space: 56, incrs: [1, 2, 7, 14, 28, 91, 182, 365].map(d => d * DAY), values: (u, ticks) => ticks.map(t => fmtDate(t * 1000)) },
        { ...axis, size: 44, values: (u, ticks) => ticks.map(v => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)) },
      ],
      series: [{}, series],
      hooks: {
        setCursor: [u => {
          const i = u.cursor.idx
          hover = i == null ? null : points[i]
        }],
      },
    }, [points.map(p => p.x / 1000), points.map(p => p.y)], el)
    const ro = new ResizeObserver(() => plot.setSize({ width: el.clientWidth, height: 200 }))
    ro.observe(el)
    return () => { ro.disconnect(); plot.destroy() }
  })
</script>

{#if shown}
  <div class="readout" aria-live="polite"><strong>{format(shown.y, shown)}</strong> <span class="muted">{when ? when(shown.x) : fmtDate(shown.x)}</span></div>
{/if}
<div bind:this={el} class="chart"></div>

<style>
  .readout { font-size: 20px; margin: 4px 0 2px; font-variant-numeric: tabular-nums; }
  .readout span { font-size: 14px; }
  .chart { width: 100%; min-height: 200px; touch-action: pan-y; }
</style>
