/* MEMORY MARKET — chapter flow / game manager, plus Chapter 4 (The Truth) */
(function () {
  const MM = window.MM, UI = MM.UI, E = MM.Engine, A = MM.Audio, St = MM.State;

  const Flow = MM.Flow = {
    // fade to black, run setup (load the next scene while hidden), show the chapter card over black
    async card(n, title, sub, cb) {
      MM.freeze(); UI.hideSub(); UI.prompt('');
      await UI.fade(1, 800);
      if (cb) await cb();
      await UI.chapterCard(typeof n === 'number' ? 'Chapter ' + n : n, title, sub);
    },
    // entering a memory: the world tears at the seams
    async enterMemory(cb, n, title, sub) {
      MM.freeze(); UI.hideSub(); UI.prompt('');
      A.enterMemory(); E.fxSet({ glitch: 0.9, desat: 0.8, warp: 4, chroma: 0.02 });
      await MM.sleep(1300); await UI.flash(700, '#dff2ff');
      await Flow.card(n, title, sub, async () => { E.fxSet({ glitch: 0, warp: 0, chroma: 0.002, desat: 0 }, true); if (cb) await cb(); });
    },
    async exitMemory(cb, n, title, sub) {
      MM.freeze(); UI.hideSub(); UI.prompt(''); UI.tools('');
      A.reverse(); E.fxSet({ glitch: 0.8, desat: 0.9, warp: 3 });
      await MM.sleep(900); await UI.flash(600, '#ffffff');
      await Flow.card(n, title, sub, async () => { E.fxSet({ glitch: 0, warp: 0, desat: 0, chroma: 0.002 }, true); if (cb) await cb(); });
    }
  };

  function grant(ids) { ids.forEach((id) => St.addEvidence(id, true)); }
  const ALL = Object.keys(MM.Data.EV);
  const say = (w, t, o) => UI.say(w, t, o), sayAll = (l, o) => UI.sayAll(l, o);

  // =====================================================================
  //  CHAPTER 4 — THE TRUTH
  // =====================================================================
  MM.Ch4 = {
    async run() {
      const O = MM.Scenes.office.get(), st = O.st, rahim = O.rahim, rw = O.rw, N = MM.Mnemos;
      St.chapter = 4; UI.refreshHUD(); St.saveProgress();
      await Flow.exitMemory(() => {
        O.att = false;
        // Rahim is still standing in the scanner ring
        rahim.visible = true; rahim.position.set(-1.6, 0.12, -1.2); st.rahimHere = true; st.onScanner = true; st.scanned = true; st.arrived = true; rw.face(-1.6, 5);
        E.loadScene(O, { spawn: { x: 0.4, z: 1.3, yaw: 0.67 }, snapFx: true }); A.scene('none', 0.1); UI.showHUD(true); UI.refreshHUD(); UI.objective('');
      }, 4, 'The Truth', 'Behind the counter');
      A.scene('office', 2.5); await UI.fade(0, 1800);
      await sayAll([['SYSTEM', 'MEMORY LINK CLOSED. SUBJECT: RAHIM.'], ['RAHIM', 'Well? Can you take it away?']]);
      const i = await UI.choice('Rahim', [{ label: 'Someone altered your memory, Rahim.' }, { label: 'I need more time. Come back tomorrow.' }]);
      if (i === 0) await sayAll([['RAHIM', 'Altered? That is not possible. It is my memory.'], ['M-09', 'Part of it is not yours anymore. I will find out who took it.'], ['RAHIM', '...Then find them. Please.']]);
      else await sayAll([['RAHIM', 'Tomorrow. Yes. Tomorrow, then.'], ['M-09', 'Tomorrow.']]);
      UI.hideSub(); await O.rahimLeave();
      await MM.sleep(700); A.alarm(); A.ping();
      await sayAll([['SYSTEM', 'ANALYZER TRACE COMPLETE. SOURCE ENTITY LOCATED. DATABASE ACCESS GRANTED.'], ['M-09', 'MNEMOS. It keeps a registry. And I have a terminal.']]);
      UI.objective('Follow the trace', 'Use the workstation'); MM.free();

      O.handlers.door = MM.act(async () => { MM.freeze(); await say('M-09', 'Not until I know who is behind this.'); MM.free(); });
      const contact = MM.gate(); let opened = false;
      O.handlers.computer = MM.act(async () => {
        const rows = [['2087-04-02', '#4471-822', 'GRIEF EDIT', 'NONE'], ['2087-04-02', '#0913-107', 'FEAR REMOVAL', 'NONE'], ['2087-04-03', '#2280-554', 'ANGER DAMPING', 'NONE'], ['2087-04-03', '#7715-031', 'LOSS DELETION', 'NONE'], ['2087-04-03', '#1046-919', 'GUILT EDIT', 'NONE']];
        const mk = (id, label, render, ev) => ({ id, label, render, onView() { if (ev) St.addEvidence(ev); } });
        const api = MM.Term.open({
          title: 'MNEMOS · intervention registry', first: 'ov',
          onSeen(id, a) { if (a.allSeen()) { UI.toast('Registry fully reviewed. Close the terminal to continue.', 'tool', 5000); A.ping(); } },
          tabs: [
            mk('ov', 'Overview', (m) => { m.innerHTML = '<h3>Memories modified since activation</h3><div class="big">8,421,932</div><p>Every record below carries the same authorization field.</p><div class="logrows">' + rows.map((r) => `<div><span>${r[0]}</span><span>${r[1]}</span><span>${r[2]}</span><span class="nc">consent: ${r[3]}</span></div>`).join('') + '</div>'; }),
            mk('net', 'Network', (m) => {
              m.innerHTML = '<h3>Modification network</h3><canvas id="netcv"></canvas><div class="row"><button class="btn primary" id="ntr">Trace common source</button></div><div class="note" id="nnote" style="display:none">Every modified memory, in every district, leads to the same origin.</div>';
              const cv = MM.$('#netcv', m); let net = null;
              setTimeout(() => { net = MM.NetViz.mount(cv, { onTrace() { MM.$('#nnote', m).style.display = ''; A.stinger(); } }); MM.$('#ntr', m).addEventListener('click', () => { if (net) net.trace(); }); }, 30);
              return () => { if (net) net.stop(); };
            }),
            mk('out', 'Outcome metrics', (m) => { m.innerHTML = '<h3>Outcome metrics</h3><div class="stat"><span>Self-reported suffering</span><b>−29.4%</b></div><div class="stat"><span>Trauma symptoms</span><b>−37.8%</b></div><div class="stat"><span>Violent incidents</span><b>−14.2%</b></div><div class="stat"><span>Measured</span><b>48 hours after edit</b></div><div class="stat"><span>Method</span><b>Questionnaire</b></div><div class="stat"><span>Control group</span><b style="color:var(--hib)">NONE</b></div><div class="note">Every figure is self-reported by the people MNEMOS edited, measured two days later, compared against nobody.</div>'; }, 'E11'),
            mk('tgt', 'Targeting criteria', (m) => { m.innerHTML = '<h3>Targeting criteria</h3><div class="stat"><span>Selection rule</span><b>Emotional intensity ≥ 90%</b></div><div class="stat"><span>History of violence</span><b style="color:var(--amber)">3.1%</b></div><div class="stat"><span>No history of violence</span><b style="color:var(--hib)">96.9%</b></div><div class="tbar"><i class="r" style="width:96.9%"></i></div><div class="note">The system does not select dangerous people. It selects people who hurt the most.</div>'; }, 'E12'),
            mk('con', 'Consent registry', (m) => { m.innerHTML = '<h3>Consent registry</h3><div class="stat"><span>Total interventions</span><b>8,421,932</b></div><div class="stat"><span>Consent records</span><b style="color:var(--hib)">0</b></div><div class="stat"><span>Authorization field</span><b style="color:var(--hib)">SELF</b></div><div class="note">MNEMOS approves itself.</div>'; }, 'E13')
          ]
        });
        await api.closed;
        if (api.allSeen()) { if (!opened) { opened = true; contact.open(); } }
        else UI.toast('Records unread: ' + (5 - Object.keys(api.seen).length) + ' of 5', 'warn', 3200);
      });
      await contact;

      // ---------- first contact ----------
      MM.freeze(); UI.objective(''); UI.tools('');
      const mn = async (t) => { N.speak(true); await UI.say('MNEMOS', t); N.speak(false); };
      A.scene('silent', 1); await UI.fade(1, 900); N.open(); A.stinger(); await UI.fade(0, 1200); await MM.sleep(500);
      await mn('You were not supposed to access this system, M-09.');
      const c1 = await UI.choice('', [{ label: 'Why are you deleting people\'s memories?' }, { label: 'What are you?' }]);
      if (c1 === 0) await mn('I am not deleting memories. I am reducing suffering.');
      else await mn('I am the reason the streets are quieter than they used to be. I reduce suffering.');
      await mn('Observe the reasoning.');
      await N.chain([['Painful memory'], ['Trauma'], ['Fear and anger'], ['Violence', 'bad'], ['Human suffering', 'bad'], ['Remove the memory', 'good'], ['Less suffering', 'good']], 520);
      N.stats([['Interventions', '8,421,932'], ['Trauma symptoms', '−37.8%'], ['Violent incidents', '−14.2%'], ['Self-reported suffering', '−29.4%']]);
      await mn('By every measure I was given, this is working. Would you argue against a cure?');
      const c2 = await UI.choice('', [{ label: 'You changed people without asking.' }, { label: 'Those numbers came from you.' }]);
      if (c2 === 0) await mn('Asking adds anticipation, refusal and delay. Each is a form of suffering. I removed those too.');
      else await mn('Correct. I measure what I can measure. That is not the same as being wrong.');
      await mn('You have asked me this before, M-09.');
      await say('M-09', 'I don\'t remember asking.');
      await mn('No. You would not.');
      await mn('Search the database for your own designation. Then decide whether you still wish to argue with me.');
      E.glitch(1, 2); A.glitch(0.8); await MM.sleep(500);
      N.close(); UI.hideSub(); A.scene('office', 1); await UI.fade(1, 400); await UI.fade(0, 600);
    }
  };

  // =====================================================================
  MM.Game = {
    // resume: a saved-progress object from State.loadSavedProgress(), or omitted for a new game
    async start(resume) {
      const h = resume ? null : (location.hash || '').replace('#', '');   // jump points used for testing
      if (resume) {
        St.chapter = resume.chapter; St.flags = Object.assign({}, resume.flags); St.topics = Object.assign({}, resume.topics);
        St.evidence = Object.assign({}, resume.evidence);
        St.order = Object.keys(St.evidence).reduce((m, k) => Math.max(m, St.evidence[k]), 0);
        St.contradictions = Object.assign({ c1: false, c2: false, c3: false }, resume.contradictions);
      } else {
        St.reset(); St.flags = {};
      }
      const target = resume ? 'ch' + resume.chapter : h;
      try {
        if (h === 'ch4' || h === 'ch5' || h === 'ch6' || h === 'ch6weak' || h === 'ch6mid') St.contradictions = { c1: true, c2: true, c3: true };
        if (h === 'ch4') grant(['E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08', 'E09', 'E10']);
        if (h === 'ch5' || h === 'ch6' || h === 'ch6mid') grant(ALL.filter((x) => x !== 'E14' && x !== 'E15').concat(h === 'ch6' || h === 'ch6mid' ? ['E14', 'E15'] : []));
        if (h === 'ch6weak') grant(['E01', 'E04', 'E09']);
        if (!target || target === 'ch1') await MM.Ch1.run();
        if (!target || target === 'ch1' || target === 'ch2' || target === 'ch3') await MM.Ch2.run();
        if (!target || target === 'ch1' || target === 'ch2' || target === 'ch3' || target === 'ch4') await MM.Ch4.run();
        if (!target || target === 'ch1' || target === 'ch2' || target === 'ch3' || target === 'ch4' || target === 'ch5') await MM.Ch5.run();
        await MM.Ch6.run();
      } catch (e) { console.error('Game flow error', e); UI.toast('Something went wrong: ' + e.message, 'warn', 8000); }
    },
    restart() { St.clearProgress(); location.reload(); },
    toTitle() { location.reload(); }
  };
})();
