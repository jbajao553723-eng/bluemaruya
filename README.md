# blue maruya

A responsive movie and series website with no accounts, sign-in, or registration.

Run `node scripts/serve.mjs` and open http://127.0.0.1:4173, or serve `dist/` with any static HTTP server. There are no build dependencies.

## Included

- Responsive cinematic homepage powered by live TMDB data
- Movie and series navigation, search, and genre filters
- Popular and trending shelves plus paginated movie and series browsing
- Title details, keyboard navigation, and reduced-motion support
- A watchlist saved on this device using localStorage
- CineSrc movie and TV embeds built from each title's TMDB ID
- Season and episode selection, plus playback cleanup when the player closes

The live catalog is loaded through `api/tmdb.js`, a Vercel Function that keeps the TMDB credential on the server. `dist/app.js` contains a small fallback selection so the interface remains usable during a temporary API outage. Never commit the TMDB token or embed it in browser JavaScript.

Set `TMDB_BEARER_TOKEN` in the Vercel project's Environment Variables for Production, Preview, and Development. Use the API Read Access Token (Bearer token), not the short v3 API key.

## Artwork

Posters and TV season artwork are sourced from the corresponding English Wikipedia title/season pages and remain the property of their respective rights holders. The Zootopia 2 hero is promotional imagery from [Disney D23](https://d23.com/the-98th-oscars-where-to-watch-disneys-nominees/). Exact asset URLs are recorded in `scripts/download-artwork.mjs`. Run `node scripts/download-artwork.mjs` to restore them.

The original generated concept hero is retained in `dist/assets/noir-hero.png` but is no longer used by the page.

## Deploy to Vercel

Import [jbajao553723-eng/bluemaruya](https://github.com/jbajao553723-eng/bluemaruya) from GitHub into Vercel. Use the repository root as the Root Directory and deploy the `main` branch.

`vercel.json` configures these settings automatically:

- Framework Preset: Other
- Build Command: none
- Install Command: none
- Output Directory: `dist`

This is a static HTML, CSS, and JavaScript frontend with one dependency-free Vercel Function. A `TMDB_BEARER_TOKEN` environment variable is required for the live catalog. Vercel assigns the deployed project its own URL; a custom domain can be added in the Vercel dashboard.

The ChatGPT Sites configuration has been removed. The application has no dependency on ChatGPT hosting and no login or registration flow.
