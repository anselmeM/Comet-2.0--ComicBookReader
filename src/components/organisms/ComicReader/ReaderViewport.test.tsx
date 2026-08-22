import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act, cleanup } from '@testing-library/react';
import { ReaderViewport } from './ReaderViewport';

const mockStore = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
  nextPage: vi.fn(),
  prevPage: vi.fn(),
  toggleMenu: vi.fn(),
}));

vi.mock('@/stores/readerStore', () => ({
  useReaderStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockStore.state),
}));

vi.mock('framer-motion', () => {
  const React = require('react');
  const motionComponent = (props: Record<string, unknown>) => React.createElement('div', props);
  return {
    motion: new Proxy({}, { get: () => motionComponent }),
    animate: vi.fn(() => ({ stop: vi.fn() })),
    useMotionValue: (init: number) => ({
      get: () => init,
      set: vi.fn(),
    }),
  };
});

vi.mock('@use-gesture/react', () => ({
  useGesture: vi.fn(),
}));

function setStoreState(overrides: Record<string, unknown>) {
  Object.assign(mockStore.state, {
    zoomLevel: 1,
    setZoomLevel: vi.fn(),
    isGuidedViewEnabled: false,
    guidedStep: 0,
    currentPage: 0,
    pagePanels: {},
    mode: 'single-page',
    panSpeed: 1,
    panEase: 'easeOut',
    nextPage: mockStore.nextPage,
    prevPage: mockStore.prevPage,
    toggleMenu: mockStore.toggleMenu,
    ...overrides,
  });
}

function getViewport(): HTMLElement {
  const el = document.querySelector('.cursor-grab');
  if (!el) throw new Error('viewport not found');
  return el as HTMLElement;
}

function mockRect(el: HTMLElement) {
  el.getBoundingClientRect = () =>
    ({
      width: 1000,
      height: 600,
      left: 0,
      top: 0,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

describe('ReaderViewport single-tap page turning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    setStoreState({});
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('turns to the next page when tapping the right zone (no crash)', () => {
    render(
      <ReaderViewport>
        <div>page</div>
      </ReaderViewport>,
    );
    const viewport = getViewport();
    mockRect(viewport);

    fireEvent.pointerUp(viewport, { clientX: 900, isPrimary: true });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockStore.nextPage).toHaveBeenCalledTimes(1);
    expect(mockStore.prevPage).not.toHaveBeenCalled();
    expect(mockStore.toggleMenu).not.toHaveBeenCalled();
  });

  it('turns to the previous page when tapping the left zone', () => {
    render(
      <ReaderViewport>
        <div>page</div>
      </ReaderViewport>,
    );
    const viewport = getViewport();
    mockRect(viewport);

    fireEvent.pointerUp(viewport, { clientX: 100, isPrimary: true });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockStore.prevPage).toHaveBeenCalledTimes(1);
    expect(mockStore.nextPage).not.toHaveBeenCalled();
  });

  it('toggles the menu when tapping the middle zone', () => {
    render(
      <ReaderViewport>
        <div>page</div>
      </ReaderViewport>,
    );
    const viewport = getViewport();
    mockRect(viewport);

    fireEvent.pointerUp(viewport, { clientX: 500, isPrimary: true });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockStore.toggleMenu).toHaveBeenCalledTimes(1);
    expect(mockStore.nextPage).not.toHaveBeenCalled();
    expect(mockStore.prevPage).not.toHaveBeenCalled();
  });

  it('ignores multi-touch events', () => {
    render(
      <ReaderViewport>
        <div>page</div>
      </ReaderViewport>,
    );
    const viewport = getViewport();

    fireEvent.pointerUp(viewport, { clientX: 900, isPrimary: false });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockStore.nextPage).not.toHaveBeenCalled();
    expect(mockStore.prevPage).not.toHaveBeenCalled();
    expect(mockStore.toggleMenu).not.toHaveBeenCalled();
  });

  it('suppresses tap action when pointer moved during drag (>8px displacement)', () => {
    render(
      <ReaderViewport>
        <div>page</div>
      </ReaderViewport>,
    );
    const viewport = getViewport();
    mockRect(viewport);

    // Pointer down at x=500, y=300
    fireEvent.pointerDown(viewport, { clientX: 500, clientY: 300, isPrimary: true });

    // Pointer up after drag to x=550, y=300 (displacement = 50px)
    fireEvent.pointerUp(viewport, { clientX: 550, clientY: 300, isPrimary: true });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockStore.toggleMenu).not.toHaveBeenCalled();
    expect(mockStore.nextPage).not.toHaveBeenCalled();
    expect(mockStore.prevPage).not.toHaveBeenCalled();
  });

  it('suppresses tap action when pointer was held for long press/pan (>800ms)', () => {
    render(
      <ReaderViewport>
        <div>page</div>
      </ReaderViewport>,
    );
    const viewport = getViewport();
    mockRect(viewport);

    fireEvent.pointerDown(viewport, { clientX: 900, clientY: 300, isPrimary: true });
    act(() => {
      vi.advanceTimersByTime(900); // Held down for 900ms
    });
    fireEvent.pointerUp(viewport, { clientX: 900, clientY: 300, isPrimary: true });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockStore.nextPage).not.toHaveBeenCalled();
  });
});
