-- ============================================
-- REMOVE ATTEMPTS UNIQUE CONSTRAINT
-- ============================================
-- Purpose: Allow duplicate input_value per block for Live Feed
-- Live Feed should show ALL attempts including duplicates
-- TOP ATTEMPTS will still filter using is_first_submission flag

DROP INDEX IF EXISTS attempts_block_input_unique;
