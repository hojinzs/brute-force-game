import { PrismaClient } from './generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  console.log('Seeding database...');

  // Create a test admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@brute-force.dev' },
    update: {},
    create: {
      email: 'admin@brute-force.dev',
      nickname: 'admin',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2Ej7W', // 'admin123'
      isAnonymous: false,
      cpCount: 100,
      totalPoints: BigInt(0),
      country: 'KR',
      emailConsent: true,
    },
  });

  // Create a test anonymous user
  const anonymousUser = await prisma.user.upsert({
    where: { id: 'anonymous-test-user' },
    update: {},
    create: {
      id: 'anonymous-test-user',
      nickname: 'anonymous_test',
      isAnonymous: true,
      cpCount: 5,
      totalPoints: BigInt(0),
    },
  });

  console.log('Database seeded successfully!');
  console.log('Admin user:', adminUser);
  console.log('Anonymous user:', anonymousUser);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
