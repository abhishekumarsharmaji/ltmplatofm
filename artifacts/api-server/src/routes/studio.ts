import { Router, raw, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import OpenAI from "openai";
import { db, coursesTable, courseModulesTable, enrollmentsTable, lessonAssetsTable, lessonsTable, productsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth";
import {
  abortLessonMultipartUpload,
  completeLessonMultipartUpload,
  createCourseThumbnailUploadUrl,
  createProductCoverUploadUrl,
  createLessonMultipartUpload,
  createLessonAssetMultipartUpload,
  createLessonPartUploadUrl,
  uploadLessonMultipartPart,
  createObjectDownloadUrl,
  objectFile,
  uploadObjectBuffer,
} from "../lib/objectStorage";
import { isCoursePlayerMediaRequest } from "../lib/mediaRequestGuard";

const router: IRouter = Router();
const id = (v: string | string[]) => { const value = Array.isArray(v) ? v[0] : v; return /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null; };
const MAX_VIDEO_BYTES = 10 * 1024 * 1024 * 1024;
const VIDEO_PART_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024;
const ATTACHMENTS: Record<string, string[]> = {
  pdf: ["application/pdf"],
  ppt: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  doc: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.oasis.opendocument.text", "application/rtf", "text/rtf"],
  xls: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "application/vnd.oasis.opendocument.spreadsheet"],
  archive: ["application/zip", "application/x-7z-compressed", "application/vnd.rar", "application/x-rar-compressed"],
  resource: ["text/plain", "text/markdown", "application/json", "application/octet-stream"],
};
const attachmentKind = (filename: string, mime: string) => {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  const group = ext === "pdf" ? "pdf" : ["ppt", "pptx"].includes(ext) ? "ppt" : ["doc", "docx", "odt", "rtf"].includes(ext) ? "doc" : ["xls", "xlsx", "csv", "ods"].includes(ext) ? "xls" : ["zip", "7z", "rar"].includes(ext) ? "archive" : null;
  if (!group && ["txt", "md", "json", "yaml", "yml", "xml", "bin"].includes(ext)) return ATTACHMENTS.resource.includes(mime.toLowerCase()) ? "resource" : null;
  return group && ATTACHMENTS[group].includes(mime.toLowerCase()) ? group : null;
};
// Signed R2 URLs are bearer links, so they are short-lived and a copied link dies quickly. Browsers keep
// requesting the API URL for later byte ranges (a fresh redirect each time) and the student player also
// recovers from an expired link, so a few minutes is enough for playback without leaving a long-lived link.
const STUDENT_STREAM_URL_TTL_SECONDS = 5 * 60;
// The creator's "Play / Download" link opens the storage URL directly in a tab, where every later range
// request reuses that same URL; give it longer so a preview or a large download does not break midway.
const CREATOR_DOWNLOAD_URL_TTL_SECONDS = 10 * 60;
async function ownedProduct(productId: number, req: AuthenticatedRequest) {
  const [row] = await db.select({ product: productsTable, course: coursesTable }).from(productsTable)
    .innerJoin(coursesTable, eq(coursesTable.id, productsTable.courseId))
    .where(and(eq(productsTable.id, productId), req.canonicalRole === "admin" ? undefined : eq(productsTable.creatorId, req.canonicalUserId!)));
  return row;
}
async function ownedAnyProduct(productId: number, req: AuthenticatedRequest) {
  const [row] = await db.select().from(productsTable).where(and(
    eq(productsTable.id, productId),
    req.canonicalRole === "admin" ? undefined : eq(productsTable.creatorId, req.canonicalUserId!),
  ));
  return row;
}
async function ownedLesson(lessonId: number, req: AuthenticatedRequest) {
  const [row] = await db.select({ lesson: lessonsTable, course: coursesTable }).from(lessonsTable)
    .innerJoin(courseModulesTable, eq(courseModulesTable.id, lessonsTable.moduleId))
    .innerJoin(coursesTable, eq(coursesTable.id, courseModulesTable.courseId))
    .where(and(eq(lessonsTable.id, lessonId), req.canonicalRole === "admin" ? undefined : eq(coursesTable.creatorId, req.canonicalUserId!)));
  return row;
}

async function streamAsset(asset: typeof lessonAssetsTable.$inferSelect, req: Request, res: Response, signedUrlTtlSeconds: number, attachment = false) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const directUrl = await createObjectDownloadUrl(asset.objectPath, asset.filename, asset.mimeType, signedUrlTtlSeconds, attachment);
  if (directUrl) {
    res.redirect(307, directUrl);
    return;
  }
  const file = objectFile(asset.objectPath); const [meta] = await file.getMetadata();
  const size = Number(meta.size ?? asset.sizeBytes);
  const range = req.headers.range;
  res.setHeader("Content-Type", meta.contentType ?? asset.mimeType);
  res.setHeader("Content-Disposition", `${attachment ? "attachment" : "inline"}; filename="${asset.filename.replace(/["\\\r\n]/g, "_")}"`);
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
router.post("/creator/products/:productId/thumbnail/request-upload", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = id(req.params.productId), auth = req as AuthenticatedRequest;
  const { mimeType, sizeBytes } = req.body ?? {};
  if (!productId || !/^image\/(jpeg|png|webp)$/i.test(mimeType ?? "") || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_IMAGE_BYTES) {
    res.status(400).json({ error: "A JPG, PNG or WebP image up to 10MB is required" }); return;
  }
  const product = await ownedAnyProduct(productId, auth);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  const upload = product.type === "course" ? await createCourseThumbnailUploadUrl() : await createProductCoverUploadUrl();
  res.status(201).json({ uploadURL: upload.url, objectPath: upload.objectPath });
});
router.post("/creator/products/:productId/thumbnail/finalize", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = id(req.params.productId), auth = req as AuthenticatedRequest, objectPath = req.body?.objectPath;
  const product = productId ? await ownedAnyProduct(productId, auth) : undefined;
  if (!productId || !product || typeof objectPath !== "string" || !objectPath.includes(product.type === "course" ? "/course-thumbnails/" : "/product-covers/")) { res.status(404).json({ error: "Thumbnail upload not found" }); return; }
  const [metadata] = await objectFile(objectPath).getMetadata();
  const actualSize = Number(metadata.size ?? 0), contentType = String(metadata.contentType ?? "");
  if (actualSize < 1 || actualSize > MAX_IMAGE_BYTES || !/^image\/(jpeg|png|webp)$/i.test(contentType)) { res.status(422).json({ error: "Uploaded object is not a valid product image" }); return; }
  if (product.type === "digital") {
    if (product.coverImageObjectPath && product.coverImageObjectPath !== objectPath) {
      await objectFile(product.coverImageObjectPath).delete({ ignoreNotFound: true }).catch(() => undefined);
    }
    const coverImageUrl = `/api/marketplace/products/${product.id}/cover`;
    const [updated] = await db.update(productsTable).set({ coverImageObjectPath: objectPath, coverImageUrl, updatedAt: new Date() }).where(eq(productsTable.id, product.id)).returning();
    const { coverImageObjectPath: _coverImageObjectPath, ...safeProduct } = updated;
    res.json(safeProduct);
    return;
  }
  const found = await ownedProduct(productId, auth);
  if (!found) { res.status(404).json({ error: "Course product not found" }); return; }
  if (found.course.thumbnailObjectPath && found.course.thumbnailObjectPath !== objectPath) {
    await objectFile(found.course.thumbnailObjectPath).delete({ ignoreNotFound: true }).catch(() => undefined);
  }
  const thumbnailUrl = `/api/marketplace/courses/${found.course.id}/thumbnail`;
  const [course] = await db.update(coursesTable).set({ thumbnailObjectPath: objectPath, thumbnailUrl, updatedAt: new Date() }).where(eq(coursesTable.id, found.course.id)).returning();
  res.json(course);
});
router.put(
  "/creator/products/:productId/thumbnail/direct-upload",
  requireAuth,
  requireRole("creator", "admin"),
  raw({ type: "application/octet-stream", limit: MAX_IMAGE_BYTES }),
  async (req, res): Promise<void> => {
    const productId = id(req.params.productId), auth = req as AuthenticatedRequest;
    const mimeType = (req.header("x-file-type") || "").toLowerCase();
    if (!productId || !Buffer.isBuffer(req.body) || req.body.length < 1 || req.body.length > MAX_IMAGE_BYTES || !/^image\/(jpeg|png|webp)$/i.test(mimeType)) {
      res.status(400).json({ error: "A JPG, PNG or WebP image up to 10MB is required" }); return;
    }
    const product = await ownedAnyProduct(productId, auth);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    const folder = product.type === "course" ? "course-thumbnails" : "product-covers";
    const objectPath = await uploadObjectBuffer(folder, req.body, mimeType);

    if (product.type === "digital") {
      if (product.coverImageObjectPath && product.coverImageObjectPath !== objectPath) {
        await objectFile(product.coverImageObjectPath).delete({ ignoreNotFound: true }).catch(() => undefined);
      }
      const coverImageUrl = `/api/marketplace/products/${product.id}/cover`;
      const [updated] = await db.update(productsTable).set({ coverImageObjectPath: objectPath, coverImageUrl, updatedAt: new Date() }).where(eq(productsTable.id, product.id)).returning();
      const { coverImageObjectPath: _coverImageObjectPath, ...safeProduct } = updated;
      res.json(safeProduct);
      return;
    }

    const found = await ownedProduct(productId, auth);
    if (!found) {
      await objectFile(objectPath).delete({ ignoreNotFound: true }).catch(() => undefined);
      res.status(404).json({ error: "Course product not found" }); return;
    }
    if (found.course.thumbnailObjectPath && found.course.thumbnailObjectPath !== objectPath) {
      await objectFile(found.course.thumbnailObjectPath).delete({ ignoreNotFound: true }).catch(() => undefined);
    }
    const thumbnailUrl = `/api/marketplace/courses/${found.course.id}/thumbnail`;
    const [course] = await db.update(coursesTable).set({ thumbnailObjectPath: objectPath, thumbnailUrl, updatedAt: new Date() }).where(eq(coursesTable.id, found.course.id)).returning();
    res.json(course);
  },
);

router.post("/creator/lessons/:lessonId/assets/request-upload", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const lessonId = id(req.params.lessonId), auth = req as AuthenticatedRequest;
  const { filename, mimeType, sizeBytes, kind = "video" } = req.body ?? {};
  const isVideo = kind === "video";
  const attachment = typeof filename === "string" && typeof mimeType === "string" ? attachmentKind(filename, mimeType) : null;
  if (!lessonId || typeof filename !== "string" || !Number.isInteger(sizeBytes) || sizeBytes < 1 || (isVideo ? (!/^video\/[^;]+$/i.test(mimeType ?? "") || sizeBytes > MAX_VIDEO_BYTES) : (!attachment || sizeBytes > MAX_ATTACHMENT_BYTES))) { res.status(400).json({ error: "Invalid asset: videos allow up to 10GB; approved documents/resources allow up to 100MB" }); return; }
  if (!await ownedLesson(lessonId, auth)) { res.status(404).json({ error: "Lesson not found" }); return; }
  const upload = await createLessonAssetMultipartUpload(mimeType);
  const [asset] = await db.insert(lessonAssetsTable).values({ lessonId, kind: isVideo ? "video" : (attachment === "pdf" || attachment === "doc" || attachment === "ppt" || attachment === "xls" ? "document" : "other"), storageKey: upload.objectPath, objectPath: upload.objectPath, filename: filename.replace(/["\\\r\n]/g, "_"), mimeType, sizeBytes }).returning();
  const { storageKey: _storageKey, objectPath: _objectPath, ...safeAsset } = asset;
  res.status(201).json({ asset: safeAsset, uploadId: upload.uploadId, partSize: VIDEO_PART_BYTES });
});
router.post("/creator/lessons/:lessonId/assets/:assetId/part-url", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const lessonId = id(req.params.lessonId), assetId = id(req.params.assetId), auth = req as AuthenticatedRequest;
  if (!lessonId || !assetId || !await ownedLesson(lessonId, auth)) { res.status(404).json({ error: "Asset not found" }); return; }
  const [asset] = await db.select().from(lessonAssetsTable).where(and(eq(lessonAssetsTable.id, assetId), eq(lessonAssetsTable.lessonId, lessonId)));
  if (!asset) { res.status(404).json({ error: "Asset not found" }); return; }
  const { uploadId, partNumber } = req.body ?? {};
  if (typeof uploadId !== "string" || uploadId.length < 1 || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) {
    res.status(400).json({ error: "Valid uploadId and partNumber are required" }); return;
  }
  const uploadURL = await createLessonPartUploadUrl(asset.objectPath, uploadId, partNumber);
  res.json({ uploadURL });
});
router.put(
  "/creator/lessons/:lessonId/assets/:assetId/part",
  requireAuth,
  requireRole("creator", "admin"),
  raw({ type: "application/octet-stream", limit: "105mb" }),
  async (req, res): Promise<void> => {
    const lessonId = id(req.params.lessonId), assetId = id(req.params.assetId), auth = req as AuthenticatedRequest;
    if (!lessonId || !assetId || !await ownedLesson(lessonId, auth)) { res.status(404).json({ error: "Asset not found" }); return; }
    const [asset] = await db.select().from(lessonAssetsTable).where(and(eq(lessonAssetsTable.id, assetId), eq(lessonAssetsTable.lessonId, lessonId)));
    if (!asset) { res.status(404).json({ error: "Asset not found" }); return; }
    const uploadId = req.header("x-upload-id");
    const partNumber = Number(req.header("x-part-number"));
    if (!uploadId || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000 || !Buffer.isBuffer(req.body) || req.body.length < 1) {
      res.status(400).json({ error: "Valid upload part data is required" }); return;
    }
    const eTag = await uploadLessonMultipartPart(asset.objectPath, uploadId, partNumber, req.body);
    res.json({ eTag });
  },
);
router.post("/creator/lessons/:lessonId/assets/:assetId/finalize", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const lessonId = id(req.params.lessonId), assetId = id(req.params.assetId), auth = req as AuthenticatedRequest;
  if (!lessonId || !assetId || !await ownedLesson(lessonId, auth)) { res.status(404).json({ error: "Asset not found" }); return; }
  const [asset] = await db.select().from(lessonAssetsTable).where(and(eq(lessonAssetsTable.id, assetId), eq(lessonAssetsTable.lessonId, lessonId)));
  if (!asset) { res.status(404).json({ error: "Asset not found" }); return; }
  const { uploadId, parts } = req.body ?? {};
  if (typeof uploadId !== "string" || !Array.isArray(parts) || parts.length < 1 ||
      !parts.every((part) => Number.isInteger(part?.partNumber) && part.partNumber > 0 && typeof part?.eTag === "string" && part.eTag.length > 0)) {
    res.status(400).json({ error: "Valid multipart completion data is required" }); return;
  }
  await completeLessonMultipartUpload(asset.objectPath, uploadId, parts);
  const [metadata] = await objectFile(asset.objectPath).getMetadata();
  const actualSize = Number(metadata.size ?? 0);
  const isVideo = asset.kind === "video";
  if (actualSize < 1 || actualSize > (isVideo ? MAX_VIDEO_BYTES : MAX_ATTACHMENT_BYTES) || (isVideo ? (metadata.contentType && !metadata.contentType.startsWith("video/")) : !attachmentKind(asset.filename, String(metadata.contentType ?? asset.mimeType)))) { res.status(422).json({ error: "Uploaded object type or size is not allowed" }); return; }
  const previousVideoAssets = isVideo ? await db.select().from(lessonAssetsTable).where(and(
    eq(lessonAssetsTable.lessonId, lessonId),
    eq(lessonAssetsTable.kind, "video"),
    sql`${lessonAssetsTable.id} <> ${assetId}`,
  )) : [];
  const [updated] = await db.transaction(async (tx) => {
    const [result] = await tx.update(lessonAssetsTable).set({ status: "uploaded", sizeBytes: actualSize, mimeType: metadata.contentType ?? asset.mimeType }).where(eq(lessonAssetsTable.id, assetId)).returning();
    if (previousVideoAssets.length) {
      await tx.delete(lessonAssetsTable).where(inArray(lessonAssetsTable.id, previousVideoAssets.map((item) => item.id)));
    }
    return [result];
  });
  await Promise.all(previousVideoAssets.map((item) => objectFile(item.objectPath).delete({ ignoreNotFound: true }).catch(() => undefined)));
  const { storageKey: _updatedStorageKey, objectPath: _updatedObjectPath, ...safeUpdated } = updated;
  res.json(safeUpdated);
});
router.post("/creator/lessons/:lessonId/assets/:assetId/abort", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const lessonId = id(req.params.lessonId), assetId = id(req.params.assetId), auth = req as AuthenticatedRequest;
  if (!lessonId || !assetId || !await ownedLesson(lessonId, auth)) { res.status(404).json({ error: "Asset not found" }); return; }
  const [asset] = await db.select().from(lessonAssetsTable).where(and(eq(lessonAssetsTable.id, assetId), eq(lessonAssetsTable.lessonId, lessonId)));
  if (!asset || typeof req.body?.uploadId !== "string") { res.status(404).json({ error: "Upload not found" }); return; }
  await abortLessonMultipartUpload(asset.objectPath, req.body.uploadId).catch(() => undefined);
  await db.delete(lessonAssetsTable).where(eq(lessonAssetsTable.id, assetId));
  res.sendStatus(204);
});
router.get("/creator/lessons/:lessonId/assets", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const lessonId = id(req.params.lessonId); if (!lessonId || !await ownedLesson(lessonId, req as AuthenticatedRequest)) { res.status(404).json({ error: "Lesson not found" }); return; }
  const assets = await db.select().from(lessonAssetsTable).where(eq(lessonAssetsTable.lessonId, lessonId));
  res.json(assets.map(({ storageKey, objectPath, ...asset }) => ({ ...asset, downloadUrl: `/api/creator/assets/${asset.id}/download` })));
});
router.get("/creator/assets/:assetId/download", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const assetId = id(req.params.assetId); if (!assetId) { res.status(400).json({ error: "Invalid asset id" }); return; }
  const [asset] = await db.select().from(lessonAssetsTable).where(eq(lessonAssetsTable.id, assetId));
  if (!asset || asset.status !== "uploaded" || !await ownedLesson(asset.lessonId, req as AuthenticatedRequest)) { res.status(404).json({ error: "Asset not found" }); return; }
  await streamAsset(asset, req, res, CREATOR_DOWNLOAD_URL_TTL_SECONDS, asset.kind !== "video");
});
router.get("/student/courses/:courseId/assets/:assetId/stream", requireAuth, requireRole("student", "creator", "admin"), async (req, res): Promise<void> => {
  const courseId = id(req.params.courseId), assetId = id(req.params.assetId), user = req as AuthenticatedRequest;
  if (!courseId || !assetId || !user.canonicalUserId) { res.status(400).json({ error: "Invalid course or asset" }); return; }
  if (!isCoursePlayerMediaRequest(req)) {
    req.log.warn({ courseId, assetId, userId: user.canonicalUserId, dest: req.headers["sec-fetch-dest"], site: req.headers["sec-fetch-site"] }, "Blocked lesson video request from outside the course player");
    res.status(403).setHeader("Cache-Control", "private, no-store");
    res.json({ error: "Lesson videos can only be played inside the course player" });
    return;
  }
  const [row] = await db.select({ asset: lessonAssetsTable }).from(lessonAssetsTable)
    .innerJoin(lessonsTable, eq(lessonsTable.id, lessonAssetsTable.lessonId))
    .innerJoin(courseModulesTable, eq(courseModulesTable.id, lessonsTable.moduleId))
    .innerJoin(enrollmentsTable, and(eq(enrollmentsTable.courseId, courseModulesTable.courseId), eq(enrollmentsTable.userId, user.canonicalUserId)))
    .where(and(
      eq(courseModulesTable.courseId, courseId),
      eq(lessonAssetsTable.id, assetId),
      eq(lessonAssetsTable.status, "uploaded"),
      sql`${enrollmentsTable.expiresAt} IS NULL OR ${enrollmentsTable.expiresAt} > now()`,
    ));
  if (!row) { res.status(404).json({ error: "Video not found or enrollment required" }); return; }
  await streamAsset(row.asset, req, res, STUDENT_STREAM_URL_TTL_SECONDS);
});
router.get("/student/courses/:courseId/assets/:assetId/download", requireAuth, requireRole("student", "creator", "admin"), async (req, res): Promise<void> => {
  const courseId = id(req.params.courseId), assetId = id(req.params.assetId), user = req as AuthenticatedRequest;
  if (!courseId || !assetId) { res.status(400).json({ error: "Invalid course or asset" }); return; }
  const [row] = await db.select({ asset: lessonAssetsTable }).from(lessonAssetsTable)
    .innerJoin(lessonsTable, eq(lessonsTable.id, lessonAssetsTable.lessonId))
    .innerJoin(courseModulesTable, eq(courseModulesTable.id, lessonsTable.moduleId))
    .innerJoin(enrollmentsTable, and(eq(enrollmentsTable.courseId, courseModulesTable.courseId), eq(enrollmentsTable.userId, user.canonicalUserId!)))
    .where(and(
      eq(courseModulesTable.courseId, courseId),
      eq(lessonAssetsTable.id, assetId),
      eq(lessonAssetsTable.status, "uploaded"),
      sql`${enrollmentsTable.expiresAt} IS NULL OR ${enrollmentsTable.expiresAt} > now()`,
    ));
  if (!row || row.asset.kind === "video") { res.status(404).json({ error: "Download not found or enrollment required" }); return; }
  await streamAsset(row.asset, req, res, STUDENT_STREAM_URL_TTL_SECONDS, true);
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