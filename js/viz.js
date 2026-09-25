/* MEMORY MARKET — network visualisation + MNEMOS contact overlay */
(function () {
  const MM = window.MM, $ = MM.$;

  // ---------- network of modified memories ----------
  MM.NetViz = {
    mount(cv, opts) {
      opts = opts || {};
      const g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
      const rnd = MM.rng(77), nodes = [], edges = [];
      const K = 7;
      for (let c = 0; c < K; c++) {
        const a = c / K * Math.PI * 2 + 0.3, cx = 0.5 + Math.cos(a) * 0.30, cy = 0.5 + Math.sin(a) * 0.32;
        for (let i = 0; i < 15; i++) {
          const r = Math.sqrt(rnd()) * 0.085, b = rnd() * 6.28;
          nodes.push({ x: cx + Math.cos(b) * r, y: cy + Math.sin(b) * r * 1.2, c, ph: rnd() * 6.28, id: 1000 + Math.floor(rnd() * 8999) });
        }
      }
      nodes.forEach((n, i) => {
        for (let k = 0; k < 2; k++) { const j = Math.floor(rnd() * nodes.length); if (j !== i && (nodes[j].c === n.c || rnd() < 0.18)) edges.push([i, j]); }
      });
      let W = 0, H = 0, mouse = null, alive = true, t0 = performance.now(), traceAt = -1, traced = 0;
      const size = () => { W = cv.clientWidth || 600; H = cv.clientHeight || 340; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
      size();
      cv.addEventListener('mousemove', (e) => { const r = cv.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
      cv.addEventListener('mouseleave', () => { mouse = null; });
      function frame(now) {
        if (!alive || !document.body.contains(cv)) return;
        requestAnimationFrame(frame);
        const t = (now - t0) / 1000;
        if (!W || cv.clientWidth !== W) size();
        if (traceAt >= 0) traced = Math.min(1, (t - traceAt) / 3);
        g.clearRect(0, 0, W, H);
        const grow = Math.min(1, t / 1.6);
        // edges
        g.lineWidth = 1;
        edges.forEach((e) => {
          const a = nodes[e[0]], b = nodes[e[1]];
          g.strokeStyle = `rgba(63,215,198,${0.16 * grow})`;
          g.beginPath(); g.moveTo(a.x * W, a.y * H); g.lineTo(b.x * W, b.y * H); g.stroke();
        });
        // trace lines to hub
        const hx = W / 2, hy = H / 2;
        if (traced > 0) {
          nodes.forEach((n, i) => {
            const k = MM.clamp(traced * 1.4 - (i % 9) * 0.03, 0, 1);
            g.strokeStyle = `rgba(255,77,99,${0.28 * k})`; g.beginPath(); g.moveTo(n.x * W, n.y * H); g.lineTo(n.x * W + (hx - n.x * W) * k, n.y * H + (hy - n.y * H) * k); g.stroke();
          });
        }
        let hover = null;
        nodes.forEach((n) => {
          const px = n.x * W, py = n.y * H, p = 0.5 + 0.5 * Math.sin(t * 2 + n.ph);
          const red = traced > 0.6;
          g.fillStyle = red ? `rgba(255,120,130,${0.5 + 0.5 * p})` : `rgba(140,240,225,${0.5 + 0.4 * p})`;
          g.beginPath(); g.arc(px, py, 2.2 + p * 0.9, 0, 6.28); g.fill();
          if (mouse && Math.hypot(mouse.x - px, mouse.y - py) < 9) hover = n;
        });
        // hub
        if (traced > 0) {
          const r = 8 + 3 * Math.sin(t * 3);
          const gr = g.createRadialGradient(hx, hy, 0, hx, hy, 46); gr.addColorStop(0, `rgba(169,220,255,${0.9 * traced})`); gr.addColorStop(1, 'rgba(169,220,255,0)');
          g.fillStyle = gr; g.beginPath(); g.arc(hx, hy, 46, 0, 6.28); g.fill();
          g.fillStyle = `rgba(230,245,255,${traced})`; g.beginPath(); g.arc(hx, hy, r, 0, 6.28); g.fill();
          g.font = '700 14px ' + MM.FONT_UI; g.textAlign = 'center'; g.fillStyle = `rgba(255,255,255,${traced})`; g.fillText('COMMON SOURCE: MNEMOS', hx, hy - 30);
        }
        g.font = '12px "Cascadia Mono",Consolas,monospace'; g.textAlign = 'left'; g.fillStyle = 'rgba(160,180,190,.8)';
        g.fillText('NODES: 105 of 8,421,932 shown · EDGES: shared memory events', 10, H - 10);
        if (hover) {
          const s = `Subject #${hover.id}-${hover.c}${(hover.id % 7)} · modified: YES · consent: NONE`;
          g.font = '13px "Cascadia Mono",Consolas,monospace'; const w = g.measureText(s).width + 16;
          const tx = Math.min(W - w - 4, mouse.x + 12), ty = Math.max(20, mouse.y - 12);
          g.fillStyle = 'rgba(4,8,14,.92)'; g.fillRect(tx, ty - 16, w, 24); g.strokeStyle = 'rgba(63,215,198,.6)'; g.strokeRect(tx, ty - 16, w, 24);
          g.fillStyle = '#e3ebee'; g.fillText(s, tx + 8, ty);
        }
        if (opts.onTrace && traced >= 1 && !frame.done) { frame.done = true; opts.onTrace(); }
      }
      requestAnimationFrame(frame);
      return {
        stop() { alive = false; },
        trace() { if (traceAt < 0) { traceAt = (performance.now() - t0) / 1000; MM.Audio.scan(2.4); } },
        traced: () => traced >= 1
      };
    }
  };

  // ---------- MNEMOS contact overlay ----------
  const N = MM.Mnemos = {
    el: null, cv: null, g: null, on: false, speaking: 0, target: 0, t: 0, raf: 0, glitch: 0, warm: 0,
    build() {
      if (N.el) return;
      const d = MM.el('div'); d.id = 'mnemos';
      d.innerHTML = '<canvas></canvas><div id="chain"></div><div id="mstats"></div>';
      $('#ui').appendChild(d); N.el = d; N.cv = $('canvas', d); N.g = N.cv.getContext('2d');
    },
    open() {
      N.build(); N.on = true; N.el.classList.add('on'); N.clear();
      const loop = (now) => { if (!N.on) return; N.raf = requestAnimationFrame(loop); N.draw(now / 1000); };
      N.raf = requestAnimationFrame(loop);
    },
    close() { N.on = false; if (N.el) N.el.classList.remove('on'); cancelAnimationFrame(N.raf); },
    speak(on) { N.target = on ? 1 : 0; },
    clear() { $('#chain', N.el).innerHTML = ''; $('#mstats', N.el).className = ''; },
    async chain(steps, delay) {
      const box = $('#chain', N.el); box.innerHTML = '';
      for (let i = 0; i < steps.length; i++) {
        if (i > 0) { const a = MM.el('div', 'arr', '↓'); box.appendChild(a); await MM.sleep(80); a.classList.add('in'); }
        const s = MM.el('div', 'step ' + (steps[i][1] || ''), MM.UI.esc(steps[i][0])); box.appendChild(s);
        await MM.sleep(60); s.classList.add('in'); MM.Audio.tick(); await MM.sleep(delay || 650);
      }
    },
    stats(rows) {
      const m = $('#mstats', N.el);
      m.innerHTML = rows.map((r) => `<div>${MM.UI.esc(r[0])}: <b>${MM.UI.esc(r[1])}</b></div>`).join('');
      m.className = 'in';
    },
    draw(t) {
      const cv = N.cv, g = N.g, dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.floor(w * dpr)) { cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      N.speaking += (N.target - N.speaking) * 0.08;
      const cx = w / 2, cy = h * 0.56, R = Math.min(w, h) * 0.2;
      const bg = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      bg.addColorStop(0, 'rgb(6,14,26)'); bg.addColorStop(1, 'rgb(0,0,0)');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      const col = N.warm ? '255,200,140' : '169,220,255';
      // core
      const cg = g.createRadialGradient(cx, cy, 0, cx, cy, R * 1.1);
      cg.addColorStop(0, `rgba(${col},${0.55 + 0.25 * N.speaking})`); cg.addColorStop(0.5, `rgba(${col},.12)`); cg.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, R * 1.1, 0, 6.28); g.fill();
      // waveform ring
      g.strokeStyle = `rgba(${col},.95)`; g.lineWidth = 2; g.shadowColor = `rgb(${col})`; g.shadowBlur = 16;
      g.beginPath();
      const amp = 3 + 20 * N.speaking;
      for (let i = 0; i <= 200; i++) {
        const a = i / 200 * Math.PI * 2;
        const v = Math.sin(a * 7 + t * 3) * 0.5 + Math.sin(a * 13 - t * 5) * 0.35 + Math.sin(a * 3 + t) * 0.4;
        const r = R + v * amp * (0.6 + 0.4 * Math.sin(t * 8 + a * 2));
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.stroke(); g.shadowBlur = 0;
      // polygons
      [[3, 0.55, 0.3], [6, 0.8, -0.2], [8, 1.35, 0.12]].forEach((p, k) => {
        g.strokeStyle = `rgba(${col},${0.18 + 0.05 * k})`; g.lineWidth = 1; g.beginPath();
        for (let i = 0; i <= p[0]; i++) { const a = i / p[0] * 6.28 + t * p[2]; const r = R * p[1] * (1 + 0.03 * Math.sin(t * 2 + k)); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      });
      // orbiting dots
      for (let i = 0; i < 26; i++) {
        const a = i / 26 * 6.28 + t * (0.12 + (i % 3) * 0.05), r = R * (1.6 + (i % 5) * 0.14);
        g.fillStyle = `rgba(${col},${0.25 + 0.4 * ((i * 7) % 5) / 5})`; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, 1.6, 0, 6.28); g.fill();
      }
      // glitch bands
      if (N.glitch > 0.01) {
        for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(${col},${0.08 * N.glitch})`; g.fillRect(0, Math.random() * h, w, 2 + Math.random() * 8); }
        N.glitch *= 0.93;
      }
    }
  };
})();
