import JSZip from 'jszip';
// Import node-unrar-js for CBR support
import { createExtractorFromData } from 'node-unrar-js';
import { logger } from '@/lib/logger';

const IMAGE_REGEX = /\.(jpg|jpeg|png|webp|gif|avif)$/i;

// Helper to check if a filename is an image
function isImageFile(filename: string): boolean {
  return IMAGE_REGEX.test(filename);
}

// --------------------------------------------------------
// Types
// --------------------------------------------------------
interface PageEntry {
  name: string;
  blob: Blob;
  width: number;
  height: number;
}

// --------------------------------------------------------
// Helper: Process Image Blob to get dimensions (CLS prevention)
// --------------------------------------------------------
async function processImageBlob(
  blob: Blob,
  index: number,
): Promise<{ width: number; height: number }> {
  let width = 0;
  let height = 0;
  try {
    const bitmap = await createImageBitmap(blob);
    width = bitmap.width;
    height = bitmap.height;
    bitmap.close();
  } catch (e) {
    logger.warn(
      `Failed to get dimensions for page ${index}:`,
      {},
      e instanceof Error ? e : undefined,
    );
  }
  return { width, height };
}

// --------------------------------------------------------
// Helper: Send Progress Message
// --------------------------------------------------------
function reportProgress(comicId: string, pageIndex: number, total: number) {
  if (pageIndex % 10 === 0 || pageIndex === total) {
    self.postMessage({
      type: 'PROGRESS',
      comicId,
      page: pageIndex,
      total,
    });
  }
}

// --------------------------------------------------------
// CBR Parsing Logic (node-unrar-js with WASM)
// --------------------------------------------------------
async function extractCbr(
  buffer: ArrayBuffer,
  filename: string,
  wasmBinary: ArrayBuffer | undefined,
  comicId: string,
): Promise<PageEntry[]> {
  logger.info('[CBR Parser] Starting extraction for:', { data: filename });

  if (!wasmBinary) {
    throw new Error('WASM binary not provided. Cannot parse CBR files.');
  }

  const extractor = await createExtractorFromData({
    data: buffer,
    wasmBinary: wasmBinary,
  });

  const extracted = extractor.extract({
    files: (fileHeader) => isImageFile(fileHeader.name),
  });

  const files = [...extracted.files];
  logger.info(`[CBR Parser] Found ${files.length} image files`);

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  files.sort((a, b) => collator.compare(a.fileHeader.name, b.fileHeader.name));

  const total = files.length;
  const pageEntries: PageEntry[] = [];

  for (let i = 0; i < total; i++) {
    const fileEntry = files[i];

    if (!fileEntry.extraction) {
      logger.warn(`Skipping file ${fileEntry.fileHeader.name} - no extraction data`);
      continue;
    }

    const extractionData = fileEntry.extraction;
    const arrayBuffer = new ArrayBuffer(extractionData.length);
    new Uint8Array(arrayBuffer).set(extractionData);
    const blob = new Blob([arrayBuffer]);

    const dimensions = await processImageBlob(blob, i);

    pageEntries.push({
      name: fileEntry.fileHeader.name,
      blob,
      width: dimensions.width,
      height: dimensions.height,
    });

    reportProgress(comicId, i + 1, total);
  }

  logger.info('[CBR Parser] Extraction complete. Total pages:', { data: pageEntries.length });
  return pageEntries;
}

// --------------------------------------------------------
// CBZ Parsing Logic (jszip)
// --------------------------------------------------------
async function extractCbz(buffer: ArrayBuffer, comicId: string): Promise<PageEntry[]> {
  const zip = await JSZip.loadAsync(buffer);

  const imageFiles = Object.values(zip.files).filter(
    (file) => !file.dir && IMAGE_REGEX.test(file.name),
  );

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  imageFiles.sort((a, b) => collator.compare(a.name, b.name));

  const total = imageFiles.length;
  const pageEntries: PageEntry[] = [];

  for (let i = 0; i < total; i++) {
    const file = imageFiles[i];

    // Extract as ArrayBuffer first to avoid Playwright Blob serialization bug in Web Workers
    const arrayBuffer = await file.async('arraybuffer');
    const blob = new Blob([arrayBuffer]);

    const dimensions = await processImageBlob(blob, i);

    pageEntries.push({
      name: file.name,
      blob,
      width: dimensions.width,
      height: dimensions.height,
    });

    reportProgress(comicId, i + 1, total);
  }

  return pageEntries;
}

// --------------------------------------------------------
// Main Worker Listener
// --------------------------------------------------------
self.addEventListener('message', async (event) => {
  const { type, buffer, filename, comicId, wasmBinary, format } = event.data;

  if (type !== 'PARSE') return;

  try {
    const isCbr = format ? format === 'rar' : filename.toLowerCase().endsWith('.cbr');
    let pageEntries: PageEntry[];

    if (isCbr) {
      pageEntries = await extractCbr(buffer, filename, wasmBinary, comicId);
    } else {
      pageEntries = await extractCbz(buffer, comicId);
    }

    self.postMessage({
      type: 'DONE',
      comicId,
      pages: pageEntries.map((e) => ({
        blob: e.blob,
        width: e.width,
        height: e.height,
      })),
    });
  } catch (error: unknown) {
    self.postMessage({
      type: 'ERROR',
      comicId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
