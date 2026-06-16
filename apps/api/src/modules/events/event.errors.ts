import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'

export const eventErrors = {
  notFound: () => new NotFoundException({ code: 'EVENT_NOT_FOUND', message: 'Event nicht gefunden' }),
  gameNotFound: () => new BadRequestException({ code: 'EVENT_GAME_NOT_FOUND', message: 'Spiel nicht gefunden' }),
  orgNotFound: () => new NotFoundException({ code: 'EVENT_ORG_NOT_FOUND', message: 'Organisation nicht gefunden' }),
  notOrgOwner: () => new ForbiddenException({ code: 'EVENT_NOT_ORG_OWNER', message: 'Nur der Inhaber der Organisation kann hier Events erstellen' }),
  notPlatformAdmin: () => new ForbiddenException({ code: 'EVENT_NOT_PLATFORM_ADMIN', message: 'Nur Plattform Admins können System Events erstellen' }),
}
