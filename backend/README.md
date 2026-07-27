# Printer Tracker — Backend

Node.js + Express + SQLite API for the Printer Inventory & Maintenance Tracker.

## Start

```bash
npm install
npm run dev   # development (nodemon)
# or
npm start     # production
```

API runs on port 3000, binding 0.0.0.0 so the phone can reach it over LAN.

## Endpoints

- `GET  /api/health` — liveness check
- `GET  /api/printers?status=&q=` — list printers
- `GET  /api/printers/stats` — counts per status
- `POST /api/printers` — create printer (JSON body)
- `GET  /api/printers/:id` — single printer + photos
- `PUT  /api/printers/:id` — update printer fields
- `DEL  /api/printers/:id` — delete printer + files
- `GET  /api/printers/:id/logs` — maintenance log
- `POST /api/printers/:id/logs` — add log entry (multipart: description, date, photo?)
- `DEL  /api/logs/:logId` — remove log entry
- `POST /api/photos` — upload photo (multipart: photo, printer_id, log_id?)
- `DEL  /api/photos/:id` — remove photo

## Data location

- Database: `printers.db` (auto-created on first start)
- Photos: `uploads/` folder
