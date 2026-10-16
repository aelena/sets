<script>
  import Icon from './Icon.svelte'
  import { settings } from '../lib/settings.js'
  import { t } from '../lib/i18n.js'
  const tabs = [['train', 'train'], ['progress', 'chart'], ['edit', 'edit'], ['settings', 'gear']]
</script>

<nav>
  {#each tabs as [id, icon]}
    <button class="ghost" aria-current={$settings.tab === id ? 'page' : undefined} onclick={() => ($settings.tab = id)}>
      <Icon name={icon} />
      <span>{$t(id)}</span>
    </button>
  {/each}
</nav>

<style>
  nav {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; display: flex;
    height: calc(var(--tab-h) + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom);
    background: var(--bg); border-top: 1px solid var(--line);
  }
  button { flex: 1; height: 100%; display: grid; place-items: center; gap: 0; border-radius: 0; color: var(--muted); padding: 6px 0 4px; }
  span { font-size: 11px; }
  [aria-current='page'] { color: var(--fg); font-weight: 700; }
</style>
