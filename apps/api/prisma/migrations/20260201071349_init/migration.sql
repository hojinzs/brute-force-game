-- CreateEnum
CREATE TYPE "BlockStatus" AS ENUM ('WAITING_HINT', 'WAITING_PASSWORD', 'ACTIVE', 'SOLVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "nickname" TEXT NOT NULL,
    "password_hash" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "cp_count" INTEGER NOT NULL DEFAULT 50,
    "last_cp_refill_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_points" BIGINT NOT NULL DEFAULT 0,
    "country" TEXT,
    "email_consent" BOOLEAN NOT NULL DEFAULT false,
    "email_consent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" BIGSERIAL NOT NULL,
    "status" "BlockStatus" NOT NULL DEFAULT 'ACTIVE',
    "seed_hint" TEXT,
    "difficulty_config" JSONB NOT NULL,
    "answer_hash" TEXT,
    "answer_plaintext" TEXT,
    "winner_id" TEXT,
    "block_master_id" TEXT,
    "waiting_started_at" TIMESTAMP(3),
    "password_retry_count" INTEGER NOT NULL DEFAULT 0,
    "accumulated_points" BIGINT NOT NULL DEFAULT 0,
    "previous_block_id" BIGINT,
    "solved_attempt_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solved_at" TIMESTAMP(3),

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" TEXT NOT NULL,
    "block_id" BIGINT NOT NULL,
    "user_id" TEXT NOT NULL,
    "input_value" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "is_first_submission" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_previous_block_id_key" ON "blocks"("previous_block_id");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_solved_attempt_id_key" ON "blocks"("solved_attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempts_block_id_user_id_input_value_key" ON "attempts"("block_id", "user_id", "input_value");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_block_master_id_fkey" FOREIGN KEY ("block_master_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_previous_block_id_fkey" FOREIGN KEY ("previous_block_id") REFERENCES "blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_solved_attempt_id_fkey" FOREIGN KEY ("solved_attempt_id") REFERENCES "attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
