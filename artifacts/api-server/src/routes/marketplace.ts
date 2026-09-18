import { Router, type IRouter } from "express";
import { and, eq, ilike, desc, inArray, sql } from "drizzle-orm";
import {
  db, categoriesTable, coursesTable, courseModulesTable, lessonsTable, lessonAssetsTable, productsTable, usersTable, enrollmentsTable, lmsUsersTable, creatorProfilesTable,
  ordersTable, orderItemsTable, wishlistTable, platformSettingsTable, digitalFilesTable,
} from "@workspace/db";
import { requireAuth, requireRole, requireSuperAdmin, effectiveRole, isSuperAdminEmail, type AuthenticatedRequest } from "../middlewares/auth";
import { objectFile } from "../lib/objectStorage";

const router: IRouter = Router();
const auth = requireAuth;
const userOf = async (req: AuthenticatedRequest) => req.canonicalUserId;
const id = (value: unknown) => Number.isInteger(Number(value)) ? Number(value) : null;

router.get("/categories", async (_req, res) => res.json(await db.select().from(categoriesTable).orderBy(categoriesTable.name)));
router.get("/marketplace/products", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const category = id(req.query.category);
  const rows = await db.select().from(productsTable)
    .where(and(eq(productsTable.status, "published"), q ? ilike(productsTable.title, `%${q}%`) : undefined, category ? eq(productsTable.categoryId, category) : undefined))
    .orderBy(desc(productsTable.createdAt));
  res.json(rows.map((row) => row.type === "digital" ? { ...row, priceMinor: 0, isFree: true } : row));
});
router.get("/marketplace/products/:id", async (req, res) => {
  const productId = id(req.params.id); if (!productId) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(productsTable).where(and(eq(productsTable.id, productId), eq(productsTable.status, "published")));
  if (!row) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(row.type === "digital" ? { ...row, priceMinor: 0, isFree: true } : row);
});
router.get("/marketplace/courses/:id", async (req, res) => {
  const courseId = id(req.params.id); if (!courseId) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select({ course: coursesTable, productId: productsTable.id, creatorName: usersTable.name }).from(coursesTable)
    .leftJoin(productsTable, and(eq(productsTable.courseId, coursesTable.id), eq(productsTable.type, "course")))
    .innerJoin(usersTable, eq(usersTable.id, coursesTable.creatorId))
    .where(and(eq(coursesTable.id, courseId), eq(coursesTable.status, "published")));
  if (!row) { res.status(404).json({ error: "Course not found" }); return; }
  const modules = await db.select().from(courseModulesTable).where(eq(courseModulesTable.courseId, courseId)).orderBy(courseModulesTable.position);
  const moduleIds = modules.map((module) => module.id);
  const lessons = moduleIds.length ? await db.select().from(lessonsTable).where(inArray(lessonsTable.moduleId, moduleIds)).orderBy(lessonsTable.position) : [];
  res.json({ ...row.course, productId: row.productId, creatorName: row.creatorName, lessons: lessons.length, modules: modules.map((module) => ({ ...module, lessons: lessons.filter((lesson) => lesson.moduleId === module.id) })) });
});
router.get("/marketplace/courses/:id/thumbnail", async (req, res) => {
  const courseId = id(req.params.id);
  if (!courseId) { res.status(400).end(); return; }
  const [course] = await db.select({ objectPath: coursesTable.thumbnailObjectPath }).from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course?.objectPath) { res.status(404).end(); return; }
  const file = objectFile(course.objectPath);
  const [metadata] = await file.getMetadata();
  res.setHeader("Content-Type", metadata.contentType ?? "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=3600");
  file.createReadStream().on("error", () => { if (!res.headersSent) res.status(404); res.end(); }).pipe(res);
});
router.post("/student/courses/:courseId/enroll", auth, async (req, res) => {
  const courseId = id(req.params.courseId), userId = await userOf(req as AuthenticatedRequest);
  if (!courseId || !userId) { res.status(400).json({ error: "Invalid course" }); return; }
  const [course] = await db.select({ id: coursesTable.id }).from(coursesTable).where(and(eq(coursesTable.id, courseId), eq(coursesTable.status, "published")));
  if (!course) { res.status(404).json({ error: "Published course not found" }); return; }
  const inserted = await db.insert(enrollmentsTable).values({ userId, courseId }).onConflictDoNothing().returning({ id: enrollmentsTable.id });
  res.json({ enrolled: true, alreadyEnrolled: inserted.length === 0, courseId });
});
router.get("/student/courses/:courseId", auth, requireRole("student", "creator", "admin"), async (req, res) => {
  const courseId = id(req.params.courseId), userId = await userOf(req as AuthenticatedRequest);
  if (!courseId || !userId) { res.status(400).json({ error: "Invalid course" }); return; }
  const [enrollment] = await db.select({ id: enrollmentsTable.id }).from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.courseId, courseId), eq(enrollmentsTable.userId, userId)));
  if (!enrollment) { res.status(403).json({ error: "Enrollment required" }); return; }
  const [row] = await db.select({ course: coursesTable, productId: productsTable.id, creatorName: usersTable.name }).from(coursesTable)
    .leftJoin(productsTable, and(eq(productsTable.courseId, coursesTable.id), eq(productsTable.type, "course")))
    .innerJoin(usersTable, eq(usersTable.id, coursesTable.creatorId))
    .where(eq(coursesTable.id, courseId));
  if (!row) { res.status(404).json({ error: "Course not found" }); return; }
  const modules = await db.select().from(courseModulesTable).where(eq(courseModulesTable.courseId, courseId)).orderBy(courseModulesTable.position);
  const moduleIds = modules.map((module) => module.id);
  const lessons = moduleIds.length ? await db.select().from(lessonsTable).where(inArray(lessonsTable.moduleId, moduleIds)).orderBy(lessonsTable.position) : [];
  const lessonIds = lessons.map((lesson) => lesson.id);
  const assets = lessonIds.length ? await db.select({
    id: lessonAssetsTable.id,
    lessonId: lessonAssetsTable.lessonId,
    kind: lessonAssetsTable.kind,
    filename: lessonAssetsTable.filename,
    mimeType: lessonAssetsTable.mimeType,
    sizeBytes: lessonAssetsTable.sizeBytes,
    status: lessonAssetsTable.status,
  }).from(lessonAssetsTable).where(and(inArray(lessonAssetsTable.lessonId, lessonIds), eq(lessonAssetsTable.status, "uploaded"))) : [];
  res.json({
    ...row.course,
    productId: row.productId,
    creatorName: row.creatorName,
    lessons: lessons.length,
    modules: modules.map((module) => ({
      ...module,
      lessons: lessons.filter((lesson) => lesson.moduleId === module.id).map((lesson) => ({
        ...lesson,
        assets: assets.filter((asset) => asset.lessonId === lesson.id).map((asset) => ({
          ...asset,
           streamUrl: asset.kind === "video" ? `/api/student/courses/${courseId}/assets/${asset.id}/stream` : undefined,
           downloadUrl: asset.kind === "video" ? undefined : `/api/student/courses/${courseId}/assets/${asset.id}/download`,
        })),
      })),
    })),
  });
});

router.post("/creator/products", auth, requireRole("creator", "admin"), async (req, res) => {
  const requestUser = req as AuthenticatedRequest;
  const creatorId = await userOf(requestUser); if (!creatorId) { res.status(409).json({ error: "Creator profile unavailable" }); return; }
  const { title, description = "", shortSummary = null, subtype = "other", coverImageUrl = null, type = "digital", priceMinor: requestedPrice = 0, currency = "USD", courseId, categoryId } = req.body ?? {};
  const digitalSubtypes = ["ebook", "template", "toolkit", "document", "bundle", "other"];
  if (type === "digital" && requestedPrice !== undefined && requestedPrice !== 0) { res.status(400).json({ error: "Digital products are free in this phase" }); return; }
  const priceMinor = type === "course" ? 0 : requestedPrice;
  if (typeof title !== "string" || title.length < 2 || !["course", "digital"].includes(type) || !Number.isInteger(priceMinor) || priceMinor < 0) {
    res.status(400).json({ error: "Invalid product payload" }); return;
  }
  if (type === "digital" && !digitalSubtypes.includes(subtype)) { res.status(400).json({ error: "Invalid digital product type" }); return; }
  const row = await db.transaction(async (tx) => {
    let linkedCourseId = id(courseId) ?? undefined;
    if (type === "digital" && linkedCourseId) throw new Error("Digital products cannot be linked to a course");
    if (type === "course" && linkedCourseId) {
      const [owned] = await tx.select({ id: coursesTable.id }).from(coursesTable).where(and(
        eq(coursesTable.id, linkedCourseId),
        requestUser.canonicalRole === "admin" ? undefined : eq(coursesTable.creatorId, creatorId),
      ));
      if (!owned) throw new Error("Course not found or not owned by creator");
    }
    if (type === "course" && !linkedCourseId) {
      const slugBase = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "course";
      const [course] = await tx.insert(coursesTable).values({
        creatorId,
        title: title.trim(),
        slug: `${slugBase}-${Date.now().toString(36)}`,
        description: String(description),
        priceMinor,
        currency: String(currency).toUpperCase(),
        categoryId: id(categoryId) ?? undefined,
      }).returning();
      linkedCourseId = course.id;
    }
    const [created] = await tx.insert(productsTable).values({
      creatorId, title: title.trim(), description: String(description), shortSummary: typeof shortSummary === "string" ? shortSummary : null,
      subtype: type === "digital" ? String(subtype) : null, coverImageUrl: typeof coverImageUrl === "string" ? coverImageUrl : null,
      coverImageObjectPath: null, type, priceMinor,
      currency: String(currency).toUpperCase(), courseId: linkedCourseId, categoryId: id(categoryId) ?? undefined,
    }).returning();
    return created;
  });
  res.status(201).json(row);
});
router.get("/creator/products", auth, requireRole("creator", "admin"), async (req, res) => {
  const creatorId = await userOf(req as AuthenticatedRequest); if (!creatorId) { res.json([]); return; }
  res.json(await db.select().from(productsTable).where((req as AuthenticatedRequest).user!.role === "admin" ? undefined : eq(productsTable.creatorId, creatorId)));
});
router.patch("/creator/products/:id", auth, requireRole("creator", "admin"), async (req, res) => {
  const productId = id(req.params.id), creatorId = await userOf(req as AuthenticatedRequest); if (!productId || !creatorId) { res.status(400).json({ error: "Invalid id" }); return; }
  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!existing || ((req as AuthenticatedRequest).user!.role !== "admin" && existing.creatorId !== creatorId)) { res.status(404).json({ error: "Product not found" }); return; }
   const allowed = ["title", "description", "shortSummary", "subtype", "coverImageUrl", "priceMinor", "currency", "categoryId"] as const;
   if (existing.type === "digital" && req.body?.priceMinor !== undefined && req.body.priceMinor !== 0) { res.status(400).json({ error: "Digital products are free in this phase" }); return; }
   if (existing.type === "digital" && req.body?.subtype !== undefined && !["ebook", "template", "toolkit", "document", "bundle", "other"].includes(req.body.subtype)) { res.status(400).json({ error: "Invalid digital product type" }); return; }
  const patch = Object.fromEntries(allowed.filter((key) => req.body?.[key] !== undefined).map((key) => [key, key === "categoryId" ? id(req.body[key]) : req.body[key]]));
  const [row] = await db.update(productsTable).set({ ...patch, updatedAt: new Date() }).where(eq(productsTable.id, productId)).returning(); res.json(row);
});
router.post("/creator/products/:id/publish", auth, requireRole("creator", "admin"), async (req, res) => {
  const productId = id(req.params.id), creatorId = await userOf(req as AuthenticatedRequest); if (!productId || !creatorId) { res.status(400).json({ error: "Invalid id" }); return; }
  const where = (req as AuthenticatedRequest).user!.role === "admin" ? eq(productsTable.id, productId) : and(eq(productsTable.id, productId), eq(productsTable.creatorId, creatorId));
  const [candidate] = await db.select().from(productsTable).where(where);
  if (!candidate) { res.status(404).json({ error: "Product not found" }); return; }
  if (candidate.type === "digital") {
    if (!candidate.title.trim() || !candidate.description.trim() || !candidate.subtype || candidate.priceMinor !== 0) { res.status(422).json({ error: "Digital product needs a title, description, subtype, and free price" }); return; }
    const [file] = await db.select({ id: digitalFilesTable.id }).from(digitalFilesTable).where(and(eq(digitalFilesTable.productId, productId), eq(digitalFilesTable.status, "uploaded"))).limit(1);
    if (!file) { res.status(422).json({ error: "Add at least one uploaded digital file before publishing" }); return; }
  }
  const [row] = await db.update(productsTable).set({ status: "published", updatedAt: new Date() }).where(where).returning();
  if (!row) { res.status(404).json({ error: "Product not found" }); return; }
  if (row.courseId) {
    const courseWhere = (req as AuthenticatedRequest).canonicalRole === "admin"
      ? eq(coursesTable.id, row.courseId)
      : and(eq(coursesTable.id, row.courseId), eq(coursesTable.creatorId, creatorId));
    await db.update(coursesTable).set({ status: "published", publishedAt: new Date(), updatedAt: new Date() }).where(courseWhere);
  }
  res.json(row);
});
router.get("/creator/sales-summary", auth, requireRole("creator", "admin"), async (req, res) => {
  const creatorId = await userOf(req as AuthenticatedRequest);
  const rows = creatorId ? await db.select({ orderId: ordersTable.id, totalMinor: ordersTable.totalMinor, status: ordersTable.status }).from(ordersTable).innerJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id)).innerJoin(productsTable, and(eq(productsTable.id, orderItemsTable.productId), eq(productsTable.creatorId, creatorId))) : [];
  res.json({ orderCount: rows.length, grossMinor: rows.reduce((sum, row) => sum + row.totalMinor, 0), orders: rows });
});

router.get("/student/library", auth, requireRole("student", "creator", "admin"), async (req, res) => {
  const userId = await userOf(req as AuthenticatedRequest); if (!userId) { res.json([]); return; }
  res.json(await db.select({ enrollment: enrollmentsTable, course: coursesTable }).from(enrollmentsTable)
    .innerJoin(coursesTable, eq(coursesTable.id, enrollmentsTable.courseId)).where(eq(enrollmentsTable.userId, userId)));
});
router.get("/student/products/purchased", auth, requireRole("student", "creator", "admin"), async (req, res) => {
  const userId = await userOf(req as AuthenticatedRequest); if (!userId) { res.json([]); return; }
  res.json(await db.select({ product: productsTable, order: ordersTable }).from(orderItemsTable)
    .innerJoin(productsTable, eq(productsTable.id, orderItemsTable.productId))
    .innerJoin(ordersTable, and(eq(ordersTable.id, orderItemsTable.orderId), eq(ordersTable.userId, userId)))
    .orderBy(desc(ordersTable.createdAt))
    .limit(100));
});
router.get("/student/orders", auth, async (req, res) => { const userId = await userOf(req as AuthenticatedRequest); res.json(userId ? await db.select({ id: ordersTable.id, totalMinor: ordersTable.totalMinor, status: ordersTable.status, date: ordersTable.createdAt, currency: ordersTable.currency }).from(ordersTable).where(eq(ordersTable.userId, userId)) : []); });
router.get("/student/wishlist", auth, async (req, res) => { const userId = await userOf(req as AuthenticatedRequest); res.json(userId ? await db.select({ wishlist: wishlistTable, product: productsTable }).from(wishlistTable).innerJoin(productsTable, eq(productsTable.id, wishlistTable.productId)).where(eq(wishlistTable.userId, userId)) : []); });
router.post("/student/wishlist/:productId", auth, async (req, res) => { const userId = await userOf(req as AuthenticatedRequest), productId = id(req.params.productId); if (!userId || !productId) { res.status(400).json({ error: "Invalid id" }); return; } const [row] = await db.insert(wishlistTable).values({ userId, productId }).onConflictDoNothing().returning(); res.status(201).json(row ?? { userId, productId }); });
router.delete("/student/wishlist/:productId", auth, async (req, res) => { const userId = await userOf(req as AuthenticatedRequest), productId = id(req.params.productId); if (!userId || !productId) { res.status(400).json({ error: "Invalid id" }); return; } await db.delete(wishlistTable).where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.productId, productId))); res.sendStatus(204); });

router.get("/admin/users", auth, requireRole("admin"), requireSuperAdmin, async (_req, res) => {
  const users = await db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, createdAt: usersTable.createdAt }).from(usersTable);
  res.json(users.map((user) => ({ ...user, role: effectiveRole(user.email, user.role) })));
});
router.patch("/admin/users/:id/creator", auth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const targetId = id(req.params.id), enable = req.body?.enabled !== false;
  if (!targetId) { res.status(400).json({ error: "Invalid user id" }); return; }
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (isSuperAdminEmail(target.email)) { res.status(403).json({ error: "The permanent super administrator cannot be changed" }); return; }
  const role = enable ? "creator" : "student";
  const updated = await db.transaction(async (tx) => {
    const [user] = await tx.update(usersTable).set({ role, updatedAt: new Date() }).where(eq(usersTable.id, targetId)).returning();
    await tx.update(lmsUsersTable).set({ role }).where(eq(lmsUsersTable.email, target.email));
    if (enable) await tx.insert(creatorProfilesTable).values({ userId: targetId, displayName: target.name }).onConflictDoNothing();
    return user;
  });
  res.json(updated);
});
router.get("/admin/users/:id/enrollments", auth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const targetId = id(req.params.id); if (!targetId) { res.status(400).json({ error: "Invalid user id" }); return; }
  res.json(await db.select({ enrollment: enrollmentsTable, course: coursesTable }).from(enrollmentsTable).innerJoin(coursesTable, eq(coursesTable.id, enrollmentsTable.courseId)).where(eq(enrollmentsTable.userId, targetId)));
});
router.post("/admin/users/:id/enrollments", auth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const targetId = id(req.params.id), courseId = id(req.body?.courseId);
  if (!targetId || !courseId) { res.status(400).json({ error: "Valid user and course ids are required" }); return; }
  const [target] = await db.select({ id: usersTable.id, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, targetId));
  if (!target || isSuperAdminEmail(target.email)) { res.status(404).json({ error: "Student not found" }); return; }
  const [course] = await db.select({ id: coursesTable.id }).from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }
  const [row] = await db.insert(enrollmentsTable).values({ userId: targetId, courseId }).onConflictDoNothing().returning();
  res.json({ enrolled: true, alreadyEnrolled: !row, courseId, userId: targetId });
});
router.delete("/admin/users/:id/enrollments/:courseId", auth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const targetId = id(req.params.id), courseId = id(req.params.courseId);
  if (!targetId || !courseId) { res.status(400).json({ error: "Invalid user or course id" }); return; }
  await db.delete(enrollmentsTable).where(and(eq(enrollmentsTable.userId, targetId), eq(enrollmentsTable.courseId, courseId)));
  res.sendStatus(204);
});
router.get("/admin/creators", auth, requireRole("admin"), async (_req, res) => res.json(await db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.role, "creator"))));
router.get("/admin/courses", auth, requireRole("admin"), async (_req, res) => res.json(await db.select({
  id: coursesTable.id, title: coursesTable.title, description: coursesTable.description, status: coursesTable.status,
  priceMinor: coursesTable.priceMinor, currency: coursesTable.currency, productId: productsTable.id,
  creatorId: usersTable.id, creatorName: usersTable.name, creatorEmail: usersTable.email,
  moduleCount: sql<number>`(select count(*)::int from course_modules m where m.course_id = ${coursesTable.id})`,
  lessonCount: sql<number>`(select count(*)::int from lessons l join course_modules m on m.id=l.module_id where m.course_id = ${coursesTable.id})`,
}).from(coursesTable).leftJoin(productsTable, eq(productsTable.courseId, coursesTable.id)).innerJoin(usersTable, eq(usersTable.id, coursesTable.creatorId))));
router.get("/admin/products", auth, requireRole("admin"), async (_req, res) => res.json(await db.select().from(productsTable)));
router.get("/admin/orders", auth, requireRole("admin"), async (_req, res) => res.json(await db.select().from(ordersTable)));
router.post("/admin/categories", auth, requireRole("admin"), async (req, res) => { const { name, slug, description } = req.body ?? {}; if (!name || !slug) { res.status(400).json({ error: "name and slug required" }); return; } const [row] = await db.insert(categoriesTable).values({ name, slug, description }).returning(); res.status(201).json(row); });
router.patch("/admin/categories/:id", auth, requireRole("admin"), async (req, res) => { const categoryId = id(req.params.id); if (!categoryId) { res.status(400).json({ error: "Invalid id" }); return; } const [row] = await db.update(categoriesTable).set(req.body).where(eq(categoriesTable.id, categoryId)).returning(); if (!row) { res.status(404).json({ error: "Category not found" }); return; } res.json(row); });
router.delete("/admin/categories/:id", auth, requireRole("admin"), async (req, res) => { const categoryId = id(req.params.id); if (!categoryId) { res.status(400).json({ error: "Invalid id" }); return; } await db.delete(categoriesTable).where(eq(categoriesTable.id, categoryId)); res.sendStatus(204); });
router.get("/admin/settings", auth, requireRole("admin"), async (_req, res) => res.json(await db.select().from(platformSettingsTable)));
router.patch("/admin/settings/:key", auth, requireRole("admin"), async (req, res) => { const key = String(req.params.key); if (typeof req.body?.value !== "string") { res.status(400).json({ error: "value must be a string" }); return; } const [row] = await db.insert(platformSettingsTable).values({ key, value: req.body.value, updatedAt: new Date() }).onConflictDoUpdate({ target: platformSettingsTable.key, set: { value: req.body.value, updatedAt: new Date() } }).returning(); res.json(row); });

export default router;