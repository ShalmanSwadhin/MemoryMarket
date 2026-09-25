/* MEMORY MARKET — utilities */
window.MM = window.MM || {};
(function () {
  const MM = window.MM;

  MM.$ = (s, r) => (r || document).querySelector(s);
  MM.el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  MM.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  MM.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  MM.lerp = (a, b, t) => a + (b - a) * t;
  MM.smooth = (t) => t * t * (3 - 2 * t);
  MM.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // seeded RNG so worlds are identical every run
  MM.rng = (seed) => {
    let s = seed >>> 0;
    return () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Canvas texture helper: draw(ctx,w,h)
  MM.canvasTex = (w, h, draw, opts) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    if (opts && opts.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.userData = { canvas: c, ctx: g };
    return t;
  };

  MM.FONT_UI = '"Bahnschrift","Segoe UI","Nirmala UI","Noto Sans Bengali",system-ui,sans-serif';
  MM.FONT_BN = '"Nirmala UI","Vrinda","Shonar Bangla","Noto Sans Bengali","Segoe UI",sans-serif';

  // cheap tween helper (driven by engine loop)
  MM.tweens = [];
  MM.tween = (obj, key, to, dur, ease) => new Promise((res) => {
    const from = obj[key];
    MM.tweens.push({ t: 0, dur: Math.max(0.001, dur), obj, key, from, to, ease: ease || MM.smooth, res });
  });
  MM.updateTweens = (dt) => {
    for (let i = MM.tweens.length - 1; i >= 0; i--) {
      const tw = MM.tweens[i];
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      tw.obj[tw.key] = tw.from + (tw.to - tw.from) * tw.ease(k);
      if (k >= 1) { MM.tweens.splice(i, 1); tw.res(); }
    }
  };

  MM.mode = 'title'; // title | play | ui | cutscene | debate | end
  MM.paused = false;
  MM.debug = {};
})();
