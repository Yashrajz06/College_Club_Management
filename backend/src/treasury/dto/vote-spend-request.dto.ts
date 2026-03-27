import { IsBoolean } from 'class-validator';

export class VoteSpendRequestDto {
  @IsBoolean()
  voteFor!: boolean;
}
