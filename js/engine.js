/* MEMORY MARKET — engine: renderer, post-processing, first-person controller, interaction */
(function () {
  const MM = window.MM, T = THREE, M = MM.Models;
  const E = MM.Engine = {};
  let renderer, camera, rt, postScene, postCam, postMat, canvas, cur = null;
  let last = 0, time = 0, locked = false, dragging = false, started = false;
  const keys = {};
  const listeners = {};
  MM.on = (e, fn) => { (listeners[e] = listeners[e] || []).push(fn); };
  MM.emit = (e, a, b) => { (listeners[e] || []).forEach((f) => f(a, b)); };

  // post-processing state (current values ease toward targets)
  const fx = MM.fx = { glitch: 0, chroma: 0.0016, desat: 0, vignette: 1.0, noise: 0.03, flash: 0, analyzer: 0, warp: 0, scan: 0, bloom: 1, tr: 1, tg: 1, tb: 1, fade: 0 };
  const fxT = MM.fxT = Object.assign({}, fx);
  E.fxSet = (o, snap) => { Object.assign(fxT, o); if (snap) Object.assign(fx, o); };
  E.glitch = (strength, decay) => { fx.glitch = Math.max(fx.glitch, strength); E._gdecay = decay || 5; };

  const P = MM.Player = { pos: new T.Vector3(0, 1.65, 0), yaw: 0, pitch: 0, bob: 0, vel: new T.Vector3(), sprint: false };

  const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const FRAG = `
    uniform sampler2D tDiffuse; uniform float uTime, uGlitch, uChroma, uDesat, uVignette, uNoise, uFlash, uAnalyzer, uWarp, uScan, uBloom;
    uniform vec3 uTint; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      uv += vec2(sin(uv.y * 20.0 + uTime * 2.0), cos(uv.x * 15.0 + uTime * 1.6)) * 0.0035 * uWarp;
      float g = uGlitch;
      if (g > 0.001) {
        float tt = floor(uTime * 14.0);
        float band = floor(uv.y * 26.0 + tt * 3.7);
        float r = hash(vec2(band, tt));
        if (r > 1.0 - 0.4 * g) uv.x += (hash(vec2(band, tt + 3.0)) - 0.5) * 0.18 * g;
        if (hash(vec2(tt, 9.0)) > 1.0 - 0.15 * g) uv.y = fract(uv.y + 0.02 * g);
      }
      float ca = uChroma + g * 0.014;
      vec2 dir = uv - 0.5;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + dir * ca).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - dir * ca).b;
      // cheap bloom
      vec3 bl = vec3(0.0);
      vec2 asp = vec2(uRes.y / uRes.x, 1.0);
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.785398;
        vec2 o = vec2(cos(a), sin(a)) * asp;
        bl += max(texture2D(tDiffuse, uv + o * 0.006).rgb - 0.5, 0.0);
        bl += max(texture2D(tDiffuse, uv + o * 0.016).rgb - 0.5, 0.0) * 0.7;
      }
      col += bl * uBloom * 0.20;
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, vec3(l), uDesat);
      col *= mix(vec3(1.0), uTint, 0.75);
      if (uAnalyzer > 0.001) {
        vec3 an = vec3(0.10, 1.0, 0.62) * (l * 1.5 + 0.05);
        float grid = step(0.96, fract(uv.x * 40.0)) + step(0.96, fract(uv.y * 24.0));
        col = mix(col, an + grid * 0.10 * vec3(0.2, 1.0, 0.7), uAnalyzer * 0.72);
      }
      col += uScan * 0.05 * sin(uv.y * uRes.y * 1.4 + uTime * 6.0);
      float v = smoothstep(1.05, 0.28, length(uv - 0.5) * 1.25 * uVignette);
      col *= mix(0.25, 1.0, v);
      col += (hash(uv * uRes + uTime) - 0.5) * uNoise;
      col = pow(max(col, 0.0), vec3(0.88));
      col = mix(col, vec3(1.0), uFlash);
      gl_FragColor = vec4(col, 1.0);
    }`;

  function makeRT(w, h) {
    if (rt) rt.dispose();
    const opts = { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat };
    try {
      if (renderer.capabilities.isWebGL2 && T.WebGLMultisampleRenderTarget) { rt = new T.WebGLMultisampleRenderTarget(w, h, opts); rt.samples = 4; }
      else rt = new T.WebGLRenderTarget(w, h, opts);
    } catch (e) { rt = new T.WebGLRenderTarget(w, h, opts); }
    if (postMat) postMat.uniforms.tDiffuse.value = rt.texture;
  }

  E.init = (cv) => {
    canvas = cv;
    renderer = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x05070c, 1);
    camera = new T.PerspectiveCamera(72, 1, 0.05, 420); camera.rotation.order = 'YXZ';
    postScene = new T.Scene(); postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    postMat = new T.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false,
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGlitch: { value: 0 }, uChroma: { value: 0 }, uDesat: { value: 0 }, uVignette: { value: 1 }, uNoise: { value: 0 }, uFlash: { value: 0 }, uAnalyzer: { value: 0 }, uWarp: { value: 0 }, uScan: { value: 0 }, uBloom: { value: 1 }, uTint: { value: new T.Vector3(1, 1, 1) }, uRes: { value: new T.Vector2(1, 1) } }
    });
    postScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), postMat));
    E.resize();
    window.addEventListener('resize', E.resize);
    bindInput();
    requestAnimationFrame(loop);
  };
  E.resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const s = renderer.getPixelRatio(); makeRT(Math.floor(w * s), Math.floor(h * s));
    postMat.uniforms.uRes.value.set(w * s, h * s);
  };
  E.camera = () => camera;
  E.scene = () => cur;
  E.time = () => time;
  E.markStarted = () => { started = true; };

  // ---------- scene management ----------
  E.loadScene = (S, o) => {
    o = o || {};
    if (cur && cur.markers) cur.markers.forEach((m) => cur.scene.remove(m));
    if (S.markers) S.markers.forEach((m) => S.scene.remove(m));
    cur = S;
    S.markers = [];
    (S.interactables || []).forEach((it) => {
      it.pos = it.pos || new T.Vector3(); it.dist = it.dist || 2.5; it.cone = it.cone || 0.93;
      const s = M.glowSprite(0x3fd7c6, 0.26, 0); s.material.depthTest = false; s.renderOrder = 999; s.position.copy(it.pos); S.scene.add(s); it.marker = s; S.markers.push(s);
    });
    const sp = o.spawn || S.spawn || { x: 0, z: 0, yaw: 0 };
    P.pos.set(sp.x, 1.65, sp.z); P.yaw = sp.yaw || 0; P.pitch = 0; P.vel.set(0, 0, 0);
    if (S.fx) E.fxSet(S.fx, !!o.snapFx);
    if (S.onEnter) S.onEnter();
    E.target = null;
  };
  E.current = () => cur;

  E.use = (it) => {
    if (!cur || !cur.onInteract) return;
    MM.Audio.click();
    it.done = it.done || false;
    cur.onInteract(it.id, it);
  };
  E.enable = (id, on) => { const it = cur && cur.interactables.find((x) => x.id === id); if (it) it.off = !on; };

  // ---------- mode & pointer lock ----------
  MM.setMode = (m) => {
    const prev = MM.mode; MM.mode = m;
    if (m === 'play') { E.relock(); }
    else if (m === 'ui' || m === 'debate' || m === 'title' || m === 'end') { E.unlock(); }
    if (m !== 'play') { MM.UI.prompt(''); MM.UI.lockHint(false); }
    MM.emit('mode', m, prev);
  };
  E.unlock = () => { if (document.pointerLockElement) { E._intent = true; try { document.exitPointerLock(); } catch (e) { } } };
  E.relock = () => {
    if (MM.mode !== 'play' || document.pointerLockElement === canvas) return;
    try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
    setTimeout(() => { if (MM.mode === 'play' && document.pointerLockElement !== canvas && started && !MM.paused) MM.UI.lockHint(true); }, 350);
  };
  function showPause(on) {
    const p = document.getElementById('pause'); if (p) p.classList.toggle('on', on);
    MM.paused = on;
  }
  E.resume = () => { showPause(false); MM.Audio.init(); E.relock(); };

  function bindInput() {
    window.addEventListener('keydown', (e) => {
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown'].includes(e.code) && MM.mode !== 'title') { if (!(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'))) e.preventDefault(); }
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      keys[e.code] = true;
      if (e.code === 'Tab') { if (MM.mode === 'play' || MM.UI.journalOpen) MM.UI.toggleJournal(); }
      if (e.code === 'KeyE' && MM.mode === 'play' && !MM.paused && E.target) { E.use(E.target); }
      if (e.code === 'KeyQ' && MM.mode === 'play' && !MM.paused) MM.emit('analyzer');
    });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    window.addEventListener('blur', () => { Object.keys(keys).forEach((k) => keys[k] = false); });
    canvas.addEventListener('mousedown', () => {
      dragging = true;
      if (MM.mode === 'play' && !MM.paused && document.pointerLockElement !== canvas) { MM.UI.lockHint(false); E.relock(); }
    });
    window.addEventListener('mouseup', () => { dragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (MM.mode !== 'play' || MM.paused) return;
      if (document.pointerLockElement === canvas || dragging) {
        P.yaw -= (e.movementX || 0) * 0.0022; P.pitch = MM.clamp(P.pitch - (e.movementY || 0) * 0.0022, -1.4, 1.4);
      }
    });
    document.addEventListener('pointerlockchange', () => {
      locked = document.pointerLockElement === canvas;
      if (locked) { MM.UI.lockHint(false); showPause(false); }
      else if (E._intent) { E._intent = false; }
      else if (MM.mode === 'play' && started) { showPause(true); }
    });
  }

  // ---------- player ----------
  function movePlayer(dx, dz) {
    const S = cur, r = 0.3, b = S.bounds;
    let x = P.pos.x + dx, z = P.pos.z + dz;
    x = MM.clamp(x, b.minX, b.maxX); z = MM.clamp(z, b.minZ, b.maxZ);
    for (const c of S.colliders) {
      if (c.off) continue;
      const cx = MM.clamp(x, c.minX, c.maxX), cz = MM.clamp(z, c.minZ, c.maxZ);
      const ddx = x - cx, ddz = z - cz, d2 = ddx * ddx + ddz * ddz;
      if (d2 < r * r) {
        if (d2 > 1e-6) { const d = Math.sqrt(d2); x = cx + ddx / d * r; z = cz + ddz / d * r; }
        else {
          const l = x - c.minX, rr = c.maxX - x, tp = z - c.minZ, bt = c.maxZ - z, mn = Math.min(l, rr, tp, bt);
          if (mn === l) x = c.minX - r; else if (mn === rr) x = c.maxX + r; else if (mn === tp) z = c.minZ - r; else z = c.maxZ + r;
        }
      }
    }
    P.pos.x = x; P.pos.z = z;
  }

  let stepT = 0;
  function updatePlayer(dt) {
    if (MM.mode === 'play' && !MM.paused) {
      const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      if (keys.ArrowLeft) P.yaw += dt * 1.9; if (keys.ArrowRight) P.yaw -= dt * 1.9;
      if (keys.ArrowUp) P.pitch = Math.min(1.4, P.pitch + dt * 1.4); if (keys.ArrowDown) P.pitch = Math.max(-1.4, P.pitch - dt * 1.4);
      const sp = (keys.ShiftLeft || keys.ShiftRight) ? 4.0 : 2.5;
      let wx = 0, wz = 0;
      if (f || s) {
        const len = Math.hypot(f, s);
        wx = (-Math.sin(P.yaw) * f + Math.cos(P.yaw) * s) / len; wz = (-Math.cos(P.yaw) * f - Math.sin(P.yaw) * s) / len;
      }
      P.vel.x += (wx * sp - P.vel.x) * Math.min(1, dt * 10); P.vel.z += (wz * sp - P.vel.z) * Math.min(1, dt * 10);
      const speed = Math.hypot(P.vel.x, P.vel.z);
      if (speed > 0.01) movePlayer(P.vel.x * dt, P.vel.z * dt);
      if (speed > 0.6) { P.bob += dt * speed * 2.6; stepT += dt * speed; if (stepT > 1.6) { stepT = 0; MM.Audio.step(); } }
    } else { P.vel.multiplyScalar(0.8); }
    camera.position.set(P.pos.x, 1.65 + Math.sin(P.bob) * 0.022 * Math.min(1, Math.hypot(P.vel.x, P.vel.z) / 2), P.pos.z);
    camera.rotation.y = P.yaw; camera.rotation.x = P.pitch;
    if (P.roll) camera.rotation.z = P.roll; else camera.rotation.z = 0;
  }

  const fwd = new T.Vector3(), tmp = new T.Vector3();
  function updateInteraction(t) {
    const S = cur; let best = null, bestScore = -1;
    camera.getWorldDirection(fwd);
    if (MM.mode === 'play' && !MM.paused && !MM.busy) {
      for (const it of S.interactables) {
        if (it.off || (it.enabled && !it.enabled())) continue;
        tmp.copy(it.pos).sub(camera.position); const d = tmp.length(); if (d > it.dist) continue;
        tmp.normalize(); const dot = tmp.dot(fwd);
        if (dot < it.cone) continue;
        const score = dot - d * 0.02; if (score > bestScore) { bestScore = score; best = it; }
      }
    }
    E.target = best;
    if (best) { const lab = typeof best.label === 'function' ? best.label() : best.label; MM.UI.prompt('<b>E</b>&nbsp; ' + lab, true); }
    else if (MM.mode === 'play' || MM.busy) MM.UI.prompt('');
    for (const it of S.interactables) {
      const s = it.marker; if (!s) continue;
      const off = it.off || (it.enabled && !it.enabled()) || MM.mode !== 'play';
      tmp.copy(it.pos).sub(camera.position); const d = tmp.length();
      const want = off ? 0 : (it.done ? 0.22 : (0.5 + Math.sin(t * 3 + it.pos.x) * 0.2)) * MM.clamp(1.2 - d / 9, 0, 1) * (it === best ? 1.6 : 1);
      s.material.opacity += (want - s.material.opacity) * 0.15;
      s.material.color.setHex(it.done ? 0xf2a93b : 0x3fd7c6);
      const sc = 0.2 + (it === best ? 0.12 : 0); s.scale.set(sc, sc, 1);
    }
  }

  // ---------- main loop ----------
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(window.__dtcap || 0.05, (now - last) / 1000 || 0.016); last = now;
    MM.updateTweens(dt);
    if (!cur) { renderer.setRenderTarget(null); renderer.clear(); return; }
    if (!MM.paused) {
      time += dt;
      updatePlayer(dt);
      cur.update && cur.update(dt, time);
      updateInteraction(time);
    }
    // ease fx toward targets
    const ke = 1 - Math.exp(-dt * 2.6);
    for (const k in fxT) { if (k === 'glitch') continue; fx[k] += (fxT[k] - fx[k]) * ke; }
    fx.glitch += (fxT.glitch - fx.glitch) * (1 - Math.exp(-dt * (E._gdecay || 5)));
    const u = postMat.uniforms;
    u.uTime.value = time; u.uGlitch.value = fx.glitch; u.uChroma.value = fx.chroma; u.uDesat.value = fx.desat; u.uVignette.value = fx.vignette;
    u.uNoise.value = fx.noise; u.uFlash.value = fx.flash; u.uAnalyzer.value = fx.analyzer; u.uWarp.value = fx.warp; u.uScan.value = fx.scan; u.uBloom.value = fx.bloom;
    u.uTint.value.set(fx.tr, fx.tg, fx.tb);
    renderer.setRenderTarget(rt); renderer.render(cur.scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  }
})();
