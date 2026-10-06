import { User } from '../../entities/user.entity';

export class UserResponseDto {
  id: number;
  login: string;
  isModerator: boolean;

  static fromEntity(user: User): UserResponseDto {
    return {
      id: user.id,
      login: user.login,
      isModerator: user.isModerator,
    };
  }
}
