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

const postLogHandler = upload.single('photo');
const postLogRoute = (req, res) => {
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
  }

  db.prepare(
    'INSERT INTO maintenance_logs (id, equipment_id, date, description, photo_url, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.params.id, logDate, description, photo_url, now);

  if (req.file) {
    db.prepare(
      'INSERT INTO photos (id, equipment_id, log_id, url, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), req.params.id, id, photo_url, now);
  }

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
