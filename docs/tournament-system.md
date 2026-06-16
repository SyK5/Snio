# Competitive System: Events, Tournaments, Match Reporting

Detailed target picture for the competitive layer of Snio. This is the working spec.
Each layer below is meant to be built in its own session. The roadmap in `docs/roadmap.md`
holds the short version, this file holds the mechanics, data model sketches and open
decisions.

Naming note: this document uses "competition" as the umbrella term for Event, Tournament
and League. They are separate models but share the roster, anti duplicate and match
reporting foundation.

---

## Product Vision

Snio acts as the middleman. Organizers host, players and clans compete.

Three organizer sources:

- SYSTEM: hosted by Snio directly (platform admin).
- CLAN: a clan runs its own event or internal tournament for its members.
- ORGANIZATION: a verified organization runs public events, tournaments and leagues,
  independent of any clan.

Players and clans register, play their matches, report results. The platform tracks
brackets, standings and discipline.

Out of scope for now: automated result tracking through game APIs. Results are entered
manually by both teams and must match. Better tracking is a later concern.

---

## Scope Boundaries

- Event: the light format. Solo or team. Visibility, registration policy, free text
  ruleset. No bracket, no standings. Used for scrims, meetups, LAN announcements,
  small clan internal events.
- Tournament: the competitive format. Bracket based (single or double elimination,
  later swiss). Slots, seeding, match reporting, standings. Can be clan internal or
  organizer hosted.
- League: season based competition. Already partially modeled (League, LeagueParticipant,
  LeagueRoster). Standings over a season instead of a bracket. Shares the roster and
  match reporting foundation with Tournament.
- Training: stays clan only and separate. No organizer polymorphism, no external teams,
  no anti duplicate. Training keeps clan_id required. Not part of this spec.

Open decision D1: relationship between Tournament and the existing League model. Both need
roster, anti duplicate, matches and a result table. Options: keep two models that share
service logic, or extract a shared Competition base. Tendency: keep separate models,
share the service and worker code, because League standings and Tournament brackets
differ enough that one model would null half its fields per type.

---

## The Three Axes (do not conflate)

Every Event and Tournament has three independent settings. Conflating them is what turns
the validation into nested if hell, so they stay separate fields.

1. Visibility: PUBLIC | PRIVATE
   Controls who can see the competition. RLS relevant.
   PUBLIC: unfiltered, everyone sees it.
   PRIVATE: only organizer, invited teams and players, and members of participating teams.

2. Registration policy: OPEN | INVITE_ONLY | CLOSED
   Controls who can sign up.
   OPEN: anyone who can see it registers themselves.
   INVITE_ONLY: registration only through an invite from the organizer.
   CLOSED: no new registration (full, or registration window over).

3. Participant type: SOLO | TEAM
   SOLO: players register alone.
   TEAM: whole teams register. For TEAM add:
   - clan_only boolean: if true, only full clans can register, not ad hoc teams.
   - min_roster and max_roster integers: e.g. minimum 5 players to be eligible.

Open decision D2: are visibility and registration policy fully independent, or does
INVITE_ONLY imply PRIVATE. Tendency: independent. A public tournament can be visible to
all but only joinable by invite. Document the common combos in the UI, do not hard couple
them in the schema.

---

## Build Layers

Each layer is independently deployable and testable. Build order matters: L0 unblocks
everything, L2 is the shared heart that L1 team mode, L3 and League all reuse.

### L0 Organizer Foundation

Goal: make organizer polymorphic across SYSTEM, CLAN, ORGANIZATION before any competition
code assumes a clan.

Schema:

- New model Organization: id, slug unique, name, owner_id FK User, verified boolean
  default false, logo_url, description, timestamps, deleted_at. Minimal on purpose.
  OrganizationMember and org roles come with the full B1, not here. For now only the
  org.owner can act for the organization.
- Event gets: organizer_kind enum (SYSTEM | CLAN | ORGANIZATION), clan_id made nullable,
  organization_id nullable FK Organization.
- DB check constraint, exactly one source consistent with the kind:
  (kind=SYSTEM AND clan_id IS NULL AND organization_id IS NULL)
  OR (kind=CLAN AND clan_id IS NOT NULL AND organization_id IS NULL)
  OR (kind=ORGANIZATION AND organization_id IS NOT NULL AND clan_id IS NULL)
  Prisma does not express check constraints in the schema, so this ships as raw SQL in
  the migration.

API contract:

- Responses never expose clan_id or organization_id directly for the organizer. They map
  to an abstract organizer object: { kind, id, name, slug, logo_url }. Internally the
  service reads clan_id today, organization_id once orgs are live. When B1 lands, only the
  mapping changes, not the contract, not the frontend.

RLS consequence:

- Making clan_id nullable breaks the current clan scope for Event, because SYSTEM and ORG
  events have clan_id null and would be filtered out for everyone. Event therefore moves
  from clan scope to conditional scope. The conditional resolver is built here or in L1
  (see RLS section). This is the work the original handoff marked as later, now pulled
  forward because the organizer model demands it.

Grants:

- event and event_participation grants already exist (clan scope). For ORG and SYSTEM
  events the create permission is checked differently: org.owner for ORG, platform admin
  for SYSTEM. Clan events keep the grant path. Keep this in the service, do not overload
  the grant catalog.

Done when: an event can be created by a clan, by a platform admin (SYSTEM), and by an
organization owner; the API returns a uniform organizer object; the check constraint
rejects inconsistent rows.

### L1 Event Core (Solo)

Goal: usable events end to end, solo only, with the three axes wired.

Schema additions to Event:

- visibility enum PUBLIC | PRIVATE default PRIVATE.
- registration_policy enum OPEN | INVITE_ONLY | CLOSED default INVITE_ONLY.
- participant_type enum SOLO | TEAM default SOLO (TEAM handled in L2).
- registration_opens_at, registration_closes_at nullable timestamps.
- game_id stays. game_mode reference comes with the mode catalog (L3), nullable until then.
- EventInvite model for INVITE_ONLY (code, event_id, target_user_id nullable, expiry,
  uses), mirrors ClanInvite.

Service:

- CRUD scoped by organizer. EventParticipation already exists on user level.
- Registration respects registration_policy and the registration window.
- Visibility enforced through the conditional RLS scope.

RLS:

- Event conditional scope: visible if visibility=PUBLIC OR I am the organizer (clan member
  with read, or org owner, or platform admin) OR I am registered.

Frontend:

- Event list (home feed union of registered plus public), event detail, create event flow,
  register and leave. Organizer controls for the three axes.

Done when: a player sees public events and their own private ones, registers solo,
organizers control visibility and registration policy, INVITE_ONLY enforced.

### L2 Roster and Anti Duplicate (shared foundation)

Goal: build the team roster and the one team per player rule once, so team events,
tournaments and leagues all reuse it. This is the hardest layer, build it carefully.

Models (per competition type to avoid a polymorphic roster table):

- EventParticipant, EventRoster for team events.
- TournamentParticipant, TournamentRoster for tournaments.
- LeagueParticipant, LeagueRoster already exist.
- Each Participant is a registered team (a clan or an ad hoc team). Each Roster row is a
  player in that team for that competition.

Anti duplicate, the core rule: a player may only be actively in one participating team per
competition. A player who is in two clans that both register stays on both rosters in a
conflicted state until they choose.

Mechanics:

1. Partial unique index, not a plain unique. Postgres:
   CREATE UNIQUE INDEX ... ON <roster> (<competition>\_id, user_id) WHERE state = 'ACTIVE'.
   Only one ACTIVE roster row per (competition, user). Multiple conflicted rows are
   allowed. Ships as raw SQL in the migration, Prisma does not model partial indexes.
2. Roster row state machine:
   - ACTIVE: counts as a real participant.
   - CONFLICTED: player is on two or more rosters of this competition, unresolved.
   - LOCKED: registration deadline passed without the player choosing. Player is barred
     from this competition. Shown struck through with an info icon in the frontend.
   - PENDING_RELEASE: player chose a team, 24h cooldown running before they go ACTIVE.
   - WITHDRAWN: the team the player did not choose. Stays struck through for that team.
3. Flow:
   - On roster add, if the player already has a roster row in this competition, both rows
     go CONFLICTED, player is notified to choose one.
   - Player chooses: chosen row goes PENDING_RELEASE (24h), the other goes WITHDRAWN.
   - After 24h the chosen row goes ACTIVE.
   - If the registration deadline passes with the player still CONFLICTED, all their rows
     for this competition go LOCKED. The teams stay registered, the player is barred.

Worker (new infrastructure):

- Time triggered transitions need a scheduler. Use BullMQ on the existing Redis.
- Jobs: registration_deadline_sweep (CONFLICTED to LOCKED at deadline),
  cooldown_release (PENDING_RELEASE to ACTIVE after 24h).
- Open decision D3: worker hosting. In process scheduler inside the API, or a separate
  worker container in docker-compose. Tendency: separate container, so a busy API does not
  delay timers and the worker scales independently.

Notifications: reuse the Notification model. New types likely needed: ROSTER_CONFLICT,
ROSTER_LOCKED, ROSTER_RELEASED. Add to NotificationType enum.

Done when: two clans sharing a player can both register, the player is forced to choose,
the deadline sweep locks the undecided, the 24h cooldown releases the chosen, and the
frontend renders conflicted, locked and withdrawn states correctly.

### L3 Tournament Core and Ruleset Engine

Goal: bracket based tournaments with enforceable rules.

Schema:

- Tournament model: organizer (same polymorphism as Event, L0 pattern), game_id, format
  enum (SINGLE_ELIM | DOUBLE_ELIM | ROUND_ROBIN, SWISS later), the three axes, slot count,
  seeding mode, registration window, timestamps, soft delete.
- TournamentSlot or bracket node model for the bracket structure.
- GameMode catalog: model GameMode (game_id FK, key, name, is_system) so modes are not a
  Prisma enum. Seeded per game, e.g. CoD: search_and_destroy, hardpoint, control.
  Tournament references one or more modes. Organizers may add custom modes per tournament,
  so allow a free mode entry alongside the global catalog.

Ruleset, the enforced vs descriptive split (this is where exploits get prevented):

- Enforced, structured and validated by the engine: participant_type, clan_only,
  min_roster, max_roster, slot count, best_of, map count, game_mode, registration window.
- Descriptive, free text or rich content the engine does not interpret: map pool notes,
  conduct rules, tiebreaker prose, custom organizer rules. Stored as a text or JSON blob.
- Rule of thumb: anything the platform must enforce is a typed field, never free text.
  Exploits almost always come from an enforceable rule living in a text field.

Bracket generation: seed participants into the bracket on registration close. Single elim
first, double elim next, swiss later.

Done when: an organizer creates a tournament, sets enforced rules, teams register through
the L2 roster, the bracket is generated on close.

### L4 Match Reporting and Standings

Goal: manual dual entry result reporting with proof, plus the result display.

Schema:

- Match model: tournament_id (or league_id), round, bracket position, team_a_id,
  team_b_id, game_mode_id, map, scheduled_at, status enum
  (PENDING | REPORTING | CONFIRMED | DISPUTED | FORFEIT), report_deadline_at.
- MatchReport model: match_id, reporting_team_id, score_a, score_b, screenshot attachment
  via the existing S3 and ChatMessageAttachment style storage, submitted_by_id,
  submitted_at.

Reporting flow:

- Both teams submit their result with a screenshot as proof.
- First submission starts a 30 minute timer and moves the match to REPORTING.
- Both submitted and matching: CONFIRMED.
- Both submitted and mismatching: DISPUTED, organizer resolves with an override.
- Timer expires with only one submission: the submitted result stands (no show default
  for the silent team).
- A match is only complete when all required maps or games of the series are reported and
  confirmed.

Forfeit and no show: recorded structurally on the Match (status FORFEIT, plus a no_show
flag or a separate record), not just folded into the score. L5 penalty reads this data, so
it must be queryable, not implicit.

Standings display: computed from confirmed matches. Show clan vs clan with icons, score,
the round, the map and the mode, in the style of established esports result pages.

Open decision D4: dispute resolution authority. Only the organizer, or also platform admin
for SYSTEM tournaments. Tendency: organizer for their own competitions, platform admin
always as a fallback.

Done when: both teams report, matching results confirm automatically, mismatches go to
dispute, the timer enforces the no show default, screenshots are stored, standings render.

### L5 Penalty and Reputation

Goal: discipline so players honor their registrations and reports.

Schema:

- Penalty model: subject (user or team), reason enum (NO_SHOW | LATE_REPORT |
  DISPUTE_ABUSE | MISCONDUCT | REGISTERED_NO_PLAY), severity or points, issued_by_id,
  competition reference, issued_at, expires_at.
- Optional reputation score derived from active penalties.

Reads from L4 forfeit and no show data and from roster LOCKED events. This is why L4 stores
those structurally. Penalty is last because it has no input data until L4 produces it.

Use cases: a player who registers and does not show, a team that repeatedly disputes in bad
faith, late reporting. Effects range from warnings to registration blocks.

---

## RLS Scope Types

The extension is a resolver map. New scope means a new resolver, not a rewrite.

- context-free: no filter.
- clan: field in my clan ids or equals active clan.
- self: user_id equals me.
- member: id in my channel or roster ids (lands with chat and with team rosters).
- conditional: OR composition for Event, Tournament, League visibility (lands here).
- deferred: hard deny until finalized.

Event, Tournament and League use conditional. The visibility OR rule: PUBLIC, or I am the
organizer, or I am registered or rostered.

---

## Infrastructure Additions

- BullMQ on the existing Redis for time triggered transitions (roster deadline, cooldown
  release, match report timer). New dependency, new worker process. See decision D3.
- S3 already covers screenshot storage, no new storage.
- Notification model already exists, new NotificationType values get added per layer.

---

## Open Decisions Summary

- D1: Tournament vs League, separate models sharing service logic, or a shared Competition
  base. Tendency separate.
- D2: visibility and registration policy independent, or INVITE_ONLY implies PRIVATE.
  Tendency independent.
- D3: worker hosting, in process vs separate container. Tendency separate container.
- D4: dispute resolution authority, organizer only vs organizer plus platform admin
  fallback. Tendency fallback.
- D5: do team events (L2) and tournaments (L3) share participant and roster tables, or get
  their own per type. Tendency per type, shared service code.
- D6: organizer for League, currently League has no organizer field, clan only through
  LeagueParticipant. Decide if League also gets the L0 organizer polymorphism.

---

## Reference Material (for the relevant layers)

For ruleset and format modeling, and match confirmation and dispute flows, look at how
Toornament, FACEIT and ESL structure these before finalizing L3 and L4. Do not copy,
study the shape of the problem.
