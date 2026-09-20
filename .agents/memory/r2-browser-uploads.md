---
name: R2 browser uploads
description: Production upload routing for small files stored in Cloudflare R2.
---

Use same-origin authenticated API endpoints to upload small files such as thumbnails and avatars, then let the server write to R2. Do not rely on direct browser PUT requests to signed R2 URLs unless bucket CORS has been explicitly configured and verified for every production origin.

**Why:** Direct signed-URL uploads worked structurally but failed in the production browser as `Failed to fetch` because the cross-origin R2 request was blocked before the application could finalize the upload.

**How to apply:** For small bounded uploads, accept `application/octet-stream` at an authenticated API route, validate the declared MIME type and byte limit, and upload to R2 server-side. Large multipart uploads need a separate CORS-aware design.