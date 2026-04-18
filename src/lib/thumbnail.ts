/**
 * Extracts and compresses a cover image from a comic page blob.
 * 
 * @param blob The image blob to compress
 * @param maxWidth Target width (default 400px)
 * @param quality JPEG quality (0.0 to 1.0, default 0.8)
 * @returns Base64 data URL of the compressed image
 */
export async function generateThumbnail(
  blob: Blob, 
  maxWidth = 400, 
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Calculate aspect-ratio-friendly dimensions
      const scaleFactor = maxWidth / img.width;
      const targetWidth = maxWidth;
      const targetHeight = img.height * scaleFactor;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Use high-quality image scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Convert to JPEG at specified quality
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Final check for size limit (200KB per design doc)
      if (dataUrl.length > 200000) {
        console.warn('[thumbnail] Thumbnail exceeds 200KB, re-compressing at lower quality');
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      } else {
        resolve(dataUrl);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for thumbnail generation'));
    };
    
    img.src = url;
  });
}
