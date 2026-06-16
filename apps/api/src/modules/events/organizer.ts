import { OrganizerKind } from '@prisma/client'

export interface OrganizerView {
  kind: OrganizerKind
  id: string | null
  name: string
  slug: string | null
  logoUrl: string | null
}

export interface OrganizerSource {
  organizer_kind: OrganizerKind
  clan: { id: string; name: string; slug: string; logo_url: string | null } | null
  organization: { id: string; name: string; slug: string; logo_url: string | null } | null
}

export function toOrganizer(e: OrganizerSource, logoUrl: string | null): OrganizerView {
  if (e.organizer_kind === 'CLAN' && e.clan) return { kind: 'CLAN', id: e.clan.id, name: e.clan.name, slug: e.clan.slug, logoUrl }
  if (e.organizer_kind === 'ORGANIZATION' && e.organization) return { kind: 'ORGANIZATION', id: e.organization.id, name: e.organization.name, slug: e.organization.slug, logoUrl }
  return { kind: 'SYSTEM', id: null, name: 'Snio', slug: null, logoUrl: null }
}
