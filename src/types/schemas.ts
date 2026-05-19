import { z } from 'zod';

/**
 * @file Shared Zod Schemas (API Contracts)
 * Used for both runtime validation and type inference.
 */

// --- Base Models ---

export const ReadingProgressSchema = z.object({
  lastPage: z.number().int().min(0),
  totalPages: z.number().int().min(1),
  zoomLevel: z.number().optional().default(1.0),
  readStatus: z.enum(['UNREAD', 'READING', 'COMPLETED']).optional(),
  timeDelta: z.number().int().min(0).optional(),
});

export const ComicDTOSchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  author: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  pageCount: z.number().int(),
  year: z.number().int().nullable().optional(),
  series: z.string().nullable().optional(),
  isFavorite: z.boolean().default(false),
  rating: z.number().int().min(0).max(5).default(0),
  syncStatus: z.enum(['LOCAL', 'PENDING', 'SYNCED', 'ERROR']).default('LOCAL'),
  filehash: z.string().optional(),
  sizeBytes: z.number().int().optional(),
  progress: ReadingProgressSchema.nullable().optional(),
  addedAt: z.string().or(z.date()),
});

// --- Request Payloads ---

export const UpdateProgressRequestSchema = ReadingProgressSchema;

export const UpdateComicRequestSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().optional(),
  isFavorite: z.boolean().optional(),
  rating: z.number().int().min(0).max(5).optional(),
  series: z.string().optional(),
  issue: z.number().int().optional(),
  year: z.number().int().optional(),
  tags: z.string().optional(),
});

// --- Response DTOs ---

export const PaginatedLibraryResponseSchema = z.object({
  data: z.array(ComicDTOSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// --- Inferred Types ---
export type ReadingProgressDTO = z.infer<typeof ReadingProgressSchema>;
export type ComicDTO = z.infer<typeof ComicDTOSchema>;
export type PaginatedLibraryResponseDTO = z.infer<typeof PaginatedLibraryResponseSchema>;
