-- ===========================================
-- MIGRATION 002: FIX TYPE MISMATCHES (REVISED)
-- - Uses UUID for table IDs and Foreign Keys (matching existing captures table UUIDs)
-- - Uses explicit casting for user_id comparisons (fixing text=uuid error in RLS)
-- ===========================================

-- Drop tables to ensure clean slate
DROP TABLE IF EXISTS collection_captures CASCADE;

DROP TABLE IF EXISTS capture_tags CASCADE;

DROP TABLE IF EXISTS tags CASCADE;

DROP TABLE IF EXISTS insights CASCADE;

-- 1. Tags table (UUID id)
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON tags FOR SELECT USING (true);

CREATE POLICY "Authenticated create access" ON tags FOR
INSERT
    TO authenticated
WITH
    CHECK (true);

-- 2. Capture Tags (UUID ids)
CREATE TABLE capture_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    capture_id UUID REFERENCES captures (id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES tags (id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (capture_id, tag_id)
);

-- Enable RLS
ALTER TABLE capture_tags ENABLE ROW LEVEL SECURITY;

-- Note: user_id is checked as text because Prisma uses String field mapping
-- This cast handles both UUID and TEXT cases safely
CREATE POLICY "User manage capture tags" ON capture_tags FOR ALL USING (
  capture_id IN (
        SELECT id 
        FROM captures 
        WHERE user_id::text = auth.uid()::text
  )
);

-- Indexes
CREATE INDEX capture_tags_capture_id_idx ON capture_tags (capture_id);

CREATE INDEX capture_tags_tag_id_idx ON capture_tags (tag_id);

-- 3. Collection Captures (UUID ids)
CREATE TABLE collection_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    collection_id UUID REFERENCES collections (id) ON DELETE CASCADE NOT NULL,
    capture_id UUID REFERENCES captures (id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (collection_id, capture_id)
);

-- Enable RLS
ALTER TABLE collection_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User manage collection captures" ON collection_captures FOR ALL USING (
  collection_id IN (
        SELECT id 
        FROM collections 
        WHERE user_id::text = auth.uid()::text
  )
);

-- Indexes
CREATE INDEX collection_captures_collection_id_idx ON collection_captures (collection_id);

CREATE INDEX collection_captures_capture_id_idx ON collection_captures (capture_id);

-- 4. Insights (UUID ids)
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
-- Robust comparison casting both sides to text
CREATE POLICY "User manage insights" ON insights FOR ALL USING (user_id::text = auth.uid()::text);

CREATE INDEX insights_user_id_idx ON insights (user_id);

-- ===========================================
-- DONE! Fixed incompatible types (UUID keys, TEXT user_id comparison).
-- ===========================================