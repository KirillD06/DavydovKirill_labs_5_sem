import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(await this.usersService.register(dto.login, dto.password));
  }

  @Post('login')
  @HttpCode(200)
  async login(): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(await this.usersService.findCurrent());
  }

  @Post('logout')
  @HttpCode(204)
  logout(): void {}
}
