import { Router, type IRouter } from "express";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, lmsCoursesTable, lmsUsersTable } from "@workspace/db";
import {
  GetSessionResponse,
  ListCoursesResponse,
  LoginBody,
  LoginResponse,
  SignUpBody,
  SignUpResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const COOKIE_NAME = "lms_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  return secret;
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function signSession(userId: number) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${expires}`;
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readSession(token?: string): number | null {
  if (!token) return null;
  const [rawId, rawExpires, signature] = token.split(".");
  if (!rawId || !rawExpires || !signature) return null;
  const payload = `${rawId}.${rawExpires}`;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  if (Number(rawExpires) <= Math.floor(Date.now() / 1000)) return null;
  const id = Number(rawId);
  return Number.isInteger(id) ? id : null;
}

async function ensureSeedData() {
  await db.insert(lmsCoursesTable).values([
      { title: "Python for Data Science", description: "Build practical data analysis skills with Python and pandas.", level: "Intermediate", lessons: 24 },
      { title: "UI/UX Design Principles", description: "Design clear, accessible interfaces for real products.", level: "Beginner", lessons: 18 },
      { title: "Modern Web Development", description: "Create responsive applications with modern web tools.", level: "Advanced", lessons: 32 },
    ]).onConflictDoNothing({ target: lmsCoursesTable.title });
}

router.get("/auth/session", async (req, res): Promise<void> => {
  await ensureSeedData();
  const userId = readSession(req.cookies?.[COOKIE_NAME]);
  if (!userId) {
    res.json(GetSessionResponse.parse({ authenticated: false, user: null }));
    return;
  }
  const [user] = await db.select({
    id: lmsUsersTable.id,
    email: lmsUsersTable.email,
    name: lmsUsersTable.name,
    role: lmsUsersTable.role,
  }).from(lmsUsersTable).where(eq(lmsUsersTable.id, userId));
  res.json(GetSessionResponse.parse(user ? { authenticated: true, user } : { authenticated: false, user: null }));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  await ensureSeedData();
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.select().from(lmsUsersTable).where(eq(lmsUsersTable.email, parsed.data.email.toLowerCase()));
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  res.cookie(COOKIE_NAME, signSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  });
  res.json(LoginResponse.parse({ authenticated: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } }));
});

router.post("/auth/sign-up", async (req, res): Promise<void> => {
  const parsed = SignUpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const email = parsed.data.email.toLowerCase();
  const [existing] = await db.select({ id: lmsUsersTable.id }).from(lmsUsersTable).where(eq(lmsUsersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }
  const [user] = await db.insert(lmsUsersTable).values({
    email,
    name: parsed.data.name,
    role: "student",
    passwordHash: hashPassword(parsed.data.password),
  }).returning({
    id: lmsUsersTable.id,
    email: lmsUsersTable.email,
    name: lmsUsersTable.name,
    role: lmsUsersTable.role,
  });
  res.cookie(COOKIE_NAME, signSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  });
  res.status(201).json(SignUpResponse.parse({ authenticated: true, user }));
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.sendStatus(204);
});

router.get("/courses", async (_req, res): Promise<void> => {
  await ensureSeedData();
  const courses = await db.select().from(lmsCoursesTable).orderBy(lmsCoursesTable.id);
  res.json(ListCoursesResponse.parse(courses));
});

export default router;