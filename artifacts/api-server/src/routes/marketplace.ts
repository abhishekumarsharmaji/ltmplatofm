import { Router, type IRouter } from "express";
import { and, eq, ilike, desc } from "drizzle-orm";
import {
  db, categoriesTable, coursesTable, productsTable, usersTable, enrollmentsTable,
  ordersTable, orderItemsTable, wishlistTable, platformSettingsTable,
} from "@workspace/db";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth";

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
  res.json(rows);
});
router.get("/marketplace/products/:id", async (req, res) => {
  const productId = id(req.params.id); if (!productId) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(productsTable).where(and(eq(productsTable.id, productId), eq(productsTable.status, "published")));
  if (!row) { res.status(404).json({ error: "Product not found" }); return; } res.json(row);
});
router.get("/marketplace/courses/:id", async (req, res) => {
  const courseId = id(req.params.id); if (!courseId) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select({ course: coursesTable, productId: productsTable.id }).from(coursesTable)
    .leftJoin(productsTable, and(eq(productsTable.courseId, coursesTable.id), eq(productsTable.type, "course")))
    .where(and(eq(coursesTable.id, courseId), eq(coursesTable.status, "published")));
  if (!row) { res.status(404).json({ error: "Course not found" }); return; } res.json({ ...row.course, productId: row.productId });
});

router.post("/creator/products", auth, requireRole("creator", "admin"), async (req, res) => {
  const requestUser = req as AuthenticatedRequest;
  const creatorId = await userOf(requestUser); if (!creatorId) { res.status(409).json({ error: "Creator profile unavailable" }); return; }
  const { title, description = "", type = "digital", priceMinor = 0, currency = "USD", courseId, categoryId } = req.body ?? {};
  if (typeof title !== "string" || title.length < 2 || !["course", "digital"].includes(type) || !Number.isInteger(priceMinor) || priceMinor < 0) {
    res.status(400).json({ error: "Invalid product payload" }); return;
  }
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
      creatorId, title: title.trim(), description: String(description), type, priceMinor,
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
  const allowed = ["title", "description", "priceMinor", "currency", "categoryId"] as const;
  const patch = Object.fromEntries(allowed.filter((key) => req.body?.[key] !== undefined).map((key) => [key, key === "categoryId" ? id(req.body[key]) : req.body[key]]));
  const [row] = await db.update(productsTable).set({ ...patch, updatedAt: new Date() }).where(eq(productsTable.id, productId)).returning(); res.json(row);
});
router.post("/creator/products/:id/publish", auth, requireRole("creator", "admin"), async (req, res) => {
  const productId = id(req.params.id), creatorId = await userOf(req as AuthenticatedRequest); if (!productId || !creatorId) { res.status(400).json({ error: "Invalid id" }); return; }
  const where = (req as AuthenticatedRequest).user!.role === "admin" ? eq(productsTable.id, productId) : and(eq(productsTable.id, productId), eq(productsTable.creatorId, creatorId));
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
router.get("/student/products/purchased", auth, async (req, res) => {
  const userId = await userOf(req as AuthenticatedRequest); if (!userId) { res.json([]); return; }
  res.json(await db.select({ product: productsTable, order: ordersTable }).from(orderItemsTable).innerJoin(productsTable, eq(productsTable.id, orderItemsTable.productId)).innerJoin(ordersTable, and(eq(ordersTable.id, orderItemsTable.orderId), eq(ordersTable.userId, userId))));
});
router.get("/student/orders", auth, async (req, res) => { const userId = await userOf(req as AuthenticatedRequest); res.json(userId ? await db.select({ id: ordersTable.id, totalMinor: ordersTable.totalMinor, status: ordersTable.status, date: ordersTable.createdAt, currency: ordersTable.currency }).from(ordersTable).where(eq(ordersTable.userId, userId)) : []); });
router.get("/student/wishlist", auth, async (req, res) => { const userId = await userOf(req as AuthenticatedRequest); res.json(userId ? await db.select({ wishlist: wishlistTable, product: productsTable }).from(wishlistTable).innerJoin(productsTable, eq(productsTable.id, wishlistTable.productId)).where(eq(wishlistTable.userId, userId)) : []); });
router.post("/student/wishlist/:productId", auth, async (req, res) => { const userId = await userOf(req as AuthenticatedRequest), productId = id(req.params.productId); if (!userId || !productId) { res.status(400).json({ error: "Invalid id" }); return; } const [row] = await db.insert(wishlistTable).values({ userId, productId }).onConflictDoNothing().returning(); res.status(201).json(row ?? { userId, productId }); });
router.delete("/student/wishlist/:productId", auth, async (req, res) => { const userId = await userOf(req as AuthenticatedRequest), productId = id(req.params.productId); if (!userId || !productId) { res.status(400).json({ error: "Invalid id" }); return; } await db.delete(wishlistTable).where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.productId, productId))); res.sendStatus(204); });

router.get("/admin/users", auth, requireRole("admin"), async (_req, res) => res.json(await db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role }).from(usersTable)));
router.get("/admin/creators", auth, requireRole("admin"), async (_req, res) => res.json(await db.select().from(usersTable).where(eq(usersTable.role, "creator"))));
router.get("/admin/courses", auth, requireRole("admin"), async (_req, res) => res.json(await db.select().from(coursesTable)));
router.get("/admin/products", auth, requireRole("admin"), async (_req, res) => res.json(await db.select().from(productsTable)));
router.get("/admin/orders", auth, requireRole("admin"), async (_req, res) => res.json(await db.select().from(ordersTable)));
router.post("/admin/categories", auth, requireRole("admin"), async (req, res) => { const { name, slug, description } = req.body ?? {}; if (!name || !slug) { res.status(400).json({ error: "name and slug required" }); return; } const [row] = await db.insert(categoriesTable).values({ name, slug, description }).returning(); res.status(201).json(row); });
router.patch("/admin/categories/:id", auth, requireRole("admin"), async (req, res) => { const categoryId = id(req.params.id); if (!categoryId) { res.status(400).json({ error: "Invalid id" }); return; } const [row] = await db.update(categoriesTable).set(req.body).where(eq(categoriesTable.id, categoryId)).returning(); if (!row) { res.status(404).json({ error: "Category not found" }); return; } res.json(row); });
router.delete("/admin/categories/:id", auth, requireRole("admin"), async (req, res) => { const categoryId = id(req.params.id); if (!categoryId) { res.status(400).json({ error: "Invalid id" }); return; } await db.delete(categoriesTable).where(eq(categoriesTable.id, categoryId)); res.sendStatus(204); });
router.get("/admin/settings", auth, requireRole("admin"), async (_req, res) => res.json(await db.select().from(platformSettingsTable)));
router.patch("/admin/settings/:key", auth, requireRole("admin"), async (req, res) => { const key = String(req.params.key); if (typeof req.body?.value !== "string") { res.status(400).json({ error: "value must be a string" }); return; } const [row] = await db.insert(platformSettingsTable).values({ key, value: req.body.value, updatedAt: new Date() }).onConflictDoUpdate({ target: platformSettingsTable.key, set: { value: req.body.value, updatedAt: new Date() } }).returning(); res.json(row); });

export default router;