# HKForms WebApp

Digitale Reservierungsverwaltung für die Waldwirtschaft Heidekönig. Gäste füllen ein signierbares Formular aus, Admins arbeiten im Backend weiter, erzeugen PDFs und versenden E-Mails. Stack: Next.js (App Router, TypeScript, Tailwind), Prisma/PostgreSQL, NextAuth (Credentials, RBAC), Nodemailer, Playwright.

## Funktionsumfang

- Geschütztes Anfrage-Formular per Invite-Link mit serverseitiger Validierung und Fehlerseite.
- Gastgeber- und Reservierungsdaten mit Pflichtfeld-Checks, Extras aus der Datenbank inkl. Preis-Snapshot.
- Automatische Preisberechnung, PDF-Export (Playwright) und E-Mail-Versand (Nodemailer).
- Admin-Portal (`/admin/*`) mit Rollen, Audit-Logs, Einladungs-Management, Benutzerverwaltung und Status-Workflow.
- Statische Pflichtseiten (`/impressum`, `/datenschutz`, `/cookies`) und Cookie-Banner mit Consent-Speicherung.

## Schnellstart lokal (App + DB)

1. `.env` anlegen: `cp .env.example .env` und Werte setzen (für Lokalbetrieb URLs auf `http://localhost:3000` stellen).
2. Postgres starten (Container): `docker compose up -d db`.
3. Abhängigkeiten installieren: `npm install`.
4. Datenbank vorbereiten:
   ```bash
   npx prisma migrate dev
   npm run prisma:generate
   npm run db:seed      # optional; nutzt ADMIN_EMAIL/ADMIN_PASSWORD
   ```
5. Admin erstellen (interaktiv): `npm run create-admin`.
6. Entwicklung starten: `npm run dev` → http://localhost:3000.

## Voraussetzungen

- Node.js 20+, npm.
- Docker + Docker Compose (für lokale DB oder Betrieb per Container).
- PostgreSQL 15 (lokal oder via Compose).
- Playwright-Abhängigkeiten sind im Docker-Image enthalten; lokal ggf. `npx playwright install --with-deps`.

## Konfiguration (.env)

- **URLs & Routing:** `APP_URL`, `ADMIN_BASE_URL`, `PUBLIC_FORM_URL`, `NEXTAUTH_URL`, `ENFORCE_DOMAIN_ROUTING` (trennt Admin-/Formular-Domain).
- **Auth & Token:** `NEXTAUTH_SECRET`, `INVITE_TOKEN_SECRET`, `INVITE_LINK_HOURS`, `INVITE_DEFAULT_EXPIRY_DAYS` (Invite ist immer Pflicht; `INVITE_REQUIRE_TOKEN` bleibt nur der Vollständigkeit halber).
- **Datenbank:** `DATABASE_URL` (z. B. `postgresql://postgres:postgres@localhost:5432/hkforms`), plus `POSTGRES_*` für den Compose-DB-Container.
- **Preis/Session:** `NEXT_PUBLIC_PRICE_PER_GUEST`, `AUTO_LOGOUT_MINUTES`.
- **SMTP:** `SMTP_HOST`, `SMTP_PORT` (465=SSL, 587=StartTLS secure=false), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `ADMIN_NOTIFICATION_EMAILS`.
- **Rate Limit & Mails:** `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `SEND_GUEST_CONFIRMATION`.
- **Seed:** `ADMIN_EMAIL`, `ADMIN_PASSWORD` für `npm run db:seed`.

## Lokale Installation Schritt für Schritt

### 1) Datenbank starten

- Variante Compose: `docker compose up -d db` nutzt die Werte aus `.env` und legt ein Volume `pgdata` an.
- Variante externe DB: eigenen Postgres bereitstellen, `DATABASE_URL` anpassen und sicherstellen, dass der User die nötigen Rechte besitzt.

### 2) Prisma & Schema anwenden

```bash
npx prisma migrate dev     # erstellt/aktualisiert das Schema
npm run prisma:generate    # generiert den Client (erwartet gültige DATABASE_URL)
npm run db:seed            # optional: Admin-Seed per ENV
```

### 3) Admin anlegen

```bash
npm run create-admin
# fragt E-Mail + Passwort ab und legt einen ADMIN-User an
```

### 4) App starten

```bash
npm run dev   # Next.js dev server auf http://localhost:3000
```

Statische Pflichtseiten (`/impressum`, `/datenschutz`, `/cookies`) enthalten Platzhalter und sollten vor Livegang befüllt werden.

## Tests & Qualität

- Tests: `npm run test` (Vitest).
- Linting: `npm run lint`.

## Docker / Produktion

1. **ENV füllen:** mindestens `APP_URL`, `ADMIN_BASE_URL`, `PUBLIC_FORM_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`, SMTP-Werte und ggf. Rate-Limit/Invite-Settings.
2. **Image bauen:** `docker build -t hkforms:latest .`
3. **Stack starten:** `docker compose up -d --build`
   - Service `app` führt beim Start `prisma migrate deploy` aus und startet `next start`.
   - Service `db` (PostgreSQL 15) exponiert Port `5432` und persistiert in `pgdata`.
   - App läuft standardmäßig auf Port `3000`.
4. **Reverse Proxy:** Zwei Hosts einrichten (z. B. `forms.example.de` für `/request` und `app.example.de` für `/admin` + `/api/auth`). Beide können auf denselben Container zeigen; `ENFORCE_DOMAIN_ROUTING=true` erzwingt das passende Routing. SSL im Proxy aktivieren, `X-Forwarded-*` Header durchreichen.

## Backup & Restore (PostgreSQL)

```bash
# Dump erstellen
docker compose exec db pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > backup.sql

# Dump einspielen
cat backup.sql | docker compose exec -T db psql -U ${POSTGRES_USER} ${POSTGRES_DB}
```

Backups regelmäßig automatisieren und Volume `pgdata` sichern.

## Betrieb & Administration

- Invite-Links verwalten unter `/admin/invites` (Token wird nur bei Erstellung angezeigt/versendet).
- E-Mail-Versand setzt korrekte SMTP-Daten voraus; bei 535-Fehlern Zugangsdaten/App-Passwort prüfen.
- Rate Limiting ist in-memory; für Produktion empfiehlt sich ein Redis-Adapter (siehe `src/lib/rate-limit.ts`).
- Playwright-Dependencies sind im Basis-Image enthalten; für Custom-Builds das `mcr.microsoft.com/playwright` Image oder `npx playwright install --with-deps` nutzen.

## Projektstruktur (Kurzfassung)

```
├─ src/
│  ├─ app/               # Next.js App Router (Public Form, Admin, Auth, API)
│  ├─ components/        # UI-Komponenten
│  ├─ lib/               # Prisma, Auth, PDF, E-Mail, Tokens, RBAC, Rate Limit
│  ├─ server/actions/    # Server Actions für Reservierungen, Invites, Users
│  └─ types/             # Typ-Erweiterungen
├─ prisma/schema.prisma  # Datenmodell inkl. Audit/Email/Invite/Extras
├─ scripts/create-admin.ts
├─ prisma/seed.ts
├─ docker-compose.yml / Dockerfile
└─ tests/                # Vitest-Suite
```

## Nützliche Skripte

- `npm run dev` – Development-Server.
- `npm run build` / `npm run start` – Production-Build & Start.
- `npm run prisma:migrate` – `prisma migrate deploy` (für CI/Prod).
- `npm run prisma:generate` – Prisma Client erzeugen.
- `npm run db:seed` – Admin-Seed aus ENV.
- `npm run create-admin` – Interaktiv Admin anlegen.
- `npm run test` – Tests ausführen.
- `npm run lint` – Linting.

## Troubleshooting

- `NEXTAUTH_SECRET` und `INVITE_TOKEN_SECRET` müssen gesetzt sein, sonst schlagen Login/Invites fehl.
- Bei lokalem Betrieb `APP_URL`, `ADMIN_BASE_URL`, `PUBLIC_FORM_URL` und `NEXTAUTH_URL` auf `http://localhost:3000` stellen.
- Wenn `prisma generate` fehlschlägt, `DATABASE_URL` prüfen und sicherstellen, dass Postgres erreichbar ist.
