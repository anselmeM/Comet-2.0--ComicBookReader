export function getSafeRedirect(url: string, defaultPath: string = "/library"): string {
  if (!url) return defaultPath;
  if (url.startsWith("http://") || url.startsWith("https://")) return defaultPath;
  if (!/^\/(?![/\\])/.test(url)) return defaultPath;
  return url;
}
