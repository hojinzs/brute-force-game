-- ============================================
-- UPDATE INSERT_ATTEMPT_ATOMIC FUNCTION
-- ============================================
-- Purpose: Always insert new rows (allow duplicates) for Live Feed
-- Uses advisory lock to prevent race condition on is_first_submission flag

CREATE OR REPLACE FUNCTION insert_attempt_atomic(
  p_block_id BIGINT,
  p_user_id UUID,
  p_input_value TEXT,
  p_similarity FLOAT
)
RETURNS TABLE(attempt_id UUID, is_first BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_attempt_id UUID;
  v_is_first BOOLEAN;
  v_lock_key BIGINT;
BEGIN
  -- Acquire transaction-level lock for (block_id, input_value)
  v_lock_key := hashtextextended(p_input_value, p_block_id);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Check if this input_value already exists for this block (only check first submissions)
  SELECT NOT EXISTS(
    SELECT 1
    FROM attempts
    WHERE block_id = p_block_id
      AND input_value = p_input_value
      AND is_first_submission = true
  ) INTO v_is_first;

  -- Always insert a new row (allow duplicates)
  INSERT INTO attempts (block_id, user_id, input_value, similarity, is_first_submission)
  VALUES (p_block_id, p_user_id, p_input_value, p_similarity, v_is_first)
  RETURNING id INTO v_attempt_id;

  RETURN QUERY SELECT v_attempt_id, v_is_first;
END;
$func$;
