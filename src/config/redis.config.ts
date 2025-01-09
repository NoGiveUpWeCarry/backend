import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisConfig {
  public static readonly host = process.env.REDIS_HOST || 'localhost';
  public static readonly port = parseInt(process.env.REDIS_PORT, 10) || 6379;
  public static readonly password = process.env.REDIS_PASSWORD || undefined;
}
