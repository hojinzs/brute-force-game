-- ============================================
-- ADD 'processing' AND 'solved' TO block_status ENUM
-- ============================================

-- PostgreSQL doesn't allow direct ALTER TYPE for enum, so we need to:
-- 1. Add new values to the enum type
-- 2. These values will be available for use immediately

-- Add 'processing' status
ALTER TYPE block_status ADD VALUE 'processing';

-- Add 'solved' status
ALTER TYPE block_status ADD VALUE 'solved';

-- Note: Enum values cannot be removed once added in PostgreSQL
-- The order of enum values is: 'active', 'pending', 'processing', 'solved'
