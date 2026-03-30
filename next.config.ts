import type { NextConfig } from 'next';

const cspHeader = `
    default-src 'self' https:;
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' data: https://fonts.gstatic.com;
    img-src 'self' blob: data: https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors: 'none';
    worker-src 'self' blob:;
    connect-src 'self' http://localhost:* https://localhost:* https://comicvine.gamespot.com https://*.aws.neon.tech https://*.supabase.co;
`;

const nextConfig: NextConfig = {
  // Production optimizations
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  // Enable standalone output for containerized deployments
  output: 'standalone',

  // Disable Turbopack for production builds (causes MIME type issues)
  // Only enable in development
  turbopack: process.env.NODE_ENV === 'development' ? {
    root: process.cwd(),
  } : undefined,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'comicvine.gamespot.com',
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

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
