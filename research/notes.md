# Research Notes: Cheapest Suitable Hosting for the CoreSkils LMS

**Status:** complete
**Depth:** Standard

## Plan

- **Question:** Which currently available hosting plan is the cheapest dependable option for this Node.js/PostgreSQL LMS, and which offers the best overall value for users in India?
- **Scope:** Unmanaged VPS/cloud servers with root access; compare real renewal cost, taxes, resources, location/latency, backups, IPv4, provider reliability and project compatibility. Exclude ordinary shared hosting.
- **Audience:** Project owner making a practical hosting purchase.
- **Deliverable:** Shortlist with current prices, important caveats, and one clear recommendation.

## Focus Areas

| # | Area | Status | Sources |
|---|---|---|---|
| 1 | Lowest-cost global VPS offers | done | 8 |
| 2 | India/Asia VPS options and latency | done | 7 |
| 3 | Established cloud providers and free tiers | done | 8 |
| 4 | Reliability, renewal pricing, refunds and support | done | 10 |
| 5 | CoreSkils technical sizing and migration fit | done | 6 |

## Coverage Checklist

- [x] Identify the cheapest plans that meet at least 2 vCPU and 4 GB RAM.
- [x] Separate introductory prices from renewal and mandatory long-term billing.
- [x] Check root access, virtualization, IPv4, storage and bandwidth.
- [x] Account for Indian latency and taxes/currency.
- [x] Evaluate provider trust, support, backups and refund caveats.
- [x] Match the shortlisted servers to the LMS architecture.
- [x] Recommend one cheapest workable and one best-value option.

## Findings Log

- OVHcloud VPS-1 is the lowest credible qualifying offer found: US$4.54/month equivalent, prepaid 12 months, 2 vCore/4 GB/40 GB NVMe and one-day backup; page says nearby Asia, not an India datacentre.
- OVHcloud VPS-2 is the best budget fit: US$8.50/month equivalent, prepaid 12 months, 4 vCore/8 GB/75 GB NVMe and one-day backup.
- HostyCare VS-8 is ₹749/month equivalent with a two-year commitment and India location, but its public page does not clearly confirm KVM, backup, SLA or facility details.
- Hostinger KVM 2 is more transparent but renews materially higher than its introductory price.
- RackNerd annual specials and Oracle Always Free can be cheaper, but neither is suitable as the only production LMS server.
- DigitalOcean/Linode India-region plans are easier and more predictable but cost about US$24/month for 2 vCPU/4 GB.
- This stack should use 8 GB RAM where possible; 4 GB is workable only with careful tuning and offsite PostgreSQL backups.

## Conflicts & Open Questions

- Some official pages use dynamic regional prices. Checkout, GST, datacentre and renewal figures remain authoritative.
- OVHcloud labels the offer “VPS India” while stating that no datacentre is in India; treat it as a nearby Asia-region service and test latency.
- Hetzner’s 2026 Singapore prices are materially higher than old search results, so historic €4–€8 claims were rejected.

## Gaps

- Exact ping from the buyer’s ISP cannot be established before provisioning; use the refund/cancellation window or a short test where available.