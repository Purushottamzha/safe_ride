import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;

  async connectToRedis(configService: ConfigService): Promise<void> {
    const redisUrl = configService.get<string>('redis.url') || 'redis://default:saferide_redis_2024@localhost:6379';

    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.ping(), subClient.ping()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: Record<string, unknown>): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
