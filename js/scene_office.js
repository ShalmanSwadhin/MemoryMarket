/* MEMORY MARKET — scene: Memory Market office (Chapters 1 & 4) */
(function () {
  const MM = window.MM, T = THREE, M = MM.Models, UI = MM.UI, E = MM.Engine, A = MM.Audio, St = MM.State;
  MM.Scenes = MM.Scenes || {};
  let S = null;
  MM.Scenes.office = { get() { return S || (S = build()); }, fresh() { S = build(); return S; } };

  const mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.88, metalness: 0.05, flatShading: true }, o || {}));
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const screenTex = (draw) => MM.canvasTex(512, 320, draw);

  function build() {
    const P = MM.Player;
    const scene = new T.Scene(); scene.background = new T.Color(0x05070d); scene.fog = new T.FogExp2(0x0b1020, 0.013);
    M.buildSky(scene);
    const city = M.buildCity(scene, { z0: -18, rows: 5, width: 170, seed: 11 });
    const rain = M.buildRain(scene, { x0: -18, x1: 18, y0: -3, y1: 14, z0: -14, z1: -4.2 }, 1000, 0xa9c9ff);
    scene.add(new T.HemisphereLight(0x8fa6d8, 0x2a1a10, 0.7));
    const key = new T.PointLight(0xffc88a, 1.0, 12, 1.5); key.position.set(0, 2.9, 0); scene.add(key);
    const scanL = new T.PointLight(0x3fd7c6, 0.9, 6, 1.6); scanL.position.set(-1.6, 1.7, -1.2); scene.add(scanL);
    const winL = new T.PointLight(0x6d7dff, 0.8, 11, 1.4); winL.position.set(0, 2.0, -3.3); scene.add(winL);
    const deskL = new T.PointLight(0xffaa66, 0.7, 5, 1.6); deskL.position.set(2.9, 1.7, -2.2); scene.add(deskL);
    const neon = new T.PointLight(0xff4a8a, 0.55, 6, 1.6); neon.position.set(3.9, 2.3, -0.5); scene.add(neon);

    // ---------- room shell ----------
    const wallM = mat(0x24343d), trim = mat(0x141d25, { metalness: 0.3 });
    const floorTex = MM.canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#121d24'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#16242c' : '#0f1920'; g.fillRect(x * 64 + 1, y * 64 + 1, 62, 62); }
      g.strokeStyle = 'rgba(63,215,198,.12)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
    }, { repeat: true }); floorTex.repeat.set(4.5, 3.75);
    M.box(9, 0.1, 7.5, new T.MeshStandardMaterial({ map: floorTex, roughness: 0.55, metalness: 0.25 }), 0, -0.05, -0.25, scene);
    M.box(9, 0.1, 7.5, mat(0x1a252d), 0, 3.25, -0.25, scene);
    [-1, 1].forEach((s) => M.box(0.15, 3.3, 7.5, wallM, s * 4.575, 1.6, -0.25, scene));
    // back wall with window
    M.box(9.3, 0.9, 0.15, wallM, 0, 0.45, -4.075, scene); M.box(9.3, 0.35, 0.15, wallM, 0, 3.03, -4.075, scene);
    [-1, 1].forEach((s) => M.box(1.9, 2.0, 0.15, wallM, s * 3.55, 1.9, -4.075, scene));
    [-2.6, -1.3, 0, 1.3, 2.6].forEach((x) => M.box(0.06, 2.0, 0.06, trim, x, 1.9, -3.98, scene));
    M.box(5.3, 0.06, 0.12, trim, 0, 0.92, -3.96, scene); M.box(5.3, 0.06, 0.12, trim, 0, 2.88, -3.98, scene);
    M.glassPane(5.2, 1.96, 0, 1.9, -3.97, scene);
    // front wall with door opening
    [-1, 1].forEach((s) => M.box(3.85, 3.3, 0.15, wallM, s * 2.575, 1.6, 3.5, scene)); M.box(1.3, 0.95, 0.15, wallM, 0, 2.78, 3.5, scene);
    [-1, 1].forEach((s) => M.box(0.04, 2.3, 0.04, M.basic(0x3fd7c6), s * 0.67, 1.15, 3.42, scene));
    M.box(1.38, 0.04, 0.04, M.basic(0x3fd7c6), 0, 2.32, 3.42, scene);
    const doorG = new T.Group(); doorG.position.set(0, 0, 3.37); scene.add(doorG);
    M.box(1.3, 2.3, 0.05, mat(0x1a2530, { metalness: 0.5 }), 0, 1.15, 0, doorG);
    M.box(0.03, 1.9, 0.02, M.basic(0x3fd7c6), -0.5, 1.15, -0.03, doorG); M.box(0.03, 1.9, 0.02, M.basic(0x3fd7c6), 0.5, 1.15, -0.03, doorG);
    const dsign = M.signMesh('প্রবেশ · ENTRY', 0.9, 0.2, { color: '#3fd7c6', size: 46, w: 512 }); dsign.position.set(0, 1.7, -0.04); dsign.rotation.y = Math.PI; doorG.add(dsign);
    M.box(3, 3, 0.1, M.basic(0x120e18), 0, 1.5, 5.0, scene);           // dark hall beyond the door
    const hallL = new T.PointLight(0xffb070, 0.6, 4, 2); hallL.position.set(0, 2.4, 4.2); scene.add(hallL);
    // ceiling light strips
    [-1.6, 1.6].forEach((x) => M.box(0.25, 0.03, 2.6, M.basic(0xffe2b0), x, 3.18, -0.2, scene));
    // rug
    const rugTex = MM.canvasTex(256, 170, (g, w, h) => {
      g.fillStyle = '#4a201c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d99a3a'; g.lineWidth = 3; g.strokeRect(8, 8, w - 16, h - 16);
      g.strokeStyle = 'rgba(217,154,58,.7)'; g.lineWidth = 2;
      for (let i = 0; i < 5; i++) { const cx = 28 + i * 50, cy = h / 2; g.beginPath(); g.moveTo(cx, cy - 34); g.lineTo(cx + 20, cy); g.lineTo(cx, cy + 34); g.lineTo(cx - 20, cy); g.closePath(); g.stroke(); g.beginPath(); g.arc(cx, cy, 6, 0, 6.28); g.stroke(); }
    });
    const rug = new T.Mesh(new T.PlaneGeometry(3.2, 2.1), new T.MeshStandardMaterial({ map: rugTex, roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0.3, 0.008, 0.6); scene.add(rug);

    // neon signs
    const sBn = M.signMesh('স্মৃতি বাজার', 3.4, 0.85, { color: '#ff4a8a', size: 70, w: 512 }); sBn.position.set(4.46, 2.35, -0.6); sBn.rotation.y = -Math.PI / 2; scene.add(sBn);
    const sEn = M.signMesh('MEMORY MARKET', 2.6, 0.4, { color: '#37e6ff', size: 52, bn: false, w: 512 }); sEn.position.set(4.46, 1.75, -0.6); sEn.rotation.y = -Math.PI / 2; scene.add(sEn);
    const lic = M.signMesh('ব্রোকার লাইসেন্স · M-09', 1.3, 0.34, { color: '#f2a93b', size: 40, w: 512, frame: true }); lic.position.set(-4.46, 2.5, 2.2); lic.rotation.y = Math.PI / 2; scene.add(lic);

    // ceiling fan
    const fan = M.ceilingFan(scene, 0.3, 3.15, 0.6, 0x6e5a44);

    // ---------- desk / workstation ----------
    M.box(2.2, 0.06, 0.9, mat(0x3a2c22), 2.9, 0.76, -3.0, scene);
    [[1.85, -3.35], [3.95, -3.35], [1.85, -2.65], [3.95, -2.65]].forEach((p) => M.box(0.06, 0.76, 0.06, trim, p[0], 0.38, p[1], scene));
    M.box(0.55, 0.62, 0.8, mat(0x2b2019), 3.6, 0.38, -3.0, scene);
    M.box(0.86, 0.56, 0.05, mat(0x10161d), 2.9, 1.2, -3.36, scene);
    const monTex = screenTex(() => { });
    const mon = new T.Mesh(new T.PlaneGeometry(0.8, 0.5), new T.MeshBasicMaterial({ map: monTex })); mon.position.set(2.9, 1.2, -3.33); scene.add(mon);
    M.box(0.5, 0.02, 0.16, mat(0x181f27), 2.9, 0.8, -2.8, scene);
    M.cyl(0.045, 0.04, 0.09, 8, mat(0xe8dfc8), 2.25, 0.83, -2.75, scene);
    const steam = M.glowSprite(0xffffff, 0.16, 0.35); steam.position.set(2.25, 0.95, -2.75); scene.add(steam);
    M.box(0.5, 0.05, 0.5, mat(0x1d252d), 2.9, 0.5, -2.1, scene); M.box(0.5, 0.55, 0.06, mat(0x1d252d), 2.9, 0.82, -1.86, scene); M.cyl(0.04, 0.04, 0.48, 6, trim, 2.9, 0.25, -2.1, scene);
    const holoTex = MM.canvasTex(512, 256, () => { });
    const holo = new T.Mesh(new T.PlaneGeometry(1.25, 0.62), new T.MeshBasicMaterial({ map: holoTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, opacity: 0.9 })); holo.position.set(2.9, 2.05, -3.2); scene.add(holo);
    const orb = new T.Mesh(new T.IcosahedronGeometry(0.2, 1), new T.MeshBasicMaterial({ color: 0x3fd7c6, wireframe: true, transparent: true, opacity: 0.8 })); orb.position.set(1.85, 1.5, -3.25); scene.add(orb);
    const orbG = M.glowSprite(0x3fd7c6, 0.9, 0.35); orbG.position.copy(orb.position); scene.add(orbG);

    // ---------- memory scanner ----------
    const sc = new T.Group(); sc.position.set(-1.6, 0, -1.2); scene.add(sc);
    M.cyl(1.0, 1.05, 0.12, 28, mat(0x141c24, { metalness: 0.4 }), 0, 0.06, 0, sc);
    const fring = new T.Mesh(new T.TorusGeometry(0.86, 0.02, 6, 48), M.basic(0x3fd7c6)); fring.rotation.x = Math.PI / 2; fring.position.y = 0.13; sc.add(fring);
    [-1, 1].forEach((s) => M.cyl(0.05, 0.05, 2.7, 8, mat(0x22303a, { metalness: 0.5 }), s * 0.98, 1.4, 0, sc));
    M.cyl(1.1, 1.1, 0.12, 28, mat(0x141c24, { metalness: 0.4 }), 0, 2.78, 0, sc); M.cyl(0.32, 0.32, 0.5, 10, mat(0x141c24), 0, 3.05, 0, sc);
    const rg = new T.Group(); sc.add(rg);
    const ringM = new T.Mesh(new T.TorusGeometry(0.8, 0.035, 8, 48), M.basic(0x3fd7c6)); ringM.rotation.x = Math.PI / 2; rg.add(ringM);
    const disc = new T.Mesh(new T.CircleGeometry(0.8, 32), new T.MeshBasicMaterial({ color: 0x3fd7c6, transparent: true, opacity: 0.14, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); disc.rotation.x = -Math.PI / 2; rg.add(disc);
    const ringS = { y: 2.5, on: false }; rg.position.y = ringS.y;
    const scLabel = M.signMesh('SCAN · স্ক্যান', 1.0, 0.22, { color: '#3fd7c6', size: 46, w: 512 }); scLabel.position.set(0, 0.4, 1.1); sc.add(scLabel);

    // ---------- storage capsules ----------
    const caps = [];
    for (let i = 0; i < 7; i++) {
      const z = -3.1 + i * 0.8, cg = new T.Group(); cg.position.set(-4.15, 0, z); scene.add(cg);
      M.cyl(0.3, 0.34, 0.12, 12, mat(0x151d26), 0, 0.06, 0, cg); M.cyl(0.3, 0.3, 0.1, 12, mat(0x151d26), 0, 1.85, 0, cg);
      const gl = new T.Mesh(new T.CylinderGeometry(0.27, 0.27, 1.7, 12, 1, true), new T.MeshBasicMaterial({ color: 0x88ffee, transparent: true, opacity: 0.09, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); gl.position.y = 0.98; cg.add(gl);
      const last = i === 6, col = last ? 0xff4d63 : [0xf2a93b, 0xffc857, 0xff9cbc, 0x8fe9ff][i % 4];
      const ob = M.sph(0.14, 8, M.basic(col), 0, 1.0, 0, cg), sp = M.glowSprite(col, 0.9, 0.55); sp.position.set(0, 1.0, 0); cg.add(sp);
      const lb = M.signMesh(last ? 'M-09' : '#' + (4400 + i * 37), 0.5, 0.15, { color: last ? '#ff4d63' : '#f2a93b', size: 54, bn: false, w: 256 }); lb.position.set(0.33, 0.32, 0); lb.rotation.y = Math.PI / 2; cg.add(lb);
      caps.push({ ob, sp, i });
    }
    // waiting bench + plant
    M.box(0.42, 0.42, 1.8, mat(0x2a3540), 3.7, 0.21, 2.4, scene); M.box(0.1, 0.4, 1.8, mat(0x2a3540), 3.9, 0.62, 2.4, scene);
    M.cyl(0.2, 0.15, 0.32, 8, mat(0x5a3a2a), 4.0, 0.16, 1.2, scene); M.ico(0.32, 0, mat(0x2f6a44), 4.0, 0.62, 1.2, scene); M.ico(0.22, 0, mat(0x3a7a50), 3.9, 0.95, 1.15, scene);
    const flo = M.floaters(scene, { x0: -4, x1: 4, y0: 0.4, y1: 3, z0: -3.5, z1: 3 }, 50, 0xffd9a0, 0.05);

    // ---------- Rahim ----------
    const rahim = M.human({ skin: 0xa87a58, top: 0xcfc8b4, bottom: 0x3a3f4d, hair: 0x8a8a8a, beard: 0x9a9a9a, cap: 0xe8e4d8, scale: 0.95 });
    rahim.position.set(0, 0, 5.4); rahim.visible = false; scene.add(rahim);
    const rw = M.walker(rahim); rw.onStep = () => A.step();

    // ---------- scene object ----------
    const rc = { minX: 0, maxX: 0, minZ: 0, maxZ: 0, off: true };
    const st = { rahimHere: false, onScanner: false, scanned: false, arrived: false, talk: {}, ended: false };
    const rahimIt = { id: 'rahim', pos: V(0, 1.6, 5), dist: 3.2, cone: 0.9, label: 'Talk to Rahim', enabled: () => st.rahimHere && !st.onScanner };
    const S2 = {
      scene, st, rahim, rw, city, att: false,
      spawn: { x: 0.9, z: 1.6, yaw: 0.3 },
      bounds: { minX: -4.1, maxX: 4.1, minZ: -3.5, maxZ: 3.1 },
      colliders: [
        { minX: 1.75, maxX: 4.05, minZ: -3.6, maxZ: -2.5 },
        { minX: -2.6, maxX: -0.6, minZ: -2.2, maxZ: -0.2 },
        { minX: -4.7, maxX: -3.7, minZ: -3.5, maxZ: 2.0 },
        { minX: 3.5, maxX: 4.1, minZ: 1.4, maxZ: 3.4 }, rc
      ],
      fx: { glitch: 0, chroma: 0.0018, desat: 0.05, vignette: 1.0, noise: 0.03, flash: 0, analyzer: 0, warp: 0, scan: 0.1, bloom: 1, tr: 1, tg: 1, tb: 1 },
      interactables: [
        { id: 'computer', pos: V(2.9, 1.1, -3.0), dist: 2.9, label: () => 'Use workstation' },
        { id: 'scanner', pos: V(-1.6, 1.2, -1.2), dist: 3.2, label: 'Memory scanner', enabled: () => st.onScanner && !st.scanned },
        { id: 'storage', pos: V(-4.0, 1.2, -0.6), dist: 3.4, label: 'Memory storage' },
        { id: 'door', pos: V(0, 1.2, 3.3), dist: 2.8, label: 'Office door' },
        { id: 'window', pos: V(0, 1.7, -3.7), dist: 2.4, label: 'Look outside' },
        rahimIt
      ],
      handlers: {}, setHandlers(h) { S2.handlers = h; },
      onInteract(id, it) { const h = S2.handlers[id]; if (h) h(it); },
      onEnter() { },
      // --- helpers used by chapter flows ---
      doorOpen(on) { A.door(); return MM.tween(doorG.position, 'x', on ? 1.35 : 0, 0.9); },
      async sweep() {
        ringS.on = true; A.scan(4.6); E.fxSet({ analyzer: 0.45, scan: 1 });
        await MM.tween(ringS, 'y', 0.25, 2.3); E.glitch(0.7, 3.5); A.ping();
        await MM.tween(ringS, 'y', 2.5, 2.3);
        ringS.on = false; E.fxSet({ analyzer: 0, scan: 0.1 });
      },
      ringUp() { return MM.tween(ringS, 'y', 2.5, 1.2); },
      rahimEnter() {
        rahim.visible = true; rahim.position.set(0, 0, 5.4); st.rahimHere = true;
        return rw.walkTo(0, 3.0, 1.2).then(() => rw.walkTo(0.4, 0.5, 1.15));
      },
      async rahimToScanner() { await rw.walkTo(-0.6, -0.1, 1.1); await rw.walkTo(-1.6, -1.2, 0.9); rahim.position.y = 0.12; st.onScanner = true; rw.face(-1.6, 5); },
      async rahimLeave() { st.onScanner = false; rahim.position.y = 0; await rw.walkTo(-0.4, 0.6, 1.0); await rw.walkTo(0, 3.0, 1.2); await S2.doorOpen(true); await rw.walkTo(0, 5.4, 1.2); rahim.visible = false; st.rahimHere = false; await S2.doorOpen(false); },
      update(dt, t) {
        city.update(dt, t); rain.update(dt); fan.blades.rotation.y += dt * 4; flo.update(dt, t);
        winL.intensity = 0.75 + Math.sin(t * 3.1) * 0.08 + (Math.random() < 0.008 ? 0.5 : 0);
        neon.intensity = 0.5 + Math.sin(t * 5.3) * 0.05 + (Math.random() < 0.01 ? -0.3 : 0);
        caps.forEach((c) => { c.ob.position.y = 1.0 + Math.sin(t * 1.2 + c.i) * 0.06; c.sp.position.y = c.ob.position.y; c.sp.material.opacity = 0.45 + Math.sin(t * 1.7 + c.i) * 0.12; });
        rg.position.y = ringS.y; scanL.intensity = 0.8 + (ringS.on ? 0.6 * Math.sin(t * 20) : 0); ringM.material.color.setHex(ringS.on ? 0xb8fff5 : 0x3fd7c6);
        fring.rotation.z = t * 0.6; orb.rotation.y = t * 0.7; orb.rotation.x = t * 0.4; holo.position.y = 2.05 + Math.sin(t * 1.3) * 0.02; steam.position.y = 0.95 + ((t * 0.3) % 1) * 0.25; steam.material.opacity = 0.35 * (1 - ((t * 0.3) % 1));
        S2._tt = (S2._tt || 0) + dt;
        if (S2._tt > 0.4) { S2._tt = 0; drawMon(monTex.userData.ctx, t); monTex.needsUpdate = true; drawHolo(holoTex.userData.ctx, t); holoTex.needsUpdate = true; }
        rw.update(dt, t);
        rahimIt.pos.set(rahim.position.x, rahim.position.y + 1.6, rahim.position.z);
        if (rahim.visible) { rc.off = false; rc.minX = rahim.position.x - 0.3; rc.maxX = rahim.position.x + 0.3; rc.minZ = rahim.position.z - 0.3; rc.maxZ = rahim.position.z + 0.3; } else rc.off = true;
        if (st.rahimHere && !st.onScanner && !rw.path.length) rw.face(P.pos.x, P.pos.z);
        if (S2.att) { P.pos.set(Math.sin(t * 0.09) * 1.4 + 0.4, 1.65, 1.9 + Math.cos(t * 0.07) * 0.4); P.yaw = Math.sin(t * 0.11) * 0.55 + 0.05; P.pitch = 0.04; }
      }
    };
    function drawMon(g, t) {
      g.fillStyle = '#04141a'; g.fillRect(0, 0, 512, 320);
      g.fillStyle = '#3fd7c6'; g.font = '700 26px "Cascadia Mono",Consolas,monospace'; g.fillText('MEMORY MARKET // BROKER OS', 20, 40);
      g.fillStyle = 'rgba(63,215,198,.55)'; g.font = '20px "Cascadia Mono",Consolas,monospace';
      ['> session M-09 ......... ok', '> capsules online ....... 7/7', '> queue ................. 1', '> integrity daemon ...... idle', '> today: ' + (St.chapter >= 4 ? 'TRACE PENDING' : 'appointment 19:40')].forEach((l, i) => g.fillText(l, 20, 84 + i * 32));
      if (Math.floor(t * 2) % 2) { g.fillStyle = '#3fd7c6'; g.fillRect(20, 262, 14, 22); }
    }
    function drawHolo(g, t) {
      g.clearRect(0, 0, 512, 256); g.strokeStyle = 'rgba(63,215,198,.8)'; g.lineWidth = 2; g.strokeRect(6, 6, 500, 244);
      g.fillStyle = '#7ff3e6'; g.font = '700 34px ' + MM.FONT_BN; g.fillText('স্মৃতি বাজার', 24, 58);
      g.font = '22px "Cascadia Mono",Consolas,monospace'; g.fillStyle = '#3fd7c6'; g.fillText('BROKER STATION · M-09', 24, 98);
      g.fillStyle = 'rgba(127,243,230,.7)'; g.fillText('QUEUE ........ 01', 24, 138); g.fillText('CLOCK ........ ' + (19 + Math.floor(t / 60) % 2) + ':' + ('0' + (40 + Math.floor(t) % 20)).slice(-2), 24, 170);
      g.fillStyle = 'rgba(255,200,120,.8)'; g.fillText('RAIN DAY 11', 24, 202);
      for (let i = 0; i < 20; i++) { const h = 10 + 30 * Math.abs(Math.sin(t * 2 + i * 0.7)); g.fillStyle = 'rgba(63,215,198,.5)'; g.fillRect(300 + i * 9, 230 - h, 6, h); }
    }
    drawMon(monTex.userData.ctx, 0); monTex.needsUpdate = true; drawHolo(holoTex.userData.ctx, 0); holoTex.needsUpdate = true;
    return S2;
  }

  // =====================================================================
  //  CHAPTER 1 — THE BROKER
  // =====================================================================
  MM.Ch1 = {
    async run() {
      const S2 = MM.Scenes.office.fresh(), st = S2.st, rahim = S2.rahim, rw = S2.rw;
      St.chapter = 1; UI.refreshHUD(); St.saveProgress();
      await MM.Flow.card('Chapter 1', 'The Broker', 'Memory Market · Dhaka, 2087', () => { E.loadScene(S2, { snapFx: true }); A.scene('none', 0.1); });
      A.scene('office', 2.5); UI.showHUD(true); UI.refreshHUD(); UI.tools('');
      await UI.fade(0, 1600); E.markStarted(); MM.setMode('play');
      UI.toast('WASD move  ·  Mouse look  ·  E interact  ·  Tab evidence journal', 'tool', 7000);
      MM.busy = true; await UI.sayAll([['', 'MEMORY MARKET. Broker Station M-09. Dhaka, 2087. It has been raining for eleven days.'], ['M-09', 'Memories are the only thing people still pay to lose.']]);
      MM.busy = false;
      UI.objective('Start your shift', 'Use the workstation');

      const done = MM.gate();

      async function arrive() {
        st.arrived = true; MM.freeze();
        UI.objective('Someone is at the door');
        A.ping(); await MM.sleep(500);
        await S2.doorOpen(true);
        const walk = S2.rahimEnter();
        await MM.sleep(1200); await MM.turnTo(0, 3.4, 1.0);
        await walk; await MM.turnTo(rahim.position.x, rahim.position.z, 0.9);
        await UI.say('RAHIM', 'Are you the broker? They told me you can take memories away.');
        S2.doorOpen(false);
        UI.objective('Talk to Rahim', 'Ask what he needs. Listen carefully.');
        MM.free();
      }

      S2.handlers.computer = MM.act(async () => {
        const api = MM.Term.open({
          title: 'Broker station — M-09', first: st.arrived ? 'notes' : 'appt',
          tabs: [
            { id: 'appt', label: 'Appointments', render(m) { m.innerHTML = `<h3>Today's queue</h3><div class="kv"><span class="k">19:40</span><span class="v amb">R. — memory removal</span><span class="k">Request no.</span><span class="v">M-0921</span><span class="k">Customer</span><span class="v">Rahim (age 58)</span><span class="k">Status</span><span class="v ok">Arriving</span></div><p>Standard consultation. Scan first, then decide. Never scan without consent.</p>`; } },
            { id: 'notes', label: 'Broker notes', onView() { St.addEvidence('E06'); }, render(m) { m.innerHTML = `<h3>Personal research notes</h3><p style="font-family:var(--mono)">Reminder to self: a memory is not a thing we hold. It is the person. Change what someone remembers and you change who they are.</p><p style="font-family:var(--mono)">Every broker learns this in week one. I keep writing it down again, as if I keep forgetting.</p><div class="note">The last three pages of this notebook are missing.</div>`; } },
            { id: 'rules', label: 'Market rules', render(m) { m.innerHTML = `<h3>Rules of the Market</h3><div class="stat"><span>1</span><span>Every memory has a price</span></div><div class="stat"><span>2</span><span>Never sell what you cannot verify</span></div><div class="stat"><span>3</span><span>Never scan without consent</span></div><div class="stat"><span>4</span><span>Do not ask what was there before</span></div>`; } }
          ]
        });
        await api.closed;
        if (api.seen.appt && !st.arrived) await arrive();
      });

      S2.handlers.storage = MM.act(async () => {
        MM.freeze();
        await UI.sayAll([['M-09', 'Other people\'s afternoons, bottled and priced.'], ['', 'Weddings. First rains. A stranger\'s last argument.'], ['SYSTEM', 'CAPSULE 07  ·  SUBJECT: M-09  ·  ACCESS DENIED'], ['M-09', 'That one has my name on it. I don\'t remember putting it there.']]);
        MM.free();
      });
      S2.handlers.window = MM.act(async () => {
        MM.freeze(); A.thunder(); E.glitch(0.25, 6);
        await UI.sayAll([['M-09', 'Eleven days of rain. The city has stopped remembering what dry feels like.']]);
        MM.free();
      });
      S2.handlers.door = MM.act(async () => {
        MM.freeze(); await UI.say('M-09', st.arrived ? 'Rahim is waiting. Not now.' : 'Sealed until the first appointment.'); MM.free();
      });

      S2.handlers.rahim = MM.act(async () => {
        MM.freeze(); await MM.turnTo(rahim.position.x, rahim.position.z, 0.6);
        const t = st.talk;
        for (; ;) {
          const ready = t.a && t.b;
          const i = await UI.choice('Rahim', [
            { label: 'What memory do you want removed?', done: t.a },
            { label: 'Tell me about that night.', done: t.b },
            { label: 'Has the pain ever made you angry?', done: t.c },
            { label: 'How is your wife?', done: t.d },
            { label: ready ? 'Let us begin the scan.' : 'Let us begin the scan. (ask him more first)', disabled: !ready }
          ]);
          if (i === 0) {
            if (t.a) { await UI.say('RAHIM', 'I have told you. My daughter. Nusrat.'); continue; }
            t.a = true;
            await UI.sayAll([['RAHIM', 'It is a memory. The night my daughter died.'], ['RAHIM', 'I do not want to remember it anymore. I want it gone.'], ['M-09', 'Some customers sell a memory. Others erase it.']]);
            St.addEvidence('E04');
            await UI.sayAll([['RAHIM', 'Erase. Every memory of her hurts. Every single one.']]);
            await MM.sleep(500); St.addEvidence('E01');
          } else if (i === 1) {
            if (t.b) { await UI.say('RAHIM', 'Half past eight. I remember the clock. I will never forget it. That is the problem.'); continue; }
            t.b = true;
            await UI.sayAll([['RAHIM', 'It was raining, like tonight. She went out, and she did not come back.'], ['RAHIM', 'She died at half past eight. I remember the clock on the wall. Eight-thirty.'], ['RAHIM', 'It was always the three of us. Me, my wife, Nusrat. Only ever the three of us.'], ['M-09', 'Eight-thirty. Three of you.']]);
          } else if (i === 2) {
            if (t.c) { await UI.say('RAHIM', 'Never. Not once.'); continue; }
            t.c = true;
            await UI.sayAll([['RAHIM', 'Angry? At myself, perhaps. I have never raised my hand to anyone in my life.'], ['RAHIM', 'I only sit. In the dark. And I remember.']]);
            St.addEvidence('E07');
          } else if (i === 3) {
            if (t.d) { await UI.say('RAHIM', 'We do not talk about it.'); continue; }
            t.d = true;
            await UI.sayAll([['RAHIM', 'My wife and I sit in the same room like strangers. She cannot look at me since that night.'], ['RAHIM', 'I do not even know why.']]);
            St.addEvidence('E03');
          } else if (i === 4) {
            await UI.sayAll([['RAHIM', 'Will it hurt?'], ['M-09', 'No.']]);
            UI.hideSub(); UI.objective('Prepare the scan', 'Wait for Rahim to take his place');
            await S2.rahimToScanner();
            UI.objective('Start the memory scan', 'Use the memory scanner');
            break;
          }
        }
        MM.free();
      });

      S2.handlers.scanner = MM.act(async () => {
        MM.freeze(); UI.objective(''); await MM.turnTo(-1.6, -1.2, 0.8);
        await UI.say('M-09', 'Hold still. This will not take long.', { hold: 300 });
        await S2.sweep(); st.scanned = true; UI.hideSub();
        const enter = MM.gate();
        const p = UI.panel({
          title: 'Memory scanner — subject: RAHIM', panelCls: 'narrow',
          html: `<div class="kv"><span class="k">Memory located</span><span class="v ok">1 primary · 1 sealed sector</span><span class="k">Emotional intensity</span><span class="v amb">92%</span><span class="k">Memory integrity</span><span class="v bad">61%</span></div>
            <div class="meter bad">INTEGRITY <span class="bar"><i data-w="61"></i></span> 61%</div><div class="meter hot">EMOTION <span class="bar"><i data-w="92"></i></span> 92%</div>
            <div class="warnbar">WARNING: modification detected. Origin unknown.</div>
            <div class="row"><button class="btn primary" id="go">Enter memory</button></div>`
        });
        A.alarm(); setTimeout(() => p.el.querySelectorAll('.bar i').forEach((b) => { b.style.width = b.dataset.w + '%'; }), 200);
        p.el.querySelector('#go').addEventListener('click', () => { A.confirm(); p.close(); enter.open(); });
        await enter; done.open();
      });

      await done;
    }
  };
})();
