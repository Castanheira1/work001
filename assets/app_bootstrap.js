(function () {
  'use strict';

  function readQueryFlag(name) {
    try {
      var s = location && location.search ? location.search : '';
      if (!s) return false;
      return new RegExp('(?:\\?|&)' + name + '=(1|true)(?:&|$)', 'i').test(s);
    } catch (e) { return false; }
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var MAX_OUTBOX_ITEMS = 500;
  var BG_SYNC_TAG = 'pcm-sync-pending';

  var DEV_MODE = (lsGet('pcm_dev_mode') === '1') || readQueryFlag('dev');

  function getCtx() {
    return {
      ts: Date.now(),
      device_id: lsGet('pcm_device_id_v4') || '',
      operador_nome: lsGet('pcm_operador_nome') || '',
      operador_role: lsGet('pcm_operador_role') || ''
    };
  }

  try {
    if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdf.worker.min.js';
    }
  } catch (e) {}

  function openDB() {
    return new Promise(function (resolve, reject) {
      if (!('indexedDB' in self)) return resolve(null);
      var req = indexedDB.open('pcm_mcr_db', 3);
      req.onupgradeneeded = function (ev) {
        var db = req.result;
        if (!db.objectStoreNames.contains('kv'))     db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('pdfs'))   db.createObjectStore('pdfs');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror   = function () {
        console.error('[BOOT] IndexedDB indisponível. Eventos offline não serão persistidos.', req.error || null);
        resolve(null);
      };
    });
  }

  function uid() { return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10); }

  var DBP = openDB();

  function kvSet(key, val) {
    return DBP.then(function (db) {
      if (!db) return;
      return new Promise(function (res, rej) {
        var tx = db.transaction(['kv'], 'readwrite');
        tx.objectStore('kv').put(val, key);
        tx.oncomplete = function () { res(); };
        tx.onerror    = function () { rej(tx.error); };
      });
    });
  }

  function outboxTrim(db) {
    return new Promise(function (res) {
      try {
        var tx = db.transaction(['outbox'], 'readonly');
        var req = tx.objectStore('outbox').getAll();
        req.onsuccess = function () {
          var items = req.result || [];
          if (items.length < MAX_OUTBOX_ITEMS) return res();
          items.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
          var removeN = items.length - MAX_OUTBOX_ITEMS + 1;
          var txDel = db.transaction(['outbox'], 'readwrite');
          var storeDel = txDel.objectStore('outbox');
          for (var i = 0; i < removeN; i++) storeDel.delete(items[i].id);
          txDel.oncomplete = function () {
            console.warn('[BOOT] Outbox atingiu limite; removidos', removeN, 'itens mais antigos.');
            res();
          };
          txDel.onerror = function () { res(); };
        };
        req.onerror = function () { res(); };
      } catch (e) { res(); }
    });
  }

  function outboxAdd(payload) {
    return DBP.then(function (db) {
      if (!db) return;
      return outboxTrim(db).then(function () {
        return new Promise(function (res, rej) {
          var tx = db.transaction(['outbox'], 'readwrite');
          tx.objectStore('outbox').put({
            id:      uid(),
            ts:      Date.now(),
            payload: payload,
            status:  'pending',
            retries: 0
          });
          tx.oncomplete = function () { res(); };
          tx.onerror    = function () { rej(tx.error); };
        });
      });
    });
  }

  function snapshotLocal() {
    try {
      var keys = [
        'pcm_oms_mcr_v4', 'pcm_current_om_mcr_v4', 'pcm_materiais_mcr_v4',
        'pcm_device_id_v4', 'pcm_historico_v4', 'pcm_operador_nome', 'pcm_operador_role'
      ];
      var data = {};
      for (var i = 0; i < keys.length; i++) data[keys[i]] = lsGet(keys[i]);
      return kvSet('snapshot_latest', JSON.stringify({ ts: Date.now(), data: data })).catch(function (err) {
        console.warn('[BOOT] Falha ao gravar snapshot local:', err && err.message ? err.message : err);
      });
    } catch (e) {}
  }

  function enqueueEvent(type, data) {
    try {
      return outboxAdd({ type: type, ts: Date.now(), ctx: getCtx(), data: data || {} }).catch(function (err) {
        console.warn('[BOOT] Falha ao enfileirar evento offline:', err && err.message ? err.message : err);
      }).then(function () {
        requestBackgroundSync();
      });
    } catch (e) {}
  }

  function requestBackgroundSync() {
    try {
      if (!('serviceWorker' in navigator)) return Promise.resolve(false);
      return navigator.serviceWorker.ready.then(function (reg) {
        if (!reg || !reg.sync || typeof reg.sync.register !== 'function') return false;
        return reg.sync.register(BG_SYNC_TAG).then(function () {
          console.log('[BOOT] Background Sync registrado:', BG_SYNC_TAG);
          return true;
        }).catch(function (err) {
          console.warn('[BOOT] Falha ao registrar Background Sync:', err && err.message ? err.message : err);
          return false;
        });
      }).catch(function () { return false; });
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function getOMMetaFromHistorico(omNum) {
    try {
      var hist = JSON.parse(lsGet('pcm_historico_v4') || '[]');
      for (var i = hist.length - 1; i >= 0; i--) {
        if (hist[i].num === omNum) return hist[i];
      }
    } catch (e) {}
    return null;
  }

  function getOMMetaFromOMs(omNum) {
    try {
      var oms = JSON.parse(lsGet('pcm_oms_mcr_v4') || '[]');
      for (var i = 0; i < oms.length; i++) {
        if (oms[i].num === omNum) return oms[i];
      }
    } catch (e) {}
    return null;
  }

  function getOMFullData(omNum) {
    var om = getOMMetaFromHistorico(omNum) || getOMMetaFromOMs(omNum);
    if (!om) return null;
    var hist = om.historicoExecucao || [];
    var mats = om.materiaisUsados || [];
    var execs = [];
    if (hist.length > 0) execs = hist[hist.length - 1].executantes || [];
    var hhTotal = 0;
    for (var h = 0; h < hist.length; h++) hhTotal += (hist[h].hhTotal || 0);
    var matTotal = 0;
    for (var m = 0; m < mats.length; m++) matTotal += (mats[m].total || 0);
    return {
      num:                         om.num,
      titulo:                      om.titulo || '',
      cc:                          om.cc || '',
      equipe:                      om.equipe || '',
      equipamento:                 om.equipamento || '',
      local_instalacao:            om.local || '',
      desc_local:                  om.descLocal || '',
      plano_cod:                   om.planoCod || '',
      escopo:                      om.escopo || 'geral',
      tipo_checklist:              om.tipoChecklist || '',
      motivo_reprogramacao:        om.motivoReprogramacao || '',
      primeiro_executante:         om.primeiroExecutante || (execs[0] || null),
      executantes:                 execs,
      historico_execucao:          hist,
      materiais_usados:            mats,
      hh_total:                    hhTotal,
      materiais_total:             matTotal,
      finalizada:                  !!om.finalizada,
      cancelada:                   !!om.cancelada,
      pendente_assinatura:         !!om.pendenteAssinatura,
      data_finalizacao:            om.dataFinalizacao || null,
      data_execucao:               om.dataFinalizacao || null,
      data_inicio_prevista:        om.data_inicio_prevista || null,
      data_fim_prevista:           om.data_fim_prevista || null,
      desvio:                      om.desvio || '',
      justificativa_cancelamento:  om.justificativaCancelamento || ''
    };
  }

  function registerSW() {
    try {
      if (location.protocol === 'file:') return;
      if (!('serviceWorker' in navigator)) return;
      navigator.serviceWorker.register('./service-worker.js').then(function (reg) {
        console.log('[BOOT] SW registrado', reg.scope);
        requestBackgroundSync();
      }).catch(function (e) {
        console.error('[BOOT] SW falhou', e);
      });
      navigator.serviceWorker.addEventListener('message', function (e) {
        if (e.data && e.data.type === 'SW_UPDATED') {
          location.reload();
          return;
        }
        if (e.data && e.data.type === 'SW_SYNC_NOW') {
          try {
            if (window.PCMSync && typeof window.PCMSync.sync === 'function') window.PCMSync.sync();
            if (window.PCMSync && typeof window.PCMSync.flushDesvios === 'function') window.PCMSync.flushDesvios();
            if (window.PCMSync && typeof window.PCMSync.flushOMs === 'function') window.PCMSync.flushOMs();
          } catch (err) {
            console.warn('[BOOT] Falha ao executar sync disparado pelo SW:', err && err.message ? err.message : err);
          }
        }
      });
      window.addEventListener('online', function () {
        requestBackgroundSync();
      });
    } catch (e) {}
  }

  function clearDevStorage() {
    try { indexedDB.deleteDatabase('pcm_mcr_db'); } catch (e) {}
  }

  window.PCMOffline = {
    dev: function () { return DEV_MODE; },
    snapshot: snapshotLocal,
    enqueue: enqueueEvent,
    _db: DBP,
    clearDev: clearDevStorage
  };

  function wrap(name, afterFn) {
    try {
      var orig = window[name];
      if (typeof orig !== 'function') return;
      window[name] = function () {
        var beforeNum = null, beforeIsCancel = false;
        try {
          if (typeof currentOM !== 'undefined' && currentOM && currentOM.num) {
            beforeNum = currentOM.num;
          }
          if (typeof isCancelamento !== 'undefined') beforeIsCancel = !!isCancelamento;
        } catch (e) {}

        var r;
        try { r = orig.apply(this, arguments); } catch (e) { throw e; }

        Promise.resolve(r).then(function () {
          if (DEV_MODE) return;
          snapshotLocal();
          if (typeof afterFn === 'function' && beforeNum) {
            try { afterFn(beforeNum, beforeIsCancel); } catch (e) {}
          }
        }).catch(function () {
          if (!DEV_MODE) snapshotLocal();
        });

        return r;
      };
    } catch (e) {}
  }

  function applyWraps() {
    wrap('salvarOMs');
    wrap('salvarOMAtual');
    wrap('salvarExecutantes');
    wrap('salvarMateriais');

    wrap('salvarComAssinatura', function (omNum, wasCancel) {
      if (!omNum) return;
      var omData = getOMFullData(omNum);
      enqueueEvent('om_finalizada', {
        om: omNum,
        meta: omData || { num: omNum },
        om_data: omData,
        cancelamento: wasCancel,
        pdf_refs: {
          rel:  'rel_'  + omNum,
          ck:   'ck_'   + omNum,
          nc:   'nc_'   + omNum,
          orig: 'orig_' + omNum
        }
      });
    });

    wrap('finalizarSemAssinatura', function (omNum, wasCancel) {
      if (!omNum) return;
      var omData = getOMFullData(omNum);
      enqueueEvent('om_pendente_assinatura', {
        om: omNum,
        meta: omData || { num: omNum },
        om_data: omData,
        cancelamento: wasCancel
      });
    });

    wrap('confirmarCancelamento', function (omNum) {
      if (!omNum) return;
      var omData = getOMFullData(omNum);
      enqueueEvent('om_cancelada_pendente', {
        om: omNum,
        meta: omData || { num: omNum },
        om_data: omData
      });
    });
  }

  function boot() {
    if (DEV_MODE) { clearDevStorage(); return; }
    registerSW();
    snapshotLocal();
    if (window.PCMSync && typeof window.PCMSync.sync === 'function') {
      window.PCMSync.sync();
    }
  }

  window.addEventListener('load', function () {
    applyWraps();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
