# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- `GitHub Auto Sync` workflow (`scripts/github-sync.sh`) mirrors local `master` → `main` on github.com/abhishekumarsharmaji/ltmplatofm every 2 min while the workspace runs; needs the `GITHUB_TOKEN` secret (fine-grained, Contents read/write). It never overwrites commits made directly on GitHub — pull those in the Git pane first.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- Visual design follows the Figma "Course Selling Website (Community)" file (light theme, Outfit font, green `#15CF74` primary). The app is pinned to light mode (`ThemeProvider forcedTheme="light"`); pages use literal palette hex values, so dark mode is not supported.
- Real data only in UI: stats, mentors and lists come from the API; no invented numbers, testimonials, stock faces or placeholder links. Empty sections hide rather than show fake content.
- Lesson videos stay on Cloudflare R2 behind a 307 → presigned URL; live classes run on LiveKit Cloud. Neither may depend on Replit hosting in production.

## Product

- Product name: **CoreSkils** (exact spelling, one “l”); official domain: `coreskils.com`.
- Online learning marketplace and creator platform with courses, video lessons, live classes, digital products, and student/creator/admin dashboards.

## User preferences

- Reply in Hinglish (English technical terms), concise; the user is a non-technical director.
- No payments/checkout build yet (`/checkout` routes to the unavailable page); `Pricing`/`PlatformPricing` plan copy is static template content — confirm before changing.

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` so the React client types update.
- Authenticated pages can be screenshotted with `node scripts/dev-screenshot.mjs <curl-cookie-jar> <outPrefix> <width> <paths…>` (headless Chromium over CDP; Playwright is not installed).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
