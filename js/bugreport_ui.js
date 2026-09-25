/* MEMORY MARKET — "Report a Bug" panel. Auto-detects device/browser/OS/screen
   size/current chapter/language so the player never has to type technical
   details themselves (brief section 32). */
window.MM = window.MM || {};
(function () {
  const MM = window.MM, UI = MM.UI, A = MM.Audio;
  const GAME_VERSION = '1.4.0';

  function detectBrowser() {
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return 'Edge';
    if (/OPR\//.test(ua)) return 'Opera';
    if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
    if (/CriOS/.test(ua)) return 'Chrome (iOS)';
    if (/FxiOS/.test(ua)) return 'Firefox (iOS)';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua) && /Version\//.test(ua)) return 'Safari';
    return 'Unknown';
  }
  function detectOS() {
    const ua = navigator.userAgent, p = navigator.platform || '';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Android/.test(ua)) return 'Android';
    if (/Win/.test(p)) return 'Windows';
    if (/Mac/.test(p)) return 'macOS';
    if (/Linux/.test(p)) return 'Linux';
    return 'Unknown';
  }
  function detectDevice() {
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const os = detectOS();
    if (os === 'iOS') return /iPad/.test(navigator.userAgent) ? 'iPad' : 'iPhone';
    if (os === 'Android') return 'Android device';
    return touch ? 'Touch device' : 'Desktop / laptop';
  }

  function guestId() {
    try {
      let g = localStorage.getItem('memory_market_guest_id');
      if (!g) { g = (crypto.randomUUID ? crypto.randomUUID() : 'g-' + Math.random().toString(36).slice(2)); localStorage.setItem('memory_market_guest_id', g); }
      return g;
    } catch (e) { return null; }
  }

  MM.BugReport = {
    open() {
      A.init();
      const auto = { device: detectDevice(), browser: detectBrowser(), os: detectOS(), gameVersion: GAME_VERSION, chapter: MM.State.chapter, language: MM.I18n.lang, screenWidth: window.innerWidth, screenHeight: window.innerHeight };
      const p = UI.panel({
        title: MM.L('bug.reportBug'), closable: true, panelCls: 'narrow',
        html: `<div class="afields">
            <label class="afield">${UI.esc(MM.L('bug.whatHappened'))}<textarea id="brWhat" maxlength="4000" placeholder="${UI.esc(MM.L('bug.whatHappenedPh'))}"></textarea></label>
            <label class="afield">${UI.esc(MM.L('bug.whatDoing'))}<textarea id="brSteps" maxlength="4000" placeholder="${UI.esc(MM.L('bug.whatDoingPh'))}"></textarea></label>
            <label class="afield">${UI.esc(MM.L('bug.severity'))}
              <select id="brSev"><option value="low">${UI.esc(MM.L('bug.low'))}</option><option value="medium">${UI.esc(MM.L('bug.medium'))}</option><option value="high">${UI.esc(MM.L('bug.high'))}</option><option value="critical">${UI.esc(MM.L('bug.critical'))}</option></select>
            </label>
            <label class="afield">${UI.esc(MM.L('bug.optionalEmail'))}<input id="brEmail" type="email" maxlength="200" placeholder="${UI.esc(MM.L('bug.optionalEmailPh'))}"></label>
          </div>
          <div class="autoinfo">${UI.esc(MM.L('bug.device'))}: ${UI.esc(auto.device)} &middot; ${UI.esc(MM.L('bug.browser'))}: ${UI.esc(auto.browser)} &middot; ${UI.esc(MM.L('bug.os'))}: ${UI.esc(auto.os)}<br>
            ${UI.esc(MM.L('bug.gameVersion'))}: ${UI.esc(auto.gameVersion)} &middot; ${UI.esc(MM.L('bug.currentChapter'))}: ${auto.chapter} &middot; ${UI.esc(MM.L('bug.language'))}: ${UI.esc(auto.language)}</div>
          <div class="note err" id="brErr" style="display:none"></div>
          <div class="row"><button class="btn primary" id="brGo">${UI.esc(MM.L('bug.submit'))}</button></div>`
      });
      const err = (msg) => { const e = p.body.querySelector('#brErr'); e.textContent = msg; e.style.display = ''; };
      p.body.querySelector('#brGo').addEventListener('click', async () => {
        A.click();
        const description = p.body.querySelector('#brWhat').value.trim();
        if (!description) { err(MM.L('bug.whatHappened') + ' — ' + MM.L('bug.tooLong').replace('Please keep your description under', 'required, up to')); return; }
        const payload = Object.assign({}, auto, {
          description, steps: p.body.querySelector('#brSteps').value.trim() || undefined,
          severity: p.body.querySelector('#brSev').value,
          contactEmail: p.body.querySelector('#brEmail').value.trim() || undefined,
          guestId: guestId() // account attribution, if any, is derived server-side from the session cookie
        });
        const btn = p.body.querySelector('#brGo'); btn.disabled = true; btn.textContent = MM.L('bug.submitting');
        try {
          const res = await fetch('/api/bug-reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) { err(body.message || MM.L('bug.submitError')); btn.disabled = false; btn.textContent = MM.L('bug.submit'); return; }
          p.close(); UI.toast(MM.L('bug.submitted'), 'tool', 4000);
        } catch (e) {
          err(MM.L('bug.submitError')); btn.disabled = false; btn.textContent = MM.L('bug.submit');
        }
      });
    }
  };
})();
