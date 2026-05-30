import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { AuthUser } from '../auth/auth.types'

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest<Request>()
  if (!req.user) throw new UnauthorizedException()
  return req.user
})
