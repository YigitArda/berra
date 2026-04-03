import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFeedDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  body!: string;
}
