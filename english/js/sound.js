/* Sounds: real piano samples played high and short so they ring like a music box, a soft
   wooden "tok" for taps, a little sparkle, and the browser's English voice for the words.
   Nothing here plays until the first tap (browsers only allow sound after one). */
(function () {
  'use strict';

  const SAMPLES = { C4: 60, C5: 72, Ds5: 75, Fs5: 78, A5: 81, C6: 84, Ds6: 87, Fs6: 90, A6: 93, C7: 96 };
  // C major pentatonic, C5 up to D7: any run of these sounds happy and never clashes.
  const LADDER = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98];

  let ctx = null, out = null, verb = null, noise = null;
  const buffers = {};
  let effectsOn = true;

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        // Let iPhone play sound even with the side switch on silent, like a game would.
        if (navigator.audioSession) navigator.audioSession.type = 'playback';
      } catch (e) { /* older Safari */ }
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      comp.connect(ctx.destination);
      out = ctx.createGain();
      out.gain.value = 0.85;
      out.connect(comp);
      verb = ctx.createConvolver();
      verb.buffer = roomTail(1.9);
      const wet = ctx.createGain();
      wet.gain.value = 0.28;
      verb.connect(wet);
      wet.connect(comp);
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      load();
      warmVoice();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  // A soft room: decaying noise, a little darker toward the end.
  function roomTail(sec) {
    const len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const k = i / len;
        lp += (Math.random() * 2 - 1 - lp) * (0.9 - k * 0.7);
        d[i] = lp * Math.pow(1 - k, 2.6) * (i < ctx.sampleRate * 0.012 ? 0 : 1);
      }
    }
    return b;
  }

  function load() {
    const inline = window.VOCAB_AUDIO;
    Object.keys(SAMPLES).forEach((name) => {
      let got;
      if (inline && inline[name]) {
        const bin = atob(inline[name]);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        got = Promise.resolve(bytes.buffer);
      } else {
        got = fetch('audio/' + name + '.mp3').then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)));
      }
      got.then((ab) => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
        .then((buf) => { buffers[name] = buf; })
        .catch(() => { /* the bell fallback below covers a missing sample */ });
    });
  }

  const now = () => ctx.currentTime + 0.005;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function send(node, dry, wet) {
    const g = ctx.createGain();
    g.gain.value = dry;
    node.connect(g);
    g.connect(out);
    if (wet) {
      const w = ctx.createGain();
      w.gain.value = wet;
      node.connect(w);
      w.connect(verb);
    }
  }

  // One piano note from the nearest sample. ring = how long before it fades.
  function piano(m, t, vel, ring, wet) {
    let best = null, bd = 99;
    for (const k in SAMPLES) {
      if (!buffers[k]) continue;
      const d = Math.abs(m - SAMPLES[k]);
      if (d < bd) { bd = d; best = k; }
    }
    if (!best) return bell(m, t, vel * 0.8, ring, wet);
    const src = ctx.createBufferSource();
    src.buffer = buffers[best];
    src.playbackRate.value = Math.pow(2, (m - SAMPLES[best]) / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.setTargetAtTime(0, t + ring, ring * 0.3 + 0.05);
    src.connect(g);
    send(g, 1, wet);
    src.start(t);
    src.stop(t + ring * 2.5 + 0.6);
  }

  // A small metal tine: two sine partials that die quickly. Laid under the piano note it
  // makes the music-box shimmer; alone it stands in for a sample that has not loaded yet.
  function bell(m, t, vel, ring, wet) {
    const f = hz(m);
    [[1, 1, ring * 0.9 + 0.2], [4.2, 0.18, 0.12], [2.01, 0.3, 0.35]].forEach(([mul, amp, dec]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mul;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vel * amp, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      o.connect(g);
      send(g, 1, wet);
      o.start(t);
      o.stop(t + dec + 0.05);
    });
  }

  function chime(m, t, vel, ring = 0.7, wet = 0.9) {
    piano(m, t, vel, ring, wet);
    bell(m + 12, t, vel * 0.16, 0.3, wet);
  }

  // Wooden knock: a falling sine "tok" plus a tiny filtered click.
  function tok(t, pitch = 1, vel = 0.3) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(940 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(560 * pitch, t + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g);
    send(g, 1, 0.15);
    o.start(t);
    o.stop(t + 0.12);
    const n = ctx.createBufferSource();
    n.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2600 * pitch;
    bp.Q.value = 1.4;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vel * 0.6, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    n.connect(bp);
    bp.connect(ng);
    send(ng, 1, 0);
    n.start(t);
    n.stop(t + 0.04);
  }

  // Bubble "pop": a quick upward sweep.
  function bubble(t, from = 330, to = 1100, vel = 0.22) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(g);
    send(g, 1, 0.3);
    o.start(t);
    o.stop(t + 0.13);
  }

  function sparkle(t, count = 4, vel = 0.1) {
    const top = [96, 98, 100, 103, 105, 108];
    for (let i = 0; i < count; i++) {
      const m = top[Math.floor(Math.random() * top.length)];
      bell(m, t + i * 0.045 + Math.random() * 0.015, vel * (1 - i * 0.12), 0.25, 1.2);
    }
  }

  const ok = () => ctx && effectsOn;
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* not on iPhone */ } };

  const Sound = {
    LADDER,
    unlock,
    get on() { return effectsOn; },
    get loaded() { return Object.keys(buffers).length; },
    setOn(v) { effectsOn = !!v; if (!v && 'speechSynthesis' in window) speechSynthesis.cancel(); },

    tap() { if (ok()) tok(now()); },
    soft() { if (ok()) tok(now(), 0.62, 0.22); },
    pop() { if (ok()) bubble(now()); },

    // Right answer. Each answer in a row starts one step higher on the ladder.
    correct(combo = 1) {
      if (!ok()) return;
      const t = now(), i = Math.min(combo - 1, 6);
      chime(LADDER[i + 2], t, 0.55);
      chime(LADDER[i + 4], t + 0.075, 0.5);
      if (combo >= 5) chime(LADDER[i + 5] + 0, t + 0.15, 0.42, 0.9);
      sparkle(t + 0.12, combo >= 3 ? 5 : 3);
      buzz(18);
    },

    wrong() {
      if (!ok()) return;
      const t = now();
      piano(67, t, 0.32, 0.18, 0.5);
      piano(63, t + 0.13, 0.3, 0.35, 0.5);
      tok(t, 0.45, 0.16);
      buzz([10, 40, 10]);
    },

    // Spelling: each right letter climbs the ladder.
    letter(i) {
      if (!ok()) return;
      chime(LADDER[Math.min(i, LADDER.length - 1)], now(), 0.42, 0.35, 0.6);
    },
    miss() { if (ok()) { tok(now(), 0.55, 0.26); buzz(12); } },

    // 3, 5, 10 in a row: a running glissando that ends in a bright chord.
    streak(n) {
      if (!ok()) return;
      const t = now(), steps = n >= 10 ? 12 : n >= 5 ? 9 : 6;
      for (let i = 0; i < steps; i++) chime(LADDER[i], t + i * 0.038, 0.3 + i * 0.015, 0.25, 0.8);
      const end = t + steps * 0.038 + 0.04;
      [84, 88, 91, n >= 5 ? 96 : null].filter(Boolean).forEach((m) => chime(m, end, 0.36, 1.1));
      sparkle(end + 0.08, 6, 0.12);
      buzz([15, 30, 15]);
    },

    tick(i) { if (ok()) chime(LADDER[Math.min(4 + i, LADDER.length - 1)], now(), 0.28, 0.12, 0.3); },

    fanfare() {
      if (!ok()) return;
      const t = now();
      [79, 84, 88, 91].forEach((m, i) => chime(m, t + i * 0.1, 0.45, 0.3));
      [72, 84, 88, 91, 96].forEach((m) => chime(m, t + 0.46, m === 72 ? 0.35 : 0.4, 1.6));
      sparkle(t + 0.55, 7, 0.12);
    },

    // The "Great job!" stamp landing.
    stamp() {
      if (!ok()) return;
      const t = now();
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(52, t + 0.16);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.75, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g);
      send(g, 1, 0.2);
      o.start(t);
      o.stop(t + 0.25);
      tok(t, 0.35, 0.3);
      buzz(30);
    },

    sticker() {
      if (!ok()) return;
      const t = now();
      bubble(t, 400, 1300, 0.18);
      chime(91, t + 0.08, 0.4, 0.4);
      chime(96, t + 0.17, 0.42, 1);
      sparkle(t + 0.2, 5, 0.12);
    },

    count(n) { if (ok()) { if (n > 0) tok(now(), 1.25, 0.3); else chime(84, now(), 0.5, 0.6); } },
    hurry() { if (ok()) tok(now(), 1.5, 0.22); },
    timeUp() {
      if (!ok()) return;
      const t = now();
      [91, 88, 84, 79].forEach((m, i) => chime(m, t + i * 0.09, 0.4, 0.25));
    },
  };

  /* ---------- the English voice ---------- */
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const all = speechSynthesis.getVoices();
    const us = all.filter((v) => /^en[-_]US/i.test(v.lang));
    const liked = ['Samantha', 'Google US English', 'Aria', 'Jenny', 'Ava', 'Allison', 'Susan', 'Zira'];
    voice = liked.map((n) => us.find((v) => v.name.includes(n))).find(Boolean)
      || us.find((v) => v.localService) || us[0] || all.find((v) => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }
  // iPhone only lets a page speak after it has spoken once from a tap.
  function warmVoice() {
    if (!('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
    } catch (e) { /* no voice */ }
  }

  Sound.canSpeak = 'speechSynthesis' in window;
  Sound.speak = function (text, slow) {
    if (!Sound.canSpeak) return false;
    try {
      speechSynthesis.cancel();
      if (!voice) pickVoice();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      if (voice) u.voice = voice;
      u.rate = slow ? 0.55 : 0.85;
      speechSynthesis.speak(u);
      return true;
    } catch (e) {
      return false;
    }
  };

  window.Sound = Sound;
})();
