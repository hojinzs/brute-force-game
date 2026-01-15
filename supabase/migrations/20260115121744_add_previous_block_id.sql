ALTER TABLE blocks 
ADD COLUMN previous_block_id bigint REFERENCES blocks(id) ON DELETE SET NULL;

CREATE INDEX blocks_previous_block_id_idx ON blocks(previous_block_id);

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
  prev.winner_id AS created_by
FROM blocks b
LEFT JOIN blocks prev ON b.previous_block_id = prev.id;

GRANT SELECT ON blocks_public TO authenticated, anon;
