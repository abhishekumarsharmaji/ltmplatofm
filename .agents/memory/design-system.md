---
name: Figma-based design system decisions
description: Standing decisions from the full-app restyle to the "Course Selling Website (Community)" Figma — light-only theme, real-data rule, what is intentionally static.
---

# Design decisions (restyle of 2026-09-18)

**Rule 1 — light-only.** The app is pinned to light (`ThemeProvider forcedTheme="light"`); the dashboard theme switcher was removed. Pages use hardcoded palette hex values, so re-enabling dark mode means converting them to semantic tokens first — do not just re-add the toggle.
**Why:** The Figma has no dark variant, and subagents restyled ~40 files with literal hex colors; a dark toggle produced half-dark broken screens.

**Rule 2 — real data only.** No invented stats, testimonials, mentor faces, "Active" badges, or placeholder footer/legal links. Stats on Home/About come from marketplace courses + categories; empty sections hide instead of showing fake content.
**Why:** The user is publishing this as a real product; earlier template copy ("10k+ creators", lorem, no-op links) was flagged by the user and by code review.

**Known static content (accepted, tell the user before changing):** `Pricing.tsx` and `PlatformPricing.tsx` plan names/prices are template copy — no billing exists. `/checkout` intentionally routes to `UnavailablePage` (payments declined for now).

**Figma source:** file key `KDJduvN1uukFx7jzPH9uOM` (CC BY 4.0, FAIZY KHAN); reference renders in `design-reference/figma/`. Fetched with the `FIGMA_TOKEN` secret via curl — there is no Replit Figma integration.
