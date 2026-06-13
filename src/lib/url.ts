/**
 * Checks if a given URL string is a safe local redirect.
 * A safe local redirect must start with a single `/` and not be followed by another `/` or `\`.
 *
 * @param url The URL to check.
 * @returns True if the URL is a safe local redirect, false otherwise.
 */
export function isValidRedirect(url: string | null | undefined): boolean {
  if (!url) return false;
  // Regex ensures it starts with exactly one slash, not followed by another slash or backslash
  return /^\/(?![/\\])/.test(url);
}

/**
 * Returns the provided URL if it's a safe local redirect, otherwise returns the default URL.
 *
 * @param url The URL to check.
 * @param defaultUrl The fallback URL if the provided URL is unsafe (defaults to '/').
 * @returns A safe local redirect URL.
 */
export function getSafeRedirect(url: string | null | undefined, defaultUrl: string = '/'): string {
  if (isValidRedirect(url)) {
    return url as string;
  }
  return defaultUrl;
}
