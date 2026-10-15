# blue maruya

A responsive, private movie and series website with three member accounts, personal dashboard themes, and glowing Top 10 movie ranks.

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
- A redesigned photo stage and member entrance, with manual photo selection, next/pause controls, and a responsive cinema-club layout
- A refreshed member picker, username-only remembering, Caps Lock hint, and bounded login/session requests; no plaintext passwords are saved
- Phone bottom navigation and reduced-motion support
- Server-verified member login with a scrypt password hash and an eight-hour HttpOnly session cookie
- Personal welcomes and account settings for persistent display names and password changes
- Time-aware greetings for every account: “Mayng bungkag” in the morning, “Good afternoon” in the afternoon, and “Mayng gabie” in the evening
- Kristine-only blush pink dashboard with a saved pink-on-charcoal dark mode; Waken and Guest use the charcoal/red screening-room layout
- A Preferences shelf immediately after Trending now for Kristine: Shrek, Tangled (Rapunzel), Beauty and the Beast (1991), Mulan (1998), and The Avengers; live metadata with bundled fallback posters
- Waken's redesigned screening-room dashboard, with real TMDB title logos in the rotating spotlight and a readable text fallback for unavailable logos
- A Surprise me picker prioritizing unwatched movies, quick-play controls, and title/year/rating sorting for loaded titles
- Recently watched shelves and a searchable History tab for all three accounts, with last-episode resume and individual removal controls
- Every dashboard has a shared movie-night shortcut dock, Continue watching shelf, progress bars, a surprise picker, and the `/` search shortcut
- Per-account, device-local preferences for default quality, animated featured backgrounds, and Kristine's light/dark appearance
- CineSrc movie and TV embeds built from each title's TMDB ID
- Season and episode selection, plus playback cleanup when the player closes
- Documented CineSrc quality preferences (Auto/480p/720p/1080p), saved-position resume, Next episode, restart, fresh-connection retry, and non-blocking stalled-stream/error help
- Sandboxed playback that blocks pop-up tabs, top-level redirects, downloads, and referrer leakage from third-party embeds

The live catalog is loaded through `api/tmdb.js`, a Vercel Function that keeps the TMDB credential on the server. `dist/app.js` contains a small fallback selection so the interface remains usable during a temporary API outage. Never commit the TMDB token or embed it in browser JavaScript.

Viewing history is stored separately for each immutable account username in this browser's localStorage (up to 24 unique titles). A title is recorded when its player is opened, and episode selections are saved. CineSrc's documented events now provide playback position/duration; trusted progress is saved approximately every ten seconds and on pause/close. Resume URLs request the last saved position. Only messages from the exact configured origin and active iframe window are accepted; messages with invalid/bounded-out time values are ignored. History is not shared with the other account or synced to cloud storage. Older records without position data still resume their selected episode.

`dist/player-kit.js` implements the public [CineSrc embed and event contract](https://cinesrc.st/docs); no stream extraction or access-control bypass is used. The default quality preference is 480p to reduce bandwidth, but the provider ultimately decides which stream resolutions are available. A loaded iframe is not treated as proof of playback. After 30 seconds without playback, or 25 seconds without progress during playback, recovery help appears; intentional pauses do not trigger the stalled warning. Retry reloads the same provider without prioritizing the remembered source and preserves a saved position. No new streaming provider is added, and the sandbox protections are unchanged. Provider outages/stream errors are outside the site's control; the UI does not promise uninterrupted or instant playback.

Featured rotation and background animation stop while a dialog is open. Returning to a freshly loaded home page reuses account-scoped catalog data for two minutes, reducing unnecessary fetching. All viewing/appearance preferences are local to the device, except existing account names/passwords which retain private Blob persistence.

Set `TMDB_BEARER_TOKEN` in the Vercel project's Environment Variables for Production, Preview, and Development. Use the API Read Access Token (Bearer token), not the short v3 API key.

The three approved accounts (`wakengwapo`, default name `waken`; `kdumangas`, default name `kristine`; `guest`, default name `guest`) are seeded in `lib/members.js` with salted password hashes. Plaintext passwords are never shipped in frontend files. The private Vercel Blob store saves changed names and password hashes. The connected project supplies `BLOB_READ_WRITE_TOKEN` (or `BLOB_STORE_ID` with Vercel OIDC). Reads bypass the storage cache; conditional writes prevent concurrent settings changes from overwriting each other. Run `node --env-file=.env.production.local scripts/seed-members.cjs` after connecting a fresh private store; existing records are preserved. Production has the `blue-maruya-members` private store connected.

Set a random `AUTH_SESSION_SECRET` in Vercel for independent session signing; when omitted, a domain-separated signing key is derived from the existing private TMDB token. Password updates change an account's session version and invalidate its other sessions. The catalog API checks the current account version and does not cache authenticated responses publicly. Login and password-change throttling is per function instance; enable Vercel rate limiting for stronger protection across instances.

For local preview, `scripts/serve.mjs` handles the same authentication endpoints, generates an ephemeral signing key, and saves isolated account changes in ignored `.local-members/`. Live TMDB data requires a local `TMDB_BEARER_TOKEN`; otherwise the homepage uses its fallback selection. Run `scripts/test-auth.cjs` with `TEST_LOGIN_PASSWORD`, `TEST_SECOND_PASSWORD`, and `TEST_GUEST_PASSWORD` set to verify all three accounts, settings persistence, session revocation, and security checks using temporary local records.

## Artwork

Posters and TV season artwork are sourced from the corresponding English Wikipedia title/season pages and remain the property of their respective rights holders. The Zootopia 2 hero is promotional imagery from [Disney D23](https://d23.com/the-98th-oscars-where-to-watch-disneys-nominees/). Exact asset URLs are recorded in `scripts/download-artwork.mjs`. Run `node scripts/download-artwork.mjs` to restore them.

The four login reaction backdrops are user-provided assets bundled in `dist/assets/`.

Kristine's bundled preference posters and Tangled backdrop use artwork from the corresponding TMDB movie records. The download script records their exact URLs. Run `npm run test:preferences` for account-specific shelf and fallback checks.

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
