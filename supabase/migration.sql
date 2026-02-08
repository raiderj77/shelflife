-- ============================================
-- ShelfLife — Supabase Database Setup
-- ============================================
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- This creates all tables, security policies, and triggers.
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- Stores user info (linked to Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bgg_username TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: run after each new auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 2. GAMES TABLE
-- Master game data imported from BGG
-- ============================================
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  bgg_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  year_published INTEGER,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER,
  min_playtime INTEGER,
  max_playtime INTEGER,
  min_age INTEGER,
  description TEXT,
  thumbnail_url TEXT,
  image_url TEXT,
  categories TEXT[] DEFAULT '{}',
  mechanics TEXT[] DEFAULT '{}',
  bgg_rating DECIMAL(4,2),
  bgg_weight DECIMAL(3,2)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_games_bgg_id ON games(bgg_id);
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);

-- ============================================
-- 3. COLLECTION GAMES TABLE
-- Which games each user owns/wants
-- ============================================
CREATE TABLE IF NOT EXISTS collection_games (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'owned' CHECK (status IN ('owned', 'wishlist', 'for_trade', 'want_to_buy')),
  personal_rating DECIMAL(3,1) CHECK (personal_rating >= 1 AND personal_rating <= 10),
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each user can only have one entry per game
  UNIQUE(user_id, game_id)
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_collection_user ON collection_games(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_status ON collection_games(user_id, status);

-- ============================================
-- 4. PLAYS TABLE
-- Game session logs
-- ============================================
CREATE TABLE IF NOT EXISTS plays (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  players JSONB DEFAULT '[]',
  notes TEXT,
  photo_url TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for stats queries
CREATE INDEX IF NOT EXISTS idx_plays_user ON plays(user_id);
CREATE INDEX IF NOT EXISTS idx_plays_game ON plays(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_plays_date ON plays(user_id, played_at DESC);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- This is critical — it ensures users can only see their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- PROFILES: Public profiles visible by username (for shareable collection pages)
CREATE POLICY "Public profiles viewable by username"
  ON profiles FOR SELECT
  USING (username IS NOT NULL);

-- GAMES: Everyone can read games (they're public data from BGG)
CREATE POLICY "Games are publicly readable"
  ON games FOR SELECT
  TO authenticated
  USING (true);

-- GAMES: Authenticated users can insert new games (from BGG import)
CREATE POLICY "Authenticated users can insert games"
  ON games FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- GAMES: Authenticated users can update game data
CREATE POLICY "Authenticated users can update games"
  ON games FOR UPDATE
  TO authenticated
  USING (true);

-- COLLECTION: Users can CRUD their own collection
CREATE POLICY "Users can view own collection"
  ON collection_games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own collection"
  ON collection_games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collection"
  ON collection_games FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own collection"
  ON collection_games FOR DELETE
  USING (auth.uid() = user_id);

-- COLLECTION: Public view for shareable collection pages
CREATE POLICY "Public collection viewable"
  ON collection_games FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = collection_games.user_id
      AND profiles.username IS NOT NULL
    )
  );

-- PLAYS: Users can CRUD their own plays
CREATE POLICY "Users can view own plays"
  ON plays FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can log plays"
  ON plays FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plays"
  ON plays FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plays"
  ON plays FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER collection_updated_at
  BEFORE UPDATE ON collection_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Done! Your database is ready. 🎲
-- ============================================
