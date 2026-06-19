import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'

export const gameErrors = {
  notPlatformAdmin: () => new ForbiddenException({ code: 'GAME_NOT_PLATFORM_ADMIN', message: 'Nur Plattform Admins können Spiele verwalten' }),
  notFound: () => new NotFoundException({ code: 'GAME_NOT_FOUND', message: 'Spiel nicht gefunden' }),
  createFailed: () => new ConflictException({ code: 'GAME_CREATE_FAILED', message: 'Spiel konnte nicht angelegt werden' }),
  iconKeyInvalid: () => new BadRequestException({ code: 'GAME_ICON_KEY_INVALID', message: 'Ungültiger Icon Key' }),
}
