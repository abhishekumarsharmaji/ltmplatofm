---
name: Public product links
description: Rules for generating stable, customizable creator share links for public products.
---

Build product share URLs from the browser's active origin and a creator-owned unique slug, while preserving numeric-ID URLs for backward compatibility.

**Why:** Development `.replit.dev` URLs are temporary previews. Published `.replit.app` and attached custom domains are the stable public origins, and hardcoded domains would break when the app moves between them.

**How to apply:** Never store or hardcode the host in product records. Store only the validated unique slug, render absolute copy links from the current origin, and keep public resolution limited to published products.