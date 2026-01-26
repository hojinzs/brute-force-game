-- Add foreign key constraint to solved_attempt_id column
-- This migration adds referential integrity to the blocks.solved_attempt_id column
-- which was added without a foreign key constraint in the initial schema
-- Migration must be deployed before updating check-answer Edge Function code

ALTER TABLE blocks
ADD CONSTRAINT fk_solved_attempt
FOREIGN KEY (solved_attempt_id)
REFERENCES attempts(id)
ON DELETE SET NULL;
