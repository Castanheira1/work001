(function () {
  var DEFAULT_SYNC_ENDPOINT = '/api/sync';
  var SYNC_INTERVAL_MS = 30000;
  var MAX_ITEMS_PER_BATCH = 2;
  var MAX_PDF_PAYLOAD_BYTES = 3 * 1024 * 1024;
  var IDB_OPEN_TIMEOUT_MS = 5000;

  var syncing = false;

  function getSyncEndpoint() {
    return (window.ENV && window.ENV.SYNC_ENDPOINT) || window.SYNC_ENDPOINT || DEFAULT_SYNC_ENDPOINT;
  }

  function log() {
    try { console.log.apply(console, ['[SYNC]'].concat([].slice.call(arguments))); } catch (e) {}
  }

  function isOnline() {
    try { return !!navigator.onLine; } catch (e) { return false; }
  }

  function isDev() {
    try {
      return !!(window.PCMOffline && typeof window.PCMOffline.dev === 'function' && window.PCMOffline.dev());
    } catch (e) { return false; }
  }

  function getSupabaseUrl()  { return window.SUPABASE_URL  || ''; }
  function getSupabaseAnon() { return window.SUPABASE_ANON_KEY || ''; }

  function getOmsStorageKey()      { return window.STORAGE_KEY_OMS      || 'pcm_oms_mcr_v4'; }
  function getHistoricoStorageKey(){ return window.STORAGE_KEY_HISTORICO || 'pcm_historico_v4'; }

  function loadOms() {
    try {
      var raw = localStorage.getItem(getOmsStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveOms(oms) {
    localStorage.setItem(getOmsStorageKey(), JSON.stringify(oms || []));
  }

  function buildLocalOm(r) {
    var estadoFluxo = String(r.estado_fluxo || '').toLowerCase();
    var statusRaw = String(r.status || '').toLowerCase();
    var emOficina = estadoFluxo.indexOf('oficina') !== -1 || statusRaw === 'em_oficina';
    var lockRemoto = r.lock_device_id || null;
    return {
      num: r.num,
      titulo: r.titulo || '',
      cc: r.cc || '',
      equipe: r.equipe || '',
      local: r.local_instalacao || r.local || '',
      equipamento: r.equipamento || '',
      descricao: r.descricao_completa || r.descricao || r.desc_local || '',
      descLocal: r.desc_local || '',
      descLocalSup: r.desc_local_sup || '',
      caracteristicas: r.caracteristicas || '',
      planoCod: r.plano_cod || '',
      escopo: r.escopo || 'geral',
      inicio: r.data_inicio_prevista || '',
      fim: r.data_fim_prevista || '',
      tipoManut: r.tipo_manutencao || '',
      criticidade: r.criticidade || '',
      tagIdentificacao: r.tag_identificacao || '',
      status: r.status_sistema || r.status || '',
      statusAtual: 'programada',
      finalizada: !!(r.finalizada || statusRaw === 'finalizada'),
      cancelada: !!(r.cancelada || statusRaw === 'cancelada'),
      pendenteAssinatura: !!(r.pendente_assinatura || statusRaw === 'pendente_assinatura'),
      emOficina: emOficina,
      historicoExecucao: r.historico_execucao || [],
      materiaisUsados: r.materiais_usados || [],
      executantes: r.executantes || [],
      primeiroExecutante: r.primeiro_executante || null,
      hh_total: r.hh_total || 0,
      materiais_total: r.materiais_total || 0,
      lockDeviceId: lockRemoto,
      _fromSync: true
    };
  }

  function fillMissingRemoteData(om, r) {
    if (!om || !r) return false;
    var changed = false;

    function setIfEmpty(key, value) {
      if (value === null || typeof value === 'undefined' || value === '') return;
      if (typeof om[key] === 'undefined' || om[key] === null || om[key] === '' || om[key] === '---') {
        om[key] = value;
        changed = true;
      }
    }

    var lockRemoto = r.lock_device_id || null;
    if ((om.lockDeviceId || null) !== lockRemoto) {
      om.lockDeviceId = lockRemoto;
      changed = true;
    }

    var estadoFluxo = String(r.estado_fluxo || '').toLowerCase();
    var statusRaw = String(r.status || '').toLowerCase();
    var emOficina = estadoFluxo.indexOf('oficina') !== -1 || statusRaw === 'em_oficina';
    if (!!om.emOficina !== emOficina) {
      om.emOficina = emOficina;
      changed = true;
    }

    setIfEmpty('titulo', r.titulo || '');
    setIfEmpty('cc', r.cc || '');
    setIfEmpty('equipe', r.equipe || '');
    setIfEmpty('local', r.local_instalacao || r.local || '');
    setIfEmpty('equipamento', r.equipamento || '');
    setIfEmpty('descricao', r.descricao_completa || r.descricao || r.desc_local || '');
    setIfEmpty('descLocal', r.desc_local || '');
    setIfEmpty('descLocalSup', r.desc_local_sup || '');
    setIfEmpty('caracteristicas', r.caracteristicas || '');
    setIfEmpty('planoCod', r.plano_cod || '');
    setIfEmpty('escopo', r.escopo || '');
    setIfEmpty('inicio', r.data_inicio_prevista || '');
    setIfEmpty('fim', r.data_fim_prevista || '');
    setIfEmpty('tipoManut', r.tipo_manutencao || '');
    setIfEmpty('criticidade', r.criticidade || '');
    setIfEmpty('tagIdentificacao', r.tag_identificacao || '');
    setIfEmpty('status', r.status_sistema || r.status || '');

    if ((!Array.isArray(om.historicoExecucao) || om.historicoExecucao.length === 0) && Array.isArray(r.historico_execucao) && r.historico_execucao.length) {
      om.historicoExecucao = r.historico_execucao;
      changed = true;
    }
    if ((!Array.isArray(om.materiaisUsados) || om.materiaisUsados.length === 0) && Array.isArray(r.materiais_usados) && r.materiais_usados.length) {
      om.materiaisUsados = r.materiais_usados;
      changed = true;
    }
    if ((!Array.isArray(om.executantes) || om.executantes.length === 0) && Array.isArray(r.executantes) && r.executantes.length) {
      om.executantes = r.executantes;
      changed = true;
    }
    if (!om.primeiroExecutante && r.primeiro_executante) {
      om.primeiroExecutante = r.primeiro_executante;
      changed = true;
    }
    if ((!om.hh_total || om.hh_total === 0) && r.hh_total) {
      om.hh_total = r.hh_total;
      changed = true;
    }
    if ((!om.materiais_total || om.materiais_total === 0) && r.materiais_total) {
      om.materiais_total = r.materiais_total;
      changed = true;
    }

    return changed;
  }

  function omNeedsExtraction(om) {
    if (!om) return false;
    function vazio(v) {
      return !v || v === '---' || v === '-' || v === '--' || v === '—';
    }
    return (
      vazio(om.descLocal) ||
      vazio(om.descLocalSup) ||
      vazio(om.caracteristicas) ||
      vazio(om.criticidade) ||
      vazio(om.tipoManut) ||
      vazio(om.tagIdentificacao) ||
      vazio(om.local) ||
      vazio(om.descricao)
    );
  }

  function applyExtractedData(om, d) {
    if (!om || !d) return false;
    var changed = false;

    function setField(key, value, invalids) {
      if (value === null || typeof value === 'undefined') return;
      var val = (typeof value === 'string') ? value.trim() : value;
      if (val === '') return;
      invalids = invalids || [];
      if (val === '-' || val === '--' || val === '—') return;
      if (invalids.indexOf(val) !== -1) return;
      if (om[key] !== val) {
        om[key] = val;
        changed = true;
      }
    }

    setField('titulo', d.tituloCurto, ['MANUTENÇÃO']);
    setField('cc', d.centroCusto, ['---']);
    setField('equipamento', d.numEquip, ['---']);
    setField('local', d.local, ['---']);
    setField('descricao', d.descCompleta, ['---']);
    setField('inicio', d.inicio, ['--/--/-- --:--']);
    setField('fim', d.fim, ['--/--/-- --:--']);
    setField('planoCod', d.planoCod, ['---']);
    setField('equipe', d.equipe, ['S11MCR1']);
    setField('descLocal', d.descLocal, ['---']);
    setField('descLocalSup', d.descLocalSup, ['---']);
    setField('caracteristicas', d.caracteristicas, ['---']);
    setField('criticidade', d.criticidade, ['---']);
    setField('tipoManut', d.tipoManut, ['---']);
    setField('tagIdentificacao', d.tagIdentificacao, ['---']);
    setField('status', d.badgesHTML, ['---']);

    return changed;
  }

  function arrayBufferToDataUrl(ab) {
    var bytes = new Uint8Array(ab);
    var chunkSize = 0x8000;
    var chunks = [];
    for (var i = 0; i < bytes.length; i += chunkSize) {
      chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize)));
    }
    return 'data:application/pdf;base64,' + btoa(chunks.join(''));
  }

  function buildTextLines(items) {
    var clean = (items || []).filter(function (i) {
      return i && i.str && i.str.trim();
    }).map(function (i) {
      return {
        str: i.str.trim(),
        x: i.transform[4],
        y: Math.round(i.transform[5] * 10) / 10
      };
    });

    clean.sort(function (a, b) {
      return b.y - a.y || a.x - b.x;
    });

    var lines = '';
    var prevY = null;

    for (var i = 0; i < clean.length; i++) {
      if (prevY !== null && Math.abs(clean[i].y - prevY) > 2) lines += '\n';
      else if (prevY !== null) lines += ' ';
      lines += clean[i].str;
      prevY = clean[i].y;
    }

    return lines;
  }

  function extractPdfDetailsIntoOm(om, base64) {
    if (!base64) return Promise.resolve(false);
    if (!window.PCMExtrair || typeof window.PCMExtrair !== 'function') return Promise.resolve(false);
    if (typeof pdfjsLib === 'undefined' || !pdfjsLib.getDocument) return Promise.resolve(false);

    try {
      var raw = base64.split(',')[1] || base64;
      var bin = atob(raw);
      var data = new Uint8Array(bin.length);

      for (var i = 0; i < bin.length; i++) {
        data[i] = bin.charCodeAt(i);
      }

      return pdfjsLib.getDocument({ data: data }).promise
        .then(function (pdf) {
          return pdf.getPage(pdf.numPages >= 2 ? 2 : 1);
        })
        .then(function (page) {
          return page.getTextContent();
        })
        .then(function (content) {
          var txt = (content.items || []).map(function (it) { return it.str; }).join(' ');
          var txtLines = buildTextLines(content.items || []);
          var dados = window.PCMExtrair(txt, txtLines);
          var changed = applyExtractedData(om, dados);
          if (changed) log('extração da página 2 OK para OM', om.num);
          return changed;
        })
        .catch(function (err) {
          log('extração da página 2 falhou OM ' + om.num + ':', err && err.message ? err.message : err);
          return false;
        });
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function ensurePdfAndExtraction(remoteOm, localOm, hdrs) {
    if (!window.PdfDB || !localOm) return Promise.resolve(false);

    return window.PdfDB.get('orig_' + remoteOm.num)
      .then(function (pdfBase64) {
        if (pdfBase64) {
          if (omNeedsExtraction(localOm)) return extractPdfDetailsIntoOm(localOm, pdfBase64);
          return false;
        }

        return fetch(getSupabaseUrl() + '/storage/v1/object/pcm-files/originais/' + remoteOm.num + '.pdf', {
          headers: hdrs,
          cache: 'no-store'
        })
          .then(function (resp) {
            if (!resp.ok) return false;
            return resp.arrayBuffer().then(function (ab) {
              var dataUrl = arrayBufferToDataUrl(ab);
              return window.PdfDB.put('orig_' + remoteOm.num, dataUrl).then(function () {
                return extractPdfDetailsIntoOm(localOm, dataUrl);
              });
            });
          })
          .catch(function () { return false; });
      })
      .catch(function () { return false; });
  }

  var _dbInst = null;
  var _dbProm = null;

  function openDB() {
    if (_dbInst) return Promise.resolve(_dbInst);
    if (_dbProm) return _dbProm;

    _dbProm = new Promise(function (resolve) {
      if (!('indexedDB' in self)) return resolve(null);

      var req = indexedDB.open('pcm_mcr_db', 3);
      var resolved = false;
      var timer = setTimeout(function () {
        if (resolved) return;
        resolved = true;
        _dbProm = null;
        log('IndexedDB timeout ao abrir banco; seguindo sem persistência offline.');
        resolve(null);
      }, IDB_OPEN_TIMEOUT_MS);

      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('pdfs')) db.createObjectStore('pdfs');
      };

      req.onsuccess = function () {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        _dbInst = req.result;
        _dbInst.onclose = function () {
          _dbInst = null;
          _dbProm = null;
        };
        resolve(_dbInst);
      };

      req.onerror = function () {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        _dbProm = null;
        log('IndexedDB indisponível; sincronização offline ficará limitada.', req.error || null);
        resolve(null);
      };
      req.onblocked = function () {
        log('IndexedDB bloqueado por outra aba/processo.');
      };
    });

    return _dbProm;
  }

  function getAllOutbox() {
    return openDB().then(function (db) {
      if (!db) return [];
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(['outbox'], 'readonly');
          var req = tx.objectStore('outbox').getAll();
          req.onsuccess = function () { resolve(req.result || []); };
          req.onerror = function () { resolve([]); };
        } catch (e) {
          resolve([]);
        }
      });
    }).catch(function () { return []; });
  }

  function deleteOutbox(id) {
    return openDB().then(function (db) {
      if (!db) return Promise.resolve();
      return new Promise(function (resolve, reject) {
        try {
          var tx = db.transaction(['outbox'], 'readwrite');
          tx.objectStore('outbox').delete(id);
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function () { reject(tx.error || new Error('Falha ao excluir item da outbox: ' + id)); };
          tx.onabort = function () { reject(tx.error || new Error('Transação abortada ao excluir item da outbox: ' + id)); };
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  function kvGet(key) {
    return openDB().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(['kv'], 'readonly');
          var req = tx.objectStore('kv').get(key);
          req.onsuccess = function () { resolve(req.result || null); };
          req.onerror = function () { resolve(null); };
        } catch (e) {
          resolve(null);
        }
      });
    }).catch(function () { return null; });
  }

  function hasPdfDB() {
    try {
      return !!(window.PdfDB && typeof window.PdfDB.get === 'function');
    } catch (e) {
      return false;
    }
  }

  function safePdfGet(key) {
    if (!hasPdfDB()) return Promise.resolve(null);
    try {
      return window.PdfDB.get(key).then(function (v) { return v || null; }).catch(function () { return null; });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  function safePdfGetByOm(prefix, om) {
    var baseKey = prefix + om;
    return safePdfGet(baseKey).then(function (v) {
      if (v) return v;
      if (!window.PdfDB || typeof window.PdfDB.keys !== 'function') return null;

      return window.PdfDB.keys().then(function (keys) {
        var pref = baseKey + '_';
        var matches = (keys || []).filter(function (k) {
          return typeof k === 'string' && k.indexOf(pref) === 0;
        });
        if (!matches.length) return null;
        matches.sort();
        return safePdfGet(matches[matches.length - 1]);
      }).catch(function () { return null; });
    });
  }

  function dataUrlPdfToArrayBuffer(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    try {
      var raw = dataUrl.indexOf(',') >= 0 ? dataUrl.split(',')[1] : dataUrl;
      var bin = atob(raw);
      var out = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out.buffer;
    } catch (e) {
      return null;
    }
  }

  function packItem(item) {
    var base = { id: item.id, ts: item.ts, payload: item.payload };
    var p = (item && item.payload) ? item.payload : null;

    if (!p || !p.type) return Promise.resolve(base);

    if (p.type === 'om_finalizada' && p.data && p.data.om) {
      var om = p.data.om;
      return Promise.all([
        safePdfGetByOm('rel_', om),
        safePdfGetByOm('ck_', om),
        safePdfGetByOm('nc_', om),
        safePdfGetByOm('orig_', om),
        kvGet('snapshot_latest')
      ]).then(function (arr) {
        var pdfKeys = ['rel', 'ck', 'nc', 'orig'];
        base.attachments = {};
        var omitted = [];

        pdfKeys.forEach(function (k, i) {
          var val = arr[i];
          if (!val) {
            base.attachments[k] = null;
            return;
          }
          var size = (typeof val === 'string') ? val.length : (val.size || 0);
          if (size > MAX_PDF_PAYLOAD_BYTES) {
            base.attachments[k] = null;
            omitted.push(k + '(' + Math.round(size / 1024) + 'KB)');
          } else {
            base.attachments[k] = val;
          }
        });

        if (omitted.length > 0) log('PDFs omitidos por tamanho (>3MB):', omitted.join(', '));
        base._attachmentsOmitted = omitted;
        base.snapshot_latest = arr[4] || null;
        return base;
      });
    }

    return Promise.resolve(base);
  }

  function postJSON(bodyObj) {
    var headers = { 'Content-Type': 'application/json' };
    var sharedSecret = (window.ENV && window.ENV.SYNC_SHARED_SECRET) || '';
    if (sharedSecret) headers['X-Sync-Secret'] = sharedSecret;
    var useAbort = (typeof AbortController !== 'undefined');
    var ctrl = useAbort ? new AbortController() : null;
    var timer = useAbort ? setTimeout(function () { ctrl.abort(); }, 12000) : null;
    var req = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bodyObj)
    };
    if (ctrl) req.signal = ctrl.signal;
    return fetch(getSyncEndpoint(), req).then(function (resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.text().then(function (t) {
        try { return JSON.parse(t || '{}'); } catch (e) { return { ok: true }; }
      });
    }).finally(function () {
      if (timer) clearTimeout(timer);
    });
  }

  function chunk(arr, size) {
    var out = [];
    for (var i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  function marcarOmsSincronizadas(packed) {
    try {
      var hist = JSON.parse(localStorage.getItem(getHistoricoStorageKey()) || '[]');
      var changed = false;

      packed.forEach(function (item) {
        var omNum = item && item.payload && item.payload.data && item.payload.data.om;
        if (!omNum) return;
        if (item && Array.isArray(item._attachmentsOmitted) && item._attachmentsOmitted.length) return;
        hist.forEach(function (h) {
          if (h.num === omNum && !h._pdfSynced) {
            h._pdfSynced = true;
            changed = true;
          }
        });
      });

      if (changed) localStorage.setItem(getHistoricoStorageKey(), JSON.stringify(hist));
    } catch (e) {}
  }

  function parseOmNumFromPath(name) {
    if (!name || typeof name !== 'string') return '';
    var clean = name.split('/').pop();
    var m = clean.match(/(\d{8,})\.pdf$/i);
    return m ? m[1] : '';
  }

  function getCurrentOmNum() {
    try {
      var raw = localStorage.getItem(window.STORAGE_KEY_CURRENT || 'pcm_current_om_mcr_v4');
      if (!raw) return '';
      var state = JSON.parse(raw);
      return state && state.omNum ? String(state.omNum) : '';
    } catch (e) {
      return '';
    }
  }

  function listOriginais(hdrs) {
    return fetch(getSupabaseUrl() + '/storage/v1/object/list/pcm-files', {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({
        prefix: 'originais',
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error('list originais HTTP ' + r.status + ' ' + t);
        });
      }
      return r.json();
    }).then(function (items) {
      items = Array.isArray(items) ? items : [];
      return items.map(function (item) {
        var name = item && item.name ? item.name : '';
        return {
          name: name,
          num: parseOmNumFromPath(name)
        };
      }).filter(function (item) {
        return !!item.num;
      });
    });
  }

  function fetchOmsMetaByNums(nums, hdrs) {
    nums = (nums || []).filter(Boolean);
    if (!nums.length) return Promise.resolve([]);

    var chunks = [];
    for (var i = 0; i < nums.length; i += 80) chunks.push(nums.slice(i, i + 80));

    var chain = Promise.resolve([]);
    chunks.forEach(function (piece) {
      chain = chain.then(function (acc) {
        var inFilter = '(' + piece.map(function (n) { return '"' + String(n).replace(/"/g, '') + '"'; }).join(',') + ')';
        var url = getSupabaseUrl() + '/rest/v1/oms?select=*&num=in.' + inFilter + '&order=updated_at.desc';
        return fetch(url, { headers: hdrs, cache: 'no-store' })
          .then(function (r) {
            if (!r.ok) {
              return r.text().then(function (t) {
                throw new Error('oms meta HTTP ' + r.status + ' ' + t);
              });
            }
            return r.json();
          })
          .then(function (rows) {
            return acc.concat(Array.isArray(rows) ? rows : []);
          });
      });
    });

    return chain;
  }

  function shouldKeepLocalOm(om, storageNumsSet, currentNum) {
    if (!om || !om.num) return false;
    if (om.num === currentNum) return true;
    if (om.finalizada || om.cancelada || om.pendenteAssinatura) return true;
    return storageNumsSet.has(om.num);
  }

  function purgeMissingLocals(locais, storageNumsSet) {
    var currentNum = getCurrentOmNum();
    var kept = [];
    var removed = [];

    (locais || []).forEach(function (om) {
      if (shouldKeepLocalOm(om, storageNumsSet, currentNum)) kept.push(om);
      else removed.push(om);
    });

    if (!removed.length) return Promise.resolve({ locais: kept, removed: [] });

    var cleanup = Promise.resolve();
    removed.forEach(function (om) {
      cleanup = cleanup.then(function () {
        if (window.PdfDB && typeof window.PdfDB.del === 'function') {
          return window.PdfDB.del('orig_' + om.num).catch(function () {});
        }
      });
    });

    return cleanup.then(function () {
      return { locais: kept, removed: removed };
    });
  }

  function isRowOperational(row) {
    if (!row) return false;
    if (row.cancelada || row.finalizada || row.pendente_assinatura) return false;
    if (row.status === 'cancelada' || row.status === 'finalizada' || row.status === 'pendente_assinatura') return false;
    return true;
  }

  function puxarOMs(escopoFiltro) {
    if (!isOnline() || !window.PdfDB) return Promise.resolve();
    var escopoValido = escopoFiltro === 'preventiva_usina'
      || escopoFiltro === 'preventiva_mina'
      || escopoFiltro === 'preventiva_turno'
      || escopoFiltro === 'corretiva';
    if (!escopoValido) {
      log('puxarOMs ignorado: escopo obrigatório inválido ->', escopoFiltro);
      if (window.showToast) window.showToast('Selecione um escopo específico para puxar OMs', 'warn');
      return Promise.resolve();
    }

    var SUPABASE_ANON = getSupabaseAnon();
    var token = (window.PCMAuth && window.PCMAuth.getToken && window.PCMAuth.getToken()) || SUPABASE_ANON;
    var hdrs = {
      'apikey': SUPABASE_ANON,
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    };

    log('Buscando OMs pela pasta originais. Escopo:', escopoFiltro);

    return listOriginais(hdrs)
      .then(function (arquivos) {
        var todosNums = arquivos.map(function (a) { return a.num; });

        return fetchOmsMetaByNums(todosNums, hdrs).then(function (rows) {
          var metaMap = {};
          (rows || []).forEach(function (row) {
            if (!row || !row.num || metaMap[row.num]) return;
            metaMap[row.num] = row;
          });

          var elegiveis = arquivos.filter(function (file) {
            var row = metaMap[file.num] || null;
            if (!isRowOperational(row)) return false;
            return row && row.escopo === escopoFiltro;
          }).map(function (file) {
            return metaMap[file.num];
          }).filter(Boolean);

          var eligibleNumsSet = new Set(elegiveis.map(function (row) { return row.num; }));

          return purgeMissingLocals(loadOms(), eligibleNumsSet).then(function (purged) {
            var locais = purged.locais;
            var mudou = purged.removed.length > 0;
            var removidas = purged.removed.length;

            if (!elegiveis.length) {
              if (mudou) {
                saveOms(locais);
                if (typeof window.carregarOMs === 'function') window.carregarOMs();
                else if (typeof window.filtrarOMs === 'function') window.filtrarOMs();
              }
              if (removidas > 0 && window.showToast) {
                window.showToast(removidas + ' OM(s) removida(s) da fila local', 'info');
              }
              log('Nenhuma OM elegível na pasta originais');
              return;
            }

            log('OMs elegíveis recebidas de originais:', elegiveis.length);

            var adicionadas = 0;
            var chain = Promise.resolve();

            elegiveis.forEach(function (r) {
              var idx = locais.findIndex(function (o) { return o.num === r.num; });
              var omLocal;

              if (idx < 0) {
                omLocal = buildLocalOm(r);
                locais.push(omLocal);
                adicionadas++;
                mudou = true;
              } else {
                omLocal = locais[idx];
                if (fillMissingRemoteData(omLocal, r)) mudou = true;
              }

              chain = chain.then(function () {
                return ensurePdfAndExtraction(r, omLocal, hdrs).then(function (changed) {
                  if (changed) mudou = true;
                });
              });
            });

            return chain.then(function () {
              if (mudou) {
                saveOms(locais);
                if (typeof window.carregarOMs === 'function') window.carregarOMs();
                else if (typeof window.filtrarOMs === 'function') window.filtrarOMs();
              }

              if (adicionadas > 0) {
                log(adicionadas + ' OM(s) recebida(s) da pasta originais');
                if (window.showToast) window.showToast(adicionadas + ' OM(s) recebida(s) do servidor', 'success');
              } else if (removidas > 0) {
                log(removidas + ' OM(s) removida(s) porque não estão mais elegíveis');
                if (window.showToast) window.showToast(removidas + ' OM(s) removida(s) da fila local', 'info');
              } else if (!mudou) {
                log('Nenhuma OM nova');
              }
            });
          });
        });
      })
      .catch(function (e) {
        log('puxarOMs ERRO:', e.message);
        if (window.showToast) window.showToast('⚠️ Erro ao puxar OMs: ' + e.message, 'error');
      });
  }

  function flushOMOutbox() {
    if (!isOnline()) return Promise.resolve();

    var OM_TYPES = ['om_finalizada', 'om_pendente_assinatura', 'om_cancelada_pendente'];
    var SUPABASE_ANON = getSupabaseAnon();
    var token = (window.PCMAuth && window.PCMAuth.getToken && window.PCMAuth.getToken()) || SUPABASE_ANON;
    var hdrs = {
      'apikey': SUPABASE_ANON,
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };

    return getAllOutbox().then(function (items) {
      var pending = (items || []).filter(function (item) {
        return item && item.payload && OM_TYPES.indexOf(item.payload.type) !== -1 &&
               item.payload.data && item.payload.data.om_data;
      });
      if (!pending.length) return;

      var chain = Promise.resolve();
      pending.forEach(function (item) {
        chain = chain.then(function () {
          var omData = item.payload.data.om_data;
          if (!omData || !omData.num) return;

          var patch = {
            historico_execucao:   omData.historico_execucao   || [],
            materiais_usados:     omData.materiais_usados     || [],
            hh_total:             omData.hh_total             || 0,
            materiais_total:      omData.materiais_total      || 0,
            primeiro_executante:  omData.primeiro_executante  || null,
            executantes:          omData.executantes          || [],
            finalizada:           !!omData.finalizada,
            cancelada:            !!omData.cancelada,
            pendente_assinatura:  !!omData.pendente_assinatura,
            tipo_checklist:       omData.tipo_checklist       || '',
            motivo_reprogramacao: omData.motivo_reprogramacao || '',
            data_finalizacao:     omData.data_finalizacao     || null,
            data_execucao:        omData.data_execucao        || null,
            updated_at:           new Date().toISOString()
          };

          return fetch(getSupabaseUrl() + '/rest/v1/oms?num=eq.' + encodeURIComponent(omData.num), {
            method: 'PATCH',
            headers: hdrs,
            body: JSON.stringify(patch)
          }).then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return deleteOutbox(item.id).then(function () {
              log('flushOMOutbox PATCH ok:', omData.num, item.id);
            });
          }).catch(function (e) {
            log('flushOMOutbox falhou para', omData.num, ':', e.message);
          });
        });
      });
      return chain;
    }).catch(function (e) {
      log('flushOMOutbox ERRO:', e.message);
    });
  }

  function flushDesvioOutbox() {
    if (!isOnline()) return Promise.resolve();

    var SUPABASE_ANON = getSupabaseAnon();
    var token = (window.PCMAuth && window.PCMAuth.getToken && window.PCMAuth.getToken()) || SUPABASE_ANON;
    var hdrs = {
      'apikey': SUPABASE_ANON,
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };

    return getAllOutbox().then(function (items) {
      var pending = (items || []).filter(function (item) {
        return item && item.payload && item.payload.type === 'desvio_registrado';
      });
      if (!pending.length) return;

      var chain = Promise.resolve();
      pending.forEach(function (item) {
        chain = chain.then(function () {
          var payload = item.payload.data;
          return fetch(getSupabaseUrl() + '/rest/v1/desvios', {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify(payload)
          }).then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return deleteOutbox(item.id).then(function () {
              log('desvio enviado e removido da outbox:', item.id);
            });
          }).catch(function (e) {
            log('flushDesvioOutbox falhou para', item.id, ':', e.message);
          });
        });
      });
      return chain;
    }).catch(function (e) {
      log('flushDesvioOutbox ERRO:', e.message);
    });
  }

  function syncNow() {
    if (syncing) return Promise.resolve();
    if (!isOnline()) return Promise.resolve();
    if (isDev()) return Promise.resolve();

    syncing = true;
    log('sync start');

    return getAllOutbox()
      .then(function (items) {
        items = (items || []).slice().sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
        if (items.length === 0) {
          log('outbox vazia');
          return null;
        }

        var batches = chunk(items, MAX_ITEMS_PER_BATCH);
        var chain = Promise.resolve(true);

        batches.forEach(function (batch) {
          chain = chain.then(function (okSoFar) {
            if (!okSoFar) return false;

            return Promise.all(batch.map(packItem)).then(function (packed) {
              return postJSON({ items: packed }).then(function (res) {
                var batchIds = batch.map(function (x) { return x.id; });
                var ack = (res && Array.isArray(res.ack)) ? res.ack.filter(function (id) { return batchIds.indexOf(id) !== -1; }) : batchIds;
                var ackSet = new Set(ack);
                var ackedPacked = packed.filter(function (item) { return ackSet.has(item.id); });
                if (!ackedPacked.length) {
                  log('batch sem ack confirmado');
                  return false;
                }

                return Promise.all(ack.map(function (id) {
                  return deleteOutbox(id);
                })).then(function () {
                  marcarOmsSincronizadas(ackedPacked);
                  log('batch ok, removidos:', ack.length);
                  return true;
                });
              }).catch(function (err) {
                log('falha sync:', err.message);
                return false;
              });
            });
          });
        });

        return chain;
      })
      .finally(function () {
        syncing = false;
        log('sync end');
        flushDesvioOutbox();
        flushOMOutbox();
      });
  }

  window.addEventListener('online', function () {
    syncNow();
    flushDesvioOutbox();
    flushOMOutbox();
  });

  setInterval(function () {
    if (!isOnline()) return;
    if (document.visibilityState === 'hidden') return;
    syncNow();
  }, SYNC_INTERVAL_MS);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (isOnline()) syncNow();
    });
  } else {
    if (isOnline()) syncNow();
  }

  window.PCMSync = {
    sync: syncNow,
    puxarOMs: puxarOMs,
    flushDesvios: flushDesvioOutbox,
    flushOMs: flushOMOutbox
  };
})();
