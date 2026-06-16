import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { CacheService, REDIS_CLIENT } from './cache.service'

@Global()
@Module({
  providers: [{ provide: REDIS_CLIENT, inject: [ConfigService], useFactory: (config: ConfigService) => new Redis(config.getOrThrow<string>('REDIS_URL')) }, CacheService],
  exports: [CacheService],
})
export class RedisModule {}
