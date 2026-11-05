<script>
  import { onMount, onDestroy } from 'svelte'
  import Icon from './Icon.svelte'
  import { repo, notify } from '../lib/store.js'
  import { t } from '../lib/i18n.js'
  import { schedule, totalSeconds, at, runMs, pause, resume, seek, beeper, intervalRunning } from '../lib/intervals.js'

  /**
   * Full-screen interval timer: the current step and its countdown big, the next step below.
   * The last 5 seconds of a step flash; three short beeps count down and a long one marks each
   * change. The screen stays on while it runs (App holds the wake lock for it).
   */
  let { routine, onclose } = $props()

  const plan = $derived(schedule({ steps: routine.steps, rounds: routine.rounds, restBetween: routine.restBetween ?? 0, prep: 5 }))
  const workSeconds = $derived(totalSeconds(plan.filter(s => !s.prep)))
  let run = $state(null) // { start, pausedAt, pausedMs }
  let finished = $state(null) // seconds trained when it ended
  let tick = $state(Date.now())
  let beep = null

  onMount(() => {
    let raf
    const loop = () => { tick = Date.now(); raf = requestAnimationFrame(loop) }
    loop()
    return () => cancelAnimationFrame(raf)
  })
  onDestroy(() => intervalRunning.set(false))

  const pos = $derived(run ? at(plan, runMs(run, tick)) : { index: 0, left: plan[0].seconds * 1000, done: false })
  const step = $derived(plan[pos.index])
  const next = $derived(plan.slice(pos.index + 1).find(s => !s.prep) ?? null)
  const secs = $derived(Math.ceil(pos.left / 1000))
  const flash = $derived(!!run && !run.pausedAt && !pos.done && secs <= 5)
  const label = s => (s.prep ? $t('getReady') : s.rest ? s.name || $t('restStep') : s.name || '—')
  const workIndex = $derived(plan.slice(0, pos.index + 1).filter(s => !s.prep).length)
  const workCount = $derived(plan.filter(s => !s.prep).length)
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // sound: 3-2-1 short, a long one on every change, a longer one at the end
  let lastSec = null, lastIndex = 0
  $effect(() => {
    if (!run || run.pausedAt) return
    if (pos.done) { if (finished == null) { beep?.(1320, 600); end(workSeconds) } return }
    if (pos.index !== lastIndex) { lastIndex = pos.index; lastSec = null; beep?.(1100, 350) }
    if (secs !== lastSec) { lastSec = secs; if (secs <= 3 && secs >= 1) beep?.(660, 120) }
  })

  function start() {
    beep = beeper() // created on the tap: iOS only plays sound started by a gesture
    run = { start: Date.now(), pausedAt: null, pausedMs: 0 }
    lastIndex = 0
    intervalRunning.set(true)
  }
  const toggle = () => { run = run.pausedAt ? resume(run) : pause(run) }
  const skip = () => { if (pos.index < plan.length - 1) run = seek(run, plan, pos.index + 1); else end() }
  function end(seconds) {
    const trained = seconds ?? Math.max(0, Math.round(runMs(run, Date.now()) / 1000) - (plan[0].prep ? plan[0].seconds : 0))
    finished = trained
    run = run ? pause(run) : run
    intervalRunning.set(false)
  }
  async function log() {
    await repo.logIntervals({ name: routine.name, seconds: finished })
    notify(`${$t('logged')} · ${routine.name} ${fmt(finished)}`)
    onclose()
  }
</script>

<div class="runner" class:rest={step.rest || step.prep} class:flash role="dialog" aria-modal="true" aria-label={routine.name}>
  <div class="top">
    <strong class="grow">{routine.name}</strong>
    <button class="icon ghost" aria-label={$t('close')} onclick={onclose}><Icon name="x" /></button>
  </div>

  {#if finished != null}
    <div class="center grow">
      <div class="name">{$t('intervalsDone')}</div>
      <div class="time" data-testid="interval-total">{fmt(finished)}</div>
    </div>
    <div class="buttons">
      <button class="big" onclick={onclose}>{$t('close')}</button>
      <button class="big primary" onclick={log} disabled={!finished}>{$t('logIt')}</button>
    </div>
  {:else}
    <div class="meta small">
      {#if !step.prep}<span>{workIndex}/{workCount}</span>{/if}
      {#if routine.rounds > 1}<span>{$t('round', { r: step.round, n: routine.rounds })}</span>{/if}
    </div>
    <div class="center grow">
      <div class="name" data-testid="interval-name">{label(step)}</div>
      <div class="time" data-testid="interval-time">{run ? secs : fmt(workSeconds)}</div>
      {#if next}<div class="next" data-testid="interval-next"><span class="muted">{$t('next')}:</span> {label(next)} · {next.seconds} s</div>{/if}
    </div>
    <div class="buttons">
      {#if !run}
        <button class="big" onclick={onclose}>{$t('cancel')}</button>
        <button class="big primary" onclick={start}>{$t('start')}</button>
      {:else}
        <button class="big" onclick={toggle}>{run.pausedAt ? $t('resume') : $t('pauseRun')}</button>
        <button class="big" onclick={skip}>{$t('skipStep')}</button>
        <button class="big danger wide" onclick={() => end()}>{$t('finish')}</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .runner {
    position: fixed; inset: 0; z-index: 30; background: var(--bg); display: flex; flex-direction: column; gap: 12px;
    padding: calc(env(safe-area-inset-top) + 12px) 16px calc(env(safe-area-inset-bottom) + 16px);
  }
  .runner.rest { background: var(--soft); }
  .top { display: flex; align-items: center; gap: 8px; font-size: 17px; }
  .meta { display: flex; justify-content: space-between; color: var(--muted); font-variant-numeric: tabular-nums; }
  .center { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 12px; }
  .name { font-size: min(10vw, 52px); font-weight: 700; line-height: 1.1; overflow-wrap: anywhere; }
  .time { font-size: min(42vw, 220px); font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; letter-spacing: -0.03em; }
  .flash .time { color: var(--flame); animation: blink 0.5s steps(1) infinite; }
  .next { font-size: 20px; }
  .buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .big { min-height: 64px; font-size: 18px; border-radius: 999px; }
  .wide { grid-column: 1 / -1; }
  @keyframes blink { 50% { opacity: 0.25; } }
  @media (prefers-reduced-motion: reduce) { .flash .time { animation: none; } }
</style>
