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
