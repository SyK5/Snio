import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'

export const eventErrors = {
  notFound: () => new NotFoundException({ code: 'EVENT_NOT_FOUND', message: 'Event nicht gefunden' }),
  gameNotFound: () => new BadRequestException({ code: 'EVENT_GAME_NOT_FOUND', message: 'Spiel nicht gefunden' }),
  orgNotFound: () => new NotFoundException({ code: 'EVENT_ORG_NOT_FOUND', message: 'Organisation nicht gefunden' }),
  notOrgOwner: () => new ForbiddenException({ code: 'EVENT_NOT_ORG_OWNER', message: 'Nur der Inhaber der Organisation kann hier Events erstellen' }),
  notPlatformAdmin: () => new ForbiddenException({ code: 'EVENT_NOT_PLATFORM_ADMIN', message: 'Nur Plattform Admins können System Events erstellen' }),
  teamNotSupported: () => new BadRequestException({ code: 'EVENT_TEAM_NOT_SUPPORTED', message: 'Team Anmeldung ist noch nicht verfügbar' }),
  registrationClosed: () => new ForbiddenException({ code: 'EVENT_REGISTRATION_CLOSED', message: 'Die Anmeldung ist geschlossen' }),
  inviteOnly: () => new ForbiddenException({ code: 'EVENT_INVITE_ONLY', message: 'Anmeldung nur über eine Einladung möglich' }),
  registrationNotOpen: () => new ForbiddenException({ code: 'EVENT_REGISTRATION_NOT_OPEN', message: 'Die Anmeldung ist noch nicht geöffnet' }),
  registrationWindowClosed: () => new ForbiddenException({ code: 'EVENT_REGISTRATION_WINDOW_CLOSED', message: 'Der Anmeldezeitraum ist abgelaufen' }),
  alreadyRegistered: () => new ConflictException({ code: 'EVENT_ALREADY_REGISTERED', message: 'Du bist bereits angemeldet' }),
  notRegistered: () => new NotFoundException({ code: 'EVENT_NOT_REGISTERED', message: 'Du bist nicht angemeldet' }),
  participationNotFound: () => new NotFoundException({ code: 'EVENT_PARTICIPATION_NOT_FOUND', message: 'Teilnahme nicht gefunden' }),
}
