# Snap2Supper

Photograph what you own. Never wonder what’s for dinner again.

Snap2Supper is an AI kitchen assistant for two people who are tired every evening: the **eggless vegetarian** cook (no hidden eggs — mayo, egg pasta, binders), and the **busy parent** who needs a week or month of meals plus one short, cheap grocery list.

## What it does

1. **Snap** — unlimited photos of fridge, freezer, pantry, or counter. Images are resized in the browser before they leave the device.
2. **Review** — delete bad detections, add what the camera missed.
3. **Cook now** — breakfast, lunch, dinner, a 10-minute snack, or a school lunchbox. Diet defaults to eggless veg. Pick a cuisine, get six ideas.
4. **Pantry check** — before a recipe, it asks about staples a camera cannot see (pasta, cumin, rice). Missing items get substitutions, not silent assumptions.
5. **Save** — hearts persist in `localStorage`.
6. **Plan ahead** — 7 / 14 / 28 days, rotating cuisines, packable lunches, week-by-week progress. One grocery list capped at 18 / 24 / 30 items, grouped by store section, tickable in the aisle. **Copy for mom** dumps a plain checklist.

## Run locally

```bash
npm install
npm run dev -- --port 43145
```

Open [http://localhost:43145](http://localhost:43145).

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` or `GEMINI_API_KEY` **once on the server**. That is a deployer setting, not something cooks do. After that, every user can photograph a fridge and get a real inventory. Without it, they still cook from **Sample kitchen** or typed items.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui. Persistence is `localStorage` with try/catch so a blocked store doesn’t brick the UI.

## Design

Paper `#FBFAF5`, aubergine ink `#2B1E33`, leaf `#3E7C4F`, lemon `#FFD23F`, tomato `#C94F3D`. Display font: Bricolage Grotesque. Body: Instrument Sans.
