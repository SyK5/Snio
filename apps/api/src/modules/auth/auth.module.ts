import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { authConfig } from '../../common/auth/auth.config'
import { PasswordService } from '../../common/auth/password.service'
import { TokenService } from '../../common/auth/token.service'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  imports: [ConfigModule.forFeature(authConfig), JwtModule.register({})],
  controllers: [AuthController],
  providers: [PasswordService, TokenService, AuthService, AuthGuard],
  exports: [AuthService, TokenService, AuthGuard],
})
export class AuthModule {}
