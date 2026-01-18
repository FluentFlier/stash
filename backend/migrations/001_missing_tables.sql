-- ===========================================
-- MISSING TABLES MIGRATION (FIXED TYPES)
-- Run this in Supabase SQL Editor to fix missing tables
-- ===========================================

-- 1. Tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Tags are shared, so allow authenticated users to read
CREATE POLICY "Authenticated users can read tags" ON tags FOR
SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create tags" ON tags FOR
INSERT
    TO authenticated
WITH
    CHECK (true);

-- 2. Capture Tags junction table
CREATE TABLE IF NOT EXISTS capture_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    capture_id UUID REFERENCES captures (id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES tags (id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (capture_id, tag_id)
);

-- Enable RLS
ALTER TABLE capture_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage tags on their own captures
-- FIXED: Added explicit type casting ::text to avoid 'text = uuid' errors
CREATE POLICY "Users can manage own capture tags" ON capture_tags FOR ALL USING (
    capture_id IN (
        SELECT id
        FROM captures
        WHERE user_id::text = auth.uid()::text
    )
);

-- Index
CREATE INDEX IF NOT EXISTS capture_tags_capture_id_idx ON capture_tags (capture_id);

CREATE INDEX IF NOT EXISTS capture_tags_tag_id_idx ON capture_tags (tag_id);

-- 3. Collection Captures junction table
CREATE TABLE IF NOT EXISTS collection_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    collection_id UUID REFERENCES collections (id) ON DELETE CASCADE NOT NULL,
    capture_id UUID REFERENCES captures (id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (collection_id, capture_id)
);

-- Enable RLS
ALTER TABLE collection_captures ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage captures in their own collections
-- FIXED: Added explicit type casting ::text to avoid 'text = uuid' errors
CREATE POLICY "Users can manage own collection captures" ON collection_captures FOR ALL USING (
    collection_id IN (
        SELECT id
        FROM collections
        WHERE user_id::text = auth.uid()::text
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS collection_captures_collection_id_idx ON collection_captures (collection_id);

CREATE INDEX IF NOT EXISTS collection_captures_capture_id_idx ON collection_captures (capture_id);

-- 4. Insights table (if not exists)
CREATE TABLE IF NOT EXISTS insights (
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

-- FIXED: Added explicit type casting ::text to avoid 'text = uuid' errors
CREATE POLICY "Users can manage own insights" ON insights FOR ALL USING (auth.uid()::text = user_id::text);

-- Index
CREATE INDEX IF NOT EXISTS insights_user_id_idx ON insights (user_id);

-- ===========================================
-- DONE! All missing tables created.
-- ===========================================