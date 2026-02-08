# 🎲 ShelfLife — Step 1 Complete: Foundation

## What Just Happened

You now have a brand new SvelteKit project with:

- ✅ **SvelteKit** with TypeScript (SSR from day 1)
- ✅ **Tailwind CSS v4** with custom ShelfLife dark theme
- ✅ **Vercel adapter** ready for $0 deployment
- ✅ **Landing page** with animated counter, feature cards, glass nav
- ✅ **Route groups** set up: `(app)/` for auth pages, `(public)/` for marketing
- ✅ **SEO foundation**: robots.txt, llms.txt, meta tags, Open Graph
- ✅ **Favicon**: Custom dice SVG
- ✅ **Lib structure**: db/, services/, components/, stores/, utils/

## Packages Installed

| Package | Version | Purpose |
|---------|---------|---------|
| svelte | 5.49.1 | UI framework |
| @sveltejs/kit | 2.50.2 | Full-stack framework with SSR |
| tailwindcss | 4.1.18 | Styling |
| @supabase/supabase-js | 2.94.0 | Auth + database |
| dexie | 4.3.0 | Offline IndexedDB |
| fast-xml-parser | 5.3.4 | BGG XML API parsing |
| vite-plugin-pwa | 1.2.0 | PWA service worker |
| @sveltejs/adapter-vercel | 6.3.1 | Deployment |

## Run It Locally

```bash
# 1. Extract the project
tar -xzf shelflife-step1.tar.gz
cd shelflife

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open http://localhost:5173
```

You should see a dark-themed landing page with:
- Glass morphism navbar with ShelfLife logo
- "Your board games, finally organized" headline
- Animated game counter
- 6 feature cards
- Sign In button (not wired up yet — that's Step 5)

## Project Structure

```
shelflife/
├── src/
│   ├── app.css              ← Tailwind v4 + custom theme
│   ├── app.html             ← PWA meta, fonts, SEO
│   ├── app.d.ts             ← TypeScript types
│   ├── lib/
│   │   ├── components/      ← Reusable UI components (empty, coming Step 2)
│   │   ├── db/              ← Dexie offline database (coming Step 6)
│   │   ├── services/        ← BGG + Supabase services (coming Step 3+7)
│   │   ├── stores/          ← Svelte stores for state (coming Step 5)
│   │   └── utils/           ← Helper functions
│   └── routes/
│       ├── +layout.svelte   ← Root layout (CSS import, SEO defaults)
│       ├── +page.svelte     ← Landing page (hero, features)
│       ├── (app)/           ← Auth-required pages (coming Step 5+)
│       ├── (public)/        ← Public marketing pages (coming Step 16+)
│       ├── api/
│       │   └── bgg/         ← BGG proxy API route (coming Step 7)
│       └── u/
│           └── [username]/  ← Public collection pages (coming Step 15)
├── static/
│   ├── favicon.svg          ← Dice icon
│   ├── llms.txt             ← AI search engine optimization
│   └── robots.txt           ← Crawler welcome mat
├── svelte.config.js         ← Vercel adapter config
├── vite.config.ts           ← Tailwind v4 + Vite config
└── package.json
```

## What's Next: Step 2

Install and configure **shadcn-svelte** for beautiful, accessible UI components.
This gives us buttons, cards, dialogs, dropdowns, and more — all matching our theme.

Say **"Step 2"** when ready!
