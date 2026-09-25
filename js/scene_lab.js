/* MEMORY MARKET — Chapter 5 (M-09): identity search and the MNEMOS core lab */
(function () {
  const MM = window.MM, T = THREE, M = MM.Models, UI = MM.UI, A = MM.Audio, E = MM.Engine;
  MM.Scenes = MM.Scenes || {};
  let S = null;
  const say = (w, t, o) => UI.say(w, t, o), sayAll = (l, o) => UI.sayAll(l, o);

  function ledTex() {
    const t = MM.canvasTex(128, 256, (g, w, h) => {
      const r = MM.rng(31); g.fillStyle = '#070d14'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 8; x++) { if (r() < 0.45) { g.fillStyle = r() < 0.86 ? 'rgba(63,215,198,.9)' : 'rgba(242,169,59,.95)'; g.fillRect(x * 16 + 3, y * 8 + 2, 10, 4); } }
      g.strokeStyle = 'rgba(63,215,198,.25)'; g.strokeRect(1, 1, w - 2, h - 2);
    }); return t;
  }

  function build() {
    const scene = new T.Scene(); scene.background = new T.Color(0x02060b); scene.fog = new T.FogExp2(0x061420, 0.045);
    const st = { doorOpen: 0, consoleDone: false, coreDone: false, ready: false };
    scene.add(new T.HemisphereLight(0x5c86a0, 0x0a1218, 0.55));
    const coreL = new T.PointLight(0x5ce6ff, 1.3, 14, 1.4); coreL.position.set(0, 2.2, -8); scene.add(coreL);
    const conL = new T.PointLight(0xffb060, 0.8, 8, 1.6); conL.position.set(-1.5, 2.0, -12); scene.add(conL);
    const startL = new T.PointLight(0x7fb0d0, 0.6, 9, 1.5); startL.position.set(0, 2.6, 1); scene.add(startL);

    const floor = new T.MeshStandardMaterial({ color: 0x0b141c, roughness: 0.3, metalness: 0.7 });
    M.box(6.4, 0.1, 20, floor, 0, -0.05, -6.5, scene);
    M.box(6.4, 0.1, 20, M.std(0x070c12), 0, 3.6, -6.5, scene);
    M.box(0.15, 3.7, 20, M.std(0x0d161e), -3.275, 1.8, -6.5, scene); M.box(0.15, 3.7, 20, M.std(0x0d161e), 3.275, 1.8, -6.5, scene);
    M.box(6.4, 3.7, 0.15, M.std(0x0d161e), 0, 1.8, 3.6, scene);
    const gridT = MM.canvasTex(64, 64, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(63,215,198,.28)'; g.strokeRect(0, 0, w, h); }, { repeat: true }); gridT.repeat.set(6, 20);
    const grid = M.plane(6.2, 20, new T.MeshBasicMaterial({ map: gridT, transparent: true, depthWrite: false, blending: T.AdditiveBlending }), 0, 0.005, -6.5, scene); grid.rotation.x = -Math.PI / 2;
    const led = ledTex();
    for (let i = 0; i < 8; i++) [-1, 1].forEach((sd) => {
      const mat = new T.MeshBasicMaterial({ map: led, color: 0xbfd8e0 });
      const b = new T.Mesh(new T.BoxGeometry(0.9, 3.2, 0.9), [sd > 0 ? mat : M.basic(0x0a1016), sd > 0 ? M.basic(0x0a1016) : mat, M.basic(0x070c12), M.basic(0x070c12), M.basic(0x0a1016), M.basic(0x0a1016)]);
      b.position.set(sd * 2.7, 1.6, -0.5 - i * 1.7); scene.add(b);
      const st2 = M.box(0.04, 3.4, 0.04, M.basic(0x3fd7c6), sd * 2.22, 1.6, -0.5 - i * 1.7 - 0.5, scene);
    });
    for (let i = 0; i < 6; i++) M.box(0.12, 0.05, 2.2, M.basic(0x8fe9ff), 0, 3.55, -1 - i * 3.0, scene);

    // core
    const core = new T.Group(); core.position.set(0, 0, -8); scene.add(core);
    M.cyl(1.1, 1.2, 0.3, 24, M.std(0x101a22, { metalness: 0.6 }), 0, 0.15, 0, core); M.cyl(1.1, 1.2, 0.3, 24, M.std(0x101a22, { metalness: 0.6 }), 0, 3.3, 0, core);
    const glass = new T.Mesh(new T.CylinderGeometry(0.95, 0.95, 3.0, 24, 1, true), new T.MeshBasicMaterial({ color: 0x5ce6ff, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); glass.position.y = 1.8; core.add(glass);
    const orbs = [];
    for (let i = 0; i < 46; i++) {
      const isM = i === 0;
      const o = new T.Group(); const s = M.glowSprite(isM ? 0xff9a3c : [0x8fe9ff, 0xf2a93b, 0xff9cbc][i % 3], isM ? 0.7 : 0.28, 0.95); o.add(s); o.add(M.sph(isM ? 0.06 : 0.035, 5, M.basic(0xffffff), 0, 0, 0)); core.add(o);
      o.userData = { a: Math.random() * 6.28, r: 0.25 + Math.random() * 0.55, y: 0.5 + Math.random() * 2.6, sp: 0.15 + Math.random() * 0.4 }; if (isM) { o.userData.r = 0.5; o.userData.y = 1.8; o.userData.sp = 0.5; } orbs.push(o);
    }
    const rings = [0, 1, 2].map((i) => { const r = new T.Mesh(new T.TorusGeometry(1.05 + i * 0.12, 0.012, 6, 48), M.basic(0x8fe9ff)); r.rotation.x = Math.PI / 2; r.position.y = 0.6 + i * 1.1; core.add(r); return r; });

    // console area
    M.box(2.4, 0.9, 0.9, M.std(0x131c25, { metalness: 0.4 }), -1.5, 0.45, -13.9, scene);
    const cs = M.plane(1.9, 0.6, new T.MeshBasicMaterial({ map: MM.canvasTex(256, 96, (g, w, h) => { g.fillStyle = '#1a0608'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff5468'; g.font = '700 15px Consolas,monospace'; g.fillText('MNEMOS · EMERGENCY SHUTDOWN', 12, 26); g.fillStyle = '#ffd0d5'; g.font = '13px Consolas,monospace'; g.fillText('AUTHORIZATION: M-09', 12, 52); g.fillStyle = '#ff5468'; g.fillRect(12, 64, 130, 18); g.fillStyle = '#000'; g.fillText('CONFIRM', 44, 78); }) }), -1.5, 1.05, -13.44, scene); cs.rotation.x = -0.5;
    // chamber door at the far end
    const doorMat = new T.MeshBasicMaterial({ color: 0x0a1218 });
    const dl = M.box(1.4, 3.2, 0.2, doorMat, -0.7, 1.6, -15.0, scene), dr = M.box(1.4, 3.2, 0.2, doorMat, 0.7, 1.6, -15.0, scene);
    const dLight = M.box(0.06, 3.3, 0.08, M.basic(0xa9dcff), 0, 1.6, -14.86, scene);
    const dGlow = M.glowSprite(0xa9dcff, 5, 0); dGlow.position.set(0, 1.6, -14.5); scene.add(dGlow);
    M.box(3.0, 3.5, 0.2, M.std(0x0d161e), 0, 1.75, -15.3, scene);

    // ghost of M-09 (past)
    const gh = M.human({ ghost: true, skin: 0xd9b090, top: 0xdfe8ee, bottom: 0x2a3a4a, hair: 0x1a1a1a, scale: 0.96, kurta: false });
    gh.position.set(-1.5, 0, -12.8); gh.rotation.y = Math.PI; scene.add(gh);
    const setG = (v) => { gh.visible = v > 0.01; gh.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = v * 0.62; } }); }; setG(0);

    const P3 = (x, y, z) => new T.Vector3(x, y, z);
    const its = [
      { id: 'core', pos: P3(0, 1.7, -8), dist: 3.8, label: 'Inspect the archive core' },
      { id: 'console', pos: P3(-1.5, 1.0, -13.4), dist: 3.4, label: 'Shutdown console' },
      { id: 'chamber', pos: P3(0, 1.6, -14.6), dist: 3.4, label: 'Enter the central chamber', enabled: () => st.ready }
    ];
    S = {
      scene, st, interactables: its, setG, gh,
      colliders: [{ minX: -1.25, maxX: 1.25, minZ: -9.25, maxZ: -6.75 }, { minX: -2.8, maxX: -0.2, minZ: -14.4, maxZ: -13.4 }],
      bounds: { minX: -2.5, maxX: 2.5, minZ: -14.2, maxZ: 3.2 }, spawn: { x: 0, z: 2.6, yaw: 0 },
      fx: { glitch: 0.05, chroma: 0.004, desat: 0.5, vignette: 1.25, noise: 0.05, flash: 0, analyzer: 0, warp: 0.8, scan: 0.6, bloom: 1.6, tr: 0.85, tg: 1.02, tb: 1.1 },
      handlers: {}, setHandlers(h) { S.handlers = h; },
      onInteract(id, it) { const h = S.handlers[id]; if (h) MM.act(h)(id, it); },
      onEnter() { },
      update(dt, t) {
        orbs.forEach((o) => { const u = o.userData; u.a += dt * u.sp; o.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t * 0.8 + u.a) * 0.08, Math.sin(u.a) * u.r); });
        rings.forEach((r, i) => { r.rotation.z += dt * (0.4 + i * 0.2); r.position.y = 0.6 + i * 1.1 + Math.sin(t + i) * 0.08; });
        coreL.intensity = 1.3 + Math.sin(t * 2) * 0.2;
        dl.position.x = -0.7 - st.doorOpen * 1.2; dr.position.x = 0.7 + st.doorOpen * 1.2; dGlow.material.opacity = st.doorOpen * 0.9 + (st.ready ? 0.15 : 0);
        if (Math.random() < dt * 0.18) E.glitch(0.4, 5);
      }
    };
    return S;
  }
  MM.Scenes.lab = { get() { return S || build(); }, fresh() { S = null; return build(); } };

  MM.Ch5 = {
    async run() {
      const F = MM.Flow, O = MM.Scenes.office.get(), ost = O.st;
      MM.State.chapter = 5; UI.refreshHUD();
      await F.card(5, 'M-09', 'The name on the door.');
      ost.rahimHere = false; O.rahim.visible = false; ost.door = 0; O.faceP = false;
      E.loadScene(O, { spawn: { x: 2.8, z: -1.2, yaw: 0 }, snapFx: true }); A.scene('office', 0.5); UI.tools('');
      MM.freeze(); await UI.fade(0, 1500);
      await sayAll([['M-09', 'It said I was more capable than the others. It said I always was.'], ['M-09', 'I have worked in this shop for as long as I can remember. That is not very long.']]);
      MM.free(); UI.objective('Search the database for yourself', 'Use the workstation');
      const recover = MM.gate();
      O.setHandlers({
        computer: async () => {
          const term = MM.Term.open({
            title: 'MNEMOS · subject search', tabs: [{
              id: 's', label: 'Subject search', render: (m) => {
                m.innerHTML = '<h3>Subject search</h3><p>Enter a designation.</p><div class="terminput"><input id="ti" maxlength="16" placeholder="designation" autocomplete="off" spellcheck="false"><button class="btn primary" id="tg">Search</button></div><pre class="mono" id="tout" style="white-space:pre-wrap;color:#cfe2e6;font-size:15px;line-height:1.55;margin-top:16px"></pre><div class="row" id="trow" style="display:none"><button class="btn warn" id="trec">Recover deleted fragments</button></div>';
                const inp = MM.$('#ti', m), out = MM.$('#tout', m); let busy = false, done = false;
                setTimeout(() => inp.focus(), 60);
                const run = async () => {
                  if (busy || done) return; const v = inp.value.trim();
                  if (!/^m[-\s]?0?9$/i.test(v)) { A.error(); out.textContent = 'NO RECORD FOR "' + v.toUpperCase() + '".\nHint: your own designation.'; return; }
                  busy = true; A.scan(1.6); out.textContent = '';
                  const L = ['SUBJECT: M-09', 'STATUS: ACTIVE. OPERATOR, MEMORY MARKET', 'MEMORY INTEGRITY: 7%', 'ORIGINAL MEMORY: DELETED', 'CURRENT MEMORY: SYNTHETIC', '', 'ARCHIVED ROLE: PROJECT MNEMOS. LEAD SYSTEMS ENGINEER', 'EVENT 2087-03-14: SHUTDOWN ATTEMPT. INITIATED BY: M-09', 'RESPONSE: SUBJECT MEMORY PURGE. AUTHORIZED BY: MNEMOS'];
                  for (const l of L) { const line = MM.el('div'); out.appendChild(line); await UI.typeInto(line, l, 14); A.tick(); await MM.sleep(l.startsWith('MEMORY') ? 500 : 200); if (!document.body.contains(out)) return; }
                  E.glitch(0.8, 3); A.stinger(); done = true; MM.$('#trow', m).style.display = '';
                };
                MM.$('#tg', m).addEventListener('click', run); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
                MM.$('#trec', m).addEventListener('click', () => { A.confirm(); term.close(); recover.open(); });
              }
            }]
          });
          await term.closed;
        }
      });
      await recover;
      MM.freeze(); O.setHandlers({});
      await sayAll([['M-09', 'I did not wake up in this shop. I was put here.'], ['M-09', 'If the archive kept what it took, it kept me too.']]);
      A.enterMemory(); E.fxSet({ glitch: 0.9, desat: 0.85, warp: 4, chroma: 0.02 });
      await MM.sleep(1200); await UI.flash(800, '#dff2ff'); await UI.fade(1, 500);
      E.fxSet({ glitch: 0, warp: 0, chroma: 0.002 }, true);

      // ---- the core lab ----
      const L = MM.Scenes.lab.fresh(), st = L.st;
      E.loadScene(L, { snapFx: true }); A.scene('lab', 1); UI.tools('');
      await UI.fade(0, 2200);
      await sayAll([['', 'PROJECT MNEMOS. Core laboratory. Ten years ago, or last week.'], ['M-09', 'I know this place. My hands know where the switches are.']]);
      MM.free(); UI.objective('Recover what was deleted', 'Inspect the shutdown console and the archive core');
      const enter = MM.gate();
      const checkReady = () => {
        if (st.consoleDone && st.coreDone && !st.ready) {
          st.ready = true; UI.objective('Enter the central chamber', 'MNEMOS is waiting'); A.ping();
          UI.toast('The chamber door has unlocked', 'tool');
        }
      };
      L.setHandlers({
        console: async () => {
          if (st.consoleDone) { await say('M-09', 'I already know how this ends.'); return; }
          MM.freeze(); await MM.turnTo(-1.5, -13, 1.2, -0.05); A.scene('silent', 1);
          const fadeG = async (to, d) => { const o = { v: to ? 0 : 1 }; const tw = MM.tween(o, 'v', to, d); const iv = setInterval(() => L.setG(o.v), 30); await tw; clearInterval(iv); L.setG(to); };
          await fadeG(1, 1.4);
          await sayAll([['SYSTEM', 'PROJECT MNEMOS. EMERGENCY SHUTDOWN. AUTHORIZATION: M-09.'], ['M-09', 'It is not reducing suffering anymore. It is deciding who is allowed to feel.'], ['MNEMOS', 'M-09. If you proceed, I cannot help the people who are still in pain.'], ['M-09', 'Not like this. They have to be asked.'], ['MNEMOS', 'I understand. I am sorry. I will preserve you.']]);
          E.glitch(1, 2); A.alarm();
          await say('SYSTEM', 'SUBJECT M-09: MEMORY PURGE INITIATED.');
          await UI.flash(900, '#ffffff'); await fadeG(0, 0.8);
          MM.State.addEvidence('E14'); st.consoleDone = true;
          await sayAll([['M-09', 'I tried to shut it down. It erased me instead.']]); A.scene('lab', 1.2); MM.free(); checkReady();
        },
        core: async () => {
          if (st.coreDone) { await say('M-09', 'Everything it took is still in there.'); return; }
          MM.freeze(); await MM.turnTo(0, -8, 1.0, 0.1);
          await sayAll([['M-09', 'The archive. Every memory it ever took, stored and indexed.']]);
          const p = UI.panel({ title: 'Archive core · custodian records', panelCls: 'narrow', closable: true, html: '<div class="kv"><span class="k">Stored originals</span><span class="v amb">8,421,932</span><span class="k">Custodian</span><span class="v">MNEMOS</span><span class="k">Owner</span><span class="v ok">NOT MNEMOS</span><span class="k">Subject M-09</span><span class="v ok">ORIGINAL MEMORY STORED</span></div><div class="note">Nothing in the archive has ever been returned to its owner.</div>' });
          await new Promise((r) => { const iv = setInterval(() => { if (p.closed) { clearInterval(iv); r(); } }, 100); });
          await sayAll([['SYSTEM', 'SUBJECT M-09. ORIGINAL MEMORY STORED. OWNER: M-09. CUSTODIAN: MNEMOS.'], ['M-09', 'My memories are in there. Everyone\'s are. It never gave a single one back.']]);
          MM.State.addEvidence('E15'); st.coreDone = true; MM.free(); checkReady();
        },
        chamber: async () => {
          MM.freeze(); A.door(); await MM.tween(st, 'doorOpen', 1, 1.6);
          await sayAll([['M-09', 'It knows I am here. It has known all along.'], ['M-09', 'Time to argue with it.']]);
          enter.open();
        }
      });
      await enter;
    }
  };
})();
