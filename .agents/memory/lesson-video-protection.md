---
name: Lesson video protection
description: Decisions and verified browser behaviour behind the student video gate, short-lived R2 links, and the SecureVideoPlayer; read before touching video streaming or the player.
---

# Lesson video protection (student stream route + SecureVideoPlayer)

**Rule:** Keep the 307-redirect-to-presigned-R2 design for playback. Protection layers are (1) session + enrollment
check, (2) a Fetch-Metadata gate (`Sec-Fetch-Dest` video/audio + `Sec-Fetch-Site` same-origin, Referer-host
fallback when no Fetch Metadata), (3) short signed-link TTL (students 5 min, creator preview link 10 min),
(4) player-side deterrents (no native download/PiP/remote playback, context menu blocked, moving watermark,
fullscreen on the wrapper). Treat the gate as a browser-behaviour filter, never as authorization.

**Why:** The user (non-technical, very piracy-sensitive) wants videos viewable only inside the course and saw
"Download" in the native video menu. Proxying whole files through the API was the earlier root cause of
"video not playing" on mobile, so the redirect had to stay. Anything beyond this (screen recording, an
enrolled student copying the R2 link from DevTools within the TTL) needs Cloudflare Stream / HLS + DRM,
which the user has not opted into.

**DRM decision (2026-09-18):** User asked about Netflix-style "black screen on recording", was told it needs a licensed
DRM provider (recommended VdoCipher for India/ed-tech; Mux as alternative; Windows Chrome/Firefox never blacks out
even with DRM) and chose **not now** — current deterrents are enough. Do not re-pitch DRM unprompted; if it comes
back, start with the VdoCipher free trial and keep the direct-to-R2 upload flow (import from R2 into the provider).

**Verified behaviour (Sept 2026, Chromium via Playwright):**
- Chromium keeps requesting the API URL for later byte ranges (seeks after the signed link expired got a fresh
  307 and playback continued) — so a short TTL does not break Chrome playback. The player's error-recovery
  (fresh cache-busted src, restore position) is the safety net for other engines and long pauses.
- `controlsList="nofullscreen"` is honoured (native button and double-click do not fullscreen the bare video);
  the `fullscreenchange` guard that re-targets bare-video fullscreen to the wrapper is for engines that
  ignore controlsList.
- `same-site` is not needed: front and API share one origin behind the path-based proxy.
- Creator "Play / Download" opens the R2 URL directly in a tab, so later ranges reuse that URL — it needs the
  longer TTL, unlike the student player.

**How to apply / test:**
- The dev DB test video (course "Untitled Course", asset id 2) is HEVC — headless Chromium cannot decode it
  (`DEMUXER_ERROR_NO_SUPPORTED_STREAMS`), and Playwright Chromium has no H.264 either. For playback e2e, make a
  VP9/Opus WebM with `ffmpeg -f lavfi -i testsrc2=size=1280x720:rate=24 -f lavfi -i sine=... -c:v libvpx-vp9
  -deadline realtime -cpu-used 8 -b:v 2500k -c:a libopus`, upload with the S3 client from the api-server
  node_modules (`r2://<bucket>/<key>` object path), insert a lesson + `lesson_assets` row, and delete both
  afterwards (the bucket is the production bucket).
- Synthetic Escape in Playwright does not exit fullscreen; use the player's Exit fullscreen button in tests.
- R2 enforces `X-Amz-Expires` strictly (403 `ExpiredRequest` a few seconds after expiry).
