import { Router, type IRouter } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq, ilike, and, sql } from "drizzle-orm";
import { db, coursesTable, creatorProfilesTable, lmsCoursesTable, lmsUsersTable, usersTable } from "@workspace/db";
import {
  GetSessionResponse,
  ListCoursesResponse,
  LoginBody,
  LoginResponse,
  SignUpBody,
  SignUpResponse,
} from "@workspace/api-zod";
import { readSession, signSession, requireAuth, requireRole, SESSION_COOKIE, sessionTtlSeconds, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();
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

router.get("/auth/session", async (req, res): Promise<void> => {
  const userId = readSession(req.cookies?.[SESSION_COOKIE]);
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
  res.cookie(SESSION_COOKIE, signSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionTtlSeconds * 1000,
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
  res.cookie(SESSION_COOKIE, signSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionTtlSeconds * 1000,
    path: "/",
  });
  res.status(201).json(SignUpResponse.parse({ authenticated: true, user }));
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.sendStatus(204);
});

router.get("/courses", async (_req, res): Promise<void> => {
  const courses = await db.select().from(lmsCoursesTable).orderBy(lmsCoursesTable.id);
  res.json(ListCoursesResponse.parse(courses));
});

router.get("/marketplace/courses", async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const level = typeof req.query.level === "string" ? req.query.level.trim() : "";
  const category = typeof req.query.category === "string" ? Number(req.query.category) : null;
  const filters = [];
  filters.push(eq(coursesTable.status, "published"));
  if (q) filters.push(ilike(coursesTable.title, `%${q}%`));
  if (level) filters.push(eq(coursesTable.level, level));
  if (category && Number.isInteger(category)) filters.push(eq(coursesTable.categoryId, category));
  const courses = await db.select({
    id: coursesTable.id,
    title: coursesTable.title,
    description: coursesTable.description,
    level: coursesTable.level,
    lessons: sql<number>`(
      select count(*)::int
      from lessons
      inner join course_modules on course_modules.id = lessons.module_id
      where course_modules.course_id = courses.id
    )`,
  }).from(coursesTable)
    .where(and(...filters))
    .orderBy(coursesTable.id);
  res.json(ListCoursesResponse.parse(courses));
});

router.post("/creator/upgrade", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user!;
  if (user.role === "admin") {
    res.status(403).json({ error: "Administrators cannot change role through self-service" });
    return;
  }
  if (user.role !== "creator") {
    const updated = await db.transaction(async (tx) => {
      const [lms] = await tx.update(lmsUsersTable).set({ role: "creator" }).where(eq(lmsUsersTable.id, user.id)).returning({
        id: lmsUsersTable.id, email: lmsUsersTable.email, name: lmsUsersTable.name, role: lmsUsersTable.role,
      });
      const [canonical] = await tx.update(usersTable).set({ role: "creator", name: lms.name, passwordHash: user.passwordHash, updatedAt: new Date() })
        .where(eq(usersTable.id, (req as AuthenticatedRequest).canonicalUserId!)).returning();
      await tx.insert(creatorProfilesTable).values({ userId: canonical.id, displayName: canonical.name })
        .onConflictDoUpdate({ target: creatorProfilesTable.userId, set: { displayName: canonical.name, updatedAt: new Date() } });
      return lms;
    });
    res.json({ user: updated });
    return;
  }
  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.get("/creator/courses", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user!;
  const canonicalId = (req as AuthenticatedRequest).canonicalUserId!;
  const courses = await db.select().from(lmsCoursesTable)
    .where((req as AuthenticatedRequest).canonicalRole === "admin" ? undefined : eq(lmsCoursesTable.creatorId, canonicalId))
    .orderBy(lmsCoursesTable.id);
  res.json(courses);
});

router.post("/creator/courses", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user!;
  const canonicalId = (req as AuthenticatedRequest).canonicalUserId!;
  const { title, description = "", level = "all", lessons = 0 } = req.body ?? {};
  if (typeof title !== "string" || title.trim().length < 2 || !Number.isInteger(lessons) || lessons < 0) {
    res.status(400).json({ error: "title and a non-negative integer lessons count are required" });
    return;
  }
  const [course] = await db.insert(lmsCoursesTable).values({
    creatorId: canonicalId, title: title.trim(), description: String(description), level: String(level), lessons,
  }).returning();
  res.status(201).json(course);
});

router.post("/creator/courses/:id/publish", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user!;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid course id" }); return; }
  const [course] = await db.select().from(lmsCoursesTable).where(eq(lmsCoursesTable.id, id));
  if (!course || ((req as AuthenticatedRequest).canonicalRole !== "admin" && course.creatorId !== (req as AuthenticatedRequest).canonicalUserId)) {
    res.status(404).json({ error: "Course not found" }); return;
  }
  const [published] = await db.update(lmsCoursesTable).set({ status: "published" }).where(eq(lmsCoursesTable.id, id)).returning();
  res.json(published);
});

export default router;