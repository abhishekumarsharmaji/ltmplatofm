import { db, pool, sql } from "../../lib/db/src/index.ts";

const origin = process.env.SMOKE_ORIGIN ?? "http://localhost:80";
const marker = Date.now();
const email = `smoke-${marker}@example.com`;
const title = `Smoke Course ${marker}`;

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${origin}${path}`, init);
  if (!response.ok) throw new Error(`${init?.method ?? "GET"} ${path} returned ${response.status}`);
  return response;
}

try {
  const registration = await request("/api/auth/sign-up", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Smoke Test", email, password: "smoke-test-password" }),
  });
  const cookie = registration.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Registration did not create a session");

  await request("/api/creator/upgrade", { method: "POST", headers: { cookie } });
  const createdResponse = await request("/api/creator/products", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ title, description: "Transactional test course", type: "course", priceMinor: 4900, currency: "USD" }),
  });
  const created = await createdResponse.json() as { id: number };

  const moduleResponse = await request(`/api/creator/products/${created.id}/modules`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ title: "Getting Started" }),
  });
  const courseModule = await moduleResponse.json() as { id: number };
  await request(`/api/creator/modules/${courseModule.id}/lessons`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ title: "Welcome to the course", description: "Course introduction", isPreview: true }),
  });

  const readiness = await (await request(`/api/creator/products/${created.id}/readiness`, {
    headers: { cookie },
  })).json() as { ready: boolean; moduleCount: number; lessonCount: number };
  if (!readiness.ready || readiness.moduleCount !== 1 || readiness.lessonCount !== 1) {
    throw new Error("Course builder readiness did not reflect the saved curriculum");
  }

  await request(`/api/creator/products/${created.id}/publish-course`, { method: "POST", headers: { cookie } });

  const products = await (await request(`/api/marketplace/products?q=${encodeURIComponent(title)}`)).json() as Array<{ id: number }>;
  if (!products.some((product) => product.id === created.id)) throw new Error("Published product was not discoverable");

  await request(`/api/student/wishlist/${created.id}`, { method: "POST", headers: { cookie } });
  const wishlist = await (await request("/api/student/wishlist", { headers: { cookie } })).json() as Array<{ product: { id: number } }>;
  if (!wishlist.some((item) => item.product.id === created.id)) throw new Error("Wishlist did not persist");

  console.log("Phase 1 integration test passed");
} finally {
  await db.execute(sql`DELETE FROM wishlist WHERE user_id IN (SELECT id FROM users WHERE email = ${email})`);
  await db.execute(sql`DELETE FROM products WHERE title = ${title}`);
  await db.execute(sql`DELETE FROM courses WHERE title = ${title}`);
  await db.execute(sql`DELETE FROM creator_profiles WHERE user_id IN (SELECT id FROM users WHERE email = ${email})`);
  await db.execute(sql`DELETE FROM users WHERE email = ${email}`);
  await db.execute(sql`DELETE FROM lms_users WHERE email = ${email}`);
  await pool.end();
}