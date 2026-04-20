# Seed Data

Realistic Arabic fake data for development and testing.

## Files

| File | Records |
|---|---|
| [`teams.json`](teams.json) | 3 teams (الفريق أ، ب، ج) |
| [`employees.json`](employees.json) | 20 employees with nested certifications, equipment, and 3–5 months of ratings each |
| [`vehicles.json`](vehicles.json) | 8 vehicles with maintenance history, onboard equipment, and inspection logs |
| [`building.json`](building.json) | 1 building with 15 rooms, 30 inventory items, 5 maintenance records, 3 reports |

## Conventions

- **IDs** — stable integer IDs are used so foreign keys (e.g., vehicle `driver_id` → employee `id`) are deterministic
- **Dates** — all dates in `YYYY-MM-DD` format
- **Arabic text** — all display data is in Arabic; English only for enum values where the DB column is unchanged (column names stay English)
- **Plate numbers** — follow Saudi format: three Arabic letters + 4 digits
- **National IDs** — 10-digit format (realistic but not real Saudi citizens)
- **Phone numbers** — Saudi mobile format (`05xxxxxxxx`)

## How this is consumed

Phase 1 will include a `seed.py` script that reads these JSON files and inserts rows into the SQLite database on first run. Ordering:

1. `teams.json`
2. `employees.json` → creates employees, then nested certifications/equipment/ratings
3. `vehicles.json` → creates vehicles (with FK to employees for `driver_id`), then nested maintenance/equipment/inspections
4. `building.json` → creates the single building row, then rooms/inventory/maintenance/reports

## Editing

Feel free to tweak the data (names, ranks, amounts, dates) before Phase 1 starts. The seed script will load whatever is in these files at build time.
