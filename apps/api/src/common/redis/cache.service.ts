import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'

export const REDIS_CLIENT = Symbol('REDIS_CLIENT')

@Injectable()
export class CacheService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key)
    return raw == null ? null : (JSON.parse(raw) as T)
  }

  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    const raws = await this.redis.mget(...keys)
    return raws.map(r => (r == null ? null : (JSON.parse(r) as T)))
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value)
    if (ttlSeconds) await this.redis.set(key, raw, 'EX', ttlSeconds)
    else await this.redis.set(key, raw)
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }

  incr(key: string): Promise<number> {
    return this.redis.incr(key)
  }

  onModuleDestroy(): void {
    this.redis.disconnect()
  }
}
