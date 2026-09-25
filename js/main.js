/* MEMORY MARKET — boot, title, options, pause */
(function () {
  const MM = window.MM, UI = MM.UI, A = MM.Audio, E = MM.Engine;

  function screens() {
    const root = MM.$('#ui');
    root.insertAdjacentHTML('beforeend', `
      <div id="title" class="screen on">
        <div class="tt">MEMORY MARKET<span class="bn">স্মৃতি বাজার</span></div>
        <div class="tag">Every memory has a price. Forgetting costs more.</div>
        <div class="menu" id="tmenu"></div>
        <div class="foot">GameJamPlus Bangladesh 2026/27 · 12–20 minutes · headphones recommended</div>
      </div>
      <div id="pause" class="screen"><h2>PAUSED</h2><p>Your pointer was released.</p><div class="menu"><button class="btn primary" id="presume">Resume</button><button class="btn" id="pquit">Quit to title</button></div></div>
      <div id="endscr" class="screen"></div>`);
  }

  function menuMain() {
    const m = MM.$('#tmenu');
    const seen = Object.keys(MM.State.endingsSeen).length;
    m.innerHTML = `<button class="btn primary" id="mbegin">Begin</button><button class="btn" id="mopt">Options</button><button class="btn" id="mkeys">Controls</button>` + (seen ? `<div class="found" style="color:var(--dim);font-size:14px;margin-top:6px">Endings found: ${seen} of 4</div>` : '');
    MM.$('#mbegin').addEventListener('click', begin);
    MM.$('#mopt').addEventListener('click', () => { A.init(); A.click(); menuOpts(); });
    MM.$('#mkeys').addEventListener('click', () => { A.init(); A.click(); menuKeys(); });
  }
  function menuOpts() {
    const S = MM.State.settings, m = MM.$('#tmenu');
    m.style.width = '440px';
    m.innerHTML = `<div class="opts"><label>Master volume <input type="range" id="ovol" min="0" max="1" step="0.05" value="${S.volume}"></label><label>MNEMOS spoken voice <input type="checkbox" id="otts" ${S.tts ? 'checked' : ''}></label></div><button class="btn" id="oback">Back</button>`;
    MM.$('#ovol').addEventListener('input', (e) => { S.volume = +e.target.value; A.setVolume(S.volume); MM.State.save(); });
    MM.$('#otts').addEventListener('change', (e) => { S.tts = e.target.checked; A.setTTS(S.tts); MM.State.save(); A.click(); });
    MM.$('#oback').addEventListener('click', () => { A.click(); m.style.width = ''; menuMain(); });
  }
  function menuKeys() {
    const m = MM.$('#tmenu'); m.style.width = '460px';
    m.innerHTML = `<div class="keys"><b>W A S D</b><span>Move</span><b>Mouse</b><span>Look (click the view to capture the pointer; drag also works)</span><b>Shift</b><span>Walk faster</span><b>E</b><span>Interact / advance dialogue</span><b>Tab</b><span>Evidence journal</span><b>Q</b><span>Memory Analyzer (once unlocked)</span><b>1 – 4</b><span>Choose a dialogue option</span><b>Esc</b><span>Release the pointer / pause</span></div><button class="btn" id="kback" style="margin-top:14px">Back</button>`;
    MM.$('#kback').addEventListener('click', () => { A.click(); m.style.width = ''; menuMain(); });
  }

  async function begin() {
    const t = MM.$('#title');
    A.init(); A.setVolume(MM.State.settings.volume); A.setTTS(MM.State.settings.tts); A.click();
    t.classList.remove('on');
    const O = MM.Scenes.office.get(); O.att = false;
    E.markStarted();
    MM.Game.start();
  }

  function boot() {
    MM.State.load();
    UI.init(); screens();
    E.init(MM.$('#view'));
    MM.$('#presume').addEventListener('click', () => { A.click(); E.resume(); });
    MM.$('#pquit').addEventListener('click', () => MM.Game.toTitle());
    menuMain();
    // title backdrop: the shop at night, slowly panning
    const O = MM.Scenes.office.get(); O.att = true;
    MM.setMode('title'); E.loadScene(O, { snapFx: true }); E.fxSet({ vignette: 1.35, bloom: 1.4 }, true);
    UI.fade(0, 1800);
    window.addEventListener('pointerdown', () => { if (MM.mode === 'title') { A.init(); A.setVolume(MM.State.settings.volume); A.scene('title', 2); } }, { once: true });
    if (/[?&]qa=1/.test(location.search)) { MM.debug.begin = begin; }
  }
  window.addEventListener('DOMContentLoaded', boot);
})();
