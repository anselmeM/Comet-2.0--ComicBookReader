import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { uploadFile, getComicKey } from '@/lib/storage';
import { z } from 'zod';

import { COMIC_CONFIG } from '@/lib/constants';

import { UploadSchema } from '@/types/schemas';

const MAGIC_BYTES: Record<string, number[]> = {
  cbz: [0x50, 0x4b, 0x03, 0x04], // PK zip signature
  cbr: [0x52, 0x61, 0x72, 0x21], // Rar! signature
};

export const POST = withAuth(async (req: Request, context, session) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const filehash = formData.get('filehash') as string;
    const extension = formData.get('extension') as string;

    // Validate inputs
    const validated = UploadSchema.safeParse({ filehash, extension });
    if (!validated.success || !file) {
      return NextResponse.json({ error: 'Invalid upload data' }, { status: 400 });
    }

    // Validate file size
    if (file.size > COMIC_CONFIG.MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const key = getComicKey(session.user.id, filehash, extension);
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate magic bytes (Finding #12)
    const magic = MAGIC_BYTES[extension];
    const header = buffer.subarray(0, magic.length);
    const isValid = magic.every((b, i) => b === header[i]);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid file format' }, { status: 400 });
    }

    // Upload to Cloud Storage
    await uploadFile(key, buffer, file.type);

    return NextResponse.json({ success: true, key });
  } catch {
    return NextResponse.json({ error: 'Failed to upload comic' }, { status: 500 });
  }
});
