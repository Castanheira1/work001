'use strict';

const express = require('express');
const https = require('https');

const app = express();
app.use(express.json({ limit: '20mb' }));

// ── Config ──────────────────────────────────────────────────────────────────
const PORT           = process.env.PORT             || 3000;
const SHARED_SECRET  = process.env.SYNC_SHARED_SECRET || '';
const SUPABASE_URL   = process.env.SUPABASE_URL      || '';
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

// ── Helpers ──────────────────────────────────────────────────────────────────
function supabaseFetch(path, method, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      ...extraHeaders,
    };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers,
    }, res => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Supabase ${method} ${path} → ${res.statusCode}: ${raw}`));
        } else {
          try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); }
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

/** Upload a data-URL or base64 string to Supabase Storage (pcm-files bucket) */
async function uploadPdf(omNum, key, dataUrl) {
  if (!dataUrl || !SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const raw = typeof dataUrl === 'string' && dataUrl.includes(',')
      ? dataUrl.split(',')[1]
      : dataUrl;
    const buf = Buffer.from(raw, 'base64');
    const storagePath = `oms/${omNum}/${key}.pdf`;

    return new Promise((resolve, reject) => {
      const url = new URL(`${SUPABASE_URL}/storage/v1/object/pcm-files/${storagePath}`);
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/pdf',
        'Content-Length': buf.length,
        'x-upsert': 'true',
      };
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers,
      }, res => {
        let body = '';
        res.on('data', c => { body += c; });
        res.on('end', () => {
          if (res.statusCode >= 400) {
            console.warn(`[SYNC] upload PDF ${storagePath} falhou: ${res.statusCode} ${body}`);
            resolve(null);
          } else {
            resolve(storagePath);
          }
        });
      });
      req.on('error', e => { console.warn('[SYNC] upload erro:', e.message); resolve(null); });
      req.write(buf);
      req.end();
    });
  } catch (e) {
    console.warn('[SYNC] uploadPdf erro:', e.message);
    return null;
  }
}

/** Process a single outbox item; returns true if it should be acked */
async function processItem(item) {
  if (!item || !item.payload || !item.payload.type) return true; // ack unknown

  const type = item.payload.type;

  // ── OM finalizada / pendente / cancelada ─────────────────────────────────
  if (['om_finalizada', 'om_pendente_assinatura', 'om_cancelada_pendente'].includes(type)) {
    const omNum = item.payload.data && item.payload.data.om;
    if (!omNum || !SUPABASE_URL) return true;

    // Upload PDFs if present
    const attachments = item.attachments || {};
    const pdfKeys = ['rel', 'ck', 'nc', 'orig'];
    let hasRelatorio = false;

    for (const k of pdfKeys) {
      if (attachments[k]) {
        const path = await uploadPdf(omNum, k, attachments[k]);
        if (path) hasRelatorio = true;
      }
    }

    // Update has_relatorio flag on the OM if we uploaded at least one PDF
    if (hasRelatorio && SUPABASE_URL) {
      try {
        await supabaseFetch(
          `/rest/v1/oms?num=eq.${encodeURIComponent(omNum)}`,
          'PATCH',
          { has_relatorio: true },
        );
      } catch (e) {
        console.warn('[SYNC] patch has_relatorio falhou:', e.message);
      }
    }

    return true;
  }

  // ── Desvios (handled by client directly, just ack) ───────────────────────
  if (type === 'desvio_registrado') return true;

  // ── Unknown type: ack so it doesn't block the queue ─────────────────────
  return true;
}

// ── Middleware: validate shared secret ───────────────────────────────────────
app.use('/api/sync', (req, res, next) => {
  if (!SHARED_SECRET) return next();
  const provided = req.headers['x-sync-secret'] || '';
  if (provided !== SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// ── CORS headers ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sync-Secret');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Main sync endpoint ────────────────────────────────────────────────────────
app.post('/api/sync', async (req, res) => {
  const items = Array.isArray(req.body && req.body.items) ? req.body.items : [];

  if (!items.length) {
    return res.json({ ack: [] });
  }

  const ack = [];
  for (const item of items) {
    try {
      const ok = await processItem(item);
      if (ok && item.id) ack.push(item.id);
    } catch (e) {
      console.error('[SYNC] processItem erro:', e.message);
    }
  }

  console.log(`[SYNC] processados ${items.length}, acked ${ack.length}`);
  return res.json({ ack });
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[SYNC] API listening on port ${PORT}`);
});
