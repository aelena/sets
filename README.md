# Sets

A small, opinionated web app for logging training sets at the gym or at home. It installs on an iPhone from Safari (no App Store), works offline, and keeps every set on the phone. You can chart each exercise's progression in the app or export it to Excel.

Built for one person's routine first. Anyone can use it; whatever you log stays in your own browser.

<!-- screenshots: docs/screenshots/*.png, light and dark, added once it has been used on a real phone -->

## What it does

- **Exercise groups.** Group exercises however you train ("Kettlebell Supergroup", "My Warm up Routine") and switch between groups at the top of the main screen. Exercises show in the group's order.
- **Today view.** The ✓ in the top bar lists everything logged today, from any group, in one place: handy when one session mixes groups. Green when the target is reached.
- **Names in English and Spanish.** Exercises, groups and activities can carry a Spanish name; the app shows the one for the UI language and the Excel export has both.
- **Starter groups.** Your own Kettlebell Supergroup and warm-up, plus classic Biceps, Triceps, Shoulders, Leg Day and Core groups (curls, dips, presses, squats, planks...). A Back group was added later. Each classic exercise has a short form cue in English and Spanish (the app shows the one for the UI language) and a link to a YouTube search for good form. Weights are placeholders: edit them, or the groups, freely. Phones that already had data get the classic groups once, added after their own, without touching anything existing.
- **One exercise, one history.** An exercise has a name, a target (sets × reps, or sets × seconds for planks, hangs and climbers), an optional weight (leave it empty for bodyweight), an optional "per side" flag, a free-text description and a video link. If an exercise is in two groups, it is still one exercise with one history.
- **Logging a set takes two taps.** Tap **+**: reps and kg are prefilled from your last set today, or from the target. Confirm, or adjust and confirm. A counter shows `2/5` per exercise; "Undo" is offered right after each set, and any logged set can be edited or deleted.
- **Last time, at a glance.** Under each exercise: `last: 10 · 10 · 9 @16kg · Wed`, the sets of the most recent earlier day.
- **Personal bests.** A small flame marks a set that no earlier set matched on both weight and reps (or seconds). Flames are per exercise and start from its 12th training day: before that nearly every set would be a best.
- **Activities.** Running, Rowing and Gym Bike live in their own tab after the groups ("Cardio & more"), and "Other activity…" takes any name and keeps it for next time. Log a duration, a distance and a pace (min/km): fill any two and the third is worked out ("30 min at 6'" → 5 km). Pace accepts `6`, `6:00`, `6'` or `6'30"`. Activities show in the session summary, the recap image, History and Progress (minutes, km, pace), and in their own Excel sheet. Rename or remove them under Edit → Activity.
- **Sessions are optional.** ▶ starts a session and ■ stops it. Sets logged outside a session (between meetings, say) are kept with their date and time. When there are any, a **Complete** bar files them into that day's **untimed session**: one per day, separate from any timed session the same day, with the same summary, recap image, export and history (no duration). Logging more later and tapping Complete again adds to the same day's untimed session. A session left running is closed automatically after two hours without activity, at the time of its last set.
- **Rest timer.** The hourglass turns the screen into a big stopwatch with a stop button. During a session, rests are counted and summarised when the session stops; outside a session they are not kept.
- **Session summary.** Stopping a session shows, and stores as plain text: duration, sets, exercises, volume, rest count / total / average / longest, and every exercise's sets. The same sheet has a **Back up** button and says how long ago the last backup was.
- **Muscles.** Exercises can be tagged with the muscles they work (built-in ones come tagged). The recap uses them.
- **Recap image for Instagram.** From the summary, or from any session in History: a 1080×1920 story or 1080×1350 post, **Sparse** (date, duration, sets, volume, the muscles trained, personal bests) or **Full** (plus every exercise), drawn over a gradient, a bundled photo or one picked from Photos. **Share** opens the iOS share sheet, where Instagram is one of the targets.
- **Notes.** The speech bubble opens a notes box tied to the running session, or to the day. To dictate, use the microphone on the iPhone keyboard.
- **Overview.** The first page of Progress: days since you last trained each muscle (amber after a week, stale after two; exercises without muscles, like the kettlebell set, count under their group, and activities as cardio), sessions per week over 12 weeks with the 4-week average and training days, and the length of every session. Each chart has a table view.
- **Calendar.** Under Progress: a month view where days with a session are solid blue squares with white numbers, in light and dark mode. Days with only ad-hoc training get a blue outline. Tap a day to see what was done.
- **Progress.** A chart per exercise (volume, heaviest weight, total reps or seconds, sets per day), with a table of the same numbers, and a day-by-day history of sessions, sets and notes.
- **Session data to Google Drive.** The session summary has **Export session data** (raw JSON through the share sheet: Files, the Google Drive app, AirDrop) and, once set up, **Upload to Google Drive**, straight into a `Sets` folder. Settings can upload every session automatically when it stops. See [Google Drive](#google-drive).
- **Export / import.**
  - Sets to **Excel (.xlsx)**, one row per set. It is a real workbook, not a CSV, so Excel in a Spanish or other European locale opens it correctly.
  - The **exercise config as JSON**, to edit groups on a computer and import them back (merge or replace).
  - A **full backup** (JSON) and restore.
- **No frills.** Light, dark or follow the system. English or Spanish (names of exercises and groups are never translated). Five bundled monospace fonts: JetBrains Mono (default), IBM Plex Mono, Victor Mono, Fira Code and Space Mono. A name field.

## Install on an iPhone

1. Open **https://aelena.com/sets/** in **Safari** (or your own deployment; it must be served over HTTPS, see [Deploy](#deploy)).
2. Share → **Add to Home Screen**.
3. Open it from the home screen. From then on it runs full screen and offline.

## Library updates never touch your data

Built-in groups arrive as *packs*, each applied once per phone and only ever added:

- an exercise you already have (same id or same name) is reused, never changed;
- a built-in group whose name you already use is added next to yours, e.g. "Back (classic)";
- nothing is deleted, renamed or overwritten, and logged sets always keep pointing at their exercise.

Two kinds of later fixes are fill-only: muscles and Spanish names are added where an exercise has none. A one-time curation step (`curate-1`) renamed the first hand-built exercises properly, guarded by their exact original id and name, so it does nothing on any other phone and never undoes a later edit. Restoring a backup made before packs existed applies only the packs added since.

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

`set_no` counts within the day and exercise. `volume_kg` is reps × kg. Sheets `activities` (date, time, activity, minutes, km, pace_min_km, notes, session), `sessions` (date, start, end, minutes, summary) and `notes` come with it.

## Google Drive

Uploading straight to Drive needs an OAuth client ID that you own (the share-sheet export works without it):

1. In [Google Cloud console](https://console.cloud.google.com/) create a project and enable the **Google Drive API**.
2. **OAuth consent screen**: External; add the scope `.../auth/drive.file` and yourself as a test user.
3. **Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorized JavaScript origins: `https://aelena.com` (your host)
   - Authorized redirect URIs: `https://aelena.com/sets/` (the app's exact URL)
4. Paste the client ID in **Settings → Google Drive** and tap **Connect Google Drive**.

The app uses the `drive.file` scope: it can see and create only its own files, in one `Sets` folder. Sign-in is a full-page redirect (popups are unreliable in home-screen apps) and the token lasts an hour; after that the next upload asks you to sign in again. The client ID can also be baked in at build time as `VITE_GOOGLE_CLIENT_ID`.

## Development

Vite + Svelte 5, Dexie (IndexedDB), uPlot, SheetJS, `vite-plugin-pwa`. No backend.

```bash
npm install
npm run dev          # http://localhost:5173, also on the LAN (--host)
npm test             # unit tests (vitest + fake-indexeddb)
npx playwright install webkit chromium   # once
npm run test:e2e     # builds, serves the build, runs on iPhone 15 profiles (WebKit and Chromium)
npm run test:recaps  # renders a fixture session over every background into recap-samples/
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
