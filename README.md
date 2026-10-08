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

## Hosting

`.openai/hosting.json` identifies the existing private Sites deployment and its static output directory. Other static hosts can serve `dist/` directly.
