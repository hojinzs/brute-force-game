DROP VIEW IF EXISTS block_history_view;

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
  stats.total_attempts,
  stats.unique_participants
FROM blocks b
LEFT JOIN profiles p ON b.winner_id = p.id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS total_attempts,
    COUNT(DISTINCT a.user_id) AS unique_participants
  FROM attempts a
  WHERE a.block_id = b.id
) stats ON true;

GRANT SELECT ON block_history_view TO authenticated, anon;
