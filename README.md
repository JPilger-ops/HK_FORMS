# HKFormsWebAPP

Digitale Reservierungsverwaltung für die Waldwirtschaft Heidekönig. Gäste können ein Formular inkl. digitaler Unterschrift ausfüllen, Admins verwalten die Vorgänge, generieren PDFs & verschicken E-Mails. Tech-Stack: Next.js (App Router, TypeScript, Tailwind), Prisma/PostgreSQL, NextAuth Credentials (RBAC), Nodemailer & Playwright für PDF.

## Features

- Public Request-Formular nur per gültigem Invite-Link (`/request?token=...`), serverseitige Validierung + Fehlerseite `/request/invalid`; Fixes: End-Uhrzeit 22:30 wird serverseitig erzwungen.
- Gastgeberdaten strukturiert (Vor-/Nachname, Adresse, Telefon, E-Mail), Pflichtfeld-Validierung inkl. Basis-Telefoncheck; Zahlungsarten auf Barzahlung/Rechnung beschränkt.
- Extras kommen aus der Datenbank (`ExtraOption`), Auswahl speichert Snapshot (Label/Preis/Typ) pro Anfrage; Verwaltung im Admin unter `/admin/settings/formular` inkl. Aktiv/Inaktiv und Reihenfolge.
- Automatische Preisberechnung (Grundpreis + Extras) + PDF-Export (Playwright) & E-Mail-Versand (Nodemailer); PDF/E-Mails spiegeln neue Labels/Felder wider, inkl. Bemerkungen / Unverträglichkeiten.
- Adminpanel `/admin/*` mit NextAuth (Credentials + RBAC Admin/Mitarbeiter), Anfragenliste/-details, Statusworkflow, Audit-/Email-Logs, Einladungs-Management `/admin/invites`, Benutzerverwaltung; Auto-Logout pro ENV.
- Cookie-Banner (Consent wird als Cookie/localStorage gespeichert) + statische DSGVO-Seiten `/impressum`, `/datenschutz`, `/cookies`; Footer-Links auf Public/Admin-Login.
- Server Actions + Next.js Route-Handler, Prisma Schema inkl. User, ReservationRequest, Signature, EmailLog, InviteLink, AuditLog, ExtraOption. Deployment via Docker Compose (Next.js + PostgreSQL) hinter vorhandenem Reverse Proxy.

## Getting Started (Local Dev)

1. **Voraussetzungen:** Node.js 20+, npm, Docker (für lokale DB) & Playwright-Dependencies (durch Dockerfile oder `npx playwright install --with-deps`).
2. **ENV anlegen:** `cp .env.example .env` und Werte setzen (DATABASE_URL, NEXTAUTH_URL, SMTP usw.). Für lokale DB: `postgresql://postgres:postgres@localhost:5432/hkforms`. `INVITE_LINK_HOURS` steuert die Gültigkeit der Token-Links.
   - Invite: `INVITE_TOKEN_SECRET`, `INVITE_DEFAULT_EXPIRY_DAYS` (Formular ist immer token-geschützt; `INVITE_REQUIRE_TOKEN` bleibt nur für Abwärtskompatibilität in der ENV-Liste).
   - Preis/Session: `NEXT_PUBLIC_PRICE_PER_GUEST` (Grundpreis pro Person, wird auf Client & Server genutzt) und `AUTO_LOGOUT_MINUTES` (Auto-Logout im Adminbereich).
3. **Dependencies installieren:** `npm install`.
4. **Prisma vorbereiten:**
   ```bash
   npx prisma migrate dev
   npm run prisma:generate
   # optional Admin Seed über ENV
   npm run db:seed
   ```
5. **Admin User anlegen:** `npm run create-admin` (fragt E-Mail/Passwort, legt Role=ADMIN an).
6. **Entwicklung starten:** `npm run dev` (läuft auf http://localhost:3000, APP_URL/NEXTAUTH_URL entsprechend setzen).

Nach den Migrationen stehen die neuen Felder (Gastgeberstruktur, Extras-Snapshot, Legacy-Backup) sowie die Tabelle `ExtraOption` bereit. Extras werden ausschließlich im Admin unter `/admin/settings/formular` gepflegt (aktiv/inaktiv, Preislogik, Reihenfolge). Ohne Einträge ist das Formular trotzdem absendbar.

Statische Seiten `/impressum`, `/datenschutz`, `/cookies` enthalten Platzhalter („HIER TEXT EINTRAGEN“) und sollten vor Go-Live befüllt werden. Das Cookie-Banner speichert Consent in Cookie/localStorage und verweist auf diese Seiten.

### SMTP / E-Mail Hinweise

- `SMTP_HOST/PORT/USER/PASS/FROM` müssen valide sein; Port 465 = SSL, 587 = STARTTLS (secure=false). Fehler `535 Authentication credentials invalid` bedeutet falsche Zugangsdaten/App-Passwort.
- `ADMIN_NOTIFICATION_EMAILS` leer lassen, wenn vorerst kein Versand gewünscht ist.
- `INVITE_TOKEN_SECRET` muss gesetzt sein, sonst schlagen Invite-Operationen fehl.

## Tests

- `npm run test` führt Vitest-Suite aus (Token/Invite, Reservation-Action, PDF-Renderer (mocked Playwright), RBAC).

## Docker & Deployment

1. **ENV für Produktion:** Mindestens `APP_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL` (z. B. `postgresql://postgres:postgres@db:5432/hkforms`), SMTP-Settings, Admin-E-Mail-Liste.
2. **Build & Start:**

   ```bash
   docker compose up -d --build
   ```

   - Service `app` führt `prisma migrate deploy` aus und startet `next start`.
   - `db` ist ein PostgreSQL 15-Container mit Volume `pgdata`.
   - Standard-Host laut Vorgabe: App auf `192.168.60.100:3000`, Proxy auf `192.168.50.100`.

3. **Reverse Proxy Manager (bestehender NGINX bei 192.168.50.100):**
   - Forward Host/IP: `192.168.60.100` (App-Server), Port `3000` (oder freigegebenen Compose-Port).
   - SSL/TLS-Termination im Proxy aktivieren (LetsEncrypt), HTTP→HTTPS redirect erzwingen.
   - Unter „Custom Nginx Config“ sicherstellen, dass `X-Forwarded-For` & `X-Forwarded-Proto` gesetzt werden. NextAuth vertraut den Headern (`trustHost`), Cookies sind `Secure` im Production-Mode.
   - `APP_URL`/`NEXTAUTH_URL` unbedingt auf die externe https-URL setzen, damit Cookies & Invite-Links stimmen.
4. **Trusted Proxy Hinweise:** Wenn der Proxy auf 192.168.50.100 sitzt und die App auf 192.168.60.100, sollten Firewall-Regeln nur Verkehr vom Proxy erlauben. In Kubernetes/PM2-Szenarien unbedingt `X-Forwarded-*` pflegen, damit Rate Limiting & Logs IPs korrekt sehen.

## Datenbank: Backup & Restore

```bash
# Dump
docker compose exec db pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > backup.sql
# Restore
cat backup.sql | docker compose exec -T db psql -U ${POSTGRES_USER} ${POSTGRES_DB}
```

Regelmäßige Backups automatisieren, Volumes sichern (Volume `pgdata`).

## Einladungen (Token-Links)

- Adminbereich: `/admin/invites` erstellt Einladungs-Links (Formular-Key, Empfänger, Ablauf in Tagen, max. Nutzungen, Notiz).
- Token wird nur bei Erstellung zurückgegeben/versendet; in der DB liegt ausschließlich der HMAC-Hash.
- Public Validation: `GET /api/invites/validate?token=...` liefert Status/Fehler.
- Formular-Submit erwartet Token, wenn `INVITE_REQUIRE_TOKEN=true`; serverseitige Re-Validierung + Race-sichere Verwendung (`useCount`+`usedAt` werden per Transaktion aktualisiert).
- E-Mail-Versand via SMTP (`sendInviteEmail`), Logging in `EmailLog` mit `inviteLinkId`.

## Sicherheit & Betrieb

- **Secrets:** `.env` nie commiten; nur `.env.example`. Verwende einen Secret-Manager (Vault, Doppler, Docker Swarm Secrets).
- **Admin-Erstellung:** Entweder über `npm run create-admin` oder einmalig über `ADMIN_EMAIL/ADMIN_PASSWORD` + `npm run db:seed` (z. B. beim CI/CD deploy).
- **Rate Limiting:** Aktuell In-Memory (konfigurierbar via `RATE_LIMIT_*`). Für Produktion empfiehlt sich Upstash/Redis – Adapter leicht erweiterbar im Modul `src/lib/rate-limit.ts`.
- **Playwright Dependencies:** Im Dockerfile wird das offizielle `mcr.microsoft.com/playwright`-Image verwendet → Chromium & Fonts sind enthalten.
- **Logging / Audit:** Tabelle `AuditLog` (Status-/Email-/Link-Aktionen). `EmailLog` enthält SMTP-Ergebnis (SENT/FAILED/AUDIT).

## Git Workflow Empfehlung

- Branches: `main` (stable), optional `develop`, Feature-Branches `feature/<beschreibung>`.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:` etc.
- Beispiel:
  ```bash
  git init
  git remote add origin git@github.com:org/HKFormsWebAPP.git
  git checkout -b develop
  git checkout -b feature/reservation-form
  git add .
  git commit -m "feat: implement reservation workflow"
  git push -u origin feature/reservation-form
  ```

## Projektstruktur (Kurzüberblick)

```
├─ src/
│  ├─ app/               # Next.js App Router (public form, admin, API auth)
│  ├─ components/        # UI-Komponenten (Formular, Admin-Shell, Status-Badges)
│  ├─ lib/               # Prisma, Auth, PDF, Email, Tokens, RBAC, Rate Limit
│  ├─ server/actions/    # Server Actions (reservations, invite, users)
│  └─ types/             # NextAuth Typ-Erweiterungen
├─ prisma/schema.prisma  # Datenmodell User/Reservation/Signature/... + AuditLog
├─ scripts/create-admin.ts / prisma/seed.ts
├─ tests/                # Vitest-Suite lt. Muss-Kriterien
├─ docker-compose.yml + Dockerfile
└─ README.md
```

Weitere Details & Betriebsanweisungen sind in den Quellkommentaren dokumentiert.

# HK_FORMS
