import { Router, type IRouter } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq, ilike, and, inArray, sql } from "drizzle-orm";
import { db, coursesTable, courseModulesTable, lessonsTable, lessonAssetsTable, productsTable, creatorProfilesTable, lmsCoursesTable, lmsUsersTable, usersTable, creatorApplicationsTable } from "@workspace/db";
import {
  GetSessionResponse,
  ListCoursesResponse,
  LoginBody,
  LoginResponse,
  SignUpBody,
  SignUpResponse,
} from "@workspace/api-zod";
import { readSession, signSession, requireAuth, requireRole, requireSuperAdmin, isSuperAdminEmail, SESSION_COOKIE, sessionTtlSeconds, type AuthenticatedRequest } from "../middlewares/auth";

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
  if (user && isSuperAdminEmail(user.email) && user.role !== "admin") user.role = "admin";
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
  const role = isSuperAdminEmail(user.email) ? "admin" : user.role;
  res.json(LoginResponse.parse({ authenticated: true, user: { id: user.id, email: user.email, name: user.name, role } }));
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
    role: isSuperAdminEmail(email) ? "admin" : "student",
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
  res.status(201).json(SignUpResponse.parse({ authenticated: true, user: { ...user, role: isSuperAdminEmail(email) ? "admin" : "student" } }));
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
    thumbnailUrl: coursesTable.thumbnailUrl,
    outcomes: coursesTable.outcomes,
    faqs: coursesTable.faqs,
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

router.post("/creator/upgrade", (_req, res): void => { res.status(410).json({ error: "Direct creator upgrades are disabled. Submit a creator application." }); });

function applicationPayload(body: any) {
  const required = ["displayName", "headline", "bio", "expertise", "courseProposal", "targetAudience", "motivation"];
  if (!body || required.some((key) => typeof body[key] !== "string" || !body[key].trim())) return null;
  if (!Array.isArray(body.teachingTopics) || !body.teachingTopics.every((item: unknown) => typeof item === "string" && item.trim())) return null;
  return {
    displayName: body.displayName.trim(), headline: body.headline.trim(), bio: body.bio.trim(), expertise: body.expertise.trim(),
    experienceYears: Number.isInteger(body.experienceYears) && body.experienceYears >= 0 ? body.experienceYears : 0,
    portfolioUrl: body.portfolioUrl?.trim() || null, linkedinUrl: body.linkedinUrl?.trim() || null, websiteUrl: body.websiteUrl?.trim() || null,
    teachingTopics: body.teachingTopics.map((item: string) => item.trim()), courseProposal: body.courseProposal.trim(),
    targetAudience: body.targetAudience.trim(), sampleWorkUrl: body.sampleWorkUrl?.trim() || null, motivation: body.motivation.trim(),
  };
}

router.get("/creator-applications/me", requireAuth, async (req, res): Promise<void> => {
  const [application] = await db.select().from(creatorApplicationsTable).where(eq(creatorApplicationsTable.userId, (req as AuthenticatedRequest).canonicalUserId!));
  res.json(application ?? null);
});
router.post("/creator-applications", requireAuth, async (req, res): Promise<void> => {
  const auth = req as AuthenticatedRequest;
  if (auth.canonicalRole !== "student") { res.status(403).json({ error: "Only student accounts can submit applications" }); return; }
  const payload = applicationPayload(req.body);
  if (!payload) { res.status(400).json({ error: "Complete creator application details are required" }); return; }
  const [existing] = await db.select({ id: creatorApplicationsTable.id, status: creatorApplicationsTable.status }).from(creatorApplicationsTable).where(eq(creatorApplicationsTable.userId, auth.canonicalUserId!));
  if (existing?.status === "approved") { res.status(409).json({ error: "This account is already an approved creator" }); return; }
  const [application] = existing
    ? await db.update(creatorApplicationsTable).set({ ...payload, status: "pending", reviewReason: null, reviewedAt: null, reviewedBy: null, updatedAt: new Date() }).where(eq(creatorApplicationsTable.id, existing.id)).returning()
    : await db.insert(creatorApplicationsTable).values({ ...payload, userId: auth.canonicalUserId! }).returning();
  res.status(existing ? 200 : 201).json(application);
});
router.get("/admin/creator-applications", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const rows = await db.select({ application: creatorApplicationsTable, user: { id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role } })
    .from(creatorApplicationsTable).innerJoin(usersTable, eq(usersTable.id, creatorApplicationsTable.userId))
    .where(status && ["pending", "approved", "rejected"].includes(status) ? eq(creatorApplicationsTable.status, status as any) : undefined);
  res.json(rows);
});
router.post("/admin/creator-applications/:id/approve", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id); if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid application id" }); return; }
  const auth = req as AuthenticatedRequest;
  const result = await db.transaction(async (tx) => {
    const [application] = await tx.select().from(creatorApplicationsTable).where(eq(creatorApplicationsTable.id, id));
    if (!application) return null;
    const [canonical] = await tx.update(usersTable).set({ role: "creator", updatedAt: new Date() }).where(eq(usersTable.id, application.userId)).returning();
    await tx.update(lmsUsersTable).set({ role: "creator" }).where(eq(lmsUsersTable.email, canonical.email));
    await tx.insert(creatorProfilesTable).values({ userId: canonical.id, displayName: application.displayName, bio: application.bio })
      .onConflictDoUpdate({ target: creatorProfilesTable.userId, set: { displayName: application.displayName, bio: application.bio, updatedAt: new Date() } });
    const [updated] = await tx.update(creatorApplicationsTable).set({ status: "approved", reviewedAt: new Date(), reviewedBy: auth.canonicalUserId!, reviewReason: null, updatedAt: new Date() }).where(eq(creatorApplicationsTable.id, id)).returning();
    return updated;
  });
  if (!result) { res.status(404).json({ error: "Application not found" }); return; }
  res.json(result);
});
router.post("/admin/creator-applications/:id/reject", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id), reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  if (!Number.isInteger(id) || !reason) { res.status(400).json({ error: "Application id and rejection reason are required" }); return; }
  const [result] = await db.update(creatorApplicationsTable).set({ status: "rejected", reviewReason: reason, reviewedAt: new Date(), reviewedBy: (req as AuthenticatedRequest).canonicalUserId!, updatedAt: new Date() }).where(eq(creatorApplicationsTable.id, id)).returning();
  if (!result) { res.status(404).json({ error: "Application not found" }); return; }
  res.json(result);
});

router.get("/creator/courses", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user!;
  const canonicalId = (req as AuthenticatedRequest).canonicalUserId!;
  const courses = await db.select().from(lmsCoursesTable)
    .where((req as AuthenticatedRequest).canonicalRole === "admin" ? undefined : eq(lmsCoursesTable.creatorId, canonicalId))
    .orderBy(lmsCoursesTable.id);
  res.json(courses);
});

/* The builder deliberately operates on the canonical course/product graph.  The
 * older lms_courses endpoints above remain for backwards compatibility. */
function positiveId(value: string | string[]) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}
function ownerFilter<T>(table: T, id: any, creatorId: number, admin: boolean) {
  return admin ? eq((table as any).id, id) : and(eq((table as any).id, id), eq((table as any).creatorId, creatorId));
}

async function builderProduct(productId: number, req: AuthenticatedRequest) {
  const rows = await db.select({ product: productsTable, course: coursesTable })
    .from(productsTable).leftJoin(coursesTable, eq(coursesTable.id, productsTable.courseId))
    .where(ownerFilter(productsTable, productId, req.canonicalUserId!, req.canonicalRole === "admin"));
  const row = rows[0];
  if (row?.course && req.canonicalRole !== "admin" && row.course.creatorId !== req.canonicalUserId) return undefined;
  return row;
}

router.get("/creator/products/:productId/builder", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = positiveId(req.params.productId);
  if (!productId) { res.status(400).json({ error: "Invalid product id" }); return; }
  const found = await builderProduct(productId, req as AuthenticatedRequest);
  if (!found || !found.course) { res.status(404).json({ error: "Course product not found" }); return; }
  const modules = await db.select().from(courseModulesTable).where(eq(courseModulesTable.courseId, found.course.id)).orderBy(courseModulesTable.position);
  const moduleIds = modules.map((m) => m.id);
  const lessons = moduleIds.length ? await db.select().from(lessonsTable).where(inArray(lessonsTable.moduleId, moduleIds)).orderBy(lessonsTable.position) : [];
   const lessonIds = lessons.map((l) => l.id);
   const assets = lessonIds.length ? await db.select().from(lessonAssetsTable).where(inArray(lessonAssetsTable.lessonId, lessonIds)) : [];
   res.json({ product: found.product, course: found.course, modules: modules.map((m) => ({ ...m, lessons: lessons.filter((l) => l.moduleId === m.id).map((l) => ({ ...l, assets: assets.filter((a) => a.lessonId === l.id) })) })) });
});

router.patch("/creator/products/:productId/builder", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = positiveId(req.params.productId), auth = req as AuthenticatedRequest;
  if (!productId) { res.status(400).json({ error: "Invalid product id" }); return; }
  const found = await builderProduct(productId, auth);
  if (!found?.course) { res.status(404).json({ error: "Course product not found" }); return; }
  const body = req.body ?? {};
  const title = body.title === undefined ? found.course.title : body.title;
  const description = body.description === undefined ? found.course.description : body.description;
  const thumbnailUrl = body.thumbnailUrl === undefined ? found.course.thumbnailUrl : body.thumbnailUrl;
  const level = body.level === undefined ? found.course.level : body.level;
  const outcomes = body.outcomes === undefined ? found.course.outcomes : body.outcomes;
  const faqs = body.faqs === undefined ? found.course.faqs : body.faqs;
  const validFaqs = Array.isArray(faqs) && faqs.every((faq: unknown) => typeof faq === "object" && faq !== null && typeof (faq as any).question === "string" && typeof (faq as any).answer === "string");
  if (typeof title !== "string" || title.trim().length < 2 || typeof description !== "string" || (thumbnailUrl !== null && typeof thumbnailUrl !== "string") || typeof level !== "string" || !Array.isArray(outcomes) || !outcomes.every((item: unknown) => typeof item === "string") || !validFaqs) {
    res.status(400).json({ error: "Valid course title, description, thumbnail, level, outcomes and FAQs are required" }); return;
  }
  const updated = await db.transaction(async (tx) => {
    const [course] = await tx.update(coursesTable).set({ title: title.trim(), description, thumbnailUrl: thumbnailUrl?.trim() || null, level, outcomes: outcomes.map((item: string) => item.trim()).filter(Boolean), faqs: faqs.map((faq: any) => ({ question: faq.question.trim(), answer: faq.answer.trim() })).filter((faq: any) => faq.question && faq.answer), priceMinor: 0, currency: "USD", updatedAt: new Date() }).where(ownerFilter(coursesTable, found.course!.id, auth.canonicalUserId!, auth.canonicalRole === "admin")).returning();
    await tx.update(productsTable).set({ title: title.trim(), description, priceMinor: 0, currency: "USD", updatedAt: new Date() }).where(eq(productsTable.id, productId));
    return course;
  });
  res.json(updated);
});

router.get("/creator/products/:productId/readiness", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = positiveId(req.params.productId);
  if (!productId) { res.status(400).json({ error: "Invalid product id" }); return; }
  const found = await builderProduct(productId, req as AuthenticatedRequest);
  if (!found?.course) { res.status(404).json({ error: "Course product not found" }); return; }
  const modules = await db.select().from(courseModulesTable).where(eq(courseModulesTable.courseId, found.course.id));
  const lessonCount = modules.length ? (await db.select({ count: sql<number>`count(*)::int` }).from(lessonsTable).where(inArray(lessonsTable.moduleId, modules.map((m) => m.id))))[0]?.count ?? 0 : 0;
  const checks = { title: found.course.title.trim().length >= 2, description: found.course.description.trim().length > 0, module: modules.length > 0, lesson: lessonCount > 0 };
  res.json({ ready: Object.values(checks).every(Boolean), checks, moduleCount: modules.length, lessonCount });
});

router.post("/creator/products/:productId/publish-course", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = positiveId(req.params.productId), auth = req as AuthenticatedRequest;
  if (!productId) { res.status(400).json({ error: "Invalid product id" }); return; }
  const found = await builderProduct(productId, auth);
  if (!found?.course) { res.status(404).json({ error: "Course product not found" }); return; }
  const modules = await db.select({ id: courseModulesTable.id }).from(courseModulesTable).where(eq(courseModulesTable.courseId, found.course.id));
  const lessonCount = modules.length ? (await db.select({ count: sql<number>`count(*)::int` }).from(lessonsTable).where(inArray(lessonsTable.moduleId, modules.map((m) => m.id))))[0]?.count ?? 0 : 0;
  if (found.course.title.trim().length < 2 || !found.course.description.trim() || !modules.length || !lessonCount) { res.status(422).json({ error: "Course requires a valid title, description, at least one module and one lesson" }); return; }
  const publishedAt = new Date();
  const result = await db.transaction(async (tx) => {
    const [course] = await tx.update(coursesTable).set({ status: "published", publishedAt, updatedAt: publishedAt }).where(ownerFilter(coursesTable, found.course!.id, auth.canonicalUserId!, auth.canonicalRole === "admin")).returning();
    const [product] = await tx.update(productsTable).set({ status: "published", updatedAt: publishedAt }).where(eq(productsTable.id, productId)).returning();
    return { course, product };
  });
  res.json(result);
});

async function ownedModule(moduleId: number, auth: AuthenticatedRequest) {
  const [row] = await db.select({ module: courseModulesTable, course: coursesTable }).from(courseModulesTable).innerJoin(coursesTable, eq(coursesTable.id, courseModulesTable.courseId))
    .where(and(eq(courseModulesTable.id, moduleId), auth.canonicalRole === "admin" ? undefined : eq(coursesTable.creatorId, auth.canonicalUserId!)));
  return row;
}
router.post("/creator/products/:productId/modules", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = positiveId(req.params.productId), auth = req as AuthenticatedRequest, body = req.body ?? {};
  if (!productId || typeof body.title !== "string" || !body.title.trim()) { res.status(400).json({ error: "Valid product id and module title are required" }); return; }
  const found = await builderProduct(productId, auth); if (!found?.course) { res.status(404).json({ error: "Course product not found" }); return; }
  const [last] = await db.select({ position: sql<number>`coalesce(max(${courseModulesTable.position}), -1)` }).from(courseModulesTable).where(eq(courseModulesTable.courseId, found.course.id));
  const [module] = await db.insert(courseModulesTable).values({ courseId: found.course.id, title: body.title.trim(), position: (last?.position ?? -1) + 1 }).returning();
  res.status(201).json({ ...module, lessons: [] });
});
router.patch("/creator/modules/:moduleId", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const id = positiveId(req.params.moduleId), auth = req as AuthenticatedRequest;
  if (!id || typeof req.body?.title !== "string" || !req.body.title.trim()) { res.status(400).json({ error: "Valid module id and title are required" }); return; }
  if (!await ownedModule(id, auth)) { res.status(404).json({ error: "Module not found" }); return; }
  const [module] = await db.update(courseModulesTable).set({ title: req.body.title.trim() }).where(eq(courseModulesTable.id, id)).returning(); res.json(module);
});
router.delete("/creator/modules/:moduleId", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => { const id = positiveId(req.params.moduleId); if (!id || !await ownedModule(id, req as AuthenticatedRequest)) { res.status(404).json({ error: "Module not found" }); return; } await db.delete(courseModulesTable).where(eq(courseModulesTable.id, id)); res.sendStatus(204); });
router.post("/creator/products/:productId/modules/reorder", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = positiveId(req.params.productId), ids = req.body?.moduleIds;
  if (!productId || !Array.isArray(ids) || !ids.every((n: unknown) => Number.isInteger(n))) { res.status(400).json({ error: "moduleIds array is required" }); return; }
  const found = await builderProduct(productId, req as AuthenticatedRequest); if (!found?.course) { res.status(404).json({ error: "Course product not found" }); return; }
  const rows = await db.select().from(courseModulesTable).where(eq(courseModulesTable.courseId, found.course.id)); if (rows.length !== ids.length || new Set(ids).size !== ids.length || !rows.every((r) => ids.includes(r.id))) { res.status(400).json({ error: "moduleIds must contain every course module exactly once" }); return; }
  await db.transaction(async (tx) => { for (let i = 0; i < ids.length; i++) await tx.update(courseModulesTable).set({ position: 100000 + i }).where(eq(courseModulesTable.id, ids[i])); for (let i = 0; i < ids.length; i++) await tx.update(courseModulesTable).set({ position: i }).where(eq(courseModulesTable.id, ids[i])); }); res.json({ ok: true });
});
router.post("/creator/modules/:moduleId/lessons", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const moduleId = positiveId(req.params.moduleId), auth = req as AuthenticatedRequest, body = req.body ?? {};
  if (!moduleId || typeof body.title !== "string" || !body.title.trim()) { res.status(400).json({ error: "Valid module id and lesson title are required" }); return; }
  if (!await ownedModule(moduleId, auth)) { res.status(404).json({ error: "Module not found" }); return; }
  const [last] = await db.select({ position: sql<number>`coalesce(max(${lessonsTable.position}), -1)` }).from(lessonsTable).where(eq(lessonsTable.moduleId, moduleId));
  const [lesson] = await db.insert(lessonsTable).values({ moduleId, title: body.title.trim(), description: body.description === undefined ? null : String(body.description), isPreview: body.isPreview === true, position: (last?.position ?? -1) + 1 }).returning();
  res.status(201).json(lesson);
});
async function ownedLesson(lessonId: number, auth: AuthenticatedRequest) {
  const [row] = await db.select({ lesson: lessonsTable, module: courseModulesTable, course: coursesTable }).from(lessonsTable)
    .innerJoin(courseModulesTable, eq(courseModulesTable.id, lessonsTable.moduleId)).innerJoin(coursesTable, eq(coursesTable.id, courseModulesTable.courseId))
    .where(and(eq(lessonsTable.id, lessonId), auth.canonicalRole === "admin" ? undefined : eq(coursesTable.creatorId, auth.canonicalUserId!)));
  return row;
}
router.patch("/creator/lessons/:lessonId", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const id = positiveId(req.params.lessonId), body = req.body ?? {};
  if (!id || (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim()))) { res.status(400).json({ error: "Invalid lesson payload" }); return; }
  if (!await ownedLesson(id, req as AuthenticatedRequest)) { res.status(404).json({ error: "Lesson not found" }); return; }
  const updates: { title?: string; description?: string | null; isPreview?: boolean } = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description === null ? null : String(body.description);
  if (body.isPreview !== undefined) { if (typeof body.isPreview !== "boolean") { res.status(400).json({ error: "isPreview must be boolean" }); return; } updates.isPreview = body.isPreview; }
  const [lesson] = await db.update(lessonsTable).set(updates).where(eq(lessonsTable.id, id)).returning(); res.json(lesson);
});
router.delete("/creator/lessons/:lessonId", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => { const id = positiveId(req.params.lessonId); if (!id || !await ownedLesson(id, req as AuthenticatedRequest)) { res.status(404).json({ error: "Lesson not found" }); return; } await db.delete(lessonsTable).where(eq(lessonsTable.id, id)); res.sendStatus(204); });
router.post("/creator/modules/:moduleId/lessons/reorder", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const moduleId = positiveId(req.params.moduleId), ids = req.body?.lessonIds;
  if (!moduleId || !Array.isArray(ids) || !ids.every((n: unknown) => Number.isInteger(n)) || !await ownedModule(moduleId, req as AuthenticatedRequest)) { res.status(400).json({ error: "Valid module and lessonIds array are required" }); return; }
  const rows = await db.select().from(lessonsTable).where(eq(lessonsTable.moduleId, moduleId)); if (rows.length !== ids.length || new Set(ids).size !== ids.length || !rows.every((r) => ids.includes(r.id))) { res.status(400).json({ error: "lessonIds must contain every module lesson exactly once" }); return; }
  await db.transaction(async (tx) => { for (let i = 0; i < ids.length; i++) await tx.update(lessonsTable).set({ position: 100000 + i }).where(eq(lessonsTable.id, ids[i])); for (let i = 0; i < ids.length; i++) await tx.update(lessonsTable).set({ position: i }).where(eq(lessonsTable.id, ids[i])); }); res.json({ ok: true });
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