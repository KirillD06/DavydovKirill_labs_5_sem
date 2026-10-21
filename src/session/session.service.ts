import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly redis: Redis;
  readonly ttl = 3600;

  constructor(config: ConfigService) {
    this.redis = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: Number(config.get('REDIS_PORT', 6379)),
      password: config.get('REDIS_PASSWORD', 'password'),
      maxRetriesPerRequest: 1,
    });
  }

  async create(userId: number): Promise<string> {
    const sessionId = randomBytes(32).toString('hex');
    await this.redis.set(`session:${sessionId}`, String(userId), 'EX', this.ttl);
    return sessionId;
  }

  async find(sessionId?: string): Promise<number | null> {
    if (typeof sessionId !== 'string' || !/^[a-f0-9]{64}$/.test(sessionId)) return null;
    const value = await this.redis.get(`session:${sessionId}`);
    return value ? Number(value) : null;
  }

  async destroy(sessionId?: string): Promise<void> {
    if (typeof sessionId === 'string' && /^[a-f0-9]{64}$/.test(sessionId)) {
      await this.redis.del(`session:${sessionId}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
