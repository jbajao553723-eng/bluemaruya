# blue maruya

A private movie and series website with three member profiles, a shared charcoal-and-coral interface, actor discovery, and Home Screen installation.

## Run locally

Run `npm ci`, then `npm start`, and open http://127.0.0.1:4173. The vanilla frontend in `dist/` has no build step. Local account changes use ignored `.local-members/` records. Production seed hashes remain unchanged.

## Cinematic redesign

- One responsive theme for Waken, Kristine and Guest, based on the approved Cinematic streaming mockup.
- Compact rotating spotlight, portrait shelves, accessible playback actions and Surprise me.
- Continue watching directly below the spotlight when the profile has unfinished progress; no fabricated activity for new profiles.
- Larger login fields, three equal profile choices, show-password control, Caps Lock hint and username-only remembering.
- Movie and TV genre lists, including TV Movie, Kids, News, Reality, Soap and Talk. A television-only genre on Discover opens Series.
- Actors navigation with popular actors, name search, pagination, filmographies, filmography search/sorting/genre filters and cast links from title details. Missing portraits use initials.
- Watchlists and history remain isolated by immutable username. Kristine’s comfort picks remain personal content within the shared theme.
- Reduced motion, visible keyboard focus, mobile bottom navigation, loading/empty states and catalog retry actions.

`dist/cinematic.css` is the current visual authority. Older stylesheets retain existing player/account utilities; personal theme selectors are inactive. `DESIGN.md` and `PRODUCT.md` document the shared direction.

## Install as an app

Select **Get the app** from login, desktop navigation or the account menu. Supported Chrome/Edge browsers expose a native install prompt when available.

On iPhone/iPad, the guide explains **Safari → Share → Add to Home Screen → Open as Web App (if shown) → Add**. This adds a web app, not a configuration profile or App Store binary. A manifest, 192px/512px icons, maskable icon and Apple touch icon are included.

Production installation requires HTTPS. Browsing and streaming need a connection. Installation does **not** download movies. The service worker caches only a public offline explanation; authenticated APIs, account pages, history and third-party players are never cached. Watchlists/history stay in the browser or app storage where they were saved; no cross-device sync is implied.

## Catalog and accounts

The authenticated `api/tmdb.js` proxy keeps the TMDB token server-side. Modes include home, discover, search, details, artwork, genres, people and person. Actor filmographies combine and deduplicate movie/TV acting credits. Responses use `private, no-store`.

Set `TMDB_BEARER_TOKEN` to the TMDB API Read Access Token, not the short v3 API key. Without it, home shows bundled fallback titles; live search, discovery and actors show an unavailable state with retry.

Accounts are `wakengwapo`, `kdumangas` and `guest`. Authentication uses scrypt hashes and an eight-hour HttpOnly, SameSite session cookie. Production profile/password changes use the existing private Vercel Blob store, conditional writes and session version revocation. Plaintext member passwords are never bundled in the frontend.

Production needs `BLOB_READ_WRITE_TOKEN` (or `BLOB_STORE_ID` with Vercel OIDC) and preferably a random `AUTH_SESSION_SECRET`. If omitted, the existing domain-separated derivation from the TMDB token remains. Run `node --env-file=.env.production.local scripts/seed-members.cjs` when connecting a fresh private store; existing records are preserved. Login/password throttling is per function instance.

## Playback

The existing CineSrc integration remains: quality preferences, season/episode selection, saved-position resume, next episode, restart, retry and stalled-stream help. The iframe sandbox blocks pop-ups, top-level redirects and downloads. Progress requires messages from the configured origin and active iframe. Provider availability and actual stream quality remain outside the app’s control.

## Checks

- `npm run test:discovery`
- `npm run test:install`
- `npm run test:preferences`
- `node scripts/test-history.cjs`
- `node scripts/test-player.cjs`

`npm test` additionally runs authentication tests and requires `TEST_LOGIN_PASSWORD`, `TEST_SECOND_PASSWORD` and `TEST_GUEST_PASSWORD` matching the seeded accounts. Tests use isolated temporary records. Never commit credentials.

Discovery tests mock upstream responses to verify protected endpoints, actor search, pagination, IDs, cast, duplicates and genre routing. Installation tests validate manifest/icon sizes and service-worker boundaries. See `VERIFICATION.md` for performed checks and limits.

## Deploy to the existing Vercel project

Use the repository root, Framework Preset **Other**, install command `npm ci`, no build command, and output directory `dist`. `vercel.json` supplies configuration and service-worker/manifest headers. Preserve existing environment variables and private Blob storage. Static-only hosting cannot run the required login/catalog functions.

This source update does not itself push to GitHub or deploy to Vercel. Validate live TMDB responses and iPhone installation on the deployed HTTPS origin.

## Artwork

Movie/series artwork is retained from the original repository and belongs to the respective rights holders. Source URLs are in `scripts/download-artwork.mjs`. Login photographs are existing user-provided assets. TMDB is attributed in the footer. Generated mockups in `.impeccable/mocks/` are illustrative references, not production artwork or user activity.
