# HKForms WebApp

Digitale Reservierungsverwaltung (Next.js, Prisma/PostgreSQL, NextAuth, Tailwind). Gäste füllen ein signierbares Formular aus, Admins verwalten Anfragen, erzeugen PDFs/ICS und versenden E-Mails.

## 1) Projekt-Überblick
- Öffentliche Formularstrecke per Invite-Link mit Validierung.
- Admin-Portal mit Rollen/RBAC, Status-Workflow, E-Mail-/PDF-/ICS-Versand, Audit-Logs, Benutzer- und Invite-Management.
- Preisberechnung inkl. Extras, statische Pflichtseiten (Impressum/Datenschutz/Cookies), Cookie-Banner.

## 2) Voraussetzungen
- Docker ≥ 24.x, Docker Compose (Plugin) ≥ 2.20.
- Git ≥ 2.40.
- Optional lokal: Node.js 20+ / npm für Entwicklung ohne Docker.
- `.env` erforderlich (Beispiel: `.env.example`, falls vorhanden); enthält URLs, Secrets, DB, SMTP, Preise etc.

## 3) Installation & Start mit Docker (Schritt für Schritt)
1. Repo klonen  
   ```bash
   git clone https://github.com/<org>/hkforms.git
   cd hkforms
   ```
2. `.env` anlegen/prüfen  
   ```bash
   cp .env.example .env   # falls vorhanden
   # Werte für URLs, NEXTAUTH_SECRET, INVITE_TOKEN_SECRET, DATABASE_URL, SMTP_* setzen
   ```
3. Image bauen (mit Tag-Version)  
   ```bash
   docker build -t hkforms_main-app:0.6.5 .
   ```
4. Container starten (Beispiel Docker Compose)  
   ```bash
   docker compose up -d          # nutzt docker-compose.yml / compose.yaml
   # App auf Port 3000, DB auf 5432 (siehe .env)
   ```
   Alternativ `docker run` (ohne Compose):  
   ```bash
   docker run -d --name hkforms \
     --env-file .env -p 3000:3000 \
     hkforms_main-app:0.6.5
   ```
5. Logs prüfen / Container steuern  
   ```bash
   docker compose logs -f app
   docker compose stop app
   docker compose start app
   ```
6. Migration/Seed (falls nicht automatisch)  
   ```bash
   docker compose exec app npm run prisma:migrate
   docker compose exec app npm run db:seed   # optional; nutzt ADMIN_EMAIL/ADMIN_PASSWORD
   ```

## 4) Wichtige Docker-Befehle (mit Versionierung)
- Build mit Tag: `docker build -t name:version .`
- Start/Stop mit Compose: `docker compose up -d`, `docker compose down`
- Logs: `docker compose logs -f app`
- In Container: `docker compose exec app sh`
- Tagging/Pushing: `docker tag name:version registry/name:version` + `docker push registry/name:version`

## 5) Git-Workflows
- Klonen: `git clone <repo-url>`
- Branch-Strategie (Standard): pro Feature/Issue ein Branch (`git checkout -b feature/<kurzbeschreibung>`).
- Commit-Messages kurz & präzise; gern konventionell (`feat: ...`, `fix: ...`).
- Pull/Fetch & Rebase: `git fetch origin` → `git rebase origin/dev` (oder `git merge`) je nach Team-Vorgabe.
- Änderungen prüfen/stagen/committen:  
  ```bash
  git status
  git add <files>
  git commit -m "feat: beschreibung"
  ```
- Vor PR: Lint/Tests lokal ausführen (siehe unten), Konflikte lösen.

## 6) Entwicklung & Tests (kurz)
- Lokal ohne Docker (optional):  
  ```bash
  npm install
  npx prisma migrate dev
  npm run dev   # http://localhost:3000
  ```
- Tests: `npm run test` (Vitest)
- Lint: `npm run lint`

## 7) Deployment/Release
- Images versionieren (z. B. `hkforms_main-app:0.6.5`) und im Registry ablegen.
- Deployment via Compose/Orchestrator: Image-Tag aktualisieren, `docker compose pull && docker compose up -d`.
- Migrations sicherstellen: `npm run prisma:migrate` (oder automatisiert beim Start).

## 8) Troubleshooting
- Port belegt: Ports 3000/5432 anpassen (`.env`, Compose-Port-Mapping).
- `.env` fehlt/fehlerhaft: Secrets/URLs/DB/SMTP setzen; `NEXTAUTH_SECRET` und `INVITE_TOKEN_SECRET` sind Pflicht.
- Build schlägt fehl (Prisma): `DATABASE_URL` prüfen, DB erreichbar?, Rechte ok?
- SMTP-Fehler: Host/Port/SSL-Einstellung (`secure`) und Credentials kontrollieren; Test-Button in den E-Mail-Einstellungen nutzen.
- Invite/Token-Probleme: `INVITE_TOKEN_SECRET`, Ablaufzeiten (`INVITE_LINK_HOURS`/`INVITE_DEFAULT_EXPIRY_DAYS`) prüfen.
