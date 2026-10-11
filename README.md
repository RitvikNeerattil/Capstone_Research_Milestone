# Lap Log

Research Milestone sample app for my capstone. A small Next.js app for logging lap times by track and seeing how you're doing.

## What it does

- Enter a track, driver and lap time (`1:23.456` or `83.456`)
- Bad times get rejected with a message (e.g. `1:75.0` or `abc`)
- Shows each lap's delta to the best time on that track
- Per-track stats: best lap + who set it, average, lap count, and a 0-100 consistency score
- Filter by track, delete laps, load sample data
- Laps are saved in your browser (localStorage), so they survive a refresh

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** for styling
- **npm** as the package manager

## How it's put together

| File | What it does |
| --- | --- |
| `src/lib/laptime.ts` | Parsing/formatting lap times and the stats math. Times are stored as integer milliseconds so nothing gets weird with floating point. |
| `src/app/api/stats/route.ts` | `POST /api/stats` route handler. Takes `{ laps: [...] }`, validates it, returns per-track stats. Runs on the server. |
| `src/components/LapLog.tsx` | The main client component. Form, table, filters, and calls the API whenever laps change. |
| `src/components/LapLogClient.tsx` | Loads `LapLog` with `ssr: false`, since it reads localStorage which only exists in the browser. |
| `src/app/page.tsx` | Home page, just renders the tracker. |

Consistency score: takes the standard deviation of lap times divided by the average (coefficient of variation). Identical laps = 100, a 2% spread or worse = 0.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Other scripts: `npm run build` (production build), `npm start` (run the build), `npm run lint`.

### Try the API directly

```bash
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{"laps":[{"track":"Monza","driver":"me","ms":81874},{"track":"Monza","driver":"me","ms":82310}]}'
```

## Notes on npm

- `package.json` lists the dependencies, `package-lock.json` pins the exact versions so everyone gets the same install
- `node_modules/` is never committed (it's in `.gitignore`), `npm install` rebuilds it
- `npm ci` installs exactly what's in the lockfile, good for when a build works for a teammate but not you
