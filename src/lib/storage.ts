import { S3Client } from '@aws-sdk/client-s3';

if (!process.env.STORAGE_ACCESS_KEY_ID || !process.env.STORAGE_SECRET_ACCESS_KEY || !process.env.STORAGE_ENDPOINT) {
  // We don't throw here to avoid crashing the build if these are missing, 
  // but they are required for Cloud Sync features to work.
  console.warn('Storage environment variables are missing. Cloud Sync will be disabled.');
}

export const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.STORAGE_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET_NAME = process.env.STORAGE_BUCKET || 'comet-comics';
