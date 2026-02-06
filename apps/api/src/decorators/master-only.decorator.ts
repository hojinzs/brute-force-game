import { applyDecorators, UseGuards } from '@nestjs/common';
import { MasterGuard } from '../guards/master.guard';

export function MasterOnly() {
  return applyDecorators(UseGuards(MasterGuard));
}
