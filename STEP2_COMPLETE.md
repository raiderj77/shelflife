# 🎲 ShelfLife — Step 2 Complete: Database & Auth Foundation

## What Just Happened

You now have the full data layer wired up:

- ✅ **Supabase client** — Cloud database + auth connection
- ✅ **TypeScript types** — Full type safety for all database tables
- ✅ **Dexie.js offline DB** — Local IndexedDB with games, collection, plays, settings
- ✅ **Auth store** — Svelte 5 runes-based auth state (Google + Magic Link)
- ✅ **SQL migration** — Ready to paste into Supabase dashboard
- ✅ **Helper functions** — getCollection, pickRandomGame, logPlay, getStats, and more
- ✅ **RLS security** — Row Level Security so users only see their own data

## Files Created

```
src/lib/
├── db/
│   └── schema.ts            ← Dexie offline DB (games, collection, plays, settings)
├── services/
│   ├── supabase.ts          ← Supabase client connection
│   └── supabase-types.ts    ← TypeScript types for all tables
└── stores/
    └── auth.svelte.ts       ← Auth store (Svelte 5 $state runes)

supabase/
└── migration.sql            ← SQL to create all tables + RLS policies

.env                         ← Your Supabase credentials (git-ignored)
.env.example                 ← Safe template for version control
```

## 🔧 YOUR HOMEWORK: Set Up Supabase (5 minutes)

This is the one part I can't do for you — you need to create the Supabase project:

### 1. Create a Supabase Project
1. Go to **https://supabase.com** and sign up (free)
2. Click **"New Project"**
3. Name it **"shelflife"**
4. Set a database password (save it somewhere safe!)
5. Choose the region closest to you (West US)
6. Click **"Create new project"** and wait ~2 minutes

### 2. Get Your API Keys
1. In your Supabase dashboard, go to **Settings → API**
2. Copy the **Project URL** and **anon/public key**
3. Open your `.env` file and paste them in:

```bash
# In your terminal:
nano ~/shelflife/.env
```

Replace the placeholder values:
```
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...your-key-here
```

Save with `Ctrl+O`, Enter, then `Ctrl+X`.

### 3. Run the Database Migration
1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Open `supabase/migration.sql` from your project
4. Copy the ENTIRE file and paste it into the SQL editor
5. Click **"Run"**
6. You should see "Success. No rows returned" — that's correct!

### 4. Enable Google Auth
1. In Supabase dashboard, go to **Authentication → Providers**
2. Find **Google** and enable it
3. You'll need a Google OAuth client ID:
   - Go to **https://console.cloud.google.com**
   - Create a project (or use existing)
   - Go to **APIs & Services → Credentials**
   - Create an **OAuth 2.0 Client ID** (Web application)
   - Add authorized redirect: `https://xxxxx.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret** into Supabase

### 5. Test It
```bash
cd ~/shelflife
npm run dev
```

The app should still load at `http://localhost:5173`. The Sign In button doesn't work yet (that's Step 3!), but the foundation is ready.

## Architecture Recap

```
User taps "Add Game"
        │
        ▼
┌─────────────────┐     Background sync     ┌──────────────┐
│  Dexie (IndexedDB)│ ──────────────────────▶ │   Supabase   │
│  Instant response │ ◀────────────────────── │  (Postgres)  │
│  Works offline!   │     When online         │  Cloud backup │
└─────────────────┘                          └──────────────┘
```

## What's Next: Step 3

Build the **auth flow** — Sign In page, auth guard for app routes, and the app layout shell (sidebar + header). After this step, users will be able to actually log in!

Say **"Step 3"** when your Supabase project is set up!
