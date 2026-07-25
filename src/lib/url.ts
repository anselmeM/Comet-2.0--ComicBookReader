/**
 * Validates if a given path is a safe local redirect.
 * A safe local redirect must start with a single '/' and not be followed by another '/' or '\'.
 */
export function isValidRedirect(url?: string | null): boolean {
  if (!url) return false;
  // Prevent double slash (//) or slash-backslash (/\) which can bypass host validation
  return /^\/(?![/\\])/.test(url);
}

/**
 * Gets a safe redirect URL, falling back to a default if the provided URL is unsafe.
 */
export function getSafeRedirect(url?: string | null, fallback = '/library'): string {
  return isValidRedirect(url) ? url! : fallback;
}
