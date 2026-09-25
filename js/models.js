/* MEMORY MARKET — procedural low-poly assets */
(function () {
  const MM = window.MM, T = THREE;
  const M = MM.Models = {};
  const matCache = {};

  M.std = (color, o) => {
    const key = color + JSON.stringify(o || {});
    if (matCache[key]) return matCache[key];
    return (matCache[key] = new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.86, metalness: 0.04, flatShading: true }, o || {})));
  };
  M.basic = (color, o) => new T.MeshBasicMaterial(Object.assign({ color }, o || {}));
  M.glow = (color, o) => new T.MeshBasicMaterial(Object.assign({ color, transparent: true, blending: T.AdditiveBlending, depthWrite: false }, o || {}));

  function place(m, x, y, z, parent) { m.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(m); return m; }
  M.box = (w, h, d, mat, x, y, z, parent) => place(new T.Mesh(new T.BoxGeometry(w, h, d), mat), x, y, z, parent);
  M.cyl = (rt, rb, h, seg, mat, x, y, z, parent) => place(new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), mat), x, y, z, parent);
  M.sph = (r, seg, mat, x, y, z, parent) => place(new T.Mesh(new T.SphereGeometry(r, seg, Math.max(3, seg - 2)), mat), x, y, z, parent);
  M.plane = (w, h, mat, x, y, z, parent) => place(new T.Mesh(new T.PlaneGeometry(w, h), mat), x, y, z, parent);
  M.ico = (r, d, mat, x, y, z, parent) => place(new T.Mesh(new T.IcosahedronGeometry(r, d), mat), x, y, z, parent);

  // ---------- textures ----------
  M.glowTex = (() => {
    let t = null;
    return () => t || (t = MM.canvasTex(128, 128, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }));
  })();
  M.glowSprite = (color, size, opacity) => {
    const s = new T.Sprite(new T.SpriteMaterial({ map: M.glowTex(), color, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: opacity === undefined ? 1 : opacity }));
    s.scale.set(size, size, 1); return s;
  };

  // neon sign texture (supports Bengali)
  M.signTex = (text, o) => {
    o = Object.assign({ w: 512, h: 128, color: '#ff4a8a', size: 64, bn: true, bg: null, frame: false }, o || {});
    return MM.canvasTex(o.w, o.h, (g, w, h) => {
      if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); }
      g.font = `700 ${o.size}px ${o.bn ? MM.FONT_BN : MM.FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = o.color; g.shadowBlur = 22; g.fillStyle = o.color;
      g.fillText(text, w / 2, h / 2 + 2); g.shadowBlur = 8; g.fillStyle = '#fff'; g.globalAlpha = 0.75; g.fillText(text, w / 2, h / 2 + 2);
      if (o.frame) { g.globalAlpha = 1; g.strokeStyle = o.color; g.lineWidth = 4; g.shadowBlur = 14; g.strokeRect(6, 6, w - 12, h - 12); }
    });
  };
  M.signMesh = (text, w, h, o) => {
    const o2 = Object.assign({}, o || {}); o2.w = o2.w || 512; o2.h = Math.round(o2.w * h / w);
    const tex = M.signTex(text, o2);
    return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
  };

  M.windowTex = (kind, seed) => {
    const rnd = MM.rng(seed * 977);
    return MM.canvasTex(128, 256, (g, w, h) => {
      const old = kind === 'old';
      g.fillStyle = old ? '#141a2a' : '#0a101b'; g.fillRect(0, 0, w, h);
      const cols = old ? 3 : 5, rows = old ? 8 : 16, cw = w / cols, ch = h / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const lit = rnd() < (old ? 0.42 : 0.5);
        const pal = ['#ffd58a', '#ffbb66', '#8fe9ff', '#ff86b4', '#c9d7ff'];
        g.fillStyle = lit ? pal[Math.floor(rnd() * (rnd() < 0.7 ? 2 : 5))] : (old ? '#1c2438' : '#111a2a');
        if (old) {
          const x = c * cw + cw * 0.22, y = r * ch + ch * 0.2, ww = cw * 0.56, hh = ch * 0.62;
          g.beginPath(); g.moveTo(x, y + hh); g.lineTo(x, y + ww / 2); g.arc(x + ww / 2, y + ww / 2, ww / 2, Math.PI, 0); g.lineTo(x + ww, y + hh); g.closePath(); g.fill();
          if (rnd() < 0.3) { g.fillStyle = 'rgba(70,200,180,.55)'; g.fillRect(x - 3, y + hh * 0.5, 3, hh * 0.5); g.fillRect(x + ww, y + hh * 0.5, 3, hh * 0.5); }
        } else {
          g.fillRect(c * cw + cw * 0.2, r * ch + ch * 0.22, cw * 0.6, ch * 0.5);
        }
      }
      if (old) { g.fillStyle = 'rgba(255,255,255,.03)'; for (let i = 0; i < 30; i++) g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 10, 1); }
    }, { repeat: true });
  };

  M.skyTex = () => MM.canvasTex(16, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#04060d'); gr.addColorStop(0.55, '#101634'); gr.addColorStop(0.82, '#3a1d4a'); gr.addColorStop(1, '#6a2a58');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  M.buildSky = (scene, top, bottom) => {
    const m = new T.Mesh(new T.SphereGeometry(300, 16, 12), new T.MeshBasicMaterial({ map: M.skyTex(), side: T.BackSide, fog: false, depthWrite: false }));
    scene.add(m); return m;
  };

  // ---------- city backdrop ----------
  const BN_SIGNS = [['স্মৃতি বাজার', '#ff4a8a'], ['মেমোরি ক্লিনিক', '#37e6ff'], ['স্মৃতি সংরক্ষণ', '#ffc857'], ['নতুন স্মৃতি', '#8bff9f'], ['ভুলে যান', '#ff6b4a'], ['খোলা ২৪ ঘণ্টা', '#37e6ff'], ['ঢাকা ২০৮৭', '#ff4a8a'], ['চা • কফি', '#ffc857'], ['স্বপ্ন কেনাবেচা', '#c9a0ff'], ['আরোগ্য কেন্দ্র', '#8bff9f']];
  const EN_SIGNS = [['MEMORY CLINIC', '#37e6ff'], ['FORGET·ME·NOT', '#ff4a8a'], ['RECALL 24/7', '#ffc857'], ['MEMORY MARKET', '#ff4a8a']];

  M.buildCity = (scene, o) => {
    o = Object.assign({ z0: -14, rows: 5, width: 150, seed: 11, landmark: true, signs: true }, o || {});
    const rnd = MM.rng(o.seed), grp = new T.Group(); scene.add(grp);
    const texes = [M.windowTex('tower', 1), M.windowTex('tower', 2), M.windowTex('old', 3), M.windowTex('old', 4)];
    const roofMat = M.basic(0x0a0e18);
    const signMeshes = [];
    for (let r = 0; r < o.rows; r++) {
      let x = -o.width / 2 + rnd() * 5;
      const zRow = o.z0 - r * 14 - rnd() * 3;
      while (x < o.width / 2) {
        const old = r <= 1 && rnd() < 0.6;
        const w = 5 + rnd() * 8, d = 6 + rnd() * 6, h = old ? 7 + rnd() * 9 : 15 + rnd() * (26 + r * 16);
        const tex = texes[(old ? 2 : 0) + Math.floor(rnd() * 2)];
        const geo = new T.BoxGeometry(w, h, d);
        const uv = geo.attributes.uv;
        for (let i = 0; i < uv.count; i++) {
          const face = Math.floor(i / 4);
          const sx = (face === 0 || face === 1) ? d / (old ? 4.4 : 5) : (face === 4 || face === 5) ? w / (old ? 4.4 : 5) : 0;
          const sy = h / (old ? 6 : 12);
          if (face >= 2 && face <= 3) uv.setXY(i, 0.02, 0.02); else uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
        }
        const tint = new T.Color().setHSL(0.6 + rnd() * 0.08, 0.35, 0.55 + rnd() * 0.35);
        const sideMat = new T.MeshBasicMaterial({ map: tex, color: tint });
        const b = new T.Mesh(geo, [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat]);
        b.position.set(x + w / 2, h / 2 - 3, zRow);
        grp.add(b);
        // rooftop clutter
        if (rnd() < 0.5) M.cyl(0.9, 1.0, 1.6, 6, M.basic(0x1a2233), (rnd() - 0.5) * w * 0.5, h / 2 + 0.8, (rnd() - 0.5) * d * 0.5, b);
        if (rnd() < 0.4) M.cyl(0.05, 0.05, 4 + rnd() * 6, 4, M.basic(0x2a3348), (rnd() - 0.5) * w * 0.6, h / 2 + 3, 0, b);
        if (old && rnd() < 0.35) { const dome = new T.Mesh(new T.SphereGeometry(Math.min(w, d) * 0.28, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), M.basic(0x2b3556)); dome.position.set(0, h / 2, 0); b.add(dome); }
        if (o.signs && r < 3 && rnd() < 0.42 && signMeshes.length < 46) {
          const useBn = rnd() < 0.72, s = useBn ? BN_SIGNS[Math.floor(rnd() * BN_SIGNS.length)] : EN_SIGNS[Math.floor(rnd() * EN_SIGNS.length)];
          const sw = Math.min(w * 0.95, 5.5), sh = sw * 0.25;
          const sm = M.signMesh(s[0], sw, sh, { color: s[1], size: useBn ? 66 : 56, bn: useBn, w: 512 });
          sm.position.set(b.position.x + (rnd() - 0.5) * 1.5, Math.max(4, Math.min(h * 0.55, 3 + rnd() * h * 0.6)) - 3, zRow + d / 2 + 0.06);
          grp.add(sm); signMeshes.push(sm);
        }
        x += w + 0.6 + rnd() * 2.2;
      }
    }
    // landmark: pink-palace-inspired arcaded building with dome (old Dhaka)
    if (o.landmark) {
      const lm = new T.Group(), pinkTex = M.windowTex('old', 9);
      const pm = new T.MeshBasicMaterial({ map: pinkTex, color: 0xd88ab4 });
      const geo = new T.BoxGeometry(22, 12, 9); const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) { const f = Math.floor(i / 4); if (f >= 2 && f <= 3) uv.setXY(i, .02, .02); else uv.setXY(i, uv.getX(i) * (f > 3 ? 5 : 2), uv.getY(i) * 2); }
      lm.add(new T.Mesh(geo, [pm, pm, roofMat, roofMat, pm, pm]));
      const dome = new T.Mesh(new T.SphereGeometry(3.6, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.basic(0xe8a5c8)); dome.position.y = 6; lm.add(dome);
      const drum = M.cyl(3.2, 3.4, 1.6, 10, M.basic(0xb56b92), 0, 6.2, 0, lm); drum.position.y = 6;
      M.cyl(0.06, 0.06, 2.6, 4, M.basic(0xffd58a), 0, 10.6, 0, lm);
      const halo = M.glowSprite(0xff7ab6, 30, 0.35); halo.position.set(0, 6, 5); lm.add(halo);
      lm.position.set(6, 3, -30); grp.add(lm);
    }
    // cables between near buildings
    const cabMat = new T.LineBasicMaterial({ color: 0x0b0f18 });
    for (let i = 0; i < 14; i++) {
      const x0 = -40 + rnd() * 80, y0 = 6 + rnd() * 14, z0 = o.z0 + 2 - rnd() * 10;
      const pts = []; const x1 = x0 + 10 + rnd() * 20, y1 = y0 + (rnd() - 0.5) * 4;
      for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new T.Vector3(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 1.8, z0)); }
      grp.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), cabMat));
    }
    // flying rickshaw-drones
    const flyers = [];
    for (let i = 0; i < 9; i++) {
      const f = new T.Group();
      M.box(1.4, 0.3, 0.7, M.basic([0xff4a8a, 0x37e6ff, 0xffc857, 0x8bff9f][i % 4]), 0, 0, 0, f);
      const hood = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.9, 6, 1, false, 0, Math.PI), M.basic(0x2a3358)); hood.rotation.z = Math.PI / 2; hood.rotation.y = 0; hood.position.set(0, 0.3, 0); f.add(hood);
      const l = M.glowSprite([0xff4a8a, 0x37e6ff, 0xffc857][i % 3], 4.2, 0.9); l.position.set(0.9, 0, 0); f.add(l);
      const dir = i % 2 ? 1 : -1;
      f.position.set(-60 + rnd() * 120, 7 + rnd() * 20, o.z0 - 6 - rnd() * 34);
      f.userData = { v: dir * (2.5 + rnd() * 3.5), ph: rnd() * 6 };
      f.scale.x = dir; grp.add(f); flyers.push(f);
    }
    return {
      group: grp,
      update(dt, t) {
        flyers.forEach((f) => { f.position.x += f.userData.v * dt; f.position.y += Math.sin(t * 0.8 + f.userData.ph) * dt * 0.4; if (f.position.x > 70) f.position.x = -70; if (f.position.x < -70) f.position.x = 70; });
        signMeshes.forEach((s, i) => { s.material.opacity = (Math.sin(t * 2.2 + i * 1.7) > 0.96 && (i % 5 === 0)) ? 0.35 : 1; });
      }
    };
  };

  // ---------- rain ----------
  M.buildRain = (scene, b, count, color) => {
    if (MM.lowPower) count = Math.round(count * 0.45);
    const pos = new Float32Array(count * 6), sp = new Float32Array(count);
    const rnd = MM.rng(5);
    for (let i = 0; i < count; i++) {
      const x = b.x0 + rnd() * (b.x1 - b.x0), y = b.y0 + rnd() * (b.y1 - b.y0), z = b.z0 + rnd() * (b.z1 - b.z0);
      pos.set([x, y, z, x - 0.08, y - 0.75, z], i * 6); sp[i] = 16 + rnd() * 10;
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const lines = new T.LineSegments(geo, new T.LineBasicMaterial({ color: color || 0xa9c9ff, transparent: true, opacity: 0.32, depthWrite: false }));
    lines.frustumCulled = false; scene.add(lines);
    return {
      lines,
      update(dt) {
        for (let i = 0; i < count; i++) {
          const k = i * 6, d = sp[i] * dt;
          pos[k + 1] -= d; pos[k + 4] -= d; pos[k] -= d * 0.1; pos[k + 3] -= d * 0.1;
          if (pos[k + 1] < b.y0) { const ny = b.y1; pos[k + 1] = ny; pos[k + 4] = ny - 0.75; const nx = b.x0 + Math.random() * (b.x1 - b.x0); pos[k] = nx; pos[k + 3] = nx - 0.08; }
        }
        geo.attributes.position.needsUpdate = true;
      }
    };
  };

  // window glass with droplets
  M.glassPane = (w, h, x, y, z, parent) => {
    const tex = MM.canvasTex(128, 256, (g, cw, ch) => {
      const rnd = MM.rng(3);
      g.fillStyle = 'rgba(120,170,220,0.10)'; g.fillRect(0, 0, cw, ch);
      for (let i = 0; i < 70; i++) {
        const x2 = rnd() * cw, y2 = rnd() * ch, r = 1 + rnd() * 2.6;
        g.fillStyle = 'rgba(200,225,255,.42)'; g.beginPath(); g.arc(x2, y2, r, 0, 6.28); g.fill();
        if (rnd() < 0.5) { g.strokeStyle = 'rgba(200,225,255,.22)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 + (rnd() - 0.5) * 3, y2 - 10 - rnd() * 40); g.stroke(); }
      }
    }, { repeat: true });
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.position.set(x, y, z); if (parent) parent.add(m); m.userData.tex = tex; return m;
  };

  // ---------- humans ----------
  M.human = (o) => {
    o = Object.assign({ skin: 0xb98a68, top: 0xd9d3c2, bottom: 0x39404c, hair: 0x2b2b2b, beard: null, cap: null, kurta: true, scale: 0.9, blurFace: false, ghost: false }, o || {});
    const mk = (c) => o.ghost ? new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55 }) : M.std(c);
    const g = new T.Group(), P = {};
    const skin = mk(o.skin), top = mk(o.top), bot = mk(o.bottom), hair = mk(o.hair);
    const pivot = (x, y) => { const p = new T.Group(); p.position.set(x, y, 0); g.add(p); return p; };
    P.legL = pivot(-0.12, 0.9); M.box(0.17, 0.9, 0.2, bot, 0, -0.45, 0, P.legL); M.box(0.19, 0.08, 0.3, mk(0x1a1a1a), 0, -0.9, 0.05, P.legL);
    P.legR = pivot(0.12, 0.9); M.box(0.17, 0.9, 0.2, bot, 0, -0.45, 0, P.legR); M.box(0.19, 0.08, 0.3, mk(0x1a1a1a), 0, -0.9, 0.05, P.legR);
    P.torso = M.box(0.5, 0.78, 0.3, top, 0, 1.3, 0, g);
    if (o.kurta) M.box(0.54, 0.42, 0.33, top, 0, 0.92, 0, g);
    P.head = new T.Group(); P.head.position.set(0, 1.86, 0); g.add(P.head);
    const hd = new T.Mesh(new T.IcosahedronGeometry(0.17, 0), skin); hd.scale.set(1, 1.12, 1); P.head.add(hd);
    if (o.hair !== null) { const hr = new T.Mesh(new T.SphereGeometry(0.18, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), hair); hr.position.set(0, 0.03, -0.01); hr.scale.set(1, 0.9, 1.05); P.head.add(hr); }
    if (o.beard) M.box(0.2, 0.13, 0.1, mk(o.beard), 0, -0.1, 0.1, P.head);
    if (o.cap) M.cyl(0.155, 0.175, 0.09, 8, mk(o.cap), 0, 0.15, 0, P.head);
    if (!o.ghost) { M.box(0.03, 0.03, 0.02, M.basic(0x111111), -0.06, 0.03, 0.165, P.head); M.box(0.03, 0.03, 0.02, M.basic(0x111111), 0.06, 0.03, 0.165, P.head); }
    P.armL = pivot(-0.34, 1.62); M.box(0.13, 0.72, 0.15, top, 0, -0.36, 0, P.armL); M.box(0.12, 0.12, 0.13, skin, 0, -0.76, 0, P.armL);
    P.armR = pivot(0.34, 1.62); M.box(0.13, 0.72, 0.15, top, 0, -0.36, 0, P.armR); M.box(0.12, 0.12, 0.13, skin, 0, -0.76, 0, P.armR);
    g.scale.setScalar(o.scale); g.userData.parts = P;
    return g;
  };

  M.walker = (grp) => {
    const P = grp.userData.parts, st = { path: [], res: null, t: 0, speed: 1.1, walking: false, faceTo: null, onStep: null, stepT: 0 };
    st.walkTo = (x, z, speed) => new Promise((res) => { st.path.push({ x, z, speed: speed || 1.1, res }); });
    st.face = (x, z) => { st.faceTo = { x, z }; };
    st.update = (dt, t) => {
      const cur = st.path[0];
      st.walking = false;
      if (cur) {
        const dx = cur.x - grp.position.x, dz = cur.z - grp.position.z, dist = Math.hypot(dx, dz);
        if (dist < 0.06) { st.path.shift(); cur.res(); }
        else {
          const sp = cur.speed * dt; grp.position.x += dx / dist * Math.min(sp, dist); grp.position.z += dz / dist * Math.min(sp, dist);
          const target = Math.atan2(dx, dz); let d = target - grp.rotation.y; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
          grp.rotation.y += d * Math.min(1, dt * 7); st.walking = true; st.faceTo = null;
          st.stepT += dt * cur.speed;
          if (st.stepT > 0.62) { st.stepT = 0; if (st.onStep) st.onStep(); }
        }
      }
      if (!cur && st.faceTo) {
        const target = Math.atan2(st.faceTo.x - grp.position.x, st.faceTo.z - grp.position.z); let d = target - grp.rotation.y;
        while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; grp.rotation.y += d * Math.min(1, dt * 4);
      }
      const sw = st.walking ? Math.sin(t * 7.5) * 0.55 : 0;
      P.legL.rotation.x += (sw - P.legL.rotation.x) * Math.min(1, dt * 10);
      P.legR.rotation.x += (-sw - P.legR.rotation.x) * Math.min(1, dt * 10);
      P.armL.rotation.x += (-sw * 0.8 - P.armL.rotation.x) * Math.min(1, dt * 10);
      P.armR.rotation.x += (sw * 0.8 - P.armR.rotation.x) * Math.min(1, dt * 10);
      P.torso.scale.y = 1 + Math.sin(t * 1.6) * 0.008;
      P.head.rotation.x = Math.sin(t * 0.6) * 0.03 + (st.walking ? 0 : 0.10); // slightly bowed
    };
    return st;
  };

  // ---------- props ----------
  M.ceilingFan = (parent, x, y, z, color) => {
    const g = new T.Group(); g.position.set(x, y, z); parent.add(g);
    M.cyl(0.03, 0.03, 0.35, 5, M.std(0x222222), 0, 0.17, 0, g); M.cyl(0.14, 0.14, 0.1, 8, M.std(0x333a44), 0, 0, 0, g);
    const blades = new T.Group(); g.add(blades);
    for (let i = 0; i < 3; i++) { const b = M.box(0.95, 0.02, 0.2, M.std(color || 0x6e5a44), 0.55, 0, 0, null); const p = new T.Group(); p.rotation.y = i * Math.PI * 2 / 3; p.add(b); blades.add(p); }
    return { group: g, blades };
  };
  M.floaters = (scene, box, count, color, size) => {
    if (MM.lowPower) count = Math.round(count * 0.5);
    const pos = new Float32Array(count * 3), base = new Float32Array(count * 3), ph = new Float32Array(count);
    const rnd = MM.rng(21);
    for (let i = 0; i < count; i++) { const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0), z = box.z0 + rnd() * (box.z1 - box.z0); base.set([x, y, z], i * 3); pos.set([x, y, z], i * 3); ph[i] = rnd() * 6.28; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ map: M.glowTex(), color: color || 0xffd9a0, size: size || 0.09, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false }));
    pts.frustumCulled = false; scene.add(pts);
    return { pts, update(dt, t) { for (let i = 0; i < count; i++) { pos[i * 3] = base[i * 3] + Math.sin(t * 0.3 + ph[i]) * 0.35; pos[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.22 + ph[i] * 2) * 0.3 + Math.sin(t * 0.5 + i) * 0.05; pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.27 + ph[i]) * 0.35; } geo.attributes.position.needsUpdate = true; } };
  };
  M.paperBoat = (mat) => {
    const g = new T.Group();
    const geo = new T.BufferGeometry();
    const v = new Float32Array([-0.18, 0, 0, 0.18, 0, 0, 0, 0.1, 0.06, -0.18, 0, 0, 0, 0.1, -0.06, 0.18, 0, 0, -0.18, 0, 0, 0, 0.1, 0.06, 0, 0.1, -0.06, 0.18, 0, 0, 0, 0.1, -0.06, 0, 0.1, 0.06,
      -0.02, 0.1, 0.06, 0, 0.26, 0, 0.02, 0.1, 0.06, -0.02, 0.1, -0.06, 0.02, 0.1, -0.06, 0, 0.26, 0]);
    geo.setAttribute('position', new T.BufferAttribute(v, 3)); geo.computeVertexNormals();
    const m = new T.Mesh(geo, mat || new T.MeshStandardMaterial({ color: 0xf1e7cf, side: T.DoubleSide, flatShading: true, roughness: 0.9 })); g.add(m); return g;
  };
  M.wallClock = (parent, x, y, z, ry) => {
    const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; parent.add(g);
    M.cyl(0.32, 0.32, 0.06, 16, M.std(0x2b2018), 0, 0, 0, g).rotation.x = Math.PI / 2;
    const face = M.cyl(0.28, 0.28, 0.02, 16, M.std(0xe8dfc8), 0, 0, 0.035, g); face.rotation.x = Math.PI / 2;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; M.box(0.02, i % 3 === 0 ? 0.07 : 0.035, 0.01, M.basic(0x222222), Math.sin(a) * 0.23, Math.cos(a) * 0.23, 0.05, g).rotation.z = -a; }
    const hh = new T.Group(), mh = new T.Group(); hh.position.z = 0.06; mh.position.z = 0.07; g.add(hh); g.add(mh);
    M.box(0.025, 0.15, 0.01, M.basic(0x111111), 0, 0.075, 0, hh); M.box(0.016, 0.23, 0.01, M.basic(0x111111), 0, 0.115, 0, mh);
    return { group: g, set(h, m) { hh.rotation.z = -((h % 12) + m / 60) / 12 * Math.PI * 2; mh.rotation.z = -m / 60 * Math.PI * 2; } };
  };
})();
