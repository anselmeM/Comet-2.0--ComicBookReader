import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * @file Cloud Storage Utility
 * Manages uploading, retrieving, and deleting comic files using S3-compatible storage.
 */

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  // If using a custom endpoint (like Cloudflare R2 or Minio)
  endpoint: process.env.AWS_ENDPOINT,
});

const BUCKET = process.env.AWS_BUCKET || '';

/**
 * Uploads a comic file to S3 storage.
 */
export async function uploadFile(key: string, body: Buffer | Uint8Array, contentType: string) {
  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
    return true;
  } catch (error) {
    console.error('[Storage] Upload error:', error);
    throw new Error('Failed to upload file to cloud storage');
  }
}

/**
 * Generates a pre-signed URL for temporary access to a private file.
 * Useful for serving comic pages securely without making the bucket public.
 */
export async function getDownloadUrl(key: string, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3, command, { expiresIn });
  } catch (error) {
    console.error('[Storage] Signed URL error:', error);
    return null;
  }
}

/**
 * Deletes a file from S3 storage.
 */
export async function deleteFile(key: string) {
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
    return true;
  } catch (error) {
    console.error('[Storage] Delete error:', error);
    return false;
  }
}

/**
 * Helper to generate a standardized key for a comic file.
 */
export function generateComicKey(userId: string, fileHash: string, extension = 'cbz') {
  return `users/${userId}/comics/${fileHash}.${extension}`;
}
