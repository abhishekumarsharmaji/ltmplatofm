---
name: Replit App Storage signing
description: Correct presigned-upload URL generation for App Storage external-account credentials.
---

Generate private App Storage upload URLs through Replit's local object-storage sidecar endpoint. Do not call the GCS client's V4 signed-URL method with Replit external-account credentials.

**Why:** The external-account credential intentionally has no service-account `client_email`, so direct GCS signing fails at runtime even though storage reads and writes through the authenticated client work.

**How to apply:** For direct browser uploads, ask the sidecar for a short-lived signed PUT URL, keep the resulting object path private, and authorize all later reads or deletions in the application server.