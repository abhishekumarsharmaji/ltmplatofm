import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, inArray } from "drizzle-orm";
import {
  coursesTable,
  creatorProfilesTable,
  db,
  digitalFilesTable,
  productsTable,
  usersTable,
} from "@workspace/db";
import {
  completeDigitalFileMultipartUpload,
  createDigitalFileMultipartUpload,
  createProductCoverUploadUrl,
  objectFile,
  uploadLessonMultipartPart,
} from "./objectStorage";

const PRODUCT_SLUG = "wellness-service-business-guide-hindi";
const DEMO_TITLES = new Set(["Untitled Course", "Course sell", "zsdfgfhhgbfd", "TEST", "aswedrtfghfds"]);

const salesPage = {
  tagline: "सम्मानजनक, सुरक्षित और प्रोफेशनल महिला-केंद्रित वेलनेस सर्विस शुरू करने की प्रैक्टिकल हिंदी गाइड",
  ctaLabel: "₹99 में तुरंत एक्सेस पाएं",
  benefits: [
    "सही बिज़नेस मॉडल, niche और service packages चुनें",
    "Safety, consent, hygiene और professional boundaries समझें",
    "Pricing, booking, payment और customer follow-up process बनाएं",
    "30-दिन के action plan से व्यवस्थित शुरुआत करें",
  ],
  targetAudience: [
    "College students जो practical side business समझना चाहते हैं",
    "Working professionals जो structured wellness service शुरू करना चाहते हैं",
    "Salon, yoga या wellness professionals",
    "पहली बार service business शुरू करने वाले beginners",
  ],
  includedItems: [
    "Original Hindi PDF ebook",
    "Setup और safety checklists",
    "Pricing formula और package examples",
    "Ready-to-use enquiry और feedback messages",
    "30-दिन का launch action plan",
  ],
  sections: [
    {
      heading: "क्या आप जानते हैं?",
      body: "लोग relaxation और trustworthy wellness experiences पर खर्च करते हैं, लेकिन लंबे समय तक वही service चलती है जो साफ communication, hygiene, professional boundaries और customer safety को प्राथमिकता देती है। यह guide आपको केवल ideas नहीं, बल्कि step-by-step operating process देती है।",
    },
    {
      heading: "ईबुक में क्या मिलेगा?",
      body: "बिज़नेस मॉडल चुनने से लेकर setup, compliance, consent, service pricing, local marketing, booking process, repeat customers और 30-दिन के launch plan तक पूरी practical roadmap। हर section सरल हिंदी में है और checklists के साथ दिया गया है।",
    },
    {
      heading: "महिला ग्राहक कैसे जोड़ें?",
      body: "Guide में professional positioning, local partnerships, WhatsApp Business, helpful content और permission-based referrals के practical तरीके हैं। Fake promises या intrusive marketing के बजाय भरोसा, privacy और consistent service पर focus रखा गया है।",
    },
    {
      heading: "कमाई को सही तरीके से समझें",
      body: "Service fee आपके शहर, training, duration, travel और demand पर निर्भर करेगी। Guide में pricing formula और cost planning दी गई है, लेकिन income guarantee नहीं की गई है। लक्ष्य है sustainable और legally compliant business बनाना।",
    },
  ],
  testimonials: [],
  faqs: [
    {
      question: "क्या यह beginners के लिए है?",
      answer: "हाँ। Guide basic planning से शुरू होती है, लेकिन service देने से पहले योग्य training और local compliance verify करना जरूरी है।",
    },
    {
      question: "क्या इससे income guaranteed है?",
      answer: "नहीं। आय location, demand, skill, pricing और execution पर निर्भर करती है। यह एक educational business guide है।",
    },
    {
      question: "खरीदने के बाद क्या मिलेगा?",
      answer: "Verified payment के बाद आपके CoreSkils account में downloadable Hindi PDF ebook उपलब्ध होगी।",
    },
    {
      question: "क्या इसे आगे बेच सकते हैं?",
      answer: "नहीं। यह केवल buyer के व्यक्तिगत उपयोग के लिए licensed है; redistribution या resale की अनुमति नहीं है।",
    },
  ],
  supportEmail: "",
  terms: "Digital product केवल व्यक्तिगत उपयोग के लिए है। डाउनलोड या access के बाद refund eligibility प्रकाशित Refund Policy के अनुसार होगी। आय की कोई गारंटी नहीं है।",
};

export async function seedWellnessProductIfNeeded() {
  const existing = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.publicSlug, PRODUCT_SLUG));
  if (existing.length > 0) return { seeded: false, productId: existing[0].id };

  const users = await db.select({ id: usersTable.id, role: usersTable.role, name: usersTable.name }).from(usersTable);
  const owner = users.find((user) => user.role === "admin" && user.name === "SUPERADMIN")
    ?? users.find((user) => user.role === "admin")
    ?? users.find((user) => user.role === "creator");
  if (!owner) throw new Error("Cannot seed the wellness product because no creator or admin user exists");

  const allProducts = await db.select().from(productsTable);
  const demos = allProducts.filter((product) => DEMO_TITLES.has(product.title) || product.publicSlug === "test");
  const demoIds = demos.map((product) => product.id);
  const courseIds = demos.flatMap((product) => product.courseId ? [product.courseId] : []);

  if (demoIds.length > 0) {
    const files = await db.select().from(digitalFilesTable).where(inArray(digitalFilesTable.productId, demoIds));
    await Promise.all([
      ...files.map((file) => objectFile(file.objectPath ?? file.storageKey).delete({ ignoreNotFound: true }).catch(() => undefined)),
      ...demos.filter((product) => product.coverImageObjectPath).map((product) => objectFile(product.coverImageObjectPath!).delete({ ignoreNotFound: true }).catch(() => undefined)),
    ]);
  }

  const assetDir = resolve(dirname(fileURLToPath(import.meta.url)), "seed-assets");
  const coverPath = resolve(assetDir, "wellness-business-guide-cover.jpg");
  const pdfPath = resolve(assetDir, "wellness-service-business-guide-hi.pdf");
  const [cover, pdf, pdfInfo] = await Promise.all([readFile(coverPath), readFile(pdfPath), stat(pdfPath)]);

  const coverUpload = await createProductCoverUploadUrl();
  const coverResponse = await fetch(coverUpload.url, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: cover,
  });
  if (!coverResponse.ok) throw new Error(`Wellness product cover upload failed with ${coverResponse.status}`);

  const multipart = await createDigitalFileMultipartUpload("application/pdf");
  const eTag = await uploadLessonMultipartPart(multipart.objectPath, multipart.uploadId, 1, pdf);
  await completeDigitalFileMultipartUpload(multipart.objectPath, multipart.uploadId, [{ partNumber: 1, eTag }]);

  return db.transaction(async (tx) => {
    if (demoIds.length > 0) await tx.delete(productsTable).where(inArray(productsTable.id, demoIds));
    if (courseIds.length > 0) await tx.delete(coursesTable).where(inArray(coursesTable.id, courseIds));

    const [profile] = await tx.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, owner.id));
    if (profile) {
      await tx.update(creatorProfilesTable).set({ displayName: "CoreSkils", updatedAt: new Date() }).where(eq(creatorProfilesTable.id, profile.id));
    } else {
      await tx.insert(creatorProfilesTable).values({ userId: owner.id, displayName: "CoreSkils", bio: "Practical digital learning resources." });
    }

    const [product] = await tx.insert(productsTable).values({
      creatorId: owner.id,
      type: "digital",
      title: "Premium Hindi Ebook – Wellness Service Business Guide",
      description: "अपनी professional wellness service को सही planning, safety और customer trust के साथ शुरू करें। इस original Hindi ebook में business model, setup, hygiene, consent, pricing, marketing, booking process, repeat customers और 30-दिन का action plan शामिल है।\n\nयह educational guide है। Income results market, skill और execution पर निर्भर करते हैं; कोई earning guarantee नहीं है।",
      shortSummary: "महिला-केंद्रित professional wellness service शुरू करने की step-by-step Hindi guide",
      subtype: "ebook",
      priceMinor: 9_900,
      currency: "INR",
      status: "published",
      publicSlug: PRODUCT_SLUG,
      salesPage,
      coverImageObjectPath: coverUpload.objectPath,
      coverImageUrl: "",
    }).returning();

    await tx.update(productsTable).set({
      coverImageUrl: `/api/marketplace/products/${product.id}/cover`,
    }).where(eq(productsTable.id, product.id));

    await tx.insert(digitalFilesTable).values({
      productId: product.id,
      kind: "document",
      storageKey: multipart.objectPath,
      objectPath: multipart.objectPath,
      filename: "wellness-service-business-guide-hindi.pdf",
      mimeType: "application/pdf",
      sizeBytes: pdfInfo.size,
      status: "uploaded",
      position: 0,
    });

    return { seeded: true, productId: product.id };
  });
}