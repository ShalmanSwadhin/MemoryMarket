/* MEMORY MARKET — GameState / EvidenceManager / SaveState */
(function () {
  const MM = window.MM;
  const KEY = 'memory_market_v1';
  const SAVE_KEY = 'memory_market_save_v1';

  const S = MM.State = {
    chapter: 0,
    evidence: {},        // id -> order collected
    contradictions: { c1: false, c2: false, c3: false },
    flags: {},
    topics: {},
    settings: { volume: 0.8, tts: true, subs: true, musicVol: 0.8, ambienceVol: 0.8, sfxVol: 0.8, dialogueVol: 0.9 },
    endingsSeen: {},

    reset() {
      S.chapter = 0; S.evidence = {}; S.flags = {}; S.topics = {};
      S.contradictions = { c1: false, c2: false, c3: false };
      S.order = 0;
    },
    has(id) { return !!S.evidence[id]; },
    count() { return Object.keys(S.evidence).length; },
    list() { return Object.keys(S.evidence).sort((a, b) => S.evidence[a] - S.evidence[b]); },

    addEvidence(id, quiet) {
      if (S.evidence[id]) return false;
      S.order = (S.order || 0) + 1;
      S.evidence[id] = S.order;
      if (!quiet && MM.UI && MM.UI.evidenceToast) MM.UI.evidenceToast(MM.Data.EV[id]);
      if (MM.UI && MM.UI.refreshHUD) MM.UI.refreshHUD();
      return true;
    },
    contradiction(n, text) {
      const k = 'c' + n;
      if (S.contradictions[k]) return;
      S.contradictions[k] = true;
      if (MM.UI) { MM.UI.toast('CONTRADICTION ' + n + '/3 — ' + text, 'warn'); MM.UI.refreshHUD(); }
      if (MM.Audio) MM.Audio.alarm();
    },
    contradictionCount() { return Object.values(S.contradictions).filter(Boolean).length; },

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const o = JSON.parse(raw);
        if (o.settings) Object.assign(S.settings, o.settings);
        if (o.endingsSeen) S.endingsSeen = o.endingsSeen;
      } catch (e) { /* storage unavailable: fine */ }
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify({ settings: S.settings, endingsSeen: S.endingsSeen })); } catch (e) { }
    },
    markEnding(id) { S.endingsSeen[id] = true; S.save(); },

    // ---------- mid-game progress (chapter boundaries) ----------
    saveProgress() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          v: 1, chapter: S.chapter, evidence: S.evidence, contradictions: S.contradictions, flags: S.flags, topics: S.topics
        }));
      } catch (e) { /* storage unavailable: fine */ }
    },
    loadSavedProgress() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const o = JSON.parse(raw);
        if (!o || o.v !== 1 || !o.chapter) return null;
        return o;
      } catch (e) { return null; }
    },
    clearProgress() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
  };
  S.reset();
})();
