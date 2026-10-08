# blue maruya

A responsive movie and series website with no accounts, sign-in, or registration.

Run `node scripts/serve.mjs` and open http://127.0.0.1:4173, or serve `dist/` with any static HTTP server. There are no build dependencies.

## Included

- Responsive cinematic homepage and movie collections
- Movie and series navigation, search, and genre filters
- Title details, keyboard navigation, and reduced-motion support
- A watchlist saved on this device using localStorage
- CineSrc movie and TV embeds built from each title's TMDB ID
- Season and episode selection, plus playback cleanup when the player closes

The catalog is a curated static selection, not live TMDB data. `dist/app.js` contains the title records and `buildEmbedUrl()` integration point. TV season counts represent the seeded selection and should be replaced by TMDB season data when connected. Add TMDB through a server-side adapter and protected environment variable; never commit API tokens or embed them in browser JavaScript.

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

This is a static HTML, CSS, and JavaScript site. No dependencies or API keys are required for the current version. Vercel assigns the deployed project its own URL; a custom domain can be added in the Vercel dashboard.

The ChatGPT Sites configuration has been removed. The application has no dependency on ChatGPT hosting and no login or registration flow.
