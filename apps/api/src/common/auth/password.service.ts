import { Injectable } from '@nestjs/common'
import { hash, verify, Options } from 'argon2'

const ARGON_OPTIONS: Options = {
  type: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
}

@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return hash(plain, ARGON_OPTIONS)
  }

  async verify(storedHash: string, plain: string): Promise<boolean> {
    try {
      return await verify(storedHash, plain)
    } catch {
      return false
    }
  }
}
