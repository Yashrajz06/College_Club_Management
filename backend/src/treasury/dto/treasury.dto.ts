import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

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

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsString()
  beneficiaryName?: string;

  @IsOptional()
  @IsString()
  beneficiaryWalletAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  timelockHours?: number;

  @IsOptional()
  @IsString()
  deadline?: string;
}

export class UploadReceiptDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class VoteSpendRequestDto {
  @IsBoolean()
  voteFor!: boolean;
}
