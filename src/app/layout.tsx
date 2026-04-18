import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/app/providers';
import { NetworkStatusIndicator } from '@/components/atoms/NetworkStatusIndicator';
import { PWAUpdater } from '@/components/atoms/PWAUpdater';
import { ThemeManager } from '@/components/atoms/ThemeManager';
import { SyncManagerInit } from '@/components/atoms/SyncManagerInit';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Comet — The Speed of Light Comic Reader',
    template: '%s | Comet',
  },
  description:
    'Read your comic book collection offline. Supports .cbz and .cbr formats with seamless cloud sync.',
  keywords: ['comic reader', 'cbz', 'cbr', 'pwa', 'offline comic', 'manga reader'],
  authors: [{ name: 'Comet' }],
  creator: 'Comet',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
    shortcut: '/icons/icon-192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Comet',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'Comet',
    title: 'Comet — The Speed of Light Comic Reader',
    description: 'Read your comic book collection offline.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-comet-bg text-comet-text antialiased">
        <NetworkStatusIndicator />
        <PWAUpdater />
        <Providers>
          <ThemeManager />
          <SyncManagerInit />
          {children}
        </Providers>
      </body>
    </html>
  );
}
