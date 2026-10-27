// store.js: the only file that reads or writes saved data.
// Why a separate file: today data lives in this browser (localStorage). Later it can be swapped
// for a real backend (for example Supabase) without touching the screens in app.js.
window.Store = (function () {
  var PREFIX = "unicook.";
  // Fallback copy in memory: private windows can block storage, and the app must still work.
  var memory = {};

  function get(key, fallback) {
    try {
      var raw = window.localStorage.getItem(PREFIX + key);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) { /* storage blocked or bad JSON: use memory or the default */ }
    if (key in memory) return JSON.parse(memory[key]);
    return fallback;
  }

  function set(key, value) {
    memory[key] = JSON.stringify(value);
    try { window.localStorage.setItem(PREFIX + key, memory[key]); } catch (e) { /* memory copy still works */ }
  }

  function clearAll() {
    memory = {};
    try {
      Object.keys(window.localStorage)
        .filter(function (k) { return k.indexOf(PREFIX) === 0; })
        .forEach(function (k) { window.localStorage.removeItem(k); });
    } catch (e) { /* nothing saved to clear */ }
  }

  return { get: get, set: set, clearAll: clearAll };
})();
