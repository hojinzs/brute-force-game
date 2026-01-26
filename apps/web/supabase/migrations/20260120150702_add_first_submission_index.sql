-- ============================================
-- ADD PERFORMANCE INDEXES FOR FIRST SUBMISSION
-- ============================================
-- Supports is_first_submission lookup and TOP ATTEMPTS sorting

CREATE INDEX IF NOT EXISTS attempts_first_submission_lookup_idx
ON attempts(block_id, input_value)
WHERE is_first_submission = true;

CREATE INDEX IF NOT EXISTS attempts_top_attempts_idx
ON attempts(block_id, similarity DESC)
WHERE is_first_submission = true;
