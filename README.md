# Comet 2.0 - Comic Book Reader

A modern, offline-first comic book reader built with Next.js, featuring a beautiful reading experience with guided view, PWA support, and library management.

![Comet Comic Reader](https://via.placeholder.com/800x400?text=Comet+2.0)

## Features

- 📚 **Library Management** - Upload, organize, and browse your comic collection
- 📖 **Immersive Reader** - Guided view reading experience with smooth page transitions
- 📱 **PWA Support** - Install as a native app on desktop and mobile
- 🔄 **Offline First** - Works offline with IndexedDB caching
- ☁️ **Cloud Sync (Premium)** - Cross-device sync via S3/R2 with pre-signed URLs
- 💳 **Billing** - Stripe subscriptions with FREE/PREMIUM plans
- 🎨 **Beautiful UI** - Dark theme optimized for reading
- 🔍 **Metadata Enrichment** - Automatic comic information fetching from ComicVine
- 👥 **Social** - Friends, feed reactions, direct messages, reading clubs
- 🏆 **Gamification** - Badges, reading streaks, and statistics
- 🔐 **Authentication** - Secure accounts with NextAuth.js (credentials + OAuth)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM (SQLite supported for local development)
- **Auth**: NextAuth.js v5
- **State**: Zustand
- **Billing**: Stripe
- **Monitoring**: Sentry
- **Rate Limiting**: Upstash Redis
- **PWA**: @ducanh2912/next-pwa
- **Comic Parsing**: JSZip with Web Workers

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/comet-2.0.git
cd comet-2.0
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma db push
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3100](http://localhost:3100) in your browser

### Environment Variables

Create a `.env.local` file with the following (see `.env.example` for the full list):

```env
# Database (PostgreSQL for production / shared dev; SQLite `file:./dev.db` for local dev)
DATABASE_URL="postgresql://user:password@host:5432/comet"
DIRECT_URL="postgresql://user:password@host:5432/comet"

# NextAuth
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3100"

# External APIs
COMICVINE_API_KEY="your-comicvine-api-key"

# Email (password resets)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM="\"Comet Reader\" <noreply@yourdomain.com>"

# Cloud Sync (S3/R2/B2 — required for production Cloud Sync)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
AWS_REGION="auto"
AWS_BUCKET_NAME="comet-comics"
```

The build automatically configures Prisma for PostgreSQL when `DATABASE_URL` is a
PostgreSQL connection string, otherwise it falls back to SQLite (running migrations
only for PostgreSQL — use `npm run db:push` to sync a local SQLite schema).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Authenticated app routes
│   │   ├── library/       # Library page
│   │   ├── reader/        # Comic reader
│   │   └── settings/      # Settings page
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   └── register/
│   └── api/               # API routes
├── components/            # React components
│   ├── atoms/            # Basic UI components
│   ├── molecules/        # Composite components
│   └── organisms/       # Complex components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── stores/              # Zustand stores
├── types/               # TypeScript types
└── workers/             # Web Workers
```

## Supported Formats

- **CBZ** - Comic Book ZIP
- **CBR** - Comic Book RAR (coming soon)
- **ZIP** - Standard ZIP archives
- **Images** - Folders with image files (coming soon)

## Keyboard Shortcuts

- `Arrow Left/Right` - Previous/Next page
- `Space` - Next page
- `Home/End` - First/Last page
- `F` - Toggle fullscreen
- `Escape` - Exit fullscreen

## Development

### Building for Production

```bash
npm run build
npm start
```

### Quality Gates

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright end-to-end tests
```

### Database

```bash
npm run db:push    # Sync the Prisma schema to the database (SQLite local dev)
npx prisma studio  # Browse the database
```

## CI/CD

The repository ships with GitHub Actions workflows:

- `ci.yml` — lint, typecheck, unit tests, and production build on every push/PR
- `deploy.yml` — deploy to Vercel on pushes to `master`
- `db-backup.yml` — scheduled PostgreSQL backups
- `lighthouse.yml` — performance budgets
- `security-audit.yml` — weekly dependency/security audit

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [ComicVine API](https://comicvine.gamespot.com)
