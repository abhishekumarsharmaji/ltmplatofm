import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db, digitalFilesTable, digitalProductEntitlementsTable, productsTable, usersTable,
} from "@workspace/db";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth";
import {
  abortDigitalFileMultipartUpload, completeDigitalFileMultipartUpload,
  createDigitalFileMultipartUpload, createDigitalFilePartUploadUrl,
  createObjectDownloadUrl, objectFile,
} from "../lib/objectStorage";

const router: IRouter = Router();
const MAX_FILE_BYTES = 250 * 1024 * 1024;
const MAX_FILES = 25;
const PRODUCT_SUBTYPES = ["ebook", "template", "toolkit", "document", "bundle", "other"] as const;
const MIME_BY_EXT: Record<string, string[]> = {
  pdf: ["application/pdf"], epub: ["application/epub+zip"], mobi: ["application/x-mobipocket-ebook", "application/octet-stream"],
  azw: ["application/vnd.amazon.ebook", "application/octet-stream"], azw3: ["application/vnd.amazon.ebook", "application/octet-stream"],
  doc: ["application/msword"], docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  odt: ["application/vnd.oasis.opendocument.text"], rtf: ["application/rtf", "text/rtf"],
  ppt: ["application/vnd.ms-powerpoint"], pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  xls: ["application/vnd.ms-excel"], xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  csv: ["text/csv", "application/csv", "application/vnd.ms-excel"], ods: ["application/vnd.oasis.opendocument.spreadsheet"],
  zip: ["application/zip"], "7z": ["application/x-7z-compressed"], rar: ["application/vnd.rar", "application/x-rar-compressed"],
  txt: ["text/plain"], json: ["application/json", "text/json"],
  png: ["image/png"], jpg: ["image/jpeg"], jpeg: ["image/jpeg"], webp: ["image/webp"], svg: ["image/svg+xml"],
};
const fileKind = (filename: string) => {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (["png", "jpg", "jpeg", "webp", "svg"].includes(ext)) return "image";
  if (["zip", "7z", "rar"].includes(ext)) return "other";
  if (["txt", "json"].includes(ext)) return "other";
  return "document";
};
const validFile = (filename: unknown, mime: unknown, size: unknown) => {
  if (typeof filename !== "string" || typeof mime !== "string" || !Number.isInteger(size) || Number(size) < 1 || Number(size) > MAX_FILE_BYTES) return false;
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  return !!MIME_BY_EXT[ext] && MIME_BY_EXT[ext].some((allowed) => allowed === mime.toLowerCase());
};
const numericId = (value: unknown) => /^\d+$/.test(String(value)) && Number(value) > 0 ? Number(value) : null;
const safeFile = (file: typeof digitalFilesTable.$inferSelect) => {
  const { storageKey: _storageKey, objectPath: _objectPath, ...rest } = file;
  return rest;
};
async function ownedProduct(productId: number, req: AuthenticatedRequest) {
  return (await db.select().from(productsTable).where(and(
    eq(productsTable.id, productId), eq(productsTable.type, "digital"),
    req.canonicalRole === "admin" ? undefined : eq(productsTable.creatorId, req.canonicalUserId!),
  )))[0];
}

router.get("/marketplace/digital-products", async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const rows = await db.select().from(productsTable).where(and(
    eq(productsTable.type, "digital"), eq(productsTable.status, "published"),
    q ? or(ilike(productsTable.title, `%${q}%`), ilike(productsTable.description, `%${q}%`)) : undefined,
  )).orderBy(desc(productsTable.createdAt));
  res.json(rows.map((row) => ({ ...row, priceMinor: 0, isFree: true })));
});
router.get("/marketplace/digital-products/:id", async (req, res): Promise<void> => {
  const productId = numericId(req.params.id);
  if (!productId) { res.status(400).json({ error: "Invalid product id" }); return; }
  const [product] = await db.select({ product: productsTable, creatorName: usersTable.name })
    .from(productsTable).innerJoin(usersTable, eq(usersTable.id, productsTable.creatorId))
    .where(and(eq(productsTable.id, productId), eq(productsTable.type, "digital"), eq(productsTable.status, "published")));
  if (!product) { res.status(404).json({ error: "Digital product not found" }); return; }
  const files = await db.select({ id: digitalFilesTable.id, filename: digitalFilesTable.filename, mimeType: digitalFilesTable.mimeType, sizeBytes: digitalFilesTable.sizeBytes, kind: digitalFilesTable.kind, position: digitalFilesTable.position })
    .from(digitalFilesTable).where(and(eq(digitalFilesTable.productId, productId), eq(digitalFilesTable.status, "uploaded"))).orderBy(asc(digitalFilesTable.position));
  res.json({ ...product.product, creatorName: product.creatorName, priceMinor: 0, isFree: true, files });
});

router.get("/creator/digital-products/:productId/files", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = numericId(req.params.productId);
  if (!productId || !await ownedProduct(productId, req as AuthenticatedRequest)) { res.status(404).json({ error: "Digital product not found" }); return; }
  const files = await db.select().from(digitalFilesTable).where(eq(digitalFilesTable.productId, productId)).orderBy(asc(digitalFilesTable.position));
  res.json(files.map(safeFile));
});
router.get("/creator/digital-products/:productId/readiness", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = numericId(req.params.productId), auth = req as AuthenticatedRequest;
  const product = productId ? await ownedProduct(productId, auth) : undefined;
  if (!product) { res.status(404).json({ error: "Digital product not found" }); return; }
  const [count] = await db.select({ count: sql<number>`count(*)::int` }).from(digitalFilesTable).where(and(eq(digitalFilesTable.productId, product.id), eq(digitalFilesTable.status, "uploaded")));
  const checks = {
    title: product.title.trim().length > 1, description: product.description.trim().length > 0,
    subtype: !!product.subtype, files: Number(count.count) > 0, free: product.priceMinor === 0,
  };
  res.json({ ready: Object.values(checks).every(Boolean), checks });
});
router.post("/creator/digital-products/:productId/unpublish", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = numericId(req.params.productId), auth = req as AuthenticatedRequest;
  if (!productId || !await ownedProduct(productId, auth)) { res.status(404).json({ error: "Digital product not found" }); return; }
  const [product] = await db.update(productsTable).set({ status: "draft", updatedAt: new Date() }).where(eq(productsTable.id, productId)).returning();
  res.json(product);
});
router.post("/creator/digital-products/:productId/files/request-upload", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = numericId(req.params.productId), auth = req as AuthenticatedRequest;
  if (!productId || !await ownedProduct(productId, auth)) { res.status(404).json({ error: "Digital product not found" }); return; }
  const { filename, mimeType, sizeBytes } = req.body ?? {};
  if (!validFile(filename, mimeType, sizeBytes)) { res.status(400).json({ error: "Unsupported file type or size. Files must be an approved format and no larger than 250MB." }); return; }
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(digitalFilesTable).where(eq(digitalFilesTable.productId, productId));
  if (Number(count) >= MAX_FILES) { res.status(409).json({ error: "A product can contain at most 25 files" }); return; }
  const upload = await createDigitalFileMultipartUpload(String(mimeType).toLowerCase());
  const [file] = await db.insert(digitalFilesTable).values({
    productId, kind: fileKind(String(filename)), storageKey: upload.objectPath, objectPath: upload.objectPath,
    filename: String(filename).replace(/["\\\r\n]/g, "_"), mimeType: String(mimeType).toLowerCase(), sizeBytes: Number(sizeBytes),
    status: "pending", position: Number(count),
  }).returning();
  res.status(201).json({ file: safeFile(file), uploadId: upload.uploadId, partSize: 100 * 1024 * 1024 });
});
router.post("/creator/digital-products/:productId/files/:fileId/part-url", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = numericId(req.params.productId), fileId = numericId(req.params.fileId), auth = req as AuthenticatedRequest;
  if (!productId || !fileId || !await ownedProduct(productId, auth)) { res.status(404).json({ error: "File not found" }); return; }
  const [file] = await db.select().from(digitalFilesTable).where(and(eq(digitalFilesTable.id, fileId), eq(digitalFilesTable.productId, productId)));
  const { uploadId, partNumber } = req.body ?? {};
  if (!file || typeof uploadId !== "string" || !Number.isInteger(partNumber) || partNumber < 1) { res.status(400).json({ error: "Valid upload data is required" }); return; }
  res.json({ uploadURL: await createDigitalFilePartUploadUrl(file.objectPath ?? file.storageKey, uploadId, partNumber) });
});
router.post("/creator/digital-products/:productId/files/:fileId/finalize", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = numericId(req.params.productId), fileId = numericId(req.params.fileId), auth = req as AuthenticatedRequest;
  if (!productId || !fileId || !await ownedProduct(productId, auth)) { res.status(404).json({ error: "File not found" }); return; }
  const [file] = await db.select().from(digitalFilesTable).where(and(eq(digitalFilesTable.id, fileId), eq(digitalFilesTable.productId, productId)));
  const { uploadId, parts } = req.body ?? {};
  if (!file || file.status === "uploaded" || typeof uploadId !== "string" || !Array.isArray(parts) || !parts.length) { res.status(400).json({ error: "Valid completion data is required" }); return; }
  await completeDigitalFileMultipartUpload(file.objectPath ?? file.storageKey, uploadId, parts);
  const [metadata] = await objectFile(file.objectPath ?? file.storageKey).getMetadata();
  const actualSize = Number(metadata.size ?? 0), actualMime = String(metadata.contentType ?? file.mimeType ?? "");
  if (!validFile(file.filename, actualMime, actualSize)) { await objectFile(file.objectPath ?? file.storageKey).delete({ ignoreNotFound: true }).catch(() => undefined); res.status(422).json({ error: "Uploaded object type or size is not allowed" }); return; }
  const [updated] = await db.update(digitalFilesTable).set({ status: "uploaded", sizeBytes: actualSize, mimeType: actualMime, updatedAt: new Date() }).where(eq(digitalFilesTable.id, fileId)).returning();
  res.json(safeFile(updated));
});
router.post("/creator/digital-products/:productId/files/:fileId/abort", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = numericId(req.params.productId), fileId = numericId(req.params.fileId), auth = req as AuthenticatedRequest;
  if (!productId || !fileId || !await ownedProduct(productId, auth)) { res.status(404).json({ error: "File not found" }); return; }
  const [file] = await db.select().from(digitalFilesTable).where(and(eq(digitalFilesTable.id, fileId), eq(digitalFilesTable.productId, productId)));
  if (!file || typeof req.body?.uploadId !== "string") { res.status(404).json({ error: "Upload not found" }); return; }
  await abortDigitalFileMultipartUpload(file.objectPath ?? file.storageKey, req.body.uploadId).catch(() => undefined);
  await db.delete(digitalFilesTable).where(eq(digitalFilesTable.id, fileId)); res.sendStatus(204);
});
router.delete("/creator/digital-products/:productId/files/:fileId", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = numericId(req.params.productId), fileId = numericId(req.params.fileId), auth = req as AuthenticatedRequest;
  if (!productId || !fileId || !await ownedProduct(productId, auth)) { res.status(404).json({ error: "File not found" }); return; }
  const [file] = await db.select().from(digitalFilesTable).where(and(eq(digitalFilesTable.id, fileId), eq(digitalFilesTable.productId, productId)));
  if (!file) { res.status(404).json({ error: "File not found" }); return; }
  await objectFile(file.objectPath ?? file.storageKey).delete({ ignoreNotFound: true }).catch(() => undefined);
  await db.delete(digitalFilesTable).where(eq(digitalFilesTable.id, fileId)); res.sendStatus(204);
});

router.post("/student/digital-products/:productId/acquire", requireAuth, requireRole("student", "creator", "admin"), async (req, res): Promise<void> => {
  const productId = numericId(req.params.productId), userId = (req as AuthenticatedRequest).canonicalUserId;
  if (!productId || !userId) { res.status(400).json({ error: "Invalid product" }); return; }
  const [product] = await db.select().from(productsTable).where(and(eq(productsTable.id, productId), eq(productsTable.type, "digital"), eq(productsTable.status, "published")));
  if (!product) { res.status(404).json({ error: "Published digital product not found" }); return; }
  const [entitlement] = await db.insert(digitalProductEntitlementsTable).values({ userId, productId }).onConflictDoNothing().returning();
  res.status(entitlement ? 201 : 200).json({ productId, acquired: true, alreadyOwned: !entitlement });
});
router.get("/student/digital-products", requireAuth, requireRole("student", "creator", "admin"), async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).canonicalUserId;
  if (!userId) { res.json([]); return; }
  const rows = await db.select({ product: productsTable, acquiredAt: digitalProductEntitlementsTable.acquiredAt }).from(digitalProductEntitlementsTable)
    .innerJoin(productsTable, eq(productsTable.id, digitalProductEntitlementsTable.productId)).where(eq(digitalProductEntitlementsTable.userId, userId)).orderBy(desc(digitalProductEntitlementsTable.acquiredAt));
  res.json(rows.map((row) => ({ ...row.product, acquiredAt: row.acquiredAt, isFree: true, priceMinor: 0 })));
});
router.get("/student/digital-products/:productId", requireAuth, requireRole("student", "creator", "admin"), async (req, res): Promise<void> => {
  const productId = numericId(req.params.productId), user = req as AuthenticatedRequest;
  if (!productId || !user.canonicalUserId) { res.status(400).json({ error: "Invalid product" }); return; }
  const [entitlement] = await db.select().from(digitalProductEntitlementsTable).where(and(eq(digitalProductEntitlementsTable.userId, user.canonicalUserId), eq(digitalProductEntitlementsTable.productId, productId)));
  const product = await ownedProduct(productId, user);
  const [published] = await db.select().from(productsTable).where(and(eq(productsTable.id, productId), eq(productsTable.type, "digital")));
  if (!entitlement && !product && user.canonicalRole !== "admin") { res.status(403).json({ error: "Acquire this product before downloading" }); return; }
  if (!published) { res.status(404).json({ error: "Digital product not found" }); return; }
  const files = await db.select({ id: digitalFilesTable.id, filename: digitalFilesTable.filename, mimeType: digitalFilesTable.mimeType, sizeBytes: digitalFilesTable.sizeBytes, kind: digitalFilesTable.kind, position: digitalFilesTable.position })
    .from(digitalFilesTable).where(and(eq(digitalFilesTable.productId, productId), eq(digitalFilesTable.status, "uploaded"))).orderBy(asc(digitalFilesTable.position));
  res.json({ ...published, isFree: true, priceMinor: 0, files });
});
router.get("/student/digital-products/:productId/files/:fileId/download", requireAuth, requireRole("student", "creator", "admin"), async (req, res): Promise<void> => {
  const productId = numericId(req.params.productId), fileId = numericId(req.params.fileId), user = req as AuthenticatedRequest;
  if (!productId || !fileId || !user.canonicalUserId) { res.status(400).json({ error: "Invalid file" }); return; }
  const [entitlement] = await db.select().from(digitalProductEntitlementsTable).where(and(eq(digitalProductEntitlementsTable.userId, user.canonicalUserId), eq(digitalProductEntitlementsTable.productId, productId)));
  const owner = await ownedProduct(productId, user);
  if (!entitlement && !owner && user.canonicalRole !== "admin") { res.status(403).json({ error: "Product access required" }); return; }
  const [file] = await db.select().from(digitalFilesTable).where(and(eq(digitalFilesTable.id, fileId), eq(digitalFilesTable.productId, productId), eq(digitalFilesTable.status, "uploaded")));
  if (!file) { res.status(404).json({ error: "File not found" }); return; }
  const path = file.objectPath ?? file.storageKey;
  const signedUrl = await createObjectDownloadUrl(path, file.filename, file.mimeType ?? "application/octet-stream", 5 * 60, true);
  if (signedUrl) { res.setHeader("Cache-Control", "private, no-store"); res.redirect(307, signedUrl); return; }
  const object = objectFile(path); const [metadata] = await object.getMetadata();
  res.setHeader("Content-Type", metadata.contentType ?? file.mimeType ?? "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${file.filename.replace(/["\\\r\n]/g, "_")}"`);
  object.createReadStream().pipe(res);
});

export default router;