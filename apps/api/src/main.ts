import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const logger = app.get(Logger)
  app.useLogger(logger)
  app.setGlobalPrefix('api')
  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  logger.log(`Snio API listening on http://localhost:${port}/api`)
}

bootstrap()
