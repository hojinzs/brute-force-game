import { Command, CommandRunner, Option } from 'nest-commander';
import { PrismaService } from '../shared/database/prisma.service';

interface PromoteMasterOptions {
  email?: string;
  userId?: string;
}

@Command({
  name: 'promote-master',
  description: 'Promote a user to MASTER role',
})
export class PromoteMasterCommand extends CommandRunner {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async run(passedParams: string[], options: PromoteMasterOptions): Promise<void> {
    try {
      const { email, userId } = options;

      if (!email && !userId) {
        console.error('Error: --email or --userId is required');
        process.exit(1);
      }

      const where = email ? { email } : { id: userId };
      const user = await this.prisma.user.findUnique({ where: where as any });

      if (!user) {
        console.error(`Error: User not found (${email ? `email: ${email}` : `id: ${userId}`})`);
        process.exit(1);
      }

      if (user.role === 'MASTER') {
        console.log(`User "${user.nickname}" is already a MASTER.`);
        process.exit(0);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'MASTER' },
      });

      // Invalidate all sessions to force re-login with new role in JWT
      const deleted = await this.prisma.session.deleteMany({
        where: { userId: user.id },
      });

      console.log(`\n✓ User promoted to MASTER successfully!`);
      console.log(`  Nickname: ${user.nickname}`);
      console.log(`  Email: ${user.email || '(anonymous)'}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Sessions invalidated: ${deleted.count}`);
      console.log(`\nThe user will need to re-login to get the updated role.`);

      process.exit(0);
    } catch (error) {
      console.error('\n✗ Error promoting user:');
      console.error(error.message);
      process.exit(1);
    }
  }

  @Option({
    flags: '--email <string>',
    description: 'User email to promote',
  })
  parseEmail(val: string): string {
    return val;
  }

  @Option({
    flags: '--userId <string>',
    description: 'User ID to promote',
  })
  parseUserId(val: string): string {
    return val;
  }
}
