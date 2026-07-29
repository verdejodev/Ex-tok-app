# idea.md — Printer Inventory & Maintenance Tracker

## Context

I work as an IT technician and manage a stock of various printers. I recently
started reviewing every used printer in stock because we're going to sell them,
and I need a practical way to record the technical state of each one (page
count, whether it needs a part, photos) right on my phone during the physical
review — and later check/edit that from my notebook too.

## Goal

A simple, personal-use app to register, photograph, and track the technical
condition of each printer in stock, so I can quickly know:
- how many printers are functional and ready to sell
- how many need maintenance, and what's missing (part, cleaning, servicing)
- the maintenance history of each unit

This isn't a product for others — it's an internal work tool. Priority is
being fast to use during the physical review, not product polish.

## User

Just me, solo use. No need for multiple profiles, permissions, or multi-tenancy.

## Features

### 1. Individual record per printer
Each printer is a unique record (by serial number or internal asset tag), with:
- Brand / model
- Serial number (or internal code if none available)
- Photos (multiple — general shot, serial label, specific defects)
- Page count (manual entry, read off the display/report)
- Status: `Functional` / `Needs maintenance` / `In maintenance` / `Ready for sale` / `Sold`
- Part(s) needed (free text or list: toner, fuser, roller, print head, etc.)
- Free-text technical notes
- Physical location in stock (optional, free text — e.g. "shelf 3")
- Estimated sale value (optional)

### 2. Maintenance history per printer
Inside each record, a chronological log of entries: date, what was done or
observed, optional photo. Covers both maintenance work and the initial review.

### 3. In-app photo capture
Using the phone's camera (Expo), take a photo during the review and attach it
directly to the record or maintenance log entry, no need to import it later.

### 4. General stock list/dashboard
Main screen listing all printers, filterable by status and brand/model, so
you can see at a glance how many are ready versus still pending.

### 5. Notebook access
Besides the mobile app, a simple web page (same data) to view and edit
records from the computer — useful for typing longer notes or reviewing
before listing a printer for sale.

## Typical usage flow

1. During the physical review: open the app, create or open the printer's
   record, take photo(s), enter page count and status, flag if it needs a part.
2. Later, from the notebook: review the full list, filter for "ready for sale",
   adjust values and notes before listing them.
3. Once a part arrives and maintenance is done: add a history entry and update
   the status.

## Suggested tech stack

Since the notebook will be on when registering printers, the backend runs
locally on it, over the local network (wifi/LAN), with no external service:

- **Mobile app**: Expo (React Native) + `expo-camera` / `expo-image-picker` for
  photos, `expo-router` for navigation. The app connects to the notebook's
  local IP on the network (e.g. `http://192.168.x.x:3000`).
- **Backend**: Node.js + Express running on the notebook itself, exposing a
  simple REST API (printer CRUD, photo upload, maintenance history).
- **Database**: local SQLite on the notebook via `better-sqlite3`
  — no external service or server process needed, single-file database.
- **Photos**: stored on disk on the notebook (an `uploads/` folder), with the
  relative path/URL saved in SQLite — avoids storing Base64 blobs in the database.
- **Notebook access**: since the backend already runs there, a simple web page
  (plain HTML+JS) served by the same Express app as static assets, hitting the
  same API.

**Watch out for**: since the app depends on the notebook being on and on the
same network, registering printers somewhere without wifi (e.g. another floor
of the stockroom, out of router range) would fail to write. If that turns out
to be common, consider a local "pending sync" queue on the app that syncs once
the connection to the notebook comes back — but this can stay out of the MVP
and only be addressed if it becomes a real problem.

## Data model (draft)

> Note: the project started focused on printers but was later generalized to
> all IT equipment. The `equipments` table replaced `printers` — see the actual
> schema in `backend/src/db.js`.

**equipments**
`id, type, brand, model, serial_number, internal_code, status, page_count, part_needed, location, estimated_value, notes, specs, created_at, updated_at`

**maintenance_logs**
`id, equipment_id (FK), date, description, photo_url, created_at`

**photos**
`id, equipment_id (FK), maintenance_log_id (FK, optional), url, created_at`

## MVP scope

To get usable as soon as possible for the current stock review:
1. Printer registration with photo + core fields (brand, model, serial number, status)
2. Page count and part needed
3. General list with status filter
4. Basic maintenance history (date + text + photo)

Can wait (doesn't block using it now):
- Proper notebook web UI (can just query MySQL directly at first, or use a
  quick admin tool like phpMyAdmin/Adminer, and only build a custom page once
  it's actually needed)
- Estimated sale value / listing integration
- Aggregate stats/reports (e.g. % of stock ready for sale)

## Risks / things to watch

- **Photos add up fast** — worth compressing (`expo-image-manipulator`) before
  sending to the notebook, so the uploads folder doesn't balloon.
- **Serial numbers aren't always visible/legible** — a fallback internal code
  (e.g. an app-generated sequence) prevents getting stuck during registration.
- **Offline use during the review**: if the stockroom doesn't have reliable
  wifi, consider local caching (SQLite in Expo) with sync once the connection
  comes back, instead of relying on direct writes to the notebook's API at
  all times.
