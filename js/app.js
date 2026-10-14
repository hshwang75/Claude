/* Crayon Piano: keyboard, song menu, listen and follow-along modes, the two games (음 맞히기 and
   리듬 놀이), and screen layout. */
(function () {
  'use strict';

  const C = window.Crayon, S = window.Sound, SONGS = window.SONGS;
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const stage = $('stage'), kb = $('kb');

  /* ---------- notes ---------- */
  const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];
  const SOLFEGE = ['도', '도#', '레', '레#', '미', '파', '파#', '솔', '솔#', '라', '라#', '시'];
  const LETTERS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const PC_VAR = { 0: '--c-do', 2: '--c-re', 4: '--c-mi', 5: '--c-fa', 7: '--c-sol', 9: '--c-la', 11: '--c-si' };
  const LABEL_TEXT = { solfege: '도레미', letter: 'C D E', none: '이름 없음' };
  const pcOf = (m) => ((m % 12) + 12) % 12;
  const isBlack = (m) => !WHITE_PC.includes(pcOf(m));
  const noteColor = (m) => C.hexToRgb(C.tok(PC_VAR[pcOf(m)] || '--c-black'));

  const store = {
    get(k) { try { return localStorage.getItem('crayon-piano:' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('crayon-piano:' + k, v); } catch (e) { /* storage blocked */ } },
  };

  const state = {
    labels: LABEL_TEXT[store.get('labels')] ? store.get('labels') : 'solfege',
    wide: store.get('keys') === 'wide', // more, narrower keys, like a real piano's right hand
    keys: {},          // midi -> key element
    fx: null,
    kbSize: [0, 0],
    mode: 'free',      // 'free' | 'listen' | 'follow' | 'quiz' | 'rhythm'
    song: null,
    listen: null,
    follow: null,
    quiz: null,
    rhythm: null,
    rhythmSpeed: store.get('rhythm-speed') === 'normal' ? 'normal' : 'slow',
    skySize: [0, 0],
    hintKey: null,
    ribbonNotes: [],
    ribbonAt: 0,
    page: 0,
    request: 0,      // bumps on every song choice and on 그만, so a late-loading song cannot start
    range: [60, 79],
    offsets: [],       // octave move of each tune note of the playing song on the keys (see songOffsets)
  };
  // ?speed=8 in the address plays songs faster; only used for automated checks.
  const TEST_SPEED = Number(new URLSearchParams(location.search).get('speed')) || 1;
  const nameOf = (m) => (state.labels === 'none' ? '' : (state.labels === 'letter' ? LETTERS : SOLFEGE)[pcOf(m)]);

  /* ---------- crayon textures and pictures ---------- */
  root.style.setProperty('--paper-tex', `url(${C.paperTile()})`);
  root.style.setProperty('--wax', `url(${C.waxTile()})`);
  C.hydrate(document);
  C.fillLogos(document);

  /* ---------- layout: always landscape ---------- */
  // An iPhone or iPad, and whether the app runs inside another page's frame (itch.io).
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
  const FRAMED = window.top !== window.self;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  document.body.appendChild(probe);

  function layout() {
    if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
    const vw = window.innerWidth, vh = window.innerHeight;
    const portrait = vh > vw;
    const W = portrait ? vh : vw, H = portrait ? vw : vh;
    stage.style.width = W + 'px';
    stage.style.height = H + 'px';
    // Upright phone: turn the stage a quarter turn so it reads as landscape once the phone is turned.
    stage.style.transform = portrait ? `translateX(${vw}px) rotate(90deg)` : 'none';

    const p = getComputedStyle(probe);
    const i = { t: parseFloat(p.paddingTop) || 0, r: parseFloat(p.paddingRight) || 0, b: parseFloat(p.paddingBottom) || 0, l: parseFloat(p.paddingLeft) || 0 };
    const s = portrait ? { l: i.t, r: i.b, t: i.r, b: i.l } : { ...i };
    // With the iPhone itself turned sideways, taps near the top of the screen get lost: Safari
    // keeps a band there for its own bars, and inside a game site's frame (itch.io, in Safari or
    // opened from a home-screen shortcut) touches are reported a little above the finger. Keep
    // the buttons lower there, and let each button also take touches from just above it.
    const sideways = IOS && !portrait;
    if (sideways && (FRAMED || !navigator.standalone)) s.t += 44;
    root.classList.toggle('reach-up', sideways && FRAMED);
    const innerW = W - s.l - s.r, innerH = H - s.t - s.b;
    const z = Math.min(1.6, Math.max(0.72, Math.min(innerW / 812, innerH / 375)));
    const set = (k, v) => root.style.setProperty(k, v);
    set('--z', z.toFixed(4));
    set('--sl', s.l + 'px'); set('--sr', s.r + 'px'); set('--st', s.t + 'px'); set('--sb', s.b + 'px');
    set('--lw', (innerW / z).toFixed(2) + 'px');
    set('--lh', (innerH / z).toFixed(2) + 'px');
    showRotateHint(portrait);

    // Keys are placed in percentages, so a small size change (Safari's toolbars coming and going)
    // only stretches them. The crayon pictures are redrawn only when the size really changes.
    const kbW = kb.offsetWidth, kbH = kb.offsetHeight, built = state.built;
    state.kbSize = [kbW, kbH];
    // From middle C up: big keys C4–G5 (C4–C6 on wide screens), or the wide keyboard C4–F6 (C4–C7).
    const count = state.wide ? (kbW / 22 >= 40 ? 22 : 18) : (kbW / 15 >= 62 ? 15 : 12);
    if (!built || count !== built.count || Math.abs(kbW - built.W) > built.W * 0.1 || Math.abs(kbH - built.H) > built.H * 0.25) {
      buildKeyboard(kbW, kbH, count);
    }
    const sky = $('sky');
    state.skySize = sky.hidden ? [0, 0] : [sky.offsetWidth, sky.offsetHeight];
  }

  let rotateHintShown = false;
  function showRotateHint(portrait) {
    const h = $('rotate-hint');
    if (!portrait) { h.hidden = true; return; }
    if (rotateHintShown) return;
    rotateHintShown = true;
    h.hidden = false;
    setTimeout(() => h.classList.add('fade'), 4500);
    setTimeout(() => { h.hidden = true; }, 5200);
  }

  /* ---------- keyboard ---------- */
  function buildKeyboard(W, H, count) {
    kb.textContent = '';
    state.keys = {};
    state.geom = {};
    state.hintKey = null;
    state.built = null;
    if (W < 60 || H < 60) return;
    state.built = { W, H, count };
    const whites = [];
    for (let m = 60; whites.length < count; m++) if (!isBlack(m)) whites.push(m);
    const kw = W / count, bw = kw * 0.6, bh = H * 0.6;
    const plum = C.hexToRgb(C.tok('--c-black'));
    const dotSize = Math.round(Math.min(kw * 0.64, 64));
    const pct = (v) => (v * 100).toFixed(4) + '%';
    state.dotSize = dotSize;
    state.range = [whites[0], whites[whites.length - 1]];
    if (state.song) state.offsets = songOffsets(state.song);

    whites.forEach((m, i) => {
      const col = noteColor(m);
      const el = document.createElement('div');
      el.className = 'key white';
      el.dataset.midi = m;
      el.style.left = pct(i / count);
      el.style.width = pct(1 / count);
      state.geom[m] = { x: (i + 0.5) / count, w: kw, black: false };
      const face = C.key(kw, H, { seed: m * 7, fill: '#fffdf8', edge: C.shade(col, -0.2) });
      face.className = 'face';
      // A colored copy of the key that shows while it is pressed or hinted.
      const glow = C.key(kw, H, { seed: m * 7 + 1, fill: col, edge: C.shade(col, -0.35) });
      glow.className = 'face glow';
      const lbl = document.createElement('span');
      lbl.className = 'lbl';
      lbl.style.setProperty('--dc', C.hex(col));
      lbl.style.setProperty('--d', dotSize + 'px');
      lbl.style.fontSize = Math.round(dotSize * 0.5) + 'px';
      el.append(face, glow, lbl);
      kb.appendChild(el);
      state.keys[m] = el;
    });
    whites.forEach((m, i) => {
      const pc = pcOf(m);
      if (i === whites.length - 1 || pc === 4 || pc === 11) return;
      const b = m + 1;
      const el = document.createElement('div');
      el.className = 'key black';
      el.dataset.midi = b;
      el.style.left = pct((i + 1) / count - 0.3 / count);
      el.style.width = pct(0.6 / count);
      el.style.height = '60%';
      state.geom[b] = { x: (i + 1) / count, w: bw, black: true };
      const face = C.key(bw, bh, { seed: b * 13, fill: plum, edge: C.shade(plum, -0.35), black: true });
      face.className = 'face';
      el.appendChild(face);
      kb.appendChild(el);
      state.keys[b] = el;
    });
    const rail = C.rail(W, 14, 5, plum);
    rail.className = 'rail';
    kb.appendChild(rail);
    // The bouncing star of follow mode: one element that moves from key to key.
    state.marker = document.createElement('div');
    state.marker.className = 'marker';
    state.marker.hidden = true;
    const star = new Image();
    star.alt = '';
    star.src = C.doodleURL('star', 50, 7);
    state.marker.appendChild(star);
    kb.appendChild(state.marker);
    state.fx = document.createElement('div');
    state.fx.className = 'fx';
    kb.appendChild(state.fx);
    renderLabels();
    if (state.mode === 'follow') showHint();
    if (state.quiz && state.quiz.hinted) hintAt(state.quiz.qs[state.quiz.i]);
  }

  function renderLabels() {
    Object.entries(state.keys).forEach(([m, el]) => {
      const l = el.querySelector('.lbl');
      if (l) l.textContent = nameOf(+m);
    });
    if (state.mode === 'listen' || state.mode === 'follow') setRibbon(state.ribbonAt);
    $('btn-labels').textContent = LABEL_TEXT[state.labels];
    renderQuizLevels();
  }
  const KEYS_ICON = {
    big: '<svg viewBox="0 0 28 22" width="28" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="2" y="2" width="24" height="18" rx="2.5"/><path d="M10 2v18M18 2v18"/><path d="M10 2v9M18 2v9" stroke-width="5"/></svg>',
    wide: '<svg viewBox="0 0 28 22" width="28" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="1.5" y="2" width="25" height="18" rx="2"/><path d="M5.7 2v18M9.8 2v18M14 2v18M18.2 2v18M22.3 2v18"/><path d="M5.7 2v9M9.8 2v9M18.2 2v9M22.3 2v9" stroke-width="3"/></svg>',
  };
  function renderKeysButton() {
    const b = $('btn-keys');
    b.innerHTML = KEYS_ICON[state.wide ? 'wide' : 'big'];
    b.setAttribute('aria-label', state.wide ? '넓은 건반' : '큰 건반');
  }

  const lightOn = (k) => { k._n = (k._n || 0) + 1; k.classList.add('on'); };
  const lightOff = (k) => {
    if (!k) return;
    k._n = Math.max(0, (k._n || 0) - 1);
    if (!k._n) k.classList.remove('on');
  };

  const FX_KINDS = ['heart', 'note', 'star', 'flower'];
  function burst(k, count) {
    const fx = state.fx, g = state.geom[k.dataset.midi];
    if (!fx || !g || !k.isConnected) return;
    // Positions come from the saved key layout, so no layout has to be measured mid-tap.
    const x = g.x * state.kbSize[0], y = state.kbSize[1] * (g.black ? 0.3 : 0.55);
    const n = count ?? (Math.random() < 0.5 ? 1 : 2);
    for (let i = 0; i < n; i++) {
      const kind = FX_KINDS[(Math.random() * FX_KINDS.length) | 0];
      const im = new Image();
      im.alt = '';
      im.src = C.doodleURL(kind, 34, 1 + ((Math.random() * 4) | 0), kind === 'note' ? C.hex(noteColor(+k.dataset.midi)) : null);
      im.style.left = x + 'px';
      im.style.top = y + 'px';
      im.style.setProperty('--dx', (Math.random() - 0.5) * 90 + 'px');
      im.style.setProperty('--rot', (Math.random() - 0.5) * 70 + 'deg');
      im.addEventListener('animationend', () => im.remove());
      fx.appendChild(im);
    }
    while (fx.childElementCount > 40) fx.firstElementChild.remove();
  }

  let soundHintAt = 0;
  function userPress(k) {
    lightOn(k);
    const m = +k.dataset.midi;
    const v = S.play(m);
    if (!S.running && performance.now() - soundHintAt > 6000) {
      soundHintAt = performance.now();
      toast(`소리를 켜고 있어요. 계속 안 나면 화면을 다시 톡 눌러 주세요. (소리: ${S.status}, 피아노 ${S.loaded}/22)`);
    }
    burst(k);
    if (state.mode === 'quiz') quizAnswer(m);
    else if (state.mode === 'rhythm') rhythmHit(m);
    else onUserNote(m);
    return v;
  }
  function userLift(p) {
    if (p.v) p.v.release();
    lightOff(p.k);
  }

  // Touch and mouse: each finger plays its own key and can slide across keys.
  const keyAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const k = el && el.closest ? el.closest('.key') : null;
    return k && kb.contains(k) ? k : null;
  };
  const pointers = new Map();
  kb.addEventListener('pointerdown', (e) => {
    const k = e.target.closest ? e.target.closest('.key') : null;
    if (!k) return;
    e.preventDefault();
    S.unlock();
    pointers.set(e.pointerId, { k, v: userPress(k) });
  });
  window.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const k = keyAt(e.clientX, e.clientY);
    if (k !== p.k) {
      userLift(p);
      p.k = k;
      p.v = k ? userPress(k) : null;
    }
  });
  const pointerEnd = (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    userLift(p);
    pointers.delete(e.pointerId);
  };
  window.addEventListener('pointerup', pointerEnd);
  window.addEventListener('pointercancel', pointerEnd);

  // Computer keyboard: A S D F G H J K L ; ' are the white keys from 도, W E T Y U O P the black keys.
  const KEYMAP = {
    KeyA: 60, KeyW: 61, KeyS: 62, KeyE: 63, KeyD: 64, KeyF: 65, KeyT: 66, KeyG: 67, KeyY: 68, KeyH: 69,
    KeyU: 70, KeyJ: 71, KeyK: 72, KeyO: 73, KeyL: 74, KeyP: 75, Semicolon: 76, Quote: 77,
  };
  const held = new Map();
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { escape(); return; }
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = state.keys[KEYMAP[e.code]];
    if (!k || !$('start').hidden || menuOpen() || gamesOpen()) return;
    e.preventDefault();
    S.unlock();
    held.set(e.code, { k, v: userPress(k) });
  });
  window.addEventListener('keyup', (e) => {
    const p = held.get(e.code);
    if (!p) return;
    userLift(p);
    held.delete(e.code);
  });

  /* ---------- buttons ---------- */
  // Buttons act the moment the finger lifts. iPhones sometimes delay or drop the browser's own
  // 'click' (inside game frames, or when they wait to see if a tap is a double tap), which made
  // buttons need two or three presses. A keyboard still works through 'click'.
  // The click that follows a tap is skipped: it can come more than a second late when the tap
  // started heavy work (a new keyboard), so it is matched to the tap, not only timed.
  let lastTap = 0, tapPending = false;
  document.addEventListener('pointerdown', () => { tapPending = false; }, true);
  function onTap(area, fn) {
    let down = null;
    const clear = () => { if (down) down.b.classList.remove('pressed'); down = null; };
    area.addEventListener('pointerdown', (e) => {
      const b = e.target.closest && e.target.closest('button');
      if (!b || !area.contains(b) || b.disabled) return;
      clear();
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, b };
      b.classList.add('pressed');
    });
    area.addEventListener('pointerup', (e) => {
      if (!down || e.pointerId !== down.id) return;
      const { b, x, y } = down;
      clear();
      if (Math.hypot(e.clientX - x, e.clientY - y) > 30) return; // a slide, not a tap
      lastTap = performance.now();
      tapPending = true;
      S.unlock();
      fn(b);
    });
    area.addEventListener('pointercancel', clear);
    area.addEventListener('click', (e) => {
      if (tapPending || performance.now() - lastTap < 800) { tapPending = false; return; } // the tap already did it
      const b = e.target.closest && e.target.closest('button');
      if (b && area.contains(b)) fn(b);
    });
  }

  /* ---------- song bar and note ribbon ---------- */
  function showSongBar(song, modeText) {
    $('bar-free').hidden = true;
    $('bar-song').hidden = false;
    $('song-title').textContent = song.title;
    $('song-mode').textContent = modeText;
    const im = $('song-doodle');
    im.src = C.doodleURL(song.doodle, 34, 20, song.doodleCol || null);
    const track = $('ribbon');
    if (track.childElementCount !== RIBBON_DOTS) {
      track.textContent = '';
      for (let j = 0; j < RIBBON_DOTS; j++) track.appendChild(Object.assign(document.createElement('span'), { className: 'dot' }));
    }
    state.ribbonNotes = melodyNotes(song);
    setRibbon(0);
  }
  function hideSongBar() {
    $('bar-song').hidden = true;
    $('bar-game').hidden = true;
    $('bar-free').hidden = false;
  }
  // Only a short window of dots exists and the notes move through it, so a four-minute piece
  // costs the same as a short tune. The current note stays in the third dot.
  const RIBBON_DOTS = 16;
  function setRibbon(i) {
    state.ribbonAt = i;
    const dots = $('ribbon').children, notes = state.ribbonNotes, first = Math.max(0, i - 2);
    for (let j = 0; j < dots.length; j++) {
      const d = dots[j], n = first + j, m = notes[n];
      if (m == null) { d.style.visibility = 'hidden'; continue; }
      d.style.visibility = '';
      d.className = 'dot' + (isBlack(m) ? ' sharp' : '') + (n < i ? ' done' : n === i ? ' now' : '');
      d.style.setProperty('--dc', DOT_COLORS[pcOf(m)]);
      d.textContent = nameOf(m);
    }
  }
  const DOT_COLORS = Array.from({ length: 12 }, (_, pc) => C.hex(noteColor(60 + pc)));

  // The tune of a song as MIDI note numbers.
  const melodyNotes = (song) => (song.score ? song.melody.map((n) => n[2]) : song.parsed.filter((n) => n.midi != null).map((n) => n.midi));
  // A note outside the keys on screen shows an octave or two closer, on the same note name.
  function fit(m) {
    const [lo, hi] = state.range;
    while (m > hi) m -= 12;
    while (m < lo) m += 12;
    return m;
  }
  // Where each tune note of a song shows on the keys, as an octave move per note. A note stays at
  // its real height where the keys allow; a tune that goes beyond them moves by an octave at the
  // places where that keeps every step up a step up and every step down a step down on the keys,
  // so the lit keys follow the shape of what is heard. 듣기 still sounds at the real pitch.
  // (Cheapest path through the possible moves: each move costs 1, a move that turns the
  // direction around 3 more, and every note away from its real octave a little.)
  const MOVES = [-36, -24, -12, 0, 12, 24, 36];
  function songOffsets(song) {
    const [lo, hi] = state.range, notes = melodyNotes(song), back = [];
    const fits = (m, o) => m + o >= lo && m + o <= hi;
    const away = (o) => (Math.abs(o) / 12) * 0.1;
    let cost = MOVES.map((o) => (notes.length && fits(notes[0], o) ? away(o) : Infinity));
    for (let i = 1; i < notes.length; i++) {
      const a = notes[i - 1], b = notes[i], from = [];
      cost = MOVES.map((o) => {
        let best = Infinity, arg = 0;
        if (fits(b, o)) {
          MOVES.forEach((p, k) => {
            const c = cost[k] + (p === o ? 0 : 1 + (Math.sign(b + o - a - p) !== Math.sign(b - a) ? 3 : 0));
            if (c < best) { best = c; arg = k; }
          });
        }
        from.push(arg);
        return best + away(o);
      });
      back.push(from);
    }
    const out = new Array(notes.length);
    let j = cost.indexOf(Math.min(...cost));
    for (let i = notes.length - 1; i >= 0; i--) {
      out[i] = MOVES[j];
      if (i) j = back[i - 1][j];
    }
    return out;
  }
  // The key for tune note i of the playing song.
  const tuneKey = (m, i) => fit(m + (state.offsets[i] || 0));

  // Whole pieces keep their notes in songs/<id>.js; load that file the first time the song is chosen.
  function loadSong(song) {
    if (!song.score || song.melody) return Promise.resolve(song);
    if (song.loading) return song.loading;
    const ready = () => {
      const d = window.SONG_DATA && window.SONG_DATA[song.id];
      if (!d) return false;
      song.melody = d.melody;
      song.accompaniment = d.accompaniment;
      return true;
    };
    if (ready()) return Promise.resolve(song);
    song.loading = new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = 'songs/' + song.id + '.js';
      tag.onload = () => (ready() ? resolve(song) : reject(new Error('no notes')));
      tag.onerror = () => reject(new Error('could not load songs/' + song.id + '.js'));
      document.head.appendChild(tag);
    }).finally(() => { song.loading = null; });
    return song.loading;
  }
  // After the start screen, fetch every piece in the background so 듣기 starts at once later.
  function prefetchSongs() {
    const list = SONGS.filter((s) => s.score && !s.melody);
    const next = () => {
      const song = list.shift();
      if (song) loadSong(song).catch(() => {}).then(() => setTimeout(next, 250));
    };
    setTimeout(next, 1500);
  }

  /* ---------- listen: the song plays itself ---------- */
  function startListen(song) {
    stopSong();
    state.mode = 'listen';
    state.song = song;
    state.offsets = songOffsets(song);
    showSongBar(song, song.jazz ? '재즈로 듣기' : '듣기');
    // The song runs on the wall clock, not the sound card's clock: if a phone pauses its sound
    // (another app, the lock screen), the keys keep moving and the song still ends.
    const t0 = wallClock() + 0.5;
    const events = (song.score ? scoreEvents(song) : tuneEvents(song))
      .map((e) => ({ ...e, t: t0 + e.at / TEST_SPEED, dur: e.len / TEST_SPEED }))
      .sort((a, b) => a.t - b.t);
    const end = events.reduce((m, e) => Math.max(m, e.t + e.dur), t0);
    const L = state.listen = { events, next: 0, end, timeouts: [], lit: new Map(), timer: 0, warned: false, offset: 0 };
    const tick = () => {
      if (state.listen !== L) return;
      const now = wallClock();
      while (L.next < events.length && events[L.next].t < now + 0.25) {
        schedule(L, events[L.next], now);
        L.next++;
      }
      if (!S.running && !L.warned && now > t0 + 1) {
        L.warned = true;
        S.unlock();
        toast('소리가 안 나면 화면을 한 번 톡 눌러 주세요');
      }
      if (L.next >= events.length && now > L.end + 0.3) finishListen(song);
    };
    L.timer = setInterval(tick, 40);
    tick();
  }
  // Events in seconds from the start: { at, len, midi, vel, kind: 'melody' | 'fill' | 'back', i }.
  function scoreEvents(song) {
    // song.speed slows a piece down (below 1) and song.accomp sets how loud the other hand plays.
    const vel = (v, k) => (0.35 + 0.65 * (v / 127)) * k, sp = 1000 * (song.speed || 1), acc = song.accomp || 0.85;
    const mel = song.melody, back = song.accompaniment;
    const first = Math.min(mel[0][0], back.length ? back[0][0] : Infinity); // no silence before the first note
    // While the tune rests (an introduction, a passage for the other hand), the keys show the top
    // note of the accompaniment instead, so something keeps moving.
    const rests = [];
    let end = -Infinity;
    for (const [at, len] of mel) {
      if (at - end > 600) rests.push([end, at]);
      end = Math.max(end, at + len);
    }
    rests.push([end, Infinity]);
    const resting = (t) => rests.some(([a, b]) => t >= a && t < b);
    const top = new Map(); // start time -> index of the highest accompaniment note starting then
    back.forEach(([at, , midi], j) => { if (resting(at) && !(top.has(at) && back[top.get(at)][2] >= midi)) top.set(at, j); });
    const shown = new Set(top.values());
    return [
      ...mel.map(([at, len, midi, v], i) => ({ at: (at - first) / sp, len: len / sp, midi, vel: vel(v, 1), kind: 'melody', i })),
      ...back.map(([at, len, midi, v], j) => ({ at: (at - first) / sp, len: len / sp, midi, vel: vel(v, acc), kind: shown.has(j) ? 'fill' : 'back' })),
    ];
  }
  function tuneEvents(song) {
    const J = song.jazz, list = [];
    let beat = 0, idx = 0;
    for (const n of song.parsed) {
      if (n.midi != null) list.push({ beat, dur: n.beats, midi: n.midi, vel: J ? 0.95 : 0.85, kind: 'melody', i: idx++ });
      beat += n.beats;
    }
    if (J) list.push(...J.events);
    // Swing: the second half of each beat is played late, like the last note of a triplet.
    const swing = (b) => {
      const whole = Math.floor(b + 1e-9), f = b - whole;
      return whole + (f <= 0.5 ? (f * 4) / 3 : 2 / 3 + ((f - 0.5) * 2) / 3);
    };
    const spb = 60 / song.bpm;
    return list.map((e) => {
      const start = J && J.swing && !e.straight ? swing(e.beat) : e.beat;
      const stop = J && J.swing && !e.straight ? swing(e.beat + e.dur) : e.beat + e.dur;
      return { ...e, at: start * spb, len: (stop - start) * spb };
    });
  }
  const wallClock = () => performance.now() / 1000;
  function schedule(L, ev, now) {
    // Sound only while the phone's audio is running; otherwise notes would pile up and all play at once later.
    if (S.running) {
      const at = S.now() + Math.max(0, ev.t - now);
      S.play(ev.midi, { when: at, velocity: ev.vel }).release(at + ev.dur * 0.95);
    }
    if (ev.kind === 'back') return; // chords and bass only sound; the keys show the melody
    const onAt = Math.max(0, (ev.t - now) * 1000);
    const offAt = Math.max(onAt + 60, (ev.t + ev.dur * 0.8 - now) * 1000);
    let k = null;
    L.timeouts.push(setTimeout(() => {
      if (state.listen !== L) return;
      // Other notes shown while the tune rests move with the tune note before them.
      if (ev.kind === 'melody') L.offset = state.offsets[ev.i] || 0;
      k = state.keys[ev.kind === 'melody' ? tuneKey(ev.midi, ev.i) : fit(ev.midi + (L.offset || 0))];
      if (k) { lightOn(k); L.lit.set(k, (L.lit.get(k) || 0) + 1); burst(k, 1); }
      if (ev.kind === 'melody') setRibbon(ev.i);
    }, onAt));
    L.timeouts.push(setTimeout(() => {
      if (state.listen !== L) return;
      if (k && L.lit.get(k)) { lightOff(k); L.lit.set(k, L.lit.get(k) - 1); }
    }, offAt));
  }
  function endListen() {
    const L = state.listen;
    if (!L) return;
    clearInterval(L.timer);
    L.timeouts.forEach(clearTimeout);
    L.lit.forEach((n, k) => { for (let i = 0; i < n; i++) lightOff(k); });
    state.listen = null;
  }
  function finishListen(song) {
    endListen();
    state.mode = 'free';
    hideSongBar();
    showEnd('listen', song);
  }

  /* ---------- follow: the child plays each shining key ---------- */
  function startFollow(song) {
    stopSong();
    state.mode = 'follow';
    state.song = song;
    state.offsets = songOffsets(song);
    showSongBar(song, '따라치기');
    state.follow = { notes: melodyNotes(song), i: 0 };
    showHint();
  }
  function showHint() {
    clearHint();
    const F = state.follow;
    if (!F) return;
    setRibbon(F.i);
    hintAt(tuneKey(F.notes[F.i], F.i));
  }
  // Make key m shine, with the bouncing star above it.
  function hintAt(m) {
    const k = state.keys[m], g = state.geom[m];
    if (!k || !g) return;
    // Each key draws its glowing ring once and keeps it; CSS shows it while the key is hinted.
    if (!k._ring) {
      k._ring = C.ring(g.w, g.black ? state.built.H * 0.6 : state.built.H, m + 40);
      k._ring.className = 'ring';
      k.appendChild(k._ring);
    }
    k.classList.add('hint');
    const mk = state.marker, size = Math.round(Math.min(g.w * 0.75, 50));
    mk.style.width = mk.style.height = size + 'px';
    mk.style.left = `calc(${(g.x * 100).toFixed(4)}% - ${size / 2}px)`;
    mk.style.top = g.black ? '18%' : `calc(92% - ${state.dotSize + 12 + size}px)`;
    mk.hidden = false;
    state.hintKey = k;
  }
  function clearHint() {
    if (state.hintKey) state.hintKey.classList.remove('hint');
    if (state.marker) state.marker.hidden = true;
    state.hintKey = null;
  }
  function onUserNote(m) {
    const F = state.follow;
    if (!F || state.mode !== 'follow' || m !== tuneKey(F.notes[F.i], F.i)) return;
    F.i++;
    if (F.i < F.notes.length) { showHint(); return; }
    const song = state.song;
    clearHint();
    setRibbon(F.i);
    setTimeout(() => {
      if (state.follow !== F) return;
      state.follow = null;
      state.mode = 'free';
      hideSongBar();
      showEnd('follow', song);
    }, 500);
  }

  function stopSong() {
    state.request++;
    endListen();
    endQuiz();
    endRhythm();
    if (state.follow) { clearHint(); state.follow = null; }
    if (state.mode !== 'free') S.stopAll();
    state.mode = 'free';
    state.song = null;
    state.offsets = [];
    hideSongBar();
  }

  /* ---------- song menu: eight cards a page ---------- */
  const PER_PAGE = 8;
  const pageCount = Math.ceil(SONGS.length / PER_PAGE);
  function buildMenu() {
    const list = $('song-list');
    const card = (s, i) => `
      <div class="card" style="--cc: var(${s.color})">
        <img class="ic" data-doodle="${s.doodle}" data-size="58" data-seed="${i + 20}"${s.doodleCol ? ` data-col="${s.doodleCol}"` : ''} alt="">
        <h3 class="t">${s.title}</h3>
        <div class="sub">
          <span class="c">${s.composer}</span>
          <span class="lv" role="img" aria-label="어려움 ${s.level}단계">${[1, 2, 3].map((n) => `<img data-doodle="star" data-size="16" data-seed="${n}" alt=""${n <= s.level ? '' : ' class="off"'}>`).join('')}</span>
          <span class="len">${s.length}</span>
        </div>
        <div class="acts">
          <button class="cbtn" type="button" data-play="listen" data-id="${s.id}" style="--bg: var(--c-card)">▶ 듣기</button>
          <button class="cbtn" type="button" data-play="follow" data-id="${s.id}" style="--bg: var(${s.color})"><span class="hand">✋</span>따라치기</button>
        </div>
      </div>`;
    // All pages sit side by side and slide, so turning a page needs no new layout.
    let html = `<div class="pages" style="--n: ${pageCount}">`;
    for (let p = 0; p < pageCount; p++) {
      const songs = SONGS.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
      html += `<div class="menu-grid${SONGS.length > 6 ? ' cols-4' : ''}" data-page="${p}">${songs.map((s, i) => card(s, p * PER_PAGE + i)).join('')}</div>`;
    }
    list.innerHTML = html + '</div>';
    C.hydrate(list);
    $('pager').hidden = pageCount < 2;
    showPage(0);
    onTap(list, (b) => {
      if (!b.dataset.play) return;
      const song = SONGS.find((s) => s.id === b.dataset.id);
      closeMenu();
      // A piece may take a moment to load; 그만 or another choice meanwhile cancels this one.
      const req = ++state.request;
      if (song.score && !song.melody) toast('노래를 불러오고 있어요…');
      loadSong(song)
        .then(() => {
          if (req !== state.request) return;
          hideToast();
          if (b.dataset.play === 'listen') startListen(song); else startFollow(song);
        })
        .catch(() => {
          if (req !== state.request) return;
          openMenu();
          toast('노래를 불러오지 못했어요. 다시 눌러 주세요.');
        });
    });
    onTap($('pager'), (b) => showPage(state.page + (b.id === 'btn-page-prev' ? -1 : 1)));
  }
  function showPage(p) {
    state.page = (p + pageCount) % pageCount;
    $('song-list').firstElementChild.style.setProperty('--p', state.page);
    $('page-num').textContent = `${state.page + 1} / ${pageCount}`;
  }
  function openMenu() {
    stopSong();
    $('end').hidden = true;
    $('menu').classList.remove('closed');
  }
  // The menu stays laid out while closed, so opening it is only a visibility change.
  function closeMenu() { $('menu').classList.add('closed'); }
  const menuOpen = () => !$('menu').classList.contains('closed');

  /* ---------- end screen ---------- */
  const NOTE_ICON = () => `<img src="${C.doodleURL('note', 24, 1, C.tok('--c-black'))}" width="24" height="24" alt="">`;
  const AGAIN_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19.5 4.5v4h-4"/></svg>';

  function endButton(html, colorVar, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cbtn';
    b.style.setProperty('--bg', `var(${colorVar})`);
    b.innerHTML = html;
    b._act = fn;
    $('end-acts').appendChild(b);
  }
  onTap($('end-acts'), (b) => { $('end').hidden = true; b._act(); });
  // One to three big stars for a game, the ones not earned faded.
  function bigStars(got) {
    const row = Object.assign(document.createElement('span'), { className: 'big-stars' });
    for (let i = 0; i < 3; i++) {
      const im = new Image(60, 60);
      im.alt = '';
      im.src = C.doodleURL('star', 60, 3 + i);
      if (i >= got) im.className = 'off';
      im.style.animationDelay = (0.15 + i * 0.18).toFixed(2) + 's';
      row.appendChild(im);
    }
    return row;
  }
  function showEnd(kind, song, info) {
    const slot = $('stamp-slot');
    slot.textContent = '';
    $('end-acts').textContent = '';
    $('confetti').textContent = '';
    if (kind === 'quiz' || kind === 'rhythm') {
      $('end-msg').textContent = kind === 'quiz'
        ? (info.stars >= 9 ? `별 ${info.stars}개! 귀가 정말 밝아요!` : info.stars ? `별 ${info.stars}개를 모았어요!` : '끝까지 다 찾았어요!')
        : `음표 ${info.total}개 중에 ${info.hits}개를 맞혔어요!`;
      slot.appendChild(bigStars(info.got));
      confetti();
      cheer();
      endButton(AGAIN_ICON + '한 번 더', '--c-mi', () => (kind === 'quiz' ? startQuiz(info.level) : startRhythm(song)));
      endButton('<img data-doodle="star" data-size="24" data-seed="9" alt="">다른 놀이', '--c-sol', openGames);
      endButton('건반 놀이', '--c-fa', () => {});
      C.hydrate($('end-acts'));
    } else if (kind === 'follow') {
      $('end-msg').textContent = `${song.title}, 끝까지 다 쳤어요!`;
      state.stamp = state.stamp || C.stamp(180, C.tok('--c-stamp'));
      slot.appendChild(state.stamp);
      confetti();
      cheer();
      endButton(AGAIN_ICON + '한 번 더', '--c-mi', () => startFollow(song));
      endButton(NOTE_ICON() + '다른 노래', '--c-sol', openMenu);
      endButton('건반 놀이', '--c-fa', () => {});
    } else {
      $('end-msg').textContent = '잘 들었어요! 이제 따라 쳐 볼까요?';
      endButton('✋ 따라치기', song.color, () => startFollow(song));
      endButton('▶ 다시 듣기', '--c-card', () => startListen(song));
      endButton(NOTE_ICON() + '다른 노래', '--c-sol', openMenu);
    }
    $('end').hidden = false;
  }
  function confetti() {
    const box = $('confetti');
    const lw = box.offsetWidth || 812, lh = box.offsetHeight || 375;
    const kinds = ['heart', 'flower', 'star', 'heart', 'flower'], cols = [null, '#ffb3c7', null, '#d9aaf2', '#b9c4ff'];
    for (let i = 0; i < 26; i++) {
      const k = (Math.random() * kinds.length) | 0, size = 18 + ((Math.random() * 22) | 0);
      const x = Math.random() * (lw - size);
      let y = Math.random() * (lh - size);
      if (x > lw * 0.22 && x < lw * 0.78 && y > lh * 0.12 && y < lh * 0.86) y = Math.random() < 0.5 ? Math.random() * lh * 0.1 : lh * 0.87 + Math.random() * (lh * 0.13 - size);
      const im = new Image();
      im.alt = '';
      im.src = C.doodleURL(kinds[k], 40, 1 + (i % 5), cols[k]); // one drawing per kind, shown at any size
      im.width = size; im.height = size;
      im.style.left = x + 'px';
      im.style.top = y + 'px';
      im.style.setProperty('--rot', (Math.random() - 0.5) * 60 + 'deg');
      im.style.animationDelay = (Math.random() * 0.5).toFixed(2) + 's';
      box.appendChild(im);
    }
  }
  function cheer() {
    const t = S.now() + 0.05;
    [[72, 0], [76, 0.13], [79, 0.26], [84, 0.42], [76, 0.42]].forEach(([m, d]) => {
      S.play(m, { when: t + d, velocity: 0.7 }).release(t + d + (d > 0.4 ? 1.2 : 0.3));
    });
  }

  /* ---------- 놀이 menu ---------- */
  const QUIZ_LEVELS = [
    { name: '쉬움', notes: [60, 64, 67] },
    { name: '보통', notes: [60, 62, 64, 65, 67] },
    { name: '어려움', notes: [60, 62, 64, 65, 67, 69, 71, 72] },
  ];
  // The tunes written out in songs.js (not the whole pieces): short, steady and well known.
  const RHYTHM_SONGS = SONGS.filter((s) => s.parsed && !s.jazz);
  const RHYTHM_SPEED = { slow: 0.75, normal: 1 };
  const dotName = (m) => (state.labels === 'letter' ? LETTERS : SOLFEGE)[pcOf(m)];

  function renderQuizLevels() {
    $('quiz-levels').innerHTML = QUIZ_LEVELS.map((lv, i) => `
      <button class="cbtn level" type="button" data-quiz="${i}" style="--bg: var(--c-card)">
        <b>${lv.name}</b><span class="mini">${lv.notes.map((m) => `<i style="--dc: ${DOT_COLORS[pcOf(m)]}">${dotName(m)}</i>`).join('')}</span>
      </button>`).join('');
  }
  function buildGames() {
    renderQuizLevels();
    $('rhythm-songs').innerHTML = RHYTHM_SONGS.map((s, i) => `
      <button class="cbtn chip" type="button" data-rhythm="${s.id}" style="--bg: color-mix(in srgb, var(${s.color}) 70%, var(--c-card))">
        <img data-doodle="${s.doodle}" data-size="24" data-seed="${i + 30}"${s.doodleCol ? ` data-col="${s.doodleCol}"` : ''} alt="">${s.title}
      </button>`).join('');
    C.hydrate($('rhythm-songs'));
    renderSpeed();
    onTap($('games'), (b) => {
      if (b.id === 'btn-games-close') closeGames();
      else if (b.dataset.speed) {
        state.rhythmSpeed = b.dataset.speed;
        store.set('rhythm-speed', state.rhythmSpeed);
        renderSpeed();
      } else if (b.dataset.quiz) { closeGames(); startQuiz(+b.dataset.quiz); }
      else if (b.dataset.rhythm) { closeGames(); startRhythm(SONGS.find((s) => s.id === b.dataset.rhythm)); }
    });
  }
  function renderSpeed() {
    $('rhythm-speed').querySelectorAll('[data-speed]').forEach((b) => b.classList.toggle('sel', b.dataset.speed === state.rhythmSpeed));
  }
  function openGames() {
    stopSong();
    $('end').hidden = true;
    $('games').classList.remove('closed');
  }
  function closeGames() { $('games').classList.add('closed'); }
  const gamesOpen = () => !$('games').classList.contains('closed');

  function showGameBar(title, doodle, mode, replay) {
    $('bar-free').hidden = true;
    $('bar-song').hidden = true;
    $('bar-game').hidden = false;
    $('game-title').textContent = title;
    $('game-mode').textContent = mode;
    $('game-doodle').src = C.doodleURL(doodle, 34, 21);
    $('btn-replay').hidden = !replay;
    $('game-info').textContent = '';
  }
  onTap($('bar-game'), (b) => {
    if (b.id === 'btn-game-stop') stopSong();
    else if (b.id === 'btn-replay' && state.quiz && !state.quiz.busy) playTarget(state.quiz);
  });

  // A word of praise that pops up over the keys and fades.
  let sayTimer = 0;
  function say(text, ms = 1100) {
    const el = $('say');
    el.textContent = text;
    el.hidden = false;
    el.classList.remove('pop');
    void el.offsetWidth; // restart the animation
    el.classList.add('pop');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => { el.hidden = true; }, ms);
  }
  const pick = (list) => list[(Math.random() * list.length) | 0];
  // Play note m and light its key for a moment.
  function flash(m, dur, vel = 0.8) {
    const t = S.now() + 0.02, k = state.keys[m];
    S.play(m, { when: t, velocity: vel }).release(t + dur);
    if (k) { lightOn(k); setTimeout(() => lightOff(k), dur * 1000); }
  }

  /* ---------- 음 맞히기: a note sounds, the child finds its key ---------- */
  const QUIZ_COUNT = 10;
  function startQuiz(level) {
    stopSong();
    const lv = QUIZ_LEVELS[level], qs = [];
    while (qs.length < QUIZ_COUNT) {
      const m = lv.notes[(Math.random() * lv.notes.length) | 0];
      if (m !== qs[qs.length - 1]) qs.push(m); // never the same note twice in a row
    }
    state.mode = 'quiz';
    const Q = state.quiz = { level, qs, i: 0, tries: 0, results: [], busy: true, hinted: false, timers: [] };
    showGameBar('음 맞히기', 'bunny', `${lv.name} 단계`, true);
    renderQuizInfo();
    // First the notes of this level from low to high, each key lighting up: these are the ones to listen for.
    say('이 소리들 중에 있어요', 1600);
    lv.notes.forEach((m, j) => Q.timers.push(setTimeout(() => flash(m, 0.4, 0.7), 400 + j * 380)));
    Q.timers.push(setTimeout(() => askQuiz(Q), 400 + lv.notes.length * 380 + 800));
  }
  function askQuiz(Q) {
    if (state.quiz !== Q) return;
    Q.busy = false;
    Q.tries = 0;
    Q.hinted = false;
    clearHint();
    renderQuizInfo();
    playTarget(Q);
  }
  function playTarget(Q) {
    const t = S.now() + 0.05;
    S.play(Q.qs[Q.i], { when: t, velocity: 0.85 }).release(t + 1.2);
    const b = $('btn-replay');
    b.classList.remove('ping');
    void b.offsetWidth;
    b.classList.add('ping');
  }
  function quizAnswer(m) {
    const Q = state.quiz;
    if (!Q || Q.busy) return;
    const want = Q.qs[Q.i];
    clearTimeout(Q.again);
    if (pcOf(m) === pcOf(want)) {
      // Found it: a star the first time, a flower after a second listen.
      Q.busy = true;
      const first = Q.tries === 0;
      Q.results.push(first ? 'star' : 'flower');
      clearHint();
      Q.hinted = false;
      const k = state.keys[m];
      if (k) burst(k, first ? 5 : 3);
      say(first ? pick(['딩동댕!', '맞았어요!', '최고예요!', '정답이에요!']) : '찾았어요!');
      const t = S.now() + 0.35;
      S.play(m + 12, { when: t, velocity: 0.45 }).release(t + 0.5);
      Q.i++;
      renderQuizInfo();
      Q.timers.push(setTimeout(() => (Q.i < QUIZ_COUNT ? askQuiz(Q) : finishQuiz(Q)), 1400));
      return;
    }
    // Not this one: hear the question again. After two misses its key shines.
    Q.tries++;
    if (Q.tries >= 2 && !Q.hinted) {
      Q.hinted = true;
      hintAt(want);
      say('반짝이는 건반이에요');
    } else if (!Q.hinted) {
      say('다시 들어 봐요');
    }
    Q.again = setTimeout(() => { if (state.quiz === Q && !Q.busy) playTarget(Q); }, 700);
  }
  function renderQuizInfo() {
    const Q = state.quiz, box = $('game-info');
    if (box.childElementCount !== QUIZ_COUNT) {
      box.textContent = '';
      for (let j = 0; j < QUIZ_COUNT; j++) box.appendChild(Object.assign(document.createElement('span'), { className: 'slot' }));
    }
    [...box.children].forEach((el, j) => {
      const r = Q.results[j];
      el.className = 'slot' + (r ? ' got' : j === Q.i ? ' now' : '');
      if (r && !el.firstChild) {
        const im = new Image();
        im.alt = '';
        im.src = C.doodleURL(r, 30, 5 + j, r === 'flower' ? '#ffb3c7' : null);
        el.appendChild(im);
      }
    });
  }
  function endQuiz() {
    const Q = state.quiz;
    if (!Q) return;
    Q.timers.forEach(clearTimeout);
    clearTimeout(Q.again);
    clearHint();
    state.quiz = null;
  }
  function finishQuiz(Q) {
    const stars = Q.results.filter((r) => r === 'star').length, level = Q.level;
    endQuiz();
    state.mode = 'free';
    hideSongBar();
    showEnd('quiz', null, { stars, level, got: stars >= 9 ? 3 : stars >= 6 ? 2 : 1 });
  }

  /* ---------- 리듬 놀이: crayon notes fall onto the keys ---------- */
  const FALL = { slow: 2.4, normal: 2 };   // seconds a note takes from the top of the sky to the line
  const NEAR = 0.32, GREAT = 0.11;          // how close to the line a tap counts (seconds)
  function startRhythm(song) {
    stopSong();
    state.mode = 'rhythm';
    state.song = song;
    // The keys get shorter to make room for the sky the notes fall through.
    root.classList.add('rhythm');
    $('sky').hidden = false;
    layout();
    state.offsets = songOffsets(song);
    const spb = 60 / (song.bpm * RHYTHM_SPEED[state.rhythmSpeed]), F = FALL[state.rhythmSpeed];
    const notes = [];
    let beat = 0;
    for (const n of song.parsed) {
      if (n.midi != null) notes.push({ midi: n.midi, i: notes.length, at: beat * spb, len: n.beats * spb, el: null, hit: false, miss: false, sounded: false });
      beat += n.beats;
    }
    // Count in "셋, 둘, 하나" while the first notes are already falling.
    const lead = Math.max(F, 3 * spb) + 0.6;
    const R = state.rhythm = { song, notes, F, spb, t0: wallClock() + lead, first: 0, hits: 0, great: 0, raf: 0, timers: [], lanes: [] };
    showGameBar(song.title, song.doodle, `리듬 놀이 · ${state.rhythmSpeed === 'slow' ? '천천히' : '보통'}`, false);
    renderRhythmInfo();
    drawLanes(R);
    ['셋', '둘', '하나'].forEach((w, j) => R.timers.push(setTimeout(() => {
      if (state.rhythm !== R) return;
      skySay(w, 50, true);
      const t = S.now() + 0.01;
      S.play(84, { when: t, velocity: 0.3 }).release(t + 0.15);
    }, (lead - (3 - j) * spb) * 1000)));
    const frame = () => {
      if (state.rhythm !== R) return;
      rhythmFrame(R, wallClock() - R.t0);
      R.raf = requestAnimationFrame(frame);
    };
    R.raf = requestAnimationFrame(frame);
  }
  // A faint stripe above each key the song uses, so it is clear where each note will land.
  function drawLanes(R) {
    const box = $('sky-notes');
    box.textContent = '';
    const keys = new Set(R.notes.map((n) => tuneKey(n.midi, n.i)));
    keys.forEach((m) => {
      const g = state.geom[m];
      if (!g) return;
      const lane = document.createElement('div');
      lane.className = 'lane';
      lane.style.left = `${((g.x - (g.black ? 0.3 : 0.5) / state.built.count) * 100).toFixed(3)}%`;
      lane.style.width = `${((g.black ? 0.6 : 1) / state.built.count * 100).toFixed(3)}%`;
      lane.style.setProperty('--dc', DOT_COLORS[pcOf(m)]);
      box.appendChild(lane);
    });
  }
  function rhythmFrame(R, now) {
    const [W, H] = state.skySize, line = H - 14, notes = R.notes;
    if (!H) return;
    for (let j = R.first; j < notes.length; j++) {
      const n = notes[j];
      if (n.at - now > R.F) break;
      // The tune plays softly by itself, so a missed note never leaves a hole; a tapped note is loud.
      if (!n.sounded && n.at - now < 0.05) {
        n.sounded = true;
        if (!n.hit && S.running) {
          const t = S.now() + Math.max(0, n.at - now);
          S.play(n.midi, { when: t, velocity: 0.22 }).release(t + n.len * 0.9);
        }
      }
      if (!n.hit && !n.miss && now - n.at > NEAR) {
        n.miss = true;
        if (n.el) n.el.classList.add('miss');
      }
      const m = tuneKey(n.midi, n.i), g = state.geom[m];
      if (!n.el && !n.hit && g) {
        const size = Math.round(Math.min(g.w * 0.82, 52, H * 0.34));
        const el = n.el = document.createElement('div');
        el.className = 'fall' + (isBlack(m) ? ' sharp' : '');
        el.textContent = nameOf(m);
        el.style.cssText = `left: ${(g.x * 100).toFixed(3)}%; width: ${size}px; height: ${size}px; margin: ${-size / 2}px 0 0 ${-size / 2}px; font-size: ${Math.round(size * 0.48)}px`;
        el.style.setProperty('--dc', DOT_COLORS[pcOf(m)]);
        $('sky-notes').appendChild(el);
      }
      if (n.el && !n.hit) n.el.style.transform = `translateY(${(line * (1 - (n.at - now) / R.F)).toFixed(1)}px)`;
      // Gone below the line: take it away.
      if (n.miss && now - n.at > 0.6 && n.el) { n.el.remove(); n.el = null; }
      if (j === R.first && (n.hit || n.miss) && !n.el) R.first++;
    }
    const last = notes[notes.length - 1];
    if (R.first >= notes.length && now > last.at + last.len + 0.6) finishRhythm(R);
  }
  function rhythmHit(m) {
    const R = state.rhythm;
    if (!R) return;
    const now = wallClock() - R.t0;
    let best = null;
    for (let j = R.first; j < R.notes.length; j++) {
      const n = R.notes[j];
      if (n.at - now > NEAR) break;
      if (n.hit || n.miss || tuneKey(n.midi, n.i) !== m) continue;
      if (!best || Math.abs(n.at - now) < Math.abs(best.at - now)) best = n;
    }
    if (!best || Math.abs(best.at - now) > NEAR) return;
    best.hit = true;
    R.hits++;
    const great = Math.abs(best.at - now) <= GREAT;
    if (great) R.great++;
    const g = state.geom[m];
    if (best.el) {
      const el = best.el;
      best.el = null;
      el.classList.add('hit');
      el.addEventListener('animationend', () => el.remove());
      setTimeout(() => el.remove(), 600);
    }
    if (g) skySay(great ? '최고!' : '좋아요!', g.x * 100);
    renderRhythmInfo();
  }
  function skySay(text, xPct, big) {
    const el = document.createElement('div');
    el.className = 'word' + (big ? ' big' : '');
    el.textContent = text;
    el.style.left = xPct.toFixed(2) + '%';
    el.addEventListener('animationend', () => el.remove());
    $('sky-say').appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
  function renderRhythmInfo() {
    const R = state.rhythm;
    $('game-info').innerHTML = `<span class="score"><img src="${C.doodleURL('star', 30, 7)}" alt="">${R.hits}<small>/ ${R.notes.length}</small></span>`;
  }
  function endRhythm() {
    const R = state.rhythm;
    if (!R) return;
    cancelAnimationFrame(R.raf);
    R.timers.forEach(clearTimeout);
    state.rhythm = null;
    $('sky-notes').textContent = '';
    $('sky-say').textContent = '';
    $('sky').hidden = true;
    root.classList.remove('rhythm');
    layout();
  }
  function finishRhythm(R) {
    const { song, hits } = R, total = R.notes.length, part = hits / total;
    endRhythm();
    state.mode = 'free';
    state.song = null;
    hideSongBar();
    showEnd('rhythm', song, { hits, total, got: part >= 0.85 ? 3 : part >= 0.55 ? 2 : 1 });
  }

  /* ---------- start, full screen, screen wake ---------- */
  const fsSupported = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  $('btn-full').hidden = !fsSupported;
  const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function lockLandscape() {
    try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) { /* not allowed */ }
  }
  function enterFullscreen() {
    const el = root, req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return;
    try {
      const p = req.call(el, { navigationUI: 'hide' });
      if (p && p.then) p.then(lockLandscape, () => {}); else lockLandscape();
    } catch (e) { /* refused */ }
  }
  function exitFullscreen() {
    const ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (!ex) return;
    try { const p = ex.call(document); if (p && p.catch) p.catch(() => {}); } catch (e) { /* not in full screen */ }
  }
  let wakeLock = null;
  function keepAwake() {
    if (!('wakeLock' in navigator) || wakeLock) return;
    navigator.wakeLock.request('screen').then((w) => {
      wakeLock = w;
      w.addEventListener('release', () => { wakeLock = null; });
    }).catch(() => {});
  }

  onTap($('start'), () => {
    $('start').hidden = true;
    const t = S.now() + 0.05;
    [60, 64, 67].forEach((m, i) => S.play(m, { when: t + i * 0.1, velocity: 0.6 }).release(t + i * 0.1 + 0.6));
    if (fsSupported && window.matchMedia('(pointer: coarse)').matches) enterFullscreen();
    keepAwake();
    prefetchSongs();
  });
  onTap($('bar-free'), (b) => {
    if (b.id === 'btn-songs') openMenu();
    else if (b.id === 'btn-games') openGames();
    else if (b.id === 'btn-full') { if (isFullscreen()) exitFullscreen(); else enterFullscreen(); }
    else if (b.id === 'btn-keys') {
      state.wide = !state.wide;
      store.set('keys', state.wide ? 'wide' : 'big');
      renderKeysButton();
      layout();
      toast(state.wide ? '넓은 건반: 진짜 피아노처럼 오른손 건반이 많아요' : '큰 건반: 건반이 크고 누르기 쉬워요', 2500);
    } else if (b.id === 'btn-labels') {
      const order = ['solfege', 'letter', 'none'];
      state.labels = order[(order.indexOf(state.labels) + 1) % order.length];
      store.set('labels', state.labels);
      renderLabels();
    }
  });
  onTap($('bar-song'), (b) => { if (b.id === 'btn-stop') stopSong(); });
  onTap($('btn-menu-close').parentElement, (b) => { if (b.id === 'btn-menu-close') closeMenu(); });
  function escape() {
    if (menuOpen()) closeMenu();
    else if (gamesOpen()) closeGames();
    else if (!$('end').hidden) $('end').hidden = true;
    else if (state.mode !== 'free') stopSong();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { if ($('start').hidden) keepAwake(); }
    else if (state.mode === 'listen' || state.mode === 'rhythm') stopSong();
  });

  // A small note at the bottom of the screen. Errors show here too, so a photo of the screen
  // says what went wrong on a phone we cannot look at.
  let toastTimer = 0;
  function toast(msg, ms = 4000) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, ms);
  }
  function hideToast() { $('toast').hidden = true; }
  window.addEventListener('error', (e) => toast('앗, 문제가 생겼어요: ' + (e.message || '알 수 없는 오류'), 10000));
  window.addEventListener('unhandledrejection', (e) => toast('앗, 문제가 생겼어요: ' + ((e.reason && e.reason.message) || e.reason || '알 수 없는 오류'), 10000));

  // Check mode (preview builds set window.CRAYON_DEBUG, or add ?debug to the address): a red dot
  // where each touch lands and a line saying what it reached, so a screenshot from a phone we
  // cannot test shows why a tap was lost.
  if (window.CRAYON_DEBUG || /[?&#]debug\b/.test(location.href)) {
    const box = Object.assign(document.createElement('div'), { className: 'debug' });
    document.body.appendChild(box);
    const lines = [];
    const what = (el) => {
      const b = el && el.closest && el.closest('button, .key, .card, .overlay, .bar');
      return b ? b.id || b.className.split(' ').slice(0, 2).join('.') : el ? el.id || el.tagName : '-';
    };
    const show = (line) => {
      lines.push(line);
      if (lines.length > 6) lines.shift();
      const v = window.visualViewport;
      box.textContent = `화면 ${innerWidth}x${innerHeight} 스크롤 ${scrollX},${scrollY}` +
        (v ? ` 보이는곳 ${Math.round(v.width)}x${Math.round(v.height)}+${Math.round(v.offsetLeft)},${Math.round(v.offsetTop)} x${v.scale.toFixed(2)}` : '') +
        '\n' + lines.join('\n');
    };
    ['pointerdown', 'pointerup', 'pointercancel', 'click'].forEach((type) => document.addEventListener(type, (e) => {
      const x = Math.round(e.clientX), y = Math.round(e.clientY);
      show(`${type} ${x},${y} → ${what(e.target)} (그 자리: ${what(document.elementFromPoint(x, y))})`);
      if (type !== 'pointerdown') return;
      const dot = Object.assign(document.createElement('i'), { className: 'debug-dot' });
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 1500);
    }, true));
    show('체크 모드');
  }

  // Keep the page still: no pinch zoom, pull-to-refresh, long-press menus or double-tap zoom.
  document.addEventListener('touchmove', (e) => { if (!e.target.closest('.scroll')) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());
  // iOS only lets sound start from certain touches, so try on every tap.
  document.addEventListener('touchstart', S.unlock, { passive: true });
  document.addEventListener('touchend', S.unlock, { passive: true });
  document.addEventListener('click', S.unlock);

  let relayoutTimer = 0;
  const relayout = () => { clearTimeout(relayoutTimer); relayoutTimer = setTimeout(layout, 120); };
  window.addEventListener('resize', relayout);
  // iPhones report the new size a little late after turning, so look again once it has settled.
  window.addEventListener('orientationchange', () => { relayout(); setTimeout(layout, 600); setTimeout(layout, 1500); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', relayout);
  // The page never scrolls; if the browser moved it (turning the phone can), put it back so what
  // is drawn and what is touched line up.
  window.addEventListener('scroll', () => { if (window.scrollX || window.scrollY) window.scrollTo(0, 0); });

  buildMenu();
  buildGames();
  layout();
  renderLabels();
  renderKeysButton();
  // Which build this is, to tell whether a game site already serves the newest one, and whether
  // the font came through (some phones and game sites block it).
  const version = document.querySelector('meta[name="crayon-version"]');
  const credit = document.querySelector('#start .credit');
  credit.textContent += ` · 버전 ${version ? version.content : '개발판'}`;
  if (document.fonts) document.fonts.ready.then(() => { credit.textContent += document.fonts.check('16px Jua') ? ' ✓' : ' (글꼴 없음)'; });

  // Fetch the handwriting font's Korean letters for every screen now, not on the first visit
  // to each screen (the font comes in many small pieces, one per group of letters).
  if (document.fonts && document.fonts.load) {
    const text = stage.textContent + '끝까지다쳤어요잘들었어요이제따라쳐볼까요한번더다른노래건반놀이재즈로듣기참잘했어요넓은큰진짜피아노처럼오른손이많아요누르기쉬워요' +
      '이소리들중에있어요딩동댕맞았어요최고예요정답이에요찾았어요반짝이는건반이에요다시들어봐요셋둘하나좋아요' +
      '별개를모았어요귀가정말밝아요끝까지다찾았어요음표중에맞혔어요다른놀이리듬음맞히기천천히보통쉬움어려움';
    document.fonts.load('24px Jua', text).catch(() => {});
  }
})();
