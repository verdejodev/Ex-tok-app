# IT Maintenance Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the database schema, Express backend routes, web control panel, and React Native mobile application from a "Printer Tracker" to a general "IT Maintenance Tracker" supporting computers, notebooks, printers, label makers, network gears, and others, with fully automated data migration and route compatibility aliases.

**Architecture:** 
- Database migration on boot: general `equipments` table replaces `printers`, mapping log and photo references.
- Backend API route aliasing: `/api/equipments` becomes the standard route, but `/api/printers` acts as a transparent alias to prevent client crashes.
- UI: General IT theme with type dropdown selectors, custom specification fields, visual type icons, and updated filters in both mobile and web dashboard.

**Tech Stack:** Node.js, Express, SQLite (better-sqlite3), React Native, Expo Router.

## Global Constraints
- Unified patrimony code prefix: **`EQP-`** (e.g. `EQP-001`).
- Equipment Types: `'Printer' | 'Computer' | 'Notebook' | 'Label Maker' | 'Network' | 'Other'`.
- Database Table Name: `equipments` (replaces `printers`).
- Status and log tables reference: `equipment_id` (replaces `printer_id`).

---

### Task 1: Backend Database & Route Transition

**Files:**
- Modify: `backend/src/db.js`
- Create: `backend/src/routes/equipments.js` (Rename from `backend/src/routes/printers.js`)
- Modify: `backend/src/routes/logs.js`
- Modify: `backend/src/routes/photos.js`
- Modify: `backend/src/index.js`

**Interfaces:**
- Produces: SQLite database table `equipments`, `/api/equipments` JSON API, and transparent `/api/printers` routing alias.

- [ ] **Step 1: Implement database schema migration on boot**

  Modify `backend/src/db.js` to create the new tables, check if the old `printers` table exists, and perform a full migration of data (printers, logs, photos) within a transaction. Also update the `nextInternalCode` function to generate sequential codes using `EQP-` prefix.

  Replace `backend/src/db.js` content with:
  ```javascript
  'use strict';
  const Database = require('better-sqlite3');
  const path = require('path');

  const DB_PATH = path.join(__dirname, '..', 'printers.db');
  const db = new Database(DB_PATH);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 1. Transactional Migration from printers to equipments if needed
  db.transaction(() => {
    // Check if old printers table exists
    const printersExist = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='printers'").get();
    
    if (printersExist) {
      console.log('📦 Iniciando migração de Impressoras para Equipamentos de TI...');

      // Create new equipments table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS equipments (
          id               TEXT PRIMARY KEY,
          type             TEXT NOT NULL DEFAULT 'Printer',
          brand            TEXT NOT NULL,
          model            TEXT NOT NULL,
          serial_number    TEXT,
          internal_code    TEXT NOT NULL,
          status           TEXT NOT NULL DEFAULT 'Functional',
          page_count       INTEGER,
          part_needed      TEXT,
          location         TEXT,
          estimated_value  REAL,
          notes            TEXT,
          specs            TEXT,
          created_at       TEXT NOT NULL,
          updated_at       TEXT NOT NULL
        )
      `).run();

      // Copy printer records
      db.prepare(`
        INSERT INTO equipments (id, type, brand, model, serial_number, internal_code, status, page_count, part_needed, location, estimated_value, notes, created_at, updated_at)
        SELECT id, 'Printer', brand, model, serial_number, internal_code, status, page_count, part_needed, location, estimated_value, notes, created_at, updated_at
        FROM printers
      `).run();

      // Create new maintenance_logs table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS maintenance_logs_new (
          id             TEXT PRIMARY KEY,
          equipment_id   TEXT NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
          date           TEXT NOT NULL,
          description    TEXT NOT NULL,
          photo_url      TEXT,
          created_at     TEXT NOT NULL
        )
      `).run();

      // Copy maintenance logs records
      const oldLogsExist = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='maintenance_logs'").get();
      if (oldLogsExist) {
        db.prepare(`
          INSERT INTO maintenance_logs_new (id, equipment_id, date, description, photo_url, created_at)
          SELECT id, printer_id, date, description, photo_url, created_at
          FROM maintenance_logs
        `).run();
      }

      // Create new photos table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS photos_new (
          id             TEXT PRIMARY KEY,
          equipment_id   TEXT NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
          log_id         TEXT REFERENCES maintenance_logs_new(id) ON DELETE SET NULL,
          url            TEXT NOT NULL,
          created_at     TEXT NOT NULL
        )
      `).run();

      // Copy photos records
      const oldPhotosExist = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='photos'").get();
      if (oldPhotosExist) {
        db.prepare(`
          INSERT INTO photos_new (id, equipment_id, log_id, url, created_at)
          SELECT id, printer_id, log_id, url, created_at
          FROM photos
        `).run();
      }

      // Drop old tables
      db.prepare("DROP TABLE IF EXISTS photos").run();
      db.prepare("DROP TABLE IF EXISTS maintenance_logs").run();
      db.prepare("DROP TABLE IF EXISTS printers").run();

      // Rename new tables
      db.prepare("ALTER TABLE maintenance_logs_new RENAME TO maintenance_logs").run();
      db.prepare("ALTER TABLE photos_new RENAME TO photos").run();

      console.log('✅ Migração concluída com sucesso!');
    } else {
      // Create new schema if empty project start
      db.prepare(`
        CREATE TABLE IF NOT EXISTS equipments (
          id               TEXT PRIMARY KEY,
          type             TEXT NOT NULL DEFAULT 'Printer',
          brand            TEXT NOT NULL,
          model            TEXT NOT NULL,
          serial_number    TEXT,
          internal_code    TEXT NOT NULL,
          status           TEXT NOT NULL DEFAULT 'Functional',
          page_count       INTEGER,
          part_needed      TEXT,
          location         TEXT,
          estimated_value  REAL,
          notes            TEXT,
          specs            TEXT,
          created_at       TEXT NOT NULL,
          updated_at       TEXT NOT NULL
        );
      `).run();

      db.prepare(`
        CREATE TABLE IF NOT EXISTS maintenance_logs (
          id             TEXT PRIMARY KEY,
          equipment_id   TEXT NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
          date           TEXT NOT NULL,
          description    TEXT NOT NULL,
          photo_url      TEXT,
          created_at     TEXT NOT NULL
        );
      `).run();

      db.prepare(`
        CREATE TABLE IF NOT EXISTS photos (
          id             TEXT PRIMARY KEY,
          equipment_id   TEXT NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
          log_id         TEXT REFERENCES maintenance_logs(id) ON DELETE SET NULL,
          url            TEXT NOT NULL,
          created_at     TEXT NOT NULL
        );
      `).run();
    }
  })();

  // auto-increment helper for internal codes
  function nextInternalCode() {
    const row = db.prepare(
      "SELECT internal_code FROM equipments ORDER BY rowid DESC LIMIT 1"
    ).get();
    if (!row) return 'EQP-001';
    
    // Support previous IMP- codes or EQP- codes
    const code = row.internal_code;
    const cleanNum = code.replace('EQP-', '').replace('IMP-', '');
    const n = parseInt(cleanNum, 10) || 0;
    return `EQP-${String(n + 1).padStart(3, '0')}`;
  }

  module.exports = { db, nextInternalCode };
  ```

- [ ] **Step 2: Create equipments route**

  Create `backend/src/routes/equipments.js` (copy and adapt from `printers.js`) to support the new `equipments` table. The queries must read/write `type` and `specs` fields and load first photo.

  Create `backend/src/routes/equipments.js` with:
  ```javascript
  'use strict';
  const { Router } = require('express');
  const { v4: uuidv4 } = require('uuid');
  const { db, nextInternalCode } = require('../db');

  const router = Router();

  // GET /api/equipments
  router.get('/', (req, res) => {
    const { status, type, q } = req.query;
    let sql = 'SELECT * FROM equipments';
    const params = [];
    const where = [];
    if (status) {
      where.push('status = ?');
      params.push(status);
    }
    if (type) {
      where.push('type = ?');
      params.push(type);
    }
    if (q) {
      where.push('(brand LIKE ? OR model LIKE ? OR serial_number LIKE ? OR internal_code LIKE ? OR specs LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY created_at DESC';

    const items = db.prepare(sql).all(...params);

    const withCounts = items.map(p => {
      const photoCount = db.prepare('SELECT COUNT(*) as c FROM photos WHERE equipment_id = ?').get(p.id).c;
      const firstPhoto = db.prepare('SELECT url FROM photos WHERE equipment_id = ? AND log_id IS NULL ORDER BY created_at ASC LIMIT 1').get(p.id);
      return {
        ...p,
        photo_count: photoCount,
        primary_photo_url: firstPhoto ? firstPhoto.url : null,
      };
    });

    res.json(withCounts);
  });

  // GET /api/equipments/stats
  router.get('/stats', (req, res) => {
    const rows = db.prepare(
      'SELECT status, COUNT(*) as count FROM equipments GROUP BY status'
    ).all();
    res.json(rows);
  });

  // GET /api/equipments/:id
  router.get('/:id', (req, res) => {
    const item = db.prepare('SELECT * FROM equipments WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const photos = db.prepare('SELECT * FROM photos WHERE equipment_id = ? AND log_id IS NULL ORDER BY created_at DESC').all(req.params.id);
    res.json({ ...item, photos });
  });

  // POST /api/equipments
  router.post('/', (req, res) => {
    const {
      type = 'Printer', brand, model, serial_number, status = 'Functional',
      page_count, part_needed, location, estimated_value, notes, specs
    } = req.body;

    if (!brand || !model) {
      return res.status(400).json({ error: 'brand and model are required' });
    }

    const id = uuidv4();
    const internal_code = nextInternalCode();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO equipments
        (id, type, brand, model, serial_number, internal_code, status, page_count, part_needed, location, estimated_value, notes, specs, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, type, brand, model, serial_number || null, internal_code, status,
           page_count || null, part_needed || null, location || null,
           estimated_value || null, notes || null, specs || null, now, now);

    const created = db.prepare('SELECT * FROM equipments WHERE id = ?').get(id);
    res.status(201).json(created);
  });

  // PUT /api/equipments/:id
  router.put('/:id', (req, res) => {
    const item = db.prepare('SELECT * FROM equipments WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    const fields = [
      'type', 'brand', 'model', 'serial_number', 'status', 'page_count',
      'part_needed', 'location', 'estimated_value', 'notes', 'specs'
    ];
    const updates = [];
    const values = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    });
    if (!updates.length) return res.json(item);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(req.params.id);

    db.prepare(`UPDATE equipments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json(db.prepare('SELECT * FROM equipments WHERE id = ?').get(req.params.id));
  });

  // DELETE /api/equipments/:id
  router.delete('/:id', (req, res) => {
    const item = db.prepare('SELECT * FROM equipments WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    const photos = db.prepare('SELECT url FROM photos WHERE equipment_id = ?').all(req.params.id);
    db.prepare('DELETE FROM equipments WHERE id = ?').run(req.params.id);

    const fs = require('fs');
    const path = require('path');
    photos.forEach(p => {
      const filename = p.url.split('/uploads/').pop();
      if (filename) {
        const fullPath = path.join(__dirname, '../../uploads', filename);
        fs.unlink(fullPath, () => {});
      }
    });

    res.json({ deleted: req.params.id });
  });

  module.exports = router;
  ```

- [ ] **Step 3: Modify backend logs route**

  Update `backend/src/routes/logs.js` to change references from `printer_id` and `printers` table to `equipment_id` and `equipments` table. Add support for both `/api/equipments/:id/logs` and `/api/printers/:id/logs` (as alias).

  Replace `backend/src/routes/logs.js` content with:
  ```javascript
  'use strict';
  const { Router } = require('express');
  const { v4: uuidv4 } = require('uuid');
  const { db } = require('../db');
  const multer = require('multer');
  const path = require('path');
  const fs = require('fs');

  const UPLOADS_DIR = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
  const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

  const router = Router();

  const getLogsHandler = (req, res) => {
    const logs = db.prepare(
      'SELECT * FROM maintenance_logs WHERE equipment_id = ? ORDER BY date DESC, created_at DESC'
    ).all(req.params.id);
    res.json(logs);
  };

  const postLogHandler = upload.single('photo'), postLogRoute = (req, res) => {
    const item = db.prepare('SELECT id FROM equipments WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });

    const { description, date } = req.body;
    if (!description) return res.status(400).json({ error: 'description is required' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const logDate = date || now.slice(0, 10);

    let photo_url = null;
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
      db.prepare(
        'INSERT INTO photos (id, equipment_id, log_id, url, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(uuidv4(), req.params.id, id, photo_url, now);
    }

    db.prepare(
      'INSERT INTO maintenance_logs (id, equipment_id, date, description, photo_url, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.params.id, logDate, description, photo_url, now);

    res.status(201).json(db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(id));
  };

  // Official and legacy routes
  router.get('/equipments/:id/logs', getLogsHandler);
  router.get('/printers/:id/logs', getLogsHandler);

  router.post('/equipments/:id/logs', postLogHandler, postLogRoute);
  router.post('/printers/:id/logs', postLogHandler, postLogRoute);

  // DELETE /api/logs/:logId
  router.delete('/logs/:logId', (req, res) => {
    const log = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(req.params.logId);
    if (!log) return res.status(404).json({ error: 'Not found' });

    if (log.photo_url) {
      const filename = log.photo_url.split('/uploads/').pop();
      if (filename) {
        const fullPath = path.join(UPLOADS_DIR, filename);
        fs.unlink(fullPath, () => {});
      }
    }

    db.prepare('DELETE FROM maintenance_logs WHERE id = ?').run(req.params.logId);
    res.json({ deleted: req.params.logId });
  });

  module.exports = router;
  ```

- [ ] **Step 4: Modify backend photos route**

  Update `backend/src/routes/photos.js` to change `printer_id` references to `equipment_id` and map them to `equipments` table.

  Replace `backend/src/routes/photos.js` content with:
  ```javascript
  'use strict';
  const { Router } = require('express');
  const { v4: uuidv4 } = require('uuid');
  const { db } = require('../db');
  const multer = require('multer');
  const path = require('path');
  const fs = require('fs');

  const UPLOADS_DIR = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
  const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

  const router = Router();

  // POST /api/photos
  router.post('/', upload.single('photo'), (req, res) => {
    // support both printer_id and equipment_id for compatibility
    const equipment_id = req.body.equipment_id || req.body.printer_id;
    const { log_id } = req.body;
    
    if (!equipment_id) return res.status(400).json({ error: 'equipment_id or printer_id is required' });
    if (!req.file)      return res.status(400).json({ error: 'photo file is required' });

    const item = db.prepare('SELECT id FROM equipments WHERE id = ?').get(equipment_id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const url = `/uploads/${req.file.filename}`;

    db.prepare(
      'INSERT INTO photos (id, equipment_id, log_id, url, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, equipment_id, log_id || null, url, now);

    res.status(201).json({ id, url, equipment_id, log_id: log_id || null, created_at: now });
  });

  // DELETE /api/photos/:id
  router.delete('/:id', (req, res) => {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
    if (!photo) return res.status(404).json({ error: 'Not found' });

    const filename = photo.url.split('/uploads/').pop();
    if (filename) {
      const fullPath = path.join(UPLOADS_DIR, filename);
      fs.unlink(fullPath, () => {});
    }

    db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
    res.json({ deleted: req.params.id });
  });

  module.exports = router;
  ```

- [ ] **Step 5: Modify index.js route mounting**

  Mount the new equipments route and support `printers` route alias in `backend/src/index.js`. Also clean up references.

  Replace lines 18-22 in `backend/src/index.js` with:
  ```javascript
  // Routes
  app.use('/api/equipments', require('./routes/equipments'));
  app.use('/api/printers',   require('./routes/equipments')); // Alias compatibility
  app.use('/api',            require('./routes/logs'));
  app.use('/api/photos',     require('./routes/photos'));
  ```

- [ ] **Step 6: Remove legacy route file**

  Delete `backend/src/routes/printers.js` since its logic has been replaced by `equipments.js`.

  Run: `rm /home/night/Documentos/appimpressoras/backend/src/routes/printers.js`

- [ ] **Step 7: Run backend and verify migration boot**

  Restart backend.
  Run: `curl -I http://localhost:3000/api/equipments 2>/dev/null`
  Expected: HTTP 200 response indicating database migration booted successfully.

---

### Task 2: Web Dashboard Update

**Files:**
- Modify: `backend/public/index.html`

**Interfaces:**
- Produces: Web Control Panel served at http://localhost:3000 supporting filters and rendering device types and specs.

- [ ] **Step 1: Update the Web HTML & JavaScript to support Equipment Types & Specs**

  Edit `backend/public/index.html` to update dashboard name, add dropdown filters for equipment type, render icons next to names, show specs in a column, and output these columns in the Excel file generation.

  Replace `backend/public/index.html` with:
  ```html
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT Inventory Tracker — Painel de Controle</title>
    <style>
      :root {
        --bg: #0a0a0a;
        --surface: #111111;
        --surface-alt: #1a1a1a;
        --border: #222222;
        --border-focus: #444444;
        --text: #f0f0f0;
        --text-muted: #555555;
        --text-sub: #888888;
        --accent: #ffffff;
        --accent-hover: #e0e0e0;
        
        --status-ok: #22c55e;
        --status-maint-needed: #f59e0b;
        --status-in-maint: #3b82f6;
        --status-sale: #a78bfa;
        --status-sold: #555555;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      body {
        background-color: var(--bg);
        color: var(--text);
        padding: 40px 24px;
        line-height: 1.5;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
      }

      h1 {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }

      .stat-card {
        background-color: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: relative;
        overflow: hidden;
      }

      .stat-card::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: var(--border-focus);
      }

      .stat-card.functional::before { background-color: var(--status-ok); }
      .stat-card.needs-maint::before { background-color: var(--status-maint-needed); }
      .stat-card.in-maint::before { background-color: var(--status-in-maint); }
      .stat-card.ready-sale::before { background-color: var(--status-sale); }
      .stat-card.sold::before { background-color: var(--status-sold); }

      .stat-label {
        color: var(--text-sub);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      .controls {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
        align-items: center;
      }

      .search-input {
        flex: 1;
        min-width: 260px;
        background-color: var(--surface);
        border: 1px solid var(--border);
        color: var(--text);
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      .search-input:focus {
        border-color: var(--border-focus);
      }

      .filter-select {
        background-color: var(--surface);
        border: 1px solid var(--border);
        color: var(--text);
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
        cursor: pointer;
      }

      .filter-select:focus {
        border-color: var(--border-focus);
      }

      .btn-export {
        background-color: var(--accent);
        color: var(--bg);
        border: none;
        padding: 10px 18px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.2s;
      }

      .btn-export:hover {
        background-color: var(--accent-hover);
      }

      .table-container {
        background-color: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        overflow: hidden;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 14px;
      }

      th {
        background-color: var(--surface-alt);
        color: var(--text-sub);
        font-weight: 600;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.5px;
      }

      td {
        padding: 14px 16px;
        border-bottom: 1px solid var(--border);
        color: var(--text);
        vertical-align: middle;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover td {
        background-color: rgba(255, 255, 255, 0.015);
      }

      .col-code {
        font-family: monospace;
        font-size: 13px;
        color: var(--text-sub);
      }

      .col-printer {
        font-weight: 600;
      }

      .col-type-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-sub);
      }

      .col-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .status-Functional { background-color: rgba(34, 197, 94, 0.08); color: var(--status-ok); }
      .status-Functional .status-dot { background-color: var(--status-ok); }

      .status-Needs\ maintenance { background-color: rgba(245, 158, 11, 0.08); color: var(--status-maint-needed); }
      .status-Needs\ maintenance .status-dot { background-color: var(--status-maint-needed); }

      .status-In\ maintenance { background-color: rgba(59, 130, 246, 0.08); color: var(--status-in-maint); }
      .status-In\ maintenance .status-dot { background-color: var(--status-in-maint); }

      .status-Ready\ for\ sale { background-color: rgba(167, 139, 250, 0.08); color: var(--status-sale); }
      .status-Ready\ for\ sale .status-dot { background-color: var(--status-sale); }

      .status-Sold { background-color: rgba(17, 17, 17, 0.08); color: var(--status-sold); }
      .status-Sold .status-dot { background-color: var(--status-sold); }

      .photo-trigger {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        color: var(--text-sub);
        transition: color 0.2s;
      }

      .photo-trigger:hover {
        color: var(--text);
      }

      .photo-thumbnail {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        background-color: var(--surface-alt);
        object-fit: cover;
        border: 1px solid var(--border);
      }

      .empty-state {
        padding: 48px;
        text-align: center;
        color: var(--text-muted);
        font-size: 15px;
      }

      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.95);
        z-index: 1000;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .modal.show {
        display: flex;
        opacity: 1;
      }

      .modal-content {
        max-width: 90%;
        max-height: 80%;
        border-radius: 8px;
        border: 1px solid var(--border);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }

      .modal-close {
        position: absolute;
        top: 24px;
        right: 24px;
        background-color: #222;
        border: 1px solid #444;
        color: #fff;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }

      .modal-close:hover {
        background-color: #333;
      }
    </style>
  </head>
  <body>

    <div class="container">
      <header>
        <h1>Inventário de TI & Equipamentos</h1>
        <button class="btn-export" onclick="exportToExcelData()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Exportar para Excel
        </button>
      </header>

      <div class="stats-grid">
        <div class="stat-card" id="card-total">
          <span class="stat-label">Total Ativos</span>
          <span class="stat-value" id="val-total">-</span>
        </div>
        <div class="stat-card functional">
          <span class="stat-label">OK / Funcionando</span>
          <span class="stat-value" id="val-functional">-</span>
        </div>
        <div class="stat-card needs-maint">
          <span class="stat-label">Precisa Manutenção</span>
          <span class="stat-value" id="val-needs-maint">-</span>
        </div>
        <div class="stat-card in-maint">
          <span class="stat-label">Em Manutenção</span>
          <span class="stat-value" id="val-in-maint">-</span>
        </div>
        <div class="stat-card ready-sale">
          <span class="stat-label">Disponível</span>
          <span class="stat-value" id="val-ready-sale">-</span>
        </div>
      </div>

      <div class="controls">
        <input type="text" id="search-box" class="search-input" placeholder="Buscar por marca, modelo, série ou patrimônio..." oninput="filterEquipments()">
        
        <select id="type-filter" class="filter-select" onchange="filterEquipments()">
          <option value="Todas">Todos os Tipos</option>
          <option value="Computer">Computador</option>
          <option value="Notebook">Notebook</option>
          <option value="Printer">Impressora</option>
          <option value="Label Maker">Etiquetadora</option>
          <option value="Network">Rede</option>
          <option value="Other">Outro</option>
        </select>

        <select id="status-filter" class="filter-select" onchange="filterEquipments()">
          <option value="Todas">Todos os Status</option>
          <option value="Functional">OK (Functional)</option>
          <option value="Needs maintenance">Precisa manutenção</option>
          <option value="In maintenance">Em manutenção</option>
          <option value="Ready for sale">Disponível para venda</option>
          <option value="Sold">Vendido</option>
        </select>
      </div>

      <div class="table-container">
        <table id="equipments-table">
          <thead>
            <tr>
              <th style="width: 60px">Foto</th>
              <th>Patrimônio</th>
              <th>Tipo</th>
              <th>Marca & Modelo</th>
              <th>Status</th>
              <th>Nº de Série</th>
              <th>Especificações</th>
              <th>Localização</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody id="table-body">
            <!-- Dynamically populated -->
          </tbody>
        </table>
        <div id="no-data" class="empty-state" style="display: none;">
          Nenhum equipamento encontrado.
        </div>
      </div>
    </div>

    <div id="photo-modal" class="modal" onclick="closeModal()">
      <button class="modal-close" onclick="closeModal()">Fechar</button>
      <img id="modal-img" class="modal-content" src="" alt="Equipment photo" onclick="event.stopPropagation()">
    </div>

    <script>
      let allEquipments = [];
      
      const STATUS_LABELS = {
        'Functional': 'OK',
        'Needs maintenance': 'Precisa manutenção',
        'In maintenance': 'Em manutenção',
        'Ready for sale': 'Disponível',
        'Sold': 'Vendido'
      };

      const TYPE_LABELS = {
        'Computer': 'Computador',
        'Notebook': 'Notebook',
        'Printer': 'Impressora',
        'Label Maker': 'Etiquetadora',
        'Network': 'Rede',
        'Other': 'Outro'
      };

      const TYPE_ICONS = {
        'Computer': '🖥️',
        'Notebook': '💻',
        'Printer': '🖨️',
        'Label Maker': '🏷️',
        'Network': '🌐',
        'Other': '📦'
      };

      async function loadData() {
        try {
          const res = await fetch('/api/equipments');
          if (!res.ok) throw new Error('API Error');
          allEquipments = await res.json();
          
          updateStats();
          renderTable(allEquipments);
        } catch (err) {
          console.error('Falha ao carregar ativos:', err);
          document.getElementById('table-body').innerHTML = `
            <tr>
              <td colspan="9" style="text-align: center; color: #f87171; padding: 24px;">
                Falha ao carregar os dados. Verifique se o servidor está ativo.
              </td>
            </tr>
          `;
        }
      }

      function updateStats() {
        document.getElementById('val-total').innerText = allEquipments.length;
        document.getElementById('val-functional').innerText = allEquipments.filter(e => e.status === 'Functional').length;
        document.getElementById('val-needs-maint').innerText = allEquipments.filter(e => e.status === 'Needs maintenance').length;
        document.getElementById('val-in-maint').innerText = allEquipments.filter(e => e.status === 'In maintenance').length;
        document.getElementById('val-ready-sale').innerText = allEquipments.filter(e => e.status === 'Ready for sale').length;
      }

      function renderTable(equipments) {
        const tbody = document.getElementById('table-body');
        const noData = document.getElementById('no-data');
        tbody.innerHTML = '';
        
        if (equipments.length === 0) {
          noData.style.display = 'block';
          return;
        }
        noData.style.display = 'none';

        equipments.forEach(e => {
          const tr = document.createElement('tr');
          
          let photoCell = '<span style="color: var(--text-muted)">-</span>';
          if (e.primary_photo_url) {
            const photoUrl = e.primary_photo_url;
            photoCell = `
              <div class="photo-trigger" onclick="openModal('${photoUrl}')">
                <img class="photo-thumbnail" src="${photoUrl}" alt="Thumb">
              </div>
            `;
          }

          const icon = TYPE_ICONS[e.type] || '📦';
          const typeLabel = TYPE_LABELS[e.type] || e.type;

          tbody.appendChild(tr);
          tr.innerHTML = `
            <td>${photoCell}</td>
            <td class="col-code">${e.internal_code}</td>
            <td>
              <span class="col-type-tag">
                <span>${icon}</span>
                <span>${typeLabel}</span>
              </span>
            </td>
            <td class="col-printer">${e.brand} ${e.model}</td>
            <td>
              <span class="col-status status-${e.status}">
                <span class="status-dot"></span>
                ${STATUS_LABELS[e.status] || e.status}
              </span>
            </td>
            <td>${e.serial_number || '<span style="color: var(--text-muted)">-</span>'}</td>
            <td style="color: var(--text-sub); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap" title="${e.specs || ''}">
              ${e.specs || '-'}
            </td>
            <td>${e.location || '<span style="color: var(--text-muted)">-</span>'}</td>
            <td style="color: var(--text-sub); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap" title="${e.notes || ''}">
              ${e.notes || '-'}
            </td>
          `;
        });
      }

      function filterEquipments() {
        const q = document.getElementById('search-box').value.toLowerCase().trim();
        const type = document.getElementById('type-filter').value;
        const status = document.getElementById('status-filter').value;
        
        const filtered = allEquipments.filter(e => {
          const matchesType = (type === 'Todas' || e.type === type);
          const matchesStatus = (status === 'Todas' || e.status === status);
          const matchesQuery = !q || 
            e.brand.toLowerCase().includes(q) ||
            e.model.toLowerCase().includes(q) ||
            (e.serial_number && e.serial_number.toLowerCase().includes(q)) ||
            (e.specs && e.specs.toLowerCase().includes(q)) ||
            e.internal_code.toLowerCase().includes(q) ||
            (e.location && e.location.toLowerCase().includes(q));
          
          return matchesType && matchesStatus && matchesQuery;
        });

        renderTable(filtered);
      }

      function openModal(url) {
        const modal = document.getElementById('photo-modal');
        const img = document.getElementById('modal-img');
        img.src = url;
        modal.classList.add('show');
      }

      function closeModal() {
        document.getElementById('photo-modal').classList.remove('show');
      }

      function exportToExcelData() {
        const activeFilterQ = document.getElementById('search-box').value.toLowerCase().trim();
        const activeFilterType = document.getElementById('type-filter').value;
        const activeFilterStatus = document.getElementById('status-filter').value;
        
        const exportList = allEquipments.filter(e => {
          const matchesType = (activeFilterType === 'Todas' || e.type === activeFilterType);
          const matchesStatus = (activeFilterStatus === 'Todas' || e.status === activeFilterStatus);
          const matchesQuery = !activeFilterQ || 
            e.brand.toLowerCase().includes(activeFilterQ) ||
            e.model.toLowerCase().includes(activeFilterQ) ||
            (e.specs && e.specs.toLowerCase().includes(activeFilterQ)) ||
            (e.serial_number && e.serial_number.toLowerCase().includes(activeFilterQ)) ||
            e.internal_code.toLowerCase().includes(activeFilterQ);
          return matchesType && matchesStatus && matchesQuery;
        });

        if (exportList.length === 0) {
          alert('Sem dados para exportar.');
          return;
        }

        const header = `
          <tr style="background-color: #334155; color: #ffffff; font-weight: bold;">
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Patrimônio</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Tipo</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Marca</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Modelo</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Nº de Série</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Status</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Especificações</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Localização</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Notas</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Data Cadastro</th>
          </tr>
        `;

        const rows = exportList.map(e => `
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px; mso-number-format:'\\@';">${e.internal_code}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${TYPE_LABELS[e.type] || e.type}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${e.brand}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${e.model}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; mso-number-format:'\\@';">${e.serial_number || '-'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${STATUS_LABELS[e.status] || e.status}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${e.specs || '-'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${e.location || '-'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${e.notes || '-'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${new Date(e.created_at).toLocaleDateString('pt-BR')}</td>
          </tr>
        `).join('');

        const template = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8">
            <!--[if gte mso 9]>
            <xml>
              <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                  <x:ExcelWorksheet>
                    <x:Name>Inventario_TI</x:Name>
                    <x:WorksheetOptions>
                      <x:DisplayGridlines/>
                    </x:WorksheetOptions>
                  </x:ExcelWorksheet>
                </x:ExcelWorksheets>
              </x:ExcelWorkbook>
            </xml>
            <![endif]-->
          </head>
          <body>
            <table style="border-collapse: collapse; font-family: sans-serif; font-size: 12px;">
              <thead>${header}</thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
          </html>
        `;

        const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10).split('-').reverse().join('-');
        a.href = url;
        a.download = `inventario_ti_${dateStr}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      loadData();
    </script>
  </body>
  </html>
  ```

---

### Task 3: Mobile App Adaptation

**Files:**
- Modify: `mobile/lib/types.ts`
- Modify: `mobile/lib/colors.ts`
- Modify: `mobile/app/_layout.tsx`
- Modify: `mobile/app/index.tsx`
- Rename folder: `mobile/app/printer/` -> `mobile/app/equipment/`
- Modify: `mobile/app/equipment/new.tsx` (formerly `mobile/app/printer/new.tsx`)
- Modify: `mobile/app/equipment/[id].tsx` (formerly `mobile/app/printer/[id].tsx`)
- Modify: `mobile/components/PrinterCard.tsx` (Rename to `mobile/components/EquipmentCard.tsx` in a follow-up step)

**Interfaces:**
- Produces: React Native client interface mapped to generalized IT equipments model.

- [ ] **Step 1: Update type definitions**

  Update `mobile/lib/types.ts` to rename types (`Printer` -> `Equipment`) and support new `type` and `specs` fields.

  Replace `mobile/lib/types.ts` content with:
  ```typescript
  export type EquipmentStatus =
    | 'Functional'
    | 'Needs maintenance'
    | 'In maintenance'
    | 'Ready for sale'
    | 'Sold';

  export type EquipmentType =
    | 'Computer'
    | 'Notebook'
    | 'Printer'
    | 'Label Maker'
    | 'Network'
    | 'Other';

  export interface Equipment {
    id: string;
    type: EquipmentType;
    brand: string;
    model: string;
    serial_number: string | null;
    internal_code: string;
    status: EquipmentStatus;
    page_count: number | null;
    part_needed: string | null;
    location: string | null;
    estimated_value: number | null;
    notes: string | null;
    specs: string | null;
    photo_count?: number;
    primary_photo_url?: string | null;
    created_at: string;
    updated_at: string;
    photos?: Photo[];
  }

  export interface MaintenanceLog {
    id: string;
    equipment_id: string;
    date: string;
    description: string;
    photo_url: string | null;
    created_at: string;
  }

  export interface Photo {
    id: string;
    equipment_id: string;
    log_id: string | null;
    url: string;
    created_at: string;
  }
  ```

- [ ] **Step 2: Update design colors and define type icons**

  Update `mobile/lib/colors.ts` to map type icons and update type mappings.

  Replace `mobile/lib/colors.ts` with:
  ```typescript
  import { EquipmentStatus, EquipmentType } from './types';

  export const COLORS = {
    bg:          '#0a0a0a',
    surface:     '#111111',
    surfaceAlt:  '#1a1a1a',
    border:      '#222222',
    borderFocus: '#444444',
    accent:      '#ffffff',
    accentSub:   '#666666',
    text:        '#f0f0f0',
    textMuted:   '#555555',
    textSub:     '#888888',
    danger:      '#ef4444',
    success:     '#22c55e',
  };

  export const STATUS_DOT: Record<EquipmentStatus, string> = {
    'Functional':        '#22c55e',
    'Needs maintenance': '#f59e0b',
    'In maintenance':    '#3b82f6',
    'Ready for sale':    '#a78bfa',
    'Sold':              '#555555',
  };

  export const STATUS_COLORS: Record<EquipmentStatus, { bg: string; text: string; dot: string }> = {
    'Functional':        { bg: '#0d1f0d', text: '#4ade80', dot: '#22c55e' },
    'Needs maintenance': { bg: '#1f1400', text: '#fbbf24', dot: '#f59e0b' },
    'In maintenance':    { bg: '#0d1225', text: '#60a5fa', dot: '#3b82f6' },
    'Ready for sale':    { bg: '#160d2a', text: '#c4b5fd', dot: '#a78bfa' },
    'Sold':              { bg: '#111111', text: '#666666', dot: '#444444' },
  };

  export const TYPE_ICONS: Record<EquipmentType, string> = {
    'Computer':    '🖥️',
    'Notebook':    '💻',
    'Printer':     '🖨️',
    'Label Maker': '🏷️',
    'Network':     '🌐',
    'Other':       '📦',
  };

  export const TYPE_LABELS: Record<EquipmentType, string> = {
    'Computer':    'Computador',
    'Notebook':    'Notebook',
    'Printer':     'Impressora',
    'Label Maker': 'Etiquetadora',
    'Network':     'Rede',
    'Other':       'Outro',
  };
  ```

- [ ] **Step 3: Update app navigation layout**

  Update `mobile/app/_layout.tsx` stack naming routes to use equipment instead of printer.

  Replace lines 15-21 in `mobile/app/_layout.tsx` with:
  ```typescript
          <Stack.Screen name="index" options={{ title: 'Inventário de TI' }} />
          <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
          <Stack.Screen name="equipment/new" options={{ title: 'Novo Equipamento' }} />
          <Stack.Screen name="equipment/[id]" options={{ title: 'Detalhes' }} />
  ```

- [ ] **Step 4: Rename app/printer folder**

  Rename Expo router screen folder.
  Run: `mv /home/night/Documentos/appimpressoras/mobile/app/printer /home/night/Documentos/appimpressoras/mobile/app/equipment`

- [ ] **Step 5: Rename and rewrite PrinterCard component**

  Create `mobile/components/EquipmentCard.tsx` based on `PrinterCard.tsx`, updating it to take `Equipment`, display `TYPE_ICONS` next to the name, and change naming. Then delete the old `PrinterCard.tsx`.

  Create `mobile/components/EquipmentCard.tsx` with:
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
  import { useRouter } from 'expo-router';
  import { Equipment } from '../lib/types';
  import { COLORS, STATUS_DOT, TYPE_ICONS } from '../lib/colors';

  interface Props {
    equipment: Equipment;
    baseUrl: string;
  }

  export function EquipmentCard({ equipment, baseUrl }: Props) {
    const router = useRouter();
    const dot = STATUS_DOT[equipment.status] ?? '#555';
    const typeIcon = TYPE_ICONS[equipment.type] || '📦';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/equipment/${equipment.id}`)}
        activeOpacity={0.6}
      >
        <View style={[styles.statusLine, { backgroundColor: dot }]} />

        <View style={styles.body}>
          <View style={styles.contentRow}>
            <View style={styles.textContainer}>
              <View style={styles.topRow}>
                <Text style={styles.typeIcon}>{typeIcon}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {equipment.brand} {equipment.model}
                </Text>
                {equipment.part_needed ? (
                  <View style={styles.alertDot} />
                ) : null}
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  {equipment.serial_number ? equipment.serial_number : equipment.internal_code}
                </Text>
                {equipment.location ? (
                  <>
                    <Text style={styles.metaSep}>·</Text>
                    <Text style={styles.meta}>{equipment.location}</Text>
                  </>
                ) : null}
                {equipment.photo_count ? (
                  <>
                    <Text style={styles.metaSep}>·</Text>
                    <Text style={styles.meta}>{equipment.photo_count} foto{equipment.photo_count !== 1 ? 's' : ''}</Text>
                  </>
                ) : null}
              </View>

              {equipment.specs ? (
                <Text style={styles.specsText} numberOfLines={1}>
                  {equipment.specs}
                </Text>
              ) : null}

              {equipment.part_needed ? (
                <Text style={styles.partNeeded} numberOfLines={1}>
                  ⚠️ {equipment.part_needed}
                </Text>
              ) : null}
            </View>

            {equipment.primary_photo_url && baseUrl ? (
              <Image
                source={{ uri: `${baseUrl.replace('/api', '')}${equipment.primary_photo_url}` }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const styles = StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: COLORS.surface,
      borderRadius: 10,
      marginBottom: 8,
      overflow: 'hidden',
    },
    statusLine: {
      width: 3,
      borderRadius: 0,
    },
    body: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    textContainer: {
      flex: 1,
      gap: 4,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    typeIcon: {
      fontSize: 14,
    },
    name: {
      flex: 1,
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    alertDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#f59e0b',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
    },
    meta: {
      color: COLORS.textSub,
      fontSize: 12,
    },
    metaSep: {
      color: COLORS.textMuted,
      fontSize: 12,
    },
    specsText: {
      color: COLORS.textSub,
      fontSize: 12,
      fontStyle: 'italic',
    },
    partNeeded: {
      color: '#fbbf24',
      fontSize: 12,
      marginTop: 2,
    },
    thumbnail: {
      width: 52,
      height: 52,
      borderRadius: 6,
      backgroundColor: COLORS.surfaceAlt,
    },
  });
  ```

  Run: `rm /home/night/Documentos/appimpressoras/mobile/components/PrinterCard.tsx`

- [ ] **Step 6: Update Home Screen**

  Update `mobile/app/index.tsx` to query `/api/equipments`, support new type definitions, render `EquipmentCard`, and show count tags.

  Replace `mobile/app/index.tsx` with:
  ```typescript
  import React, { useCallback, useEffect, useState } from 'react';
  import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    TextInput, ActivityIndicator, RefreshControl, ScrollView,
  } from 'react-native';
  import { useRouter, useFocusEffect } from 'expo-router';
  import { apiFetch, getBaseUrl } from '../lib/api';
  import { Equipment, EquipmentStatus, EquipmentType } from '../lib/types';
  import { COLORS, STATUS_DOT, TYPE_ICONS, TYPE_LABELS } from '../lib/colors';
  import { EquipmentCard } from '../components/EquipmentCard';

  const STATUSES: (EquipmentStatus | 'Todas')[] = [
    'Todas', 'Functional', 'Needs maintenance', 'In maintenance', 'Ready for sale', 'Sold',
  ];

  const STATUS_LABELS: Record<string, string> = {
    'Todas': 'Todas',
    'Functional': 'OK',
    'Needs maintenance': 'Manutenção',
    'In maintenance': 'Em manutenção',
    'Ready for sale': 'Disponível',
    'Sold': 'Vendidos',
  };

  const TYPES: (EquipmentType | 'Todos')[] = [
    'Todos', 'Computer', 'Notebook', 'Printer', 'Label Maker', 'Network', 'Other'
  ];

  export default function HomeScreen() {
    const router = useRouter();
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [baseUrl, setBaseUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | 'Todas'>('Todas');
    const [selectedType, setSelectedType] = useState<EquipmentType | 'Todos'>('Todos');
    const [query, setQuery] = useState('');

    const load = useCallback(async () => {
      setError(null);
      try {
        let url = '/equipments';
        const params = new URLSearchParams();
        if (selectedStatus !== 'Todas') params.set('status', selectedStatus);
        if (selectedType !== 'Todos') params.set('type', selectedType);
        if (query.trim()) params.set('q', query.trim());
        if (params.toString()) url += '?' + params.toString();
        
        const [data, base] = await Promise.all([
          apiFetch<Equipment[]>(url),
          getBaseUrl()
        ]);
        setEquipments(data);
        setBaseUrl(base);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [selectedStatus, selectedType, query]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const okCount = equipments.filter(e => e.status === 'Functional').length;
    const maintenanceCount = equipments.filter(
      e => e.status === 'Needs maintenance' || e.status === 'In maintenance'
    ).length;

    return (
      <View style={styles.container}>
        {/* Search */}
        <div style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            placeholder="Buscar por patrimônio, specs..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </div>

        {/* Type Filter horizontal list */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeFilterRow}
          contentContainerStyle={styles.filterContent}
        >
          {TYPES.map(t => {
            const active = selectedType === t;
            const icon = t !== 'Todos' ? TYPE_ICONS[t as EquipmentType] : '📋';
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, active && styles.chipActive]}
                onPress={() => setSelectedType(t)}
              >
                <Text style={styles.typeIcon}>{icon}</Text>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t === 'Todos' ? 'Todos' : TYPE_LABELS[t as EquipmentType]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status Filter horizontal list */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusFilterRow}
          contentContainerStyle={styles.filterContent}
        >
          {STATUSES.map(s => {
            const active = selectedStatus === s;
            const dot = s !== 'Todas' ? STATUS_DOT[s as EquipmentStatus] : undefined;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, active && styles.chipActive]}
                onPress={() => setSelectedStatus(s)}
              >
                {dot ? (
                  <View style={[styles.chipDot, { backgroundColor: dot, opacity: active ? 1 : 0.5 }]} />
                ) : null}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {STATUS_LABELS[s] ?? s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {equipments.length} ativo{equipments.length !== 1 ? 's' : ''}
            {okCount > 0 ? `  ·  ${okCount} OK` : ''}
            {maintenanceCount > 0 ? `  ·  ${maintenanceCount} em manutenção` : ''}
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Text style={styles.errorLink}>Configurações</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* List */}
        {loading && !refreshing ? (
          <ActivityIndicator color={COLORS.textSub} style={{ marginTop: 48 }} />
        ) : (
          <FlatList
            data={equipments}
            keyExtractor={e => e.id}
            renderItem={({ item }) => <EquipmentCard equipment={item} baseUrl={baseUrl} />}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }}
                tintColor={COLORS.textSub}
              />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Nenhum equipamento encontrado.</Text>
            }
          />
        )}

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/equipment/new')}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },

    searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    search: {
      backgroundColor: COLORS.surface,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: COLORS.text,
      fontSize: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
    },

    typeFilterRow: { maxHeight: 38, marginBottom: 4 },
    statusFilterRow: { maxHeight: 38 },
    filterContent: { paddingHorizontal: 16, gap: 6, alignItems: 'center' },
    
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    statusChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    chipActive: {
      backgroundColor: COLORS.surfaceAlt,
      borderColor: COLORS.borderFocus,
    },
    chipDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    typeIcon: {
      fontSize: 12,
    },
    chipText: { color: COLORS.textSub, fontSize: 12, fontWeight: '500' },
    chipTextActive: { color: COLORS.text },

    summary: { paddingHorizontal: 16, paddingVertical: 8 },
    summaryText: { color: COLORS.textMuted, fontSize: 12 },

    errorBanner: {
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: '#3f1010',
      borderRadius: 8,
      padding: 12,
      gap: 4,
    },
    errorText: { color: '#f87171', fontSize: 13 },
    errorLink: { color: COLORS.textSub, fontSize: 12, textDecorationLine: 'underline' },

    list: { paddingHorizontal: 16, paddingBottom: 100 },
    empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: 60, fontSize: 14 },

    fab: {
      position: 'absolute',
      bottom: 28,
      right: 20,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: COLORS.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fabText: { color: '#0a0a0a', fontSize: 26, fontWeight: '300', lineHeight: 30 },

    settingsBtn: {
      position: 'absolute',
      bottom: 34,
      left: 20,
    },
    settingsIcon: { color: COLORS.textMuted, fontSize: 20 },
  });
  ```

- [ ] **Step 7: Update New Equipment screen**

  Rewrite `mobile/app/equipment/new.tsx` to support the generalised `Equipment` type, selection of types, and saving of specs.

  Replace `mobile/app/equipment/new.tsx` content with:
  ```typescript
  import React, { useState } from 'react';
  import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, Image,
  } from 'react-native';
  import * as ImagePicker from 'expo-image-picker';
  import * as ImageManipulator from 'expo-image-manipulator';
  import { useRouter } from 'expo-router';
  import { apiFetch, apiUpload } from '../../lib/api';
  import { Equipment, EquipmentStatus, EquipmentType } from '../../lib/types';
  import { COLORS, STATUS_COLORS, STATUS_DOT, TYPE_ICONS, TYPE_LABELS } from '../../lib/colors';

  const STATUSES: EquipmentStatus[] = [
    'Functional', 'Needs maintenance', 'In maintenance', 'Ready for sale', 'Sold',
  ];

  const STATUS_LABELS: Record<EquipmentStatus, string> = {
    'Functional': 'OK',
    'Needs maintenance': 'Manutenção necessária',
    'In maintenance': 'Em manutenção',
    'Ready for sale': 'Disponível',
    'Sold': 'Vendido',
  };

  const TYPES: EquipmentType[] = [
    'Computer', 'Notebook', 'Printer', 'Label Maker', 'Network', 'Other'
  ];

  async function compressAndUpload(uri: string, equipmentId: string): Promise<string> {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
    );
    const form = new FormData();
    form.append('photo', {
      uri: compressed.uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    form.append('equipment_id', equipmentId);
    const result = await apiUpload<{ url: string }>('/photos', form);
    return result.url;
  }

  export default function NewEquipmentScreen() {
    const router = useRouter();
    const [type, setType] = useState<EquipmentType>('Computer');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [serial, setSerial] = useState('');
    const [status, setStatus] = useState<EquipmentStatus>('Functional');
    const [pageCount, setPageCount] = useState('');
    const [partNeeded, setPartNeeded] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [specs, setSpecs] = useState('');
    const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    async function pickImage() {
      const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm !== 'granted') { Alert.alert('Permissão negada'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        setPendingPhotos(prev => [...prev, result.assets[0].uri]);
      }
    }

    async function takePhoto() {
      const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
      if (perm !== 'granted') { Alert.alert('Câmera negada'); return; }
      const result = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!result.canceled && result.assets[0]) {
        setPendingPhotos(prev => [...prev, result.assets[0].uri]);
      }
    }

    async function save() {
      if (!brand.trim() || !model.trim()) {
        Alert.alert('Campos obrigatórios', 'Marca e modelo são obrigatórios.');
        return;
      }
      setSaving(true);
      try {
        const count = parseInt(pageCount, 10);
        const equipment = await apiFetch<Equipment>('/equipments', {
          method: 'POST',
          body: JSON.stringify({
            type,
            brand: brand.trim(),
            model: model.trim(),
            serial_number: serial.trim() || null,
            status,
            page_count: !isNaN(count) ? count : null,
            part_needed: partNeeded.trim() || null,
            location: location.trim() || null,
            notes: notes.trim() || null,
            specs: specs.trim() || null,
          }),
        });
        for (const uri of pendingPhotos) {
          await compressAndUpload(uri, equipment.id);
        }
        router.replace(`/equipment/${equipment.id}`);
      } catch (e: unknown) {
        Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao salvar');
      } finally {
        setSaving(false);
      }
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* — Tipo do Equipamento — */}
        <Text style={styles.section}>Tipo de Equipamento</Text>
        <View style={styles.typeGrid}>
          {TYPES.map(t => {
            const active = type === t;
            const icon = TYPE_ICONS[t];
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typeOption, active && styles.typeOptionActive]}
                onPress={() => setType(t)}
              >
                <Text style={styles.optionIcon}>{icon}</Text>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {TYPE_LABELS[t]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* — Identificação — */}
        <Text style={styles.section}>Identificação</Text>

        <Text style={styles.label}>Marca <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={brand}
          onChangeText={setBrand}
          placeholder="Dell, Lenovo, HP, Brother…"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Modelo <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder="ThinkPad L14, LaserJet P2035…"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Número de série <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={styles.input}
          value={serial}
          onChangeText={setSerial}
          placeholder="Gerado automaticamente se vazio"
          placeholderTextColor={COLORS.textMuted}
        />

        {/* — Especificações Técnicas — */}
        <Text style={styles.section}>Especificações</Text>
        <Text style={styles.label}>Ficha Técnica (Livre)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={specs}
          onChangeText={setSpecs}
          placeholder={
            type === 'Computer' || type === 'Notebook'
              ? 'ex: Core i5, 16GB RAM, SSD 512GB, Windows 11'
              : type === 'Printer'
              ? 'ex: Laser Monocromática, Toner TN880, Conexão USB/Rede'
              : 'Informações técnicas do equipamento…'
          }
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* — Estado — */}
        <Text style={styles.section}>Estado</Text>

        <View style={styles.statusGrid}>
          {STATUSES.map(s => {
            const active = status === s;
            const dot = STATUS_DOT[s];
            const c = STATUS_COLORS[s];
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusOption,
                  active && { backgroundColor: c.bg, borderColor: c.dot },
                ]}
                onPress={() => setStatus(s)}
              >
                <View style={[styles.optionDot, { backgroundColor: dot }]} />
                <Text style={[styles.optionText, active && { color: c.text }]}>
                  {STATUS_LABELS[s]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {type === 'Printer' && (
          <>
            <Text style={styles.label}>Contagem de páginas</Text>
            <TextInput
              style={styles.input}
              value={pageCount}
              onChangeText={setPageCount}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
          </>
        )}

        <Text style={styles.label}>Peça necessária</Text>
        <TextInput
          style={styles.input}
          value={partNeeded}
          onChangeText={setPartNeeded}
          placeholder="toner, teclado, bateria, cabo…"
          placeholderTextColor={COLORS.textMuted}
        />

        {/* — Localização — */}
        <Text style={styles.section}>Localização e notas</Text>

        <Text style={styles.label}>Local no estoque</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Prateleira 3, Armário B…"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Notas e Observações</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Observações de reparo ou pendências…"
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* — Fotos — */}
        <Text style={styles.section}>Fotos</Text>
        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Text style={styles.photoBtnText}>Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <Text style={styles.photoBtnText}>Galeria</Text>
          </TouchableOpacity>
        </View>

        {pendingPhotos.length > 0 && (
          <View style={styles.photoGrid}>
            {pendingPhotos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.thumb} />
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar equipamento</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 16, paddingBottom: 48 },

    section: {
      color: COLORS.textMuted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 24,
      marginBottom: 12,
    },

    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    typeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    typeOptionActive: {
      backgroundColor: COLORS.surfaceAlt,
      borderColor: COLORS.borderFocus,
    },
    optionIcon: { fontSize: 13 },
    optionLabel: { color: COLORS.textSub, fontSize: 13 },
    optionLabelActive: { color: COLORS.text, fontWeight: '500' },

    label: {
      color: COLORS.textSub,
      fontSize: 13,
      marginBottom: 6,
    },
    required: { color: COLORS.textMuted },
    optional: { color: COLORS.textMuted, fontWeight: '400' },

    input: {
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 12,
    },
    textarea: { height: 80 },

    statusGrid: {
      gap: 8,
      marginBottom: 12,
    },
    statusOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 8,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    optionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    optionText: {
      color: COLORS.textSub,
      fontSize: 14,
      fontWeight: '400',
    },

    photoButtons: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    photoBtn: {
      flex: 1,
      backgroundColor: COLORS.surface,
      borderRadius: 8,
      paddingVertical: 11,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    photoBtnText: { color: COLORS.textSub, fontSize: 14 },

    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    thumb: {
      width: 88,
      height: 88,
      borderRadius: 8,
      backgroundColor: COLORS.surfaceAlt,
    },

    saveBtn: {
      backgroundColor: COLORS.accent,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    saveBtnText: { color: '#0a0a0a', fontWeight: '600', fontSize: 15 },
  });
  ```

- [ ] **Step 8: Update Equipment Details screen**

  Rewrite `mobile/app/equipment/[id].tsx` to support type switching, free text specs, routing to `/equipments/`, and logs.

  Replace `mobile/app/equipment/[id].tsx` content with:
  ```typescript
  import React, { useCallback, useEffect, useState } from 'react';
  import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    Alert, ActivityIndicator, Image, RefreshControl, Modal,
  } from 'react-native';
  import * as ImagePicker from 'expo-image-picker';
  import * as ImageManipulator from 'expo-image-manipulator';
  import { useLocalSearchParams, useRouter } from 'expo-router';
  import { apiFetch, apiUpload, getBaseUrl } from '../../lib/api';
  import { Equipment, EquipmentStatus, EquipmentType, MaintenanceLog, Photo } from '../../lib/types';
  import { COLORS, STATUS_COLORS, STATUS_DOT, TYPE_ICONS, TYPE_LABELS } from '../../lib/colors';
  import { StatusBadge } from '../../components/StatusBadge';
  import { LogEntry } from '../../components/LogEntry';

  const STATUSES: EquipmentStatus[] = [
    'Functional', 'Needs maintenance', 'In maintenance', 'Ready for sale', 'Sold',
  ];

  const STATUS_LABELS: Record<EquipmentStatus, string> = {
    'Functional': 'OK',
    'Needs maintenance': 'Manutenção necessária',
    'In maintenance': 'Em manutenção',
    'Ready for sale': 'Disponível',
    'Sold': 'Vendido',
  };

  const TYPES: EquipmentType[] = [
    'Computer', 'Notebook', 'Printer', 'Label Maker', 'Network', 'Other'
  ];

  async function compressAndUpload(
    uri: string,
    equipmentId: string,
    logId?: string
  ): Promise<string> {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
    );
    const form = new FormData();
    form.append('photo', {
      uri: compressed.uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    form.append('equipment_id', equipmentId);
    if (logId) form.append('log_id', logId);
    const result = await apiUpload<{ url: string }>('/photos', form);
    return result.url;
  }

  export default function EquipmentDetailScreen() {
    const rawId = useLocalSearchParams<{ id: string }>().id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const router = useRouter();

    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    const [baseUrl, setBaseUrl] = useState('');

    // edit state
    const [type, setType] = useState<EquipmentType>('Computer');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [serial, setSerial] = useState('');
    const [status, setStatus] = useState<EquipmentStatus>('Functional');
    const [pageCount, setPageCount] = useState('');
    const [partNeeded, setPartNeeded] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [specs, setSpecs] = useState('');
    const [saving, setSaving] = useState(false);

    // log state
    const [logDesc, setLogDesc] = useState('');
    const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
    const [logPhoto, setLogPhoto] = useState<string | null>(null);
    const [addingLog, setAddingLog] = useState(false);
    const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

    const load = useCallback(async () => {
      try {
        const [e, l, base] = await Promise.all([
          apiFetch<Equipment>(`/equipments/${id}`),
          apiFetch<MaintenanceLog[]>(`/equipments/${id}/logs`),
          getBaseUrl(),
        ]);
        setEquipment(e);
        setLogs(l);
        setBaseUrl(base);
        setType(e.type);
        setBrand(e.brand);
        setModel(e.model);
        setSerial(e.serial_number ?? '');
        setStatus(e.status);
        setPageCount(e.page_count != null ? String(e.page_count) : '');
        setPartNeeded(e.part_needed ?? '');
        setLocation(e.location ?? '');
        setNotes(e.notes ?? '');
        setSpecs(e.specs ?? '');
      } catch (err: unknown) {
        Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao carregar');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    async function saveDetails() {
      setSaving(true);
      try {
        const count = parseInt(pageCount, 10);
        await apiFetch(`/equipments/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            type,
            brand: brand.trim(),
            model: model.trim(),
            serial_number: serial.trim() || null,
            status,
            page_count: !isNaN(count) ? count : null,
            part_needed: partNeeded.trim() || null,
            location: location.trim() || null,
            notes: notes.trim() || null,
            specs: specs.trim() || null,
          }),
        });
        Alert.alert('Salvo');
        load();
      } catch (err: unknown) {
        Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao salvar');
      } finally {
        setSaving(false);
      }
    }

    async function deleteEquipment() {
      Alert.alert(
        'Excluir equipamento',
        'Apaga todos os dados e fotos permanentemente.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir', style: 'destructive',
            onPress: async () => {
              try {
                await apiFetch(`/equipments/${id}`, { method: 'DELETE' });
                router.replace('/');
              } catch (err: unknown) {
                Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao excluir');
              }
            },
          },
        ]
      );
    }

    async function pickLogPhoto() {
      const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
      if (perm !== 'granted') { Alert.alert('Permissão negada'); return; }
      const result = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!result.canceled && result.assets[0]) setLogPhoto(result.assets[0].uri);
    }

    async function pickLogPhotoFromGallery() {
      const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm !== 'granted') { Alert.alert('Permissão negada'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) setLogPhoto(result.assets[0].uri);
    }

    async function addLog() {
      if (!logDesc.trim()) { Alert.alert('Descrição obrigatória'); return; }
      setAddingLog(true);
      try {
        const form = new FormData();
        form.append('description', logDesc.trim());
        form.append('date', logDate);
        if (logPhoto) {
          const compressed = await ImageManipulator.manipulateAsync(
            logPhoto,
            [{ resize: { width: 1200 } }],
            { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
          );
          form.append('photo', {
            uri: compressed.uri,
            name: 'photo.jpg',
            type: 'image/jpeg',
          } as unknown as Blob);
        }
        await apiUpload(`/equipments/${id}/logs`, form);
        setLogDesc('');
        setLogPhoto(null);
        setLogDate(new Date().toISOString().slice(0, 10));
        load();
      } catch (err: unknown) {
        Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao adicionar');
      } finally {
        setAddingLog(false);
      }
    }

    if (loading) return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.textSub} size="large" />
      </View>
    );

    if (!equipment) return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Equipamento não encontrado</Text>
      </View>
    );

    const primaryPhotoUrl = equipment.photos?.[0]?.url;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.textSub}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{equipment.brand} {equipment.model}</Text>
            <Text style={styles.code}>{equipment.internal_code}</Text>
          </View>
          <StatusBadge status={equipment.status} size="sm" />
        </View>

        {/* Primary Photo Banner */}
        {primaryPhotoUrl && baseUrl ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setFullscreenPhoto(`${baseUrl.replace('/api', '')}${primaryPhotoUrl}`)}
            style={styles.bannerContainer}
          >
            <Image
              source={{ uri: `${baseUrl.replace('/api', '')}${primaryPhotoUrl}` }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerOverlayText}>Visualizar Foto</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
              Detalhes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Histórico {logs.length > 0 ? `(${logs.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'details' ? (
          <View>
            <Text style={styles.section}>Tipo de Equipamento</Text>
            <View style={styles.typeGrid}>
              {TYPES.map(t => {
                const active = type === t;
                const icon = TYPE_ICONS[t];
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, active && styles.typeOptionActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={styles.optionIcon}>{icon}</Text>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                      {TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.section}>Identificação</Text>

            <Text style={styles.label}>Marca</Text>
            <TextInput style={styles.input} value={brand} onChangeText={setBrand}
              placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Modelo</Text>
            <TextInput style={styles.input} value={model} onChangeText={setModel}
              placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Número de série</Text>
            <TextInput style={styles.input} value={serial} onChangeText={setSerial}
              placeholder="N/A" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.section}>Especificações</Text>
            <Text style={styles.label}>Ficha Técnica</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={specs}
              onChangeText={setSpecs}
              placeholder="Detalhes técnicos livre…"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.section}>Estado</Text>

            <View style={styles.statusGrid}>
              {STATUSES.map(s => {
                const active = status === s;
                const dot = STATUS_DOT[s];
                const c = STATUS_COLORS[s];
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusOption,
                      active && { backgroundColor: c.bg, borderColor: c.dot },
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <View style={[styles.optionDot, { backgroundColor: dot }]} />
                    <Text style={[styles.optionText, active && { color: c.text }]}>
                      {STATUS_LABELS[s]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {type === 'Printer' && (
              <>
                <Text style={styles.label}>Contagem de páginas</Text>
                <TextInput style={styles.input} value={pageCount} onChangeText={setPageCount}
                  keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} />
              </>
            )}

            <Text style={styles.label}>Peça necessária</Text>
            <TextInput style={styles.input} value={partNeeded} onChangeText={setPartNeeded}
              placeholder="toner, fusor…" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.section}>Localização e notas</Text>

            <Text style={styles.label}>Localização</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation}
              placeholder="Prateleira 3" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Notas técnicas</Text>
            <TextInput
              style={[styles.input, styles.textarea]} value={notes} onChangeText={setNotes}
              multiline numberOfLines={4} textAlignVertical="top"
              placeholderTextColor={COLORS.textMuted}
            />

            {equipment.photos && equipment.photos.length > 0 && (
              <>
                <Text style={styles.section}>Fotos</Text>
                <View style={styles.photoGrid}>
                  {(equipment.photos as Photo[]).map(p => {
                    const fullUrl = `${baseUrl.replace('/api', '')}${p.url}`;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        activeOpacity={0.8}
                        onPress={() => setFullscreenPhoto(fullUrl)}
                      >
                        <Image
                          source={{ uri: fullUrl }}
                          style={styles.thumb}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={saveDetails} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#0a0a0a" />
                : <Text style={styles.saveBtnText}>Salvar alterações</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={deleteEquipment}>
              <Text style={styles.deleteBtnText}>Excluir equipamento</Text>
            </TouchableOpacity>
          </View>

        ) : (
          /* ————— HISTORY TAB ————— */
          <View>
            <Text style={styles.section}>Novo registro</Text>

            <Text style={styles.label}>Data</Text>
            <TextInput style={styles.input} value={logDate} onChangeText={setLogDate}
              placeholder="AAAA-MM-DD" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={logDesc} onChangeText={setLogDesc}
              multiline numberOfLines={3} textAlignVertical="top"
              placeholder="O que foi feito ou observado…"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.logPhotoRow}>
              <TouchableOpacity style={[styles.photoBtn, { flex: 1 }]} onPress={pickLogPhoto}>
                <Text style={styles.photoBtnText}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.photoBtn, { flex: 1 }]} onPress={pickLogPhotoFromGallery}>
                <Text style={styles.photoBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>

            {logPhoto && (
              <Image
                source={{ uri: logPhoto }}
                style={{ height: 140, borderRadius: 8, marginBottom: 12, backgroundColor: COLORS.surfaceAlt }}
                resizeMode="cover"
              />
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={addLog} disabled={addingLog}>
              {addingLog
                ? <ActivityIndicator color="#0a0a0a" />
                : <Text style={styles.saveBtnText}>Adicionar ao histórico</Text>
              }
            </TouchableOpacity>

            <Text style={styles.section}>Histórico</Text>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum registro ainda.</Text>
            ) : (
              logs.map(log => (
                <LogEntry
                  key={log.id}
                  log={log}
                  baseUrl={baseUrl}
                  onPressPhoto={setFullscreenPhoto}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 16, paddingBottom: 60 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },

    bannerContainer: {
      height: 180,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 20,
      backgroundColor: COLORS.surface,
      position: 'relative',
    },
    bannerImage: {
      width: '100%',
      height: '100%',
    },
    bannerOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingVertical: 6,
      alignItems: 'center',
    },
    bannerOverlayText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '500',
    },
    modalBg: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalHeader: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 10,
    },
    closeBtn: {
      backgroundColor: '#222',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#444',
    },
    closeBtnText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    modalImage: {
      width: '100%',
      height: '80%',
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    headerLeft: { flex: 1, paddingRight: 12 },
    title: { color: COLORS.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
    code: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },

    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingBottom: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: COLORS.accent },
    tabText: { color: COLORS.textMuted, fontWeight: '500', fontSize: 14 },
    tabTextActive: { color: COLORS.text },

    section: {
      color: COLORS.textMuted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 12,
    },
    
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    typeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    typeOptionActive: {
      backgroundColor: COLORS.surfaceAlt,
      borderColor: COLORS.borderFocus,
    },
    optionIcon: { fontSize: 12 },
    optionLabel: { color: COLORS.textSub, fontSize: 12 },
    optionLabelActive: { color: COLORS.text, fontWeight: '500' },

    label: { color: COLORS.textSub, fontSize: 13, marginBottom: 6 },

    input: {
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 12,
    },
    textarea: { height: 80 },

    statusGrid: { gap: 8, marginBottom: 12 },
    statusOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 8,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    optionDot: { width: 8, height: 8, borderRadius: 4 },
    optionText: { color: COLORS.textSub, fontSize: 14 },

    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    thumb: {
      width: 88,
      height: 88,
      borderRadius: 8,
      backgroundColor: COLORS.surfaceAlt,
    },

    logPhotoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    photoBtn: {
      backgroundColor: COLORS.surface,
      borderRadius: 8,
      paddingVertical: 11,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    photoBtnText: { color: COLORS.textSub, fontSize: 13 },

    saveBtn: {
      backgroundColor: COLORS.accent,
      borderRadius: 8,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 10,
    },
    saveBtnText: { color: '#0a0a0a', fontWeight: '600', fontSize: 15 },

    deleteBtn: {
      borderRadius: 8,
      paddingVertical: 13,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#3f1010',
      marginBottom: 8,
    },
    deleteBtnText: { color: '#f87171', fontWeight: '500', fontSize: 14 },

    emptyText: { color: COLORS.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  });
  ```

---

## Plan Verification

- Compile mobile app to verify type alignment:
  ```bash
  cd mobile && npx tsc --noEmit
  ```
- Send request to backend alias route:
  ```bash
  curl -I http://localhost:3000/api/printers
  ```
  Expected: HTTP 200 OK (alias compatibility working perfectly).
