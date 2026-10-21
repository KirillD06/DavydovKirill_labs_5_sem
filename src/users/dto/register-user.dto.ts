import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'engineer', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  login: string;

  @ApiProperty({ example: 'pass1234', minLength: 4, maxLength: 100, format: 'password' })
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  password: string;
}
