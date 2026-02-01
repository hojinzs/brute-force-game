import { CommandFactory } from 'nest-commander';
import { CliModule } from './cli/cli.module';

async function bootstrap() {
  try {
    await CommandFactory.run(CliModule);
  } catch (error) {
    console.error('CLI Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Bootstrap Error:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});
