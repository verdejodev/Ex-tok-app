'use strict';
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialise DB (runs migrations on first start)
require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve uploaded photos as static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve web panel static assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/equipments', require('./routes/equipments'));
app.use('/api/printers',   require('./routes/equipments')); // Alias compatibility
app.use('/api',            require('./routes/logs'));
app.use('/api/photos',     require('./routes/photos'));

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Catch-all 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🖨️  Printer Tracker API running at http://0.0.0.0:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Uploads served at: http://localhost:${PORT}/uploads/\n`);
});
