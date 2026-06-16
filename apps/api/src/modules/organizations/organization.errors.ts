import { ConflictException, NotFoundException } from '@nestjs/common'

export const orgErrors = {
  createFailed: () => new ConflictException({ code: 'ORG_CREATE_FAILED', message: 'Organisation konnte nicht angelegt werden' }),
  notFound: () => new NotFoundException({ code: 'ORG_NOT_FOUND', message: 'Organisation nicht gefunden' }),
}
