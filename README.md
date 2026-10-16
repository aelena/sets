# Sets

A small, opinionated web app for logging training sets at the gym or at home. It installs on an iPhone from Safari (no App Store), works offline, and keeps every set on the phone. You can chart each exercise's progression in the app or export it to Excel.

Built for one person's routine first. Anyone can use it; whatever you log stays in your own browser.

<!-- screenshots: docs/screenshots/*.png, light and dark, added once it has been used on a real phone -->

## What it does

- **Exercise groups.** Group exercises however you train ("Kettlebell Supergroup", "My Warm up Routine") and switch between groups at the top of the main screen. Exercises show in the group's order.
- **One exercise, one history.** An exercise has a name, a target (sets × reps, or sets × seconds for planks, hangs and climbers), an optional weight (leave it empty for bodyweight), an optional "per side" flag, a free-text description and a video link. If an exercise is in two groups, it is still one exercise with one history.
- **Logging a set takes two taps.** Tap **+**: reps and kg are prefilled from your last set today, or from the target. Confirm, or adjust and confirm. A counter shows `2/5` per exercise; "Undo" is offered right after each set, and any logged set can be edited or deleted.
- **Last time, at a glance.** Under each exercise: `last: 10 · 10 · 9 @16kg · Wed`, the sets of the most recent earlier day.
- **Personal bests.** A small flame marks a set that no earlier set matched on both weight and reps (or seconds). Nothing flames on an exercise's first day.
- **Sessions are optional.** ▶ starts a session and ■ stops it. Sets logged outside a session (between meetings, say) are kept with their date and time. A session left running is closed automatically after two hours without activity, at the time of its last set.
- **Rest timer.** The hourglass turns the screen into a big stopwatch with a stop button. During a session, rests are counted and summarised when the session stops; outside a session they are not kept.
- **Session summary.** Stopping a session shows, and stores as plain text: duration, sets, exercises, volume, rest count / total / average / longest, and every exercise's sets. The same sheet has a **Back up** button and says how long ago the last backup was.
- **Recap image for Instagram.** From the summary, or from any session in History: a 1080×1920 story or 1080×1350 post with the date, duration, sets, volume, personal bests and the exercise list, drawn over a gradient, a bundled photo or one picked from Photos. **Share** opens the iOS share sheet, where Instagram is one of the targets.
- **Notes.** The speech bubble opens a notes box tied to the running session, or to the day. To dictate, use the microphone on the iPhone keyboard.
- **Progress.** A chart per exercise (volume, heaviest weight, total reps or seconds, sets per day), with a table of the same numbers, and a day-by-day history of sessions, sets and notes.
- **Export / import.**
  - Sets to **Excel (.xlsx)**, one row per set. It is a real workbook, not a CSV, so Excel in a Spanish or other European locale opens it correctly.
  - The **exercise config as JSON**, to edit groups on a computer and import them back (merge or replace).
  - A **full backup** (JSON) and restore.
- **No frills.** Light, dark or follow the system. English or Spanish (names of exercises and groups are never translated). Five bundled monospace fonts: JetBrains Mono (default), IBM Plex Mono, Victor Mono, Fira Code and Space Mono. A name field.

## Install on an iPhone

1. Open **https://aelena.com/sets/** in **Safari** (or your own deployment; it must be served over HTTPS, see [Deploy](#deploy)).
2. Share → **Add to Home Screen**.
3. Open it from the home screen. From then on it runs full screen and offline.

## Your data

Everything lives in the browser's IndexedDB on the device: no account, no server, no sync.

- At start-up the app asks the browser to keep its storage permanently. Home-screen apps on iOS are spared Safari's 7-day clean-up of website data, but **deleting the app from the home screen deletes its data.**
- So back up. **Settings → Full backup** opens the iOS share sheet: save the file to iCloud Drive or Files. The main screen reminds you when the last backup is more than 7 days old.
- **Settings → Restore full backup** replaces everything on the device with a backup file.

## Recap backgrounds

Put portrait photos (about 1080×1920, `.jpg`, `.jpeg`, `.png` or `.webp`, under 1 MB each) in [`src/assets/backgrounds/`](src/assets/backgrounds/) and rebuild. Each file becomes a background choice in the recap sheet and is cached for offline use. The app draws all text itself and darkens the photo towards the bottom, where the numbers sit, so the photos should have no text of their own. Every recap also prints `aelena.com/sets`, so whoever sees it can find the app.

The bundled set was generated from the prompt in [`docs/background-prompt.md`](docs/background-prompt.md); the full-size originals stay out of git (`img/`).

## The config file

Groups and exercises can be written by hand and imported in **Settings → Import exercise config**. See [`examples/config.example.json`](examples/config.example.json).

```json
{
  "format": "exercise-tracker/config",
  "version": 1,
  "exercises": [
    { "id": "halos", "name": "Halos", "sets": 5, "reps": 10, "kg": 16 },
    { "id": "plank", "name": "Plank", "type": "time", "sets": 3, "seconds": 60 }
  ],
  "groups": [
    { "name": "Kettlebell Supergroup", "exercises": ["halos", { "name": "Lateral Swing", "sets": 2, "reps": 50, "kg": 20 }] },
    { "name": "Core", "exercises": ["Plank", "Halos"] }
  ]
}
```

- A group entry can be an exercise **id**, an exercise **name**, or a full exercise object. Names are matched case-insensitively against the file and against what is already on the phone, so the same exercise in two groups stays one exercise.
- Exercise fields: `name` (required), `type` (`reps` default, or `time`), `sets`, `reps` or `seconds`, `kg` (omit for bodyweight), `perSide`, `desc`, `link`. `id` is optional: one is derived from the name.
- **Merge** adds and updates groups and exercises and keeps the rest. **Replace** makes the groups exactly those in the file. Exercises no longer used are archived, never deleted, so logged sets keep their names.

## Excel export

Sheet `sets`, one row per set:

| date | time | exercise | group | set_no | reps | seconds | kg | volume_kg | session | exercise_id |
|---|---|---|---|---|---|---|---|---|---|---|

`set_no` counts within the day and exercise. `volume_kg` is reps × kg. Sheets `sessions` (date, start, end, minutes, summary) and `notes` come with it.

## Development

Vite + Svelte 5, Dexie (IndexedDB), uPlot, SheetJS, `vite-plugin-pwa`. No backend.

```bash
npm install
npm run dev          # http://localhost:5173, also on the LAN (--host)
npm test             # unit tests (vitest + fake-indexeddb)
npx playwright install webkit chromium   # once
npm run test:e2e     # builds, serves the build, runs on iPhone 15 profiles (WebKit and Chromium)
npm run build        # dist/, with service worker and icons
```

To try it at phone size in a desktop browser: open the dev server, then DevTools → device toolbar → iPhone. WebKit under Playwright is the closest thing to iOS Safari on Windows, but it is not the same: check on the real phone before relying on it.

Project layout:

```
src/lib/       config (normalize/merge/export), repo (all DB operations), summary, metrics, export, i18n, settings
src/views/     Train, Progress, Edit, Settings
src/components ExerciseRow, LogSheet, NotesSheet, RestTimer, SummaryModal, Chart, Sheet, Toast, TabBar, Icon
tests/unit     logic and repository tests
tests/e2e      Playwright flows at iPhone size
```

## Deploy

The build is static and uses relative paths, so it works from any HTTPS static host, including GitHub Pages under `/<repo>/`. `.github/workflows/pages.yml` builds and publishes on every push to `main` once the repository has Pages enabled with "GitHub Actions" as the source.

## Roadmap

- **Weight progression per set** (50 kg, then 60, then 70). Logged sets already carry their own weight. The plan would let `kg` be a list, one value per set, prefilled set by set. The UI for editing it is still open.
- Screenshots in this README.

## License

MIT
