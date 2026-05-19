/**
 * @file Service layer for Comic-related operations.
 *
 * Handles interaction with the library and cloud storage APIs.
 */

export interface AddComicPayload {
  title: string;
  filehash: string;
  pageCount: number;
  coverUrl: string | null;
  storageKey: string;
  extension: 'cbz' | 'cbr';
}

/**
 * Uploads a comic file to cloud storage via the proxy API.
 *
 * @param file The comic file to upload.
 * @param filehash The pre-computed hash of the file.
 * @returns The storage key of the uploaded file.
 */
export async function uploadComicToCloud(file: File, filehash: string): Promise<string> {
  const extension = file.name.toLowerCase().endsWith('.cbz') ? 'cbz' : 'cbr';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filehash', filehash);
  formData.append('extension', extension);

  const response = await fetch('/api/library/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to upload to cloud storage');
  }

  const { key } = await response.json();
  return key;
}

/**
 * Adds a comic to the user's server-side library.
 *
 * @param payload Metadata about the comic.
 * @returns The server-assigned comic ID.
 */
export async function addComicToServerLibrary(payload: AddComicPayload): Promise<string> {
  const response = await fetch('/api/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await handleLibraryError(response);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Handles error responses from the library API.
 */
async function handleLibraryError(response: Response): Promise<never> {
  let errorMsg = 'Failed to save to library';

  try {
    const text = await response.text();
    const parsed = JSON.parse(text);
    errorMsg = parsed.error || parsed.message || errorMsg;
    if (parsed.details) errorMsg += `: ${parsed.details}`;
  } catch {
    // Stick with default error message
  }

  if (response.status === 401) {
    window.location.href = '/login?error=SessionExpired';
  }

  throw new Error(errorMsg);
}

/**
 * Updates the key in IndexedDB from a temporary ID (filehash) to the final server ID.
 */
export async function synchronizeLocalStorage(tempId: string, serverId: string): Promise<void> {
  const { getCachedComic, setCachedComic, evictCachedComic } = await import('@/lib/idb');

  const entry = await getCachedComic(tempId);
  if (entry) {
    await setCachedComic({ ...entry, comicId: serverId });
    await evictCachedComic(tempId);
  }
}
