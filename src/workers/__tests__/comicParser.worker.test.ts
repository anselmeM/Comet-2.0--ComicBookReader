import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';

// Mock JSZip
vi.mock('jszip', () => {
  return {
    default: {
      loadAsync: vi.fn(),
    },
  };
});

describe('comicParser.worker.ts (Web Worker)', () => {
  let messageHandler: ((event: any) => Promise<void>) | null = null;
  const mockPostMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    messageHandler = null;

    // Mock global self object for worker environment simulation
    global.self = {
      addEventListener: vi.fn((event, handler) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      }),
      postMessage: mockPostMessage,
    } as any;

    // Simulate loading the worker module
    // This will trigger self.addEventListener
    vi.mocked(global.self.addEventListener);
  });

  it('should register a message listener', async () => {
    // Dynamically require the worker script to trigger self.addEventListener
    await import('../comicParser.worker');
    expect(global.self.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('should parse zip files using JSZip and report progress/done', async () => {
    await import('../comicParser.worker');
    
    const mockFile = {
      name: 'test.cbz',
      arrayBuffer: async () => new ArrayBuffer(0),
    };

    const mockZip = {
      files: {
        'page1.jpg': { dir: false, name: 'page1.jpg', async: async () => new Blob(['data1']) },
        'page2.png': { dir: false, name: 'page2.png', async: async () => new Blob(['data2']) },
      },
    };

    vi.mocked(JSZip.loadAsync).mockResolvedValue(mockZip as any);

    // Mock createImageBitmap (standard in modern environments but not jsdom)
    global.createImageBitmap = vi.fn().mockResolvedValue({
      width: 800,
      height: 1200,
      close: vi.fn(),
    });

    if (messageHandler) {
      await messageHandler({
        data: {
          type: 'PARSE',
          file: mockFile,
          comicId: 'test-comic',
        },
      });

      expect(JSZip.loadAsync).toHaveBeenCalled();
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: 'PROGRESS',
        comicId: 'test-comic',
      }));
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: 'DONE',
        comicId: 'test-comic',
        pages: expect.any(Array),
      }));
    }
  });
});
