DROP VIEW IF EXISTS block_history_view;

-- View: block_history_view
-- Purpose:
--   Provides a historical summary of solved blocks, including metadata
--   about the block itself, winning player, solved answer, and
--   aggregated engagement metrics.
-- Data:
--   - One row per block with status = 'solved'
--   - Block fields: id, status, seed_hint, created_at, solved_at,
--     winner_id, accumulated_points, solved_attempt_id
--   - Winner nickname from profiles (if available)
--   - Solved answer value from the solving attempt (if available)
--   - Aggregated statistics from attempts:
--       * total_attempts: total number of attempts for block
--       * unique_participants: distinct users who attempted block
-- Filtering and ordering:
--   - Includes only blocks where status = 'solved'
--   - Results are ordered by solved_at in descending order so that
--     most recently solved blocks appear first.
CREATE VIEW block_history_view AS
SELECT
  b.id AS block_id,
  b.status,
  b.seed_hint,
  b.created_at,
  b.solved_at,
  b.winner_id,
  b.accumulated_points,
  b.solved_attempt_id,
  p.nickname AS winner_nickname,
  sa.input_value AS solved_answer,
  stats.total_attempts,
  stats.unique_participants
FROM blocks b
LEFT JOIN profiles p ON b.winner_id = p.id
LEFT JOIN attempts sa ON b.solved_attempt_id = sa.id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS total_attempts,
    COUNT(DISTINCT a.user_id) AS unique_participants
  FROM attempts a
  WHERE a.block_id = b.id
) stats ON true
WHERE b.status = 'solved'
ORDER BY b.solved_at DESC;

GRANT SELECT ON block_history_view TO authenticated, anon;
