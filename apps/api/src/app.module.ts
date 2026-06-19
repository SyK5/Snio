import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { AppController } from './app.controller'
import { PrismaModule } from './common/prisma/prisma.module'
import { RedisModule } from './common/redis/redis.module'
import { RlsModule } from './common/rls/rls.module'
import { MailModule } from './common/mail/mail.module'
import { RequestContextMiddleware } from './common/context/request-context.middleware'
import { AuthModule } from './modules/auth/auth.module'
import { S3Module } from './common/s3/s3.module'
import { UsersModule } from './modules/users/users.module'
import { ClansModule } from './modules/clans/clans.module'
import { GamesModule } from './modules/games/games.module'
import { EventsModule } from './modules/events/events.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { NotificationModule } from './modules/notifications/notification.module'
import { AuditModule } from './modules/audit/audit.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ThrottlerModule.forRoot([{ name: 'default', limit: 100, ttl: 60_000 }]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } } : undefined,
        autoLogging: true,
        redact: { paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'], remove: true },
      },
    }),
    RedisModule,
    PrismaModule,
    RlsModule,
    S3Module,
    MailModule,
    AuthModule,
    UsersModule,
    ClansModule,
    GamesModule,
    EventsModule,
    OrganizationsModule,
    NotificationModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('{*splat}')
  }
}
