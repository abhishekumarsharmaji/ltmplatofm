---
name: Abort signal propagation
description: Browser compatibility rule for forwarding React Query request cancellations through the shared fetch wrapper.
---

When an external AbortSignal has no reason, propagate it with `controller.abort()` rather than `controller.abort(undefined)`.

**Why:** Some browser runtimes treat an explicitly undefined abort reason as an invalid already-aborted signal and surface “signal is aborted without reason” through the Vite runtime overlay during normal route cancellation.

**How to apply:** Preserve a defined external reason, but use the no-argument AbortController method when the reason is undefined. Normal React Query cancellations should then remain standard `AbortError` rejections.