import { Global, Module, OnModuleInit } from '@nestjs/common'
import { PermissionService } from './permission.service'
import { PermissionGuard } from './permission.guard'
import { ClanContextGuard } from './clan-context.guard'
import { validateCatalog } from './grants.catalog'

@Global()
@Module({
  providers: [PermissionService, PermissionGuard, ClanContextGuard],
  exports: [PermissionService, PermissionGuard, ClanContextGuard],
})
export class RlsModule implements OnModuleInit {
  onModuleInit(): void {
    validateCatalog()
  }
}
