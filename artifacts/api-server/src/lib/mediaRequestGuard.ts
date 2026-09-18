import type { Request } from "express";

const MEDIA_DESTINATIONS = new Set(["video", "audio"]);
// The player and the API share one origin (path-based proxy), so a sibling subdomain is never legitimate.
const OWN_SITE_VALUES = new Set(["same-origin"]);

function header(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim().toLowerCase() || undefined;
}

function ownHosts(req: Request): Set<string> {
  const hosts = new Set<string>();
  const add = (value: string | string[] | undefined) => {
    for (const raw of Array.isArray(value) ? value : [value ?? ""]) {
      for (const host of raw.split(",")) {
        const clean = host.trim().toLowerCase();
        if (clean) hosts.add(clean);
      }
    }
  };
  add(req.headers.host);
  add(req.headers["x-forwarded-host"]);
  add(process.env.REPLIT_DOMAINS);
  return hosts;
}

/**
 * Accepts only requests issued by a <video>/<audio> element on one of our own pages.
 *
 * Modern browsers announce this through Fetch Metadata (Sec-Fetch-Dest: video, Sec-Fetch-Site: same-origin).
 * Opening the URL in a tab (dest: document), copying it into a download manager or curl (no metadata),
 * or embedding it on another site (site: cross-site) is rejected. Engines without Fetch Metadata
 * (iOS < 16.4, AVFoundation media loads) still send the page URL as Referer, so fall back to a same-host check.
 *
 * This is a browser-behaviour gate, not an authorization boundary: the session + enrollment checks stay in
 * the route. A client that forges these headers gains nothing it could not get by forging Sec-Fetch-Dest,
 * which is why the Referer fallback may also trust the proxy-supplied X-Forwarded-Host.
 */
export function isCoursePlayerMediaRequest(req: Request): boolean {
  const dest = header(req, "sec-fetch-dest");
  const site = header(req, "sec-fetch-site");
  if (dest || site) {
    return !!dest && MEDIA_DESTINATIONS.has(dest) && (!site || OWN_SITE_VALUES.has(site));
  }
  const referer = header(req, "referer");
  if (!referer) return false;
  try {
    return ownHosts(req).has(new URL(referer).host);
  } catch {
    return false;
  }
}
