DROP VIEW IF EXISTS attempts_with_nickname;

CREATE VIEW attempts_with_nickname AS
SELECT 
  a.id,
  a.block_id,
  a.user_id,
  a.input_value,
  a.similarity,
  a.created_at,
  a.is_first_submission,
  p.nickname
FROM attempts a
LEFT JOIN profiles p ON a.user_id = p.id;

GRANT SELECT ON attempts_with_nickname TO authenticated, anon;
