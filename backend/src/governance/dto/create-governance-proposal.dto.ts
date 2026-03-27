import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateGovernanceProposalDto {
  @IsUUID()
  eventId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;
}
