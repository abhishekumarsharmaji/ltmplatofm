---
name: Public SEO rendering
description: Why public marketplace routes use an Express HTML shell while private application routes remain a client SPA.
---

Public courses, digital products, catalogues, and creator profiles must return meaningful database-backed HTML, route metadata, and structured data before JavaScript runs. Authenticated dashboards and checkout remain client-rendered and excluded from indexing.

**Why:** CoreSkils is a Vite SPA, so client-only route content and metadata are not dependable crawler inputs. The VPS can preserve the existing app while nginx sends only public SEO routes to an Express renderer.

**How to apply:** Any new public, indexable marketplace route must be added to the Express SEO router, dynamic sitemap, nginx public-route allowlist, frontend router, and canonical/schema rules together. Never expose private records in the server-rendered shell.