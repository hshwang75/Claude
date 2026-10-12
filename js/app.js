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
    keys: {},          // midi -> key element
    fx: null,
    kbSize: [0, 0],
    mode: 'free',      // 'free' | 'listen' | 'follow'
    song: null,
    listen: null,
    follow: null,
    hintKey: null,
    ribbonNotes: [],
  };
  const nameOf = (m) => (state.labels === 'none' ? '' : (state.labels === 'letter' ? LETTERS : SOLFEGE)[pcOf(m)]);

  /* ---------- crayon textures and pictures ---------- */
  root.style.setProperty('--paper-tex', `url(${C.paperTile()})`);
  root.style.setProperty('--wax', `url(${C.waxTile()})`);
  C.hydrate(document);
  C.fillLogos(document);

  /* ---------- layout: always landscape ---------- */
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  document.body.appendChild(probe);

  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const portrait = vh > vw;
    const W = portrait ? vh : vw, H = portrait ? vw : vh;
    stage.style.width = W + 'px';
    stage.style.height = H + 'px';
    // Upright phone: turn the stage a quarter turn so it reads as landscape once the phone is turned.
    stage.style.transform = portrait ? `translateX(${vw}px) rotate(90deg)` : 'none';

    const p = getComputedStyle(probe);
    const i = { t: parseFloat(p.paddingTop) || 0, r: parseFloat(p.paddingRight) || 0, b: parseFloat(p.paddingBottom) || 0, l: parseFloat(p.paddingLeft) || 0 };
    const s = portrait ? { l: i.t, r: i.b, t: i.r, b: i.l } : i;
    const innerW = W - s.l - s.r, innerH = H - s.t - s.b;
    const z = Math.min(1.6, Math.max(0.72, Math.min(innerW / 812, innerH / 375)));
    const set = (k, v) => root.style.setProperty(k, v);
    set('--z', z.toFixed(4));
    set('--sl', s.l + 'px'); set('--sr', s.r + 'px'); set('--st', s.t + 'px'); set('--sb', s.b + 'px');
    set('--lw', (innerW / z).toFixed(2) + 'px');
    set('--lh', (innerH / z).toFixed(2) + 'px');
    showRotateHint(portrait);

    const size = [kb.offsetWidth, kb.offsetHeight];
    if (Math.abs(size[0] - state.kbSize[0]) > 1 || Math.abs(size[1] - state.kbSize[1]) > 1) {
      state.kbSize = size;
      buildKeyboard();
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
  function buildKeyboard() {
    const W = kb.offsetWidth, H = kb.offsetHeight;
    kb.textContent = '';
    state.keys = {};
    state.hintKey = null;
    if (W < 60 || H < 60) return;
    const count = W / 15 >= 62 ? 15 : 12; // C4–C6 on wide screens, C4–G5 on phones
    const whites = [];
    for (let m = 60; whites.length < count; m++) if (!isBlack(m)) whites.push(m);
    const kw = W / count, bw = kw * 0.6, bh = H * 0.6;
    const plum = C.hexToRgb(C.tok('--c-black'));
    const dotSize = Math.round(Math.min(kw * 0.64, 64));

    whites.forEach((m, i) => {
      const col = noteColor(m);
      const el = document.createElement('div');
      el.className = 'key white';
      el.dataset.midi = m;
      el.style.left = i * kw + 'px';
      el.style.width = kw + 'px';
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
      el.style.left = (i + 1) * kw - bw / 2 + 'px';
      el.style.width = bw + 'px';
      el.style.height = bh + 'px';
      const face = C.key(bw, bh, { seed: b * 13, fill: plum, edge: C.shade(plum, -0.35), black: true });
      face.className = 'face';
      el.appendChild(face);
      kb.appendChild(el);
      state.keys[b] = el;
    });
    const rail = C.rail(W, 14, 5, plum);
    rail.className = 'rail';
    kb.appendChild(rail);
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
    [...$('ribbon').children].forEach((d, i) => { d.textContent = nameOf(state.ribbonNotes[i]); });
    $('btn-labels').textContent = LABEL_TEXT[state.labels];
  }

  const lightOn = (k) => { k._n = (k._n || 0) + 1; k.classList.add('on'); };
  const lightOff = (k) => {
    if (!k) return;
    k._n = Math.max(0, (k._n || 0) - 1);
    if (!k._n) k.classList.remove('on');
  };

  const FX_KINDS = ['heart', 'note', 'star', 'flower'];
  function burst(k, count) {
    const fx = state.fx;
    if (!fx || !k.isConnected) return;
    const black = k.classList.contains('black');
    const x = k.offsetLeft + k.offsetWidth / 2, y = k.offsetHeight * (black ? 0.45 : 0.55);
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

  function userPress(k) {
    lightOn(k);
    const m = +k.dataset.midi;
    const v = S.play(m);
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
    const k = keyAt(e.clientX, e.clientY);
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
    if (!k || !$('start').hidden || !$('menu').hidden) return;
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

  /* ---------- song bar and note ribbon ---------- */
  function showSongBar(song, modeText) {
    $('bar-free').hidden = true;
    $('bar-song').hidden = false;
    $('song-title').textContent = song.title;
    $('song-mode').textContent = modeText;
    const im = $('song-doodle');
    im.src = C.doodleURL(song.doodle, 34, 20);
    const track = $('ribbon');
    track.textContent = '';
    state.ribbonNotes = song.parsed.filter((n) => n.midi != null).map((n) => n.midi);
    state.ribbonNotes.forEach((m) => {
      const d = document.createElement('span');
      d.className = 'dot' + (isBlack(m) ? ' sharp' : '');
      d.style.setProperty('--dc', C.hex(noteColor(m)));
      d.textContent = nameOf(m);
      track.appendChild(d);
    });
    setRibbon(0);
  }
  function hideSongBar() {
    $('bar-song').hidden = true;
    $('bar-free').hidden = false;
  }
  function setRibbon(i) {
    const track = $('ribbon');
    [...track.children].forEach((d, j) => {
      d.classList.toggle('done', j < i);
      d.classList.toggle('now', j === i);
    });
    track.style.transform = `translateX(${-Math.max(0, i - 2) * 44}px)`;
  }

  /* ---------- listen: the song plays itself ---------- */
  function startListen(song) {
    stopSong();
    state.mode = 'listen';
    state.song = song;
    showSongBar(song, '듣기');
    const spb = 60 / song.bpm;
    let t = S.now() + 0.5, idx = 0;
    const events = [];
    for (const n of song.parsed) {
      if (n.midi != null) events.push({ midi: n.midi, t, dur: n.beats * spb, i: idx++ });
      t += n.beats * spb;
    }
    const L = state.listen = { events, next: 0, end: t, timeouts: [], lit: new Map(), timer: 0 };
    const tick = () => {
      if (state.listen !== L) return;
      const now = S.now();
      while (L.next < events.length && events[L.next].t < now + 0.25) {
        schedule(L, events[L.next], now);
        L.next++;
      }
      if (L.next >= events.length && now > L.end + 0.3) finishListen(song);
    };
    L.timer = setInterval(tick, 40);
    tick();
  }
  function schedule(L, ev, now) {
    const v = S.play(ev.midi, { when: ev.t, velocity: 0.85 });
    v.release(ev.t + ev.dur * 0.95);
    const onAt = Math.max(0, (ev.t - now) * 1000);
    const offAt = Math.max(onAt + 60, (ev.t + ev.dur * 0.8 - now) * 1000);
    L.timeouts.push(setTimeout(() => {
      if (state.listen !== L) return;
      const k = state.keys[ev.midi];
      if (k) { lightOn(k); L.lit.set(k, (L.lit.get(k) || 0) + 1); burst(k, 1); }
      setRibbon(ev.i);
    }, onAt));
    L.timeouts.push(setTimeout(() => {
      if (state.listen !== L) return;
      const k = state.keys[ev.midi];
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
    showSongBar(song, '따라치기');
    state.follow = { notes: song.parsed.filter((n) => n.midi != null).map((n) => n.midi), i: 0 };
    showHint();
  }
  function showHint() {
    clearHint();
    const F = state.follow;
    if (!F) return;
    setRibbon(F.i);
    const k = state.keys[F.notes[F.i]];
    if (!k) return;
    k.classList.add('hint');
    const ring = C.ring(k.offsetWidth, k.offsetHeight, F.i + 40);
    ring.className = 'ring';
    k.appendChild(ring);
    const size = Math.round(Math.min(k.offsetWidth * 0.75, 50));
    const mk = new Image();
    mk.alt = '';
    mk.src = C.doodleURL('star', size, 7);
    mk.className = 'marker';
    mk.style.width = mk.style.height = size + 'px';
    mk.style.marginLeft = -size / 2 + 'px';
    const lbl = k.querySelector('.lbl');
    mk.style.bottom = lbl ? k.offsetHeight * 0.08 + lbl.offsetHeight + 10 + 'px' : '22%';
    k.appendChild(mk);
    state.hintKey = k;
  }
  function clearHint() {
    const k = state.hintKey;
    if (k) {
      k.classList.remove('hint');
      k.querySelectorAll('.ring, .marker').forEach((n) => n.remove());
    }
    state.hintKey = null;
  }
  function onUserNote(m) {
    const F = state.follow;
    if (!F || state.mode !== 'follow' || m !== F.notes[F.i]) return;
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
    endListen();
    if (state.follow) { clearHint(); state.follow = null; }
    if (state.mode !== 'free') S.stopAll();
    state.mode = 'free';
    state.song = null;
    hideSongBar();
  }

  /* ---------- song menu ---------- */
  function buildMenu() {
    const list = $('song-list');
    list.innerHTML = SONGS.map((s, i) => `
      <div class="card" style="--cc: var(${s.color})">
        <img class="ic" data-doodle="${s.doodle}" data-size="58" data-seed="${i + 20}" alt="">
        <div class="meta">
          <h3 class="t">${s.title}</h3>
          <div class="c">${s.composer}</div>
          <div class="lv" role="img" aria-label="어려움 ${s.level}단계">${[1, 2, 3].map((n) => `<img data-doodle="star" data-size="16" data-seed="${n}" alt=""${n <= s.level ? '' : ' class="off"'}>`).join('')}</div>
        </div>
        <div class="acts">
          <button class="cbtn" type="button" data-play="listen" data-id="${s.id}" style="--bg: var(--c-card)">▶ 듣기</button>
          <button class="cbtn" type="button" data-play="follow" data-id="${s.id}" style="--bg: var(${s.color})">✋ 따라치기</button>
        </div>
      </div>`).join('');
    C.hydrate(list);
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-play]');
      if (!b) return;
      const song = SONGS.find((s) => s.id === b.dataset.id);
      S.unlock();
      closeMenu();
      if (b.dataset.play === 'listen') startListen(song); else startFollow(song);
    });
  }
  function openMenu() {
    stopSong();
    $('end').hidden = true;
    $('menu').hidden = false;
    $('song-list').scrollTop = 0;
  }
  function closeMenu() { $('menu').hidden = true; }

  /* ---------- end screen ---------- */
  const NOTE_ICON = () => `<img src="${C.doodleURL('note', 24, 1, C.tok('--c-black'))}" width="24" height="24" alt="">`;
  const AGAIN_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19.5 4.5v4h-4"/></svg>';

  function endButton(html, colorVar, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cbtn';
    b.style.setProperty('--bg', `var(${colorVar})`);
    b.innerHTML = html;
    b.addEventListener('click', () => { $('end').hidden = true; fn(); });
    $('end-acts').appendChild(b);
  }
  function showEnd(kind, song) {
    const slot = $('stamp-slot');
    slot.textContent = '';
    $('end-acts').textContent = '';
    $('confetti').textContent = '';
    if (kind === 'follow') {
      $('end-msg').textContent = `${song.title}, 끝까지 다 쳤어요!`;
      slot.appendChild(C.stamp(180, C.tok('--c-stamp')));
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
      im.src = C.doodleURL(kinds[k], size, 1 + (i % 5), cols[k]);
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

  $('btn-start').addEventListener('click', () => {
    S.unlock();
    $('start').hidden = true;
    const t = S.now() + 0.05;
    [60, 64, 67].forEach((m, i) => S.play(m, { when: t + i * 0.1, velocity: 0.6 }).release(t + i * 0.1 + 0.6));
    if (fsSupported && window.matchMedia('(pointer: coarse)').matches) enterFullscreen();
    keepAwake();
  });
  $('btn-full').addEventListener('click', () => { if (isFullscreen()) exitFullscreen(); else enterFullscreen(); });
  $('btn-songs').addEventListener('click', openMenu);
  $('btn-menu-close').addEventListener('click', closeMenu);
  $('btn-stop').addEventListener('click', stopSong);
  $('btn-labels').addEventListener('click', () => {
    const order = ['solfege', 'letter', 'none'];
    state.labels = order[(order.indexOf(state.labels) + 1) % order.length];
    store.set('labels', state.labels);
    renderLabels();
  });
  function escape() {
    if (!$('menu').hidden) closeMenu();
    else if (!$('end').hidden) $('end').hidden = true;
    else if (state.mode !== 'free') stopSong();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { if ($('start').hidden) keepAwake(); }
    else if (state.mode === 'listen') stopSong();
  });

  // Keep the page still: no pinch zoom, pull-to-refresh, long-press menus or double-tap zoom.
  document.addEventListener('touchmove', (e) => { if (!e.target.closest('.scroll')) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());
  // iOS only lets sound start from certain touches, so try on every tap.
  document.addEventListener('touchend', S.unlock, { passive: true });
  document.addEventListener('click', S.unlock);

  let relayoutTimer = 0;
  const relayout = () => { clearTimeout(relayoutTimer); relayoutTimer = setTimeout(layout, 120); };
  window.addEventListener('resize', relayout);
  window.addEventListener('orientationchange', relayout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', relayout);

  buildMenu();
  layout();
  renderLabels();
})();
