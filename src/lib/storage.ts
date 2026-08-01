import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@/lib/logger';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY =
  process.env.AWS_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_ACCESS_KEY;
const AWS_ENDPOINT = process.env.AWS_ENDPOINT || process.env.STORAGE_ENDPOINT;
const AWS_REGION = process.env.AWS_REGION || process.env.STORAGE_REGION || 'auto';
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || process.env.STORAGE_BUCKET || 'comet-comics';

export function verifyStorageConfig(isRuntimeCheck = false): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_ENDPOINT) {
    if (isProduction && isRuntimeCheck) {
      throw new Error(
        'CRITICAL: Cloud storage keys (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT) ' +
          'are not configured in the production environment.',
      );
    }
    return false;
  }
  return true;
}

if (!verifyStorageConfig(false)) {
  logger.warn('Storage environment variables are missing. Cloud Sync will be disabled.');
}

export const s3 = new S3Client({
  region: AWS_REGION,
  endpoint: AWS_ENDPOINT || undefined,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID || '',
    secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
  },
});

export const BUCKET_NAME = AWS_BUCKET_NAME;

/**
 * Uploads a file to S3/R2.
 *
 * @param key - The unique storage key (path) for the file.
 * @param body - The file content as a Buffer or Uint8Array.
 * @param contentType - The MIME type of the file.
 */
export async function uploadFile(key: string, body: Buffer | Uint8Array, contentType: string) {
  verifyStorageConfig(true);
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
  verifyStorageConfig(true);
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
  verifyStorageConfig(true);
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

export const MULTIPART_PART_SIZE = 10 * 1024 * 1024;
export const MULTIPART_MAX_PARTS = 200;

/**
 * Initiates a multipart upload and returns presigned part URLs.
 * Used for large files where single PUTs to R2 intermittently reset over HTTP/2.
 */
export async function createMultipartUpload(
  key: string,
  contentType: string,
  fileSize: number,
  expiresIn = 3600,
) {
  verifyStorageConfig(true);
  const partCount = Math.ceil(fileSize / MULTIPART_PART_SIZE);
  if (partCount > MULTIPART_MAX_PARTS) {
    throw new Error(
      `File too large: max ${MULTIPART_MAX_PARTS} parts (${(MULTIPART_PART_SIZE * MULTIPART_MAX_PARTS) / 1024 / 1024} MB)`,
    );
  }

  const createCommand = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  const { UploadId } = await s3.send(createCommand);
  if (!UploadId) throw new Error('Failed to initiate multipart upload');

  const partUrls: string[] = [];
  for (let partNumber = 1; partNumber <= partCount; partNumber++) {
    const partCommand = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId,
      PartNumber: partNumber,
    });
    partUrls.push(await getSignedUrl(s3, partCommand, { expiresIn }));
  }

  return { uploadId: UploadId, partUrls, partSize: MULTIPART_PART_SIZE, partCount };
}

/**
 * Completes a multipart upload with the ETags of every uploaded part.
 */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[],
) {
  verifyStorageConfig(true);
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  await s3.send(command);
}

/**
 * Aborts a multipart upload, discarding any uploaded parts.
 */
export async function abortMultipartUpload(key: string, uploadId: string) {
  verifyStorageConfig(true);
  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
  });
  await s3.send(command);
}
