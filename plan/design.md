# Markaz — Design Spec

**Date:** 2026-04-20
**Status:** Approved (pending user spec review)

A self-hosted web app for a single fire station chief to manage employees,
the station building, and vehicles. Runs on the chief's office PC and is
accessible from his laptop over the local network. Arabic UI (RTL), all
data stored locally, no internet required.

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Office PC (Windows)                      │
│                                                             │
│   ┌──────────────┐         ┌─────────────────────────┐      │
│   │  Browser     │◄──HTTPS─┤  Local Server           │      │
│   │  (chief)     │         │  (FastAPI, port 8443)   │      │
│   └──────────────┘         │                         │      │
│                            │  ┌──────────────────┐   │      │
│                            │  │  SQLite DB       │   │      │
│                            │  │  (SQLCipher)     │   │      │
│                            │  └──────────────────┘   │      │
│                            │  ┌──────────────────┐   │      │
│                            │  │  Photo storage   │   │      │
│                            │  │  (/uploads)      │   │      │
│                            │  └──────────────────┘   │      │
│                            │  ┌──────────────────┐   │      │
│                            │  │  Backup job      │   │      │
│                            │  │  (daily 2am)     │   │      │
│                            │  └──────────────────┘   │      │
│                            └────────────▲────────────┘      │
└─────────────────────────────────────────┼───────────────────┘
                                          │
                                      LAN (HTTPS)
                                          │
                          ┌───────────────┴──────┐
                          │   Chief's laptop     │
                          │   (Browser)          │
                          └──────────────────────┘
```

### Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Python + FastAPI | Small, fast, typed, automatic API docs |
| Database | SQLite (SQLCipher in production) | Single file (encrypted in prod), trivial backup, no DB server |
| Frontend | React + Vite + Tailwind (RTL plugin) | Best RTL/Arabic support, modern, fast |
| Auth | HTTP-only session cookie + bcrypt | Simple, secure, no JWT complexity needed |
| TLS | Self-signed HTTPS cert | Encrypted LAN traffic, one-time setup |
| Deployment | Windows service | Auto-start on boot |
| Backup | Windows scheduled task | Daily DB + uploads copy, 30-day retention |

### Security model

- Server binds to LAN only; office router blocks inbound internet traffic
- Windows Firewall restricts port access to laptop IP / LAN subnet
- Single chief account; bcrypt-hashed password; brute-force lockout (5 failed attempts / 15 min → 15-min block)
- HTTP-only `session` cookie; 14-day expiry
- SQLCipher encrypts the DB file at rest (unreadable if PC stolen)
- All traffic over HTTPS (self-signed cert trusted on both devices)

### First-run setup

On first launch (after install), the backend detects an empty user table and redirects the chief to a setup screen where he:
1. Sets his password (minimum 10 characters, shown in Arabic with requirements)
2. Provides the SQLCipher database passphrase (or accepts a generated one, stored in a config file with restricted file permissions)

After setup, the login screen replaces the setup screen permanently.

---

## 2. Data Model

Column names stay in English (standard coding practice). **All stored data and UI labels are Arabic.** SQLite handles Arabic natively via UTF-8.

### Entities

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   teams     │◄────────│    employees     │────────►│  certifications  │
└─────────────┘  N:1    └────────┬─────────┘  1:N    └──────────────────┘
                                 │
                                 ├──► equipment         (1:N)
                                 └──► monthly_ratings   (1:N)

┌──────────────────┐         ┌──────────────────┐
│    vehicles      │────────►│ vehicle_mainten. │         (1:N)
└────────┬─────────┘         ├ vehicle_equipment│         (1:N)
         │                   └ vehicle_inspect. │         (1:N)
         │ driver (N:1 → employees)
         └───────────►

┌──────────────────┐
│    building      │  (single row, id=1)
└────────┬─────────┘
         │ 1:N
         ├──► rooms
         ├──► inventory
         ├──► building_maintenance
         └──► building_reports
```

### Table: `employees`

| column | type | notes |
|---|---|---|
| id | integer PK | |
| name | text | الاسم |
| rank | text | الرتبة |
| specialty | text | التخصص (one per employee) |
| date_of_birth | date | age derived from DOB |
| marital_status | text | enum: أعزب، متزوج، مطلق، أرمل |
| physical_ability | text | enum: ممتاز، جيد جداً، جيد، مقبول |
| national_id | text unique | الرقم الوطني |
| photo_path | text nullable | path in /uploads |
| phone | text | الهاتف |
| email | text nullable | البريد الإلكتروني |
| team_id | FK → teams | |
| shift | text | enum: صباحية، مسائية، ليلية |
| created_at, updated_at | timestamps | |

### Table: `teams`
`id, name, description`

### Table: `certifications` (1:N from employees)
`id, employee_id, name, issuing_authority, issue_date, expiry_date`

### Table: `equipment` (1:N from employees)
`id, employee_id, item_name, serial_number, assigned_date, condition`

### Table: `monthly_ratings` (1:N from employees — cumulative history)
`id, employee_id, year, month, rating, notes, created_at`
Unique constraint on `(employee_id, year, month)`.

### Table: `vehicles`

| column | type | notes |
|---|---|---|
| id | integer PK | |
| type | text | enum: إطفاء، إسعاف، سلم، قيادة، إنقاذ |
| plate_number | text unique | رقم اللوحة |
| status | text | enum: في الخدمة، خارج الخدمة، صيانة |
| driver_id | FK → employees nullable | |
| photo_path | text nullable | |
| created_at, updated_at | timestamps | |

### Table: `vehicle_maintenance` (1:N)
`id, vehicle_id, date, description, cost, contractor, status`

### Table: `vehicle_equipment` (1:N — onboard inventory)
`id, vehicle_id, item_name, quantity, condition`

### Table: `vehicle_inspections` (1:N)
`id, vehicle_id, inspection_date, inspector_name, result, notes`

### Table: `building` (single row, id=1)
`id=1, name, address, notes`

### Table: `rooms`
`id, type (enum: غرفة نوم، مكتب، قاعة تدريس، مرفق), name, capacity, status, notes`

### Table: `inventory`
`id, item_name, category, quantity, location, min_threshold, notes`

### Table: `building_maintenance`
`id, date, description, cost, contractor, status`

### Table: `building_reports`
`id, date, title, summary, file_path (optional PDF/image attachment)`

---

## 3. API

REST over HTTPS. JSON request and response bodies. Session cookie for auth.

### Endpoints

```
POST   /api/auth/login              → set session cookie
POST   /api/auth/logout             → clear session

# Employees (+ nested resources)
GET    /api/employees               → list (pagination, search, filter by team/shift)
POST   /api/employees               → create
GET    /api/employees/{id}          → get with nested certifications/equipment/ratings
PATCH  /api/employees/{id}          → update
DELETE /api/employees/{id}          → delete (blocked if employee is a vehicle driver)
POST   /api/employees/{id}/photo    → multipart upload

GET/POST/PATCH/DELETE  /api/employees/{id}/certifications[/{cid}]
GET/POST/PATCH/DELETE  /api/employees/{id}/equipment[/{eid}]
GET/POST/PATCH/DELETE  /api/employees/{id}/ratings[/{rid}]

# Vehicles (+ nested)
GET/POST/PATCH/DELETE  /api/vehicles[/{id}]
POST                   /api/vehicles/{id}/photo
GET/POST/PATCH/DELETE  /api/vehicles/{id}/maintenance[/{mid}]
GET/POST/PATCH/DELETE  /api/vehicles/{id}/equipment[/{eid}]
GET/POST/PATCH/DELETE  /api/vehicles/{id}/inspections[/{iid}]

# Building (single) + nested
GET/PATCH              /api/building
GET/POST/PATCH/DELETE  /api/building/rooms[/{id}]
GET/POST/PATCH/DELETE  /api/building/inventory[/{id}]
GET/POST/PATCH/DELETE  /api/building/maintenance[/{id}]
GET/POST/PATCH/DELETE  /api/building/reports[/{id}]

# Lookups
GET    /api/teams
```

### Response shape

```json
// Success
{ "data": { ... } }

// Error
{ "error": { "code": "VALIDATION", "message": "رقم اللوحة موجود مسبقاً" } }
```

### File uploads
- Accepted: JPG, PNG, WebP (photos); PDF (reports)
- Max size: 5 MB (photos), 20 MB (report attachments)
- Stored under `/uploads/{resource}/{id}.{ext}`
- Served via `GET /uploads/...` behind session auth

---

## 4. Error Handling

| Error type | HTTP | Handling |
|---|---|---|
| Validation (missing/bad field) | 400 | Per-field Arabic message, frontend highlights field |
| Unauthorized (no/expired session) | 401 | Frontend redirects to login |
| Not found | 404 | Frontend shows "غير موجود" page |
| Conflict (duplicate unique field) | 409 | Field-level Arabic error |
| File too large / wrong type | 413 / 415 | Arabic toast, file input clears |
| Server error | 500 | Generic Arabic message; full details in server log |

- **Logging:** rotating daily log files, 30-day retention. Never expose stack traces to the chief.
- **DB integrity:** foreign keys enforced. Deleting an employee who drives a vehicle is blocked with clear Arabic error.
- **Transactions:** multi-table writes (e.g., create employee + initial certifications) run in a single transaction.

---

## 5. Testing Strategy

| Layer | Tools | Scope |
|---|---|---|
| Backend unit | pytest | Validation rules, business logic |
| Backend integration | pytest + in-memory SQLite | Every endpoint: happy path + error paths |
| Auth | pytest | Login, lockout, session expiry |
| Frontend components | Vitest + React Testing Library | Forms, RTL rendering, Arabic validation messages |
| E2E | Playwright | Login → CRUD one of each entity → logout |

Coverage targets: backend ~80%, frontend ~60%. Focus on behaviour that matters — no coverage chasing.

---

## 6. Seed Data

Realistic Arabic fake data is generated **before implementation** (in `plan/seed-data/*.json`) so the chief can review what realistic records look like. In Phase 1, a `seed.py` script consumes these JSON files to populate the DB on first run.

| Entity | Count |
|---|---|
| Teams | 3 (الفريق أ، ب، ج) |
| Employees | 20 (with certifications, equipment, 3–6 months of ratings each) |
| Vehicles | 8 (mix of types, with maintenance, equipment, inspections) |
| Building | 1 (with ~15 rooms, ~30 inventory items, ~5 maintenance records, ~3 reports) |

---

## 7. Development Phases

See [README.md](README.md) for the phase table. Each phase gets a detailed plan file written when that phase begins (not all upfront — we learn as we build).

Phases are sequential. Inside a phase, work can parallelize where tasks are independent.

### Phase 9 — Deployment & installer (expanded)

The chief has no technical experience, so every install/setup step must be zero-command and Arabic-labeled.

**Office-PC installer (`markaz-install.exe`):**
- One double-click, Arabic GUI throughout
- Installs Python runtime + backend (bundled, no separate Python install required)
- Installs SQLCipher native library + `pysqlcipher3` driver; sets `MARKAZ_DB_URL` to a SQLCipher-backed URL so the DB file is encrypted at rest
- Creates the encrypted DB and runs migrations + seed data loader on first run
- Generates self-signed HTTPS cert for `https://markaz.local` (and/or the PC's LAN IP)
- Adds the cert to Windows' Trusted Root Certification Authorities
- Registers the backend as a Windows service set to auto-start
- Creates a desktop shortcut "مركز" that opens the browser to the app
- Configures Windows Firewall: allow inbound on port 8443 only from the office LAN subnet
- Creates a Windows Scheduled Task for daily backup (2am, 30-day retention)
- Opens the browser to the first-run setup wizard (password + backup folder)

**Laptop installer (`markaz-laptop-install.exe`):**
- One double-click, Arabic GUI
- Installs the HTTPS cert into Windows' Trusted Root store
- Creates a desktop shortcut "مركز" pointing to the office PC's URL
- No backend installed on the laptop

**Access scope:** The laptop works **only when it is connected to the office LAN** (office WiFi). This is intentional — remote access from outside the office is out of scope (would require VPN; see section 8).

---

## 8. Handover & Support (Phase 10)

Handover is a first-class deliverable, not an afterthought.

**Documentation (all in Arabic):**
- User manual PDF — 10–15 pages with screenshots, covering every CRUD flow
- Video walkthrough — ~10 minutes, screen-recorded with narration
- Laminated A4 cheat sheet — URL, login reminder, 5 most common tasks, support phone number

**Training:**
- 1–2 hour in-person session at the station
- Walk through every feature
- Let the chief perform each task once while observed
- Watch him do the most common tasks solo before leaving

**Support setup:**
- AnyDesk (or TeamViewer) pre-installed on both PC and laptop for remote assistance
- WhatsApp / phone number on the cheat sheet
- Agreed response-time commitment documented separately

---

## 9. Out of Scope (explicit non-goals)

The following are **not** part of this project:

- Dashboard analytics, charts, KPIs (CRUD only)
- Exportable PDF/Excel reports
- Notifications or expiry alerts
- Multi-user roles or permissions
- Multiple buildings/stations
- Internet connectivity or cloud sync
- Remote access from outside the office LAN (no VPN, no port-forwarding — laptop must be on office WiFi)
- Mobile app (laptop uses browser over LAN)
- Integration with external systems (dispatch, HR, payroll)

These may become future phases but are explicitly excluded from the current scope.
