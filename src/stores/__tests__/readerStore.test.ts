import { describe, it, expect, beforeEach } from 'vitest';
import { useReaderStore } from '../readerStore';

describe('readerStore', () => {
  beforeEach(() => {
    const { closeComic } = useReaderStore.getState();
    closeComic(); // Reset state
  });

  it('initializes with default values', () => {
    const state = useReaderStore.getState();
    expect(state.mode).toBe('single-page');
    expect(state.currentPage).toBe(0);
    expect(state.isMenuVisible).toBe(false);
  });

  it('opens a comic and sets total pages', () => {
    const { openComic } = useReaderStore.getState();
    openComic('test-id', 10);
    
    const state = useReaderStore.getState();
    expect(state.currentComicId).toBe('test-id');
    expect(state.totalPages).toBe(10);
  });

  it('navigates forward in single-page mode', () => {
    const { openComic, nextPage } = useReaderStore.getState();
    openComic('test-id', 10);
    
    nextPage();
    expect(useReaderStore.getState().currentPage).toBe(1);
    
    nextPage();
    expect(useReaderStore.getState().currentPage).toBe(2);
  });

  it('navigates forward in dual-spread mode correctly', () => {
    const { openComic, setMode, nextPage } = useReaderStore.getState();
    openComic('test-id', 10);
    setMode('dual-spread');
    
    // Page 0 (Cover) is single
    nextPage();
    expect(useReaderStore.getState().currentPage).toBe(1);
    
    // Now at Page 1, next jump should be 2 pages to Page 3 (showing 3+4)
    nextPage();
    expect(useReaderStore.getState().currentPage).toBe(3);
    
    nextPage();
    expect(useReaderStore.getState().currentPage).toBe(5);
  });

  it('navigates backward in dual-spread mode correctly', () => {
    const { openComic, setMode, setPage, prevPage } = useReaderStore.getState();
    openComic('test-id', 10);
    setMode('dual-spread');

    setPage(5);
    prevPage();
    expect(useReaderStore.getState().currentPage).toBe(3);

    prevPage();
    expect(useReaderStore.getState().currentPage).toBe(1);

    prevPage();
    expect(useReaderStore.getState().currentPage).toBe(0);
  });

  it('normalizes even page index to spread leader in dual-spread and manga-rtl', () => {
    const { openComic, setMode, setPage, nextPage, prevPage } = useReaderStore.getState();
    openComic('test-id', 10);
    setMode('dual-spread');

    // Setting page to 2 (even) should normalize to 1 (spread 1&2 leader)
    setPage(2);
    expect(useReaderStore.getState().currentPage).toBe(1);

    // Setting page to 4 should normalize to 3 (spread 3&4 leader)
    setPage(4);
    expect(useReaderStore.getState().currentPage).toBe(3);

    // Navigating backward from 3 goes to 1
    prevPage();
    expect(useReaderStore.getState().currentPage).toBe(1);

    // Navigating forward from 1 goes to 3
    nextPage();
    expect(useReaderStore.getState().currentPage).toBe(3);
  });

  it('handles odd total page count in dual-spread mode without getting stuck', () => {
    const { openComic, setMode, setPage, nextPage, prevPage } = useReaderStore.getState();
    // Comic with 5 pages (indices 0, 1, 2, 3, 4)
    openComic('test-odd', 5);
    setMode('dual-spread');

    expect(useReaderStore.getState().currentPage).toBe(0);

    nextPage(); // to spread 1&2 (leader 1)
    expect(useReaderStore.getState().currentPage).toBe(1);

    nextPage(); // to spread 3&4 (leader 3)
    expect(useReaderStore.getState().currentPage).toBe(3);

    nextPage(); // cannot go further as 3+2=5 >= 5
    expect(useReaderStore.getState().currentPage).toBe(3);

    prevPage(); // back to spread 1&2 (leader 1)
    expect(useReaderStore.getState().currentPage).toBe(1);

    prevPage(); // back to cover 0
    expect(useReaderStore.getState().currentPage).toBe(0);
  });

  it('does not navigate beyond boundaries', () => {
    const { openComic, nextPage, prevPage } = useReaderStore.getState();
    openComic('test-id', 2);

    prevPage();
    expect(useReaderStore.getState().currentPage).toBe(0);

    nextPage(); // to 1
    nextPage(); // stay at 1
    expect(useReaderStore.getState().currentPage).toBe(1);
  });
});
