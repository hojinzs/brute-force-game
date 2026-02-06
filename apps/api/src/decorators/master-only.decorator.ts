import { SetMetadata } from '@nestjs/common';

export const MASTER_ONLY_KEY = 'masterOnly';
export const MasterOnly = () => SetMetadata(MASTER_ONLY_KEY, true);
