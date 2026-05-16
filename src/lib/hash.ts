/**
 * Computes a SHA-256 hash for a given File object for deduplication.
 * To provide progress updates, we read the file in chunks but compute the final hash
 * over the entire buffer at once (SubtleCrypto.digest limit).
 * 
 * @param file The file to hash
 * @param onProgress Callback to report progress (0.0 to 1.0)
 * @returns SHA-256 hash in hexadecimal format
 */
export async function computeFileHash(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> {
  const chunkSize = 2 * 1024 * 1024; // 2MB as per design doc
  const totalChunks = Math.ceil(file.size / chunkSize);
  const chunks: ArrayBuffer[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const offset = i * chunkSize;
    const slice = file.slice(offset, offset + chunkSize);
    const buffer = await slice.arrayBuffer();
    chunks.push(buffer);
    
    if (onProgress) {
      onProgress((i + 1) / totalChunks);
    }
  }

  // Combine chunks into a single ArrayBuffer for SubtleCrypto.digest
  const fullBuffer = new Uint8Array(file.size);
  let offset = 0;
  for (const chunk of chunks) {
    fullBuffer.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  // Compute final SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', fullBuffer.buffer);
  
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
