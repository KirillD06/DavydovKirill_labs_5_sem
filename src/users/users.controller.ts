import { Body, Controller, Get, HttpCode, Post, Render, Req, Res } from '@nestjs/common';
import { ApiBody, ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiCreatedResponse, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import type { UserRequest } from '../session/user-request';
import { SessionService } from '../session/session.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Пользователи')
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService, private readonly sessions: SessionService) {}

  @Get('users/login')
  @Render('login')
  @ApiExcludeEndpoint()
  page(@Req() request: UserRequest) {
    return { user: request.currentUser };
  }

  @Post('api/users/register')
  @ApiOperation({ summary: '8. Зарегистрировать пользователя' })
  @ApiBody({ type: RegisterUserDto })
  @ApiCreatedResponse({ type: UserResponseDto })
  async register(@Body() dto: RegisterUserDto): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(await this.users.register(dto.login, dto.password));
  }

  @Post('api/users/login')
  @HttpCode(200)
  @ApiOperation({ summary: '9. Войти и установить cookie sessionId' })
  @ApiBody({ type: LoginUserDto })
  @ApiOkResponse({ type: UserResponseDto, headers: { 'Set-Cookie': { schema: { type: 'string' }, description: 'sessionId; HttpOnly; SameSite=Lax; Path=/' } } })
  @ApiUnauthorizedResponse({ description: 'Неверный логин или пароль' })
  async login(@Body() dto: LoginUserDto, @Req() request: UserRequest,
    @Res({ passthrough: true }) response: Response): Promise<UserResponseDto> {
    const user = await this.users.authenticate(dto.login, dto.password);
    const sessionId = await this.sessions.create(user.id);
    await this.sessions.destroy(request.cookies?.sessionId);
    response.cookie('sessionId', sessionId, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      maxAge: this.sessions.ttl * 1000, path: '/',
    });
    return UserResponseDto.fromEntity(user);
  }

  @Post('api/users/logout')
  @HttpCode(204)
  @ApiOperation({ summary: '10. Выйти и удалить сессию из Redis' })
  @ApiNoContentResponse({ description: 'Сессия удалена, cookie очищена' })
  async logout(@Req() request: UserRequest, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.sessions.destroy(request.cookies?.sessionId);
    response.clearCookie('sessionId', { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  }
}
