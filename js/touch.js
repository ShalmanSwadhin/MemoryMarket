/* MEMORY MARKET — mobile touch controls: a virtual joystick for movement,
   drag-anywhere-else for camera look, and a context-sensitive interact
   button, all built specifically for touch (not just a shrunk desktop UI).
   Inert entirely on non-touch devices. */
window.MM = window.MM || {};
(function () {
  const MM = window.MM;
  if (!MM.isTouch) return;

  let root, stickBase, stickKnob, interactBtn, sprintBtn, analyzerBtn, journalBtn, fsBtn;
  let moveTouchId = null, lookTouchId = null, lookLast = null;
  const BASE_R = 52;

  // ---------- fullscreen (Fullscreen API, cross-vendor) ----------
  const fsEl = () => document.documentElement;
  const F = MM.Fullscreen = {
    isSupported() { return !!(fsEl().requestFullscreen || fsEl().webkitRequestFullscreen); },
    isActive() { return !!(document.fullscreenElement || document.webkitFullscreenElement); },
    async request() {
      try {
        if (fsEl().requestFullscreen) await fsEl().requestFullscreen();
        else if (fsEl().webkitRequestFullscreen) fsEl().webkitRequestFullscreen();
      } catch (e) { /* denied, or unsupported (older iOS Safari) - fine, the rotate overlay is the real fallback */ }
      try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) { /* iOS Safari never supports this - expected */ }
    },
    exit() {
      try { if (document.exitFullscreen) document.exitFullscreen(); else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); } catch (e) { }
    },
    toggle() { if (F.isActive()) F.exit(); else F.request(); }
  };

  function build() {
    root = MM.el('div'); root.id = 'touchpad';
    root.innerHTML = `
      <div id="tp-stick"><div id="tp-knob"></div></div>
      <div id="tp-actions">
        <button id="tp-fs" class="tpbtn small" title="Fullscreen"><i class="fsicon"></i></button>
        <button id="tp-sprint" class="tpbtn">SPRINT</button>
        <button id="tp-analyzer" class="tpbtn">Q</button>
        <button id="tp-journal" class="tpbtn">≡</button>
      </div>
      <button id="tp-interact" class="tpbtn big">INTERACT</button>`;
    document.body.appendChild(root);
    stickBase = MM.$('#tp-stick', root); stickKnob = MM.$('#tp-knob', root);
    interactBtn = MM.$('#tp-interact', root); sprintBtn = MM.$('#tp-sprint', root);
    analyzerBtn = MM.$('#tp-analyzer', root); journalBtn = MM.$('#tp-journal', root);
    fsBtn = MM.$('#tp-fs', root);
    if (!F.isSupported()) fsBtn.style.display = 'none';

    stickBase.addEventListener('touchstart', onStickStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: true }); // passive: nothing here needs preventDefault (touch-action:none in the CSS already stops page scroll/zoom), and a non-passive listener makes the browser wait on this handler before every swipe frame
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    interactBtn.addEventListener('touchstart', (e) => { e.preventDefault(); MM.Audio.click(); if (MM.Engine.target) MM.Engine.use(MM.Engine.target); }, { passive: false });
    sprintBtn.addEventListener('touchstart', (e) => { e.preventDefault(); MM.TouchInput.sprint = true; sprintBtn.classList.add('on'); });
    sprintBtn.addEventListener('touchend', () => { MM.TouchInput.sprint = false; sprintBtn.classList.remove('on'); });
    analyzerBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (MM.mode === 'play' && !MM.paused) MM.emit('analyzer'); });
    journalBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (MM.mode === 'play' || MM.UI.journalOpen) MM.UI.toggleJournal(); });
    fsBtn.addEventListener('touchstart', (e) => { e.preventDefault(); MM.Audio.click(); F.toggle(); });
    document.addEventListener('fullscreenchange', () => fsBtn.classList.toggle('on', F.isActive()));
    document.addEventListener('webkitfullscreenchange', () => fsBtn.classList.toggle('on', F.isActive()));

    // advance dialogue / choose panel items already work via click listeners
    // elsewhere in the UI (pointerdown/click), which touch already synthesizes.
  }

  // Held upright, the page is drawn rotated 90deg by CSS (see "always-landscape"
  // in css/style.css), so screen-space touch deltas must be mapped into the
  // rotated layout's axes: its +x is screen-down, its +y is screen-left.
  const forced = () => window.matchMedia('(orientation: portrait)').matches;
  const toLocal = (sx, sy) => (forced() ? { x: sy, y: -sx } : { x: sx, y: sy });

  function stickCenter() { const r = stickBase.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  function onStickStart(e) {
    e.preventDefault();
    if (moveTouchId !== null) return;
    const t = e.changedTouches[0]; moveTouchId = t.identifier;
    updateStick(t);
  }
  function updateStick(t) {
    const c = stickCenter();
    let sdx = t.clientX - c.x, sdy = t.clientY - c.y;
    const d = Math.hypot(sdx, sdy);
    if (d > BASE_R) { sdx = sdx / d * BASE_R; sdy = sdy / d * BASE_R; }
    const { x: dx, y: dy } = toLocal(sdx, sdy);
    stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    MM.TouchInput.x = MM.clamp(dx / BASE_R, -1, 1);
    MM.TouchInput.y = MM.clamp(dy / BASE_R, -1, 1);
    MM.TouchInput.active = true;
  }
  function resetStick() {
    moveTouchId = null; MM.TouchInput.active = false; MM.TouchInput.x = 0; MM.TouchInput.y = 0;
    stickKnob.style.transform = 'translate(0,0)';
  }

  function inLookZone(target) {
    return !!target.closest && !target.closest('#touchpad') && !target.closest('.layer.on') && !target.closest('#panels') && !target.closest('#choices.on') && !target.closest('#mnemos.on') && !target.closest('#debate.on');
  }

  function onTouchMove(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === moveTouchId) updateStick(t);
      else if (t.identifier === lookTouchId && lookLast) {
        const d = toLocal(t.clientX - lookLast.x, t.clientY - lookLast.y);
        MM.Engine.lookDelta(d.x, d.y);
        lookLast = { x: t.clientX, y: t.clientY };
      }
    }
  }
  function onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === moveTouchId) resetStick();
      if (t.identifier === lookTouchId) { lookTouchId = null; lookLast = null; }
    }
  }

  // Look-drag: any touch that starts outside the joystick/buttons/open UI.
  // Bound on the view canvas itself (added once E.init() has created it).
  MM.on('mode', () => { /* no-op hook point; controls visibility handled below */ });

  function bindLook() {
    const canvas = MM.$('#view');
    canvas.addEventListener('touchstart', (e) => {
      if (MM.mode !== 'play' || MM.paused) return;
      for (const t of e.changedTouches) {
        if (t.identifier === moveTouchId) continue;
        if (lookTouchId === null && inLookZone(t.target)) { lookTouchId = t.identifier; lookLast = { x: t.clientX, y: t.clientY }; }
      }
    }, { passive: true });
  }

  function updateVisibility() {
    const show = MM.mode === 'play' && !MM.paused;
    root.classList.toggle('on', show);
    const canInteract = show && !!MM.Engine.target;
    interactBtn.classList.toggle('ready', canInteract);
  }

  function loop() { if (root) updateVisibility(); requestAnimationFrame(loop); }

  window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('touch');
    build();
    bindLook();
    // Fullscreen needs a real user gesture: ask on the very first tap so it
    // applies from the language screen on, and returning players (who skip
    // that screen) are covered too. The button in the controls toggles it.
    window.addEventListener('touchend', () => F.request(), { once: true });
    requestAnimationFrame(loop);
  });
})();
