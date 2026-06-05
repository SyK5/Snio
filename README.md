# Snio

> Live at [snio.gg](https://snio.gg) · public showcase project · in active development

Multi Tenant Esport Platform for Clans, Events and Trainings. Built as a public showcase project for production grade Multi Tenant SaaS patterns.

For current development direction, design decisions and backlog see [docs/roadmap.md](docs/roadmap.md).

---

## What Snio is

A platform for Esport teams to organize themselves around games, events and trainings. Users register, create or join Clans, get assigned to specific games, organize matches and training sessions, and communicate in real time. Multiple games and multiple Clans per user are first class concepts.

---

## What this repository demonstrates

A public showcase of architectural patterns commonly required in production SaaS:

- **Row Level Security as Prisma Extension.** Every database access is intercepted and filtered against the current request context. Scope resolvers cover context-free, clan scoped, self scoped, member scoped and conditional cases. Adding new scopes is a resolver registration, not a rewrite.
- **Request scoped User Context via AsyncLocalStorage.** The authenticated User and their effective grants are isolated per request and carried through the entire flow without prop drilling.
- **Grant based Permission System.** Permissions are explicit grants on resources stored in the database, not static role tables. Actions are stored as integer bitmask (READ, CREATE, UPDATE, DELETE, MANAGE). Multi role membership is supported and effective grants are computed via bitwise OR across roles.
- **Position based Role Hierarchy.** A member can only act on roles below their own highest role position. Owners and Platform Admins bypass the position check. Effective position is loaded by the ClanContextGuard into the request store.
- **JWT Access plus Refresh Token Rotation with Replay Detection.**
- **Username System.** Username as unique login handle separated from display name. Discriminator support (Name#tag), 30 day cooldown after change, prepared paid bypass path.
- **Multi Tenant data isolation** enforced at the persistence layer through the RLS extension.

---

## Stack

| Layer | Technology |
|---|---|
| Backend Framework | NestJS 11 |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Cache and Sessions | Redis 7 |
| Realtime | Socket.io |
| Auth | own implementation, JWT plus Refresh Rotation, Argon2 |
| Email | Resend with React Email Templates |
| Frontend | React 19, Vite 6, TypeScript |
| Styling | Tailwind CSS 4, CVA (shadcn-style components) |
| State | TanStack Query, Zustand |
| Forms | React Hook Form, Zod |
| i18n | Paraglide JS (Inlang) |
| Storage | Hetzner Object Storage (S3 compatible) |
| Monorepo | pnpm Workspaces with Turborepo |
| Container | Docker Compose |
| Deployment | two Hetzner CX22 servers, App and Database isolated via Hetzner Private Network |
| CI | GitHub Actions, SSH Deploy |

---

## Architecture overview

​```
[User Browser]
      |
      | HTTPS
      v
[App Server, public]
   |-- Caddy (reverse proxy, automatic HTTPS)
   |-- NestJS API container
   |-- Vite SPA container
   `-- Redis container
      |
      | Hetzner Private Network (no public Postgres port)
      v
[Database Server, private]
   |-- Postgres 16 container
   `-- Backup cron to Hetzner Object Storage
​```

Two server setup with strict separation: the database server has no public IP exposed for Postgres. All database traffic flows through a Hetzner Private Network. Backups are copied nightly to S3 compatible Object Storage with 7 day retention.

---

## Local development

Requirements: Node 22+, pnpm 9+, Docker.

​```bash
git clone https://github.com/SyK5/snio.git
cd snio
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm db:up
cd apps/api && pnpm prisma:migrate && pnpm seed && cd ../..
pnpm dev
​```

API runs on http://localhost:3000, Web on http://localhost:5173.

---

## License

This project is licensed under the GNU Affero General Public License v3.0. See [LICENSE](LICENSE) for details.

If you use this code in a public web service, you must make your modifications publicly available under the same license.

---

## Author

Built by Alpay Sahin · [GitHub](https://github.com/SyK5) · [LinkedIn](https://www.linkedin.com/in/alpay-sahin-syk5)
