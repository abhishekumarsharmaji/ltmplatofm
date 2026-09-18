---
name: Visual verification of logged-in pages
description: How to screenshot dashboard/authenticated pages in this workspace (no Playwright), and where the throwaway dev accounts came from.
---

# Screenshotting authenticated pages

**Rule:** For pages behind login, use `node scripts/dev-screenshot.mjs <curl-cookie-jar> <outPrefix> <width> <path...>` (headless Chromium at `/repl/tools/bin/chromium` driven over CDP; injects the session cookie with `Network.setCookie`). The built-in Screenshot tool cannot send cookies, and Playwright is not installed.

**Why:** Dashboards were restyled without visual proof once because the subagent could not log in; the script closed that gap. curl cookie jars mark the session cookie `#HttpOnly_` — the script strips that prefix (otherwise the cookie is silently dropped and every page redirects to `/auth/login`).

**How to apply:**
- Create the jar with `curl -c jar -X POST .../api/auth/sign-up` (or `/login`). Dev-only accounts `dev-student@example.com`, `dev-creator@example.com`, `dev-admin@example.com` (password `DevPass123!`) exist in the **development** DB only; roles were promoted with a direct SQL update because sign-up always creates students.
- Widths 1440 and 390 cover desktop and mobile; page height is capped at 2600px per capture.
