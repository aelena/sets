<script>
  import { onMount } from 'svelte'
  import { repo, notify } from '../lib/store.js'
  import { settings, FONTS } from '../lib/settings.js'
  import { t } from '../lib/i18n.js'
  import { dateKey } from '../lib/time.js'
  import { deliver, jsonBlob, workbook } from '../lib/export.js'
  import { backupNow } from '../lib/backup.js'
  import * as drive from '../lib/drive.js'
  import * as wake from '../lib/wakeLock.js'
  import ShareApp from '../components/ShareApp.svelte'
  const wakeHeld = wake.held

  let persisted = $state(null)
  let driveOn = $state(drive.connected())
  let pending = $state(null) // parsed config waiting for merge / replace
  let error = $state('')
  let sharing = $state(false)

  onMount(async () => { persisted = (await navigator.storage?.persisted?.()) ?? false })

  const readJson = file => file.text().then(JSON.parse)
  const fail = e => (error = e.message ?? String(e))

  async function exportXlsx() {
    await deliver(await workbook(await repo.exportData()), `sets-log-${dateKey()}.xlsx`)
  }
  const exportConfig = async () => deliver(jsonBlob(await repo.configFile()), `sets-config-${dateKey()}.json`)

  async function chooseConfig(e) {
    error = ''
    const file = e.currentTarget.files[0]
    e.currentTarget.value = ''
    if (file) pending = await readJson(file).catch(fail)
  }
  async function applyConfig(mode) {
    try {
      const r = await repo.importConfig(pending, mode)
      notify($t('imported', { g: r.groups.length, e: r.exercises.length }) + (r.warnings.length ? ` · ${r.warnings.join('; ')}` : ''), null, 6000)
      $settings.groupId = null
    } catch (e) { fail(e) }
    pending = null
  }
  async function restore(e) {
    error = ''
    const file = e.currentTarget.files[0]
    e.currentTarget.value = ''
    if (!file || !confirm($t('confirmRestore'))) return
    try {
      const s = await repo.restore(await readJson(file))
      settings.update(cur => ({ ...cur, ...s, groupId: null }))
      notify($t('restored'))
    } catch (e) { fail(e) }
  }
</script>

<main class="view stack">
  <h1 class="page-title">{$t('settings')}</h1>

  <label>{$t('userName')}<input bind:value={$settings.userName} autocomplete="given-name" /></label>

  <div class="stack tight">
    <span class="muted small">{$t('language')}</span>
    <div class="segmented">
      <button aria-pressed={$settings.lang === 'en'} onclick={() => ($settings.lang = 'en')}>English</button>
      <button aria-pressed={$settings.lang === 'es'} onclick={() => ($settings.lang = 'es')}>Español</button>
    </div>
  </div>

  <div class="stack tight">
    <span class="muted small">{$t('theme')}</span>
    <div class="segmented">
      {#each [['system', 'themeSystem'], ['light', 'themeLight'], ['dark', 'themeDark']] as [v, k]}
        <button aria-pressed={$settings.theme === v} onclick={() => ($settings.theme = v)}>{$t(k)}</button>
      {/each}
    </div>
  </div>

  <div class="stack tight">
    <span class="muted small">{$t('keepAwake')}</span>
    <div class="segmented" role="group" aria-label={$t('keepAwake')}>
      {#each [['session', 'awakeSession'], ['always', 'awakeAlways'], ['off', 'awakeOff']] as [v, k]}
        <button aria-pressed={($settings.keepAwake ?? 'session') === v} onclick={() => ($settings.keepAwake = v)}>{$t(k)}</button>
      {/each}
    </div>
    <span class="muted small" data-testid="wake-status">{wake.supported ? ($wakeHeld ? $t('awakeOn') : $t('awakeIdle')) : $t('awakeUnsupported')}</span>
  </div>

  <div class="stack tight">
    <span class="muted small">{$t('font')}</span>
    <ul class="list card">
      {#each Object.entries(FONTS) as [name, family]}
        <li><button class="ghost font" style="font-family: {family}" aria-pressed={$settings.font === name}
          onclick={() => ($settings.font = name)}>{name} <span class="muted">0123 Halos ñ</span></button></li>
      {/each}
    </ul>
  </div>

  <h2>{$t('data')}</h2>
  <button onclick={exportXlsx}>{$t('exportXlsx')}</button>
  <button onclick={backupNow}>{$t('backup')}</button>
  <div class="muted small">{$t('lastBackup')}: {$settings.lastBackup ? new Date($settings.lastBackup).toLocaleString() : $t('never')}</div>
  <button onclick={exportConfig}>{$t('exportConfig')}</button>
  <label class="file">{$t('importConfig')}<input type="file" accept="application/json,.json" onchange={chooseConfig} /></label>
  {#if pending}
    <div class="card stack pad">
      <div class="small">{$t('importHow')}</div>
      <div class="row">
        <button class="grow" onclick={() => (pending = null)}>{$t('cancel')}</button>
        <button class="grow" onclick={() => applyConfig('replace')}>{$t('replace')}</button>
        <button class="grow primary" onclick={() => applyConfig('merge')}>{$t('merge')}</button>
      </div>
    </div>
  {/if}
  <label class="file danger">{$t('restore')}<input type="file" accept="application/json,.json" onchange={restore} /></label>
  {#if error}<div class="err" role="alert">{error}</div>{/if}

  <h2>{$t('drive')}</h2>
  <label>{$t('driveClientId')}
    <input bind:value={$settings.driveClientId} placeholder="1234-abc.apps.googleusercontent.com" autocapitalize="off" autocomplete="off" spellcheck="false" />
  </label>
  {#if $settings.driveClientId}
    <div class="row">
      <span class="grow small" data-testid="drive-status">{driveOn ? $t('driveConnected') : ''}</span>
      {#if driveOn}
        <button onclick={() => { drive.disconnect(); driveOn = false }}>{$t('driveDisconnect')}</button>
      {:else}
        <button onclick={() => drive.connect($settings.driveClientId)}>{$t('driveConnect')}</button>
      {/if}
    </div>
    <label class="check"><input type="checkbox" bind:checked={$settings.driveAuto} /> {$t('driveAuto')}</label>
  {:else}
    <div class="muted small">{$t('driveNotConfigured')}</div>
  {/if}

  <h2>{$t('storage')}</h2>
  <div class="small">{persisted ? $t('persisted') : $t('notPersisted')}</div>

  <h2>{$t('about')}</h2>
  <button onclick={() => (sharing = true)}>{$t('shareApp')}</button>
  <div class="muted small">Sets v{__APP_VERSION__} · MIT · github.com/aelena</div>
</main>
{#if sharing}<ShareApp onclose={() => (sharing = false)} />{/if}

<style>
  .tight { gap: 6px; }
  .font { width: 100%; text-align: left; display: flex; justify-content: space-between; border-radius: 0; }
  .font[aria-pressed='true'] { font-weight: 700; }
  .font[aria-pressed='true'] { box-shadow: inset 4px 0 var(--accent); }
  .file {
    display: grid; place-items: center; min-height: 44px; border: 1px solid var(--line); border-radius: var(--r);
    background: var(--card); color: var(--fg); font-size: 15px; cursor: pointer; position: relative;
  }
  .file.danger { color: var(--danger); }
  .file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .pad { padding: 12px; }
  .check { display: flex; align-items: center; gap: 8px; color: var(--fg); font-size: 15px; }
  .check input { width: 22px; min-height: 22px; }
  .err { color: var(--danger); }
</style>
