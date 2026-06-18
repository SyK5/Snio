import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'

export const eventInviteErrors = {
  notFound: () => new NotFoundException({ code: 'EVENT_INVITE_NOT_FOUND', message: 'Einladung nicht gefunden' }),
  revoked: () => new ForbiddenException({ code: 'EVENT_INVITE_REVOKED', message: 'Einladung wurde zurückgezogen' }),
  expired: () => new ForbiddenException({ code: 'EVENT_INVITE_EXPIRED', message: 'Einladung ist abgelaufen' }),
  exhausted: () => new ForbiddenException({ code: 'EVENT_INVITE_EXHAUSTED', message: 'Einladung hat ihr Nutzungslimit erreicht' }),
  notForYou: () => new ForbiddenException({ code: 'EVENT_INVITE_NOT_FOR_YOU', message: 'Diese Einladung ist für einen anderen Account' }),
  userNotFound: () => new NotFoundException({ code: 'EVENT_INVITE_USER_NOT_FOUND', message: 'Nutzer nicht gefunden' }),
  alreadyInvited: () => new ConflictException({ code: 'EVENT_INVITE_ALREADY_INVITED', message: 'Für diesen Nutzer existiert bereits eine aktive Einladung' }),
  createFailed: () => new ConflictException({ code: 'EVENT_INVITE_CREATE_FAILED', message: 'Einladung konnte nicht erstellt werden' }),
}
