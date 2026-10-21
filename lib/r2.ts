import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Server-only. Credentials come from env vars and are never sent to the browser.
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;

export const r2Configured = Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);

export const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/aac": "aac", "audio/wav": "wav", "audio/x-wav": "wav", "audio/flac": "flac", "audio/ogg": "ogg",
};
export const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
export const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function presignAudioPut(key: string, contentType: string, size: number) {
  if (!r2Configured) throw new Error("R2 not configured");
  const client = new S3Client({
    region: "auto",
    // R2 rejects the SDK's default CRC32 checksum params on browser PUTs; only add checksums when required.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID!, secretAccessKey: R2_SECRET_ACCESS_KEY! },
  });
  return getSignedUrl(client, new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType, ContentLength: size }), { expiresIn: 600 });
}

// ---- Server-side object access (used by audio processing) ----
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream, createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";

function serverClient() {
  if (!r2Configured) throw new Error("R2 not configured");
  return new S3Client({
    region: "auto", requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID!, secretAccessKey: R2_SECRET_ACCESS_KEY! },
  });
}
export async function downloadObject(key: string, toFile: string) {
  const res = await serverClient().send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  await pipeline(res.Body as Readable, createWriteStream(toFile));
}
export async function uploadFile(key: string, fromFile: string, contentType: string) {
  const { size } = await stat(fromFile);
  await serverClient().send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: createReadStream(fromFile), ContentType: contentType, ContentLength: size }));
}
