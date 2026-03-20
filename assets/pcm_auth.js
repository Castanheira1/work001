(function () {
  'use strict';

  // Credenciais do Supabase - obtidas de window.ENV
  var SUPABASE_URL  = (window.ENV && window.ENV.SUPABASE_URL) || window.SUPABASE_URL || '';
  var SUPABASE_ANON = (window.ENV && window.ENV.SUPABASE_ANON_KEY) || window.SUPABASE_ANON_KEY || '';


  var SESSION_KEY = 'pcm_auth_session';
  var session = null;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function saveSession(s) {
    session = s;
    if (s) lsSet(SESSION_KEY, JSON.stringify(s));
    else lsDel(SESSION_KEY);
  }

  function loadSession() {
    try {
      var raw = lsGet(SESSION_KEY);
      if (!raw) return null;
      session = JSON.parse(raw);
      return session;
    } catch (e) { return null; }
  }

  function getToken() {
    return session && session.access_token ? session.access_token : null;
  }

  function getHeaders() {
    var token = getToken();
    return {
      'apikey': SUPABASE_ANON,
      'Authorization': 'Bearer ' + (token || SUPABASE_ANON),
      'Content-Type': 'application/json'
    };
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function getUsername() {
    if (session && session.username) return session.username;
    if (session && session.user && session.user.email) {
      return session.user.email.split('@')[0];
    }
    return '';
  }

  function login(user, pass) {
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      return Promise.reject(new Error('Credenciais Supabase não configuradas. Contate o administrador.'));
    }
    var email = user.indexOf('@') === -1 ? user + '@soberano.local' : user;
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: pass })
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (err) { throw new Error(err.error_description || err.msg || 'Login falhou'); });
      return r.json();
    }).then(function (data) {
      var sess = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at || (Math.floor(Date.now() / 1000) + (data.expires_in || 3600)),
        user: data.user,
        username: data.user && data.user.email ? data.user.email.split('@')[0] : user
      };
      saveSession(sess);
      lsSet('pcm_operador_nome', sess.username);
      return sess;
    });
  }

  function fetchRole(sess) {
    return fetch(SUPABASE_URL + '/rest/v1/profiles?select=role&user_id=eq.' + sess.user.id, {
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + sess.access_token
      }
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error('Falha ao carregar perfil (' + r.status + '): ' + (t || 'resposta vazia'));
        });
      }
      return r.json();
    }).then(function (rows) {
      if (!Array.isArray(rows)) throw new Error('Payload de perfil inválido');
      return rows && rows[0] && rows[0].role ? rows[0].role : 'mecanico';
    });
  }

  function refresh() {
    if (!session || !session.refresh_token) return Promise.reject(new Error('Sem sessão'));
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    }).then(function (r) {
      if (!r.ok) throw new Error('Refresh falhou');
      return r.json();
    }).then(function (data) {
      session.access_token = data.access_token;
      session.refresh_token = data.refresh_token;
      session.expires_at = data.expires_at || (Math.floor(Date.now() / 1000) + (data.expires_in || 3600));
      saveSession(session);
      return session;
    });
  }

  function ensureValidToken() {
    if (!session) return Promise.reject(new Error('Sem sessão'));
    var now = Math.floor(Date.now() / 1000);
    if (now < (session.expires_at || 0) - 120) return Promise.resolve(session);
    return refresh().catch(function () {
      saveSession(null);
      showLoginScreen();
      return Promise.reject(new Error('Sessão expirada'));
    });
  }

  function logout() {
    saveSession(null);
    lsDel('pcm_operador_nome');
    showLoginScreen();
  }

  function createLoginScreen() {
    if (document.getElementById('pcm-login-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'pcm-login-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:99998;background:linear-gradient(160deg,#1A5276 0%,#154360 60%,#0E3D5B 100%);' +
      'display:flex;align-items:center;justify-content:center;padding:16px;';

    overlay.innerHTML =
      '<div style="background:#fff;border-radius:18px;padding:40px 32px;width:100%;max-width:380px;box-shadow:0 30px 80px rgba(0,0,0,.35)">' +
        '<div style="text-align:center;margin-bottom:6px;">' +
          '<div style="font-size:22px;font-weight:900;letter-spacing:3px;color:#1A5276;">DOMO DE FERRO</div>' +
        '</div>' +
        '<div style="text-align:center;font-size:14px;font-weight:700;color:#666;margin-bottom:4px;">Sistema MCR</div>' +
        '<div style="text-align:center;font-size:11px;color:#888;margin-bottom:24px;text-transform:uppercase;letter-spacing:1px;">Identificação do Operador</div>' +
        '<input type="text" id="pcm-login-user" placeholder="Usuário (ex: equipe1)" autocomplete="username" ' +
          'style="width:100%;padding:14px 16px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;font-family:inherit;margin-bottom:10px;outline:none;box-sizing:border-box;">' +
        '<input type="password" id="pcm-login-pass" placeholder="Senha" autocomplete="current-password" ' +
          'style="width:100%;padding:14px 16px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;font-family:inherit;margin-bottom:14px;outline:none;box-sizing:border-box;">' +
        '<button id="pcm-login-btn" ' +
          'style="width:100%;padding:14px;background:linear-gradient(135deg,#1A5276,#154360);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit;letter-spacing:1px;">' +
          'ENTRAR</button>' +
        '<div id="pcm-login-err" style="display:none;margin-top:10px;padding:10px;border-radius:10px;background:#fde8ea;color:#dc3545;font-weight:700;font-size:12px;text-align:center;"></div>' +
      '</div>';

    document.body.appendChild(overlay);

    var btn       = document.getElementById('pcm-login-btn');
    var userInput = document.getElementById('pcm-login-user');
    var passInput = document.getElementById('pcm-login-pass');
    var errDiv    = document.getElementById('pcm-login-err');

    function doLogin() {
      var u = userInput.value.trim();
      var p = passInput.value;
      if (!u || !p) { errDiv.textContent = 'Informe usuário e senha.'; errDiv.style.display = 'block'; return; }
      btn.disabled = true; btn.textContent = 'Entrando...'; errDiv.style.display = 'none';
      login(u, p).then(function (sess) {
        return fetchRole(sess).then(function (role) {
          lsSet('pcm_operador_role', role);
          if (role === 'admin') {
            window.location.href = 'admin_soberano.html';
          } else if (role === 'fiscal') {
            window.location.href = 'fiscal_soberano.html';
          } else {
            hideLoginScreen();
          }
        });
      }).catch(function (err) {
        errDiv.textContent = err.message || 'Usuário ou senha inválidos.';
        errDiv.style.display = 'block';
        btn.disabled = false; btn.textContent = 'ENTRAR';
      });
    }

    btn.addEventListener('click', doLogin);
    passInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
    userInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') passInput.focus(); });
  }

  function resetLoginScreenState() {
    var btn = document.getElementById('pcm-login-btn');
    var userInput = document.getElementById('pcm-login-user');
    var passInput = document.getElementById('pcm-login-pass');
    var errDiv = document.getElementById('pcm-login-err');
    if (btn) { btn.disabled = false; btn.textContent = 'ENTRAR'; }
    if (errDiv) { errDiv.textContent = ''; errDiv.style.display = 'none'; }
    if (userInput && !isLoggedIn()) userInput.value = '';
    if (passInput) passInput.value = '';
  }

  function showLoginScreen() {
    createLoginScreen();
    resetLoginScreenState();
    var el = document.getElementById('pcm-login-overlay');
    if (el) el.style.display = 'flex';
  }

  function hideLoginScreen() {
    var el = document.getElementById('pcm-login-overlay');
    if (el) el.style.display = 'none';
  }

  function boot() {
    loadSession();
    if (!isLoggedIn()) {
      showLoginScreen();
    } else {
      ensureValidToken().then(function (sess) {
        return fetchRole(sess).then(function (role) {
          lsSet('pcm_operador_role', role);
          var currentPage = window.location.pathname.split('/').pop();
          if (role === 'admin' && currentPage !== 'admin_soberano.html') {
            window.location.href = 'admin_soberano.html';
          } else if (role === 'fiscal' && currentPage !== 'fiscal_soberano.html') {
            window.location.href = 'fiscal_soberano.html';
          }
        });
      }).catch(function () {});
    }
    setInterval(function () {
      if (isLoggedIn()) ensureValidToken().catch(function () {});
    }, 5 * 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.PCMAuth = {
    login: login,
    logout: logout,
    isLoggedIn: isLoggedIn,
    getToken: getToken,
    getHeaders: getHeaders,
    getUsername: getUsername,
    ensureToken: ensureValidToken
  };
})();