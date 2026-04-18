import { describe, it, expect, vi } from 'vitest';
import { computeFileHash } from '../hash';

describe('computeFileHash', () => {
  it('computes a SHA-256 hash for a file', async () => {
    // Create a dummy file
    const content = 'test content';
    const file = new File([content], 'test.cbz', { type: 'application/x-cbz' });

    // Mock subtle.digest to return a fixed buffer
    const mockHashBuffer = new Uint8Array([
      0x9f, 0x86, 0xd0, 0x81, 0x88, 0x4c, 0x7d, 0x65, 
      0x9a, 0x2f, 0xea, 0xa0, 0xc5, 0x5a, 0xd0, 0x15, 
      0xa3, 0xbf, 0x4f, 0x1b, 0x2b, 0x0b, 0x82, 0x2c, 
      0xd1, 0x5d, 0x6c, 0x15, 0xb0, 0xf0, 0x0a, 0x08
    ]).buffer;

    vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(mockHashBuffer);

    const onProgress = vi.fn();
    const hash = await computeFileHash(file, onProgress);

    // Verify hash conversion (the mock values above translate to this hex)
    expect(hash).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    
    // Verify progress was called
    expect(onProgress).toHaveBeenCalled();
  });
});
