<script>
  import { toast } from '../lib/store.js'
  const act = async () => { const a = $toast?.action; toast.set(null); await a?.run() }
</script>

{#if $toast}
  <div class="toast" role="status">
    <span class="grow">{$toast.text}</span>
    {#if $toast.action}<button class="ghost" onclick={act}>{$toast.action.label}</button>{/if}
  </div>
{/if}

<style>
  .toast {
    position: fixed; left: 16px; right: 16px; z-index: 40; max-width: 600px; margin: 0 auto;
    bottom: calc(var(--tab-h) + env(safe-area-inset-bottom) + 12px);
    display: flex; align-items: center; gap: 8px; padding: 4px 4px 4px 14px; min-height: 48px;
    background: var(--fg); color: var(--bg); border-radius: var(--r); box-shadow: 0 4px 16px #0004;
  }
  button { color: var(--bg); font-weight: 700; text-decoration: underline; }
</style>
