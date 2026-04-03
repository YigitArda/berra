import { IsEmail, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;
}
