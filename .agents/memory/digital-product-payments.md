---
name: Digital-product payment transition
description: Durable rule for moving the current free digital-product flow to Razorpay or ZapUPI later.
---

Keep digital products free until the user explicitly connects a payment gateway. The current entitlement and private-download model is the delivery layer that future payments should unlock.

**Why:** The user wants SuperProfile-style paid delivery eventually, but explicitly deferred the gateway and named Razorpay or ZapUPI as later options. A browser redirect or success page must never unlock files by itself.

**How to apply:** When payments are added, create the entitlement only from a verified, idempotent server-side payment/webhook event tied to the expected user, product, currency, and amount. Failed, cancelled, duplicate, or unverified payments must not unlock downloads.