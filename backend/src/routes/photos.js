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
