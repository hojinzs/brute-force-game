import { PrismaService } from '../src/shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';

// Migration script to seed or transfer legacy data into PostgreSQL
async function runMigration() {
  const prismaService = new PrismaService();

  try {
    await prismaService.onModuleInit();
    console.log('🚀 Starting data migration to PostgreSQL...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prismaService.attempt.deleteMany();
    await prismaService.session.deleteMany();
    await prismaService.block.deleteMany();
    await prismaService.user.deleteMany();
    console.log('✅ Existing data cleared');

    // Migrate Users
    console.log('👥 Migrating users...');
    // TODO: Replace with actual legacy data source connection
    // For now, create a default admin user
    const adminUser = await prismaService.user.create({
      data: {
        id: 'admin-migrated-user',
        email: 'admin@brute-force.dev',
        nickname: 'admin',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2Ej7W', // 'admin123'
        isAnonymous: false,
        cpCount: 100,
        totalPoints: BigInt(0),
        country: 'KR',
        emailConsent: true,
        emailConsentAt: new Date(),
      },
    });
    console.log(`✅ Admin user created: ${adminUser.nickname}`);

    // Migrate Blocks
    console.log('🧩 Migrating blocks...');
    // TODO: Replace with actual legacy data fetch
    // For now, create a sample block
    const sampleBlock = await prismaService.block.create({
      data: {
        status: 'ACTIVE',
        seedHint: '4자리 (소문자)',
        difficultyConfig: {
          length: 4,
          charset: ['lowercase'],
        },
        answerHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        answerPlaintext: 'test', // For demo purposes only
        accumulatedPoints: BigInt(100),
      },
    });
    console.log(`✅ Sample block created: ${sampleBlock.id}`);

    // Create a sample attempt
    console.log('📝 Creating sample attempts...');
    const sampleAttempt = await prismaService.attempt.create({
      data: {
        blockId: sampleBlock.id,
        userId: adminUser.id,
        inputValue: 'guess',
        similarity: 75.5,
        isFirstSubmission: true,
      },
    });
    console.log(`✅ Sample attempt created: ${sampleAttempt.id}`);

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`   Users: 1 (admin)`);
    console.log(`   Blocks: 1 (sample)`);
    console.log(`   Attempts: 1 (sample)`);
    console.log('');
    console.log('⚠️  Note: This is a sample migration.');
    console.log('   To migrate real data, update this script to');
    console.log('   connect to your legacy data source and fetch data.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prismaService.onModuleDestroy();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

export { runMigration };
