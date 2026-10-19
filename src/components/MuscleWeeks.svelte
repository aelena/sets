<script>
  /**
   * Small multiples: one tiny weekly bar chart per muscle, all on the same y scale so they compare.
   * items: [{ key, label, counts: [n per week, oldest first] }]; starts: week start ms, same order.
   */
  let { items, starts, weekLabel, unit = '' } = $props()

  const max = $derived(Math.max(1, ...items.flatMap(i => i.counts)))
  const W = 120, H = 36, gap = 3
  const bw = $derived((W - gap * (starts.length - 1)) / starts.length)
  const fmt = v => (Math.round(v * 10) / 10).toLocaleString()
</script>

<div class="grid">
  {#each items as item (item.key)}
    <figure>
      <figcaption>
        <span class="name">{item.label}</span>
        <span class="now" title={weekLabel(starts.at(-1))}>{fmt(item.counts.at(-1))}{unit}</span>
      </figcaption>
      <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label="{item.label}: {item.counts.map(fmt).join(', ')}">
        <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} class="base" />
        {#each item.counts as n, i}
          {@const h = n ? Math.max(2, (n / max) * (H - 2)) : 0}
          <rect x={i * (bw + gap)} y={H - h} width={bw} height={h} rx="1.5" class:current={i === item.counts.length - 1}>
            <title>{weekLabel(starts[i])}: {fmt(n)}{unit}</title>
          </rect>
        {/each}
      </svg>
    </figure>
  {/each}
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; }
  figure { margin: 0; min-width: 0; }
  figcaption { display: flex; justify-content: space-between; gap: 6px; font-size: 13px; margin-bottom: 4px; }
  .name { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .now { color: var(--muted); font-variant-numeric: tabular-nums; flex: none; }
  svg { display: block; width: 100%; height: 40px; }
  rect { fill: var(--accent); opacity: .55; }
  rect.current { opacity: 1; }
  .base { stroke: var(--line); stroke-width: 1; }
</style>
