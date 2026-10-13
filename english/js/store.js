/* What the app remembers on this device: stars, the daily streak, today's count, each
   word's review box and the sticker album. Saved in localStorage; if the browser refuses
   (private mode), everything still works for this visit. */
(function () {
  'use strict';

  const KEY = 'vocab-quest-v1';
  // Review boxes: a missed word goes to box 1. Each right answer moves it up a box, and the
  // box says how many days to wait before it comes back. Past box 4 the word is learned.
  const WAIT = { 1: 1, 2: 3, 3: 7, 4: 14 };
  const LEARNED = 5;

  const fresh = () => ({
    stars: 0,
    streak: 0,
    lastDay: '',
    today: { day: '', right: 0 },
    goal: 10,
    words: {},
    stickers: [],
    quizzes: 0,
    best: 0,
    level: 1,
    mode: 'meaning',
    sound: true,
  });

  let data = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(fresh(), JSON.parse(raw));
  } catch (e) { /* nothing saved or storage blocked */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
  }

  // Can this page keep anything? Some views (private windows, some app previews) refuse or
  // forget storage; the home screen says so, and the save code still works there.
  let canSave = false;
  try {
    localStorage.setItem(KEY + '-test', '1');
    canSave = localStorage.getItem(KEY + '-test') === '1';
    localStorage.removeItem(KEY + '-test');
  } catch (e) { canSave = false; }
  // Ask the browser not to clear this site's data on its own (Safari, Chrome, Firefox).
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* not offered */ }

  /* The save code: the whole record as text, to keep in a memo and paste back later or on
     another device. Words are stored as [box, due day, times right, times wrong]. */
  const CODE = 'VQ1-';
  const EPOCH = '2026-01-01';
  function toCode() {
    const words = {};
    for (const w in data.words) {
      const r = data.words[w];
      words[w] = [r.box, r.due ? daysBetween(EPOCH, r.due) : null, r.right, r.wrong];
    }
    const json = JSON.stringify(Object.assign({}, data, { words }));
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return CODE + btoa(bin);
  }
  function fromCode(text) {
    const code = String(text || '').replace(/\s+/g, '');
    const at = code.indexOf(CODE);
    if (at < 0) return false;
    try {
      const bin = atob(code.slice(at + CODE.length));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const obj = JSON.parse(new TextDecoder().decode(bytes));
      if (!obj || typeof obj !== 'object' || !obj.words || typeof obj.words !== 'object') return false;
      const words = {};
      for (const w in obj.words) {
        const [box, due, right, wrong] = obj.words[w];
        const d = new Date(EPOCH + 'T12:00:00');
        if (due != null) d.setDate(d.getDate() + due);
        words[w] = { box: +box || 0, due: due == null ? '' : dayKeyOf(d), right: +right || 0, wrong: +wrong || 0 };
      }
      data = Object.assign(fresh(), obj, { words });
      save();
      return true;
    } catch (e) {
      return false;
    }
  }

  // Calendar days in local time. Store.dayOffset lets the check mode pretend days passed.
  let dayOffset = 0;
  const dayKeyOf = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function dayKey(plus = 0) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + dayOffset + plus);
    return dayKeyOf(d);
  }
  function daysBetween(a, b) {
    const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
  }

  function rollDay() {
    const t = dayKey();
    if (data.today.day !== t) data.today = { day: t, right: 0 };
  }

  const Store = {
    get data() { rollDay(); return data; },
    save,
    dayKey,
    daysBetween,
    WAIT,
    LEARNED,
    setDayOffset(n) { dayOffset = n; },

    // The streak counts days with at least one finished quiz, ending today or yesterday.
    streakNow() {
      if (!data.lastDay) return 0;
      const gap = daysBetween(data.lastDay, dayKey());
      return gap <= 1 ? data.streak : 0;
    },

    word(w) { return data.words[w] || null; },

    // Record an answer. Returns what changed so the screen can say it.
    answer(w, right) {
      rollDay();
      const rec = data.words[w] || (data.words[w] = { box: 0, due: '', right: 0, wrong: 0 });
      const before = rec.box;
      if (right) {
        rec.right++;
        data.today.right++;
        if (rec.box >= 1 && rec.box < LEARNED && rec.due && rec.due <= dayKey()) {
          rec.box++;
          rec.due = rec.box >= LEARNED ? '' : dayKey(WAIT[rec.box]);
        }
      } else {
        rec.wrong++;
        rec.box = 1;
        rec.due = dayKey(WAIT[1]);
      }
      save();
      return { before, after: rec.box, due: rec.due };
    },

    addStars(n) { data.stars = Math.max(0, data.stars + n); save(); },

    finishQuiz(score) {
      const t = dayKey();
      if (data.lastDay !== t) {
        data.streak = data.lastDay && daysBetween(data.lastDay, t) === 1 ? data.streak + 1 : 1;
        data.lastDay = t;
      }
      data.quizzes++;
      if (score != null && score > data.best) data.best = score;
      save();
    },

    // Words waiting in the review book, soonest first.
    reviewList() {
      const out = [];
      for (const w in data.words) {
        const r = data.words[w];
        if (r.box >= 1 && r.box < LEARNED) out.push({ w, box: r.box, due: r.due });
      }
      return out.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.w < b.w ? -1 : 1));
    },
    dueWords() { const t = dayKey(); return this.reviewList().filter((r) => r.due <= t); },
    learnedCount() { let n = 0; for (const w in data.words) if (data.words[w].box >= LEARNED) n++; return n; },
    knownIn(words) { return words.filter((x) => data.words[x.w] && data.words[x.w].right > 0).length; },

    giveSticker(total) {
      if (data.stickers.length >= total) return null;
      const id = data.stickers.length;
      data.stickers.push(id);
      save();
      return id;
    },

    get canSave() { return canSave; },
    toCode,
    fromCode,
    set(k, v) { data[k] = v; save(); },
    reset() { data = fresh(); save(); },
  };

  window.Store = Store;
})();
