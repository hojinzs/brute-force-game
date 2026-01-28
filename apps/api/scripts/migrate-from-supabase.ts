import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/brute_force';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Prisma client
const pool = new Pool({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

interface SupabaseProfile {
  id: string;
  nickname: string;
  cp_count: number;
  total_points: number;
  is_anonymous: boolean;
  email?: string;
  country?: string;
  email_consent: boolean;
  email_consent_at?: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseBlock {
  id: number;
  status: string;
  seed_hint?: string;
  difficulty_config: any;
  answer_hash: string;
  answer_plaintext?: string;
  winner_id?: string;
  accumulated_points: number;
  previous_block_id?: number;
  solved_attempt_id?: string;
  created_at: string;
  solved_at?: string;
}

interface SupabaseAttempt {
  id: string;
  block_id: number;
  user_id: string;
  input_value: string;
  similarity: number;
  is_first_submission: boolean;
  created_at: string;
}

// Migration functions
async function migrateProfiles() {
  console.log('👥 Migrating profiles...');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }

  if (!profiles || profiles.length === 0) {
    console.log('ℹ️  No profiles found in Supabase');
    return [];
  }

  const migratedUsers = await prisma.user.createMany({
    data: profiles.map((profile: SupabaseProfile) => ({
      id: profile.id,
      email: profile.email,
      nickname: profile.nickname,
      isAnonymous: profile.is_anonymous,
      cpCount: profile.cp_count,
      totalPoints: BigInt(profile.total_points),
      country: profile.country,
      emailConsent: profile.email_consent,
      emailConsentAt: profile.email_consent_at ? new Date(profile.email_consent_at) : null,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
      // Note: passwordHash will be null for migrated users (they'll need to reset)
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Migrated ${migratedUsers.count} profiles`);
  return profiles;
}

async function migrateBlocks() {
  console.log('🧩 Migrating blocks...');
  
  const { data: blocks, error } = await supabase
    .from('blocks')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching blocks:', error);
    throw error;
  }

  if (!blocks || blocks.length === 0) {
    console.log('ℹ️  No blocks found in Supabase');
    return [];
  }

  const migratedBlocks = await prisma.block.createMany({
    data: blocks.map((block: SupabaseBlock) => ({
      id: BigInt(block.id),
      status: block.status as any,
      seedHint: block.seed_hint,
      difficultyConfig: block.difficulty_config,
      answerHash: block.answer_hash,
      answerPlaintext: block.answer_plaintext,
      winnerId: block.winner_id,
      accumulatedPoints: BigInt(block.accumulated_points),
      previousBlockId: block.previous_block_id ? BigInt(block.previous_block_id) : null,
      solvedAttemptId: block.solved_attempt_id,
      createdAt: new Date(block.created_at),
      solvedAt: block.solved_at ? new Date(block.solved_at) : null,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Migrated ${migratedBlocks.count} blocks`);
  return blocks;
}

async function migrateAttempts() {
  console.log('📝 Migrating attempts...');
  
  const { data: attempts, error } = await supabase
    .from('attempts')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching attempts:', error);
    throw error;
  }

  if (!attempts || attempts.length === 0) {
    console.log('ℹ️  No attempts found in Supabase');
    return;
  }

  // Convert block_id to BigInt
  const migratedAttempts = await prisma.attempt.createMany({
    data: attempts.map((attempt: SupabaseAttempt) => ({
      id: attempt.id,
      blockId: BigInt(attempt.block_id),
      userId: attempt.user_id,
      inputValue: attempt.input_value,
      similarity: attempt.similarity,
      isFirstSubmission: attempt.is_first_submission,
      createdAt: new Date(attempt.created_at),
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Migrated ${migratedAttempts.count} attempts`);
}

// Main migration function
async function runMigration() {
  try {
    console.log('🚀 Starting Supabase to PostgreSQL migration...');
    console.log('');

    // Connect to database
    await prisma.$connect();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.attempt.deleteMany();
    await prisma.session.deleteMany();
    await prisma.block.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Existing data cleared');

    // Migrate data in order
    const profiles = await migrateProfiles();
    await migrateBlocks();
    await migrateAttempts();

    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`   Users: ${profiles.length}`);
    console.log(`   Note: Migrated users will need to reset passwords`);
    console.log('   Password hashes cannot be migrated for security reasons');
    console.log('');
    console.log('⚠️  Important Notes:');
    console.log('   1. All migrated users must reset their passwords');
    console.log('   2. Sessions were not migrated (users need to re-login)');
    console.log('   3. Verify data integrity after migration');
    console.log('   4. Update frontend to use new API endpoints');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  // Check environment variables
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL');
    console.error('   SUPABASE_ANON_KEY');
    console.error('   DATABASE_URL');
    process.exit(1);
  }

  runMigration();
}

export { runMigration };
