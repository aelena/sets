# Training plans

Plans for the **Plan** tab of [Sets](https://aelena.com/sets/): a weekly routine run for a set number of days ("30-day challenge"). The app has no plan editor on purpose: a plan is a JSON file, written by hand or by an AI assistant, imported on the phone and started on the date you choose.

- [`plan-template.json`](plan-template.json): the blank plan, with instructions for an assistant and the names of every exercise in the built-in library. The app's **Plan → Download plan template…** gives the same file with *your* phone's exercises instead, which is the better one to hand over.
- [`examples/`](examples): finished plans, ready to import.

## Making a plan with ChatGPT (or any assistant)

1. Download the template from the app (or take `plan-template.json` from here).
2. Give it to the assistant with what you want: days per week, goals, equipment, how long. For example: *"Fill this in: 4 days a week for 6 weeks, full body, dumbbells and a pull-up bar at home."*
3. Save the JSON it returns as a file and open **Plan → Import plan (JSON)…** on the phone. Choose the start date and the name; the plan starts there, with no missed days before it.

The template's `library` lists exercise names so the plan reuses them (one history per exercise). Names the app does not know become new exercises on import. Matching ignores case and accents and accepts the English or the Spanish name.

## Reusing a plan

Imported plans stay on the phone. **Stop plan** puts the running one away; **Your plans → Start…** starts any of them again on a new date, under the same or a new name. **Edit** on the running plan changes its name and start date. To change the exercises, export the plan, edit the JSON (or have the assistant do it) and import it again under the same name: it replaces the old version.

## The format

```json
{
  "format": "sets/plan",
  "version": 1,
  "name": "30-day muscle gain",
  "names": { "es": "Masa muscular en 30 días" },
  "start": "",
  "days": 30,
  "goal": "Strength and muscle, legs first",
  "rules": ["Warm up 5-10 minutes", "Rest 90-120 s on the big lifts"],
  "phases": [{ "weeks": [1], "focus": "Settle into the routine", "es": "Adaptarse a la rutina" }],
  "week": {
    "mon": { "name": "Legs", "names": { "es": "Piernas" }, "items": [
      { "exercise": "Leg Press", "es": "Prensa", "sets": 3, "reps": [10, 12] },
      { "exercise": "Plank", "es": "Plancha", "sets": 3, "seconds": 30 },
      { "exercise": "Bulgarian Split Squat", "sets": 3, "reps": 10, "kg": 8, "perSide": true, "note": "slow down" }
    ] },
    "tue": { "rest": true, "name": "Rest" }
  },
  "overrides": { "2026-11-12": { "name": "Light day", "items": [{ "exercise": "Plank", "sets": 2, "seconds": 20 }] } }
}
```

| Field | Meaning |
|---|---|
| `start` | First day, `YYYY-MM-DD`. Usually empty: the app asks for it on import. |
| `days` | How many days the plan runs, rest days included. |
| `week` | `mon` … `sun`. A training day has `name` and `items`; a missing day or `{ "rest": true }` is a rest day. |
| item | `exercise` (English name), `es` (Spanish), `sets`, and `reps` or `seconds`: a number or `[min, max]`. Optional `kg`, `perSide`, `note`. |
| `rules`, `phases`, `goal` | Shown on the Plan tab. A phase gives its `weeks` a `focus`. |
| `overrides` | Replace the weekly template on given dates. |

Plans hold training only: no nutrition, no medical content. What was done is never written into the plan: a day is done, in part or missed according to the sets logged that date.
