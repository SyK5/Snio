import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'

export const clanErrors = {
  tagTaken: () => new ConflictException({ code: 'CLAN_TAG_TAKEN', message: 'Clan Tag bereits vergeben' }),
  createFailed: () => new ConflictException({ code: 'CLAN_CREATE_FAILED', message: 'Clan konnte nicht angelegt werden' }),
  notFound: () => new NotFoundException({ code: 'CLAN_NOT_FOUND', message: 'Clan nicht gefunden' }),
  alreadyMember: () => new ConflictException({ code: 'CLAN_ALREADY_MEMBER', message: 'Bereits Mitglied dieses Clans' }),
  ownerCannotLeave: () => new ForbiddenException({ code: 'CLAN_OWNER_CANNOT_LEAVE', message: 'Owner muss den Clan zuerst übertragen oder löschen' }),
  noMembership: () => new NotFoundException({ code: 'CLAN_NO_MEMBERSHIP', message: 'Keine aktive Mitgliedschaft' }),
  ownerCannotBeKicked: () => new ForbiddenException({ code: 'CLAN_OWNER_CANNOT_BE_KICKED', message: 'Owner kann nicht entfernt werden' }),
  memberNotFound: () => new NotFoundException({ code: 'CLAN_MEMBER_NOT_FOUND', message: 'Mitglied nicht gefunden' }),
  roleNotFound: () => new NotFoundException({ code: 'CLAN_ROLE_NOT_FOUND', message: 'Rolle nicht gefunden' }),
  targetRoleTooHigh: () => new ForbiddenException({ code: 'CLAN_TARGET_ROLE_TOO_HIGH', message: 'Mitglied hat eine gleich hohe oder höhere Rolle' }),
  ownerRoleNotAssignable: () => new ForbiddenException({ code: 'CLAN_OWNER_ROLE_NOT_ASSIGNABLE', message: 'Owner Rolle kann nicht manuell vergeben werden' }),
  ownerRoleNotRemovable: () => new ForbiddenException({ code: 'CLAN_OWNER_ROLE_NOT_REMOVABLE', message: 'Owner Rolle kann nicht entfernt werden' }),
  roleAboveOwnPosition: () => new ForbiddenException({ code: 'CLAN_ROLE_ABOVE_OWN_POSITION', message: 'Rolle liegt über deiner eigenen Position' }),
  systemRoleNotRenamable: () => new ForbiddenException({ code: 'CLAN_SYSTEM_ROLE_NOT_RENAMABLE', message: 'Systemrollen können nicht umbenannt werden' }),
  systemRoleNotDeletable: () => new ForbiddenException({ code: 'CLAN_SYSTEM_ROLE_NOT_DELETABLE', message: 'Systemrollen können nicht gelöscht werden' }),
  ownerRoleNotDeletable: () => new ForbiddenException({ code: 'CLAN_OWNER_ROLE_NOT_DELETABLE', message: 'Die Owner Rolle kann nicht gelöscht werden' }),
  ownerRoleNotEditable: () => new ForbiddenException({ code: 'CLAN_OWNER_ROLE_NOT_EDITABLE', message: 'Die Owner Rolle kann nicht bearbeitet werden' }),
  grantUnknown: () => new BadRequestException({ code: 'CLAN_GRANT_UNKNOWN', message: 'Unbekannte Berechtigung' }),
  grantEscalation: () => new ForbiddenException({ code: 'CLAN_GRANT_ESCALATION', message: 'Du kannst keine Rechte vergeben, die du selbst nicht hast' }),
  roleReorderInvalid: () => new BadRequestException({ code: 'CLAN_ROLE_REORDER_INVALID', message: 'Reihenfolge ungültig' }),
}
