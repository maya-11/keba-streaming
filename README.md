# Keba Streaming Platform

A Netflix/Showmax-style Progressive Web App built with Next.js, React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **User Features**: Sign up, login, browse movies/series, search, watch videos, continue watching, watch history, my list/favourites, subscription management, push notifications, offline support (PWA), responsive UI for all devices
- **Admin Portal**: Content management (movies, series, seasons, episodes), genre management, user management, subscription plan management, featured content management, analytics dashboard
- **Tech Stack**: Next.js 14, React 18, TypeScript, Tailwind CSS, Supabase (Auth, Database, Storage), Vercel

Video is uploaded and served straight from Supabase Storage — there is no Cloudflare Stream dependency.

## Setup

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### 2. Clone and Install

```bash
git clone <repo-url>
cd keba-streaming
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)

### 4. Database Setup

Run the SQL schema in your Supabase SQL editor:

1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of `supabase/schema.sql`
3. Execute

This creates all tables, indexes, RLS policies, triggers, and seeds initial data (genres, subscription plans).

### 5. Supabase Storage

Create a public bucket named `media` in Supabase Storage — used for thumbnails, posters, and video files (uploads are capped at 50MB by Supabase's free-tier storage limit).

### 6. Generate VAPID Keys (Push Notifications)

```bash
npm run generate:vapid
```

Add the output to your `.env.local`.

### 7. Create Admin User

1. Register a new account via the app
2. In Supabase SQL Editor, run:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 8. Generate Icons

```bash
node scripts/generate-icons.js
```

For production, convert the generated SVGs to PNGs.

### 9. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (main)/          # Authenticated user pages
│   │   ├── browse/      # Home, movies, series
│   │   ├── watch/       # Video player
│   │   ├── search/      # Search
│   │   ├── my-list/     # Favourites
│   │   ├── history/     # Watch history
│   │   ├── profile/     # Profile & subscription
│   │   ├── title/       # Content detail
│   │   └── notifications/
│   ├── admin/           # Admin portal
│   │   ├── content/     # Content CRUD
│   │   ├── genres/      # Genre management
│   │   ├── users/       # User management
│   │   ├── subscriptions/
│   │   ├── featured/
│   │   └── analytics/
│   ├── auth/            # Login, register
│   └── api/             # API routes
├── components/
│   ├── admin/           # Admin components
│   ├── content/         # Content cards, player, rows
│   ├── layout/          # Navbar, footer
│   ├── pwa/             # Service worker registration
│   └── ui/              # Shared UI components
├── hooks/               # Custom React hooks
├── lib/                 # Supabase client helpers
├── store/               # Zustand state management
└── types/               # TypeScript types
```

## Deployment

### Vercel

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

## Testing

```bash
npm run test        # Run Playwright tests
npm run test:ui     # Run with Playwright UI
```

## License


Private — All rights reserved.
