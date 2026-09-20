import { readFile, stat } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { db, digitalFilesTable, productsTable } from "@workspace/db";
import {
  completeDigitalFileMultipartUpload,
  createDigitalFileMultipartUpload,
  createProductCoverUploadUrl,
  uploadLessonMultipartPart,
} from "../lib/objectStorage";

async function main() {
  const productId = 30;
  const root = "/home/runner/workspace";
  const coverPath = `${root}/attached_assets/generated_images/wellness-business-guide-cover.jpg`;
  const pdfPath = `${root}/attached_assets/wellness-service-business-guide-hi.pdf`;

  const [cover, pdf, pdfInfo] = await Promise.all([
    readFile(coverPath),
    readFile(pdfPath),
    stat(pdfPath),
  ]);

  const coverUpload = await createProductCoverUploadUrl();
  const coverResponse = await fetch(coverUpload.url, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: cover,
  });
  if (!coverResponse.ok) throw new Error(`Cover upload failed with ${coverResponse.status}`);

  const multipart = await createDigitalFileMultipartUpload("application/pdf");
  const eTag = await uploadLessonMultipartPart(multipart.objectPath, multipart.uploadId, 1, pdf);
  await completeDigitalFileMultipartUpload(multipart.objectPath, multipart.uploadId, [{ partNumber: 1, eTag }]);

  await db.transaction(async (tx) => {
    await tx.delete(digitalFilesTable).where(eq(digitalFilesTable.productId, productId));
    await tx.insert(digitalFilesTable).values({
      productId,
      kind: "document",
      storageKey: multipart.objectPath,
      objectPath: multipart.objectPath,
      filename: "wellness-service-business-guide-hindi.pdf",
      mimeType: "application/pdf",
      sizeBytes: pdfInfo.size,
      status: "uploaded",
      position: 0,
    });
    await tx.update(productsTable).set({
      coverImageObjectPath: coverUpload.objectPath,
      coverImageUrl: `/api/marketplace/products/${productId}/cover`,
      status: "published",
      updatedAt: new Date(),
    }).where(eq(productsTable.id, productId));
  });

  console.log(JSON.stringify({ productId, published: true, fileSize: pdfInfo.size }));
}

void main();