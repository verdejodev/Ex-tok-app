# Controle de Equipamentos de TI — Backend

Node.js + Express + SQLite (better-sqlite3) API for the IT Equipment Inventory & Maintenance Tracker.

## Start

```bash
npm install
npm run dev   # development (nodemon)
# or
npm start     # production
```

API runs on port 3000, binding 0.0.0.0 so the phone can reach it over LAN.

A web dashboard is also served at `http://localhost:3000/` (static assets in `public/`).

## Endpoints

- `GET    /api/health` — liveness check
- `GET    /api/equipments?status=&type=&q=` — list equipment (optional filters)
- `GET    /api/equipments/stats` — counts per status
- `POST   /api/equipments` — create equipment (JSON body)
- `GET    /api/equipments/:id` — single equipment + photos
- `PUT    /api/equipments/:id` — update equipment fields
- `DELETE /api/equipments/:id` — delete equipment + files
- `GET    /api/equipments/:id/logs` — maintenance log
- `POST   /api/equipments/:id/logs` — add log entry (multipart: description, date, photo?)
- `DELETE /api/logs/:logId` — remove log entry
- `POST   /api/photos` — upload photo (multipart: photo, equipment_id, log_id?)
- `DELETE /api/photos/:id` — remove photo

> `/api/printers/*` routes still work as alias for `/api/equipments/*`.

## Filters

- `status` — exact status match (e.g. `Functional`, `Needs maintenance`)
- `type` — equipment type (e.g. `Printer`, `Computer`, `Notebook`, `Label Maker`, `Network`, `Other`)
- `q` — text search across brand, model, serial_number, internal_code, specs

## Equipment fields

`type`, `brand`, `model`, `serial_number`, `internal_code` (auto-generated), `status`, `page_count`, `part_needed`, `location`, `estimated_value`, `notes`, `specs`

## Data location

- Database: `printers.db` (SQLite, auto-created on first start)
- Photos: `uploads/` folder
- Automatic migration: if an old `printers` table exists, it is migrated to `equipments` on first launch.
