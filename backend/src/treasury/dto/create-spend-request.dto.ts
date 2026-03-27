import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSpendRequestDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsUUID()
  clubId!: string;

  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsString()
  beneficiaryName?: string;

  @IsOptional()
  @IsString()
  beneficiaryWalletAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  timelockHours?: number;

  @IsOptional()
  @IsString()
  voteDeadline?: string;
}
