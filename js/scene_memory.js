/* MEMORY MARKET — scene: Rahim's apartment memory (Chapters 2 & 3) */
(function () {
  const MM = window.MM, T = THREE, M = MM.Models, UI = MM.UI, E = MM.Engine, A = MM.Audio, St = MM.State;
  MM.Scenes = MM.Scenes || {};
  let S = null;
  MM.Scenes.memory = { get() { return S || (S = build()); }, fresh() { S = build(); return S; } };
  const mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9, metalness: 0.02, flatShading: true }, o || {}));
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

  function drawPhoto(g, w, h, t, strong) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6b5940'); gr.addColorStop(1, '#2c2219'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(160,60,50,.35)'; g.fillRect(0, 0, w * 0.12, h); g.fillRect(w * 0.88, 0, w * 0.12, h);       // curtains
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, h * 0.86, w, h * 0.14);
    const person = (x, by, hh, body, head, a) => {
      g.globalAlpha = a; g.fillStyle = body; g.beginPath(); g.moveTo(x - hh * 0.22, by); g.lineTo(x - hh * 0.16, by - hh * 0.62); g.lineTo(x + hh * 0.16, by - hh * 0.62); g.lineTo(x + hh * 0.22, by); g.closePath(); g.fill();
      g.fillStyle = head; g.beginPath(); g.arc(x, by - hh * 0.76, hh * 0.13, 0, 6.28); g.fill(); g.globalAlpha = 1;
    };
    person(w * 0.24, h * 0.9, h * 0.66, '#cfc8b4', '#a87a58', 1);
    person(w * 0.42, h * 0.9, h * 0.42, '#ff9cbc', '#c99a80', 1);
    person(w * 0.60, h * 0.9, h * 0.62, '#a8324a', '#b58a6a', 1);
    // the fourth person
    const fl = strong ? (0.7 + 0.3 * Math.sin(t * 5)) : (Math.sin(t * 3) > -0.2 ? 0.75 : 0.15);
    person(w * 0.80, h * 0.9, h * 0.64, '#7fb5c9', '#c9a88a', fl);
    g.globalAlpha = fl; const bl = g.createRadialGradient(w * 0.8, h * 0.9 - h * 0.64 * 0.76, 0, w * 0.8, h * 0.9 - h * 0.64 * 0.76, h * 0.12);
    bl.addColorStop(0, 'rgba(255,255,255,.95)'); bl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = bl; g.beginPath(); g.arc(w * 0.8, h * 0.9 - h * 0.64 * 0.76, h * 0.12, 0, 6.28); g.fill(); g.globalAlpha = 1;
    if (strong || Math.sin(t * 3) < -0.2) { g.strokeStyle = 'rgba(63,215,198,.6)'; g.lineWidth = 2; g.strokeRect(w * 0.7, h * 0.08, w * 0.22, h * 0.84); }
    g.fillStyle = 'rgba(255,240,210,.06)'; for (let i = 0; i < 40; i++) g.fillRect(Math.random() * w, Math.random() * h, 1, 3);
    g.strokeStyle = '#e9dfc8'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  }

  function build() {
    const P = MM.Player;
    const scene = new T.Scene(); scene.background = new T.Color(0x0a0d16); scene.fog = new T.FogExp2(0x151b2c, 0.02);
    M.buildSky(scene);
    const city = M.buildCity(scene, { z0: -24, rows: 4, width: 150, seed: 23 });
    const rain = M.buildRain(scene, { x0: -16, x1: 16, y0: -3, y1: 12, z0: -18, z1: -5.5 }, 900, 0xb0c4ff);
    scene.add(new T.HemisphereLight(0xa8b4c8, 0x4a3a2a, 0.75));
    const lamp = new T.PointLight(0xffb46a, 1.3, 10, 1.4); lamp.position.set(-1.4, 1.7, -0.2); scene.add(lamp);
    const bal = new T.PointLight(0x6f8cff, 0.85, 10, 1.4); bal.position.set(0, 2.3, -4.0); scene.add(bal);
    const hallL = new T.PointLight(0xffd9a0, 0.4, 6, 1.6); hallL.position.set(2.6, 2.3, 1.6); scene.add(hallL);

    // ---------- shell ----------
    const plaster = MM.canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#7d9a8a'; g.fillRect(0, 0, w, h); const r = MM.rng(4);
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '40,60,50' : '190,210,190'},${0.05 + r() * 0.08})`; g.beginPath(); g.arc(r() * w, r() * h, 6 + r() * 30, 0, 6.28); g.fill(); }
      g.fillStyle = 'rgba(30,40,35,.35)'; g.fillRect(0, h * 0.72, w, h * 0.28);   // dado
    }, { repeat: true }); plaster.repeat.set(3, 1);
    const wallM = new T.MeshStandardMaterial({ map: plaster, roughness: 1, flatShading: true });
    const floorTex = MM.canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#7a3a2c'; g.fillRect(0, 0, w, h); const r = MM.rng(8);
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,200,160'},${0.03 + r() * 0.06})`; g.fillRect(r() * w, r() * h, 4 + r() * 20, 4 + r() * 20); }
      g.strokeStyle = 'rgba(230,190,140,.35)'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
    }, { repeat: true }); floorTex.repeat.set(3.5, 3);
    M.box(7, 0.1, 6, new T.MeshStandardMaterial({ map: floorTex, roughness: 0.7 }), 0, -0.05, 0, scene);
    M.box(7, 0.1, 6, mat(0xa8b0a0), 0, 3.05, 0, scene);
    M.box(0.15, 3.1, 6, wallM, -3.575, 1.5, 0, scene); M.box(0.15, 3.1, 6, wallM, 3.575, 1.5, 0, scene);
    M.box(7.3, 0.7, 0.15, wallM, 0, 2.75, -3.0, scene); [-1, 1].forEach((s) => M.box(1.15, 2.4, 0.15, wallM, s * 2.98, 1.2, -3.0, scene));
    M.box(7.3, 3.1, 0.15, wallM, 0, 1.5, 3.075, scene);
    // balcony
    M.box(5.4, 0.1, 2.5, mat(0x5a4038), 0, -0.05, -4.25, scene); M.box(5.4, 0.1, 2.5, mat(0x8a9088), 0, 3.05, -4.25, scene);
    [-1, 1].forEach((s) => M.box(0.15, 3.1, 2.6, wallM, s * 2.75, 1.5, -4.25, scene));
    M.box(5.4, 0.9, 0.1, mat(0x6a7268), 0, 0.45, -5.45, scene); M.box(5.4, 0.05, 0.14, mat(0x22262a), 0, 0.93, -5.45, scene);
    [-2.6, -1.3, 0, 1.3, 2.6].forEach((x) => M.box(0.05, 0.4, 0.05, mat(0x22262a), x, 1.13, -5.45, scene));
    M.box(5.3, 0.04, 0.05, mat(0x22262a), 0, 1.33, -5.45, scene);
    // sliding-door frame
    [-2.4, 2.4].forEach((x) => M.box(0.08, 2.4, 0.1, mat(0x30343a, { metalness: 0.4 }), x, 1.2, -3.0, scene)); M.box(4.88, 0.08, 0.1, mat(0x30343a, { metalness: 0.4 }), 0, 2.4, -3.0, scene);
    M.box(0.06, 2.3, 0.05, new T.MeshStandardMaterial({ color: 0xaabbcc, transparent: true, opacity: 0.2 }), 1.6, 1.2, -3.02, scene);
    const fan = M.ceilingFan(scene, 0, 2.98, 0.2, 0x5a4a3a);
    // sofa
    M.box(0.95, 0.4, 2.0, mat(0x6a3a34), -2.85, 0.2, 0.0, scene); M.box(0.22, 0.65, 2.0, mat(0x5a2f2a), -3.3, 0.72, 0.0, scene);
    [-0.65, 0.05, 0.75].forEach((z) => M.box(0.7, 0.14, 0.62, mat(0x7a4640), -2.75, 0.46, z - 0.05, scene));
    // almirah
    M.box(0.55, 2.1, 1.2, mat(0x4a3020), -3.2, 1.05, 1.95, scene); M.box(0.02, 1.9, 0.5, mat(0x6a4a30), -2.92, 1.05, 1.65, scene); M.box(0.02, 1.9, 0.5, mat(0x6a4a30), -2.92, 1.05, 2.25, scene);
    // tea table + cup
    M.box(1.0, 0.06, 0.6, mat(0x4a3424), -0.9, 0.4, 0.3, scene); [[-1.35, 0.05], [-0.45, 0.05], [-1.35, 0.55], [-0.45, 0.55]].forEach((p) => M.box(0.05, 0.4, 0.05, mat(0x33241a), p[0], 0.2, p[1], scene));
    M.cyl(0.05, 0.04, 0.09, 8, mat(0xe8dfc8), -1.15, 0.48, 0.25, scene); M.cyl(0.085, 0.085, 0.01, 10, mat(0xe8dfc8), -1.15, 0.435, 0.25, scene);
    const steam = M.glowSprite(0xffffff, 0.14, 0.3); steam.position.set(-1.15, 0.6, 0.25); scene.add(steam);
    // phone
    const phoneTex = MM.canvasTex(128, 256, () => { });
    M.box(0.15, 0.012, 0.29, mat(0x101418), -0.75, 0.44, 0.34, scene);
    const phScr = new T.Mesh(new T.PlaneGeometry(0.13, 0.27), new T.MeshBasicMaterial({ map: phoneTex })); phScr.rotation.x = -Math.PI / 2; phScr.position.set(-0.75, 0.452, 0.34); scene.add(phScr);
    // dining table + chairs (one pulled out)
    M.box(1.5, 0.05, 0.95, mat(0x4d3424), 1.8, 0.75, -1.5, scene); [[1.1, -1.9], [2.5, -1.9], [1.1, -1.1], [2.5, -1.1]].forEach((p) => M.box(0.06, 0.75, 0.06, mat(0x33241a), p[0], 0.37, p[1], scene));
    const chair = (x, z, ry) => { const c = new T.Group(); c.position.set(x, 0, z); c.rotation.y = ry; scene.add(c); M.box(0.42, 0.05, 0.42, mat(0x5a4030), 0, 0.45, 0, c); M.box(0.42, 0.5, 0.05, mat(0x5a4030), 0, 0.72, -0.2, c);[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach((p) => M.box(0.04, 0.45, 0.04, mat(0x33241a), p[0], 0.22, p[1], c)); return c; };
    chair(1.2, -0.75, Math.PI); chair(2.3, -0.75, Math.PI); chair(1.8, -2.35, 0); chair(0.6, -1.3, Math.PI / 2 + 0.3);
    // stool + paper boat
    M.box(0.4, 0.05, 0.4, mat(0x5a4030), -2.0, 0.5, -2.3, scene); [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].forEach((p) => M.box(0.04, 0.5, 0.04, mat(0x33241a), -2.0 + p[0], 0.25, -2.3 + p[1], scene));
    const boat = M.paperBoat(); boat.scale.setScalar(1.3); boat.position.set(-2.0, 0.53, -2.3); boat.rotation.y = 0.5; scene.add(boat);
    [[-1.5, -2.6, 0xc94a3a], [-1.4, -2.45, 0x3a7ac9], [-1.62, -2.42, 0xe8b93a]].forEach((b) => M.box(0.1, 0.1, 0.1, mat(b[2]), b[0], 0.05, b[1], scene));
    // prayer mat
    const pm = new T.Mesh(new T.PlaneGeometry(0.75, 1.15), new T.MeshStandardMaterial({ map: MM.canvasTex(128, 192, (g, w, h) => { g.fillStyle = '#1d5a4a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8c56a'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12); g.beginPath(); g.moveTo(24, h * 0.55); g.lineTo(24, h * 0.3); g.quadraticCurveTo(w / 2, h * 0.06, w - 24, h * 0.3); g.lineTo(w - 24, h * 0.55); g.stroke(); }), roughness: 1 })); pm.rotation.x = -Math.PI / 2; pm.rotation.z = 0.25; pm.position.set(1.0, 0.012, 1.4); scene.add(pm);
    // calendar
    const cal = new T.Mesh(new T.PlaneGeometry(0.5, 0.68), new T.MeshBasicMaterial({ map: MM.canvasTex(256, 340, (g, w, h) => { g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h); g.fillStyle = '#b3352b'; g.fillRect(0, 0, w, 62); g.fillStyle = '#fff'; g.font = '700 34px ' + MM.FONT_BN; g.textAlign = 'center'; g.fillText('আশ্বিন ১৪৯৪', w / 2, 43); g.fillStyle = '#333'; g.font = '20px ' + MM.FONT_BN; for (let i = 0; i < 30; i++) { const cx = 20 + (i % 7) * 34, cy = 100 + Math.floor(i / 7) * 42; g.fillText(bn(i + 1), cx + 8, cy); if (i === 16) { g.strokeStyle = '#b3352b'; g.lineWidth = 3; g.beginPath(); g.arc(cx + 8, cy - 7, 17, 0, 6.28); g.stroke(); } } }) })); cal.position.set(-3.49, 1.75, 0.95); cal.rotation.y = Math.PI / 2; scene.add(cal);
    const clock = M.wallClock(scene, -3.5, 2.25, -1.6, Math.PI / 2); clock.set(8, 17);
    // photograph on the wall
    const photoTex = MM.canvasTex(320, 220, () => { });
    M.box(0.06, 0.62, 0.86, mat(0x2a1c12), 3.52, 1.7, 0.2, scene);
    const photo = new T.Mesh(new T.PlaneGeometry(0.78, 0.54), new T.MeshBasicMaterial({ map: photoTex })); photo.position.set(3.485, 1.7, 0.2); photo.rotation.y = -Math.PI / 2; scene.add(photo);
    M.box(0.3, 0.05, 1.3, mat(0x3a2a1c), 3.4, 1.2, 0.2, scene);
    // sealed door (hinge at z=1.42)
    M.box(0.12, 2.3, 0.08, mat(0x2a1c12), 3.5, 1.15, 1.38, scene); M.box(0.12, 2.3, 0.08, mat(0x2a1c12), 3.5, 1.15, 2.42, scene); M.box(0.12, 0.08, 1.12, mat(0x2a1c12), 3.5, 2.3, 1.9, scene);
    const glow = new T.Mesh(new T.PlaneGeometry(0.98, 2.2), new T.MeshBasicMaterial({ color: 0xfff2d8, transparent: true, opacity: 0 })); glow.position.set(3.6, 1.15, 1.9); glow.rotation.y = -Math.PI / 2; scene.add(glow);
    const hinge = new T.Group(); hinge.position.set(3.44, 0, 1.42); scene.add(hinge);
    const doorMesh = M.box(0.07, 2.2, 0.98, mat(0x6a4a30), 0, 1.1, 0.49, hinge); M.box(0.09, 0.06, 0.06, mat(0xd9b060), -0.02, 1.05, 0.9, hinge);
    const doorSeal = M.glowSprite(0xff4d63, 1.4, 0.0); doorSeal.position.set(3.3, 1.2, 1.9); scene.add(doorSeal);
    const flo = M.floaters(scene, { x0: -3, x1: 3, y0: 0.3, y1: 2.8, z0: -3, z1: 2.5 }, 70, 0xffd9a0, 0.06);

    // ---------- ghosts ----------
    const ghosts = [];
    const ghost = (o) => { const g = M.human(Object.assign({ ghost: true, kurta: false }, o)); g.userData.o = 0; g.userData.mats = []; g.traverse((m) => { if (m.material && m.material.transparent && g.userData.mats.indexOf(m.material) < 0) g.userData.mats.push(m.material); }); g.visible = false; scene.add(g); ghosts.push(g); return g; };
    const nusChild = ghost({ skin: 0xf0c9c0, top: 0xff9cbc, bottom: 0x5a4a6a, hair: 0x1a1010, scale: 0.64 });
    const nusTeen = ghost({ skin: 0xf0c9c0, top: 0xff9cbc, bottom: 0x4a3a5a, hair: 0x1a1010, scale: 0.86 });
    const arif = ghost({ skin: 0xd0a888, top: 0x8fe9ff, bottom: 0x2a3a4a, hair: 0x111111, scale: 0.97 });

    // analyzer labels
    const labels = [];
    const label = (text, color, pos) => { const tex = MM.canvasTex(256, 64, (g, w, h) => { g.fillStyle = 'rgba(2,10,8,.85)'; g.fillRect(0, 0, w, h); g.strokeStyle = color; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); g.fillStyle = color; g.font = '700 22px "Cascadia Mono",Consolas,monospace'; g.textAlign = 'center'; g.fillText(text, w / 2, 40); }); const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 0 })); s.scale.set(0.9, 0.225, 1); s.position.copy(pos); s.renderOrder = 998; scene.add(s); labels.push(s); return s; };
    label('MODIFIED · 71BC04', '#ff6b7a', V(3.3, 2.15, 0.2)); label('MODIFIED · 9A3F17', '#ff6b7a', V(-0.75, 0.85, 0.34)); label('MODIFIED · 04EE90', '#ff6b7a', V(-3.2, 2.75, -1.6)); label('SEALED · 61%', '#ffc857', V(3.3, 2.5, 1.9)); label('INTACT · 5B6C0A', '#3fd7c6', V(-2.0, 0.95, -2.3));

    const st = { seen: {}, analyzer: false, unlocked: false, doorOpen: false, clockGlitch: 0, ch3: false, sealed: true };
    const S2 = {
      scene, st, clock, ghosts, nusChild, nusTeen, arif, hinge, glow,
      spawn: { x: 0.6, z: 2.1, yaw: 0 },
      bounds: { minX: -3.3, maxX: 3.3, minZ: -4.9, maxZ: 2.7 },
      colliders: [
        { minX: -3.6, maxX: -2.35, minZ: -1.1, maxZ: 1.0 }, { minX: -3.6, maxX: -2.85, minZ: 1.3, maxZ: 2.7 }, { minX: -1.5, maxX: -0.3, minZ: 0.0, maxZ: 0.6 },
        { minX: 1.05, maxX: 2.55, minZ: -2.0, maxZ: -1.0 }, { minX: -3.7, maxX: -2.4, minZ: -5.6, maxZ: -2.9 }, { minX: 2.4, maxX: 3.7, minZ: -5.6, maxZ: -2.9 },
        { minX: -2.25, maxX: -1.75, minZ: -2.55, maxZ: -2.05 }
      ],
      fx: { glitch: 0, chroma: 0.0045, desat: 0.28, vignette: 1.15, noise: 0.05, flash: 0, analyzer: 0, warp: 0.6, scan: 0.2, bloom: 1.5, tr: 1.04, tg: 0.97, tb: 0.9 },
      interactables: [
        { id: 'photo', pos: V(3.4, 1.7, 0.2), dist: 3.4, cone: 0.9, label: 'Examine the photograph' },
        { id: 'phone', pos: V(-0.75, 0.55, 0.34), dist: 2.8, cone: 0.85, label: 'Pick up the phone' },
        { id: 'clock', pos: V(-3.4, 2.25, -1.6), dist: 3.6, cone: 0.9, label: 'Look at the clock' },
        { id: 'toy', pos: V(-2.0, 0.65, -2.3), dist: 3.2, cone: 0.85, label: 'A paper boat' },
        { id: 'door', pos: V(3.3, 1.2, 1.9), dist: 3.2, cone: 0.9, label: () => st.analyzer && st.unlocked ? 'Analyze the sealed door' : 'The door', enabled: () => st.sealed }
      ],
      handlers: {},
      onInteract(id, it) { const h = S2.handlers[id]; if (h) h(it); },
      showGhost(g, x, z, face, o) { g.position.set(x, 0, z); g.rotation.y = Math.atan2(face[0] - x, face[1] - z); g.visible = true; return MM.tween(g.userData, 'o', o === undefined ? 1 : o, 0.9); },
      hideGhost(g) { return MM.tween(g.userData, 'o', 0, 0.9).then(() => { g.visible = false; }); },
      openDoor() { A.door(); MM.tween(glow.material, 'opacity', 0.85, 1.2); return MM.tween(hinge.rotation, 'y', -1.7, 1.4); },
      setAnalyzer(on) {
        st.analyzer = on; E.fxSet({ analyzer: on ? 0.85 : 0, scan: on ? 1 : 0.2 });
        MM.Audio.scan(0.8); UI.toast(on ? 'Memory Analyzer: ON' : 'Memory Analyzer: OFF', 'tool', 1600);
        const tool = document.getElementById('anTool'); if (tool) tool.classList.toggle('on', on);
      },
      update(dt, t) {
        city.update(dt, t); rain.update(dt); fan.blades.rotation.y += dt * 3.2; flo.update(dt, t);
        lamp.intensity = 1.3 + Math.sin(t * 9) * 0.05 + (Math.random() < 0.006 ? -0.7 : 0);
        steam.position.y = 0.6 + ((t * 0.35) % 1) * 0.22; steam.material.opacity = 0.3 * (1 - ((t * 0.35) % 1));
        // clock behaviour
        if (st.clockGlitch > 0) { st.clockGlitch -= dt; if (Math.random() < 0.3) clock.set(Math.floor(Math.random() * 12), Math.floor(Math.random() * 60)); if (st.clockGlitch <= 0) clock.set(8, 17); }
        else if (Math.sin(t * 1.7) > 0.985) clock.set(8, 30); else clock.set(8, 17);
        S2._pt = (S2._pt || 0) + dt;
        if (S2._pt > 0.2) { S2._pt = 0; drawPhoto(photoTex.userData.ctx, 320, 220, t, false); photoTex.needsUpdate = true; }
        // sealed door flicker
        if (st.sealed) { doorMesh.visible = Math.sin(t * 13) < 0.93 && Math.sin(t * 5.3) < 0.98; doorSeal.material.opacity = 0.25 + 0.2 * Math.sin(t * 4); }
        else doorSeal.material.opacity = 0;
        labels.forEach((l) => { l.material.opacity += ((st.analyzer ? 0.95 : 0) - l.material.opacity) * 0.1; });
        ghosts.forEach((g) => { const o = g.userData.o; g.userData.mats.forEach((m) => { m.opacity = o * 0.6; }); if (o < 0.01 && !g.userData.keep) g.visible = false; if (g.visible) g.position.y = Math.sin(t * 1.4 + g.position.x) * 0.03; });
        S2._g = (S2._g === undefined ? 4 : S2._g) - dt;
        if (S2._g < 0) { S2._g = 5 + Math.random() * 7; E.glitch(0.25 + Math.random() * 0.3, 6); A.glitch(0.25); }
        if (MM.Mnemos && false) return;
      }
    };
    // phone screen
    S2.drawPhone = (glitchy) => {
      const g = phoneTex.userData.ctx; g.fillStyle = '#0d1a22'; g.fillRect(0, 0, 128, 256);
      g.fillStyle = '#3fd7c6'; g.font = '700 13px sans-serif'; g.fillText('Nusrat', 10, 20); g.fillStyle = '#8b9aa6'; g.font = '11px sans-serif'; g.fillText('8:47 PM', 10, 36);
      g.fillStyle = '#1f3b3a'; g.fillRect(8, 60, 112, 60); g.fillStyle = '#e3ebee'; g.font = '12px sans-serif'; g.fillText('Baba, someone is', 14, 84); g.fillText('following me.', 14, 102);
      g.fillStyle = '#ff6b7a'; g.font = '11px sans-serif'; g.fillText('3 missed calls', 10, 150);
      if (glitchy) { g.fillStyle = 'rgba(63,215,198,.4)'; g.fillRect(0, 120 + Math.random() * 60, 128, 4); }
      phoneTex.needsUpdate = true;
    };
    S2.drawPhone(false); drawPhoto(photoTex.userData.ctx, 320, 220, 0, false); photoTex.needsUpdate = true; S2.drawPhoto = drawPhoto;
    return S2;
  }

  // =====================================================================
  //  CHAPTERS 2 & 3 — THE MEMORY / THE INCONSISTENCY
  // =====================================================================
  MM.Ch2 = {
    async run() {
      const S2 = MM.Scenes.memory.fresh(), st = S2.st, P = MM.Player;
      St.chapter = 2; UI.refreshHUD(); St.saveProgress();
      await MM.Flow.enterMemory(() => { E.loadScene(S2, { snapFx: true }); A.scene('none', 0.1); }, 'Chapter 2', 'The Memory', 'Rahim\'s memory · Ashwin 1494');
      A.scene('memory', 2.5); UI.showHUD(true); UI.refreshHUD(); UI.tools('');
      await UI.fade(0, 2000); MM.setMode('play');
      MM.busy = true; await UI.sayAll([['', 'You are standing inside Rahim\'s memory. The rain sounds slightly wrong.'], ['M-09', 'It looks like a home. Somebody made sure it does.']]);
      MM.busy = false;
      const count = () => (St.contradictions.c1 ? 1 : 0) + (St.contradictions.c2 ? 1 : 0);
      UI.objective('Investigate the memory', 'Find what does not belong · 0 of 2 inconsistencies');
      const finished = MM.gate();
      const updObj = () => { if (!st.ch3) UI.objSub('Find what does not belong · ' + count() + ' of 2 inconsistencies'); };

      MM.on('analyzer', () => { if (MM.Scenes.memory.get() === S2 && st.unlocked && !MM.busy && E.current() === S2) S2.setAnalyzer(!st.analyzer); });

      async function contradictionOne() {
        St.contradiction(1, 'Rahim says 8:30 · the phone says 8:47'); St.addEvidence('E09');
        await UI.sayAll([['M-09', 'She left at eight-seventeen. She messaged at eight-forty-seven. Rahim remembers eight-thirty.'], ['M-09', 'His memory doesn\'t match its own evidence.']]); updObj();
      }
      async function maybeCh3() {
        if (st.ch3 || !(St.contradictions.c1 && St.contradictions.c2)) return false;
        st.ch3 = true; MM.freeze(); await MM.sleep(500);
        await UI.sayAll([['SYSTEM', 'TWO CONTRADICTIONS LOGGED. MEMORY ANALYZER AVAILABLE.'], ['M-09', 'Two lies in one room. And a door that keeps forgetting it exists.']]);
        UI.hideSub(); A.stinger();
        await MM.Flow.card('Chapter 3', 'The Inconsistency', 'Someone else has been in here', () => { St.chapter = 3; UI.refreshHUD(); St.saveProgress(); });
        A.scene('memory', 1); await UI.fade(0, 1400);
        st.unlocked = true; UI.tools('<div class="tool" id="anTool"><b>Q</b> Memory Analyzer</div>');
        UI.objective('Find the source', 'Toggle the Memory Analyzer (Q), then scan the sealed door');
        MM.free(); return true;
      }

      const hashToast = (id) => {
        const m = { photo: 'PHOTOGRAPH · original 8F4A92 → current 71BC04 · MODIFIED', phone: 'PHONE · original 22D0E1 → current 9A3F17 · MODIFIED', clock: 'CLOCK · original 7C1B55 → current 04EE90 · MODIFIED', toy: 'PAPER BOAT · 5B6C0A · INTACT. This memory is authentic.' };
        UI.toast(m[id], id === 'toy' ? 'tool' : 'warn', 4200); A.ping();
      };

      S2.handlers.photo = MM.act(async () => {
        if (st.analyzer) { hashToast('photo'); return; }
        MM.freeze(); await MM.turnTo(3.4, 1.7, 0.7);
        await UI.say('M-09', 'A family photograph. Rahim said it was always the three of them.');
        const gate = MM.gate();
        const p = UI.panel({ title: 'Memory fragment · photograph', closable: true, panelCls: 'narrow', html: '<canvas width="460" height="320" style="width:100%;background:#000;display:block"></canvas><p style="color:#b9c4cb;margin:10px 0 0">A family at home. Count the people.</p>', onClose: () => gate.open() });
        const cv = p.el.querySelector('canvas'), g = cv.getContext('2d'); let tt = 0;
        (function anim() { if (p.closed) return; tt += 0.03; S2.drawPhoto(g, 460, 320, tt, true); requestAnimationFrame(anim); })();
        await gate; st.seen.photo = true;
        if (!St.contradictions.c2) {
          St.contradiction(2, 'A fourth person stands in the photograph'); St.addEvidence('E08');
          await UI.sayAll([['M-09', 'Four people. Rahim said three.'], ['M-09', 'Someone was cut out of his memory. And the edit left a scar.']]); updObj();
        }
        if (!(await maybeCh3())) MM.free();
      });

      S2.handlers.phone = MM.act(async () => {
        if (st.analyzer) { hashToast('phone'); return; }
        MM.freeze(); await MM.turnTo(-0.75, 0.44, 0.7, -0.5);
        A.phoneBuzz(); S2.drawPhone(true); E.glitch(0.5, 4); await MM.sleep(800); S2.drawPhone(false);
        await UI.sayAll([['NUSRAT', 'Baba... someone is following me.'], ['SYSTEM', 'MESSAGE RECEIVED · 8:47 PM · 3 MISSED CALLS']]);
        st.seen.phone = true;
        if (St.contradictions.c1) await UI.say('M-09', 'Same message. Same time.');
        else if (st.seen.clock) await contradictionOne();
        else await UI.say('M-09', 'Eight-forty-seven. Rahim said she was gone at eight-thirty. I need to see the clock.');
        if (!(await maybeCh3())) MM.free();
      });

      S2.handlers.clock = MM.act(async () => {
        if (st.analyzer) { hashToast('clock'); return; }
        MM.freeze(); await MM.turnTo(-3.4, 2.25, 0.7, 0.3);
        st.clockGlitch = 1.8; E.glitch(0.5, 4); A.glitch(0.5); await MM.sleep(2100);
        await UI.say('M-09', 'Eight-seventeen. The hands keep changing their minds.');
        st.seen.clock = true;
        if (St.contradictions.c1) { /* already logged */ }
        else if (st.seen.phone) await contradictionOne();
        else await UI.say('M-09', 'Rahim swore it was eight-thirty. Something else in here has a timestamp.');
        if (!(await maybeCh3())) MM.free();
      });

      S2.handlers.toy = MM.act(async () => {
        if (st.analyzer) { hashToast('toy'); return; }
        MM.freeze(); await MM.turnTo(-2.0, 0.53, 0.7, -0.3);
        if (st.seen.toy) { await UI.say('M-09', 'A paper boat. This one feels real.'); MM.free(); return; }
        st.seen.toy = true;
        A.scene('warm', 1.4); E.fxSet({ desat: 0.5, bloom: 2, tr: 1.06, tg: 1, tb: 0.85, glitch: 0 });
        await S2.showGhost(S2.nusChild, 0.2, -4.1, [P.pos.x, P.pos.z]);
        await UI.say('NUSRAT', 'Baba, look! It sank again.');
        await UI.say('RAHIM', 'Then fold it tighter, and try again.');
        await UI.say('NUSRAT', 'Next time it will float!');
        await S2.hideGhost(S2.nusChild);
        St.addEvidence('E02');
        await UI.sayAll([['M-09', 'A sunk boat, and a girl who wanted another one.'], ['M-09', 'She learned by failing. That is what memory is for.']]);
        A.scene('memory', 1.4); E.fxSet({ desat: 0.28, bloom: 1.5, tr: 1.04, tg: 0.97, tb: 0.9 });
        MM.free();
      });

      S2.handlers.door = MM.act(async () => {
        MM.freeze(); await MM.turnTo(3.3, 1.2, 0.7);
        if (!st.unlocked) { await UI.sayAll([['M-09', 'The door will not open. Its edges keep changing, like it is not sure it exists.'], ['M-09', 'I need to understand this room first.']]); MM.free(); return; }
        if (!st.analyzer) { await UI.say('M-09', 'Sealed. The Memory Analyzer might see what I cannot. (Q)'); MM.free(); return; }
        A.scan(3); E.glitch(0.7, 3);
        const gate = MM.gate();
        const p = UI.panel({
          title: 'Memory analyzer · sealed sector', panelCls: 'narrow',
          html: `<div class="kv"><span class="k">Memory integrity</span><span class="v bad">61%</span><span class="k">Expected</span><span class="v ok">100%</span><span class="k">Original hash</span><span class="v">8F4A92</span><span class="k">Current hash</span><span class="v bad">71BC04</span><span class="k">Modification</span><span class="v bad">UNAUTHORIZED</span><span class="k">Source</span><span class="v amb">MNEMOS</span></div>
            <div class="warnbar">A second entity has been editing this memory.</div><div class="row"><button class="btn primary" id="unseal">Unseal memory</button></div>`
        });
        A.alarm(); p.el.querySelector('#unseal').addEventListener('click', () => { A.confirm(); p.close(); gate.open(); });
        await gate;
        St.contradiction(3, 'Memory integrity 61% · modification detected'); St.addEvidence('E05');
        await UI.sayAll([['M-09', 'MNEMOS.'], ['M-09', 'Whatever that is, it has been editing Rahim\'s mind.']]);
        S2.setAnalyzer(false); st.sealed = false; UI.tools(''); UI.objective('');
        await hidden();
        finished.open();
      });

      async function hidden() {
        A.scene('warm', 1); E.fxSet({ desat: 0.45, bloom: 2.2, tr: 1.05, tg: 1, tb: 0.88 });
        await MM.turnTo(3.3, 1.9, 0.6); await S2.openDoor(); await UI.flash(700, '#fff2d8');
        await S2.showGhost(S2.nusTeen, 3.0, 1.9, [0, 1.9]); await S2.showGhost(S2.arif, 2.95, 2.5, [0, 1.9]);
        await UI.say('NUSRAT', 'Baba, I am going out with Arif. I will be back by nine.');
        await UI.say('RAHIM', 'Take an umbrella, Nusrat. It is raining.');
        await Promise.all([S2.hideGhost(S2.nusTeen), S2.hideGhost(S2.arif)]);
        A.phoneBuzz(); E.glitch(0.8, 3); await MM.sleep(700);
        await UI.sayAll([['SYSTEM', '8:47 PM · INCOMING MESSAGE'], ['NUSRAT', 'Baba... someone is following me.'], ['RAHIM', 'I was at prayer. I did not hear it. I saw the message at nine.']]);
        A.stinger(); E.fxSet({ desat: 0.6, bloom: 1.2 }); E.glitch(1, 2);
        const gate = MM.gate();
        const p = UI.panel({
          title: 'Recovered original · sealed sector', panelCls: 'narrow',
          html: `<div class="kv"><span class="k">Person removed</span><span class="v bad">ARIF (friend of Nusrat)</span><span class="k">Timeline shifted</span><span class="v bad">8:47 → 8:30</span></div>
            <div class="meter hot">ORIGINAL PAIN <span class="bar"><i data-w="93"></i></span> 93%</div><div class="meter">PAIN NOW <span class="bar"><i data-w="92"></i></span> 92%</div>
            <div class="note">MNEMOS edited the facts. It did not remove the pain.</div><div class="row"><button class="btn primary" id="ok">Leave the memory</button></div>`
        });
        setTimeout(() => p.el.querySelectorAll('.bar i').forEach((b) => { b.style.width = b.dataset.w + '%'; }), 200);
        p.el.querySelector('#ok').addEventListener('click', () => { A.confirm(); p.close(); gate.open(); });
        St.addEvidence('E10'); await gate;
        await UI.sayAll([['M-09', 'They did not take his pain. They only took the truth.'], ['M-09', 'Someone has to see who is doing this.']]);
      }

      await finished;
    }
  };
})();
