import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Crypto API since it's not available in jsdom
Object.defineProperty(global.self, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn(),
    },
    randomUUID: () => 'test-uuid',
  },
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Mock Worker
global.Worker = class {
  onmessage: any = null;
  postMessage = vi.fn();
  terminate = vi.fn();
} as any;

// Mock next/headers for test bypass logic in auth-utils
vi.mock('next/headers', () => {
  return {
    cookies: vi.fn().mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
      delete: vi.fn(),
    }),
    headers: vi.fn().mockResolvedValue({
      get: vi.fn(),
    }),
  };
});
