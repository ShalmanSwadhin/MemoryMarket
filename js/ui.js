/* MEMORY MARKET — UI layer (DOM overlays) */
(function () {
  const MM = window.MM, $ = MM.$, el = MM.el;
  let root, hud, prompt, objBox, subBox, subWho, subTxt, subHint, choiceBox, toastBox, fadeEl, flashEl, cardEl, panelHost;
  let cur = null;               // current subtitle {id, finish}
  let advanceHandlers = [];

  const WHO_CLASS = { 'M-09': 'm09', 'RAHIM': 'rahim', 'NUSRAT': 'nusrat', 'MNEMOS': 'mnemos', 'SYSTEM': 'system', 'MEMORY': 'memory', '': 'narr' };
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  const UI = MM.UI = {
    esc,
    init() {
      root = $('#ui');
      root.innerHTML = `
        <div id="hud" class="layer">
          <div id="crosshair"><i></i></div>
          <div id="prompt"></div>
          <div id="objective"></div>
          <div id="chips"></div>
          <div id="tools"></div>
          <div id="lockhint">Click to look around</div>
        </div>
        <div id="subs" class="layer"><div class="subbox"><div class="who"></div><div class="txt"></div><div class="hint">E</div></div></div>
        <div id="choices" class="layer"></div>
        <div id="toasts" class="layer"></div>
        <div id="panels" class="layer"></div>
        <div id="card" class="layer"></div>
        <div id="flash" class="layer"></div>
        <div id="fade" class="layer"></div>`;
      hud = $('#hud'); prompt = $('#prompt'); objBox = $('#objective');
      subBox = $('#subs'); subWho = $('.who', subBox); subTxt = $('.txt', subBox); subHint = $('.hint', subBox);
      choiceBox = $('#choices'); toastBox = $('#toasts'); fadeEl = $('#fade'); flashEl = $('#flash'); cardEl = $('#card'); panelHost = $('#panels');
      fadeEl.style.opacity = 1;
      // advance dialogue on key/click
      const adv = () => { if (cur) cur.advance(); };
      window.addEventListener('keydown', (e) => { if (['KeyE', 'Space', 'Enter'].includes(e.code) && cur && !MM.UI.choosing) { adv(); } });
      window.addEventListener('mousedown', () => { if (cur && !MM.UI.choosing && MM.mode !== 'ui') adv(); });
      UI.showHUD(false);
    },

    showHUD(on) { hud.style.display = on ? '' : 'none'; },
    setCrosshair(on) { $('#crosshair').style.opacity = on ? 1 : 0; },
    prompt(text, active) {
      prompt.innerHTML = text || '';
      prompt.className = text ? 'on' + (active ? ' active' : '') : '';
      $('#crosshair').className = active ? 'hot' : '';
    },
    lockHint(on) { $('#lockhint').className = on ? 'on' : ''; },

    objective(text, sub) {
      if (!text) { objBox.className = ''; return; }
      objBox.innerHTML = `<div class="ot">Objective</div><div class="ob">${esc(text)}</div>${sub ? `<div class="os">${esc(sub)}</div>` : ''}`;
      objBox.className = 'on pulse';
      setTimeout(() => objBox.classList.remove('pulse'), 1400);
    },
    objSub(sub) { const s = $('.os', objBox); if (s) s.textContent = sub; else if (sub) objBox.insertAdjacentHTML('beforeend', `<div class="os">${esc(sub)}</div>`); },

    refreshHUD() {
      const n = MM.State.count(), c = MM.State.contradictionCount();
      let h = `<div class="chip ev" title="Tab — Evidence journal"><b>${n}</b> evidence</div>`;
      if (MM.State.chapter >= 2 && MM.State.chapter <= 3) h += `<div class="chip co"><b>${c}</b>/3 contradictions</div>`;
      $('#chips').innerHTML = h;
    },
    tools(html) { $('#tools').innerHTML = html || ''; },

    // ---------- dialogue ----------
    say(who, text, o) {
      o = o || {};
      return new Promise((res) => {
        if (cur) cur.finish(true);
        const id = Math.random();
        subBox.className = 'layer on';
        const cls = WHO_CLASS[who] !== undefined ? WHO_CLASS[who] : 'narr';
        subWho.textContent = who === 'MEMORY' ? '' : who; subWho.className = 'who w-' + cls; subBox.dataset.who = cls;
        subTxt.textContent = ''; subHint.className = 'hint';
        if (o.speak !== false) MM.Audio.speak(text, who);
        const total = text.length, speed = o.speed || (who === 'MNEMOS' ? 34 : 46);
        let i = 0, typed = false, timer = null, hold = null, done = false;
        const finish = (silent) => {
          if (done) return; done = true; clearInterval(timer); clearTimeout(hold);
          if (cur && cur.id === id) cur = null;
          if (!o.keep && !silent) { subBox.classList.remove('on'); }
          res();
        };
        const typeDone = () => {
          typed = true; clearInterval(timer); subTxt.textContent = text; subHint.className = 'hint on';
          if (!o.wait) hold = setTimeout(() => finish(false), o.hold !== undefined ? o.hold : 650 + total * 26);
        };
        timer = setInterval(() => {
          i += 1 + (speed < 30 ? 1 : 0);
          subTxt.textContent = text.slice(0, i);
          if (i % 3 === 0) MM.Audio.blip(who);
          if (i >= total) typeDone();
        }, speed);
        cur = { id, finish, advance() { if (!typed) typeDone(); else finish(false); } };
        if (o.instant) typeDone();
      });
    },
    async sayAll(lines, o) {
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        await UI.say(l[0], l[1], Object.assign({}, o, l[2] || {}, { keep: i < lines.length - 1 }));
      }
      subBox.classList.remove('on');
    },
    hideSub() { if (cur) cur.finish(false); subBox.classList.remove('on'); },

    choice(promptText, options) {
      return new Promise((res) => {
        UI.choosing = true;
        const prevMode = MM.mode; if (prevMode === 'play' || prevMode === 'cutscene') MM.setMode('ui');
        choiceBox.className = 'layer on';
        choiceBox.innerHTML = (promptText ? `<div class="cp">${esc(promptText)}</div>` : '') +
          options.map((o, i) => `<button class="opt${o.done ? ' done' : ''}${o.disabled ? ' dis' : ''}" data-i="${i}"><span class="k">${i + 1}</span><span class="l">${esc(o.label)}</span></button>`).join('');
        const finish = (i) => {
          window.removeEventListener('keydown', kd);
          choiceBox.className = 'layer'; choiceBox.innerHTML = ''; UI.choosing = false;
          MM.Audio.click();
          if (prevMode === 'play' || prevMode === 'cutscene') MM.setMode(prevMode);
          res(i);
        };
        const kd = (e) => {
          const n = parseInt(e.key, 10);
          if (n >= 1 && n <= options.length && !options[n - 1].disabled) { e.preventDefault(); finish(n - 1); }
        };
        window.addEventListener('keydown', kd);
        choiceBox.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.i; if (!options[i].disabled) finish(i); }));
      });
    },

    // ---------- toasts / cards ----------
    toast(text, kind, ms) {
      const t = el('div', 'toast ' + (kind || ''), esc(text));
      toastBox.appendChild(t);
      requestAnimationFrame(() => t.classList.add('in'));
      setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 500); }, ms || 3800);
    },
    evidenceToast(ev) {
      const t = el('div', 'toast evidence', `<div class="et">Evidence collected</div><div class="ec"><b>${esc(ev.id)}</b> ${esc(ev.title)}</div><div class="es">${esc(ev.cat)} · Tab to review</div>`);
      toastBox.appendChild(t);
      MM.Audio.evidence();
      requestAnimationFrame(() => t.classList.add('in'));
      setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 600); }, 5200);
    },
    async chapterCard(num, title, sub) {
      cardEl.innerHTML = `<div class="cc"><div class="cn">${num}</div><div class="ct">${esc(title)}</div>${sub ? `<div class="cs">${esc(sub)}</div>` : ''}</div>`;
      cardEl.className = 'layer on';
      await MM.sleep(300); cardEl.classList.add('show');
      await MM.sleep(3000); cardEl.classList.remove('show');
      await MM.sleep(700); cardEl.className = 'layer'; cardEl.innerHTML = '';
    },
    fade(to, ms) {
      fadeEl.style.transition = `opacity ${(ms || 800) / 1000}s ease`;
      fadeEl.style.opacity = to;
      return MM.sleep(ms || 800);
    },
    async flash(ms, color) {
      flashEl.style.background = color || '#fff';
      flashEl.style.transition = 'none'; flashEl.style.opacity = 1;
      await MM.sleep(60);
      flashEl.style.transition = `opacity ${(ms || 600) / 1000}s ease-out`; flashEl.style.opacity = 0;
      return MM.sleep(ms || 600);
    },

    // ---------- panels ----------
    panel(opts) {
      const p = el('div', 'panel-wrap ' + (opts.cls || ''));
      p.innerHTML = `<div class="panel ${opts.panelCls || ''}">${opts.title ? `<div class="ph"><span>${opts.title}</span>${opts.closable ? '<button class="x">Close</button>' : ''}</div>` : ''}<div class="pb">${opts.html || ''}</div></div>`;
      panelHost.appendChild(p);
      const prev = MM.mode;
      if (prev !== 'ui' && prev !== 'debate' && !opts.keepMode) MM.setMode('ui');
      requestAnimationFrame(() => p.classList.add('in'));
      const api = {
        el: p, body: $('.pb', p),
        close() {
          if (api.closed) return; api.closed = true;
          p.classList.remove('in'); setTimeout(() => p.remove(), 350);
          if (prev !== 'ui' && prev !== 'debate' && !opts.keepMode) MM.setMode(prev);
          if (opts.onClose) opts.onClose();
        }
      };
      const x = $('.x', p); if (x) x.addEventListener('click', () => { MM.Audio.click(); api.close(); });
      return api;
    },
    closeAllPanels() { panelHost.innerHTML = ''; },

    // ---------- evidence journal ----------
    journalOpen: false,
    toggleJournal() {
      if (UI.journalOpen) { UI.journal && UI.journal.close(); return; }
      if (MM.mode !== 'play') return;
      UI.journalOpen = true;
      const ids = MM.State.list();
      const cards = ids.length ? ids.map((id) => UI.cardHTML(MM.Data.EV[id])).join('') : '<div class="empty">Nothing collected yet. Investigate objects, people and terminals.</div>';
      const c = MM.State.contradictions;
      const ctr = MM.State.chapter >= 2 ? `<div class="ctr"><span class="${c.c1 ? 'y' : ''}">Timeline: death at 8:30 PM, message at 8:47 PM</span><span class="${c.c2 ? 'y' : ''}">Photograph: a person Rahim says never existed</span><span class="${c.c3 ? 'y' : ''}">Memory integrity 61%, modification detected</span></div>` : '';
      UI.journal = UI.panel({ title: 'Evidence journal — ' + ids.length + ' of 15 fragments', closable: true, cls: 'journal', html: ctr + '<div class="cards">' + cards + '</div>', onClose: () => { UI.journalOpen = false; } });
    },
    cardHTML(ev, extra) {
      return `<div class="frag ${extra || ''}" data-id="${ev.id}"><div class="fh"><span>Memory fragment #${ev.id.slice(1)}</span><span class="cat">${ev.cat}</span></div><div class="ft">${esc(ev.title)}</div><div class="fd">${esc(ev.desc)}</div><div class="fs">${esc(ev.src)}</div></div>`;
    },

    // pause / lock overlays handled by engine
    typeInto(elm, text, speed) {
      return new Promise((res) => {
        let i = 0; elm.textContent = '';
        const t = setInterval(() => { i += 2; elm.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(t); res(); } }, speed || 22);
      });
    }
  };
})();
