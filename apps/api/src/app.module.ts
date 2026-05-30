import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import { AppController } from './app.controller'
import { PrismaModule } from './common/prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } } : undefined,
        autoLogging: true,
        redact: { paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'], remove: true },
      },
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
