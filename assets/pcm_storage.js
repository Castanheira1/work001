(function () {
  'use strict';

  if (window.PdfDB && typeof window.PdfDB.get === 'function') return;

  var DB_NAME = 'pcm_mcr_db';
  var STORE_PDFS = 'pdfs';
  var DB_VERSION = 3;
  var MAX_PDFS = 60;

  var _dbInstance = null;
  var _dbPromise = null;

  function dataUrlToBlob(dataUrl) {
    try {
      var parts = dataUrl.split(',');
      var mime = (parts[0].match(/:(.*?);/) || ['', 'application/octet-stream'])[1];
      var raw = atob(parts[1]);
      var arr = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
      return new Blob([arr], { type: mime });
    } catch (e) { return null; }
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('Falha ao converter Blob.')); };
      reader.readAsDataURL(blob);
    });
  }

  function getDB() {
    if (_dbInstance) return Promise.resolve(_dbInstance);
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) { reject(new Error('IndexedDB indisponivel.')); return; }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORE_PDFS)) db.createObjectStore(STORE_PDFS);
      };
      req.onsuccess = function (e) {
        _dbInstance = e.target.result;
        _dbInstance.onclose = function () { _dbInstance = null; _dbPromise = null; };
        _dbInstance.onversionchange = function () { _dbInstance.close(); _dbInstance = null; _dbPromise = null; };
        resolve(_dbInstance);
      };
      req.onerror = function () { _dbPromise = null; reject(req.error || new Error('Falha ao abrir IndexedDB.')); };
    });
    return _dbPromise;
  }

  function wrapPdfValue(value) {
    return { __pcm_pdf_entry: true, data: value, savedAt: Date.now(), lastAccessAt: Date.now() };
  }

  function isWrappedPdfValue(value) {
    return !!(value && typeof value === 'object' && value.__pcm_pdf_entry === true && Object.prototype.hasOwnProperty.call(value, 'data'));
  }

  function touchPdfEntry(db, key, entry) {
    if (!isWrappedPdfValue(entry)) return;
    try {
      entry.lastAccessAt = Date.now();
      var tx = db.transaction(STORE_PDFS, 'readwrite');
      putStoreEntry(tx.objectStore(STORE_PDFS), entry, key);
    } catch (e) { console.warn('[PdfDB] touchPdfEntry falhou:', e); }
  }

  function putStoreEntry(store, value, key) {
    var keyPath = store && store.keyPath;
    if (!keyPath) {
      store.put(value, key);
      return;
    }
    if (typeof keyPath === 'string' && keyPath) {
      var withInlineKey = Object.assign({}, value);
      withInlineKey[keyPath] = key;
      store.put(withInlineKey);
      return;
    }
    store.put(value);
  }

  function evictOldPdfs(db, incomingCount) {
    incomingCount = incomingCount || 0;
    return new Promise(function (resolve) {
      try {
        var tx = db.transaction(STORE_PDFS, 'readonly');
        var store = tx.objectStore(STORE_PDFS);
        var entries = [];
        var req = store.openCursor();
        req.onsuccess = function (e) {
          var cursor = e.target.result;
          if (!cursor) {
            var removeCount = Math.max(0, entries.length - MAX_PDFS + incomingCount);
            if (!removeCount) { resolve(); return; }
            entries.sort(function (a, b) { return a.sortTs - b.sortTs; });
            var keysToDelete = entries.slice(0, removeCount).map(function (item) { return item.key; });
            try {
              var txDel = db.transaction(STORE_PDFS, 'readwrite');
              var delStore = txDel.objectStore(STORE_PDFS);
              keysToDelete.forEach(function (key) { delStore.delete(key); });
              txDel.oncomplete = function () { resolve(); };
              txDel.onerror = function () { resolve(); };
              txDel.onabort = function () { resolve(); };
            } catch (err) {
              resolve();
            }
            return;
          }
          var value = cursor.value;
          var sortTs = 0;
          if (isWrappedPdfValue(value)) sortTs = Number(value.lastAccessAt || value.savedAt || 0);
          entries.push({ key: cursor.key, sortTs: sortTs });
          cursor.continue();
        };
        req.onerror = function () { resolve(); };
      } catch (e) {
        resolve();
      }
    });
  }

  function put(key, value) {
    var storeValue = value;
    if (typeof value === 'string' && value.indexOf('data:') === 0) {
      var blob = dataUrlToBlob(value);
      if (blob) storeValue = blob;
    }
    return getDB().then(function (db) {
      return evictOldPdfs(db, 1).then(function () {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(STORE_PDFS, 'readwrite');
          putStoreEntry(tx.objectStore(STORE_PDFS), wrapPdfValue(storeValue), key);
          tx.oncomplete = function () { resolve(true); };
          tx.onerror = function () { reject(tx.error || new Error('Falha ao salvar: ' + key)); };
          tx.onabort = function () { reject(new Error('Abortado: ' + key)); };
        });
      });
    });
  }

  function get(key) {
    return getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_PDFS, 'readonly');
        var req = tx.objectStore(STORE_PDFS).get(key);
        req.onsuccess = function () {
          var raw = req.result || null;
          if (!raw) { resolve(null); return; }
          if (raw instanceof Blob) {
            blobToDataUrl(raw).then(resolve).catch(reject);
            return;
          }
          if (isWrappedPdfValue(raw)) {
            touchPdfEntry(db, key, raw);
            var value = raw.data;
            if (value instanceof Blob) {
              blobToDataUrl(value).then(resolve).catch(reject);
            } else {
              resolve(value);
            }
            return;
          }
          resolve(raw);
        };
        req.onerror = function () { reject(req.error || new Error('Falha ao ler: ' + key)); };
      });
    });
  }

  function del(key) {
    return getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_PDFS, 'readwrite');
        tx.objectStore(STORE_PDFS).delete(key);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { reject(tx.error || new Error('Falha ao deletar: ' + key)); };
        tx.onabort = function () { reject(new Error('Abortado: ' + key)); };
      });
    });
  }

  function keys() {
    return getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_PDFS, 'readonly');
        var store = tx.objectStore(STORE_PDFS);
        if (store.getAllKeys) {
          var req = store.getAllKeys();
          req.onsuccess = function () { resolve(req.result || []); };
          req.onerror = function () { reject(req.error || new Error('Falha ao listar chaves.')); };
        } else {
          var out = [];
          var cur = store.openCursor();
          cur.onsuccess = function (e) {
            var c = e.target.result;
            if (c) { out.push(c.key); c.continue(); } else { resolve(out); }
          };
          cur.onerror = function () { reject(new Error('Falha ao varrer chaves.')); };
        }
      });
    });
  }

  window.PdfDB = { put: put, get: get, del: del, keys: keys };

  var BUCKET = 'pcm-files';

  function _getSbClient() {
    if (window._sbClientStorage) return window._sbClientStorage;
    var url = (window.ENV && window.ENV.SUPABASE_URL) || window.SUPABASE_URL || null;
    var key = (window.ENV && window.ENV.SUPABASE_ANON_KEY) || window.SUPABASE_ANON_KEY || null;
    if (!url || !key || !window.supabase) {
      console.error('[STORAGE] Credenciais Supabase não configuradas');
      return null;
    }
    window._sbClientStorage = window.supabase.createClient(url, key);
    return window._sbClientStorage;
  }

  function normalizePath(path) {
    if (!path) return '';
    if (path.indexOf(BUCKET + '/') === 0) path = path.substring(BUCKET.length + 1);
    return path;
  }

  function getSignedUrl(path) {
    var sb = _getSbClient();
    if (!sb) return Promise.resolve(null);
    return sb.storage.from(BUCKET).createSignedUrl(normalizePath(path), 3600)
      .then(function (res) {
        if (res.error) { console.error('signedURL err', res.error); return null; }
        return res.data.signedUrl;
      })
      .catch(function (e) { console.error('signedURL fail', e); return null; });
  }

  window.PCMStorage = { getSignedUrl: getSignedUrl };
})();
