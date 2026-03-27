import { SetMetadata } from '@nestjs/common';
import { BlockchainActionType } from '@prisma/client';

export const TOKEN_GATE_KEY = 'tokenGate';
export const TokenGate = (...actions: BlockchainActionType[]) => SetMetadata(TOKEN_GATE_KEY, actions);
