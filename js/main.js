/* MEMORY MARKET — boot, language, title, options, pause */
(function () {
  const MM = window.MM, UI = MM.UI, A = MM.Audio, E = MM.Engine;

  function screens() {
    const root = MM.$('#ui');
    root.insertAdjacentHTML('beforeend', `
      <div id="langscreen" class="screen"><div class="tt">MEMORY MARKET<span class="bn">স্মৃতি বাজার</span></div>
        <div class="tag" id="langChoose">Choose Your Language</div>
        <div class="menu" id="langmenu">
          <button class="btn primary" id="langBn">বাংলা</button>
          <button class="btn primary" id="langEn">English</button>
        </div></div>
      <div id="title" class="screen">
        <div class="tt">MEMORY MARKET<span class="bn">স্মৃতি বাজার</span></div>
        <div class="tag" id="titleTag"></div>
        <div class="menu" id="tmenu"></div>
        <div class="foot" id="titleFoot"></div>
      </div>
      <div id="pause" class="screen"><h2 id="pausedH">PAUSED</h2><p id="pausedP"></p><div class="menu" id="pmenu"></div></div>
      <div id="endscr" class="screen"></div>`);
    MM.$('#langBn').addEventListener('click', () => chooseLang('bn'));
    MM.$('#langEn').addEventListener('click', () => chooseLang('en'));
  }

  function chooseLang(lang) {
    MM.I18n.setLang(lang);
    A.init(); A.click();
    if (MM.isTouch && MM.Fullscreen) MM.Fullscreen.request();
    MM.$('#langscreen').classList.remove('on');
    MM.$('#title').classList.add('on');
    refreshStatic();
    menuMain();
  }

  function refreshStatic() {
    MM.$('#langChoose').textContent = MM.L('lang.choose');
    MM.$('#titleTag').textContent = MM.L('ui.tag');
    MM.$('#titleFoot').textContent = MM.L('ui.footer');
    MM.$('#pausedH').textContent = MM.L('ui.paused');
    MM.$('#pausedP').textContent = MM.L('ui.pausedSub');
    MM.$('#pmenu').innerHTML = `<button class="btn primary" id="presume">${UI.esc(MM.L('ui.resume'))}</button><button class="btn" id="pbug" style="font-size:14px">${UI.esc(MM.L('bug.reportBug'))}</button><button class="btn" id="pquit">${UI.esc(MM.L('ui.quitTitle'))}</button>`;
    MM.$('#presume').addEventListener('click', () => { A.click(); E.resume(); });
    MM.$('#pbug').addEventListener('click', () => { A.click(); MM.BugReport.open(); });
    MM.$('#pquit').addEventListener('click', () => MM.Game.toTitle());
    const lh = document.getElementById('lockhint'); if (lh) lh.textContent = MM.L('ui.lockHint');
  }
  MM.UI.refreshStaticText = refreshStatic;

  function menuMain() {
    const m = MM.$('#tmenu');
    const seen = Object.keys(MM.State.endingsSeen).length;
    const save = MM.State.loadSavedProgress();
    const play = save
      ? `<button class="btn primary" id="mcontinue">${UI.esc(MM.L('ui.continueChapter', { n: save.chapter }))}</button><button class="btn" id="mnew">${UI.esc(MM.L('ui.newGame'))}</button>`
      : `<button class="btn primary" id="mbegin">${UI.esc(MM.L('ui.begin'))}</button>`;
    m.style.width = '';
    m.innerHTML = play +
      `<button class="btn" id="maccount">${UI.esc(MM.L('auth.saveTitle'))}</button>` +
      `<button class="btn" id="mopt">${UI.esc(MM.L('ui.options'))}</button>` +
      `<button class="btn" id="mkeys">${UI.esc(MM.L('ui.controls'))}</button>` +
      `<button class="btn" id="mbug" style="font-size:14px">${UI.esc(MM.L('bug.reportBug'))}</button>` +
      (seen ? `<div class="found" style="color:var(--dim);font-size:14px;margin-top:6px">${UI.esc(MM.L('ui.endingsFound', { n: seen }))}</div>` : '');
    if (save) {
      MM.$('#mcontinue').addEventListener('click', () => begin(save));
      MM.$('#mnew').addEventListener('click', () => { A.init(); A.click(); menuConfirmNew(); });
    } else {
      MM.$('#mbegin').addEventListener('click', () => begin());
    }
    MM.$('#maccount').addEventListener('click', () => { A.init(); A.click(); MM.Auth.openPanel(); });
    MM.$('#mopt').addEventListener('click', () => { A.init(); A.click(); menuOpts(); });
    MM.$('#mkeys').addEventListener('click', () => { A.init(); A.click(); menuKeys(); });
    MM.$('#mbug').addEventListener('click', () => { A.init(); A.click(); MM.BugReport.open(); });
  }
  function menuConfirmNew() {
    const m = MM.$('#tmenu');
    m.innerHTML = `<div class="opts"><p style="color:var(--dim);font-size:15px;margin:0 0 14px">${UI.esc(MM.L('ui.confirmNewGame'))}</p></div><button class="btn primary" id="cnew">${UI.esc(MM.L('ui.startNewGame'))}</button><button class="btn" id="cback">${UI.esc(MM.L('ui.cancel'))}</button>`;
    MM.$('#cnew').addEventListener('click', () => { A.click(); MM.State.clearProgress(); begin(); });
    MM.$('#cback').addEventListener('click', () => { A.click(); menuMain(); });
  }
  function menuOpts() {
    const S = MM.State.settings, m = MM.$('#tmenu');
    m.style.width = '460px';
    const slider = (id, label, val) => `<label>${UI.esc(MM.L(label))} <input type="range" id="${id}" min="0" max="1" step="0.05" value="${val}"></label>`;
    m.innerHTML = `<div class="opts">
        ${slider('ovol', 'ui.volume', S.volume)}
        ${slider('omus', 'ui.musicVolume', S.musicVol)}
        ${slider('oamb', 'ui.ambienceVolume', S.ambienceVol)}
        ${slider('osfx', 'ui.sfxVolume', S.sfxVol)}
        ${slider('odlg', 'ui.dialogueVolume', S.dialogueVol)}
        <label>${UI.esc(MM.L('ui.ttsToggle'))} <input type="checkbox" id="otts" ${S.tts ? 'checked' : ''}></label>
        <label>${UI.esc(MM.L('ui.language'))}
          <select id="olang"><option value="en" ${MM.I18n.lang === 'en' ? 'selected' : ''}>English</option><option value="bn" ${MM.I18n.lang === 'bn' ? 'selected' : ''}>বাংলা</option></select>
        </label>
      </div><button class="btn" id="oback">${UI.esc(MM.L('ui.back'))}</button>`;
    MM.$('#ovol').addEventListener('input', (e) => { S.volume = +e.target.value; A.setVolume(S.volume); MM.State.save(); });
    MM.$('#omus').addEventListener('input', (e) => { S.musicVol = +e.target.value; A.setBusVolume('music', S.musicVol); MM.State.save(); });
    MM.$('#oamb').addEventListener('input', (e) => { S.ambienceVol = +e.target.value; A.setBusVolume('ambience', S.ambienceVol); MM.State.save(); });
    MM.$('#osfx').addEventListener('input', (e) => { S.sfxVol = +e.target.value; A.setBusVolume('sfx', S.sfxVol); MM.State.save(); });
    MM.$('#odlg').addEventListener('input', (e) => { S.dialogueVol = +e.target.value; A.setBusVolume('dialogue', S.dialogueVol); MM.State.save(); });
    MM.$('#otts').addEventListener('change', (e) => { S.tts = e.target.checked; A.setTTS(S.tts); MM.State.save(); A.click(); });
    MM.$('#olang').addEventListener('change', (e) => { MM.I18n.setLang(e.target.value); refreshStatic(); menuOpts(); });
    MM.$('#oback').addEventListener('click', () => { A.click(); m.style.width = ''; menuMain(); });
  }
  function menuKeys() {
    const m = MM.$('#tmenu'); m.style.width = '460px';
    let html;
    if (MM.isTouch) {
      const t = (k, v) => `<b>${UI.esc(k)}</b><span>${UI.esc(MM.Tr(v))}</span>`;
      html = `<div class="keys">${t('●', 'Left virtual joystick — move')}${t('✋', 'Drag anywhere else — look around')}${t('INTERACT', 'Tap when it lights up — interact / advance dialogue')}${t('≡', 'Evidence journal')}${t('Q', 'Memory Analyzer (once unlocked)')}${t('SPRINT', 'Hold to move faster')}</div>`;
    } else {
      const row = (k, label) => `<b>${UI.esc(MM.L('ui.keys.' + k + 'K'))}</b><span>${UI.esc(MM.L('ui.keys.' + label))}</span>`;
      html = `<div class="keys">${row('move', 'move')}${row('look', 'lookDesc')}${row('sprint', 'sprint')}${row('interact', 'interact')}${row('journal', 'journal')}${row('analyzer', 'analyzer')}${row('choice', 'choice')}<b>${UI.esc(MM.L('ui.keys.pauseK'))}</b><span>${UI.esc(MM.L('ui.keys.pauseDesc'))}</span></div>`;
    }
    m.innerHTML = html + `<button class="btn" id="kback" style="margin-top:14px">${UI.esc(MM.L('ui.back'))}</button>`;
    MM.$('#kback').addEventListener('click', () => { A.click(); m.style.width = ''; menuMain(); });
  }

  function applyAudioSettings() {
    const S = MM.State.settings;
    A.setVolume(S.volume); A.setTTS(S.tts);
    A.setBusVolume('music', S.musicVol); A.setBusVolume('ambience', S.ambienceVol);
    A.setBusVolume('sfx', S.sfxVol); A.setBusVolume('dialogue', S.dialogueVol);
  }

  async function begin(resume) {
    const t = MM.$('#title');
    A.init(); applyAudioSettings(); A.click();
    if (MM.isTouch && MM.Fullscreen) MM.Fullscreen.request();
    t.classList.remove('on');
    const O = MM.Scenes.office.get(); O.att = false;
    E.markStarted();
    MM.Game.start(resume);
  }

  function boot() {
    MM.State.load();
    UI.init(); screens();
    E.init(MM.$('#view'));

    const savedLang = MM.I18n.savedLang();
    if (savedLang) { MM.I18n.setLang(savedLang, { silent: true }); refreshStatic(); MM.$('#title').classList.add('on'); menuMain(); }
    else { MM.I18n.setLang('en', { silent: true }); refreshStatic(); MM.$('#langscreen').classList.add('on'); }

    // title backdrop: the shop at night, slowly panning
    const O = MM.Scenes.office.get(); O.att = true;
    MM.setMode('title'); E.loadScene(O, { snapFx: true }); E.fxSet({ vignette: 1.35, bloom: 1.4 }, true);
    UI.fade(0, 1800);
    window.addEventListener('pointerdown', () => { if (MM.mode === 'title') { A.init(); applyAudioSettings(); A.scene('title', 2); } }, { once: true });
    if (/[?&]qa=1/.test(location.search)) { MM.debug.begin = begin; }
  }
  window.addEventListener('DOMContentLoaded', boot);
})();
