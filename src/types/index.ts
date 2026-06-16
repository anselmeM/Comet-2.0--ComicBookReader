/**
 * @file Shared TypeScript types for Comet
 * All agent-generated code must reference types from here rather than inline definitions.
 */

// ────────────────────────────────────────────────────
// Reading Modes
// ────────────────────────────────────────────────────

/** The 4 reading modes supported by ComicReader */
export type ReaderMode =
  | 'single-vertical' // Mobile: 1 page, scroll down
  | 'dual-spread' // Desktop ≥1024px: 2 pages side-by-side
  | 'manga-rtl' // User toggle: 2-page spread, RTL order
  | 'guided-view'; // User toggle: auto-zoom between detected panels

// ────────────────────────────────────────────────────
// Guided View / Panel Detection
// ────────────────────────────────────────────────────

/** A detected panel boundary in a comic page */
export interface Panel {
  /** X coordinate in pixels relative to original image */
  x: number;
  /** Y coordinate in pixels relative to original image */
  y: number;
  width: number;
  height: number;
}

// ────────────────────────────────────────────────────
// Comic / Library DTOs
// ────────────────────────────────────────────────────

/** A comic as returned from the /api/library endpoint */
export interface ComicDTO {
  id: string;
  title: string;
  filehash: string;
  pageCount: number;
  coverUrl: string | null;
  comicVineId: string | null;
  series: string | null;
  issue: number | null;
  year: number | null;
  addedAt: string; // ISO datetime string
  lastReadAt: string | null;
  isFavorite: boolean;
  rating: number;
  tags: string[] | null;
  storageKey: string | null;
  syncStatus: 'LOCAL' | 'PENDING' | 'SYNCED' | 'ERROR';
  progress: ReadingProgressDTO | null;
}

/** Reading progress as returned from the API */
export interface ReadingProgressDTO {
  lastPage: number;
  totalPages: number;
  zoomLevel: number;
  readStatus: 'UNREAD' | 'READING' | 'COMPLETED';
}

/** Payload sent when adding a comic to the library */
export interface AddComicPayload {
  title: string;
  filehash: string;
  pageCount: number;
  coverUrl?: string;
}

/** Payload sent when updating reading progress */
export interface UpdateProgressPayload {
  lastPage: number;
  totalPages: number;
  zoomLevel?: number;
  readStatus?: 'UNREAD' | 'READING' | 'COMPLETED';
  timeDelta?: number; // Time spent reading in seconds since last sync
}

// ────────────────────────────────────────────────────
// Web Worker Message Protocol
// ────────────────────────────────────────────────────

/** A single page's binary data and dimensions */
export interface ComicPage {
  blob: Blob;
  width: number;
  height: number;
}

/** Messages sent TO the comicParser worker */
export type WorkerInboundMessage = {
  type: 'PARSE';
  payload: { buffer: ArrayBuffer; filename: string };
};

/** Messages received FROM the comicParser worker */
export type WorkerOutboundMessage =
  | { type: 'PROGRESS'; page: number; total: number }
  | { type: 'DONE'; pages: ComicPage[] }
  | { type: 'ERROR'; error: string };

// ────────────────────────────────────────────────────
// IndexedDB / Cache
// ────────────────────────────────────────────────────

/** A cached comic entry stored in IndexedDB */
export interface CachedComic {
  comicId: string;
  title?: string; // Optional for backwards compatibility
  pages: ComicPage[]; // Array of page objects with dimensions
  coverUrl: string; // Cover image as ObjectURL or base64
  cachedAt: number; // Unix timestamp
  lastAccessedAt: number;
  sizeBytes: number;
}

// ────────────────────────────────────────────────────
// ComicVine API
// ────────────────────────────────────────────────────

/** Enrichment data returned from /api/comics/[id]/enrich */
export interface PaginatedLibraryResponse {
  data: ComicDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Enrichment data returned from /api/comics/[id]/enrich */
export interface SyncTask {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body: Record<string, unknown> | null;
  headers: Record<string, string>;
  timestamp: number;
  attempts: number;
}

export interface EnrichmentData {
  comicVineId: string;
  series: string | null;
  issue: number | null;
  year: number | null;
  description: string | null;
  coverUrl: string | null;
  characters: string[];
  publishers: string[];
}

export interface PaginatedLibraryResponseDTO {
  data: ComicDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
