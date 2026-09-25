/* MEMORY MARKET — localization core. Centralized dictionary lookup: every
   player-facing string goes through I18n.t(key) / the L() shorthand, never a
   scattered `lang === 'bn' ? ... : ...` at the call site. Locale dictionaries
   themselves live in js/locale/en.js and js/locale/bn.js. */
window.MM = window.MM || {};
(function () {
  const MM = window.MM;
  const KEY = 'memory_market_lang';
  const SUPPORTED = ['en', 'bn'];

  const I = MM.I18n = {
    lang: null,

    get(path, dict) {
      const parts = path.split('.');
      let v = dict;
      for (const p of parts) { if (v == null) return undefined; v = v[p]; }
      return v;
    },

    // t('ch1.rahim.greeting') -> current language string, falling back to
    // English, then to the key itself so a missing translation is visible
    // and debuggable instead of silently blank.
    t(path, vars) {
      const dicts = MM.Locale || {};
      let s = I.get(path, dicts[I.lang]);
      if (s === undefined) s = I.get(path, dicts.en);
      if (s === undefined) return path;
      if (vars) for (const k in vars) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      return s;
    },

    setLang(lang, opts) {
      if (SUPPORTED.indexOf(lang) < 0) lang = 'en';
      I.lang = lang;
      try { localStorage.setItem(KEY, lang); } catch (e) { /* fine */ }
      document.documentElement.lang = lang;
      MM.emit && MM.emit('lang', lang);
      if (!(opts && opts.silent) && MM.UI && MM.UI.refreshStaticText) MM.UI.refreshStaticText();
    },

    savedLang() {
      try { return localStorage.getItem(KEY); } catch (e) { return null; }
    },

    // true on a completely fresh browser (no language chosen yet) - drives
    // whether the first-launch language screen shows.
    needsSelection() { return !I.savedLang(); }
  };

  // shorthand used throughout the game code
  MM.L = (path, vars) => I.t(path, vars);

  // Dialogue/content translator: looks up the ENGLISH source string itself in
  // Locale.<lang>.dlg. This is the single chokepoint UI.say/sayAll/choice/
  // objective/toast/chapterCard/evidence run every player-facing narrative
  // string through, so individual dialogue call sites across the chapter
  // files never need to change - only the dictionary needs filling in.
  // Falls back to the English original when no translation exists yet, so a
  // gap is a silent no-op in English mode and a visible (not a crash) English
  // fallback line in Bengali mode.
  MM.Tr = (text) => {
    if (!text || I.lang !== 'bn') return text;
    const dict = MM.Locale && MM.Locale.bn && MM.Locale.bn.dlg;
    return (dict && dict[text]) || text;
  };
})();
