import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db, coursesTable, creatorProfilesTable, productsTable, usersTable, courseModulesTable, lessonsTable } from "@workspace/db";

const router: IRouter = Router();
const SITE = "https://coreskils.org";
const publicSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const text = (v: unknown, max = 300) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
const url = (path: string) => `${SITE}${path}`;
const stripProfile = (p: typeof creatorProfilesTable.$inferSelect, userName?: string) => ({
  displayName: p.displayName, username: p.username, headline: p.headline, bio: p.bio, websiteUrl: p.websiteUrl,
  avatarUrl: p.avatarObjectPath ? `/api/marketplace/creators/${p.userId}/avatar?v=${p.updatedAt.getTime()}` : p.avatarUrl,
  name: userName,
});
const pageData = (title: string, description: string, canonical: string, graph: unknown, body: string, image?: string, type = "website") =>
  ({ title, description, canonical, graph, body, image, type });
const render = async (res: any, data: ReturnType<typeof pageData>) => {
  let html: string;
  try {
    html = await readFile(join(process.cwd(), "artifacts/lms-front/dist/public/index.html"), "utf8");
  } catch {
    try { html = await readFile(join(process.cwd(), "../lms-front/dist/public/index.html"), "utf8"); }
    catch { res.status(503).send("SEO shell unavailable"); return; }
  }
  const imageMeta = data.image ? `<meta property="og:image" content="${esc(data.image)}"><meta name="twitter:image" content="${esc(data.image)}">` : "";
  const head = `<title>${esc(data.title)}</title><meta name="description" content="${esc(data.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${esc(data.canonical)}"><meta property="og:title" content="${esc(data.title)}"><meta property="og:description" content="${esc(data.description)}"><meta property="og:type" content="${esc(data.type)}"><meta property="og:url" content="${esc(data.canonical)}"><meta property="og:site_name" content="CoreSkils">${imageMeta}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(data.title)}"><meta name="twitter:description" content="${esc(data.description)}"><script type="application/ld+json">${json(data.graph)}</script>`;
  html = html.replace(/<title>[\s\S]*?<\/title>|<meta name="description"[^>]*>|<meta name="robots"[^>]*>|<link rel="canonical"[^>]*>|<meta property="og:[^>]*>|<meta name="twitter:[^>]*>|<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, "").replace("</head>", `${head}</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${data.body}</div>`);
  res.type("html").send(html);
};
const card = (item: { title: string; description?: string; href: string }) => `<article><h2><a href="${esc(item.href)}">${esc(item.title)}</a></h2><p>${esc(text(item.description, 240))}</p></article>`;
const faq = (items: unknown) => Array.isArray(items) ? items.filter((x): x is { question?: unknown; answer?: unknown } => !!x && typeof x === "object" && typeof (x as any).question === "string" && typeof (x as any).answer === "string").slice(0, 20) : [];

router.get("/sitemap.xml", async (_req, res) => {
  const [courses, products, creators] = await Promise.all([
    db.select({ slug: productsTable.publicSlug, updatedAt: coursesTable.updatedAt }).from(coursesTable)
      .innerJoin(productsTable, and(eq(productsTable.courseId, coursesTable.id), eq(productsTable.type, "course"), eq(productsTable.status, "published")))
      .where(eq(coursesTable.status, "published")),
    db.select({ slug: productsTable.publicSlug, updatedAt: productsTable.updatedAt }).from(productsTable).where(eq(productsTable.status, "published")),
    db.select({ username: creatorProfilesTable.username, updatedAt: creatorProfilesTable.updatedAt }).from(creatorProfilesTable).innerJoin(usersTable, eq(usersTable.id, creatorProfilesTable.userId)).where(eq(usersTable.role, "creator")),
  ]);
  const rows = [
    ["/", undefined], ["/courses", undefined], ["/products", undefined],
    ...courses.filter((x) => x.slug).map((x) => [`/courses/${x.slug}`, x.updatedAt]), ...products.filter((x) => x.slug).map((x) => [`/products/${x.slug}`, x.updatedAt]),
    ...creators.filter((x) => x.username).map((x) => [`/creators/${x.username}`, x.updatedAt]),
  ];
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows.map(([path, lastmod]) => `<url><loc>${esc(url(String(path)))}</loc>${lastmod ? `<lastmod>${new Date(lastmod as Date).toISOString()}</lastmod>` : ""}</url>`).join("")}</urlset>`);
});
router.get("/robots.txt", (_req, res) => res.type("text/plain").send(`User-agent: *\nAllow: /\nAllow: /assets/\nDisallow: /dashboard\nDisallow: /auth\nDisallow: /checkout\nDisallow: /admin\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n`));

router.get(["/", "/courses", "/products"], async (req, res) => {
  const catalogue = req.path === "/courses" ? "courses" : req.path === "/products" ? "products" : "home";
  const [courses, products] = await Promise.all([
    db.select({ title: coursesTable.title, description: coursesTable.description, slug: productsTable.publicSlug }).from(coursesTable)
      .innerJoin(productsTable, and(eq(productsTable.courseId, coursesTable.id), eq(productsTable.type, "course"), eq(productsTable.status, "published")))
      .where(eq(coursesTable.status, "published")).orderBy(desc(coursesTable.updatedAt)).limit(50),
    db.select({ title: productsTable.title, description: productsTable.description, publicSlug: productsTable.publicSlug }).from(productsTable).where(eq(productsTable.status, "published")).orderBy(desc(productsTable.updatedAt)).limit(50),
  ]);
  const items = catalogue === "courses" ? courses.filter((x) => x.slug).map((x) => ({ ...x, href: `/courses/${x.slug}` })) : products.filter((x) => x.publicSlug).map((x) => ({ title: x.title, description: x.description, href: `/products/${x.publicSlug}` }));
  const title = catalogue === "home" ? "CoreSkils — Learn and build practical skills" : catalogue === "courses" ? "Online courses | CoreSkils" : "Digital products | CoreSkils";
  const description = catalogue === "home" ? "Practical online courses and digital products from CoreSkils creators." : `Explore published ${catalogue} from CoreSkils.`;
  const graph = catalogue === "home" ? { "@context": "https://schema.org", "@graph": [{ "@type": "Organization", name: "CoreSkils", url: SITE }, { "@type": "WebSite", name: "CoreSkils", url: SITE }] } : { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: url(req.path), mainEntity: { "@type": "ItemList", itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: url(x.href), name: x.title })) } };
  await render(res, pageData(title, description, url(req.path), graph, `<main><h1>${esc(title)}</h1><p>${esc(description)}</p><section>${items.map(card).join("") || "<p>No published items are available yet.</p>"}</section></main>`));
});

router.get("/courses/:idOrSlug", async (req, res) => {
  const key = String(req.params.idOrSlug).toLowerCase();
  const [row] = await db.select({ course: coursesTable, product: productsTable, profile: creatorProfilesTable, creatorName: usersTable.name }).from(coursesTable).innerJoin(usersTable, eq(usersTable.id, coursesTable.creatorId)).leftJoin(creatorProfilesTable, eq(creatorProfilesTable.userId, coursesTable.creatorId)).leftJoin(productsTable, and(eq(productsTable.courseId, coursesTable.id), eq(productsTable.type, "course"), eq(productsTable.status, "published"))).where(and(eq(coursesTable.status, "published"), /^\d+$/.test(key) ? eq(coursesTable.id, Number(key)) : eq(productsTable.publicSlug, key)));
  if (!row) { res.status(404).send("Course not found"); return; }
  const c = row.course, description = text(c.description, 300), path = `/courses/${row.product?.publicSlug || c.id}`;
  const creatorPath = row.profile?.username ? `/creators/${row.profile.username}` : undefined;
  const questions = faq(c.faqs);
  const graph = { "@context": "https://schema.org", "@graph": [
    { "@type": "Course", name: c.title, description, url: url(path), provider: { "@type": "Person", name: row.creatorName, ...(creatorPath ? { url: url(creatorPath) } : {}) }, offers: row.product ? { "@type": "Offer", price: row.product.priceMinor / 100, priceCurrency: row.product.currency, availability: "https://schema.org/InStock", url: url(path) } : undefined },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Courses", item: url("/courses") }, { "@type": "ListItem", position: 2, name: c.title, item: url(path) }] },
    ...(questions.length ? [{ "@type": "FAQPage", mainEntity: questions.map((x) => ({ "@type": "Question", name: x.question, acceptedAnswer: { "@type": "Answer", text: x.answer } })) }] : []),
  ] };
  await render(res, pageData(`${c.title} | CoreSkils`, description, url(path), graph, `<main><nav><a href="/courses">Courses</a></nav><article><h1>${esc(c.title)}</h1><p>${esc(description)}</p><p>Created by ${creatorPath ? `<a href="${esc(creatorPath)}">${esc(row.creatorName)}</a>` : esc(row.creatorName)}</p></article></main>`, url(`/api/marketplace/courses/${c.id}/thumbnail`), "product"));
});

router.get("/products/:idOrSlug", async (req, res) => {
  const key = String(req.params.idOrSlug).toLowerCase();
  const [row] = await db.select({ product: productsTable, profile: creatorProfilesTable, creatorName: usersTable.name }).from(productsTable).innerJoin(usersTable, eq(usersTable.id, productsTable.creatorId)).leftJoin(creatorProfilesTable, eq(creatorProfilesTable.userId, productsTable.creatorId)).where(and(eq(productsTable.status, "published"), /^\d+$/.test(key) ? eq(productsTable.id, Number(key)) : eq(productsTable.publicSlug, key)));
  if (!row) { res.status(404).send("Product not found"); return; }
  const p = row.product, path = `/products/${p.publicSlug || p.id}`, description = text(p.shortSummary || p.description, 300), questions = faq((p.salesPage as any)?.faqs);
  const graph = { "@context": "https://schema.org", "@graph": [
    { "@type": "Product", name: p.title, description, url: url(path), image: p.coverImageObjectPath || p.coverImageUrl ? url(`/api/marketplace/products/${p.id}/cover`) : undefined, brand: { "@type": "Brand", name: "CoreSkils" }, offers: { "@type": "Offer", price: p.priceMinor / 100, priceCurrency: p.currency, availability: "https://schema.org/InStock", url: url(path) } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Products", item: url("/products") }, { "@type": "ListItem", position: 2, name: p.title, item: url(path) }] },
    ...(questions.length ? [{ "@type": "FAQPage", mainEntity: questions.map((x) => ({ "@type": "Question", name: x.question, acceptedAnswer: { "@type": "Answer", text: x.answer } })) }] : []),
  ] };
  const creatorPath = row.profile?.username ? `/creators/${row.profile.username}` : undefined;
  const cover = p.coverImageObjectPath || p.coverImageUrl ? url(`/api/marketplace/products/${p.id}/cover`) : undefined;
  await render(res, pageData(`${p.title} | CoreSkils`, description, url(path), graph, `<main><nav><a href="/products">Products</a></nav><article><h1>${esc(p.title)}</h1><p>${esc(description)}</p><p>By ${creatorPath ? `<a href="${esc(creatorPath)}">${esc(row.creatorName)}</a>` : esc(row.creatorName)}</p></article></main>`, cover, "product"));
});

router.get("/creators/:username", async (req, res) => {
  const [row] = await db.select({ profile: creatorProfilesTable, name: usersTable.name }).from(creatorProfilesTable).innerJoin(usersTable, eq(usersTable.id, creatorProfilesTable.userId)).where(eq(creatorProfilesTable.username, String(req.params.username).toLowerCase()));
  if (!row) { res.status(404).send("Creator not found"); return; }
  const courses = await db.select({ title: coursesTable.title, slug: productsTable.publicSlug, description: coursesTable.description }).from(coursesTable)
    .innerJoin(productsTable, and(eq(productsTable.courseId, coursesTable.id), eq(productsTable.type, "course"), eq(productsTable.status, "published")))
    .where(and(eq(coursesTable.creatorId, row.profile.userId), eq(coursesTable.status, "published")));
  const products = await db.select({ title: productsTable.title, publicSlug: productsTable.publicSlug, description: productsTable.description }).from(productsTable).where(and(eq(productsTable.creatorId, row.profile.userId), eq(productsTable.status, "published")));
  const path = `/creators/${row.profile.username}`, name = row.profile.displayName || row.name;
  const avatar = row.profile.avatarObjectPath ? url(`/api/marketplace/creators/${row.profile.userId}/avatar?v=${row.profile.updatedAt.getTime()}`) : row.profile.avatarUrl || undefined;
  const publicCourses = courses.filter((course) => course.slug);
  await render(res, pageData(`${name} | CoreSkils`, text(row.profile.bio || row.profile.headline || `Explore courses and products by ${name}.`), url(path), { "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: { "@type": "Person", name, url: url(path), image: avatar, description: text(row.profile.bio || row.profile.headline) }, hasPart: { "@type": "ItemList", itemListElement: [...publicCourses.map((x) => ({ "@type": "ListItem", url: url(`/courses/${x.slug}`), name: x.title })), ...products.filter((x) => x.publicSlug).map((x) => ({ "@type": "ListItem", url: url(`/products/${x.publicSlug}`), name: x.title }))] } }, `<main><h1>${esc(name)}</h1><p>${esc(text(row.profile.bio || row.profile.headline))}</p><section>${publicCourses.map((x) => card({ ...x, href: `/courses/${x.slug}` })).join("")}${products.filter((x) => x.publicSlug).map((x) => card({ ...x, href: `/products/${x.publicSlug}` })).join("")}</section></main>`, avatar, "profile"));
});
export default router;