export async function uploadDigitalFile({
  productId,
  file,
  onProgress
}: {
  productId: number;
  file: File;
  onProgress?: (progress: number) => void;
}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/creator/digital-products/${productId}/files/direct-upload`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.setRequestHeader("X-File-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      const body = (() => { try { return JSON.parse(xhr.responseText); } catch { return {}; } })();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(body);
      } else {
        reject(new Error(body.error || `Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.send(file);
  });
}
