import { writable } from 'svelte/store'

export const FONTS = {
  'JetBrains Mono': "'JetBrains Mono'",
  'IBM Plex Mono': "'IBM Plex Mono'",
  'Victor Mono': "'Victor Mono'",
  'Fira Code': "'Fira Code'",
  'Space Mono': "'Space Mono'",
}

const KEY = 'exercise-tracker:settings'
const defaults = {
  userName: '',
  lang: navigator.language?.startsWith('es') ? 'es' : 'en',
  theme: 'system',
  font: 'JetBrains Mono',
  groupId: null,
  tab: 'train',
  lastBackup: null,
  recapFormat: 'story',
  recapDetail: 'sparse',
  driveClientId: import.meta.env?.VITE_GOOGLE_CLIENT_ID ?? '',
  driveAuto: false,
  todayOnly: false,
  recapBg: 'ink',
}

const read = () => {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } }
  catch { return { ...defaults } }
}

/** Per-device preferences. Small, synchronous, and included in full backups. */
export const settings = writable(read())

settings.subscribe(s => {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {}
  const root = document.documentElement
  root.dataset.theme = s.theme
  root.style.setProperty('--font', `${FONTS[s.font] ?? FONTS['JetBrains Mono']}, ui-monospace, monospace`)
  root.lang = s.lang
})

/** Fields that travel with a backup; navigation state stays on the device. */
export const portable = ({ userName, lang, theme, font, driveClientId, driveAuto }) => ({ userName, lang, theme, font, driveClientId, driveAuto })
