# Snio

> Status: in active development. Sprint 0 of 7. First milestone (Auth) targeted Mai 2026.

Multi Tenant Esport Plattform für Clans, Events und Trainings. Built as a public showcase project for production grade Multi Tenant SaaS patterns.

---

## What Snio is

A platform for Esport teams to organize themselves around games, events and trainings. Users register, create or join Clans, get assigned to specific games, organize matches and training sessions, and communicate in real time. Multiple games and multiple Clans per user are first class concepts.

## What this repository demonstrates

This is a public showcase of architectural patterns commonly required in production SaaS:

- Row Level Security as Prisma Middleware that intercepts every database access, resolves chained table relations, scans entities and controllers at field level, and injects filter conditions automatically into queries.
- Request scoped User Context via AsyncLocalStorage. The authenticated User is isolated per request and carried through the entire flow without prop drilling.
- Grant based Permission System. Permissions are explicit grants on resources, not static role tables. Combined with Guards and Decorators for declarative authorization.
- JWT Access plus Refresh Token Rotation with Replay Detection.
- Multi Tenant data isolation enforced at the persistence layer.

---

## Stack

| Layer | Technology |
|---|---|
| Backend Framework | NestJS 10 |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Cache and Sessions | Redis 7 |
| Realtime | Socket.io |
| Auth | own implementation, JWT plus Refresh Rotation, Argon2 |
| Email | Resend with React Email Templates |
| Frontend | React 19, Vite 6, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| State | TanStack Query, Zustand |
| Forms | React Hook Form, Zod |
| Storage | Hetzner Object Storage (S3 compatible) |
| Monorepo | pnpm Workspaces with Turborepo |
| Container | Docker Compose |
| Deployment | two Hetzner CX22 servers, App and Database isolated via Hetzner Private Network |
| CI | GitHub Actions, SSH Deploy |

---

## Architecture overview

```
[User Browser]
      |
      | HTTPS
      v
[App Server, public]
   |-- Nginx (reverse proxy, Lets Encrypt SSL)
   |-- NestJS API container
   |-- Vite SPA container
   `-- Redis container
      |
      | Hetzner Private Network (no public Postgres port)
      v
[Database Server, private]
   |-- Postgres 16 container
   `-- Backup cron to Hetzner Object Storage
```

Two server setup with strict separation: the database server has no public IP exposed for Postgres. All database traffic flows through a Hetzner Private Network. Backups are copied nightly to S3 compatible Object Storage with 7 day retention.

---

## Roadmap

| Sprint | Scope | Status |
|---|---|---|
| 0 | Monorepo setup, tooling, baseline | in progress |
| 1 | Auth (Register, Login, Refresh Rotation, Email Verification, Password Reset) | planned |
| 2 | Clans, Roles, Grant System foundation | planned |
| 3 | Games and Events | planned |
| 4 | Calendar and Trainings | planned |
| 5 | Email Notifications via Resend | planned |
| 6 | Realtime Chat via Socket.io | planned |
| 7 | Polish and Hetzner production deployment | planned |

Each sprint is closed when its features are tested, documented and merged to main.

---

## Local development

Requirements: Node 22+, pnpm 9+, Docker.

```bash
git clone https://github.com/SyK5/snio.git
cd snio
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm db:up
cd apps/api && pnpm prisma:migrate && pnpm seed && cd ../..
pnpm dev
```

API runs on http://localhost:3000, Web on http://localhost:5173.

---

## License

This project is licensed under the GNU Affero General Public License v3.0. See [LICENSE](LICENSE) for details.

If you use this code in a public web service, you must make your modifications publicly available under the same license.

---

## Author

Built by Alpay Sahin · [GitHub](https://github.com/SyK5) · [LinkedIn](https://www.linkedin.com/in/alpay-sahin-syk5)