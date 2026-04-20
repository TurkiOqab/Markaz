# Markaz — Fire Department Dashboard

Self-hosted desktop-style web app for a single fire station chief to manage
**employees**, **building**, and **vehicles**. Runs on the chief's office PC
and is accessible from his laptop over the local network. All data stays
on the office PC — no internet, no cloud.

UI and data are in Arabic (RTL).

---

## How to read this folder

- [`design.md`](design.md) — the full design spec (architecture, data model, API, errors, testing)
- [`seed-data/`](seed-data/) — realistic Arabic fake data (JSON) used for development and testing
- `phase-*.md` — detailed implementation plans, written one phase at a time

---

## Phases

| # | Phase | Deliverable |
|---|---|---|
| 0 | Project setup | Scaffolding runs `hello world` from backend + frontend |
| 1 | Database & auth | Login works, full schema + seed data loaded |
| 2 | Backend: Employees | Full employees API (with certifications, equipment, monthly ratings, photo) |
| 3 | Backend: Vehicles | Full vehicles API (with maintenance, onboard equipment, inspections) |
| 4 | Backend: Building | Full building API (rooms, inventory, maintenance, reports) |
| 5 | Frontend foundation | RTL React shell, login, shared components, API client |
| 6 | Frontend: Employees | Employees UI end-to-end |
| 7 | Frontend: Vehicles | Vehicles UI end-to-end |
| 8 | Frontend: Building | Building UI end-to-end |
| 9 | Deployment & installer | Windows installer (.exe), first-run wizard, certificate auto-trust, laptop installer, Windows service, firewall, scheduled backups |
| 10 | Handover & documentation | Arabic user manual (PDF), video walkthrough, laminated cheat sheet, in-person training session, remote-support setup |

Phases are sequential. Backend comes before frontend because the frontend consumes the backend API.

---

## Tech stack

- **Backend:** Python + FastAPI
- **Database:** SQLite with SQLCipher (encrypted at rest)
- **Frontend:** React + Vite + Tailwind CSS (with RTL plugin)
- **Auth:** Session cookies (HTTP-only), bcrypt-hashed password
- **TLS:** Self-signed HTTPS cert trusted on PC + laptop
- **Deployment:** Windows service (auto-start on boot)
- **Backup:** Scheduled daily copy of DB + uploads folder, 30-day retention
