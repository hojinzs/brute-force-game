-- ============================================
-- ATTEMPTS UNIQUE CONSTRAINT
-- ============================================
-- Prevent duplicate input_value per block
-- Ensures is_first_submission flag accuracy

CREATE UNIQUE INDEX IF NOT EXISTS attempts_block_input_unique 
ON attempts(block_id, input_value);
