import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const storage = new Storage({
  credentials: { audience: "replit", subject_token_type: "access_token", token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`, type: "external_account", credential_source: { url: `${REPLIT_SIDECAR_ENDPOINT}/credential`, format: { type: "json", subject_token_field_name: "access_token" } }, universe_domain: "googleapis.com" },
  projectId: "",
});
function privatePath() {
  const value = process.env.PRIVATE_OBJECT_DIR;
  if (!value) throw new Error("PRIVATE_OBJECT_DIR is not configured");
  return value.replace(/\/$/, "");
}
function parse(path: string) {
  const clean = path.replace(/^\/+/, "");
  const slash = clean.indexOf("/");
  if (slash < 1) throw new Error("Invalid object path");
  return { bucket: clean.slice(0, slash), name: clean.slice(slash + 1) };
}
export async function createLessonUploadUrl(): Promise<{ url: string; objectPath: string }> {
  const objectPath = `${privatePath()}/lesson-videos/${randomUUID()}`;
  const { bucket, name } = parse(objectPath);
  const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucket,
      object_name: name,
      method: "PUT",
      expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Failed to prepare upload URL (${response.status})`);
  }
  const { signed_url: url } = await response.json() as { signed_url?: string };
  if (!url) throw new Error("Storage service did not return an upload URL");
  return { url, objectPath: `/${objectPath}` };
}
export function objectFile(objectPath: string) {
  const { bucket, name } = parse(objectPath);
  return storage.bucket(bucket).file(name);
}