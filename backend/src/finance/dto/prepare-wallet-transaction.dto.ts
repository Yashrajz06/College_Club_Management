import { BlockchainActionType, CollegeContractType, TransactionType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class PrepareWalletTransactionDto {
  @IsUUID()
  clubId!: string;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsNumber()
  @Min(0.000001)
  amount!: number;

  @IsString()
  description!: string;

  @IsString()
  walletAddress!: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  sponsorId?: string;

  @IsOptional()
  @IsEnum(BlockchainActionType)
  action?: BlockchainActionType;

  @IsOptional()
  @IsEnum(CollegeContractType)
  contractType?: CollegeContractType;
}
