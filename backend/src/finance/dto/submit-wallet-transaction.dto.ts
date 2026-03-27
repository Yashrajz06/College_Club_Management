import { TransactionType } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class SubmitWalletTransactionDto {
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

  @IsString()
  note!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  signedTransactions!: string[];

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  sponsorId?: string;
}
