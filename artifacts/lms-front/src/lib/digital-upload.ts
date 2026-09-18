import { requestDigitalFileUpload, requestDigitalFilePartUrl, finalizeDigitalFileUpload, abortDigitalFileUpload } from "@workspace/api-client-react";

export async function uploadDigitalFile({
  productId,
  file,
  onProgress
}: {
  productId: number;
  file: File;
  onProgress?: (progress: number) => void;
}) {
  const uploadRes = await requestDigitalFileUpload(productId, {
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  });

  const { file: dbFile, uploadId, partSize } = uploadRes;

  try {
    const totalParts = Math.ceil(file.size / partSize);
    const uploadedParts: Array<{ partNumber: number; eTag: string }> = [];
    let uploadedBytes = 0;

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      const partUrlRes = await requestDigitalFilePartUrl(productId, dbFile.id, {
        uploadId, partNumber
      });

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', partUrlRes.uploadURL);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
             const eTag = xhr.getResponseHeader('ETag');
             if (!eTag) {
               reject(new Error(`Upload part ${partNumber} completed without an ETag`));
               return;
             }
             uploadedParts.push({ partNumber, eTag });
             uploadedBytes += chunk.size;
             if (onProgress) onProgress(Math.round((uploadedBytes / file.size) * 100));
             resolve(null);
          } else {
             reject(new Error(`Failed to upload part ${partNumber}: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(chunk);
      });
    }

    const finalRes = await finalizeDigitalFileUpload(productId, dbFile.id, {
      uploadId, parts: uploadedParts
    });

    return finalRes;
  } catch (err) {
    await abortDigitalFileUpload(productId, dbFile.id, { uploadId }).catch(() => {});
    throw err;
  }
}
