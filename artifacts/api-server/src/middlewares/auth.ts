import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db, lmsUsersTable, usersTable } from "@workspace/db";

export const SESSION_COOKIE = "lms_session";
export const SUPER_ADMIN_EMAIL = "xbhishekh@gmail.com";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export type EffectiveRole = "student" | "creator" | "admin";

function secret() {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required");
  return process.env.SESSION_SECRET;
}

export function readSession(token?: string): number | null {
  if (!token) return null;
  const [rawId, rawExpires, signature] = token.split(".");
  if (!rawId || !rawExpires || !signature) return null;
  const payload = `${rawId}.${rawExpires}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  if (Number(rawExpires) <= Math.floor(Date.now() / 1000)) return null;
  const id = Number(rawId);
  return Number.isInteger(id) ? id : null;
}

export function signSession(userId: number) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${expires}`;
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}

export type AuthenticatedRequest = Express.Request & {
  user?: typeof lmsUsersTable.$inferSelect;
  canonicalUserId?: number;
  canonicalRole?: "student" | "creator" | "admin";
};

export function isSuperAdminEmail(email: string) {
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

/** One role policy for every auth surface. Admin is never inherited from legacy data. */
export function effectiveRole(email: string, ...storedRoles: Array<string | null | undefined>): EffectiveRole {
  if (isSuperAdminEmail(email)) return "admin";
  return storedRoles.some((role) => role === "creator") ? "creator" : "student";
}

export async function reconcileEffectiveRole(user: typeof lmsUsersTable.$inferSelect) {
  let [canonical] = await db.select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable).where(eq(usersTable.email, user.email)).limit(1);
  const role = effectiveRole(user.email, user.role, canonical?.role);
  if (!canonical) {
    [canonical] = await db.insert(usersTable).values({
      email: user.email, name: user.name, role, passwordHash: user.passwordHash,
    }).returning({ id: usersTable.id, role: usersTable.role });
  } else if (canonical.role !== role) {
    [canonical] = await db.update(usersTable).set({ role, updatedAt: new Date() })
      .where(eq(usersTable.id, canonical.id)).returning({ id: usersTable.id, role: usersTable.role });
  }
  if (user.role !== role) {
    await db.update(lmsUsersTable).set({ role }).where(eq(lmsUsersTable.id, user.id));
    user.role = role;
  }
  return { canonicalUserId: canonical.id, role };
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const id = readSession(req.cookies?.[SESSION_COOKIE]);
  if (!id) { res.status(401).json({ error: "Authentication required" }); return; }
  const [user] = await db.select().from(lmsUsersTable).where(eq(lmsUsersTable.id, id));
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }
  const reconciled = await reconcileEffectiveRole(user);
  (req as AuthenticatedRequest).user = user;
  (req as AuthenticatedRequest).canonicalUserId = reconciled.canonicalUserId;
  (req as AuthenticatedRequest).canonicalRole = reconciled.role;
  next();
};

export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !roles.includes((req as AuthenticatedRequest).canonicalRole ?? user.role)) { res.status(403).json({ error: "Insufficient permissions" }); return; }
    next();
  };
}

export const requireSuperAdmin: RequestHandler = (req, res, next) => {
  const auth = req as AuthenticatedRequest;
  if (!auth.user || !isSuperAdminEmail(auth.user.email)) {
    res.status(403).json({ error: "Super administrator access required" });
    return;
  }
  next();
};

export const sessionTtlSeconds = SESSION_TTL_SECONDS;