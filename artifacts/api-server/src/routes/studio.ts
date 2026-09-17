import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import OpenAI from "openai";
import { db, coursesTable, courseModulesTable, lessonAssetsTable, lessonsTable, productsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth";
import { createLessonUploadUrl, objectFile } from "../lib/objectStorage";

const router: IRouter = Router();
const id = (v: string | string[]) => { const value = Array.isArray(v) ? v[0] : v; return /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null; };
const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;
async function ownedLesson(lessonId: number, req: AuthenticatedRequest) {
  const [row] = await db.select({ lesson: lessonsTable, course: coursesTable }).from(lessonsTable)
    .innerJoin(courseModulesTable, eq(courseModulesTable.id, lessonsTable.moduleId))
    .innerJoin(coursesTable, eq(coursesTable.id, courseModulesTable.courseId))
    .where(and(eq(lessonsTable.id, lessonId), req.canonicalRole === "admin" ? undefined : eq(coursesTable.creatorId, req.canonicalUserId!)));
  return row;
}

router.post("/admin/courses", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { creatorId, title, description, priceMinor, currency } = req.body ?? {};
  if (!Number.isInteger(creatorId) || typeof title !== "string" || title.trim().length < 2 || typeof description !== "string" ||
      !Number.isInteger(priceMinor) || priceMinor < 0 || typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
    res.status(400).json({ error: "creatorId, title, description, non-negative priceMinor and uppercase 3-letter currency are required" }); return;
  }
  const result = await db.transaction(async (tx) => {
    const [creator] = await tx.select({ id: usersTable.id }).from(usersTable).where(and(eq(usersTable.id, creatorId), eq(usersTable.role, "creator")));
    if (!creator) return null;
    const slug = `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
    const [course] = await tx.insert(coursesTable).values({ creatorId, title: title.trim(), slug, description, priceMinor, currency }).returning();
    const [product] = await tx.insert(productsTable).values({ creatorId, courseId: course.id, type: "course", title: title.trim(), description, priceMinor, currency }).returning();
    return { courseId: course.id, productId: product.id };
  });
  if (!result) { res.status(400).json({ error: "creatorId must identify a creator" }); return; }
  res.status(201).json(result);
});

router.get("/admin/course-studio/courses", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const rows = await db.select({
    id: coursesTable.id, title: coursesTable.title, description: coursesTable.description, status: coursesTable.status,
    priceMinor: coursesTable.priceMinor, currency: coursesTable.currency, productId: productsTable.id,
    creatorId: usersTable.id, creatorName: usersTable.name, creatorEmail: usersTable.email,
    moduleCount: sql<number>`(select count(*)::int from course_modules m where m.course_id = ${coursesTable.id})`,
    lessonCount: sql<number>`(select count(*)::int from lessons l join course_modules m on m.id=l.module_id where m.course_id = ${coursesTable.id})`,
  }).from(coursesTable).leftJoin(productsTable, eq(productsTable.courseId, coursesTable.id)).innerJoin(usersTable, eq(usersTable.id, coursesTable.creatorId)).orderBy(desc(coursesTable.createdAt));
  res.json(rows);
});

router.post("/creator/lessons/:lessonId/assets/request-upload", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const lessonId = id(req.params.lessonId), auth = req as AuthenticatedRequest;
  const { filename, mimeType, sizeBytes } = req.body ?? {};
  if (!lessonId || typeof filename !== "string" || !/^video\/[^;]+$/i.test(mimeType ?? "") || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_VIDEO_BYTES) { res.status(400).json({ error: "filename, video MIME type and sizeBytes up to 1GB are required" }); return; }
  if (!await ownedLesson(lessonId, auth)) { res.status(404).json({ error: "Lesson not found" }); return; }
  const upload = await createLessonUploadUrl();
  const [asset] = await db.insert(lessonAssetsTable).values({ lessonId, kind: "video", storageKey: upload.objectPath, objectPath: upload.objectPath, filename, mimeType, sizeBytes }).returning();
  res.status(201).json({ asset, uploadURL: upload.url });
});
router.post("/creator/lessons/:lessonId/assets/:assetId/finalize", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const lessonId = id(req.params.lessonId), assetId = id(req.params.assetId), auth = req as AuthenticatedRequest;
  if (!lessonId || !assetId || !await ownedLesson(lessonId, auth)) { res.status(404).json({ error: "Asset not found" }); return; }
  const [asset] = await db.select().from(lessonAssetsTable).where(and(eq(lessonAssetsTable.id, assetId), eq(lessonAssetsTable.lessonId, lessonId)));
  if (!asset) { res.status(404).json({ error: "Asset not found" }); return; }
  const [metadata] = await objectFile(asset.objectPath).getMetadata();
  const actualSize = Number(metadata.size ?? 0);
  if (actualSize < 1 || actualSize > MAX_VIDEO_BYTES || metadata.contentType && !metadata.contentType.startsWith("video/")) { res.status(422).json({ error: "Uploaded object is not a valid video" }); return; }
  const previousAssets = await db.select().from(lessonAssetsTable).where(and(
    eq(lessonAssetsTable.lessonId, lessonId),
    sql`${lessonAssetsTable.id} <> ${assetId}`,
  ));
  const [updated] = await db.transaction(async (tx) => {
    const [result] = await tx.update(lessonAssetsTable).set({ status: "uploaded", sizeBytes: actualSize, mimeType: metadata.contentType ?? asset.mimeType }).where(eq(lessonAssetsTable.id, assetId)).returning();
    if (previousAssets.length) {
      await tx.delete(lessonAssetsTable).where(inArray(lessonAssetsTable.id, previousAssets.map((item) => item.id)));
    }
    return [result];
  });
  await Promise.all(previousAssets.map((item) => objectFile(item.objectPath).delete({ ignoreNotFound: true }).catch(() => undefined)));
  res.json(updated);
});
router.get("/creator/lessons/:lessonId/assets", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const lessonId = id(req.params.lessonId); if (!lessonId || !await ownedLesson(lessonId, req as AuthenticatedRequest)) { res.status(404).json({ error: "Lesson not found" }); return; }
  res.json(await db.select().from(lessonAssetsTable).where(eq(lessonAssetsTable.lessonId, lessonId)));
});
router.get("/creator/assets/:assetId/download", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const assetId = id(req.params.assetId); if (!assetId) { res.status(400).json({ error: "Invalid asset id" }); return; }
  const [asset] = await db.select().from(lessonAssetsTable).where(eq(lessonAssetsTable.id, assetId));
  if (!asset || asset.status !== "uploaded" || !await ownedLesson(asset.lessonId, req as AuthenticatedRequest)) { res.status(404).json({ error: "Asset not found" }); return; }
  const file = objectFile(asset.objectPath); const [meta] = await file.getMetadata();
  const size = Number(meta.size ?? asset.sizeBytes);
  const range = req.headers.range;
  res.setHeader("Content-Type", meta.contentType ?? asset.mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${asset.filename.replace(/["\\\r\n]/g, "_")}"`);
  res.setHeader("Accept-Ranges", "bytes");
  if (!range) {
    res.setHeader("Content-Length", size);
    file.createReadStream().pipe(res);
    return;
  }
  const match = /^bytes=(\d+)-(\d*)$/.exec(range);
  if (!match) {
    res.status(416).setHeader("Content-Range", `bytes */${size}`);
    res.end();
    return;
  }
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (start > end || start >= size) {
    res.status(416).setHeader("Content-Range", `bytes */${size}`);
    res.end();
    return;
  }
  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
  res.setHeader("Content-Length", end - start + 1);
  file.createReadStream({ start, end }).pipe(res);
});
router.delete("/creator/assets/:assetId/download", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const assetId = id(req.params.assetId);
  if (!assetId) { res.status(400).json({ error: "Invalid asset id" }); return; }
  const [asset] = await db.select().from(lessonAssetsTable).where(eq(lessonAssetsTable.id, assetId));
  if (!asset || !await ownedLesson(asset.lessonId, req as AuthenticatedRequest)) { res.status(404).json({ error: "Asset not found" }); return; }
  await objectFile(asset.objectPath).delete({ ignoreNotFound: true });
  await db.delete(lessonAssetsTable).where(eq(lessonAssetsTable.id, assetId));
  res.sendStatus(204);
});

router.post("/admin/ai/course-outline", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { topic, audience, level, sectionCount } = req.body ?? {};
  if (typeof topic !== "string" || !topic.trim() || typeof audience !== "string" || typeof level !== "string" || !Number.isInteger(sectionCount) || sectionCount < 1 || sectionCount > 20) { res.status(400).json({ error: "topic, audience, level and sectionCount (1-20) are required" }); return; }
  const client = new OpenAI({ baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL, apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY });
  const completion = await client.chat.completions.create({ model: "gpt-5.4-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: "Return only JSON matching {title:string,description:string,sections:[{title:string,lessons:[{title:string}]}]}. No markdown." }, { role: "user", content: `Topic: ${topic}\nAudience: ${audience}\nLevel: ${level}\nSections: ${sectionCount}` }] });
  let draft: unknown; try { draft = JSON.parse(completion.choices[0]?.message.content ?? ""); } catch { res.status(502).json({ error: "AI returned invalid JSON" }); return; }
  if (!draft || typeof draft !== "object" || typeof (draft as any).title !== "string" || !Array.isArray((draft as any).sections) || (draft as any).sections.length !== sectionCount || !(draft as any).sections.every((s: any) => typeof s?.title === "string" && Array.isArray(s.lessons) && s.lessons.every((l: any) => typeof l?.title === "string"))) { res.status(502).json({ error: "AI returned an invalid course outline" }); return; }
  res.json(draft);
});
export default router;