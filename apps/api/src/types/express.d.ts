import { AuthUser } from '../common/auth/auth.types'

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export {}
