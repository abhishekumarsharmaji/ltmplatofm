import { Router, type IRouter } from "express";
import { and, eq, ilike, desc, inArray, sql } from "drizzle-orm";
import {
  db, categoriesTable, coursesTable, courseModulesTable, lessonsTable, lessonAssetsTable, productsTable, usersTable, enrollmentsTable, lmsUsersTable, creatorProfilesTable,
  ordersTable, orderItemsTable, wishlistTable, platformSettingsTable, digitalFilesTable, digitalProductPaymentsTable,
} from "@workspace/db";
import { requireAuth, requireRole, requireSuperAdmin, effectiveRole, isSuperAdminEmail, type AuthenticatedRequest } from "../middlewares/auth";
import { createCreatorAvatarUploadUrl, objectFile } from "../lib/objectStorage";
import { accessExpiry, validAccessPlan } from "../lib/accessPlans";

const router: IRouter = Router();
const auth = requireAuth;
const userOf = async (req: AuthenticatedRequest) => req.canonicalUserId;
const id = (value: unknown) => Number.isInteger(Number(value)) ? Number(value) : null;
const validPublicSlug = (value: unknown) => typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length >= 3 && value.length <= 80;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "product";
const cleanText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const cleanList = (value: unknown, maxItems: number, maxLength: number) => Array.isArray(value) ? value.map((item) => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems) : [];
const validCreatorUsername = (value: unknown) => typeof value === "string" && /^[a-z0-9_]{3,30}$/.test(value);
const normalizeSalesPage = (value: unknown) => {
  const page = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const pairs = (key: string, first: string, second: string, maxItems: number, maxLength: number) =>
    Array.isArray(page[key]) ? page[key].map((item) => {
      const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return { [first]: cleanText(row[first], maxLength), [second]: cleanText(row[second], maxLength) };
    }).filter((item) => item[first] && item[second]).slice(0, maxItems) : [];
  const supportEmail = cleanText(page.supportEmail, 254).toLowerCase();
  return {
    tagline: cleanText(page.tagline, 180),
    ctaLabel: cleanText(page.ctaLabel, 60),
    benefits: cleanList(page.benefits, 12, 180),
    targetAudience: cleanList(page.targetAudience, 12, 180),
    includedItems: cleanList(page.includedItems, 20, 180),
    sections: pairs("sections", "heading", "body", 12, 4000).map((item) => ({ heading: item.heading, body: item.body })),
    testimonials: pairs("testimonials", "name", "quote", 10, 500).map((item) => ({ name: item.name, quote: item.quote })),
    faqs: pairs("faqs", "question", "answer", 15, 1000).map((item) => ({ question: item.question, answer: item.answer })),
    supportEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail) ? supportEmail : "",
    terms: cleanText(page.terms, 5000),
  };
};
const safeProduct = (product: typeof productsTable.$inferSelect) => {
  const { coverImageObjectPath: _coverImageObjectPath, ...publicProduct } = product;
  return {
    ...publicProduct,
    coverImageUrl: product.coverImageObjectPath
      ? `/api/marketplace/products/${product.id}/cover?v=${product.updatedAt.getTime()}`
      : product.coverImageUrl,
  };
};

router.get("/creator/profile", auth, requireRole("creator", "admin"), async (req, res) => {
  const userId = await userOf(req as AuthenticatedRequest);
  if (!userId) { res.status(404).json({ error: "Creator profile unavailable" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "Creator profile unavailable" }); return; }
  let [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, userId));
  if (!profile) {
    [profile] = await db.insert(creatorProfilesTable).values({ userId, displayName: user.name }).returning();
  }
  res.json({
    ...profile,
    avatarUrl: profile.avatarObjectPath
      ? `/api/marketplace/creators/${userId}/avatar?v=${profile.updatedAt.getTime()}`
      : profile.avatarUrl,
  });
});

router.patch("/creator/profile", auth, requireRole("creator", "admin"), async (req, res) => {
  const userId = await userOf(req as AuthenticatedRequest);
  if (!userId) { res.status(404).json({ error: "Creator profile unavailable" }); return; }
  const displayName = cleanText(req.body?.displayName, 80);
  const username = cleanText(req.body?.username, 30).toLowerCase();
  const headline = cleanText(req.body?.headline, 140);
  const bio = cleanText(req.body?.bio, 1500);
  const websiteUrl = cleanText(req.body?.websiteUrl, 500);
  if (displayName.length < 2 || !validCreatorUsername(username)) {
    res.status(400).json({ error: "Enter a display name and a 3–30 character username using lowercase letters, numbers, or underscores" }); return;
  }
  if (websiteUrl && !/^https?:\/\/[^\s]+$/i.test(websiteUrl)) {
    res.status(400).json({ error: "Website URL must start with http:// or https://" }); return;
  }
  const [conflict] = await db.select({ userId: creatorProfilesTable.userId }).from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.username, username));
  if (conflict && conflict.userId !== userId) { res.status(409).json({ error: "This username is already taken" }); return; }
  const [profile] = await db.insert(creatorProfilesTable).values({
    userId, displayName, username, headline, bio: bio || null, websiteUrl: websiteUrl || null,
  }).onConflictDoUpdate({
    target: creatorProfilesTable.userId,
    set: { displayName, username, headline, bio: bio || null, websiteUrl: websiteUrl || null, updatedAt: new Date() },
  }).returning();
  res.json({
    ...profile,
    avatarUrl: profile.avatarObjectPath
      ? `/api/marketplace/creators/${userId}/avatar?v=${profile.updatedAt.getTime()}`
      : profile.avatarUrl,
  });
});

router.post("/creator/profile/avatar/request-upload", auth, requireRole("creator", "admin"), async (req, res) => {
  const { mimeType, sizeBytes } = req.body ?? {};
  if (!/^image\/(jpeg|png|webp)$/i.test(mimeType ?? "") || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > 5 * 1024 * 1024) {
    res.status(400).json({ error: "A JPG, PNG or WebP image up to 5MB is required" }); return;
  }
  const upload = await createCreatorAvatarUploadUrl();
  res.status(201).json({ uploadURL: upload.url, objectPath: upload.objectPath });
});

router.post("/creator/profile/avatar/finalize", auth, requireRole("creator", "admin"), async (req, res) => {
  const userId = await userOf(req as AuthenticatedRequest);
  const objectPath = req.body?.objectPath;
  if (!userId || typeof objectPath !== "string" || !objectPath.includes("/creator-avatars/")) {
    res.status(404).json({ error: "Avatar upload not found" }); return;
  }
  const [metadata] = await objectFile(objectPath).getMetadata();
  const actualSize = Number(metadata.size ?? 0), contentType = String(metadata.contentType ?? "");
  if (actualSize < 1 || actualSize > 5 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/i.test(contentType)) {
    res.status(422).json({ error: "Uploaded object is not a valid profile image" }); return;
  }
  const [existing] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, userId));
  if (existing?.avatarObjectPath && existing.avatarObjectPath !== objectPath) {
    await objectFile(existing.avatarObjectPath).delete({ ignoreNotFound: true }).catch(() => undefined);
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [profile] = await db.insert(creatorProfilesTable).values({
    userId, displayName: user?.name || "Creator", avatarObjectPath: objectPath,
  }).onConflictDoUpdate({
    target: creatorProfilesTable.userId,
    set: { avatarObjectPath: objectPath, updatedAt: new Date() },
  }).returning();
  res.json({ ...profile, avatarUrl: `/api/marketplace/creators/${userId}/avatar?v=${profile.updatedAt.getTime()}` });
});

router.get("/marketplace/creators/:id/avatar", async (req, res) => {
  const creatorId = id(req.params.id);
  if (!creatorId) { res.status(400).end(); return; }
  const [profile] = await db.select({ objectPath: creatorProfilesTable.avatarObjectPath }).from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.userId, creatorId));
  if (!profile?.objectPath) { res.status(404).end(); return; }
  const file = objectFile(profile.objectPath);
  const [metadata] = await file.getMetadata();
  res.setHeader("Content-Type", metadata.contentType ?? "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400, immutable");
  file.createReadStream().on("error", () => { if (!res.headersSent) res.status(404); res.end(); }).pipe(res);
});

router.get("/categories", async (_req, res) => res.json(await db.select().from(categoriesTable).orderBy(categoriesTable.name)));
router.get("/marketplace/products", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const category = id(req.query.category);
  const rows = await db.select().from(productsTable)
    .where(and(eq(productsTable.status, "published"), q ? ilike(productsTable.title, `%${q}%`) : undefined, category ? eq(productsTable.categoryId, category) : undefined))
    .orderBy(desc(productsTable.createdAt));
  res.json(rows.map((row) => row.type === "digital" ? { ...safeProduct(row), priceMinor: 0, isFree: true } : safeProduct(row)));
});
router.get("/marketplace/products/:id", async (req, res) => {
  const productId = id(req.params.id);
  const [row] = await db.select().from(productsTable).where(and(
    productId ? eq(productsTable.id, productId) : eq(productsTable.publicSlug, String(req.params.id).toLowerCase()),
    eq(productsTable.status, "published"),
  ));
  if (!row) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(row.type === "digital" ? { ...safeProduct(row), priceMinor: 0, isFree: true } : safeProduct(row));
});
router.get("/marketplace/products/:id/cover", async (req, res) => {
  const productId = id(req.params.id);
  if (!productId) { res.status(400).end(); return; }
  const [product] = await db.select({ objectPath: productsTable.coverImageObjectPath }).from(productsTable).where(eq(productsTable.id, productId));
  if (!product?.objectPath) { res.status(404).end(); return; }
  const file = objectFile(product.objectPath);
  const [metadata] = await file.getMetadata();
  res.setHeader("Content-Type", metadata.contentType ?? "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400, immutable");
  file.createReadStream().on("error", () => { if (!res.headersSent) res.status(404); res.end(); }).pipe(res);
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
  const [course] = await db.select({
    id: coursesTable.id,
    accessPlan: productsTable.accessPlan,
    accessDays: productsTable.accessDays,
    trialDays: productsTable.trialDays,
  }).from(coursesTable)
    .leftJoin(productsTable, and(eq(productsTable.courseId, coursesTable.id), eq(productsTable.type, "course")))
    .where(and(eq(coursesTable.id, courseId), eq(coursesTable.status, "published")));
  if (!course) { res.status(404).json({ error: "Published course not found" }); return; }
  const expiresAt = accessExpiry(course.accessPlan ?? "lifetime", course.accessDays, course.trialDays ?? 0);
  const inserted = await db.insert(enrollmentsTable).values({ userId, courseId, expiresAt }).onConflictDoNothing().returning({ id: enrollmentsTable.id });
  res.json({ enrolled: true, alreadyEnrolled: inserted.length === 0, courseId, expiresAt });
});
router.get("/student/courses/:courseId", auth, requireRole("student", "creator", "admin"), async (req, res) => {
  const courseId = id(req.params.courseId), userId = await userOf(req as AuthenticatedRequest);
  if (!courseId || !userId) { res.status(400).json({ error: "Invalid course" }); return; }
  const [enrollment] = await db.select({ id: enrollmentsTable.id, expiresAt: enrollmentsTable.expiresAt }).from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.courseId, courseId), eq(enrollmentsTable.userId, userId)));
  if (!enrollment) { res.status(403).json({ error: "Enrollment required" }); return; }
  if (enrollment.expiresAt && enrollment.expiresAt.getTime() <= Date.now()) { res.status(403).json({ error: "Course access has expired" }); return; }
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
  const { title, description = "", shortSummary = null, subtype = "other", publicSlug: requestedSlug, coverImageUrl = null, salesPage, type = "digital", priceMinor: requestedPrice = 0, currency = "USD", courseId, categoryId, accessPlan = "lifetime", accessDays = null, trialDays = 0 } = req.body ?? {};
  const digitalSubtypes = ["ebook", "guide", "workbook", "checklist", "planner", "template", "spreadsheet", "presentation", "design_asset", "photo_preset", "audio", "video", "code", "plugin", "prompt_pack", "toolkit", "document", "bundle", "other"];
  const priceMinor = type === "course" ? 0 : requestedPrice;
  if (typeof title !== "string" || title.length < 2 || !["course", "digital"].includes(type) || !Number.isInteger(priceMinor) || priceMinor < 0) {
    res.status(400).json({ error: "Invalid product payload" }); return;
  }
  if (type === "digital" && !digitalSubtypes.includes(subtype)) { res.status(400).json({ error: "Invalid digital product type" }); return; }
  if (!validAccessPlan(accessPlan) || !Number.isInteger(trialDays) || trialDays < 0 || trialDays > 365 || (accessPlan === "fixed_days" && (!Number.isInteger(accessDays) || accessDays < 1 || accessDays > 3650))) {
    res.status(400).json({ error: "Invalid access plan" }); return;
  }
  if (requestedSlug !== undefined && requestedSlug !== "" && !validPublicSlug(requestedSlug)) { res.status(400).json({ error: "Custom link must be 3–80 characters using lowercase letters, numbers, and hyphens" }); return; }
  if (requestedSlug) {
    const [conflict] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.publicSlug, String(requestedSlug).toLowerCase()));
    if (conflict) { res.status(409).json({ error: "This custom link is already taken" }); return; }
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
      creatorId, title: title.trim(), description: String(description), shortSummary: typeof shortSummary === "string" ? shortSummary : null,
      subtype: type === "digital" ? String(subtype) : null,
      publicSlug: requestedSlug ? String(requestedSlug).toLowerCase() : `${slugify(title)}-${Date.now().toString(36)}`,
      coverImageUrl: typeof coverImageUrl === "string" ? coverImageUrl : null,
      coverImageObjectPath: null, type, priceMinor,
       accessPlan, accessDays: accessPlan === "fixed_days" ? accessDays : null, trialDays,
      salesPage: type === "digital" ? normalizeSalesPage(salesPage) : {},
      currency: type === "digital" ? "INR" : String(currency).toUpperCase(), courseId: linkedCourseId, categoryId: id(categoryId) ?? undefined,
    }).returning();
    return created;
  });
  res.status(201).json(safeProduct(row));
});
router.get("/creator/products", auth, requireRole("creator", "admin"), async (req, res) => {
  const creatorId = await userOf(req as AuthenticatedRequest); if (!creatorId) { res.json([]); return; }
  const rows = await db.select().from(productsTable).where((req as AuthenticatedRequest).user!.role === "admin" ? undefined : eq(productsTable.creatorId, creatorId));
  res.json(rows.map(safeProduct));
});
router.patch("/creator/products/:id", auth, requireRole("creator", "admin"), async (req, res) => {
  const productId = id(req.params.id), creatorId = await userOf(req as AuthenticatedRequest); if (!productId || !creatorId) { res.status(400).json({ error: "Invalid id" }); return; }
  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!existing || ((req as AuthenticatedRequest).user!.role !== "admin" && existing.creatorId !== creatorId)) { res.status(404).json({ error: "Product not found" }); return; }
    const allowed = ["title", "description", "shortSummary", "subtype", "publicSlug", "coverImageUrl", "salesPage", "priceMinor", "currency", "categoryId", "accessPlan", "accessDays", "trialDays"] as const;
   if (req.body?.priceMinor !== undefined && (!Number.isInteger(req.body.priceMinor) || req.body.priceMinor < 0)) { res.status(400).json({ error: "Price must be a valid non-negative amount" }); return; }
   if (existing.type === "digital" && req.body?.currency !== undefined && String(req.body.currency).toUpperCase() !== "INR") { res.status(400).json({ error: "Digital-product payments currently support INR only" }); return; }
   if (existing.type === "digital" && req.body?.subtype !== undefined && !["ebook", "guide", "workbook", "checklist", "planner", "template", "spreadsheet", "presentation", "design_asset", "photo_preset", "audio", "video", "code", "plugin", "prompt_pack", "toolkit", "document", "bundle", "other"].includes(req.body.subtype)) { res.status(400).json({ error: "Invalid digital product type" }); return; }
    const nextPlan = req.body?.accessPlan ?? existing.accessPlan;
    const nextDays = req.body?.accessDays ?? existing.accessDays;
    const nextTrial = req.body?.trialDays ?? existing.trialDays;
    if (!validAccessPlan(nextPlan) || !Number.isInteger(nextTrial) || nextTrial < 0 || nextTrial > 365 || (nextPlan === "fixed_days" && (!Number.isInteger(nextDays) || nextDays < 1 || nextDays > 3650))) {
      res.status(400).json({ error: "Invalid access plan" }); return;
    }
    if (req.body?.publicSlug !== undefined) {
      if (req.body.publicSlug === "" || req.body.publicSlug === null) {
        req.body.publicSlug = null;
      } else {
      const publicSlug = String(req.body.publicSlug).toLowerCase();
      if (!validPublicSlug(publicSlug)) { res.status(400).json({ error: "Custom link must be 3–80 characters using lowercase letters, numbers, and hyphens" }); return; }
      const [conflict] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.publicSlug, publicSlug));
      if (conflict && conflict.id !== productId) { res.status(409).json({ error: "This custom link is already taken" }); return; }
      req.body.publicSlug = publicSlug;
      }
    }
  const patch = Object.fromEntries(allowed.filter((key) => req.body?.[key] !== undefined).map((key) => [
    key,
      key === "categoryId" ? id(req.body[key]) : key === "salesPage" ? normalizeSalesPage(req.body[key]) : key === "accessDays" && nextPlan !== "fixed_days" ? null : key === "currency" && existing.type === "digital" ? "INR" : req.body[key],
  ]));
  const [row] = await db.update(productsTable).set({ ...patch, updatedAt: new Date() }).where(eq(productsTable.id, productId)).returning(); res.json(safeProduct(row));
});
router.post("/creator/products/:id/publish", auth, requireRole("creator", "admin"), async (req, res) => {
  const productId = id(req.params.id), creatorId = await userOf(req as AuthenticatedRequest); if (!productId || !creatorId) { res.status(400).json({ error: "Invalid id" }); return; }
  const where = (req as AuthenticatedRequest).user!.role === "admin" ? eq(productsTable.id, productId) : and(eq(productsTable.id, productId), eq(productsTable.creatorId, creatorId));
  const [candidate] = await db.select().from(productsTable).where(where);
  if (!candidate) { res.status(404).json({ error: "Product not found" }); return; }
  if (candidate.type === "digital") {
    if (!candidate.title.trim() || !candidate.description.trim() || !candidate.subtype || candidate.priceMinor < 0 || candidate.currency !== "INR") { res.status(422).json({ error: "Digital product needs a title, description, subtype, and a valid INR price" }); return; }
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
  res.json(safeProduct(row));
});
router.get("/creator/sales-summary", auth, requireRole("creator", "admin"), async (req, res) => {
  const creatorId = await userOf(req as AuthenticatedRequest);
  if (!creatorId) { res.json({ orderCount: 0, grossMinor: 0, currency: "INR", orders: [] }); return; }
  const [summary] = await db.select({
    orderCount: sql<string>`count(${digitalProductPaymentsTable.id})::bigint`,
    grossMinor: sql<string>`coalesce(sum(${digitalProductPaymentsTable.amountMinor}::bigint), 0)::bigint`,
  }).from(digitalProductPaymentsTable)
    .innerJoin(productsTable, and(
      eq(productsTable.id, digitalProductPaymentsTable.productId),
      eq(productsTable.creatorId, creatorId),
    ))
    .where(eq(digitalProductPaymentsTable.status, "succeeded"));
  const orders = await db.select({
    orderId: digitalProductPaymentsTable.orderId,
    amountMinor: digitalProductPaymentsTable.amountMinor,
    currency: digitalProductPaymentsTable.currency,
    status: digitalProductPaymentsTable.status,
    userName: digitalProductPaymentsTable.email,
    productName: productsTable.title,
    createdAt: sql<Date>`coalesce(${digitalProductPaymentsTable.completedAt}, ${digitalProductPaymentsTable.createdAt})`,
  }).from(digitalProductPaymentsTable)
    .innerJoin(productsTable, and(
      eq(productsTable.id, digitalProductPaymentsTable.productId),
      eq(productsTable.creatorId, creatorId),
    ))
    .where(eq(digitalProductPaymentsTable.status, "succeeded"))
    .orderBy(desc(sql`coalesce(${digitalProductPaymentsTable.completedAt}, ${digitalProductPaymentsTable.createdAt})`))
    .limit(100);
  res.json({
    orderCount: Number(summary?.orderCount ?? 0),
    grossMinor: Number(summary?.grossMinor ?? 0),
    currency: "INR",
    orders,
  });
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