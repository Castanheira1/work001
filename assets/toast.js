(function () {
  'use strict';

  var container = null;
  var DURATION = 3500;

  function ensureContainer() {
    if (container) return;
    container = document.createElement('div');
    container.id = 'pcm-toast-container';
    container.style.cssText =
      'position:fixed;top:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:10px;' +
      'pointer-events:none;max-width:380px;width:calc(100% - 32px);';
    document.body.appendChild(container);
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  var ICONS = {
    success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.25)"/><path d="M6.5 12.5L10 16L17.5 8.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    error:   '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.25)"/><path d="M8 8l8 8M16 8l-8 8" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>',
    warn:    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 21h20L12 2z" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.6)" stroke-width="1"/><line x1="12" y1="9" x2="12" y2="14.5" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="17.5" r="1.3" fill="white"/></svg>',
    info:    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.25)"/><circle cx="12" cy="7.5" r="1.4" fill="white"/><line x1="12" y1="11" x2="12" y2="17" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>'
  };

  var COLORS = {
    success: 'linear-gradient(135deg, #1A5276, #2E86C1)',
    error:   'linear-gradient(135deg, #dc3545, #e8575f)',
    warn:    'linear-gradient(135deg, #e67e00, #f5a623)',
    info:    'linear-gradient(135deg, #1565c0, #2196f3)'
  };

  function show(msg, type, duration) {
    ensureContainer();
    type = type || 'info';
    duration = (typeof duration === 'number') ? duration : DURATION;

    var cleanMsg = (msg || '').replace(/^[✅⚠️❌🔄📋🔧📦✍️⏱️📷📎🚗▶️⏸️🔌📂📄💰📊🔍❗‼️]+\s*/g, '').trim();
    var lines = cleanMsg.split('\n').filter(function (l) { return l.trim(); });
    var title = escHtml(lines[0] || '');
    var body  = lines.slice(1).map(escHtml).join('<br>');

    var el = document.createElement('div');
    el.style.cssText =
      'display:flex;align-items:flex-start;gap:12px;padding:14px 18px;border-radius:14px;color:#fff;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;font-weight:600;' +
      'box-shadow:0 8px 32px rgba(0,0,0,0.22),0 2px 8px rgba(0,0,0,0.12);pointer-events:auto;cursor:pointer;' +
      'transform:translateX(120%);transition:transform .35s cubic-bezier(.22,1,.36,1),opacity .25s;' +
      'background:' + (COLORS[type] || COLORS.info) + ';backdrop-filter:blur(8px);';

    var iconDiv  = '<div style="flex-shrink:0;margin-top:1px;">' + (ICONS[type] || ICONS.info) + '</div>';
    var textDiv  = '<div style="flex:1;line-height:1.45;"><div style="font-weight:800;">' + title + '</div>' +
                   (body ? '<div style="font-weight:500;font-size:12px;opacity:.92;margin-top:4px;">' + body + '</div>' : '') +
                   '</div>';
    var closeBtn = '<div style="flex-shrink:0;opacity:.7;font-size:18px;line-height:1;margin-top:-2px;">&times;</div>';

    el.innerHTML = iconDiv + textDiv + closeBtn;
    el.onclick = function () { dismiss(el); };

    container.appendChild(el);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.transform = 'translateX(0)';
      });
    });

    var timer = setTimeout(function () { dismiss(el); }, duration);
    el._timer = timer;
  }

  function dismiss(el) {
    if (el._dismissed) return;
    el._dismissed = true;
    clearTimeout(el._timer);
    el.style.transform = 'translateX(120%)';
    el.style.opacity = '0';
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 400);
  }

  function success(msg, dur) { show(msg, 'success', dur); }
  function error(msg, dur)   { show(msg, 'error',   dur); }
  function warn(msg, dur)    { show(msg, 'warn',     dur); }
  function info(msg, dur)    { show(msg, 'info',     dur); }

  window.Toast    = { show: show, success: success, error: error, warn: warn, info: info };
  window.showToast = function (msg, type, dur) { show(msg, type, dur); };
})();