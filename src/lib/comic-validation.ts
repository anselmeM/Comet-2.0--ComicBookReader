export const COMIC_MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
export const ALLOWED_EXTENSIONS = ['.cbz', '.cbr', '.zip'];

/**
 * Validates a comic archive file for size, extension, and magic bytes.
 * Throws an Error if the file is invalid.
 */
export async function validateComicArchive(file: File): Promise<void> {
  // 1. File size validation
  if (file.size > COMIC_MAX_FILE_SIZE) {
    throw new Error(`File exceeds the maximum limit of 1GB.`);
  }

  // 2. Extension validation
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(`Invalid file type. Allowed types: .cbz, .cbr, .zip`);
  }

  // 3. Magic bytes validation
  const headerSlice = file.slice(0, 4);
  const headerBuffer = await headerSlice.arrayBuffer();
  const headerView = new Uint8Array(headerBuffer);

  const isZip =
    headerView[0] === 0x50 &&
    headerView[1] === 0x4b &&
    headerView[2] === 0x03 &&
    headerView[3] === 0x04;
  const isRar =
    headerView[0] === 0x52 &&
    headerView[1] === 0x61 &&
    headerView[2] === 0x72 &&
    headerView[3] === 0x21;

  if (!isZip && !isRar) {
    throw new Error(`File is corrupt or not a valid comic archive.`);
  }
}
