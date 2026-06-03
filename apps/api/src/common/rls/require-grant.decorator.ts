import { SetMetadata } from '@nestjs/common'
import { Action } from './actions'
import { GrantKey } from './grants.catalog'

export const REQUIRE_GRANT = 'require_grant'

export interface GrantRequirement {
  grant: GrantKey
  action: Action
}

export const RequireGrant = (grant: GrantKey, action: Action) => SetMetadata(REQUIRE_GRANT, { grant, action } satisfies GrantRequirement)
