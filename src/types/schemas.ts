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

  totalTimeSpent: z.number().int().optional(),

  lastReadAt: z.string().or(z.date()).nullable().optional(),
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

  rating: z.number().int().min(0).max(10).default(0),

  syncStatus: z.enum(['LOCAL', 'PENDING', 'SYNCED', 'ERROR']).default('LOCAL'),

  filehash: z.string().optional(),

  sizeBytes: z.number().int().optional(),

  progress: ReadingProgressSchema.nullable().optional(),

  addedAt: z.string().or(z.date()),
});

// --- Request Payloads ---

export const UpdateProgressRequestSchema = ReadingProgressSchema;

export const UpdateComicRequestSchema = z.object({
  title: z.string().min(1).max(255).optional(),

  series: z.string().max(255).optional().nullable(),

  issue: z

    .union([
      z.number().int(),

      z

        .string()

        .regex(/^\d+$/)

        .transform((val) => parseInt(val)),
    ])

    .optional()

    .nullable(),

  year: z

    .union([
      z.number().int(),

      z

        .string()

        .regex(/^\d+$/)

        .transform((val) => parseInt(val)),
    ])

    .optional()

    .nullable(),

  rating: z.number().int().min(0).max(10).optional(),

  tags: z

    .union([z.string(), z.array(z.string())])

    .optional()

    .nullable(),

  coverUrl: z.string().optional().nullable(),

  comicVineId: z.string().optional().nullable(),

  pageCount: z.number().int().min(0).optional(),

  sizeBytes: z.number().int().min(0).optional(),
});

export const CollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(50),

  description: z.string().max(200).optional(),
});

export const CollectionUpdateSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(50).optional(),

  description: z.string().max(200).optional(),
});

export const InviteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const SendMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000, 'Message is too long'),
});

export const FriendRequestActionSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE'], { message: 'Invalid action' }),
});

export const ReactToActivitySchema = z.object({
  activityId: z.string().min(1, 'activityId is required'),

  reactionType: z.enum(['FIRE', 'HEART', 'LIKE', 'TROPHY'], { message: 'Invalid reaction type' }),
});

export const PostCommentSchema = z.object({
  message: z.string().min(1, 'Message content is required').max(500, 'Comment is too long'),
});

export const UploadSchema = z.object({
  filehash: z.string().length(64),

  extension: z.enum(['cbz', 'cbr']),
});

export const ProfileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),

  image: z

    .string()

    .refine(
      (val) => {
        if (val === '') return true;

        // Accept base64 data URIs (from file upload)

        if (val.startsWith('data:image/')) return true;

        // Accept http/https URLs

        try {
          const parsed = new URL(val);

          return ['https:', 'http:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },

      { message: 'Must be a valid image URL or base64 data URI' },
    )

    .optional(),

  defaultReadingMode: z

    .enum(['single-page', 'single-vertical', 'dual-spread', 'manga-rtl'])

    .optional(),

  theme: z.enum(['dark', 'light', 'sepia']).optional(),
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
