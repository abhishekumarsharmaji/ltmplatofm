# Cheapest Suitable Hosting for the CoreSkils LMS

**Research date:** 20 September 2026  
**Workload:** React frontend, Node.js/Express API, PostgreSQL, Cloudflare R2 files and external LiveKit media.

## Recommendation

### Best overall budget choice: OVHcloud VPS-2

- **US$8.50/month equivalent, excluding GST**
- The configure link currently uses **12-month upfront billing**
- **4 vCores, 8 GB RAM, 75 GB NVMe**
- Root access
- Daily backup of the previous 24 hours
- Nearby Asia infrastructure; the official page explicitly says it does **not** currently have an India datacentre
- Asia-Pacific allowance shown as approximately 1 TB for this tier before bandwidth is throttled

This provides the right RAM headroom for Node.js, PostgreSQL, Nginx and monitoring at approximately the same advertised monthly cost as HostyCare VS-8, while publishing clearer backup and infrastructure details.[1]

### Cheapest credible qualifying choice: OVHcloud VPS-1

- **US$4.54/month equivalent, excluding GST**
- 12-month upfront billing
- **2 vCores, 4 GB RAM, 40 GB NVMe**
- Daily backup of the previous 24 hours

It can run the project at low traffic, but 4 GB leaves limited headroom. Use it only with tuned PostgreSQL, no local video storage, R2 for files, external LiveKit, swap, monitoring and an additional offsite database backup.[1]

## Practical shortlist

| Plan | Resources | Advertised price | Commitment | Verdict |
|---|---:|---:|---:|---|
| OVHcloud VPS-1 | 2 vCore, 4 GB, 40 GB | US$4.54/mo + GST | 12 months upfront | Cheapest credible minimum |
| OVHcloud VPS-2 | 4 vCore, 8 GB, 75 GB | US$8.50/mo + GST | 12 months upfront | **Best overall value** |
| HostyCare VS-8 | 2 vCPU, 8 GB, 100 GB | ₹749/mo + tax | 24 months | Good India price; confirm KVM, backup and SLA |
| Hostinger KVM 2 | 2 vCPU, 8 GB, 100 GB | US$8.99/mo intro | 24 months; renews US$14.99/mo | Transparent KVM; higher renewal |
| RackNerd special | About 2 vCPU, 4 GB | US$59.99/year | Annual prepaid | Cheap test server; weak refund/renewal clarity |
| DigitalOcean | 2 vCPU, 4 GB, 80 GB | US$24/mo | Hourly/monthly | Reliable Bangalore option; backups extra |
| Akamai/Linode | 2 vCPU, 4 GB, 80 GB | US$24/mo | Hourly/monthly | Reliable Mumbai/Chennai option; backups extra |

Prices are point-in-time advertised figures. Currency conversion, GST, payment charges and optional backups change the final invoice.

## Why the other “cheapest” offers were rejected

- **Oracle Cloud Always Free:** potentially ₹0, but capacity shortages, ARM compatibility, inactivity reclamation and lack of a production SLA make it unsuitable as the only commercial LMS server.[11]
- **RackNerd/LowEnd specials:** low annual equivalent, but no default refund and unclear future renewal make them better for testing or a secondary node.[4][5]
- **Hetzner Singapore:** old articles show very low prices, but Hetzner’s official June 2026 adjustment lists much higher Singapore pricing. Historic numbers should not be used for this purchase.[6][7]
- **Contabo:** attractive resources, but checkout commitment, regional latency and promotion/renewal details were less clear than OVHcloud.[12][13]
- **AWS, Google Cloud and Azure:** dependable, but disk, IPv4, egress and backup line items make them more expensive for this single-server workload.
- **Shared/cPanel hosting:** unsuitable because this application needs a long-running Node process, root-level configuration, PostgreSQL control and reliable WebSocket/API handling.

## Before purchasing

1. Select Ubuntu 24.04 LTS or 22.04 LTS.
2. Confirm the actual datacentre shown at checkout and test latency from India.
3. Confirm IPv4 inclusion, GST, final 12-month total and renewal price.
4. Keep Cloudflare R2 and LiveKit external; do not store lesson videos on the VPS.
5. Add nightly encrypted PostgreSQL backups to a separate provider. A same-provider one-day snapshot is not enough.
6. Use Nginx, firewall, automatic security updates, monitoring and swap.

## Sources

1. OVHcloud, VPS India pricing and specifications: https://www.ovhcloud.com/asia/vps/vps-india  
2. HostyCare, VPS Hosting: https://www.hostycare.com/vps-hosting  
3. Hostinger, VPS in India: https://www.hostinger.com/vps/servers/india  
4. RackNerd specials: https://racknerd.com/specials/index.html  
5. RackNerd terms: https://www.racknerd.com/terms-of-service  
6. Hetzner 15 June 2026 price adjustment: https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment  
7. Hetzner regular-performance cloud plans: https://www.hetzner.com/cloud/regular-performance  
8. DigitalOcean Droplet pricing: https://docs.digitalocean.com/products/droplets/details/pricing/  
9. Akamai/Linode pricing: https://www.linode.com/pricing/  
10. AWS Lightsail bundles: https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-bundles.html  
11. Oracle Cloud Free Tier: https://www.oracle.com/cloud/free/  
12. Contabo VPS catalogue: https://contabo.com/en-us/vps  
13. Contabo refund policy: https://help.contabo.com/en/support/solutions/articles/103000285149-can-i-get-a-refund-  
14. Vultr pricing: https://www.vultr.com/pricing/  
15. Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/  
16. LiveKit Cloud documentation: https://docs.livekit.io/home/cloud  