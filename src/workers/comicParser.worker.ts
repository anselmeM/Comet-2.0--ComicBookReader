import JSZip from 'jszip';
// Import node-unrar-js for CBR support
import { createExtractorFromData } from 'node-unrar-js';

const IMAGE_REGEX = /\.(jpg|jpeg|png|webp|gif|avif)$/i;

// Helper to check if a filename is an image
function isImageFile(filename: string): boolean {
  return IMAGE_REGEX.test(filename);
}

self.addEventListener('message', async (event) => {
  const { type, buffer, filename, comicId, wasmBinary, format } = event.data;

  if (type !== 'PARSE') return;

  try {
    const isCbr = format ? (format === 'rar') : filename.toLowerCase().endsWith('.cbr');
    
    // The buffer is passed directly from the main thread
    const pageEntries: { name: string; blob: Blob; width: number; height: number }[] = [];

    if (isCbr) {
      // --------------------------------------------------------
      // CBR Parsing Logic (node-unrar-js with WASM)
      // --------------------------------------------------------
      console.log('[CBR Parser] Starting extraction for:', filename);
      
      // Use the WASM binary passed from the main thread
      if (!wasmBinary) {
        throw new Error('WASM binary not provided. Cannot parse CBR files.');
      }
      
      // Create the extractor with WASM binary
      const extractor = await createExtractorFromData({
        data: buffer,
        wasmBinary: wasmBinary
      });
      
      // Extract files - filter to only image files
      const extracted = extractor.extract({
        files: (fileHeader) => isImageFile(fileHeader.name)
      });
      
      const files = [...extracted.files];
      console.log('[CBR Parser] Found', files.length, 'image files');
      
      // Sort alphabetically (natural sort is better for "Page 1.jpg" vs "Page 10.jpg")
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      files.sort((a, b) => collator.compare(a.fileHeader.name, b.fileHeader.name));
      
      const total = files.length;
      
      for (let i = 0; i < total; i++) {
        const fileEntry = files[i];
        
        // Check if extraction exists
        if (!fileEntry.extraction) {
          console.warn(`Skipping file ${fileEntry.fileHeader.name} - no extraction data`);
          continue;
        }
        
        // Create a new ArrayBuffer with proper type by copying the data
        const extractionData = fileEntry.extraction;
        const arrayBuffer = new ArrayBuffer(extractionData.length);
        new Uint8Array(arrayBuffer).set(extractionData);
        const blob = new Blob([arrayBuffer]);
        
        // Get dimensions to prevent layout shift (CLS) in the reader
        let width = 0;
        let height = 0;
        try {
          const bitmap = await createImageBitmap(blob);
          width = bitmap.width;
          height = bitmap.height;
          bitmap.close();
        } catch (e) {
          console.warn(`Failed to get dimensions for page ${i}:`, e);
        }
        
        pageEntries.push({
          name: fileEntry.fileHeader.name,
          blob,
          width,
          height
        });

        if (i % 10 === 0 || i === total - 1) {
          self.postMessage({
            type: 'PROGRESS',
            comicId,
            page: i + 1,
            total,
          });
        }
      }
      
      console.log('[CBR Parser] Extraction complete. Total pages:', pageEntries.length);
    } else {
      // --------------------------------------------------------
      // CBZ Parsing Logic (jszip)
      // --------------------------------------------------------
      const zip = await JSZip.loadAsync(buffer);
      
      // Filter out directories and non-image files
      const imageFiles = Object.values(zip.files).filter((file) => 
        !file.dir && IMAGE_REGEX.test(file.name)
      );

      // Sort alphabetically (natural sort is better for "Page 1.jpg" vs "Page 10.jpg")
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      imageFiles.sort((a, b) => collator.compare(a.name, b.name));

      const total = imageFiles.length;
      
      for (let i = 0; i < total; i++) {
        const file = imageFiles[i];
        
        // Extract as Blob
        const blob = await file.async('blob');
        
        // Get dimensions to prevent layout shift (CLS) in the reader
        let width = 0;
        let height = 0;
        try {
          const bitmap = await createImageBitmap(blob);
          width = bitmap.width;
          height = bitmap.height;
          bitmap.close();
        } catch (e) {
          console.warn(`Failed to get dimensions for page ${i}:`, e);
        }
        
        pageEntries.push({
          name: file.name,
          blob,
          width,
          height
        });

        if (i % 10 === 0 || i === total - 1) {
          self.postMessage({
            type: 'PROGRESS',
            comicId,
            page: i + 1,
            total,
          });
        }
      }
    }

    // Done extraction. Send the raw Blobs and dimensions back. 
    self.postMessage({
      type: 'DONE',
      comicId,
      pages: pageEntries.map(e => ({
        blob: e.blob,
        width: e.width,
        height: e.height
      }))
    });

  } catch (error: unknown) {
    self.postMessage({
      type: 'ERROR',
      comicId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});
