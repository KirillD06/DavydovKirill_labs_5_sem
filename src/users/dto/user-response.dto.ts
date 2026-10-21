import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({})
  id: number;
  @ApiProperty({})
  login: string;
  @ApiProperty({})
  isModerator: boolean;

  static fromEntity(user: User): UserResponseDto {
    return {
      id: user.id,
      login: user.login,
      isModerator: user.isModerator,
    };
  }
}
