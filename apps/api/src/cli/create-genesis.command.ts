import { Command, CommandRunner, Option } from 'nest-commander';
import { BlocksService } from '../blocks/blocks.service';
import { CharsetType } from '../shared/utils/types';

interface CreateGenesisOptions {
  password: string;
  hint: string;
  length?: number;
  charset?: string;
}

@Command({
  name: 'create-genesis',
  description: 'Create the genesis block (admin only)',
})
export class CreateGenesisCommand extends CommandRunner {
  constructor(private readonly blocksService: BlocksService) {
    super();
  }

  async run(passedParams: string[], options: CreateGenesisOptions): Promise<void> {
    try {
      const { password, hint, length, charset } = options;

      if (!password) {
        console.error('Error: --password is required');
        process.exit(1);
      }

      if (!hint) {
        console.error('Error: --hint is required');
        process.exit(1);
      }

      const detectedLength = length || password.length;
      const detectedCharset = charset 
        ? this.parseCharset(charset) 
        : this.detectCharset(password);

      const difficultyConfig = {
        length: detectedLength,
        charset: detectedCharset,
      };

      console.log('Creating genesis block...');
      console.log(`Password length: ${detectedLength}`);
      console.log(`Detected charset: ${detectedCharset.join(', ')}`);

      const block = await this.blocksService.createGenesisBlock(
        password,
        hint,
        difficultyConfig,
      );

      console.log('\n✓ Genesis block created successfully!');
      console.log(`Block ID: ${block.id}`);
      console.log(`Status: ${block.status}`);
      console.log(`Hint: ${block.seedHint}`);
      console.log(`Difficulty: length=${difficultyConfig.length}, charset=[${difficultyConfig.charset.join(', ')}]`);
      
      process.exit(0);
    } catch (error) {
      console.error('\n✗ Error creating genesis block:');
      console.error(error.message);
      process.exit(1);
    }
  }

  @Option({
    flags: '--password <string>',
    description: 'The password to crack (required)',
    required: true,
  })
  parsePassword(val: string): string {
    return val;
  }

  @Option({
    flags: '--hint <string>',
    description: 'A hint for players (required)',
    required: true,
  })
  parseHint(val: string): string {
    return val;
  }

  @Option({
    flags: '--length <number>',
    description: 'Override password length in difficulty config (optional)',
  })
  parseLength(val: string): number {
    return parseInt(val, 10);
  }

  @Option({
    flags: '--charset <string>',
    description: 'Override charset (comma-separated: lowercase,uppercase,alphanumeric,symbols)',
  })
  parseCharsetOption(val: string): string {
    return val;
  }

  private parseCharset(charsetString: string): CharsetType[] {
    const validCharsets: CharsetType[] = ['lowercase', 'uppercase', 'alphanumeric', 'symbols'];
    const charsets = charsetString.split(',').map(c => c.trim()) as CharsetType[];
    
    for (const charset of charsets) {
      if (!validCharsets.includes(charset)) {
        throw new Error(`Invalid charset: ${charset}. Valid options: ${validCharsets.join(', ')}`);
      }
    }
    
    return charsets;
  }

  private detectCharset(password: string): CharsetType[] {
    const charsets: CharsetType[] = [];
    
    if (/[a-z]/.test(password)) {
      charsets.push('lowercase');
    }
    
    if (/[A-Z]/.test(password)) {
      charsets.push('uppercase');
    }
    
    if (/[0-9]/.test(password)) {
      if (!charsets.includes('lowercase') && !charsets.includes('uppercase')) {
        charsets.push('alphanumeric');
      } else {
        charsets.push('alphanumeric');
      }
    }
    
    if (/[^a-zA-Z0-9]/.test(password)) {
      charsets.push('symbols');
    }
    
    if (charsets.length === 0) {
      charsets.push('lowercase');
    }
    
    return charsets;
  }
}
