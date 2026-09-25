/* MEMORY MARKET — account panel: optional demo auth on top of the existing
   localStorage guest save (state.js). Guests never touch the network; an
   account additionally syncs js/state.js's chapter-boundary saves to the
   server, with the server-side conflict rule in api/progress.js deciding
   which side wins if they disagree (see api/progress.js for the rule). */
window.MM = window.MM || {};
(function () {
  const MM = window.MM, UI = MM.UI, A = MM.Audio, St = MM.State;
  const Auth = MM.Auth = { user: null };

  async function api(path, opts) {
    try {
      const res = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' }, opts));
      let body = {};
      try { body = await res.json(); } catch (e) { }
      return { ok: res.ok, status: res.status, body };
    } catch (e) {
      return { ok: false, status: 0, body: { error: 'network_error', message: MM.L('auth.errNetwork') } };
    }
  }

  Auth.checkSession = async () => {
    const r = await api('/api/me');
    Auth.user = r.ok ? r.body.user : null;
    return Auth.user;
  };

  // Uploads whatever local progress exists as the "candidate"; the server
  // keeps whichever of {candidate, what it already has for this account} is
  // further along, per api/progress.js's rule, and tells us which it kept.
  Auth.syncLocalToAccount = async () => {
    const local = St.loadSavedProgress();
    if (!local) return null;
    const r = await api('/api/progress', {
      method: 'PUT',
      body: JSON.stringify({ language: MM.I18n.lang, chapter: local.chapter, gameState: { evidence: local.evidence, contradictions: local.contradictions, flags: local.flags, topics: local.topics }, settings: St.settings })
    });
    if (!r.ok) return null;
    if (r.body.resolved === 'existing') {
      // the account's own save was further along than this device's - adopt it locally
      const p = r.body.progress;
      St.chapter = p.chapter; St.evidence = Object.assign({}, p.gameState.evidence);
      St.order = Object.keys(St.evidence).reduce((m, k) => Math.max(m, St.evidence[k]), 0);
      St.contradictions = Object.assign({ c1: false, c2: false, c3: false }, p.gameState.contradictions);
      St.flags = Object.assign({}, p.gameState.flags); St.topics = Object.assign({}, p.gameState.topics);
      St.saveProgress();
    }
    return r.body;
  };

  Auth.pushProgress = async () => {
    if (!Auth.user) return;
    const local = St.loadSavedProgress();
    if (!local) return;
    await api('/api/progress', {
      method: 'PUT',
      body: JSON.stringify({ language: MM.I18n.lang, chapter: local.chapter, gameState: { evidence: local.evidence, contradictions: local.contradictions, flags: local.flags, topics: local.topics }, settings: St.settings })
    });
  };
  // hook: every local saveProgress() also tries to push to the account, best-effort
  const origSave = St.saveProgress;
  St.saveProgress = function () { origSave.apply(St, arguments); if (Auth.user) Auth.pushProgress(); };

  function field(id, label, type, extra) {
    return `<label class="afield">${UI.esc(label)}<input id="${id}" type="${type}" ${extra || ''}></label>`;
  }

  function panelGuest() {
    const p = UI.panel({
      title: MM.L('auth.saveTitle'), closable: true, panelCls: 'narrow',
      html: `<p class="note" style="margin-bottom:14px">${UI.esc(MM.L('auth.saveSub'))}</p>
        <div class="row" style="flex-direction:column;gap:10px">
          <button class="btn primary" id="agGuest">${UI.esc(MM.L('auth.continueGuest'))}</button>
          <button class="btn" id="agCreate">${UI.esc(MM.L('auth.createAccount'))}</button>
          <button class="btn" id="agLogin" style="font-size:14px">${UI.esc(MM.L('auth.haveAccount'))}</button>
        </div>`
    });
    p.body.querySelector('#agGuest').addEventListener('click', () => { A.click(); p.close(); });
    p.body.querySelector('#agCreate').addEventListener('click', () => { A.click(); p.close(); panelCreate(); });
    p.body.querySelector('#agLogin').addEventListener('click', () => { A.click(); p.close(); panelLogin(); });
    return p;
  }

  function panelCreate() {
    const p = UI.panel({
      title: MM.L('auth.createAccountTitle'), closable: true, panelCls: 'narrow',
      html: `<div class="afields">
          ${field('acUser', MM.L('auth.username'), 'text', 'maxlength="40" autocomplete="nickname"')}
          ${field('acEmail', MM.L('auth.email'), 'email', 'maxlength="254" autocomplete="email"')}
          ${field('acPass', MM.L('auth.password'), 'password', 'maxlength="200" autocomplete="new-password"')}
        </div>
        <p class="note" style="font-size:13px;margin:8px 0 14px">${UI.esc(MM.L('auth.emailHint'))}</p>
        <div class="note err" id="acErr" style="display:none"></div>
        <div class="row" style="flex-direction:column;gap:10px">
          <button class="btn primary" id="acGo">${UI.esc(MM.L('auth.createBtn'))}</button>
          <button class="btn" id="acBack" style="font-size:14px">${UI.esc(MM.L('auth.noAccount').includes('Log') ? MM.L('auth.haveAccount') : MM.L('auth.backToGuest'))}</button>
        </div>`
    });
    const err = (msg) => { const e = p.body.querySelector('#acErr'); e.textContent = msg; e.style.display = ''; };
    p.body.querySelector('#acBack').addEventListener('click', () => { A.click(); p.close(); panelLogin(); });
    p.body.querySelector('#acGo').addEventListener('click', async () => {
      A.click();
      const username = p.body.querySelector('#acUser').value.trim();
      const email = p.body.querySelector('#acEmail').value.trim();
      const password = p.body.querySelector('#acPass').value;
      const r = await api('/api/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
      if (!r.ok) { err(r.body.message || MM.L('auth.errCreate')); return; }
      Auth.user = r.body.user;
      await Auth.syncLocalToAccount();
      p.close();
      UI.toast(MM.L('auth.accountCreated'), 'tool', 4000);
    });
    return p;
  }

  function panelLogin() {
    const p = UI.panel({
      title: MM.L('auth.loginTitle'), closable: true, panelCls: 'narrow',
      html: `<div class="afields">
          ${field('alEmail', MM.L('auth.email'), 'email', 'maxlength="254" autocomplete="email"')}
          ${field('alPass', MM.L('auth.password'), 'password', 'maxlength="200" autocomplete="current-password"')}
        </div>
        <div class="note err" id="alErr" style="display:none"></div>
        <div class="row" style="flex-direction:column;gap:10px">
          <button class="btn primary" id="alGo">${UI.esc(MM.L('auth.loginBtn'))}</button>
          <button class="btn" id="alBack" style="font-size:14px">${UI.esc(MM.L('auth.noAccount'))}</button>
        </div>`
    });
    const err = (msg) => { const e = p.body.querySelector('#alErr'); e.textContent = msg; e.style.display = ''; };
    p.body.querySelector('#alBack').addEventListener('click', () => { A.click(); p.close(); panelCreate(); });
    p.body.querySelector('#alGo').addEventListener('click', async () => {
      A.click();
      const email = p.body.querySelector('#alEmail').value.trim();
      const password = p.body.querySelector('#alPass').value;
      const r = await api('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (!r.ok) { err(r.body.message || MM.L('auth.errLogin')); return; }
      Auth.user = r.body.user;
      const merge = await Auth.syncLocalToAccount();
      p.close();
      UI.toast(merge && merge.message ? merge.message : MM.L('auth.loggedIn', { name: Auth.user.username }), 'tool', 4200);
    });
    return p;
  }

  Auth.openPanel = async () => {
    A.init();
    if (!Auth.user) await Auth.checkSession();
    if (Auth.user) {
      const p = UI.panel({
        title: MM.L('auth.loggedInAs', { name: Auth.user.username }), closable: true, panelCls: 'narrow',
        html: `<div class="row" style="flex-direction:column;gap:10px"><button class="btn" id="aoLogout">${UI.esc(MM.L('auth.logout'))}</button></div>`
      });
      p.body.querySelector('#aoLogout').addEventListener('click', async () => {
        A.click(); await api('/api/logout', { method: 'POST' }); Auth.user = null; p.close();
        UI.toast(MM.L('auth.loggedOut'), 'tool', 3000);
      });
      return;
    }
    panelGuest();
  };
})();
