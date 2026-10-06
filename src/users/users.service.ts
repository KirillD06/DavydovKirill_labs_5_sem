import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getCurrentUserId } from '../current-user';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(login: string, password: string): Promise<User> {
    if (await this.userRepository.existsBy({ login })) {
      throw new BadRequestException('Пользователь с таким логином уже есть');
    }

    return this.userRepository.save(this.userRepository.create({ login, password }));
  }

  async findCurrent(): Promise<User> {
    return (await this.userRepository.findOneBy({ id: getCurrentUserId() }))!;
  }
}
