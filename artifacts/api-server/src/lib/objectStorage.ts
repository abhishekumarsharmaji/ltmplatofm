import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";
import { PassThrough } from "node:stream";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const storage = new Storage({
  credentials: { audience: "replit", subject_token_type: "access_token", token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`, type: "external_account", credential_source: { url: `${REPLIT_SIDECAR_ENDPOINT}/credential`, format: { type: "json", subject_token_field_name: "access_token" } }, universe_domain: "googleapis.com" },
  projectId: "",
});
let r2Client: S3Client | undefined;
function r2Config() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accessKeyId || !secretAccessKey || !endpoint || !bucket) {
    throw new Error("Cloudflare R2 is not configured");
  }
  r2Client ??= new S3Client({
    region: "auto",
    endpoint: endpoint.replace(/\/$/, ""),
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client: r2Client, bucket };
}
function parseR2(path: string) {
  const match = /^r2:\/\/([^/]+)\/(.+)$/.exec(path);
  if (!match) throw new Error("Invalid R2 object path");
  return { bucket: match[1], name: match[2] };
}
function parse(path: string) {
  const clean = path.replace(/^\/+/, "");
  const slash = clean.indexOf("/");
  if (slash < 1) throw new Error("Invalid object path");
  return { bucket: clean.slice(0, slash), name: clean.slice(slash + 1) };
}
async function createUploadUrl(folder: string): Promise<{ url: string; objectPath: string }> {
  const { client, bucket } = r2Config();
  const name = `${folder}/${randomUUID()}`;
  const url = await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: name }), { expiresIn: 15 * 60 });
  return { url, objectPath: `r2://${bucket}/${name}` };
}
export const createLessonUploadUrl = () => createUploadUrl("lesson-videos");
export const createCourseThumbnailUploadUrl = () => createUploadUrl("course-thumbnails");
export async function createLessonMultipartUpload(contentType: string) {
  return createLessonAssetMultipartUpload(contentType);
}
export async function createLessonAssetMultipartUpload(contentType: string) {
  const { client, bucket } = r2Config();
  const name = `lesson-assets/${randomUUID()}`;
  const result = await client.send(new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: name,
    ContentType: contentType,
  }));
  if (!result.UploadId) throw new Error("R2 did not create a multipart upload");
  return { uploadId: result.UploadId, objectPath: `r2://${bucket}/${name}` };
}
export async function createLessonPartUploadUrl(objectPath: string, uploadId: string, partNumber: number) {
  const { client } = r2Config();
  const { bucket, name } = parseR2(objectPath);
  return getSignedUrl(client, new UploadPartCommand({
    Bucket: bucket,
    Key: name,
    UploadId: uploadId,
    PartNumber: partNumber,
  }), { expiresIn: 15 * 60 });
}
export async function completeLessonMultipartUpload(
  objectPath: string,
  uploadId: string,
  parts: Array<{ partNumber: number; eTag: string }>,
) {
  const { client } = r2Config();
  const { bucket, name } = parseR2(objectPath);
  await client.send(new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: name,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.map((part) => ({ PartNumber: part.partNumber, ETag: part.eTag })),
    },
  }));
}
export async function abortLessonMultipartUpload(objectPath: string, uploadId: string) {
  const { client } = r2Config();
  const { bucket, name } = parseR2(objectPath);
  await client.send(new AbortMultipartUploadCommand({
    Bucket: bucket,
    Key: name,
    UploadId: uploadId,
  }));
}
export async function createObjectDownloadUrl(objectPath: string, filename: string, contentType: string, expiresInSeconds: number, attachment = false) {
  if (!objectPath.startsWith("r2://")) return null;
  const { client } = r2Config();
  const { bucket, name } = parseR2(objectPath);
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket,
    Key: name,
    ResponseContentType: contentType,
    ResponseContentDisposition: `${attachment ? "attachment" : "inline"}; filename="${filename.replace(/["\\\r\n]/g, "_")}"`,
  }), { expiresIn: expiresInSeconds });
}
export function objectFile(objectPath: string) {
  if (objectPath.startsWith("r2://")) {
    const { client } = r2Config();
    const { bucket, name } = parseR2(objectPath);
    return {
      async getMetadata() {
        const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: name }));
        return [{
          size: result.ContentLength,
          contentType: result.ContentType,
        }];
      },
      createReadStream(options?: { start?: number; end?: number }) {
        const output = new PassThrough();
        const range = options?.start !== undefined
          ? `bytes=${options.start}-${options.end ?? ""}`
          : undefined;
        void client.send(new GetObjectCommand({ Bucket: bucket, Key: name, Range: range }))
          .then(({ Body }) => {
            if (!Body || typeof (Body as NodeJS.ReadableStream).pipe !== "function") {
              output.destroy(new Error("R2 did not return a readable object stream"));
              return;
            }
            (Body as NodeJS.ReadableStream).pipe(output);
          })
          .catch((error: unknown) => output.destroy(error instanceof Error ? error : new Error("R2 download failed")));
        return output;
      },
      async delete(_options?: { ignoreNotFound?: boolean }) {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: name }));
        return [{}];
      },
    };
  }
  const { bucket, name } = parse(objectPath);
  return storage.bucket(bucket).file(name);
}