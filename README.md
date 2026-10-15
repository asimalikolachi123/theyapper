# theYapper

A responsive, mobile-first social community built with Next.js, TypeScript, and Supabase.

## Features
- Responsive desktop, tablet, and mobile layouts
- Social feed with compose, search, likes, bookmarks, and follow toggles
- Email/password sign-up and sign-in with Supabase Auth
- Supabase-backed post reading and publishing
- Dark appearance toggle
- Row Level Security schema for profiles, posts, follows, likes, comments, and bookmarks

## Run locally
1. Install Node.js 18+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set your Supabase project URL and anon/publishable key.
4. In your Supabase SQL Editor, run `supabase/schema.sql`.
5. Run `npm run dev` and open http://localhost:3000.

Without Supabase environment variables the app shows sample posts and lets you preview local composer interactions. Accounts and persistent publishing require Supabase configuration.

## Deploy to Vercel
Import this GitHub repository in Vercel and add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then deploy. Never put a Supabase service-role key in a browser-exposed environment variable.

## Current limitations
The first release UI includes placeholders for direct messages, notifications, reposting, and full threaded replies. The database schema includes comments and follows, but production-ready interactive screens for every feature still need to be implemented.
