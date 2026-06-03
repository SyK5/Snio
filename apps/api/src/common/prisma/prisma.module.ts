import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { RLS_PRISMA, createRlsClient } from './prisma.extended'

@Global()
@Module({
  providers: [PrismaService, { provide: RLS_PRISMA, inject: [PrismaService], useFactory: (base: PrismaService) => createRlsClient(base) }],
  exports: [PrismaService, RLS_PRISMA],
})
export class PrismaModule {}
