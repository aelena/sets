<script>
  import { settings } from '../lib/settings.js'
  import { t } from '../lib/i18n.js'

  /** entries: changelog entries to show, newest first; ok(): remember this version as seen. */
  let { version, entries, ok } = $props()
</script>

<div class="backdrop" role="presentation"></div>
<div class="card whatsnew" role="dialog" aria-modal="true" aria-label={$t('whatsNew')}>
  <div class="brand">Sets <span data-testid="whatsnew-version">{version}</span></div>
  <h2>{$t('whatsNew')}</h2>
  {#each entries as e (e.version)}
    <section>
      {#if entries.length > 1}<div class="v muted small">{e.version}</div>{/if}
      <ul>{#each e[$settings.lang] ?? e.en as line}<li>{line}</li>{/each}</ul>
    </section>
  {/each}
  <button class="primary ok" onclick={ok}>OK</button>
</div>

<style>
  .backdrop { position: fixed; inset: 0; z-index: 60; background: #000a; }
  .whatsnew {
    position: fixed; z-index: 61; left: 16px; right: 16px; top: 50%; transform: translateY(-50%);
    max-width: 440px; margin: 0 auto; max-height: 80dvh; overflow-y: auto; padding: 20px 20px 16px;
  }
  .brand { font-size: 26px; font-weight: 700; }
  .brand span { color: var(--accent); }
  h2 { margin: 6px 0 12px; }
  section + section { margin-top: 12px; }
  .v { margin-bottom: 4px; font-variant-numeric: tabular-nums; }
  ul { margin: 0; padding-left: 20px; display: grid; gap: 6px; }
  .ok { width: 100%; min-height: 52px; margin-top: 18px; font-size: 18px; }
</style>
