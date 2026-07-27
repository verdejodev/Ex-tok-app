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
