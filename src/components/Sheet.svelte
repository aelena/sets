<script>
  /** Bottom sheet: the phone-native way to ask for a couple of numbers without leaving the list. */
  import { onMount } from 'svelte'
  import { toast } from '../lib/store.js'
  let { title, onclose, children } = $props()
  onMount(() => toast.set(null))
</script>

<div class="backdrop" onclick={onclose} role="presentation"></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={title}>
  <div class="head">
    <strong class="grow">{title}</strong>
    <button class="icon ghost" onclick={onclose} aria-label="Close">✕</button>
  </div>
  {@render children()}
</div>

<style>
  .backdrop { position: fixed; inset: 0; background: #0007; z-index: 20; animation: fade .15s; }
  .sheet {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 21; max-height: 88dvh; overflow: auto;
    background: var(--bg); border-radius: 16px 16px 0 0; padding: 12px 16px calc(16px + env(safe-area-inset-bottom));
    max-width: 640px; margin: 0 auto; animation: up .18s ease-out;
  }
  .head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .head strong { font-size: 17px; }
  @keyframes up { from { transform: translateY(30%); opacity: .4 } }
  @keyframes fade { from { opacity: 0 } }
</style>
