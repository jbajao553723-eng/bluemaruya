# Cinematic streaming — surface brief

## Authority

User-approved direction C on 2026-11-14. Visual reference: `mocks/cinematic.png`; approval and the artwork/history exception: `mocks/cinematic.png.json`. `PRODUCT.md` owns product facts; root `DESIGN.md` owns the extracted visual system.

## Dashboard

Slim horizontal desktop navigation leads into a broad, moderate-height cinematic spotlight with real film imagery, title, metadata, Watch now, More info, save, and slide controls. Continue watching appears immediately below when the account has actual progress. Genre filters precede portrait shelves. Empty history remains an honest empty state; it is not populated to imitate the comp. Actors remains a primary destination.

On phones, keep horizontal shelves, stack toolbar controls, use a bottom destination bar, and place spotlight copy over a stronger bottom scrim. Maintain essential actions without requiring hover.

## Login

Login is a separate screen, not the comp's inset laid over the dashboard. Desktop places the supplied photographic scene next to the sign-in form. On phones, lead with Welcome back, three equal profile choices, username, password, and Sign in; place the photographic scene below the form. All profiles share the same charcoal and coral styling.

## Evidence and verification boundary

Documented from `dist/cinematic.css`, `dist/index.html`, supporting stylesheet rules, approved mock metadata, and parent outputs `dashboard-desktop.png` and `login-mobile.png`. Screenshots establish rendered appearance for captured states; code supplies reusable tokens and responsive rules. The screenshot with no continue row reflects empty account history, not a request to remove the conditional row.

The parent reviewer reports the four material fixes resolved. This documentation pass does not claim automated pixel-fidelity completion, does not mark build phases complete, and does not modify build state. Legacy runtime and media-player utilities remain outside this fixes-only documentation scope.
