import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { REQUIRE_USER } from './require-user.decorator';
import { SessionService } from './session.service';
import type { UserRequest } from './user-request';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UserRequest>();
    const userId = await this.sessions.find(request.cookies?.sessionId);
    if (userId) {
      request.currentUser = (await this.users.findOneBy({ id: userId })) ?? undefined;
    }
    if (this.reflector.getAllAndOverride<boolean>(REQUIRE_USER, [context.getHandler(), context.getClass()])
      && !request.currentUser) {
      throw new UnauthorizedException('Войдите в систему');
    }
    return true;
  }
}
