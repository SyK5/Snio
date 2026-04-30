import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'snio-api',
      version: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
    }
  }
}
