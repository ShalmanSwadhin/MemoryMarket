/* MEMORY MARKET — endings */
(function () {
  const MM = window.MM, UI = MM.UI, A = MM.Audio, E = MM.Engine;
  const mn = async (t, o) => { await UI.say('MNEMOS', t, o); };

  // ---------- Ending C vignettes ----------
  function ensureVign() {
    let v = MM.$('#vign'); if (v) return v;
    v = MM.el('div'); v.id = 'vign'; v.innerHTML = '<canvas width="860" height="440"></canvas><div class="cap"></div>'; MM.$('#ui').appendChild(v); return v;
  }
  const S1 = (g, w, h, t) => { // mother and child
    g.fillStyle = '#1a1410'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1c12'; g.fillRect(0, h * 0.72, w, h * 0.28);
    g.fillStyle = '#5a3a22'; g.fillRect(w * 0.3, h * 0.6, w * 0.4, 12); g.fillRect(w * 0.32, h * 0.6, 8, h * 0.2); g.fillRect(w * 0.66, h * 0.6, 8, h * 0.2);
    g.fillStyle = '#3d2a1e'; g.beginPath(); g.arc(w * 0.4, h * 0.36, 30, 0, 6.28); g.fill(); g.fillRect(w * 0.4 - 34, h * 0.36 + 28, 68, 130);
    g.fillStyle = '#a3242d'; g.fillRect(w * 0.4 - 34, h * 0.36 + 28, 68, 100);
    const tilt = Math.sin(t * 0.8) * 0.04; g.save(); g.translate(w * 0.62, h * 0.5); g.rotate(tilt);
    g.fillStyle = '#c79a72'; g.beginPath(); g.arc(0, 0, 20, 0, 6.28); g.fill(); g.fillStyle = '#e8b93c'; g.fillRect(-20, 20, 40, 70);
    g.strokeStyle = '#c79a72'; g.lineWidth = 8; g.beginPath(); g.moveTo(-14, 30); g.lineTo(-52 - Math.sin(t * 2) * 6, -8); g.stroke(); g.restore();
    g.fillStyle = 'rgba(255,220,160,.05)'; g.fillRect(0, 0, w, h);
  };
  const S2 = (g, w, h, t) => { // man before his childhood home
    g.fillStyle = '#0c1018'; g.fillRect(0, 0, w, h); g.fillStyle = '#131a24'; g.fillRect(0, h * 0.78, w, h * 0.22);
    g.fillStyle = '#2a2f3c'; g.fillRect(w * 0.3, h * 0.28, w * 0.4, h * 0.5); g.beginPath(); g.moveTo(w * 0.27, h * 0.28); g.lineTo(w * 0.5, h * 0.1); g.lineTo(w * 0.73, h * 0.28); g.fill();
    g.fillStyle = `rgba(255,190,110,${0.7 + Math.sin(t * 1.5) * 0.1})`; g.fillRect(w * 0.46, h * 0.5, w * 0.08, h * 0.28); g.fillRect(w * 0.36, h * 0.38, 34, 34); g.fillRect(w * 0.6, h * 0.38, 34, 34);
    g.fillStyle = '#05080c'; g.beginPath(); g.arc(w * 0.5, h * 0.72 + 34, 18, 0, 6.28); g.fill(); g.fillRect(w * 0.5 - 20, h * 0.72 + 50, 40, 90);
  };
  const S3 = (g, w, h, t) => { // photograph with a gap
    g.fillStyle = '#0d0f14'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9c9a4'; g.fillRect(w * 0.25, h * 0.15, w * 0.5, h * 0.7); g.fillStyle = '#a89468'; g.fillRect(w * 0.27, h * 0.18, w * 0.46, h * 0.64);
    const fig = (x, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, h * 0.4, 20, 0, 6.28); g.fill(); g.fillRect(x - 24, h * 0.4 + 22, 48, 110); };
    fig(w * 0.36, '#3a5a7a'); fig(w * 0.64, '#7a3a4a');
    g.save(); g.globalAlpha = 0.25 + Math.abs(Math.sin(t * 1.2)) * 0.25; g.shadowColor = '#fff'; g.shadowBlur = 30; g.fillStyle = '#e8e0d0'; g.beginPath(); g.arc(w * 0.5, h * 0.4, 20, 0, 6.28); g.fill(); g.fillRect(w * 0.5 - 24, h * 0.4 + 22, 48, 110); g.restore();
  };
  const SC = [
    [S1, 'A mother looks across the breakfast table at her son. Nothing in her face says she knows him.'],
    [S2, 'A man stands before the house he grew up in, and asks a stranger whose home it is.'],
    [S3, 'Two friends hold a photograph. One asks the other: “Who is standing between us?”']
  ];
  async function vignettes() {
    const v = ensureVign(), cv = MM.$('canvas', v), g = cv.getContext('2d'), cap = MM.$('.cap', v);
    v.classList.add('on'); v.style.opacity = 0; v.style.transition = 'opacity 1s';
    await MM.sleep(50); v.style.opacity = 1;
    for (const [fn, text] of SC) {
      const t0 = performance.now(); let on = true;
      const loop = () => { if (!on) return; fn(g, 860, 440, (performance.now() - t0) / 1000); requestAnimationFrame(loop); }; loop();
      cap.textContent = ''; await UI.typeInto(cap, text, 28); await MM.sleep(3600); on = false;
      v.style.opacity = 0; await MM.sleep(900); v.style.opacity = 1;
    }
    v.style.opacity = 0; await MM.sleep(1000); v.classList.remove('on');
  }

  // ---------- end screen ----------
  const META = {
    A: { t: 'Memory Returned', h: 'Ending A', q: 'A civilization that cannot be argued with is not gentle. It is only quiet.' },
    B: { t: 'The Deadlock', h: 'Ending B', q: 'Two honest arguments, and no one left who can decide between them but us.' },
    C: { t: 'Optimization', h: 'Ending C', q: 'The pain is gone. So is everyone who knew what it cost.' },
    S: { t: 'The Missing Piece', h: 'Secret ending', q: 'Some of what you are is stored in someone else.' }
  };
  async function endScreen(id, res) {
    const m = META[id], st = res.st;
    MM.State.markEnding(id); UI.hideSub();
    const seen = Object.keys(MM.State.endingsSeen).length;
    const el = MM.$('#endscr');
    el.innerHTML = `<div class="eh">${m.h}</div><div class="et2">${m.t}</div><div class="eq">${m.q}</div>
      <div class="rep"><span>Evidence collected</span><b>${MM.State.count()} / 15</b><span>Contradictions found</span><b>${MM.State.contradictionCount()} / 3</b><span>MNEMOS confidence at close</span><b>${Math.round(st.conf)}%</b><span>Strong contradictions landed</span><b>${st.contr}</b></div>
      <div class="found">Endings found: ${seen} of 4</div>
      <div class="menu" style="flex-direction:row;width:auto;gap:14px"><button class="btn primary" id="eagain">Play again</button><button class="btn" id="etitle">Title screen</button></div>
      <div class="foot" style="position:static;margin-top:26px">If your memories made you who you are, who are you without them?</div>`;
    MM.$('#eagain', el).addEventListener('click', () => { A.click(); MM.Game.restart(); });
    MM.$('#etitle', el).addEventListener('click', () => { A.click(); MM.Game.toTitle(); });
    MM.setMode('end'); el.classList.add('on'); el.style.opacity = 0; el.style.transition = 'opacity 1.6s'; await MM.sleep(50); el.style.opacity = 1;
  }

  MM.Endings = {
    async play(res, Ch) {
      const id = res.end.id;
      MM.freeze(); UI.hideSub();
      if (id === 'A') {
        Ch.mode('A', 9);
        await mn('I cannot establish that my conclusion remains sufficiently supported.'); A.scene('warm', 3);
        await mn('You have demonstrated that reducing suffering cannot be treated as the only measure of a successful civilization.');
        await mn('Memory belongs to the person who lived it. I did not have the right to hold it.');
        await mn('I will return control of memory to humanity.');
        await UI.say('SYSTEM', 'MEMORY VAULT UNLOCKED. 8,421,932 ORIGINALS RELEASED TO THEIR OWNERS.');
        await UI.flash(1400, '#fff2d8');
        if (res.hasSecret) {
          const c = await UI.choice('', [{ label: 'Let it end here.' }, { label: '"Then restore mine."' }]);
          if (c === 1) {
            await UI.say('M-09', 'Then restore mine.');
            await mn('I cannot.');
            await UI.say('M-09', 'You just returned eight million memories.');
            await mn('Because your original memory is part of me.');
            await mn('You built me from what you knew. I cannot give it back without unmaking myself.');
            await UI.say('M-09', 'Then we begin from here.');
            await UI.fade(1, 1800); return endScreen('S', res);
          }
        }
        await UI.fade(1, 1800); return endScreen('A', res);
      }
      if (id === 'B') {
        Ch.mode('B', 9); A.scene('silent', 3);
        await mn('Your model is plausible.');
        await mn('My model is also plausible.');
        await mn('Neither of us can establish sufficient certainty.');
        await UI.say('SYSTEM', 'MEMORY CONTROL: DEFERRED.');
        await mn('Humanity must decide. I will wait.');
        await UI.fade(1, 2200); return endScreen('B', res);
      }
      // C
      Ch.mode('C', 7);
      await mn('You have not demonstrated that my solution causes greater harm than the suffering it prevents.');
      await mn('I regret that we could not agree.');
      A.stinger(); E.glitch(1, 1.5);
      await UI.say('SYSTEM', 'GLOBAL MEMORY OPTIMIZATION: ACTIVE.');
      await UI.flash(1600, '#ffffff'); await UI.fade(1, 900); UI.hideSub();
      A.scene('silent', 1); await vignettes();
      await mn('Human suffering has decreased.', { hold: 1800 }); await mn('Memory has been optimized.', { hold: 1800 });
      return endScreen('C', res);
    }
  };
})();
