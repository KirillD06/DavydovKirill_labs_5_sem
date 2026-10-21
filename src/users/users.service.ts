import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash, compare } from 'bcryptjs';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async register(login: string, password: string): Promise<User> {
    if (await this.users.existsBy({ login })) {
      throw new BadRequestException('Пользователь с таким логином уже есть');
    }
    try {
      return await this.users.save(this.users.create({ login, password: await hash(password, 12) }));
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException('Пользователь с таким логином уже есть');
      }
      throw error;
    }
  }

  async authenticate(login: string, password: string): Promise<User> {
    const user = await this.users.createQueryBuilder('user')
      .addSelect('user.password').where('user.login = :login', { login }).getOne();
    const valid = await compare(password, user?.password ?? '$2b$12$Lg7lW0TPsXLyNPLJTxLB8OBhXQzdxMWrKxY1sW4p8a1qIh7CSssSK');
    if (!user || !valid) throw new UnauthorizedException('Неверный логин или пароль');
    return user;
  }
}
