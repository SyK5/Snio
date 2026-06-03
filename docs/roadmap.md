# Snio Product Roadmap and Backlog

This document tracks features that are not built yet so nothing gets forgotten. Priority order is roughly sorted but not fixed.

## Current Status

Authentication, Mail, Settings and S3 Avatar support have already been started.

Currently in development:
Clans, Roles, Grant System, RLS Foundation and the schema migration for database driven roles.

Multi role support and Platform Admin support are already integrated. See the Data Model Changes section below.

## Currently in Progress

1. Schema migration completed

ClanRole enum removed

Roles moved into the database using ClanRoleDef and ClanRoleGrant

Multi role support added through ClanMemberRole

Platform Admin flag added to User

ChatMessageMention switched from enum based roles to role foreign keys

2. Grant catalog implemented in code

No filesystem scanning

Action bitmask system:
READ
CREATE
UPDATE
DELETE
MANAGE

3. ClanContextInterceptor

Loads the active clan and effective grants into AsyncLocalStorage

4. PermissionService, PermissionGuard and RequireGrant decorator

5. RLS Prisma extension

Hard scoped access for all clan scoped and self scoped models

6. Clan CRUD, member management and role management backend

7. Frontend implementation

Clan list

Clan detail pages

Clan creation

Member management

Role management

## Backlog

### B1 Organizations as a separate account type

Besides normal user registration there should also be organizer accounts.

Organizers can host public events, LAN parties and leagues on Snio independently from clans.

Open questions before implementation:

Separate Organization model with its own memberships and roles or just a user flag with an organization profile.

Current tendency:
Use a dedicated Organization model similar to Clan with OrganizationMember and its own roles so the grant system can be reused instead of duplicated.

Relationship between organizations and clans:
Can a clan belong to an organization or are they completely separated.
Important for leagues.

Organizer verification to prevent abuse and fake events.
First version could use manual approval by Platform Admins.

Public event and league pages with registration support for external teams and players.

Future monetization:
Ticketing
Entry fees
Commercial organization plans

Draft data model, not final and not migrated yet:

Organization
id
slug
name
owner_id
verified

OrganizationMember
org_id
user_id
roles

Event and League get optional organizer_org_id instead of only clan_id

### B2 Team registration and anti duplicate participation for events and leagues

Rule:
A player may only participate in one team per event or league.

Currently team registration only exists for leagues through LeagueParticipant and LeagueRoster.

Events currently only use EventParticipation on user level.

Things to clarify:

Should events also support team registration or should teams remain league only.

If events need teams:
Create EventParticipant and EventRoster similar to leagues.

Required constraints:

Database side:
LeagueRoster already has @@unique([league_id, user_id]) to prevent duplicate roster entries inside the same league.

If a second team is registered with overlapping players:
Registration must fail with a clear error message including the affected player names.

Joining another participating team later must also be blocked, not only during initial registration.

Validation belongs into business logic services, not RLS.
RLS handles visibility, not business uniqueness rules.

### B3 Role UI and Grant Editor

Clan owners and authorized roles should be able to:

Create roles

Rename roles

Change role positions

Set role colors

Assign grants using bitmask toggles

Drag and drop support for role sorting similar to Discord roles UI.

### B4 Audit Log Evaluation

AuditLog model already exists.

Still needed:

Write paths for sensitive actions like:
Role changes
Kicks
Bans
Clan deletion

Admin UI with filtering support

### B5 Notification Center

Notification model already exists.

Still needed:

Notification creation for relevant events

Frontend notification bell with unread counter

Mark as read support

Settings per NotificationType

### B6 Game Voting

NotificationType already contains:
GAME_VOTE_STARTED
GAME_VOTE_RESULT

Concept:
Clan members vote for which games the clan officially supports.

Model and workflow are still open.

### B7 Documents and Certificates

Document model with verification_code already exists.

Planned features:

Generate participation and achievement certificates as PDF files

Public verification through verification codes

Additional document creation support for organizers:
Invitations
Invoices
Other organizer documents

## Visibility, Registration and Chat (Design Locked, Migration per Sprint)

These decisions are locked. The schema columns and models land with their respective sprint, not now, so each migration makes sense on its own (column plus the logic that uses it ship together, no dead column ballast).

### Event and League Visibility

Visibility enum PUBLIC | PRIVATE on Event and League (LAN parties are events).

PUBLIC:
Visible to everyone, RLS leaves these rows unfiltered.

PRIVATE:
Visible only to the organizer (clan or organization), invited teams and players, plus members of participating teams.
A player sees a private event only once their team participates or they are invited.

For PRIVATE the organizer sends invitations or adds teams manually.
Requires an invite model (EventInvite or LeagueInvite) plus manual roster add.

RLS consequence:
Event and League are conditional scoped, not simply clan scoped.
Visible if visibility is PUBLIC OR I am the organizer OR I am registered or rostered.

### Registration: Solo or Team

RegistrationMode enum SOLO | TEAM on Event and League.

SOLO:
Players register alone. EventParticipation already exists on user level, the same is needed for League.

TEAM:
League already has this through LeagueParticipant and LeagueRoster.
Event gets EventParticipant and EventRoster analogously in the event sprint.

Anti duplicate participation (B2) applies per event or league:
A player may only be in exactly one participating team.
@@unique on roster plus a service check on initial and later join, error message including affected player names.

### Chat Architecture

Three channel kinds, scoped differently:

1. Clan channel (type CLAN, clan_id set):
Visible to clan members.
Read, write and upload gated by grant (chat_message READ and CREATE, attachment CREATE). Granular per action.

2. Private group chat and DM (type GROUP, DIRECT):
Membership scoped through ChatChannelMember.
No grants, members write freely.

3. Match chat (new type MATCH):
Live chat between two competing teams, both rosters are members, both sides communicate.
No clan grants, membership equals roster membership of the two teams.

RLS consequence:
New scope type member (visibility through the ChatChannelMember join), in addition to clan and self.
ChatChannel is conditional: CLAN uses clan scope, GROUP, DIRECT and MATCH use member scope.

### Home Feed

Upcoming events and leagues on the home page equal the union of:
Where the player is registered solo, plus where their team is registered through a roster.
Pure service query, performant using an index on starts_at plus the existing roster and participation unique keys.
No new model required.

### Organizers (Self Service)

Registered organizers create events and leagues themselves, set visibility and registration mode, send invites and add teams manually.
The app guides them through the flow.
Builds on B1 (Organization model) and reuses the same grant system through OrganizationMember with its own roles instead of duplicating it.

### RLS Scope Types (Build the Extension Extensibly)

The RLS extension uses a resolver map scope to where fragment:

context-free: no filter
clan: field IN myClanIds or equals active clan
self: user_id equals me
member: id IN myChannelIds (lands with the chat sprint)
conditional: composition via OR (lands with the event and chat sprints)
deferred: hard deny until finalized

Adding new scopes later means adding a resolver, not rewriting the extension.

## Data Model Changes

New:

User.is_platform_admin boolean

Snio wide admin privileges

Bypass in permission checks and RLS filters

ClanRoleDef

Freely configurable role per clan

Contains:
key
name
color
position
is_system

ClanRoleGrant

Grant assignments per role

Actions stored as integer bitmask

ClanMemberRole

Many to many relation between ClanMember and ClanRoleDef

Enables multi role support

Changed:

ClanMember.role enum removed and replaced with roles relation

ClanRole enum removed

ChatMessageMention.mentioned_role enum replaced with mentioned_role_id foreign key to ClanRoleDef

## Bitmask Values

READ = 1

CREATE = 2

UPDATE = 4

DELETE = 8

MANAGE = 16

## System Roles

Automatically seeded during clan creation:

owner

leader

trainer

member

All system roles have is_system set to true and cannot be deleted.

owner receives all grants implicitly through the owner bypass and therefore does not require a full grant list.

## Architecture Principles

RLS is enforced strictly.
No data access without proper context.
Context free access only exists for authentication and own user data.

Permissions are grant based instead of fixed role matrices.
Roles are only bundles of grants.

Effective grants for multi role members are calculated using bitwise OR across all assigned roles.

Platform Admins and Clan Owners are bypasses and do not require grant lookups.

Business uniqueness rules such as one team per player per tournament belong into service logic, not RLS.

Grant catalog stays in code while grant assignments are stored in the database.
Adding new grants does not require schema migrations.
