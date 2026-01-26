ALTER TABLE attempts 
ADD COLUMN is_first_submission BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX attempts_block_input_idx ON attempts(block_id, input_value);
