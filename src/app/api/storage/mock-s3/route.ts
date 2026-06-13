import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

const MOCK_S3_DIR = path.join(process.cwd(), 'prisma', 'mock-s3');

// Helper to ensure mock directory exists
function ensureMockDir() {
  if (!fs.existsSync(MOCK_S3_DIR)) {
    fs.mkdirSync(MOCK_S3_DIR, { recursive: true });
  }
}

// GET - Download file from mock storage
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    ensureMockDir();
    const filePath = path.join(MOCK_S3_DIR, key.replace(/\//g, '_'));

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found in mock storage' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.basename(key)}"`,
      },
    });
  } catch (error: any) {
    logger.error('[MOCK_S3_GET_ERROR]', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: error.message || 'Failed to download from mock storage' },
      { status: 500 },
    );
  }
}

// PUT - Upload file to mock storage
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    ensureMockDir();
    const filePath = path.join(MOCK_S3_DIR, key.replace(/\//g, '_'));

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to local mock directory
    fs.writeFileSync(filePath, buffer);
    logger.info(`[Mock S3] Saved ${buffer.length} bytes to ${filePath}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('[MOCK_S3_PUT_ERROR]', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: error.message || 'Failed to upload to mock storage' },
      { status: 500 },
    );
  }
}

// DELETE - Remove file from mock storage
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    ensureMockDir();
    const filePath = path.join(MOCK_S3_DIR, key.replace(/\//g, '_'));

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`[Mock S3] Deleted ${filePath}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('[MOCK_S3_DELETE_ERROR]', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: error.message || 'Failed to delete from mock storage' },
      { status: 500 },
    );
  }
}
