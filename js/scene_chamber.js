/* MEMORY MARKET — Chapter 6 (The Argument): MNEMOS chamber */
(function () {
  const MM = window.MM, T = THREE, M = MM.Models, UI = MM.UI, A = MM.Audio, E = MM.Engine, D = MM.Data;
  MM.Scenes = MM.Scenes || {};
  let S = null;

  function cardTex(ev) {
    return MM.canvasTex(256, 160, (g, w, h) => {
      g.fillStyle = 'rgba(20,14,4,.88)'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f2a93b'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
      g.fillStyle = '#f2a93b'; g.font = '700 16px Consolas,monospace'; g.fillText('FRAGMENT ' + ev.id, 12, 26);
      g.fillStyle = '#e3ebee'; g.font = '600 17px "Segoe UI",sans-serif';
      const words = ev.title.split(' '); let line = '', y = 56;
      words.forEach((wd) => { const t = line + wd + ' '; if (g.measureText(t).width > w - 24) { g.fillText(line, 12, y); line = wd + ' '; y += 22; } else line = t; });
      g.fillText(line, 12, y);
    });
  }

  const Chamber = MM.Chamber = {
    build() {
      const scene = new T.Scene(); scene.background = new T.Color(0x010308); scene.fog = new T.FogExp2(0x02050c, 0.03);
      const st = { conf: 94, tc: 94, mode: 'idle', k: 0, pulse: 0 };
      scene.add(new T.HemisphereLight(0x405a80, 0x05070c, 0.4));
      const light = new T.PointLight(0xa9dcff, 2.0, 30, 1.2); light.position.set(0, 3, -2); scene.add(light);
      // floor
      const floor = M.cyl(9, 9, 0.1, 48, new T.MeshStandardMaterial({ color: 0x060b14, roughness: 0.25, metalness: 0.8 }), 0, -0.05, -2, scene);
      const ringMats = [];
      for (let i = 1; i <= 5; i++) { const r = new T.Mesh(new T.RingGeometry(i * 1.6, i * 1.6 + 0.03, 64), new T.MeshBasicMaterial({ color: 0x8fc8ff, transparent: true, opacity: 0.35 - i * 0.04, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.set(0, 0.012, -2); scene.add(r); ringMats.push(r.material); }
      // sphere
      const sph = new T.Group(); sph.position.set(0, 3, -2); scene.add(sph);
      const core = M.glowSprite(0xdff2ff, 4.6, 0.95); sph.add(core);
      const shell = new T.Mesh(new T.IcosahedronGeometry(1.5, 2), new T.MeshBasicMaterial({ color: 0xa9dcff, wireframe: true, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false })); sph.add(shell);
      const inner = new T.Mesh(new T.IcosahedronGeometry(1.05, 1), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false })); sph.add(inner);
      const rings = [0, 1, 2].map((i) => { const r = new T.Mesh(new T.TorusGeometry(2.0 + i * 0.35, 0.012, 6, 64), new T.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.6 })); r.rotation.set(1 + i * 0.6, i * 0.9, 0); sph.add(r); return r; });
      // fragments
      const ids = MM.State.list(), cards = [];
      ids.forEach((id, i) => {
        const m = new T.Mesh(new T.PlaneGeometry(1.0, 0.625), new T.MeshBasicMaterial({ map: cardTex(D.EV[id]), transparent: true, side: T.DoubleSide, opacity: 0.95 }));
        m.userData = { id, a: i / ids.length * Math.PI * 2, r: 4.6 + (i % 3) * 0.5, y: 2.2 + (i % 4) * 0.55, boost: 0, sp: 0.06 + (i % 3) * 0.02 };
        scene.add(m); cards.push(m);
      });
      const floats = M.floaters(scene, { x0: -8, x1: 8, y0: 0.3, y1: 7, z0: -10, z1: 6 }, 140, 0xa9dcff, 0.08);
      const Pl = MM.Player;
      S = Chamber.S = {
        scene, st, cards, sph, interactables: [], colliders: [], bounds: { minX: -4, maxX: 4, minZ: -3, maxZ: 8 }, spawn: { x: 0, z: 6.5, yaw: 0 },
        fx: { glitch: 0, chroma: 0.003, desat: 0.1, vignette: 1.2, noise: 0.03, flash: 0, analyzer: 0, warp: 0.3, scan: 0.1, bloom: 1.8, tr: 0.95, tg: 1, tb: 1.08 },
        onInteract() { }, onEnter() { },
        update(dt, t) {
          st.conf += (st.tc - st.conf) * Math.min(1, dt * 1.5);
          const hi = MM.clamp((st.conf - 5) / 94, 0, 1);       // 1 = fully confident
          const modeK = st.k;
          let scale = 0.75 + hi * 0.35 + st.pulse * 0.12, op = 0.25 + hi * 0.35;
          const col = new T.Color().setHSL(0.56 + (1 - hi) * 0.05, 0.75, 0.62 + 0.1 * hi);
          if (st.mode === 'A') { scale = MM.lerp(scale, 0.25, modeK); op = MM.lerp(op, 0.05, modeK); col.setHex(0xffc978); light.color.setHex(0xffb060); }
          else if (st.mode === 'B') { scale = MM.lerp(scale, 0.55, modeK); op = MM.lerp(op, 0.08, modeK); col.lerp(new T.Color(0x6a7684), modeK); }
          else if (st.mode === 'C') { scale = MM.lerp(scale, 2.4, modeK); op = MM.lerp(op, 0.9, modeK); col.lerp(new T.Color(0xffffff), modeK); }
          else light.color.copy(col);
          st.pulse *= 0.94;
          sph.scale.setScalar(scale); shell.material.opacity = op + 0.15; shell.material.color.copy(col); core.material.color.copy(col); core.material.opacity = 0.4 + hi * 0.5 + (st.mode === 'C' ? modeK * 0.3 : 0);
          shell.rotation.y += dt * (0.25 + hi * 0.3) * (st.mode === 'B' ? 1 - modeK : 1); shell.rotation.x += dt * 0.1;
          rings.forEach((r, i) => { r.rotation.z += dt * (0.3 + i * 0.2) * (st.mode === 'B' ? 1 - modeK : 1); r.material.color.copy(col); r.material.opacity = 0.6 * (st.mode === 'A' ? 1 - modeK : 1); });
          light.intensity = 1.2 + hi * 1.6 + st.pulse * 2;
          ringMats.forEach((m, i) => { m.color.copy(col); });
          cards.forEach((c, i) => {
            const u = c.userData; u.a += dt * u.sp * (st.mode === 'B' ? 1 - modeK * 0.8 : 1); u.boost *= 0.96;
            let r = u.r, y = u.y + Math.sin(t * 0.5 + i) * 0.12, s = 1, o = 0.95;
            if (u.boost > 0.02) { r = MM.lerp(u.r, 1.9, u.boost); s = 1 + u.boost * 0.4; }
            if (st.mode === 'A') { r = MM.lerp(r, 12, modeK); y += modeK * 6; o = 1 - modeK * 0.75; }
            if (st.mode === 'B') { y -= modeK * 1.2; o = 0.95 - modeK * 0.65; }
            if (st.mode === 'C') { r = MM.lerp(r, 0.2, modeK); s = 1 - modeK; o = 1 - modeK; }
            c.position.set(Math.cos(u.a) * r, y, -2 + Math.sin(u.a) * r); c.lookAt(0, y, -2); c.rotateY(Math.PI); c.scale.setScalar(Math.max(0.01, s)); c.material.opacity = o;
          });
          floats.update(dt, t);
          if (E.current() === S && MM.mode === 'debate') Pl.pos.x = Math.sin(t * 0.13) * 0.3;
        }
      };
      return S;
    },
    setConf(c) { if (S) S.st.tc = c; },
    pulse() { if (S) { S.st.pulse = 1; A.pulse(); } },
    feed(ids, strong) {
      if (!S) return;
      S.cards.forEach((c) => { if (ids.includes(c.userData.id)) c.userData.boost = 1; });
      if (strong) { E.glitch(0.35, 6); A.glitch(0.2); } A.pulse();
    },
    async mode(m, dur) { if (!S) return; S.st.mode = m; S.st.k = 0; await MM.tween(S.st, 'k', 1, dur || 4); }
  };

  MM.Ch6 = {
    async run() {
      const F = MM.Flow;
      MM.State.chapter = 6; UI.refreshHUD();
      await F.card(6, 'The Argument', 'One question, and everything you found.');
      const S0 = Chamber.build();
      E.loadScene(S0, { snapFx: true }); A.scene('chamber', 1); UI.tools(''); UI.objective(''); UI.showHUD(false);
      MM.freeze(); await UI.fade(0, 2600);
      const n = MM.State.count();
      await UI.sayAll([['', 'No room. Only a floor, a silence, and something patient.'], ['MNEMOS', 'Welcome, M-09. I hoped we would speak again.'], ['MNEMOS', 'You are carrying ' + n + ' fragments of evidence. Let us examine whether they change my conclusion.'], ['MNEMOS', 'I will not lie, and I will not become angry. If I am wrong, I would like to be shown.']]);
      const result = await MM.Debate.run(Chamber);
      MM.State.debate = result;
      await MM.Endings.play(result, Chamber);
    }
  };
})();
