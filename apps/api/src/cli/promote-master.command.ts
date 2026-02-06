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
        console.error('Error: Either --email or --userId is required');
        process.exit(1);
      }

      let user;
      if (email) {
        user = await this.prisma.user.findUnique({
          where: { email },
          select: { id: true, nickname: true, email: true, role: true },
        });

        if (!user) {
          console.error(`Error: User with email "${email}" not found`);
          process.exit(1);
        }
      } else if (userId) {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, nickname: true, email: true, role: true },
        });

        if (!user) {
          console.error(`Error: User with ID "${userId}" not found`);
          process.exit(1);
        }
      }

      if (user.role === 'MASTER') {
        console.log(`User "${user.nickname}" is already a MASTER`);
        return;
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'MASTER' },
      });

      await this.prisma.session.deleteMany({
        where: { userId: user.id },
      });

      console.log('✓ User successfully promoted to MASTER');
      console.log(`  Nickname: ${user.nickname}`);
      console.log(`  Email: ${user.email || 'N/A'}`);
      console.log(`  User ID: ${user.id}`);
      console.log('  All existing sessions have been invalidated');
    } catch (error) {
      console.error('Failed to promote user:', error.message);
      process.exit(1);
    }
  }

  @Option({
    flags: '--email <email>',
    description: 'Email of the user to promote',
  })
  parseEmail(val: string): string {
    return val;
  }

  @Option({
    flags: '--userId <userId>',
    description: 'User ID of the user to promote',
  })
  parseUserId(val: string): string {
    return val;
  }
}
