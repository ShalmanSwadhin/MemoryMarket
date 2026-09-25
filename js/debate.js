/* MEMORY MARKET — Chapter 6 debate: deterministic reasoning engine + interface */
(function () {
  const MM = window.MM, D = MM.Data, UI = MM.UI, A = MM.Audio;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- deterministic engine (calibrated by simulation; no external AI) ----------
  const CFG = { argMul: 1.1, respMul: 1.0, counterSlope: 0.5, aMax: 36, bMax: 66 };
  const Engine = MM.DebateEngine = {
    CFG,
    newState() { return { conf: 94, used: {}, targetsHit: {}, log: [], n: 0, sEQ: 0, sLC: 0, contr: 0, causal: 0, ethical: 0 }; },
    evaluate(st, arg, counter) {
      const T = arg.target, cards = arg.evidence.map((id) => D.EV[id]).filter(Boolean);
      if (!cards.length) return { EQ: 0, LC: 0, R: 0, CV: 0, PE: 0, RB: 0, S: -1, empty: true, contradicting: 0, match: 0, fit: 0 };
      const byS = cards.slice().sort((a, b) => b.strength - a.strength);
      const EQ = byS[0].strength + (byS[1] ? 0.6 * byS[1].strength : 0);
      const byR = cards.slice().sort((a, b) => b.rel[T] - a.rel[T]);
      const R = byR[0].rel[T] + (byR[1] ? 0.5 * byR[1].rel[T] : 0);
      const fit = D.FIT[arg.reasoning][T];
      const contradicting = cards.filter((c) => c.contradicts.includes(T)).length;
      let match = cards.some((c) => D.REASON_CATS[arg.reasoning].includes(c.cat)) ? 1 : 0;
      if (arg.reasoning === 'CONTRADICTION') match = contradicting > 0 ? 1 : 0;
      let LC = fit + match;
      if (cards.some((c) => c.favorsAI && c.favorsAI.includes(T))) LC -= 2;
      LC = clamp(LC, -2, 3);
      const CV = contradicting === 0 ? 0 : contradicting === 1 ? 2 : 3;
      let PE = 0;
      cards.forEach((c) => { if (c.supports.some((id) => st.used[id])) PE = 1; });
      cards.forEach((c) => { const u = st.used[c.id]; if (u) PE -= u.includes(T) ? 2 : 1; });
      if (!counter && st.targetsHit[T]) PE -= 2;
      const RB = counter && cards.some((c) => counter.answers.includes(c.id)) ? 2 : 0;
      const S = EQ + LC + R + CV + PE + RB;
      return { EQ, LC, R, CV, PE, RB, S, fit, match, contradicting };
    },
    commit(st, arg, res, isResponse) {
      arg.evidence.forEach((id) => { (st.used[id] = st.used[id] || []).push(arg.target); });
      if (!isResponse) st.targetsHit[arg.target] = true;
      st.n++; st.sEQ += res.EQ / 4.8; st.sLC += res.LC;
      const strong = res.S >= 8;
      if (strong && res.CV > 0) st.contr++;
      if (strong && res.fit >= 2 && res.match) st.ethical += (['CONSENT', 'IDENTITY'].includes(arg.reasoning) ? 1 : 0);
      if (strong && ['CAUSE_EFFECT', 'STATISTICAL_LIMITATION', 'COUNTEREXAMPLE'].includes(arg.reasoning)) st.causal++;
    },
    applyArgument(st, res) { const b = st.conf; st.conf = clamp(st.conf - Math.max(res.S, -1) * CFG.argMul, 5, 99); return [b, st.conf]; },
    applyCounter(st, target, res) { const c = D.COUNTERS[target]; const up = clamp(c.base - CFG.counterSlope * Math.max(res.S, 0), 1, c.base); const b = st.conf; st.conf = clamp(st.conf + up, 5, 99); return [b, st.conf, up]; },
    applyResponse(st, res) { const b = st.conf; st.conf = clamp(st.conf - Math.max(res.S, -1) * CFG.respMul, 5, 99); return [b, st.conf]; },
    bracket(S) { return S >= 10 ? 'strong' : S >= 6 ? 'medium' : 'weak'; },
    ending(st) {
      const consistency = st.n ? st.sLC / st.n : 0;
      let id;
      if (st.conf <= CFG.aMax && st.contr >= 3 && consistency >= 1.4 && st.ethical >= 1) id = 'A';
      else if (st.conf <= CFG.bMax) id = 'B';
      else id = 'C';
      return { id, consistency, evidence: st.n ? st.sEQ / st.n : 0 };
    }
  };

  // ---------- interface ----------
  let host = null, box = null;
  function ensure() {
    if (host) return;
    host = MM.el('div'); host.id = 'debate'; host.innerHTML = '<div class="dbox"></div>'; MM.$('#ui').appendChild(host); box = MM.$('.dbox', host);
  }
  const esc = UI.esc;
  const STEPS = ['Claim', 'Evidence', 'Reasoning', 'MNEMOS', 'Response'];
  const stepsHTML = (a) => '<div class="steps">' + STEPS.map((s, i) => `<span class="${i < a ? 'done' : i === a ? 'act' : ''}">${i + 1} · ${s}</span>`).join('') + '</div>';
  const confText = (st) => `MODEL CONFIDENCE ${Math.round(st.conf)}%`;

  function pick(o) {
    // o: {st, cycle, phase:'argue'|'respond', target?, counter?}
    return new Promise((resolve) => {
      const st = o.st, respond = o.phase === 'respond';
      const sel = { target: respond ? o.target : null, ev: [], r: null };
      const ids = MM.State.list();
      box.innerHTML = stepsHTML(respond ? 4 : 0) +
        `<div class="dh"><h3>${respond ? 'Answer the counterargument' : 'Challenge MNEMOS'}</h3><div class="rd conf">ROUND ${o.cycle} OF 3 · ${confText(st)}</div></div>` +
        (respond ? `<div class="yourtext" style="border-color:var(--ice);color:#dff2ff">MNEMOS: “${esc(D.COUNTERS[o.target].text)}”</div>` : '') +
        `<div class="dgrid"><div class="dcol"><h4>1 · The claim you challenge</h4><div id="dcl"></div></div>
         <div class="dcol"><h4>2 · Evidence (choose 1 or 2)</h4><div class="dcards" id="dev"></div></div>
         <div class="dcol"><h4>3 · How does it break the link?</h4><div class="rz" id="drz"></div><div class="rzh" id="dhint">Choose a reasoning type.</div><h4>Your words (optional)</h4><textarea class="dtext" id="dtx" placeholder="Say it in your own words. MNEMOS listens, but your evidence decides."></textarea></div></div>
         <div class="dact"><span class="note2" id="dnote"></span><button class="btn primary" id="dgo" disabled>${respond ? 'Respond' : 'Present argument'}</button></div>`;
      const cl = MM.$('#dcl', box), ev = MM.$('#dev', box), rz = MM.$('#drz', box), go = MM.$('#dgo', box), note = MM.$('#dnote', box), hint = MM.$('#dhint', box);
      Object.values(D.TARGETS).forEach((t) => {
        const b = MM.el('button', 'claim' + (respond && t.id !== o.target ? ' locked' : ''), `${esc(t.label)}<small>${esc(t.chain)}${st.targetsHit[t.id] ? ' · already challenged' : ''}</small>`);
        b.dataset.id = t.id; if (respond && t.id === o.target) b.classList.add('sel', 'locked');
        b.addEventListener('click', () => { if (respond) return; sel.target = t.id; cl.querySelectorAll('.claim').forEach((x) => x.classList.toggle('sel', x === b)); A.click(); upd(); });
        cl.appendChild(b);
      });
      ids.forEach((id) => {
        const wrap = MM.el('div'); wrap.innerHTML = UI.cardHTML(D.EV[id], 'pick' + (st.used[id] ? ' used' : '')); const c = wrap.firstChild; c.title = D.EV[id].desc + ' — ' + D.EV[id].src;
        c.addEventListener('click', () => {
          const i = sel.ev.indexOf(id);
          if (i >= 0) { sel.ev.splice(i, 1); c.classList.remove('sel'); }
          else { if (sel.ev.length >= 2) { const drop = sel.ev.shift(); const dc = ev.querySelector(`.frag[data-id="${drop}"]`); if (dc) dc.classList.remove('sel'); } sel.ev.push(id); c.classList.add('sel'); }
          A.tick(); upd();
        });
        ev.appendChild(c);
      });
      Object.keys(D.REASONING).forEach((k) => {
        const b = MM.el('button', '', esc(D.REASONING[k].label)); b.dataset.k = k;
        b.addEventListener('mouseenter', () => { hint.textContent = D.REASONING[k].hint; });
        b.addEventListener('click', () => { sel.r = k; rz.querySelectorAll('button').forEach((x) => x.classList.toggle('sel', x === b)); hint.textContent = D.REASONING[k].hint; A.click(); upd(); });
        rz.appendChild(b);
      });
      function upd() {
        const ok = sel.target && sel.ev.length >= 1 && sel.r; go.disabled = !ok;
        note.textContent = !sel.target ? 'Choose which claim to challenge.' : !sel.ev.length ? 'Choose evidence you have collected.' : !sel.r ? 'Choose a type of reasoning.' : '';
        if (!ids.length) note.textContent = 'You have no evidence. MNEMOS will not need to answer.';
      }
      upd();
      go.addEventListener('click', () => { A.confirm(); resolve({ target: sel.target, evidence: sel.ev.slice(), reasoning: sel.r, text: MM.$('#dtx', box).value.trim() }); });
    });
  }

  function autoText(arg) {
    const ev = D.EV[arg.evidence[0]], R = D.REASONING[arg.reasoning];
    return R.tpl.replace('{c}', ev.title.replace(/\.$/, ''));
  }
  function tile(label, txt, cls) { return `<div class="${cls}">${label}<b>${txt}</b></div>`; }
  function tiles(res) {
    const e = res.EQ >= 4 ? ['STRONG', 'good'] : res.EQ >= 2.5 ? ['MODERATE', 'mid'] : ['WEAK', 'bad'];
    const l = res.LC >= 3 ? ['VALID', 'good'] : res.LC >= 1 ? ['PARTIAL', 'mid'] : ['FLAWED', 'bad'];
    const r = res.R >= 2 ? ['DIRECT', 'good'] : res.R >= 1 ? ['INDIRECT', 'mid'] : ['NONE', 'bad'];
    const c = res.CV >= 3 ? ['CLEAR', 'good'] : res.CV >= 2 ? ['DETECTED', 'good'] : ['NONE', 'mid'];
    return '<div class="verdict">' + tile('Evidence quality', e[0], e[1]) + tile('Logical consistency', l[0], l[1]) + tile('Relevance', r[0], r[1]) + tile('Contradiction', c[0], c[1]) + '</div>';
  }
  function keywordFlavor(text) {
    if (!text) return '';
    for (const k of D.KEYWORDS) if (k[0].test(text)) return k[1];
    return '';
  }
  function react(arg, res, cycle) {
    const b = Engine.bracket(res.S);
    if (res.empty) return D.DISMISSALS[0];
    if (b === 'strong' && res.CV > 0) return D.CONCESSIONS[arg.target];
    if (b === 'strong') return D.PARTIALS[cycle % D.PARTIALS.length];
    if (b === 'medium') return D.PARTIALS[(cycle + 1) % D.PARTIALS.length];
    return D.DISMISSALS[(cycle + arg.evidence.length) % D.DISMISSALS.length];
  }

  async function show(html, st, stepIdx, btnLabel) {
    box.innerHTML = stepsHTML(stepIdx) + html + `<div class="dact"><span class="note2"></span><button class="btn primary" id="dnext">${btnLabel || 'Continue'}</button></div>`;
    await new Promise((r) => MM.$('#dnext', box).addEventListener('click', () => { A.click(); r(); }));
  }
  async function typed(elm, text) { A.speak(text, 'MNEMOS'); A.blip('MNEMOS'); await UI.typeInto(elm, text, 16); }

  MM.Debate = {
    async run(chamber) {
      ensure(); const st = Engine.newState();
      MM.setMode('debate'); UI.showHUD(false); host.classList.add('on');
      chamber.setConf(st.conf);
      for (let cycle = 1; cycle <= 3; cycle++) {
        // 1. player argument
        const arg = await pick({ st, cycle, phase: 'argue' });
        arg.text = arg.text || ''; const shown = arg.text || autoText(arg);
        const res = Engine.evaluate(st, arg, null);
        Engine.commit(st, arg, res, false);
        const [b0, b1] = Engine.applyArgument(st, res);
        chamber.feed(arg.evidence, res.S >= 6); chamber.setConf(st.conf);
        const line = react(arg, res, cycle), flav = keywordFlavor(arg.text);
        const T1 = D.TARGETS[arg.target];
        box.innerHTML = '';
        await show(`<div class="dh"><h3>MNEMOS evaluates your argument</h3><div class="rd conf">ROUND ${cycle} OF 3</div></div><div class="yourtext">“${esc(shown)}”</div><div class="rd" style="margin:2px 0 6px">Against: ${esc(T1.label)}</div>${tiles(res)}` +
          (res.PE <= -2 ? '<div class="note">MNEMOS: You have already used this line of attack. Repetition weakens it.</div>' : ''), st, 3, 'Hear MNEMOS respond').then(() => { });
        // (the verdict page is shown first; MNEMOS speaks on the next page)
        box.innerHTML = stepsHTML(3) + `<div class="dh"><h3>MNEMOS responds</h3><div class="rd conf">${confText(st).replace(/\d+/, Math.round(b0))} → ${Math.round(b1)}%</div></div><div class="yourtext" style="border-color:var(--ice);color:#dff2ff;min-height:70px" id="mnl"></div><div class="conf" id="mnc"></div><div class="dact"><span class="note2"></span><button class="btn primary" id="dnext" disabled>Continue</button></div>`;
        await typed(MM.$('#mnl', box), line + (flav ? ' ' + flav : ''));
        MM.$('#mnc', box).textContent = res.S >= 6 ? `Your evidence has reduced my confidence from ${Math.round(b0)}% to ${Math.round(b1)}%.` : `My confidence is largely unchanged: ${Math.round(b0)}% to ${Math.round(b1)}%.`;
        const nx = MM.$('#dnext', box); nx.disabled = false; await new Promise((r) => nx.addEventListener('click', () => { A.click(); r(); }));

        // 2. MNEMOS counters
        const counter = D.COUNTERS[arg.target];
        const [c0, c1] = Engine.applyCounter(st, arg.target, res); chamber.pulse(); chamber.setConf(st.conf);
        box.innerHTML = stepsHTML(3) + `<div class="dh"><h3>MNEMOS counters</h3><div class="rd conf">${Math.round(c0)}% → ${Math.round(c1)}%</div></div><div class="yourtext" style="border-color:var(--ice);color:#dff2ff;min-height:70px" id="mnl"></div><div class="dact"><span class="note2">MNEMOS is defending its position. Prepare a response.</span><button class="btn primary" id="dnext" disabled>Respond</button></div>`;
        await typed(MM.$('#mnl', box), counter.text);
        const nx2 = MM.$('#dnext', box); nx2.disabled = false; await new Promise((r) => nx2.addEventListener('click', () => { A.click(); r(); }));

        // 3. player response
        const arg2 = await pick({ st, cycle, phase: 'respond', target: arg.target, counter });
        const shown2 = arg2.text || autoText(arg2);
        const res2 = Engine.evaluate(st, arg2, counter);
        Engine.commit(st, arg2, res2, true);
        const [d0, d1] = Engine.applyResponse(st, res2);
        chamber.feed(arg2.evidence, res2.S >= 6); chamber.setConf(st.conf);
        const line2 = res2.RB ? (res2.S >= 10 ? 'That answers my objection directly. I have no rebuttal that survives it.' : 'That addresses my objection. It does not fully remove it.') : react(arg2, res2, cycle + 1);
        box.innerHTML = stepsHTML(4) + `<div class="dh"><h3>MNEMOS considers your response</h3><div class="rd conf">ROUND ${cycle} OF 3 · ${Math.round(d0)}% → ${Math.round(d1)}%</div></div><div class="yourtext">“${esc(shown2)}”</div>${tiles(res2)}<div class="yourtext" style="border-color:var(--ice);color:#dff2ff;min-height:56px" id="mnl"></div><div class="dact"><span class="note2">${res2.RB ? 'Your evidence speaks directly to the counterargument.' : ''}</span><button class="btn primary" id="dnext" disabled>${cycle < 3 ? 'Next round' : 'Conclude the argument'}</button></div>`;
        await typed(MM.$('#mnl', box), line2 + ' ' + keywordFlavor(arg2.text));
        const nx3 = MM.$('#dnext', box); nx3.disabled = false; await new Promise((r) => nx3.addEventListener('click', () => { A.click(); r(); }));
      }
      host.classList.remove('on'); box.innerHTML = '';
      const hasSecret = MM.State.has('E14') && MM.State.has('E15');
      const end = Engine.ending(st);
      return { st, end, hasSecret };
    }
  };
})();
