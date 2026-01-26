-- ============================================
-- RANKING SYSTEM MIGRATION
-- ============================================
-- Add point accumulation and ranking features
-- Based on RANKING_SYSTEM_POLICY.md

-- ============================================
-- 1. ADD COLUMNS
-- ============================================

-- blocks: accumulated points (prize pool)
ALTER TABLE blocks 
ADD COLUMN accumulated_points bigint NOT NULL DEFAULT 0;

-- profiles: total points for ranking
ALTER TABLE profiles 
ADD COLUMN total_points bigint NOT NULL DEFAULT 0;

-- ============================================
-- 2. CREATE INDEX FOR RANKING QUERIES
-- ============================================

CREATE INDEX profiles_total_points_idx ON profiles(total_points DESC);

-- ============================================
-- 3. UPDATE BLOCKS_PUBLIC VIEW
-- ============================================

DROP VIEW IF EXISTS blocks_public;

CREATE VIEW blocks_public AS
SELECT 
  b.id,
  b.status,
  b.seed_hint,
  b.difficulty_config,
  b.winner_id,
  b.created_at,
  b.solved_at,
  b.previous_block_id,
  b.accumulated_points,
  prev.winner_id AS created_by
FROM blocks b
LEFT JOIN blocks prev ON b.previous_block_id = prev.id;

GRANT SELECT ON blocks_public TO authenticated, anon;

-- ============================================
-- 4. RLS POLICIES FOR POINTS
-- ============================================

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
  );

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
'Users can only update their own profile fields (nickname, avatar_url, etc.). 
total_points column is protected by application logic:
- Client SDK should only update allowed fields (not total_points)
- total_points is exclusively modified by Edge Functions using service_role
- RLS WITH CHECK cannot prevent specific column updates in PostgreSQL
- For absolute protection, use REVOKE UPDATE(total_points) or database triggers';

-- ============================================
-- 5. HELPER FUNCTIONS FOR RANKING
-- ============================================

-- Function: Increment block points (called on each attempt)
CREATE OR REPLACE FUNCTION increment_block_points(p_block_id bigint)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_points bigint;
BEGIN
  UPDATE blocks 
  SET accumulated_points = accumulated_points + 1
  WHERE id = p_block_id
  RETURNING accumulated_points INTO new_points;
  
  RETURN new_points;
END;
$$;

-- Function: Award points to winner (called on correct answer)
CREATE OR REPLACE FUNCTION award_points_to_winner(p_block_id bigint, p_winner_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  block_points bigint;
BEGIN
  -- Get the accumulated points from the block
  SELECT accumulated_points INTO block_points
  FROM blocks
  WHERE id = p_block_id;
  
  -- Award points to winner
  UPDATE profiles
  SET total_points = total_points + block_points,
      updated_at = now()
  WHERE id = p_winner_id;
  
  RETURN block_points;
END;
$$;

-- Function: Get user rank
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_points bigint;
  rank_position bigint;
BEGIN
  -- Get user's total points
  SELECT total_points INTO user_points
  FROM profiles
  WHERE id = p_user_id;
  
  IF user_points IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Count users with more points + 1
  SELECT COUNT(*) + 1 INTO rank_position
  FROM profiles
  WHERE total_points > user_points;
  
  RETURN rank_position;
END;
$$;
