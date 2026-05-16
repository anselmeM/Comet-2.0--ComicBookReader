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
