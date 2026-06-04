import { SetMetadata } from '@nestjs/common'

export const ALLOW_PENDING = 'allow_pending'

export const AllowPending = () => SetMetadata(ALLOW_PENDING, true)
