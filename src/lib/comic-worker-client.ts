export interface PageEntry {
  blob: Blob;
  width: number;
  height: number;
}

// Load the WASM binary once at module initialization
let wasmBinaryPromise: Promise<ArrayBuffer> | null = null;

export function getWasmBinary(): Promise<ArrayBuffer> {
  if (!wasmBinaryPromise) {
    wasmBinaryPromise = fetch('/unrar.wasm').then((response) => {
      if (!response.ok) {
        throw new Error('Failed to load unrar.wasm');
      }
      return response.arrayBuffer();
    });
  }
  return wasmBinaryPromise;
}

/**
 * Wraps the comic parser web worker inside a Promise.
 */
export async function executeParserWorker(
  file: File,
  comicId: string,
  onProgress: (page: number, total: number) => void,
): Promise<PageEntry[]> {
  return new Promise<PageEntry[]>(async (resolve, reject) => {
    try {
      const worker = new Worker(new URL('../workers/comicParser.worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (e) => {
        const { type, page, total, pages, error: workerErr } = e.data;

        if (type === 'PROGRESS') {
          onProgress(page, total);
        } else if (type === 'DONE') {
          worker.terminate();
          resolve(pages);
        } else if (type === 'ERROR') {
          worker.terminate();
          reject(new Error(workerErr));
        }
      };

      const isRar = file.name.toLowerCase().endsWith('.cbr');
      const format = isRar ? 'rar' : 'zip';
      const wasmBinary = await getWasmBinary();
      const arrayBuffer = await file.arrayBuffer();

      worker.postMessage(
        {
          type: 'PARSE',
          buffer: arrayBuffer,
          filename: file.name,
          comicId,
          wasmBinary,
          format,
        },
        [arrayBuffer],
      );
    } catch (workerSetupErr) {
      reject(workerSetupErr);
    }
  });
}
