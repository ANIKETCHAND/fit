# Backend and GPS Integration Notes

## Linked Repository

Source: [ANIKETCHAND/fit](https://github.com/ANIKETCHAND/fit), branch `main`, inspected at commit `53089c5` on 21 August 2026.

The repository contains a TypeScript FitTrack client, a Node/Express server, and a browser-based GPS walking feature. Its existing server exposes in-memory health, metrics, nutrition, and workout routes. The current GPS feature is client-side: it uses `navigator.geolocation`, stores completed sessions in browser storage, calculates distance using the Haversine formula, and presents route replay, area coverage, and history views.

## Integration Direction

FitTrack will retain the existing API conventions for `/api/health`, `/api/metrics`, `/api/nutrition`, and `/api/workouts`, then introduce a focused GPS session contract so completed routes are saved through the backend rather than only stored locally. The map interface will remain privacy-conscious: tracking begins only after an explicit user action, while the demo route remains clearly labelled as a simulation.

| Domain | Typed contract | User-facing behavior |
| --- | --- | --- |
| Nutrition | `nutrition.list`, `nutrition.create` | A committed meal persists its macro payload and returns an immediate success signal. |
| Biometrics | `metrics.list`, `metrics.create` | A weight checkpoint is stored in kilograms with its UTC measurement time. |
| Training | `workouts.list`, `workouts.create` | A completed protocol records its title, focus, movement count, and estimated volume. |
| GPS | `gps.list`, `gps.create`, `gps.remove` | A finished route persists telemetry points and supports cross-device replay and deletion. |

Every feature procedure will be authenticated and scoped to the current athlete. The frontend will use typed tRPC mutations with optimistic UI where appropriate, preserving browser-only state only for uncommitted in-progress capture.

## Design Direction

The GPS page will use the Kinetic Anatomy Lab system rather than generic bright map cards. It will treat the route as a live physiological trace, reserve Signal Lime for live tracking and active state, use recovery-blue for passive map geometry, and provide a clear operational split between live route capture, coverage analysis, and history replay.

The primary visual surface will be a dark, restrained Google map with a recovery-blue route halo, a Signal Lime active trace, and compact telemetry instruments. The live-control deck will sit asymmetrically beside the route rather than below it. Saved route replay will use a discrete timeline and a calm completed-state treatment, keeping the live position and permission state unmistakable.

## Validation Record

On 21 August 2026, the typed activity contracts and authenticated router flows were covered by automated tests, and TypeScript plus the production build completed successfully. The restored dashboard, nutrition, workout logging, biometric logging, session launch, achievements, exercise library, notification, profile, settings, support, and GPS routes were rendered at desktop width without client-side errors.

The GPS page also exposes a composed fallback when Google Maps is unavailable: capture controls remain present, route telemetry is preserved, and the map surface clearly reports its degraded external-service state without overlapping the positioning guidance. The current service logs show no newer runtime errors following the restart; the only retained module-resolution diagnostic predates the subsequent dependency installation and service restart.

## Frontend Control Audit

The nutrition workflow submits through the visible `Commit {meal}` control after meal selection, and the biometric workflow uses the labelled `Body weight in kilograms` input with its visible `Save checkpoint` action. Both surfaces invoke typed mutations and present success or failure feedback rather than silently changing local state.

The workout workflow requires explicit completion of each named movement before `Save training` calls its typed mutation. GPS follows the same consent-first model: `Start field trace` starts browser location capture, permission and signal callbacks surface clear errors, `Preview simulation` creates an unsaved route, and only `Store completed route` requests backend persistence. The saved-history area contains explicit route selection and removal controls, including a no-history state.

Browser-level verification exercised the live FitTrack routes, each sidebar control, nutrition submission, biometric submission, full-workout submission, and GPS simulation storage action. The browser test intercepted each typed mutation at the application boundary, confirmed the expected request was made, and completed with no page runtime errors. A persistent Vitest contract test now guards the sidebar destination inventory plus the visible typed-mutation and GPS-resilience affordances.

Release validation then exercised the live typed router against the configured database using an isolated temporary athlete. Nutrition, biometric, workout, and GPS records were created, listed back through the authenticated procedures, and the GPS record was removed; all temporary probe data was cleaned up. A separate browser probe explicitly verified the GPS empty-history, location-permission, signal-interruption, save-failure, and remove-failure interfaces. The map layer’s external-service fallback was also observed in the browser without affecting capture controls or saved-route telemetry.

The athlete completed the final authenticated live UI confirmation: GPS trace → Preview simulation → Store completed route produced the expected success message. Final release validation passed afterward: four Vitest files with seven assertions, TypeScript compilation, and the full client-plus-server production build all completed successfully.

The athlete then confirmed the complete authenticated frontend persistence sweep: a nutrition entry, a biometric entry, a workout completion, and a GPS simulated route were all submitted successfully and appeared in their associated refreshed histories. A final release run completed afterward with all seven test assertions passing, clean TypeScript validation, and a successful client-plus-server production bundle.

Independent browser validation can use the application’s signed session-cookie mechanism: authenticated tRPC procedures accept the configured session cookie or a bearer token, and the server resolves the associated athlete before scoping activity records. This permits an isolated test athlete to exercise the actual browser UI, typed API, and database without intercepting requests.

The live nutrition form submits the selected meal through its Commit action, while the live biometric form accepts an accessible body-weight field and persists it through Save checkpoint. Both render typed mutation success/error feedback and return to the overview on success, making them suitable for real browser-to-database verification.

The training flow requires all three accessible movement-completion controls before its Save training action invokes the workout procedure. The typed backend exposes athlete-scoped list procedures for nutrition, metrics, workouts, and GPS sessions, so actual browser-triggered submissions can be confirmed against the live database and client-facing API contract.

An isolated authenticated headless browser session then exercised the real UI without request interception. It committed a nutrition entry, saved a biometric checkpoint, completed all three workout movements and saved training, then loaded and stored a GPS simulation. Each action returned through the live typed backend and produced a row scoped to the isolated athlete in the configured database; the stored GPS trace also appeared as a rendered history card. The temporary athlete and all cascaded test records were removed afterward, and a database query confirmed no probe user remained.
