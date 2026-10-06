import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  login: string;

  @IsString()
  @MinLength(4)
  @MaxLength(100)
  password: string;
}
