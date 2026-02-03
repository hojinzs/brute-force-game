-- DropIndex
DROP INDEX IF EXISTS "attempts_block_id_user_id_input_value_key";

-- CreateIndex
CREATE INDEX "attempts_block_id_user_id_input_value_idx"
ON "attempts"("block_id", "user_id", "input_value");
