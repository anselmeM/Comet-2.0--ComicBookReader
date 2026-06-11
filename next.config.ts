import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import { spawn } from 'child_process';
import path from 'path';
import { withSentryConfig } from '@sentry/nextjs';

if (process.env.NODE_ENV === 'development' && !(global as any).__mockS3ServerStarted) {
  (global as any).__mockS3ServerStarted = true;
  console.log('\x1b[35m[Dev] Starting Mock S3 Server on port 3101...\x1b[0m');
  const mockS3ServerPath = path.join(process.cwd(), 'scripts', 'mock-s3-server.js');
  const child = spawn('node', [mockS3ServerPath], {
    stdio: 'inherit',
  });
  child.unref();
}

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    swSrc: 'src/service-worker.ts',
  },
});

const nextConfig: NextConfig = {
  // Production optimizations
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  // Disable Turbopack for production builds (causes MIME type issues)
  // Only enable in development
  turbopack: {
    root: process.cwd(),
  } ,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'comicvine.gamespot.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Increase cache duration for optimized images
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    formats: ['image/avif', 'image/webp'],
  },

  // Optimize package imports - reduces bundle size
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@tanstack/react-query'],
  },

  // Security Headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const connectSrc = `connect-src 'self' https://comicvine.gamespot.com https://api.stripe.com${isDev ? ' http://localhost:3101 ws://localhost:*' : ''};`;
    const csp = `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://comicvine.gamespot.com https://images.unsplash.com; font-src 'self' https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'self' blob:; ${connectSrc}${isDev ? '' : ' upgrade-insecure-requests;'}`;

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: csp
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
};

export default withSentryConfig(withPWA(nextConfig), {
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
});
