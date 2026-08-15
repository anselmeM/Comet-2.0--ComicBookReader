/**
 * Safely extracts a message from an unknown caught value — `Error.message`
 * when possible, otherwise the stringified value. Use in catch blocks instead
 * of `err.message` (which requires `err: any`).
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
