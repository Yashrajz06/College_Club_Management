import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class InviteCoordinatorDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
