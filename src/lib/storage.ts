import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.AWS_ENDPOINT, // Required for Cloudflare R2
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'comet-comics';

/**
 * Uploads a file to S3/R2.
 *
 * @param key - The unique storage key (path) for the file.
 * @param body - The file content as a Buffer or Uint8Array.
 * @param contentType - The MIME type of the file.
 */
export async function uploadFile(key: string, body: Buffer | Uint8Array, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3.send(command);

  // Return the public URL if using a CDN, or just the key
  return key;
}

/**
 * Generates a signed URL for a file in S3/R2.
 * Used for secure, time-limited access to private files.
 *
 * @param key - The storage key.
 * @param expiresIn - Expiration time in seconds (default 1 hour).
 */
export async function getDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Deletes a file from S3/R2.
 *
 * @param key - The storage key.
 */
export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3.send(command);
}

/**
 * Helper to generate a standardized key for a comic file.
 */
export function getComicKey(userId: string, filehash: string, extension: string) {
  return `comics/${userId}/${filehash}.${extension}`;
}

/**
 * Helper to generate a standardized key for a cover image.
 */
export function getCoverKey(userId: string, filehash: string) {
  return `covers/${userId}/${filehash}.jpg`;
}
