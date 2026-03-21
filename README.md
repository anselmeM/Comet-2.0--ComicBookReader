# Comet 2.0 - Comic Book Reader

A modern, offline-first comic book reader built with Next.js, featuring a beautiful reading experience with guided view, PWA support, and library management.

![Comet Comic Reader](https://via.placeholder.com/800x400?text=Comet+2.0)

## Features

- 📚 **Library Management** - Upload, organize, and browse your comic collection
- 📖 **Immersive Reader** - Guided view reading experience with smooth page transitions
- 📱 **PWA Support** - Install as a native app on desktop and mobile
- 🔄 **Offline First** - Works offline with IndexedDB caching
- 🎨 **Beautiful UI** - Dark theme optimized for reading
- 🔍 **Metadata Enrichment** - Automatic comic information fetching from ComicVine
- 🔐 **Authentication** - Secure user accounts with NextAuth.js

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Auth**: NextAuth.js v5
- **State**: Zustand
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

Create a `.env.local` file with the following:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
AUTH_SECRET="your-secret-key"
AUTH_URL="http://localhost:3100"

# ComicVine API (optional)
COMICVINE_API_KEY="your-api-key"
```

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

### Linting

```bash
npm run lint
```

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
