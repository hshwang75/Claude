/* Piano sound. Plays recorded grand piano notes (Salamander Grand Piano, CC BY 3.0) and
   pitch-shifts the nearest recording by at most a semitone and a half. Until the recordings
   have loaded, or if they cannot load (for example when index.html is opened straight from
   a folder), a soft synthesized piano plays instead. */
(function () {
  'use strict';

  const SAMPLES = {
    A1: 33, C2: 36, Ds2: 39, Fs2: 42, A2: 45, C3: 48, Ds3: 51, Fs3: 54,
    A3: 57, C4: 60, Ds4: 63, Fs4: 66, A4: 69, C5: 72, Ds5: 75, Fs5: 78, A5: 81, C6: 84,
    Ds6: 87, Fs6: 90, A6: 93, C7: 96,
  };
  const BASE = 'audio/piano/';
  const MAX_VOICES = 40;
  const NOOP = { release() {} };

  let ctx = null, out = null;
  const raw = new Map();      // midi -> ArrayBuffer (fetched)
  const buffers = new Map();  // midi -> AudioBuffer (decoded)
  const voices = new Set();
  let fetching = null, decoding = null;

  function fetchAll() {
    if (!fetching) {
      fetching = location.protocol === 'file:' ? loadEmbedded() : Promise.all(Object.entries(SAMPLES).map(([name, midi]) =>
        fetch(BASE + name + '.mp3')
          .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
          .then((ab) => { raw.set(midi, ab); })
          .catch(() => {})));
    }
    return fetching;
  }

  // Browsers refuse fetch() for pages opened straight from a folder (file://), so read the
  // same recordings from samples.js, which carries them as text.
  function loadEmbedded() {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = BASE + 'samples.js';
      s.onload = () => {
        const data = window.PIANO_SAMPLES || {};
        Object.entries(SAMPLES).forEach(([name, midi]) => {
          if (!data[name]) return;
          const bin = atob(data[name]);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          raw.set(midi, bytes.buffer);
        });
        resolve();
      };
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
  }

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 3;
    comp.attack.value = 0.002; comp.release.value = 0.25;
    out = ctx.createGain(); out.gain.value = 1;
    out.connect(comp); comp.connect(ctx.destination);
    return ctx;
  }

  // Each recording is 16 seconds of stereo; decoded, all of them would take about 90 MB, which
  // makes phones (iPhones especially) stutter. Keep the first 4.5 seconds in mono instead.
  const KEEP_SECONDS = 4.5;
  function shrink(buf) {
    const len = Math.min(buf.length, Math.round(KEEP_SECONDS * buf.sampleRate));
    const out = ctx.createBuffer(1, len, buf.sampleRate);
    // One channel is enough for a phone speaker; copying it is done by the browser, not in a JS loop.
    out.copyToChannel(buf.getChannelData(0).subarray(0, len), 0);
    const o = out.getChannelData(0), fade = Math.min(len, Math.round(0.5 * buf.sampleRate));
    for (let i = 0; i < fade; i++) o[len - 1 - i] *= i / fade;
    return out;
  }
  function decodeOne(ab) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (b) => { if (!done) { done = true; resolve(b || null); } };
      try {
        const p = ctx.decodeAudioData(ab, finish, () => finish(null));
        if (p && p.then) p.then(finish, () => finish(null));
      } catch (e) { finish(null); }
    });
  }
  // Middle notes first (they are played most), one at a time so the phone stays smooth.
  const ORDER = [60, 63, 66, 69, 72, 57, 75, 78, 81, 84, 54, 51, 48, 45, 42, 39, 87, 90, 36, 33, 93, 96];
  function decodeAll() {
    if (!decoding) {
      decoding = fetchAll().then(async () => {
        for (const midi of ORDER) {
          const ab = raw.get(midi);
          if (!ab) continue;
          raw.delete(midi);
          const b = await decodeOne(ab);
          if (b) buffers.set(midi, shrink(b));
        }
      });
    }
    return decoding;
  }

  // iPhones mute web sound when the ring/silent switch is on silent, unless the page is playing
  // media. A looping silent <audio>, started from a tap, makes iOS treat the page like a music
  // player, so the piano is heard either way.
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
  let keepAlive = null;
  function silentWav() {
    const rate = 8000, n = rate / 2, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const text = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    text(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    text(36, 'data'); v.setUint32(40, n * 2, true);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  function startKeepAlive() {
    if (!IOS) return;
    try {
      if (!keepAlive) {
        keepAlive = new Audio(silentWav());
        keepAlive.loop = true;
        keepAlive.setAttribute('playsinline', '');
      }
      if (keepAlive.paused) keepAlive.play().catch(() => {});
    } catch (e) { /* media blocked; the switch then decides */ }
  }

  // Call from every tap or click: browsers, iPhones most of all, only start sound from a touch.
  function unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* not supported */ }
    if (!init()) return;
    startKeepAlive();
    if (ctx.state !== 'running') {
      ctx.resume().catch(() => {});
      // The old iPhone way to wake sound: play one silent sample inside the touch.
      try {
        const src = ctx.createBufferSource();
        src.buffer = ctx.createBuffer(1, 1, 22050);
        src.connect(ctx.destination);
        src.start(0);
      } catch (e) { /* ignore */ }
    }
    decodeAll();
  }
  // Let the phone's music controls go away when the page is hidden.
  document.addEventListener('visibilitychange', () => {
    if (keepAlive && document.visibilityState === 'hidden') keepAlive.pause();
  });

  const now = () => (ctx ? ctx.currentTime : performance.now() / 1000);

  function nearest(midi) {
    let best = null, dist = Infinity;
    for (const [m, b] of buffers) {
      const d = Math.abs(m - midi);
      if (d < dist) { dist = d; best = [m, b]; }
    }
    return best;
  }

  function track(v) {
    voices.add(v);
    if (voices.size > MAX_VOICES) {
      const oldest = voices.values().next().value;
      oldest.release(0, 0.03);
      voices.delete(oldest);
    }
    return v;
  }

  function sampleVoice(midi, [m, buf], when, vel) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = Math.pow(2, (midi - m) / 12);
    const g = ctx.createGain();
    const level = 1.15 * vel;
    g.gain.setValueAtTime(level, when);
    src.connect(g); g.connect(out);
    src.start(when);
    // A note can be told to end more than once: songs set its end when it is scheduled, and 그만
    // must still be able to cut it short, fade it faster, or drop it before it starts.
    let endAt = Infinity, stopAt = Infinity;
    const v = {
      release(at = 0, tau = 0.16) {
        const t = Math.max(at, ctx.currentTime), stop = t <= when ? when : t + tau * 8;
        if (stop >= stopAt) return;
        if (t < endAt) {
          endAt = t;
          g.gain.cancelScheduledValues(t);
          g.gain.setValueAtTime(t <= when ? 0 : level, t);
        }
        g.gain.setTargetAtTime(0, t, tau);
        stopAt = stop;
        try { src.stop(stop); } catch (e) { /* already stopped */ }
        if (t <= when) gone(); // never sounded
      },
    };
    const gone = () => { voices.delete(v); try { g.disconnect(); } catch (e) { /* gone */ } };
    src.onended = gone;
    return v;
  }

  // Fallback: a few sine/triangle partials with a hammer-like attack and a two-stage decay.
  function synthVoice(midi, when, vel) {
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(Math.min(f * 10, 14000), when);
    lp.frequency.exponentialRampToValueAtTime(Math.min(f * 3, 9000), when + 1.5);
    g.connect(lp); lp.connect(out);
    const decay = 1.5 * Math.pow(0.5, (midi - 60) / 30), peak = 0.32 * vel;
    g.gain.linearRampToValueAtTime(peak, when + 0.004);
    g.gain.exponentialRampToValueAtTime(peak * 0.35, when + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0005, when + 0.25 + decay * 3);
    const end = when + 0.3 + decay * 3;
    const parts = [[1, 'triangle', 0.7, 0], [1, 'sine', 0.45, 3], [2, 'sine', 0.3, -2], [3, 'sine', 0.12, 0], [4.02, 'sine', 0.06, 0], [5.03, 'sine', 0.03, 0]];
    const oscs = parts.map(([mul, type, amp, det]) => {
      const o = ctx.createOscillator();
      o.type = type; o.frequency.value = f * mul; o.detune.value = det;
      const og = ctx.createGain(); og.gain.value = amp;
      o.connect(og); og.connect(g);
      o.start(when); o.stop(end);
      return o;
    });
    let endAt = Infinity, stopAt = Infinity;
    const v = {
      release(at = 0, tau = 0.16) {
        const t = Math.max(at, ctx.currentTime), p = g.gain, stop = t <= when ? when : t + tau * 8;
        if (stop >= stopAt) return;
        if (t <= when) { p.cancelScheduledValues(0); p.setValueAtTime(0, when); } else if (t < endAt) {
          if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); }
        }
        endAt = Math.min(endAt, t);
        p.setTargetAtTime(0, t, tau);
        stopAt = stop;
        oscs.forEach((o) => { try { o.stop(stop); } catch (e) { /* already stopped */ } });
        if (t <= when) gone(); // never sounded
      },
    };
    const gone = () => { voices.delete(v); try { g.disconnect(); lp.disconnect(); } catch (e) { /* gone */ } };
    oscs[0].onended = gone;
    return v;
  }

  function play(midi, opts = {}) {
    // While the phone keeps sound switched off, make nothing: notes made then never finish and
    // pile up, which slows everything down.
    if (!ctx || ctx.state !== 'running') return NOOP;
    const when = Math.max(opts.when || 0, ctx.currentTime);
    const vel = opts.velocity ?? 0.9;
    const s = nearest(midi);
    return track(s ? sampleVoice(midi, s, when, vel) : synthVoice(midi, when, vel));
  }

  function stopAll() {
    const t = now();
    [...voices].forEach((v) => v.release(t, 0.05));
  }

  fetchAll();

  window.Sound = {
    unlock, play, stopAll, now,
    get ready() { return buffers.size > 0; },
    get running() { return !!ctx && ctx.state === 'running'; },
    get status() { return ctx ? ctx.state : 'none'; },
    get loaded() { return buffers.size; },
    get active() { return voices.size; },
  };
})();
