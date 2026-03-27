import { IsOptional, IsString } from 'class-validator';

export class ReleaseSpendRequestDto {
  @IsOptional()
  @IsString()
  beneficiaryWalletAddress?: string;
}
