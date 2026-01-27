-- Database initialization script for brute-force-game
-- This script runs when the PostgreSQL container starts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE "BlockStatus" AS ENUM ('ACTIVE', 'PENDING', 'PROCESSING', 'SOLVED');
CREATE TYPE "CharsetType" AS ENUM ('lowercase', 'uppercase', 'alphanumeric', 'symbols');

-- Set up timezone
SET timezone = 'UTC';

-- Grant permissions to the postgres user
GRANT ALL PRIVILEGES ON DATABASE brute_force TO postgres;