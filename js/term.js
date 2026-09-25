/* MEMORY MARKET — flow helpers + terminal panels */
(function () {
  const MM = window.MM, $ = MM.$;

  MM.busy = false;
  MM.gate = () => { let r; const p = new Promise((res) => { r = res; }); p.open = r; return p; };
  MM.freeze = () => MM.setMode('cutscene');
  MM.free = () => MM.setMode('play');

  // smoothly turn the player to face world point (x,z)
  MM.turnTo = (x, z, dur, pitch) => {
    const P = MM.Player, dx = x - P.pos.x, dz = z - P.pos.z;
    let want = Math.atan2(-dx, -dz), d = want - P.yaw;
    while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    return Promise.all([MM.tween(P, 'yaw', P.yaw + d, dur || 1), MM.tween(P, 'pitch', pitch || 0, dur || 1)]);
  };

  // wrap an interaction so it can't re-enter
  MM.act = (fn) => async (id, it) => {
    if (MM.busy) return; MM.busy = true;
    try { await fn(id, it); } catch (e) { console.error(e); }
    MM.busy = false;
  };

  MM.Term = {
    // o: {title, tabs:[{id,label,render(main,api),onView()}], first}
    open(o) {
      const seen = {}; let curTab = null, cleanup = null, resolveClosed;
      const closed = new Promise((r) => { resolveClosed = r; });
      const html = `<div class="tgrid"><div class="tnav">${o.tabs.map((t) => `<button data-id="${t.id}">${t.label}</button>`).join('')}</div><div class="tmain"></div></div>`;
      const panel = MM.UI.panel({
        title: o.title, closable: o.closable !== false, cls: 'term solid', panelCls: 'wide', html,
        onClose: () => { if (cleanup) cleanup(); resolveClosed(seen); if (o.onClose) o.onClose(seen); }
      });
      const main = $('.tmain', panel.el), navs = panel.el.querySelectorAll('.tnav button');
      const api = {
        seen, panel, closed, main,
        allSeen: () => o.tabs.every((t) => seen[t.id]),
        close: () => panel.close(),
        select(id) {
          const t = o.tabs.find((x) => x.id === id); if (!t) return;
          if (cleanup) { cleanup(); cleanup = null; }
          curTab = id; MM.Audio.tick();
          navs.forEach((b) => { b.classList.toggle('act', b.dataset.id === id); if (seen[b.dataset.id]) b.classList.add('seen'); });
          main.innerHTML = ''; main.scrollTop = 0;
          const first = !seen[id]; seen[id] = true;
          const r = t.render(main, api); if (typeof r === 'function') cleanup = r;
          if (first && t.onView) t.onView(api);
          navs.forEach((b) => { if (seen[b.dataset.id]) b.classList.add('seen'); });
          if (first && o.onSeen) o.onSeen(id, api);
        }
      };
      navs.forEach((b) => b.addEventListener('click', () => api.select(b.dataset.id)));
      api.select(o.first || o.tabs[0].id);
      return api;
    }
  };
})();
