import { NextResponse } from 'next/server';
import type { z } from 'zod';

/**
 * Shared request-contract helpers (E3/E4): every route should validate its
 * body through a zod schema via `parseJsonBody`, and return failures in the
 * consistent `{ error }` shape with the correct status code.
 */

type ZodSchema<T> = z.ZodType<T>;

export type ParsedBody<T> = { ok: true; data: T } | { ok: false; error: string };

/** Parse + validate a JSON request body against a zod contract. */
export async function parseJsonBody<T>(schema: ZodSchema<T>, req: Request): Promise<ParsedBody<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, error: 'Invalid JSON body' };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid request body' };
  }
  return { ok: true, data: result.data };
}

/** Consistent 400 response. */
export function badRequest(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 });
}
