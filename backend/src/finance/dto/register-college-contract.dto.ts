import { CollegeContractType } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class RegisterCollegeContractDto {
  @IsEnum(CollegeContractType)
  type!: CollegeContractType;

  @IsOptional()
  @IsString()
  appId?: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  deployedTxId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
