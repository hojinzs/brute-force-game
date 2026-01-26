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
  v_existing_id UUID;
BEGIN
  SELECT id INTO v_existing_id
  FROM attempts 
  WHERE block_id = p_block_id 
    AND input_value = p_input_value
  LIMIT 1;
  
  v_is_first := v_existing_id IS NULL;
  
  INSERT INTO attempts (block_id, user_id, input_value, similarity, is_first_submission)
  VALUES (p_block_id, p_user_id, p_input_value, p_similarity, v_is_first)
  ON CONFLICT (block_id, input_value) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        similarity = EXCLUDED.similarity,
        created_at = now()
  RETURNING id, FALSE INTO v_attempt_id, v_is_first;
  
  RETURN QUERY SELECT v_attempt_id, v_is_first;
END;
$func$;
