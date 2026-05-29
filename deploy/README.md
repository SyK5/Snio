# Snio Production Deploy

Two Server Setup auf Hetzner Cloud mit Private Network.

## Architektur

**App Server** (CX22, Public + Private IP):
- Caddy (Reverse Proxy, Auto SSL via Let's Encrypt)
- web (nginx static, Vite Build)
- api (NestJS, intern)
- redis (intern)

**DB Server** (CX22, NUR Private IP):
- postgres (Port nur an Private Interface gebunden)
- Public Network in Hetzner Console deaktiviert
- Backup Cron auf Hetzner Object Storage

**Privates Netzwerk:**
- Network: 10.0.0.0/24
- Subnet: 10.0.0.0/28
- Gateway: 10.0.0.1 (reserviert)
- DB Server: 10.0.0.2
- App Server: 10.0.0.3

## Files

| Datei | Wohin | Zweck |
|---|---|---|
| `docker-compose.prod.yml` | App Server `/opt/snio/docker-compose.yml` | Caddy, web, api, redis |
| `docker-compose.db.yml` | DB Server `/opt/snio-db/docker-compose.yml` | Postgres |
| `Caddyfile` | App Server `/opt/snio/Caddyfile` | Reverse Proxy Routing |
| `.env.production.example` | Template fuer App Server `/opt/snio/.env` | App Secrets |
| `.env.db.example` | Template fuer DB Server `/opt/snio-db/.env` | DB Credentials |

## Initial Setup

### DB Server zuerst

Server in Hetzner Cloud mit temporaer aktivem Public Network erstellen:

- Name: `snio-db-01`
- Image: Ubuntu LTS
- Type: CX22
- SSH Key: `alpay-snio`
- Network: `snio-private`
- Private IP: `10.0.0.2`
- Public IPv4: fuer Bootstrap aktiv, danach deaktivieren

Das Subnet `10.0.0.0/28` ist innerhalb des Networks `10.0.0.0/24` korrekt. Es reicht für 14 nutzbare private Adressen; `10.0.0.1` ist Gateway/reserviert.

```bash
ssh root@<db_public_ip_temporaer>
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
mkdir -p /opt/snio-db/backups
cd /opt/snio-db
# docker-compose.db.yml hierhin kopieren als docker-compose.yml
# .env aus Template anlegen mit echten Werten
docker compose up -d
docker compose ps
```

Vor dem Deaktivieren des Public Networks vom App Server aus testen:

```bash
nc -vz 10.0.0.2 5432
```

Wenn der Test erfolgreich ist, Public Network in der Hetzner Console fuer den DB Server deaktivieren.

### App Server

Server in Hetzner Cloud erstellen:

- Name: `snio-app-01`
- Image: Ubuntu LTS
- Type: CX22
- SSH Key: `alpay-snio`
- Network: `snio-private`
- Private IP: `10.0.0.3`
- Public IPv4: aktiv

```bash
ssh root@<app_public_ip>
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable
mkdir -p /opt/snio
cd /opt/snio
# docker-compose.prod.yml hierhin als docker-compose.yml
# Caddyfile hierhin
# .env aus Template anlegen mit echten Werten plus DB Private IP
docker compose pull
docker compose up -d
```

## DNS bei Porkbun

```
A    snio.gg       <app_server_public_ip>
A    www.snio.gg   <app_server_public_ip>
```

Caddy holt Let's Encrypt Zertifikat automatisch sobald die Domain auf den Server zeigt.

## Sicherheits Layer

1. Hetzner Cloud Firewall: nur 22, 80, 443 auf App Server. DB Server keine Public Ports.
2. UFW auf App Server identisch zur Cloud Firewall.
3. DB Server Public Network in Hetzner deaktiviert (UI Toggle).
4. Postgres bindet nur an Private IP via `${PRIVATE_IP}:5432:5432`.
5. Postgres plus Redis nutzen starke Passwoerter (`openssl rand -base64 48`).
6. JWT Secrets jeweils 64+ Zeichen, ACCESS und REFRESH unterschiedlich.
7. SSH Deploy Key ist dediziert (nicht persoenlicher Key).
8. Container laufen als non root User.

Hinweis: Wenn der DB Server kein Public Network hat, hat er ohne zusätzliches NAT auch keinen normalen Internet-Outbound fuer `apt update`, `docker pull` oder externe Backups. Für Wartung entweder Public Network temporär kontrolliert aktivieren oder einen NAT-Weg über den App Server planen.

## GitHub Secrets

| Secret | Inhalt |
|---|---|
| `HETZNER_HOST` | App Server Public IP |
| `SSH_USER` | Deploy User auf App Server |
| `SSH_PRIVATE_KEY` | Private Key des dedizierten Deploy Keys |
| `DISCORD_WEBHOOK` | Discord Webhook URL |

## Migrations

Der API Container fuehrt beim Start automatisch `prisma migrate deploy` aus. Neue Migrations in `apps/api/prisma/migrations/` werden beim naechsten Deploy automatisch angewendet.
