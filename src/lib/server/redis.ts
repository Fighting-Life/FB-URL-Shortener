import { Redis } from '@upstash/redis';
import type { RequestEvent } from '@sveltejs/kit';
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from '$env/static/private';
import { ServerBase } from './server.js';

export class RedisClient extends ServerBase {
  public redisClient?: Redis | null = null;

  constructor(event: RequestEvent) {
    super(event);
    this.initRedis();
  }

  private initRedis() {

    if (!this.redisClient) {
      this.redisClient = new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN
      });
      this.event.locals.redis = this;
    }
  }

  async set(key: string, value: any): Promise<string | null> {
    if (!this.redisClient) return null;
    const data = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return await this.redisClient.set(key, data);
  }

  async setex(key: string, seconds: number, value: any): Promise<string | null> {
    if (!this.redisClient) return null;
    const data = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return await this.redisClient.set(key, data, { ex: seconds });
  }

  async setnx(key: string, seconds: number, value: any): Promise<string | null> {
    if (!this.redisClient) return null;
    const data = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return await this.redisClient.set(key, data, { ex: seconds, nx: true });
  }

  async get<T = any>(key: string): Promise<T | string | null> {
    if (!this.redisClient) return null;
    const data = await this.redisClient.get<string>(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data;
    }
  }

  async delete(...keys: string[]): Promise<number> {
    if (!this.redisClient || keys.length === 0) return 0;
    return await this.redisClient.del(...keys);
  }

  async flush(): Promise<string | null> {
    if (!this.redisClient) return null;
    return await this.redisClient.flushdb();
  }

  async exists(key: string): Promise<number> {
    if (!this.redisClient) return 0;
    return await this.redisClient.exists(key);
  }

  async ttl(key: string): Promise<number> {
    if (!this.redisClient) return -2;
    return await this.redisClient.ttl(key);
  }

  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.redisClient) return 0;

    let deletedCount = 0;
    let cursor = 0;

    do {
      const [nextCursor, keys] = await this.redisClient.scan(cursor, { match: pattern, count: 100 });
      cursor = Number(nextCursor);

      if (keys.length > 0) {
        const deleted = await this.redisClient.del(...keys);
        deletedCount += deleted;
      }
    } while (cursor !== 0);

    console.log(
      `[CACHE INVALIDATION] Successfully deleted ${deletedCount} key with pattern: "${pattern}"`
    );
    return deletedCount;
  }

  async rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
    if (!this.redisClient) return true;
    const bucket = `rl:${key}`;
    const count = await this.redisClient.incr(bucket);
    if (count === 1) {
      await this.redisClient.expire(bucket, windowSec);
    }
    return count <= limit;
  }
}
