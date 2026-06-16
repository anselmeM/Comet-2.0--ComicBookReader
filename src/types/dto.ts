/**
 * @file Data Transfer Objects (DTOs)
 *
 * Defines the contract between the server and the client.
 * Decouples the API from the database schema.
 */

export interface ReadingProgressDTO {
  lastPage: number;
  totalPages: number;
  zoomLevel: number;
  readStatus: 'UNREAD' | 'READING' | 'COMPLETED';
  totalTimeSpent?: number;
  lastReadAt?: string | null;
}

export interface ComicDTO {
  id: string;
  title: string;
  pageCount: number;
  coverUrl: string | null;
  series: string | null;
  issue: number | null;
  year: number | null;
  addedAt: string;
  lastReadAt: string | null;
  progress?: ReadingProgressDTO | null;
}

export interface LibraryResponseDTO {
  data: ComicDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Transformers to convert Prisma models to DTOs.
 */

export function mapProgressToDTO(progress: any | null): ReadingProgressDTO | null {
  if (!progress) return null;
  return {
    lastPage: progress.lastPage,
    totalPages: progress.totalPages,
    zoomLevel:
      typeof progress.zoomLevel === 'number'
        ? progress.zoomLevel
        : Number(progress.zoomLevel.toString()),
    readStatus: progress.readStatus as 'UNREAD' | 'READING' | 'COMPLETED',
    totalTimeSpent: progress.totalTimeSpent,
    lastReadAt: progress.lastReadAt ? progress.lastReadAt.toISOString() : null,
  };
}

export function mapComicToDTO(comic: any): ComicDTO {
  return {
    id: comic.id,
    title: comic.title,
    pageCount: comic.pageCount,
    coverUrl: comic.coverUrl,
    series: comic.series,
    issue: comic.issue,
    year: comic.year,
    addedAt: comic.addedAt.toISOString(),
    lastReadAt: comic.lastReadAt?.toISOString() ?? null,
    progress: mapProgressToDTO(comic.progress),
  };
}
