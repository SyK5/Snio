import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { RLS_PRISMA, createRlsClient } from './prisma.extended'
import { CacheService } from '../redis/cache.service'
import { bumpClanContext } from '../rls/clan-context.cache'

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: RLS_PRISMA,
      inject: [PrismaService, CacheService],
      useFactory: (base: PrismaService, cache: CacheService) => createRlsClient(base, clanId => bumpClanContext(cache, clanId)),
    },
  ],
  exports: [PrismaService, RLS_PRISMA],
})
export class PrismaModule {}
