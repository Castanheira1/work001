'use strict';

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app = express();

// ── Config ───────────────────────────────────────────────────────────────────
const PORT          = Number(process.env.PORT)               || 3000;
const SHARED_SECRET = process.env.SYNC_SHARED_SECRET         || '';
const JSON_LIMIT    = process.env.JSON_LIMIT                 || '10mb';
const DATA_DIR      = path.join(__dirname, 'data');
const NDJSON_FILE   = path.join(DATA_DIR, 'sync.ndjson');

// ── Ensure data dir exists ────────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: JSON_LIMIT }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sync-Secret');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Auth ──────────────────────────────────────────────────────────────────────
function checkAuth(req, res, next) {
  if (!SHARED_SECRET) return next();
  if ((req.headers['x-sync-secret'] || '') === SHARED_SECRET) return next();
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractItems(body) {
  if (Array.isArray(body))              return body;
  if (Array.isArray(body && body.items)) return body.items;
  if (Array.isArray(body && body.batch)) return body.batch;
  return [];
}

function persistBatch(items) {
  const line = JSON.stringify({ ts: Date.now(), items }) + '\n';
  fs.appendFileSync(NDJSON_FILE, line, 'utf8');
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.post('/api/sync', checkAuth, (req, res) => {
  const raw = extractItems(req.body);

  const ack       = [];
  let   discarded = 0;

  for (const item of raw) {
    if (item && item.id) {
      ack.push(item.id);
    } else {
      discarded++;
      const type = item && item.payload && item.payload.type || 'unknown';
      console.warn(`[SYNC] item sem id descartado (type=${type})`);
    }
  }

  if (ack.length) {
    try {
      persistBatch(raw.filter(i => i && i.id));
    } catch (e) {
      console.error('[SYNC] falha ao persistir batch:', e.message);
      return res.status(500).json({ ok: false, error: 'persist failed' });
    }
  }

  console.log(`[SYNC] received=${raw.length} ack=${ack.length} discarded=${discarded}`);
  return res.json({ ok: true, ack, received: ack.length + discarded, discarded });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`[SYNC] API listening on port ${PORT}`));
