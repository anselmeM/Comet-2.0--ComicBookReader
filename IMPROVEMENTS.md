# Comet 2.0 — Comprehensive Codebase Audit & Improvement Roadmap

> **"The Speed of Light Comic Reader."**
> Master catalog of recommended architectural, ergonomic, performance, and feature improvements for the Comet PWA ecosystem.
> Generated: 2026-08-21

---

## Executive Summary

Comet has established a robust baseline for high-performance client-side comic extraction, offline-first IndexedDB persistence, DOM virtualization, and panel detection. 

This roadmap outlines prioritized enhancements across **5 core pillars**:
1. [Reader Engine & Visual Ergonomics](#1-reader-engine--visual-ergonomics)
2. [File Parsing, Formats & Offline PWA Architecture](#2-file-parsing-formats--offline-pwa-architecture)
3. [Library Organization, Series Stacking & Metadata](#3-library-organization-series-stacking--metadata)
4. [Gamification, Reading Analytics & Social Hub](#4-gamification-reading-analytics--social-hub)
5. [Performance, Security & Code Health](#5-performance-security--code-health)

---

## 1. Reader Engine & Visual Ergonomics

### 1.1 Double-Page Spread Splitter & Landscape Manga Detection
- **Current State**: `dual-spread` pairs consecutive portrait pages. Single wide-landscape images (two-page splash spreads scanned as one image with $W/H > 1.2$) are letterboxed.
- **Improvement**: 
  - Automatically detect when a single image is a 2-page landscape spread.
  - Offer automatic edge-to-edge full landscape expansion or an automatic virtual vertical slice (left half / right half) honoring reading direction (LTR for Western, RTL for Manga).
- **Target Files**: `src/lib/guidedView.ts`, `src/components/organisms/ComicReader/ComicReader.tsx`, `src/stores/readerStore.ts`.

### 1.2 Interactive Keyboard Shortcuts Cheat Sheet Modal (`?`)
- **Current State**: Reader listens to keybindings (`ArrowKeys`, `Space`, `J`, `G`, `F`, `B`, `+`, `-`, `0`), but shortcuts are undiscoverable without reading code.
- **Improvement**: 
  - Add global hotkey listener for `?` or `Shift + /` that opens an animated cheat sheet overlay displaying all active navigation, zoom, and display shortcuts.
- **Target Files**: `src/components/organisms/ReaderControls/ReaderControls.tsx`, `src/components/organisms/ReaderControls/KeyboardShortcutsModal.tsx`.

### 1.3 Tactile Haptic Vibration Feedback for Mobile PWA
- **Current State**: Mobile swipes and scrubber slider dragging produce visual transitions only.
- **Improvement**: 
  - Utilize `navigator.vibrate([12])` on mobile page turns, slider ticks, and bookmark toggles.
  - Add configurable toggle in `ReaderSettingsPanel.tsx` (*"Tactile Feedback / Haptics"*).
- **Target Files**: `src/components/organisms/ComicReader/ReaderViewport.tsx`, `src/components/organisms/ReaderControls/ReaderControls.tsx`.

### 1.4 End-of-Comic Completion Summary & Next Issue Autoload
- **Current State**: Reaching the final page terminates navigation.
- **Improvement**: 
  - Transition into an end-of-comic celebration card showing reading time, reading speed (pages per minute), and one-tap buttons to *"Mark as Read"*, *"Return to Library"*, or *"Read Next Issue (Issue #X+1)"*.
- **Target Files**: `src/components/organisms/ComicReader/ComicCompletionCard.tsx`, `src/components/organisms/ComicReader/ComicReader.tsx`.

### 1.5 Precision Magnifying Loupe / Inspection Lens
- **Current State**: Zooming scales the entire canvas viewport.
- **Improvement**: 
  - Add an optional interactive magnifying loupe tool (2.5x circular zoom bubble following mouse cursor / long-press touch) to inspect small text bubbles or intricate background artwork without panning the entire viewport.
- **Target Files**: `src/components/organisms/ComicReader/ReaderViewport.tsx`, `src/stores/readerStore.ts`.

---

## 2. File Parsing, Formats & Offline PWA Architecture

### 2.1 PDF & EPUB Comic Parser Worker Integration
- **Current State**: Web worker parses `.cbz` (via JSZip) and `.cbr` (via node-unrar-js WASM). `.pdf` or image-based `.epub` comics cannot be loaded.
- **Improvement**: 
  - Integrate `pdfjs-dist` inside `comicParser.worker.ts` to render PDF pages into bitmaps off the main thread.
  - Extract image archives from `.epub` packaging.
- **Target Files**: `src/workers/comicParser.worker.ts`, `src/hooks/useComicParser.ts`.

### 2.2 Streaming Chunk Decompression for Massive Archives (>200MB)
- **Current State**: Entire file `ArrayBuffer` is read into memory before unzip/unrar starts.
- **Improvement**: 
  - Stream zip entries chunk-by-chunk to reduce peak RAM consumption on mobile devices during large omnibus imports.
- **Target Files**: `src/workers/comicParser.worker.ts`, `src/lib/idb.ts`.

### 2.3 Cross-Tab IndexedDB Cache Sync (BroadcastChannel)
- **Current State**: Multiple open browser tabs each track their own local memory states.
- **Improvement**: 
  - Implement a `BroadcastChannel('comet-idb-sync')` to notify other open tabs when a comic is pinned, deleted, or reading progress is updated.
- **Target Files**: `src/lib/idb.ts`, `src/hooks/useStorage.ts`.

### 2.4 Service Worker Background Sync Queue Resilience
- **Current State**: Offline progress is stored in IndexedDB `sync_tasks` table.
- **Improvement**: 
  - Add exponential backoff retry handler with online event listeners (`navigator.onLine` and `window.addEventListener('online')`) to ensure no reading progress sync payloads are dropped after reconnecting from offline flights/tunnels.
- **Target Files**: `src/lib/idb.ts`, `src/hooks/useReadingProgress.ts`.

---

## 3. Library Organization, Series Stacking & Metadata

### 3.1 Series Stacking & Hierarchical Volume Views
- **Current State**: Dashboard displays all comics in a flat grid sorted by date or title.
- **Improvement**: 
  - Group comics sharing the same `series` metadata into a single "Series Stack" folder card (e.g. *"Batman (2016) — 12 Issues"*).
  - Clicking opens an accordion or nested drawer showing issues ordered by issue number.
- **Target Files**: `src/components/organisms/Dashboard/views/DashboardView.tsx`, `src/components/molecules/DashboardComicCard.tsx`.

### 3.2 Dynamic Smart Collections
- **Current State**: User creates manual collections and assigns comics via drag-and-drop.
- **Improvement**: 
  - Add auto-updating Smart Collections:
    - *"Currently Reading"* (Progress $> 0\%$ and $< 100\%$)
    - *"Unread Issues"* (Progress $= 0\%$)
    - *"Completed"* (Progress $= 100\%$)
    - *"By Decade / Year"* (e.g. 90s Comics, Silver Age)
    - *"By Publisher / Artist"*
- **Target Files**: `src/components/organisms/Dashboard/views/CollectionsView.tsx`, `src/hooks/useCollections.ts`.

### 3.3 Multi-Select Batch Operations Toolbar
- **Current State**: Comics are managed one-by-one.
- **Improvement**: 
  - Add multi-select checkboxes on comic cards in Library view with a sticky bottom action bar:
    - *Batch Pin for Offline*
    - *Batch Add to Collection*
    - *Batch Re-Enrich with ComicVine*
    - *Batch Delete from Library*
- **Target Files**: `src/components/organisms/Dashboard/views/DashboardView.tsx`, `src/components/molecules/DashboardComicCard.tsx`.

### 3.4 ComicVine Disambiguation & Manual Match Picker
- **Current State**: ComicVine enrichment performs automatic top-match lookup.
- **Improvement**: 
  - When auto-match confidence is low or title matches multiple series, open a search dialog showing top 5 search candidates with thumbnails and release years for 1-click user selection.
- **Target Files**: `src/components/organisms/Dashboard/views/MetadataModal.tsx`, `src/app/api/comics/search-metadata/route.ts`.

---

## 4. Gamification, Reading Analytics & Social Hub

### 4.1 GitHub-Style Reading Heatmap Calendar & Goals
- **Current State**: `readingStreak` integer is tracked on the `User` model.
- **Improvement**: 
  - Render an interactive year-long heatmap grid (similar to GitHub contribution graph) showing days read and volume of pages consumed.
  - Set customizable reading goals (e.g. *"Read 50 pages per week"*).
- **Target Files**: `src/components/organisms/SettingsPanel/ProfileSection.tsx`, `src/app/(app)/settings/achievements/page.tsx`.

### 4.2 Reading Speed & Session Statistics (PPM Analytics)
- **Current State**: Reading progress stores total seconds spent.
- **Improvement**: 
  - Calculate and display average reading pace (pages per minute), estimated time remaining for current issue, and total lifetime reading time.
- **Target Files**: `src/components/organisms/ReaderControls/ReaderControls.tsx`, `src/hooks/useReadingProgress.ts`.

### 4.3 Canvas Social Share Cards
- **Current State**: Community feed shares simple text notifications.
- **Improvement**: 
  - Generate a downloadable/shareable high-res graphic badge when completing a series or milestone: cover art + user avatar + reading time + rating.
- **Target Files**: `src/components/organisms/Dashboard/views/friends/CommunityFeed.tsx`.

---

## 5. Performance, Security & Code Health

### 5.1 End-to-End Playwright Test Matrix
- **Current State**: Comprehensive Vitest unit tests (72 tests passing).
- **Improvement**: 
  - Add Playwright E2E browser tests covering:
    - PWA offline mode reading flow (simulating `navigator.onLine = false`).
    - Drag-and-drop CBZ upload and worker extraction verification.
    - Touch swipe gesture page turn simulation on mobile viewports.
- **Target Files**: `e2e/reader.spec.ts`, `e2e/offline.spec.ts`.

### 5.2 Server Action & API Zod Input Validation Hardening
- **Current State**: API endpoints validate body payloads manually or with partial types.
- **Improvement**: 
  - Enforce strict `zod` schema parsing for all `/api/collections`, `/api/bookmarks`, `/api/comics/:id/progress` and Server Actions.
- **Target Files**: `src/app/api/comics/[id]/progress/route.ts`, `src/app/api/collections/route.ts`.

### 5.3 WebAssembly Image Transcoder Optimization
- **Current State**: Stored blobs are raw extracted JPEG/PNG bitmaps.
- **Improvement**: 
  - Optional client-side WebP compression pipeline to reduce IndexedDB storage footprint by 35–50% without visible quality loss.
- **Target Files**: `src/workers/comicParser.worker.ts`, `src/lib/idb.ts`.

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---|---|---|---|
| **Interactive Keyboard Shortcuts Modal (`?`)** | High | Low | **P0 (Immediate)** |
| **End-of-Comic Summary & Next Issue Autoload** | High | Medium | **P0 (Immediate)** |
| **Double-Page Landscape Auto-Detection & Splitter** | High | Medium | **P1 (High)** |
| **Tactile Haptic Feedback for Mobile PWA** | Medium | Low | **P1 (High)** |
| **Series Stacking & Hierarchical Volume Views** | High | Medium | **P1 (High)** |
| **Dynamic Smart Collections (Unread/In-Progress)** | High | Medium | **P1 (High)** |
| **Multi-Select Batch Operations Toolbar** | High | Medium | **P2 (Medium)** |
| **Reading Heatmap Calendar & Goals** | Medium | Medium | **P2 (Medium)** |
| **PDF & EPUB Worker Parser Integration** | High | High | **P2 (Medium)** |
| **Playwright PWA Offline E2E Tests** | High | Medium | **P2 (Medium)** |
