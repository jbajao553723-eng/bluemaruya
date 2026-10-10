# blue maruya

A responsive, private movie and series website with two member accounts, a charcoal/red cinema theme, and glowing Top 10 movie ranks.

Run `npm ci`, then `node scripts/serve.mjs` and open http://127.0.0.1:4173. The frontend has no build step; server functions use the official Vercel Blob SDK.

## Included

- Responsive cinematic homepage powered by live TMDB data
- Movie and series navigation, search, and genre filters
- Popular and trending shelves plus paginated movie and series browsing
- Title details, keyboard navigation, and reduced-motion support
- Separate watchlists for each account, saved on this device using localStorage
- Bootstrap 5.3.8 grid, forms, and account dropdown
- Rotating featured backdrops, slow-pan artwork, poster hover transitions, and scroll reveals
- A four-photo, crossfading login backdrop with reduced-motion support
- Phone bottom navigation and reduced-motion support
- Server-verified member login with a scrypt password hash and an eight-hour HttpOnly session cookie
- Personal welcomes and account settings for persistent display names and password changes
- CineSrc movie and TV embeds built from each title's TMDB ID
- Season and episode selection, plus playback cleanup when the player closes
- Sandboxed playback that blocks pop-up tabs, top-level redirects, downloads, and referrer leakage from third-party embeds

The live catalog is loaded through `api/tmdb.js`, a Vercel Function that keeps the TMDB credential on the server. `dist/app.js` contains a small fallback selection so the interface remains usable during a temporary API outage. Never commit the TMDB token or embed it in browser JavaScript.

Set `TMDB_BEARER_TOKEN` in the Vercel project's Environment Variables for Production, Preview, and Development. Use the API Read Access Token (Bearer token), not the short v3 API key.

The two approved accounts (`wakengwapo`, default name `waken`; `kdumangas`, default name `kristine`) are seeded in `lib/members.js` with salted password hashes. Plaintext passwords are never shipped in frontend files. The private Vercel Blob store saves changed names and password hashes. The connected project supplies `BLOB_READ_WRITE_TOKEN` (or `BLOB_STORE_ID` with Vercel OIDC). Reads bypass the storage cache; conditional writes prevent concurrent settings changes from overwriting each other. Run `node --env-file=.env.production.local scripts/seed-members.cjs` after connecting a fresh private store; existing records are preserved. Production has the `blue-maruya-members` private store connected.

Set a random `AUTH_SESSION_SECRET` in Vercel for independent session signing; when omitted, a domain-separated signing key is derived from the existing private TMDB token. Password updates change an account's session version and invalidate its other sessions. The catalog API checks the current account version and does not cache authenticated responses publicly. Login and password-change throttling is per function instance; enable Vercel rate limiting for stronger protection across instances.

For local preview, `scripts/serve.mjs` handles the same authentication endpoints, generates an ephemeral signing key, and saves isolated account changes in ignored `.local-members/`. Live TMDB data requires a local `TMDB_BEARER_TOKEN`; otherwise the homepage uses its fallback selection. Run `scripts/test-auth.cjs` with `TEST_LOGIN_PASSWORD` and `TEST_SECOND_PASSWORD` set to verify both accounts, settings persistence, session revocation, and security checks using temporary local records.

## Artwork

Posters and TV season artwork are sourced from the corresponding English Wikipedia title/season pages and remain the property of their respective rights holders. The Zootopia 2 hero is promotional imagery from [Disney D23](https://d23.com/the-98th-oscars-where-to-watch-disneys-nominees/). Exact asset URLs are recorded in `scripts/download-artwork.mjs`. Run `node scripts/download-artwork.mjs` to restore them.

The four login reaction backdrops are user-provided assets bundled in `dist/assets/`.

The original generated concept hero is retained in `dist/assets/noir-hero.png` but is no longer used by the page.

## Deploy to Vercel

Import [jbajao553723-eng/bluemaruya](https://github.com/jbajao553723-eng/bluemaruya) from GitHub into Vercel. Use the repository root as the Root Directory and deploy the `main` branch.

`vercel.json` configures these settings automatically:

- Framework Preset: Other
- Build Command: none
- Install Command: `npm ci`
- Output Directory: `dist`

This is a static HTML, CSS, and JavaScript frontend with authentication and catalog Vercel Functions. `TMDB_BEARER_TOKEN` and private Blob storage credentials are required. Vercel assigns the deployed project its own URL; a custom domain can be added in the Vercel dashboard.

The application deploys directly to Vercel from GitHub and does not have a registration flow.
