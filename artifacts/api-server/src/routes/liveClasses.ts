import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { and, desc, eq, gte } from "drizzle-orm";
import { AccessToken, EgressClient, EncodedFileOutput } from "livekit-server-sdk";
import { db, coursesTable, enrollmentsTable, liveClassAttendanceTable, liveClassesTable, productsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();
const id = (value: string | string[]) => typeof value === "string" && Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const auth = (req: Express.Request) => req as AuthenticatedRequest;

function schedule(body: any) {
  if (typeof body?.title !== "string" || !body.title.trim() || typeof body?.timezone !== "string" || !body.timezone.trim()) return null;
  const startsAt = new Date(body.startsAt), endsAt = new Date(body.endsAt);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) return null;
  return { title: body.title.trim(), description: typeof body.description === "string" ? body.description : "", startsAt, endsAt, timezone: body.timezone.trim() };
}

async function ownedClass(classId: number, req: AuthenticatedRequest) {
  const [row] = await db.select({ liveClass: liveClassesTable, product: productsTable })
    .from(liveClassesTable).innerJoin(productsTable, eq(productsTable.id, liveClassesTable.productId))
    .where(and(eq(liveClassesTable.id, classId), req.canonicalRole === "admin" ? undefined : eq(productsTable.creatorId, req.canonicalUserId!)));
  return row;
}

router.get("/creator/products/:productId/live-classes", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = id(req.params.productId), user = auth(req);
  if (!productId) { res.status(400).json({ error: "Invalid product id" }); return; }
  const [product] = await db.select().from(productsTable).where(and(eq(productsTable.id, productId), user.canonicalRole === "admin" ? undefined : eq(productsTable.creatorId, user.canonicalUserId!)));
  if (!product || !product.courseId) { res.status(404).json({ error: "Course product not found" }); return; }
  res.json(await db.select().from(liveClassesTable).where(eq(liveClassesTable.productId, productId)).orderBy(desc(liveClassesTable.startsAt)));
});

router.post("/creator/products/:productId/live-classes", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const productId = id(req.params.productId), user = auth(req), values = schedule(req.body);
  if (!productId || !values) { res.status(422).json({ error: "title, ISO startsAt/endsAt, timezone and endsAt > startsAt are required" }); return; }
  const [product] = await db.select().from(productsTable).where(and(eq(productsTable.id, productId), user.canonicalRole === "admin" ? undefined : eq(productsTable.creatorId, user.canonicalUserId!)));
  if (!product?.courseId) { res.status(404).json({ error: "Course product not found" }); return; }
  const [item] = await db.insert(liveClassesTable).values({ ...values, productId, courseId: product.courseId, creatorId: product.creatorId, roomName: `course-${product.courseId}-class-${randomUUID()}` }).returning();
  res.status(201).json(item);
});

router.get("/live-classes", requireAuth, async (req, res): Promise<void> => {
  const courseId = id(String(req.query.courseId ?? "")), user = auth(req);
  if (!courseId) { res.status(400).json({ error: "courseId is required" }); return; }
  const [enrolled] = await db.select({ id: enrollmentsTable.id }).from(enrollmentsTable).where(and(eq(enrollmentsTable.courseId, courseId), eq(enrollmentsTable.userId, user.canonicalUserId!)));
  if (user.canonicalRole === "student" && !enrolled) { res.status(403).json({ error: "Enrollment required" }); return; }
  res.json(await db.select().from(liveClassesTable).where(and(eq(liveClassesTable.courseId, courseId), gte(liveClassesTable.endsAt, new Date()))).orderBy(liveClassesTable.startsAt));
});

router.patch("/creator/live-classes/:id", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const classId = id(req.params.id), values = schedule(req.body);
  if (!classId || !values) { res.status(422).json({ error: "Invalid schedule" }); return; }
  if (!await ownedClass(classId, auth(req))) { res.status(404).json({ error: "Live class not found" }); return; }
  const [item] = await db.update(liveClassesTable).set({ ...values, updatedAt: new Date() }).where(eq(liveClassesTable.id, classId)).returning();
  res.json(item);
});

router.delete("/creator/live-classes/:id", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const classId = id(req.params.id); if (!classId || !await ownedClass(classId, auth(req))) { res.status(404).json({ error: "Live class not found" }); return; }
  await db.delete(liveClassesTable).where(eq(liveClassesTable.id, classId)); res.sendStatus(204);
});

for (const [path, status] of [["cancel", "cancelled"], ["complete", "completed"]] as const) {
  router.post(`/creator/live-classes/:id/${path}`, requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
    const classId = id(req.params.id); if (!classId || !await ownedClass(classId, auth(req))) { res.status(404).json({ error: "Live class not found" }); return; }
    const [item] = await db.update(liveClassesTable).set({ status, updatedAt: new Date() }).where(eq(liveClassesTable.id, classId)).returning(); res.json(item);
  });
}

router.get("/creator/live-classes/:id/attendance", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const classId = id(req.params.id);
  if (!classId || !await ownedClass(classId, auth(req))) { res.status(404).json({ error: "Live class not found" }); return; }
  const rows = await db.select({
    id: liveClassAttendanceTable.id,
    liveClassId: liveClassAttendanceTable.liveClassId,
    userId: liveClassAttendanceTable.userId,
    name: usersTable.name,
    email: usersTable.email,
    role: liveClassAttendanceTable.role,
    firstJoinedAt: liveClassAttendanceTable.firstJoinedAt,
    lastLeftAt: liveClassAttendanceTable.lastLeftAt,
    durationSeconds: liveClassAttendanceTable.durationSeconds,
    joinCount: liveClassAttendanceTable.joinCount,
  }).from(liveClassAttendanceTable)
    .innerJoin(usersTable, eq(usersTable.id, liveClassAttendanceTable.userId))
    .where(eq(liveClassAttendanceTable.liveClassId, classId))
    .orderBy(liveClassAttendanceTable.firstJoinedAt);
  res.json(rows);
});

router.post("/live-classes/:id/join", requireAuth, async (req, res): Promise<void> => {
  const classId = id(req.params.id), user = auth(req); if (!classId) { res.status(400).json({ error: "Invalid class id" }); return; }
  const [item] = await db.select().from(liveClassesTable).where(eq(liveClassesTable.id, classId));
  if (!item || item.status === "cancelled") { res.status(404).json({ error: "Live class not found" }); return; }
  const host = user.canonicalRole === "admin" || (user.canonicalRole === "creator" && item.creatorId === user.canonicalUserId);
  if (!host) {
    const [enrolled] = await db.select({ id: enrollmentsTable.id }).from(enrollmentsTable).where(and(eq(enrollmentsTable.courseId, item.courseId), eq(enrollmentsTable.userId, user.canonicalUserId!)));
    if (!enrolled) { res.status(403).json({ error: "Enrollment required" }); return; }
    const now = Date.now();
    if (now < item.startsAt.getTime() - 15 * 60_000) { res.status(403).json({ error: "The classroom opens 15 minutes before the scheduled start time" }); return; }
    if (now > item.endsAt.getTime() + 30 * 60_000 || item.status === "completed") { res.status(403).json({ error: "This live class has ended" }); return; }
  }
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) { res.status(503).json({ error: "LiveKit is not configured" }); return; }
  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { identity: String(user.canonicalUserId), name: user.user?.name, ttl: "2h" });
  token.addGrant({ roomJoin: true, room: item.roomName, canPublish: host, canSubscribe: true, canPublishData: host, roomAdmin: host });
  if (host && item.status === "scheduled") {
    item.status = "live";
    await db.update(liveClassesTable).set({ status: "live", updatedAt: new Date() }).where(eq(liveClassesTable.id, item.id));
  }
  res.json({ serverUrl: process.env.LIVEKIT_URL, token: await token.toJwt(), class: item, participantRole: host ? "host" : "student" });
});

async function attendance(req: Request, res: Response, joining: boolean) {
  const classId = id(req.params.id), user = auth(req); if (!classId) { res.status(400).json({ error: "Invalid class id" }); return; }
  const [item] = await db.select().from(liveClassesTable).where(eq(liveClassesTable.id, classId));
  if (!item) { res.status(404).json({ error: "Live class not found" }); return; }
  const host = user.canonicalRole === "admin" || (user.canonicalRole === "creator" && item.creatorId === user.canonicalUserId);
  if (!host) { const [enrolled] = await db.select({ id: enrollmentsTable.id }).from(enrollmentsTable).where(and(eq(enrollmentsTable.courseId, item.courseId), eq(enrollmentsTable.userId, user.canonicalUserId!))); if (!enrolled) { res.status(403).json({ error: "Enrollment required" }); return; } }
  const now = new Date(), [existing] = await db.select().from(liveClassAttendanceTable).where(and(eq(liveClassAttendanceTable.liveClassId, classId), eq(liveClassAttendanceTable.userId, user.canonicalUserId!)));
  if (joining) {
    if (existing) await db.update(liveClassAttendanceTable).set({ joinCount: existing.joinCount + 1, currentJoinedAt: now, lastLeftAt: null }).where(eq(liveClassAttendanceTable.id, existing.id));
    else await db.insert(liveClassAttendanceTable).values({ liveClassId: classId, userId: user.canonicalUserId!, role: host ? "host" : "student", firstJoinedAt: now, currentJoinedAt: now, joinCount: 1 });
  } else if (existing) {
    const duration = existing.currentJoinedAt ? Math.max(0, Math.floor((now.getTime() - existing.currentJoinedAt.getTime()) / 1000)) : 0;
    await db.update(liveClassAttendanceTable).set({ currentJoinedAt: null, lastLeftAt: now, durationSeconds: existing.durationSeconds + duration }).where(eq(liveClassAttendanceTable.id, existing.id));
  }
  res.sendStatus(204);
}
router.post("/live-classes/:id/attendance/join", requireAuth, (req, res) => attendance(req, res, true));
router.post("/live-classes/:id/attendance/leave", requireAuth, (req, res) => attendance(req, res, false));

router.post("/creator/live-classes/:id/recording/start", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const classId = id(req.params.id), found = classId ? await ownedClass(classId, auth(req)) : null;
  if (!found) { res.status(404).json({ error: "Live class not found" }); return; }
  if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_RECORDING_FILEPATH) { res.status(422).json({ error: "Recording destination is not configured; set LIVEKIT_RECORDING_FILEPATH" }); return; }
  try {
    const client = new EgressClient(process.env.LIVEKIT_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
    const output = new EncodedFileOutput({ filepath: process.env.LIVEKIT_RECORDING_FILEPATH.replace("{classId}", String(classId)), output: "mp4" } as any);
    const egress = await client.startRoomCompositeEgress(found.liveClass.roomName, output as any, { layout: "grid" } as any);
    const [item] = await db.update(liveClassesTable).set({ recordingStatus: "recording", egressId: egress.egressId, updatedAt: new Date() }).where(eq(liveClassesTable.id, classId!)).returning(); res.json(item);
  } catch { res.status(502).json({ error: "LiveKit recording could not be started" }); }
});

router.post("/creator/live-classes/:id/recording/stop", requireAuth, requireRole("creator", "admin"), async (req, res): Promise<void> => {
  const classId = id(req.params.id), found = classId ? await ownedClass(classId, auth(req)) : null;
  if (!found) { res.status(404).json({ error: "Live class not found" }); return; }
  if (!found.liveClass.egressId || !process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) { res.status(422).json({ error: "No active recording" }); return; }
  try { await new EgressClient(process.env.LIVEKIT_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET).stopEgress(found.liveClass.egressId); } catch { res.status(502).json({ error: "LiveKit recording could not be stopped" }); return; }
  const [item] = await db.update(liveClassesTable).set({ recordingStatus: "processing", updatedAt: new Date() }).where(eq(liveClassesTable.id, classId!)).returning(); res.json(item);
});

export default router;