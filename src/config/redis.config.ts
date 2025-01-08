import Redis from 'ioredis';

export class RedisConfigService {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.client.on('error', err => {
      console.error('Redis connection error:', err);
    });
  }

  getClient(): Redis {
    return this.client;
  }
}
