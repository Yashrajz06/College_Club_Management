import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateGovernanceProposalDto {
  @IsUUID()
  eventId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsNumber()
  spendAmount?: number;

  @IsOptional()
  @IsString()
  deadline?: string;
}

export class CastVoteDto {
  @IsBoolean()
  voteFor!: boolean;
}
