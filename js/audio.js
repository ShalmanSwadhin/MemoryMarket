/* MEMORY MARKET — fully procedural audio (no audio files needed) */
(function () {
  const MM = window.MM;
  let ctx = null, master = null, comp = null, reverb = null, revSend = null;
  let musicBus = null, ambienceBus = null, sfxBus = null, dialogueBus = null;
  let noiseBuf = null, brownBuf = null;
  const L = {};            // layers {g: GainNode, ...}
  let rainLP = null, fanLP = null;
  let heartTimer = null, heartLevel = 0, horns = null;
  let volume = 0.8, ttsOn = true, sfxOn = true, curScene = 'none', voice = null;
  let busVol = { music: 0.8, ambience: 0.8, sfx: 0.8, dialogue: 0.9 };
  // bus routing: which mixer bus each ambient layer belongs to. Rain, city,
  // electrical hum and the fan are environmental "ambience" - explicitly the
  // audio a long session should be able to mute (rain especially) without
  // losing interaction/story feedback. The dreamlike memory pad and the
  // chamber drone are the closest thing this game has to "music".
  const LAYER_BUS = { rain: 'ambience', city: 'ambience', hum: 'ambience', fan: 'ambience', heart: 'ambience', pad: 'music', chamber: 'music' };

  function noiseBuffer(kind, secs) {
    const n = Math.floor(ctx.sampleRate * secs);
    const b = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else d[i] = w;
    }
    return b;
  }
  function loopSrc(buf) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; }
  function osc(type, f, dest, gain) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
    const g = ctx.createGain(); g.gain.value = gain; o.connect(g); g.connect(dest); o.start(); return { o, g };
  }
  function impulse(secs, decay) {
    const n = Math.floor(ctx.sampleRate * secs);
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }

  const A = MM.Audio = {
    get ready() { return !!ctx; },
    get ctx() { return ctx; },
    _master() { return master; }, // test hook: lets a test tap the final mix

    init() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; return; }
      master = ctx.createGain(); master.gain.value = volume;
      musicBus = ctx.createGain(); musicBus.gain.value = busVol.music; musicBus.connect(master);
      ambienceBus = ctx.createGain(); ambienceBus.gain.value = busVol.ambience; ambienceBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = busVol.sfx; sfxBus.connect(master);
      dialogueBus = ctx.createGain(); dialogueBus.gain.value = busVol.dialogue;
      comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      reverb = ctx.createConvolver(); reverb.buffer = impulse(MM.lowPower ? 1.4 : 3.2, MM.lowPower ? 3.2 : 2.6);
      revSend = ctx.createGain(); revSend.gain.value = 0.5;
      reverb.connect(revSend); revSend.connect(master);
      noiseBuf = noiseBuffer('white', 2.5); brownBuf = noiseBuffer('brown', 4);

      const mk = (name) => { const g = ctx.createGain(); g.gain.value = 0; g.connect(LAYER_BUS[name] === 'music' ? musicBus : ambienceBus); L[name] = { g, bus: LAYER_BUS[name] === 'music' ? musicBus : ambienceBus, on: true, t: 0 }; return g; };

      // rain: hiss + roof drum
      let g = mk('rain');
      let s = loopSrc(noiseBuf);
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
      rainLP = ctx.createBiquadFilter(); rainLP.type = 'lowpass'; rainLP.frequency.value = 9000;
      s.connect(hp); hp.connect(rainLP); rainLP.connect(g);
      const s2 = loopSrc(brownBuf); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.6;
      const g2 = ctx.createGain(); g2.gain.value = 0.7; s2.connect(bp); bp.connect(g2); g2.connect(g);

      // distant city
      g = mk('city');
      s = loopSrc(brownBuf); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
      const cg = ctx.createGain(); cg.gain.value = 1.4; s.connect(lp); lp.connect(cg); cg.connect(g);

      // electrical hum
      g = mk('hum');
      osc('sine', 50, g, 0.5); osc('sine', 100, g, 0.28); const h3 = osc('sawtooth', 150, g, 0.05);
      const hl = ctx.createBiquadFilter(); hl.type = 'lowpass'; hl.frequency.value = 240; h3.g.disconnect(); h3.g.connect(hl); hl.connect(g);

      // ceiling fan
      g = mk('fan');
      s = loopSrc(noiseBuf); fanLP = ctx.createBiquadFilter(); fanLP.type = 'bandpass'; fanLP.frequency.value = 300; fanLP.Q.value = 0.9;
      const fg = ctx.createGain(); fg.gain.value = 0.5;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5.2; const lg = ctx.createGain(); lg.gain.value = 0.35;
      lfo.connect(lg); lg.connect(fg.gain); lfo.start();
      s.connect(fanLP); fanLP.connect(fg); fg.connect(g);

      // memory pad (dreamlike; deliberately NOT sent to the reverb - that send ignored the scene fade and the Music setting, and kept a long convolution running constantly)
      g = mk('pad');
      const padIn = ctx.createGain(); padIn.gain.value = 0.5;
      const pl = ctx.createBiquadFilter(); pl.type = 'lowpass'; pl.frequency.value = 700;
      [[110, 'triangle'], [165.2, 'sine'], [220.7, 'triangle'], [329.6, 'sine']].forEach(([f, t], i) => {
        const o = osc(t, f * (1 + (i - 1.5) * 0.002), padIn, 0.22);
        const l2 = ctx.createOscillator(); l2.frequency.value = 0.07 + i * 0.05; const lg2 = ctx.createGain(); lg2.gain.value = f * 0.01;
        l2.connect(lg2); lg2.connect(o.o.frequency); l2.start();
      });
      padIn.connect(pl); pl.connect(g);

      // chamber: sub + shimmer, slow pulse
      g = mk('chamber');
      const sub = osc('sine', 41, g, 0.7);
      const shimmer = osc('sine', 1760, g, 0.015);
      const pl2 = ctx.createOscillator(); pl2.frequency.value = 0.35; const plg = ctx.createGain(); plg.gain.value = 0.25;
      pl2.connect(plg); plg.connect(sub.g.gain); pl2.start();

      // heartbeat
      L.heart = { g: mk('heart') };
      horns = setInterval(() => A._cityEvent(), 9000);
      A.scene(curScene, 0.1);
    },

    setVolume(v) { volume = v; if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05); },
    getVolume() { return volume; },
    setTTS(on) { ttsOn = on; if (!on && window.speechSynthesis) speechSynthesis.cancel(); },
    getTTS() { return ttsOn; },

    // ---------- bus volumes: Music / Ambience / SFX / Dialogue ----------
    // "Music OFF" (bus === 'music', v === 0) silences the memory pad and the
    // debate-chamber drone; "Ambience OFF" silences rain, city, hum and the
    // fan - the continuous loops that get tiring on a long session. SFX
    // (interaction/UI/scanner/notification sounds) and Dialogue (MNEMOS's
    // spoken voice) are separate buses so turning either of the above off
    // never removes essential gameplay feedback.
    setBusVolume(bus, v) {
      busVol[bus] = v;
      const node = { music: musicBus, ambience: ambienceBus, sfx: sfxBus, dialogue: dialogueBus }[bus];
      if (!node) return;
      node.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
      // Web Audio only renders what is connected to the output, so a muted
      // bus is disconnected once its fade-out finishes - every loop feeding
      // it then costs no CPU at all. (dialogueBus feeds nothing: TTS is the
      // browser's own speechSynthesis.)
      clearTimeout(node._dc);
      if (v <= 0.001) {
        node._dc = setTimeout(() => { if (busVol[bus] <= 0.001 && !node._off) { try { node.disconnect(); } catch (e) { } node._off = true; } }, 250);
      } else if (node._off) { node.connect(master); node._off = false; }
    },
    getBusVolume(bus) { return busVol[bus]; },

    scene(name, fade) {
      curScene = name; if (!ctx) return;
      fade = fade === undefined ? 1.6 : fade;
      const P = {
        none:    { rain: 0, city: 0, hum: 0, fan: 0, pad: 0, chamber: 0, heart: 0, rainF: 9000, fanF: 300 },
        title:   { rain: 0.32, city: 0.25, hum: 0.10, fan: 0, pad: 0.16, chamber: 0, heart: 0, rainF: 6000, fanF: 300 },
        office:  { rain: 0.34, city: 0.28, hum: 0.20, fan: 0.16, pad: 0, chamber: 0, heart: 0, rainF: 7500, fanF: 320 },
        memory:  { rain: 0.20, city: 0.02, hum: 0.05, fan: 0.12, pad: 0.30, chamber: 0, heart: 0.55, rainF: 650, fanF: 200 },
        lab:     { rain: 0, city: 0, hum: 0.30, fan: 0, pad: 0.22, chamber: 0.10, heart: 0.30, rainF: 500, fanF: 200 },
        chamber: { rain: 0, city: 0, hum: 0.10, fan: 0, pad: 0, chamber: 0.55, heart: 0, rainF: 500, fanF: 200 },
        silent:  { rain: 0, city: 0, hum: 0, fan: 0, pad: 0, chamber: 0.12, heart: 0, rainF: 500, fanF: 200 },
        warm:    { rain: 0.05, city: 0, hum: 0, fan: 0, pad: 0.30, chamber: 0, heart: 0, rainF: 900, fanF: 200 }
      };
      const p = P[name] || P.none, now = ctx.currentTime, tc = fade / 3;
      ['rain', 'city', 'hum', 'fan', 'pad', 'chamber'].forEach((k) => {
        const l = L[k]; if (!l) return;
        l.g.gain.setTargetAtTime(p[k], now, tc);
        clearTimeout(l.t);
        if (p[k] > 0) { if (!l.on) { l.g.connect(l.bus); l.on = true; } }
        else l.t = setTimeout(() => { if (l.on) { try { l.g.disconnect(); } catch (e) { } l.on = false; } }, (fade + 0.6) * 1000);
      });
      rainLP.frequency.setTargetAtTime(p.rainF, now, tc);
      fanLP.frequency.setTargetAtTime(p.fanF, now, tc);
      heartLevel = p.heart;
      if (heartLevel > 0 && !heartTimer) {
        heartTimer = setInterval(() => A._thump(), 950);
      } else if (heartLevel <= 0 && heartTimer) { clearInterval(heartTimer); heartTimer = null; }
    },

    _thump() {
      if (!ctx || heartLevel <= 0 || busVol.ambience <= 0.001) return;
      const t = ctx.currentTime;
      [0, 0.18].forEach((d, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(70 - i * 10, t + d);
        o.frequency.exponentialRampToValueAtTime(38, t + d + 0.16);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t + d);
        g.gain.linearRampToValueAtTime(heartLevel * (i ? 0.7 : 1) * 0.9, t + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.25);
        o.connect(g); g.connect(ambienceBus); o.start(t + d); o.stop(t + d + 0.3);
      });
    },
    _cityEvent() {
      if (!ctx || busVol.ambience <= 0.001 || (curScene !== 'office' && curScene !== 'title')) return;
      // distant hover-transport whoosh or horn - ambience, like the city loop it punctuates
      const t = ctx.currentTime;
      if (Math.random() < 0.5) {
        const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3;
        f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1500, t + 2.4);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 1.1); g.gain.linearRampToValueAtTime(0, t + 2.6);
        s.connect(f); f.connect(g); g.connect(ambienceBus); s.start(t); s.stop(t + 2.7);
      } else {
        const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 330; const g = ctx.createGain();
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.05); g.gain.linearRampToValueAtTime(0, t + 0.5);
        o.connect(lp); lp.connect(g); g.connect(reverb); g.connect(ambienceBus); o.start(t); o.stop(t + 0.6);
      }
    },

    // ---------- SFX (interaction / UI / notification cues - always audible
    // regardless of the Music or Ambience settings, per the brief: essential
    // gameplay feedback is never gated by the "long session" mute options) ----------
    _tone(f, dur, type, vol, slide, dest) {
      if (!ctx || !sfxOn) return;
      const t = ctx.currentTime, o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || 0.1, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(dest || sfxBus); o.start(t); o.stop(t + dur + 0.05);
    },
    _noise(dur, fType, f0, f1, vol, dest) {
      if (!ctx || !sfxOn) return;
      const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = fType; f.Q.value = 1.2; f.frequency.setValueAtTime(f0, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.15);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      s.connect(f); f.connect(g); g.connect(dest || sfxBus); s.start(t); s.stop(t + dur + 0.05);
    },
    click() { A._tone(880, 0.05, 'square', 0.03); },
    tick() { A._tone(1500, 0.02, 'square', 0.012); },
    confirm() { A._tone(520, 0.09, 'sine', 0.08); setTimeout(() => A._tone(780, 0.14, 'sine', 0.08), 70); },
    error() { A._tone(180, 0.22, 'sawtooth', 0.07, 0.6); },
    ping() { A._tone(1240, 0.5, 'sine', 0.07, 1); A._tone(1860, 0.35, 'sine', 0.03, 1); },
    evidence() { [660, 880, 1320].forEach((f, i) => setTimeout(() => { A._tone(f, 0.5, 'sine', 0.07, 1); }, i * 80)); },
    step() { A._noise(0.09, 'lowpass', 500, 120, 0.05); },
    door() { A._noise(0.8, 'bandpass', 400, 1600, 0.09); A._tone(90, 0.7, 'sawtooth', 0.04, 0.7); },
    whoosh(d) { A._noise(d || 1.4, 'bandpass', 200, 3800, 0.18); },
    scan(d) { d = d || 2; A._tone(200, d, 'sawtooth', 0.05, 8); A._noise(d, 'bandpass', 300, 5000, 0.08); },
    phoneBuzz() { for (let i = 0; i < 3; i++) setTimeout(() => A._tone(140, 0.18, 'square', 0.05), i * 260); },
    stinger() { A._tone(55, 2.2, 'sawtooth', 0.09, 0.5); A._noise(1.6, 'lowpass', 900, 60, 0.12); A._tone(41, 3, 'sine', 0.18); },
    alarm() { for (let i = 0; i < 4; i++) setTimeout(() => A._tone(i % 2 ? 620 : 480, 0.16, 'square', 0.05), i * 190); },
    glitch(d) {
      if (!ctx || !sfxOn) return; d = d || 0.4;
      const n = Math.max(3, Math.round(d * 14));
      for (let i = 0; i < n; i++) setTimeout(() => {
        A._noise(0.03 + Math.random() * 0.05, 'bandpass', 500 + Math.random() * 4000, 200 + Math.random() * 3000, 0.09);
        if (Math.random() < 0.4) A._tone(200 + Math.random() * 1400, 0.04, 'square', 0.04);
      }, i * (d * 1000 / n));
    },
    reverse() { // reversed-swell
      if (!ctx || !sfxOn) return; const t = ctx.currentTime;
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
      f.frequency.setValueAtTime(3000, t); f.frequency.exponentialRampToValueAtTime(200, t + 1.6);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0008, t); g.gain.exponentialRampToValueAtTime(0.16, t + 1.5); g.gain.linearRampToValueAtTime(0, t + 1.6);
      s.connect(f); f.connect(g); g.connect(reverb); g.connect(sfxBus); s.start(t); s.stop(t + 1.7);
    },
    enterMemory() { A.reverse(); A._tone(60, 2.4, 'sine', 0.2, 3); setTimeout(() => A.whoosh(1.6), 700); },
    pulse() { A._tone(60, 0.9, 'sine', 0.2, 0.7); },
    thunder() { A._noise(3.4, 'lowpass', 400, 50, 0.32); },
    // per-character speech blips
    blip(who) {
      if (!ctx || !sfxOn) return;
      const base = { 'RAHIM': 118, 'M-09': 150, 'NUSRAT': 300, 'MNEMOS': 0, 'SYSTEM': 0, 'MEMORY': 210 }[who];
      if (!base) return;
      A._tone(base * (0.9 + Math.random() * 0.35), 0.06, 'triangle', who === 'RAHIM' ? 0.028 : 0.02);
    },
    speak(text, who) {
      if (!ttsOn || !window.speechSynthesis || who !== 'MNEMOS') return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text).replace(/MNEMOS/g, 'Neemos').replace(/M-09/g, 'M zero nine').replace(/[█░]/g, ''));
        u.pitch = 0.55; u.rate = 0.88; u.volume = 0.95 * busVol.dialogue * volume;
        if (!voice) {
          const vs = speechSynthesis.getVoices();
          voice = vs.find((v) => /en[-_]/i.test(v.lang) && /(David|Guy|Mark|Daniel|Alex|Male)/i.test(v.name)) || vs.find((v) => /^en/i.test(v.lang)) || null;
        }
        if (voice) u.voice = voice;
        speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    },
    stopSpeak() { if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { } }
  };
  if (window.speechSynthesis) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => { voice = null; }; } catch (e) { } }
})();
