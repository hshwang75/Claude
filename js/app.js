/* Crayon Piano: keyboard, song menu, listen and follow-along modes, and screen layout. */
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
    mode: 'free',      // 'free' | 'listen' | 'follow'
    song: null,
    listen: null,
    follow: null,
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
  // Safari on an iPhone or iPad, not a home-screen app (which has no browser bars).
  const IOS_BROWSER = (/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document)) && !navigator.standalone;
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
    // With the iPhone itself turned sideways, Safari keeps a band along the top of the screen for
    // its own bars: taps there never reach the page. On itch.io the game fills the screen, so the
    // top buttons sat in that band and worked only when pressed near their lower edge.
    if (IOS_BROWSER && !portrait) s.t += 44;
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
  }

  function renderLabels() {
    Object.entries(state.keys).forEach(([m, el]) => {
      const l = el.querySelector('.lbl');
      if (l) l.textContent = nameOf(+m);
    });
    if (state.mode !== 'free') setRibbon(state.ribbonAt);
    $('btn-labels').textContent = LABEL_TEXT[state.labels];
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
    onUserNote(m);
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
    if (!k || !$('start').hidden || menuOpen()) return;
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
    const m = tuneKey(F.notes[F.i], F.i), k = state.keys[m], g = state.geom[m];
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
  function showEnd(kind, song) {
    const slot = $('stamp-slot');
    slot.textContent = '';
    $('end-acts').textContent = '';
    $('confetti').textContent = '';
    if (kind === 'follow') {
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
    else if (!$('end').hidden) $('end').hidden = true;
    else if (state.mode !== 'free') stopSong();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { if ($('start').hidden) keepAwake(); }
    else if (state.mode === 'listen') stopSong();
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
  layout();
  renderLabels();
  renderKeysButton();

  // Fetch the handwriting font's Korean letters for every screen now, not on the first visit
  // to each screen (the font comes in many small pieces, one per group of letters).
  if (document.fonts && document.fonts.load) {
    const text = stage.textContent + '끝까지다쳤어요잘들었어요이제따라쳐볼까요한번더다른노래건반놀이재즈로듣기참잘했어요넓은큰진짜피아노처럼오른손이많아요누르기쉬워요';
    document.fonts.load('24px Jua', text).catch(() => {});
  }
})();
