import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'user1', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  login: string;

  @ApiProperty({ example: 'pass1', format: 'password', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password: string;
}
