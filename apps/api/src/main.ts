import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const logger = app.get(Logger)
  app.useLogger(logger)
  app.setGlobalPrefix('api')
  app.use(cookieParser())
  app.enableCors({ origin: process.env.WEB_BASE_URL, credentials: true })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Snio API')
    .setDescription('Esport Plattform API für Clans, Events, Trainings und Chat')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    swaggerOptions: { persistAuthorization: true },
  })

  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  logger.log(`Snio API listening on http://localhost:${port}/api`)
  logger.log(`Swagger docs on http://localhost:${port}/docs`)
}

bootstrap()
