# ShelfLife — Board Game Collection Manager (PWA)

## Project Overview
ShelfLife is a Progressive Web App for board game enthusiasts to manage their collections, decide what to play, log play sessions, and view analytics. Built with a freemium model ($5/month Pro tier). Offline-first architecture.

## Tech Stack
- **Framework:** SvelteKit (Svelte 5) with TypeScript
- **Styling:** Tailwind CSS v4 + DaisyUI v5
- **Backend:** Supabase (auth + database)
- **Offline DB:** Dexie.js (IndexedDB wrapper)
- **PWA:** vite-plugin-pwa
- **Deployment:** Vercel (adapter-vercel)
- **Data Source:** BoardGameGeek (requires registered API token for imports)

## Project Structure
src/routes/(public)/ = Marketing pages (landing, login, signup) — SSR for SEO
src/routes/(app)/ = Authenticated app (dashboard, collection, pick, import) — client-side
src/lib/db/ = supabase.ts + dexie.ts
src/lib/services/ = bgg.ts (BoardGameGeek API)
src/lib/stores/ = auth.ts (auth state)
src/lib/components/ = Reusable UI components
src/app.css = Tailwind v4 @theme tokens (dark theme, purple/magenta brand)

## Design System
- Dark mode primary, purple/magenta accents, orange game-night accent
- DaisyUI v5 components with custom theme overrides
- "Bento Box" card layouts, glass morphism, hover flip animations
- Responsive sidebar (desktop) + bottom nav (mobile)

## Current Features (Steps 1-7 Complete)
1. Google OAuth + Magic Link auth (Supabase)
2. Manual game entry with quick-add buttons
3. Collection: grid/list views, search, filter by player count & playtime
4. "Pick a Game" random selector with animated dice roll + player count buttons
5. Play logging with quick-entry forms and history
6. Analytics dashboard with stats, charts, rankings, insights
7. BGG import (requires API token) + manual entry as primary method

## Key Technical Decisions
- Offline-first: Dexie.js is source of truth, Supabase syncs when online
- Svelte 5 runes ($state, $derived, $effect) — NOT legacy reactive statements
- Player count UI uses clickable number buttons (not slider)
- No SSR for app routes; public routes use SSR for SEO
- Dexie schema changes require version bumps in src/lib/db/dexie.ts

## Commands
npm run dev          # Dev server at localhost:5173
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Type checking

## Environment Variables (.env, not committed)
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

## Coding Standards
- TypeScript strict mode
- Tailwind utility classes over custom CSS
- Mobile-first responsive design
- Semantic HTML with ARIA labels
- kebab-case files, PascalCase components
- Never use sudo for npm commands
