import JSZip from 'jszip';
// Note: unrar-js would normally be imported or loaded here,
// but for the sake of standard Web Worker setup without Webpack magic,
// it might need to be imported via absolute URL or bundled.
// For now, we stub CBR parsing and focus on CBZ (ZIP) parsing.

const IMAGE_REGEX = /\.(jpg|jpeg|png|webp|gif|avif)$/i;

self.addEventListener('message', async (event) => {
  const { type, file, comicId } = event.data;

  if (type !== 'PARSE') return;

  try {
    const isCbr = file.name.toLowerCase().endsWith('.cbr');
    
    // We expect the file to be a Blob/File object.
    const arrayBuffer = await file.arrayBuffer();

    const pageEntries: { name: string; blob: Blob; width: number; height: number }[] = [];

    if (isCbr) {
      // --------------------------------------------------------
      // CBR Parsing Logic (unrar.js)
      // --------------------------------------------------------
      // For a real production app, you would load the unrar.wasm 
      // module here and extract the files into an ArrayBuffer array.
      // E.g.
      // import { createExtractorFromData } from 'node-unrar-js'
      // const extractor = await createExtractorFromData({ data: arrayBuffer, wasmBinary: ... })
      // const { files } = extractor.extract({ files: (f) => IMAGE_REGEX.test(f.fileHeader.name) });
      // pageEntries = files.map(f => ({ name: f.fileHeader.name, blob: new Blob([f.extraction]) }));
      
      throw new Error("CBR format parsing via WebAssembly is stubbed in this version. Please use CBZ.");
    } else {
      // --------------------------------------------------------
      // CBZ Parsing Logic (jszip)
      // --------------------------------------------------------
      const zip = await JSZip.loadAsync(arrayBuffer);
      
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
