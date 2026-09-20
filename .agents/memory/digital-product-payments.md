---
name: Digital-product payment verification
description: Durable rules for ZapUPI payment verification and digital-product entitlement renewal.
---

ZapUPI is the approved payment provider for paid digital products. A payment grants access only after the backend independently confirms the exact order through ZapUPI's order-status API and validates the expected amount.

Access duration is independent of the short-lived download session. Products/courses may grant lifetime, fixed-day, monthly, or yearly access, plus an optional one-time trial. Re-entering the same buyer email must not reset expiry.

**Why:** Redirect query parameters and unsigned webhook payloads can be forged. ZapUPI's authenticated status lookup is the authority for payment success.

**How to apply:** Keep finalization idempotent, compare the provider order and amount with the stored order, and create or renew the entitlement in the same database transaction that claims the pending payment. Failed, cancelled, duplicate, amount-mismatched, or unverified events must not unlock downloads. Active fixed-duration access renewals extend from the existing expiry; lifetime access remains without an expiry.