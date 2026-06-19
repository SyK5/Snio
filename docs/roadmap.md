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

Organizer is polymorphic across three sources: SYSTEM (hosted by Snio directly), CLAN and
ORGANIZATION. Exactly one source is set per competition, enforced by a check constraint.
The minimal Organization model (id, slug, name, owner_id, verified) is pulled forward into
the competitive layer L0 so the polymorphism is real from the start. Full OrganizationMember
support and org roles stay here in B1.

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

Concrete hook points already exist in ClansService (assignRole, removeRole, kick, softDelete) and are the first call sites to instrument.

Admin UI with filtering support

### B5 Notification Center

Notification model already exists.

Still needed:

Notification creation for relevant events

Frontend notification bell with unread counter

Mark as read support

Settings per NotificationType

### B6 Game Voting (Platform Game Catalog)

NotificationType already contains:
GAME_VOTE_STARTED
GAME_VOTE_RESULT

Concept (concretized):
Platform wide voting that decides which games enter the Snio game catalog. A dedicated tab, separate from clans, on a fixed monthly cycle.

Workflow:
Any player can suggest a game during the active cycle, picked from an external public multiplayer game API instead of free text.
Duplicate suggestions do not create a new row: the existing entry's vote count is incremented. Four users suggesting GTA leaves one row, GTA with 4 votes.
The list is sorted by votes DESC.
At cycle end the top game is added to the Game catalog. Manual approval by Platform Admin first, automatic later once the pipeline is trusted.

External API (open decision):
Source for an always current list of multiplayer games plus their available platforms. Candidates: IGDB (most complete, OAuth via Twitch), RAWG (simple, good coverage, platforms included), Giant Bomb.
To clarify before build: which API, how platforms are fetched, how an approved game is written into the Game table. The insert should be automatic.

Dependencies:
The monthly cycle needs a background worker (BullMQ on Redis), which arrives with L2 infrastructure.
A suggestion and vote model with dedup keyed on the external game id, plus per user per cycle vote tracking.
The seed is the starting point: avoid listing games already in the catalog, the list grows through voting.
The Platform Admin add games path (see B10) is the manual counterpart and the first piece built.

### B7 Documents and Certificates

Document model with verification_code already exists.

Planned features:

Generate participation and achievement certificates as PDF files

Public verification through verification codes

Additional document creation support for organizers:
Invitations
Invoices
Other organizer documents

### B9 Clan Join Gating

Clan join is currently open: any authenticated user with a complete profile can join any clan through POST /clans/:clanId/join. This is intentional at this stage because no invite or visibility model exists yet.

Still needed:

Clan visibility (PUBLIC | PRIVATE) or an invite flow (ClanInvite model plus invite codes).

Join gating: PRIVATE clans reject open join, entry only through invite or owner/leader add.

The join service runs in runSystem today (no membership yet at join time). The gate check (visibility or valid invite) goes in front of the membership creation, the runSystem block stays as is.

### B10 Admin Dashboard (Platform Admin Global Moderation)

The Platform Admin (User.is_platform_admin, already a bypass in permission checks and RLS) acts as the global moderator across the whole platform, managed through a dedicated frontend area at /admin, guarded so only admins reach it.

Principle:
The dashboard is not a single build. It is a frontend shell that grows with the layers. Each layer that produces an admin capability hangs its UI here. It can only manage things that exist, so it expands as the competitive layers land.

Sections by availability:
Games management (buildable now, unblocks the event create flow): list, add with icon, edit, soft delete. First concrete piece, built as the Admin Grundgeruest together with the games backend module.
Activity view (buildable now): global read over audit data.
Dispute resolution (arrives with L4): admins resolve reported match conflicts, cheating reports, false result claims. Authority is organizer first, Platform Admin as fallback (D4 in the tournament spec).
Result and table editing (arrives with L4): override match results and standings.
Penalties (arrives with L5): discipline actions, reads forfeit and no show data.
Voting overview (arrives with B6): inspect active and past voting cycles, approve the cycle winner into the catalog.

Backend:
Reuses the existing Platform Admin bypass. Admin endpoints are platform admin gated. No new authorization primitive needed.

Scope of the first build (Admin Grundgeruest):
Games backend module plus the admin shell with the games section only. No disputes, results, penalties or voting yet, those ship with their respective layers.

## Visibility, Registration and Chat (Design Locked, Migration per Phase)

These decisions are locked. The schema columns and models land with their respective phase, not now, so each migration makes sense on its own (column plus the logic that uses it ship together, no dead column ballast).

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
Event gets EventParticipant and EventRoster analogously in the events phase.

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
member: id IN myChannelIds (lands with the chat phase)
conditional: composition via OR (lands with the events and chat phases)
deferred: hard deny until finalized

Adding new scopes later means adding a resolver, not rewriting the extension.

### B8 Paid Username Change

Username is the unique login handle and appears in the profile URL and in mentions.

Current rule (already implemented):
Username can be set once for free while still pending (existing users via the complete-profile gate, new users at registration).
After that a 30 day cooldown applies, tracked via User.username_changed_at.
A change within the cooldown is rejected with a clear message stating the next free date.

Planned:
A paid change that bypasses the cooldown after a confirmed payment (around 5 EUR).
Needs a Billing module with a payment provider (Stripe), invoices, tax handling and refund logic.
This is a full work package, not a small add on.
The paid path simply skips the cooldown check once payment is confirmed, the data model (username_changed_at) is already prepared for it.

UX requirement (already implemented in settings):
Clear separation between username (login handle, shown as @name, in URL) and display name (shown as Name#tag, freely changeable).

## Competitive Layer: Events, Tournaments, Match Reporting

Full spec in docs/tournament-system.md. This is the overview.

Snio is the middleman. Organizers host, players and clans compete. Organizer is one of
SYSTEM, CLAN or ORGANIZATION. Events are the light format, solo or team, no bracket.
Tournaments are bracket based with seeding, match reporting and standings. Leagues are
season based. Training stays clan only and separate from all of this.

Every event and tournament has three independent axes, kept as separate fields so the
validation stays flat:

Visibility PUBLIC or PRIVATE, RLS relevant.

Registration policy OPEN, INVITE_ONLY or CLOSED.

Participant type SOLO or TEAM, and for TEAM a clan_only flag plus min and max roster size.

Match results are entered manually for now. Both teams report with a screenshot as proof.
The first report starts a 30 minute timer. Matching reports confirm automatically,
mismatches go to a dispute the organizer resolves, and if the timer runs out with only one
report the submitted result stands. Standings show clan vs clan with icons, score, map and
mode.

Anti duplicate participation: a player may only be actively in one participating team per
competition. A player in two registered clans is forced to choose. Undecided at the
deadline gets locked out of that competition, struck through with an info icon in the UI.
After choosing, a 24h cooldown runs before the player is active for the chosen team, and
they stay withdrawn for the other. Enforced by a partial unique index on the active roster
row plus a roster state machine, driven by a background worker on Redis.

Build order, each layer its own session:

L0 Organizer foundation: polymorphic organizer, minimal Organization model.

L1 Event solo: three axes, conditional visibility, invites.

L2 Roster and anti duplicate: the shared heart, reused by team events, tournaments and
leagues.

L3 Tournament core and ruleset engine: bracket, seeding, game mode catalog, enforced vs
descriptive rules.

L4 Match reporting and standings: dual entry, timer, dispute, forfeit, result display.

L5 Penalty and reputation: discipline, reads forfeit and no show data from L4.

Game modes are a seeded catalog per game, not a Prisma enum, so new modes need no
migration. Enforceable rules are typed fields, descriptive rules are free text. An
enforceable rule must never live in a text field.

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

Role hierarchy is position based. A member can only assign, remove or otherwise act on roles below their own highest role position. Kicking a member with an equal or higher highest role is rejected. Owners and Platform Admins bypass the position check. Effective position is loaded by the ClanContextGuard into the request store.

Business uniqueness rules such as one team per player per tournament belong into service logic, not RLS.

Grant catalog stays in code while grant assignments are stored in the database.
Adding new grants does not require schema migrations.
