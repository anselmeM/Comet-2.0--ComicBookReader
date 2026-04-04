'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  LayoutDashboard,
  Library,
  Bookmark,
  Clock,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Star,
  Grid,
  List,
  Filter,
  UploadCloud,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { useNotification } from '@/components/atoms/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavorites } from '@/hooks/useFavorites';

// Types
export interface DashboardComic {
  id: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  pageCount: number;
  year?: number | null;
  issue?: number | null;
  progress?: {
    lastPage: number;
    totalPages: number;
  } | null;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  comics: DashboardComic[];
  onComicUpload?: (comic: DashboardComic) => void;
  onFileSelect?: (file: File) => Promise<void>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
}

// Navigation Items
const navItems = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard', view: 'dashboard' },
  { icon: <Library size={20} />, label: 'My Collection', view: 'collection' },
  { icon: <Bookmark size={20} />, label: 'Favourites', view: 'favourites' },
  { icon: <Clock size={20} />, label: 'Coming Soon', view: 'comingsoon' },
  { icon: <Users size={20} />, label: 'Friends', view: 'friends' },
];

const bottomNavItems = [
  { icon: <Settings size={20} />, label: 'Settings', view: 'settings' },
  { icon: <LogOut size={20} />, label: 'Log out', view: 'logout' },
];

// Top Rated Comics - uses user's actual library
const useTopRatedComics = (comics: DashboardComic[]) => {
  return useMemo(() => {
    // If user has comics, use the first few as "featured" (until rating is implemented)
    if (comics.length > 0) {
      return comics.slice(0, 8).map(comic => ({
        ...comic,
        author: comic.author || 'Unknown'
      }));
    }

    // Return empty array when no user comics
    return [] as (DashboardComic & { author: string })[];
  }, [comics]);
};

// Sortable DashboardComic Card Component
function SortableDashboardComicCard({ comic, isDragging, onNotification, isFav, onToggleFav }: { comic: DashboardComic; isDragging?: boolean; onNotification?: (msg: string) => void; isFav?: boolean; onToggleFav?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentDragging,
  } = useSortable({ id: comic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const progressPercent = comic.progress
    ? (comic.progress.lastPage / comic.progress.totalPages) * 100
    : 0;

  const handleClick = () => {
    onNotification?.(`Opening "${comic.title}"...`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFav?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col bg-neutral-900 rounded-2xl overflow-hidden shadow-lg border border-neutral-800 transition-all cursor-pointer ${
        isCurrentDragging ? 'opacity-50 scale-105 z-50' : 'hover:border-neutral-700 hover:shadow-xl hover:-translate-y-1'
      }`}
      onClick={handleClick}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-20 p-1.5 bg-black/50 rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} className="text-white" />
      </div>

      {/* Favorite Button */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-2 right-2 z-20 p-1.5 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
        onMouseEnter={(e) => e.currentTarget.classList.remove('opacity-0')}
        title={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        <Star
          size={16}
          className={`${isFav ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`}
        />
      </button>

      <Link href={`/reader/${comic.id}`} className="block relative aspect-[2/3] bg-neutral-800 w-full overflow-hidden">
        {comic.coverUrl ? (
          <img
            src={comic.coverUrl}
            alt={comic.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
            <Library size={48} strokeWidth={1} />
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-neutral-900/50">
          <div
            className="h-full bg-blue-500 rounded-r-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Link>

      <div className="p-4 flex flex-col gap-1">
        <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight" title={comic.title}>
          {comic.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>{comic.pageCount} pages</span>
        </div>
      </div>
    </div>
  );
}

// Circular Progress Component
function CircularProgress({ progress }: { progress: number }) {
  const radius = 28;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/20" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          className="text-blue-400 drop-shadow-md"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-white font-bold text-sm">{Math.round(progress)}%</span>
    </div>
  );
}

// Placeholder view components
function CollectionPlaceholder({ searchQuery }: { searchQuery: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-12 bg-gray-50 rounded-3xl border border-gray-100 text-gray-500"
    >
      <Library size={48} className="mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium text-gray-700 mb-2">
        {searchQuery ? `No comics matching "${searchQuery}"` : 'Your collection is empty'}
      </p>
      <p className="text-sm">Upload some comics to get started!</p>
    </motion.div>
  );
}

function FavouritesPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-12 bg-gray-50 rounded-3xl border border-gray-100"
    >
      <Bookmark size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
      <p className="text-lg font-medium text-gray-700 mb-2">No favorites yet</p>
      <p className="text-sm text-gray-500">Bookmark comics to see them here</p>
    </motion.div>
  );
}

function ComingSoonPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-12 bg-gray-50 rounded-3xl border border-gray-100"
    >
      <Clock size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
      <p className="text-lg font-medium text-gray-700 mb-2">Coming Soon</p>
      <p className="text-sm text-gray-500">Check back later for new releases</p>
    </motion.div>
  );
}

function FriendsPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-12 bg-gray-50 rounded-3xl border border-gray-100"
    >
      <Users size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
      <p className="text-lg font-medium text-gray-700 mb-2">No friends yet</p>
      <p className="text-sm text-gray-500">Connect with other comic readers</p>
    </motion.div>
  );
}

function TopRatedCard({ comic, onNotification }: { comic: DashboardComic & { author: string }; onNotification?: (msg: string) => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onNotification?.(`Opening "${comic.title}" by ${comic.author}...`)}
      className="group relative bg-white rounded-2xl p-4 shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all"
    >
      <div className="flex gap-4">
        <div className="w-20 h-28 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
          {comic.coverUrl ? (
            <img src={comic.coverUrl} alt={comic.title} className="w-full h-full object-cover" />
          ) : (
            <Star className="w-8 h-8 opacity-50" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-yellow-600 font-medium">Top Rated</span>
          </div>
          <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{comic.title}</h4>
          <p className="text-xs text-gray-500">{comic.author}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{comic.year}</span>
            <span className="text-xs text-gray-400">{comic.pageCount} pages</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Main Dashboard Layout Component
export function DashboardLayout({
  children,
  comics: initialDashboardComics,
  onComicUpload,
  onFileSelect,
  pagination,
  onPageChange
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [comics, setDashboardComics] = useState<DashboardComic[]>(initialDashboardComics);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Update local comics state when initialDashboardComics prop changes (after upload)
  useEffect(() => {
    setDashboardComics(initialDashboardComics);
  }, [initialDashboardComics]);

  // Debounce search to avoid excessive filtering during typing
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Reading status filter state
  type ReadingStatus = 'all' | 'favourites' | 'unread' | 'in_progress' | 'completed';
  const [statusFilter, setStatusFilter] = useState<ReadingStatus>('all');

  // Sort state
  type SortOption = 'recent' | 'title_asc' | 'progress' | 'added';
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // View mode state for series grouping
  type ViewMode = 'grid' | 'series';
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Favorites filter state
  type FavoritesFilter = 'all' | 'favourites';
  const [favoritesFilter, setFavoritesFilter] = useState<FavoritesFilter>('all');

  // Get favorites from context
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  // Group comics by series
  const seriesGroups = useMemo(() => {
    const groups: Map<string, DashboardComic[]> = new Map();

    comics.forEach(comic => {
      const seriesName = comic.issue ? `${comic.title} #${comic.issue}` : comic.title;
      if (!groups.has(seriesName)) {
        groups.set(seriesName, []);
      }
      groups.get(seriesName)!.push(comic);
    });

    return Array.from(groups.entries()).map(([name, comics]) => ({
      name,
      comics,
      coverUrl: comics[0]?.coverUrl || null
    }));
  }, [comics]);

  // Top Rated Comics - user's actual library
  const topRatedComics = useTopRatedComics(comics);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Get notification function from context
  const { triggerNotification } = useNotification();

  // Get session for user info
  const { data: session } = useSession();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setDashboardComics((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      triggerNotification('Comic order updated');
    }
  };

  // File upload handlers
  const ALLOWED_EXTENSIONS = ['.cbz', '.cbr', '.pdf'];
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

  const validateFile = (file: File): string | null => {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: 500MB`;
    }
    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploadError(null);
    setUploadProgress(0);
    setIsUploading(true);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      triggerNotification(validationError, 'error');
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      triggerNotification(`Uploading "${file.name}"...`, 'info');

      // If parent provides file selection handler, use it
      if (onFileSelect) {
        // Show uploading state
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 85) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 5;
          });
        }, 150);

        await onFileSelect(file);

        // Clear the progress interval and set to complete
        clearInterval(progressInterval);
        setUploadProgress(100);

        // Wait a brief moment for the library to refetch and state to update
        await new Promise(resolve => setTimeout(resolve, 300));

        triggerNotification(`"${file.name}" added to library!`, 'success');
        setIsUploading(false);
      } else {
        // Simulate progress for demo (in real implementation, this would come from the parser)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 200);

        // Create temporary comic entry for display
        const newComic: DashboardComic = {
          id: `upload-${Date.now()}`,
          title: file.name.replace(/\.(cbz|cbr|pdf)$/i, ''),
          author: undefined,
          coverUrl: undefined,
          pageCount: 0,
          year: undefined,
          issue: undefined,
          progress: undefined
        };

        // Add to local state
        setDashboardComics(prev => [newComic, ...prev]);

        // Call callback if provided
        if (onComicUpload) {
          onComicUpload(newComic);
        }

        clearInterval(progressInterval);
        setTimeout(() => {
          setUploadProgress(100);
          triggerNotification(`"${file.name}" added to library!`, 'success');
        }, 500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      triggerNotification(errorMessage, 'error');
      setIsUploading(false);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Filter and sort comics in collection
  const sortedAndFilteredComics = useMemo(() => {
    let result = [...comics];

    // Apply search filter
    if (debouncedSearch) {
      result = result.filter(comic =>
        comic.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (comic.author && comic.author.toLowerCase().includes(debouncedSearch.toLowerCase()))
      );
    }

    // Apply favorites filter
    if (favoritesFilter === 'favourites') {
      result = result.filter(comic => isFavorite(comic.id));
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(comic => {
        if (!comic.progress) return statusFilter === 'unread';
        const progressPercent = (comic.progress.lastPage / comic.progress.totalPages) * 100;

        if (statusFilter === 'unread') return progressPercent === 0;
        if (statusFilter === 'in_progress') return progressPercent > 0 && progressPercent < 100;
        if (statusFilter === 'completed') return progressPercent === 100;
        return true;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'title_asc':
        return result.sort((a, b) => a.title.localeCompare(b.title));
      case 'progress':
        return result.sort((a, b) => {
          const aProgress = a.progress ? a.progress.lastPage / a.progress.totalPages : 0;
          const bProgress = b.progress ? b.progress.lastPage / b.progress.totalPages : 0;
          return bProgress - aProgress;
        });
      case 'added':
        return result;
      case 'recent':
      default:
        return result;
    }
  }, [comics, debouncedSearch, statusFilter, sortBy, favoritesFilter, isFavorite]);

  // Filter Top Rated Comics by title AND author using useMemo
  const filteredTopRated = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    return topRatedComics.filter(comic =>
      comic.title.toLowerCase().includes(query) ||
      comic.author.toLowerCase().includes(query)
    );
  }, [debouncedSearch]);

  // Featured comic
  const featuredDashboardComic = comics.find(c => c.progress && c.progress.lastPage > 0) || comics[0];
  const continueReadingProgress = featuredDashboardComic?.progress
    ? (featuredDashboardComic.progress.lastPage / featuredDashboardComic.progress.totalPages) * 100
    : 76;

  const handleNavClick = async (view: string) => {
    if (view === 'logout') {
      // Use next-auth/react signOut which clears the session client-side
      await nextAuthSignOut({ callbackUrl: '/login' });
      return;
    }
    setActiveView(view);
    triggerNotification(`Navigated to ${view === 'dashboard' ? 'Dashboard' : view}`);
  };

  // Render appropriate content based on active view
  const renderContent = () => {
    if (activeView === 'dashboard') {
      // Dashboard view with all widgets
      return (
        <>
          {/* Top Section (Featured & Side Info) */}
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8 mb-8 md:mb-10">

            {/* Featured Banner */}
            {featuredDashboardComic && (
              <div
                className="flex-[2] relative rounded-[2rem] overflow-hidden group cursor-pointer min-h-[200px] md:min-h-[300px]"
                onClick={() => triggerNotification(`Opening featured comic: ${featuredDashboardComic.title}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-900 to-red-700">
                  {featuredDashboardComic.coverUrl ? (
                    <img
                      src={featuredDashboardComic.coverUrl}
                      alt={featuredDashboardComic.title}
                      className="w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-900 to-red-700" />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex justify-between items-end">
                  <div className="text-white max-w-md">
                    <p className="text-sm font-medium text-gray-300 mb-2">Featured Comic</p>
                    <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-2">
                      {featuredDashboardComic.title}
                    </h2>
                    {featuredDashboardComic.author && (
                      <p className="text-sm text-gray-300">by {featuredDashboardComic.author}</p>
                    )}
                  </div>
                  <Link
                    href={`/reader/${featuredDashboardComic.id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 md:px-8 py-3 md:py-3.5 rounded-full font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95 text-sm md:text-base"
                  >
                    Read Now
                  </Link>
                </div>
              </div>
            )}

            {/* Right Column (Continue Reading & Heroes) */}
            <div className="flex-1 flex flex-col gap-6 md:gap-8">

              {/* Continue Reading Card */}
              <div>
                <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-900">Continue Reading</h3>
                {featuredDashboardComic ? (
                  <div
                    className="relative h-32 md:h-40 rounded-3xl overflow-hidden group cursor-pointer"
                    onClick={() => triggerNotification(`Continuing: ${featuredDashboardComic.title}`)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700">
                      {featuredDashboardComic.coverUrl && (
                        <img
                          src={featuredDashboardComic.coverUrl}
                          alt={featuredDashboardComic.title}
                          className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-between">
                      <h4 className="text-white font-bold text-sm md:text-lg leading-tight w-2/3 line-clamp-2">
                        {featuredDashboardComic.title}
                      </h4>

                      <CircularProgress progress={continueReadingProgress} />
                    </div>
                  </div>
                ) : (
                  <div className="h-32 md:h-40 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                    No comics in progress
                  </div>
                )}
              </div>

              {/* Favourite Heroes */}
              <div>
                <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-900">Your Favourite Heroes</h3>
                <div className="flex justify-between items-center px-2">
                  {[
                    { id: 1, name: 'Spider-Man', bg: 'bg-red-500', icon: '🕷️' },
                    { id: 2, name: 'Hulk', bg: 'bg-green-500', icon: '💪' },
                    { id: 3, name: 'Black Widow', bg: 'bg-purple-600', icon: '🕷️' },
                    { id: 4, name: 'Iron Man', bg: 'bg-yellow-400', icon: '🤖' },
                  ].map((hero) => (
                    <div
                      key={hero.id}
                      className="relative group cursor-pointer"
                      onClick={() => triggerNotification(`Selected: ${hero.name}`)}
                    >
                      <div className={`w-12 md:w-16 h-12 md:h-16 rounded-full ${hero.bg} shadow-lg flex items-center justify-center text-2xl md:text-3xl transition-transform group-hover:-translate-y-1`}>
                        {hero.icon}
                      </div>
                      <div className="absolute -inset-2 bg-gradient-to-t from-black/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Top Rated Comics Section */}
          <div className="mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Star size={20} className="text-yellow-400 fill-yellow-400" />
                Top Rated Comics
              </h3>
            </div>

            {filteredTopRated.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredTopRated.map((comic) => (
                  <TopRatedCard key={comic.id} comic={comic} onNotification={triggerNotification} />
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center p-8 bg-gray-50 rounded-2xl">
                <Star size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No top rated comics match your search</p>
              </div>
            ) : null}
          </div>

          {/* My Collection Grid */}
          <div>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">My Collection</h3>
              {sortedAndFilteredComics.length > 0 && (
                <span className="text-sm text-gray-500">
                  {sortedAndFilteredComics.length} comics {view === 'list' ? 'in list' : 'in grid'}
                </span>
              )}
            </div>

            {sortedAndFilteredComics.length > 0 ? (
              view === 'list' ? (
                /* List View */
                <div className="space-y-3">
                  {sortedAndFilteredComics.map((comic) => (
                    <div
                      key={comic.id}
                      className="flex items-center gap-4 p-3 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors"
                    >
                      <Link href={`/reader/${comic.id}`} className="w-16 h-24 bg-neutral-800 rounded-lg overflow-hidden shrink-0">
                        {comic.coverUrl ? (
                          <img src={comic.coverUrl} alt={comic.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600">
                            <Library size={24} />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{comic.title}</h4>
                        <p className="text-sm text-neutral-400">{comic.pageCount} pages</p>
                        {comic.progress && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(comic.progress.lastPage / comic.progress.totalPages) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-neutral-400">{Math.round((comic.progress.lastPage / comic.progress.totalPages) * 100)}%</span>
                          </div>
                        )}
                      </div>
                      <button className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg cursor-grab">
                        <GripVertical size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Grid View */
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedAndFilteredComics.map(c => c.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-6">
                      {sortedAndFilteredComics.map((comic) => (
                        <SortableDashboardComicCard
                          key={comic.id}
                          comic={comic}
                          onNotification={triggerNotification}
                          isFav={isFavorite(comic.id)}
                          onToggleFav={() => toggleFavorite(comic.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )
            ) : (
              <CollectionPlaceholder searchQuery={searchQuery} />
            )}
          </div>
        </>
      );
    }

    // Other views - unmount dashboard and show placeholder
    switch (activeView) {
      case 'collection':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Collection</h2>
            {sortedAndFilteredComics.length > 0 ? (
              viewMode === 'series' ? (
                // Series/Grouped view
                <div className="space-y-8">
                  {seriesGroups.map((group) => (
                    <div key={group.name} className="border-b border-gray-200 pb-6">
                      <h3 className="text-xl font-semibold mb-4 text-gray-800">{group.name}</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {group.comics.map((comic) => (
                          <SortableDashboardComicCard
                            key={comic.id}
                            comic={comic}
                            onNotification={triggerNotification}
                            isFav={isFavorite(comic.id)}
                            onToggleFav={() => toggleFavorite(comic.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Grid view (default)
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {sortedAndFilteredComics.map((comic) => (
                    <SortableDashboardComicCard
                      key={comic.id}
                      comic={comic}
                      onNotification={triggerNotification}
                      isFav={isFavorite(comic.id)}
                      onToggleFav={() => toggleFavorite(comic.id)}
                    />
                  ))}
                </div>
              )
            ) : (
              <CollectionPlaceholder searchQuery={searchQuery} />
            )}
          </div>
        );
      case 'favourites':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Favourites</h2>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {comics.filter(comic => isFavorite(comic.id)).map((comic) => (
                  <SortableDashboardComicCard
                    key={comic.id}
                    comic={comic}
                    onNotification={triggerNotification}
                    isFav={true}
                    onToggleFav={() => toggleFavorite(comic.id)}
                  />
                ))}
              </div>
            ) : (
              <FavouritesPlaceholder />
            )}
          </div>
        );
      case 'comingsoon':
        return <ComingSoonPlaceholder />;
      case 'friends':
        return <FriendsPlaceholder />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 via-purple-200 to-pink-200 p-4 md:p-8 flex items-center justify-center font-sans text-gray-800">
      {/* Main Application Window */}
      <div className="bg-white w-full max-w-[1600px] h-[90vh] md:h-[850px] rounded-[2.5rem] shadow-2xl flex overflow-hidden">

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 256 : 80 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white flex flex-col py-8 border-r border-gray-100 relative overflow-hidden"
        >
            {/* Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute -right-3 top-8 z-10 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
            >
              {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            <div className={`px-10 mb-12 ${!isSidebarOpen ? 'hidden' : ''}`}>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">Comet</h1>
            </div>

            <nav className={`flex-1 px-6 space-y-2 ${!isSidebarOpen ? 'hidden' : ''}`}>
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavClick(item.view)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3 rounded-full font-medium transition-all
                    ${activeView === item.view
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className={`px-6 space-y-2 mt-auto ${!isSidebarOpen ? 'hidden' : ''}`}>
              {bottomNavItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavClick(item.view)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3 rounded-full font-medium transition-all
                    ${activeView === item.view
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Collapsed State Icons */}
            {!isSidebarOpen && (
              <div className="flex flex-col items-center gap-4 mt-auto px-2">
                {navItems.slice(0, 3).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavClick(item.view)}
                    className={`p-3 rounded-full transition-colors ${
                      activeView === item.view ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={item.label}
                  >
                    {item.icon}
                  </button>
                ))}
                <div className="w-8 h-px bg-gray-200 my-2" />
                <button
                  onClick={() => handleNavClick('settings')}
                  className={`p-3 rounded-full transition-colors ${
                    activeView === 'settings' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title="Settings"
                >
                  <Settings size={20} />
                </button>
              </div>
            )}
        </motion.aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">

          {/* Header */}
          <header className="h-20 md:h-24 px-6 md:px-10 flex items-center justify-between shrink-0">
            <div className="relative group flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 group-hover:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search comics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-0 group-hover:w-48 md:group-hover:w-64 bg-gray-50 border border-gray-100 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:w-48 md:focus:w-64 transition-all duration-300 ease-in-out placeholder:text-transparent group-hover:placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReadingStatus)}
                className="bg-gray-50 border border-gray-200 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option value="all">All Comics</option>
                <option value="favourites">Favourites Only</option>
                <option value="unread">Unread</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-gray-50 border border-gray-200 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option value="recent">Recently Read</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="progress">Reading Progress</option>
                <option value="added">Date Added</option>
              </select>

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => pagination.page > 1 && onPageChange?.(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs text-gray-500 px-2">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => pagination.page < pagination.totalPages && onPageChange?.(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  isUploading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Upload</span>
                  </>
                )}
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".cbz,.cbr,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* View Toggle */}
              <button
                onClick={() => {
                  const newView = view === 'grid' ? 'list' : 'grid';
                  setView(newView);
                  triggerNotification(`Switched to ${newView === 'list' ? 'list' : 'grid'} view`, 'info', { label: 'Undo', onClick: () => setView(view) }, 2000);
                }}
                className={`p-2 rounded-full transition-colors ${view === 'list' ? 'text-blue-500 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                title={view === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              >
                {view === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>

              {/* Series View Toggle */}
              <button
                onClick={() => {
                  setViewMode(viewMode === 'grid' ? 'series' : 'grid');
                  triggerNotification(`Switched to ${viewMode === 'grid' ? 'series' : 'grid'} view`, 'info', { label: 'Undo', onClick: () => setViewMode(viewMode) }, 2000);
                }}
                className={`p-2 rounded-full transition-colors ${viewMode === 'series' ? 'text-blue-500 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                title={viewMode === 'grid' ? 'Group by series' : 'Show all comics'}
              >
                <Library size={20} />
              </button>

              {/* Advanced Filter Button */}
              <button
                onClick={() => triggerNotification(
                  statusFilter !== 'all'
                    ? `Active filter: ${statusFilter.replace('_', ' ')} - Click dropdown to change`
                    : 'No filters active - Use dropdown to filter',
                  statusFilter !== 'all' ? 'info' : 'success',
                  statusFilter !== 'all'
                    ? { label: 'Clear Filter', onClick: () => setStatusFilter('all') }
                    : undefined,
                  3000
                )}
                className={`p-2 rounded-full transition-colors ${statusFilter !== 'all' ? 'text-blue-500 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                title="Filter"
              >
                <Filter size={20} />
              </button>

              <button
                onClick={() => triggerNotification('No new notifications')}
                className="text-gray-600 hover:text-gray-900 transition-colors relative"
              >
                <Bell size={22} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 cursor-pointer ml-2">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                    onClick={() => triggerNotification('Profile menu opened')}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold"
                    onClick={() => triggerNotification('Profile menu opened')}
                  >
                    {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden md:inline">
                  {session?.user?.name || 'User'}
                </span>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;