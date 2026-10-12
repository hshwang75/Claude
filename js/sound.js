/* Piano sound. Plays recorded grand piano notes (Salamander Grand Piano, CC BY 3.0) and
   pitch-shifts the nearest recording by at most a semitone and a half. Until the recordings
   have loaded, or if they cannot load (for example when index.html is opened straight from
   a folder), a soft synthesized piano plays instead. */
(function () {
  'use strict';

  const SAMPLES = {
    Ds2: 39, Fs2: 42, A2: 45, C3: 48, Ds3: 51, Fs3: 54, // low notes for the jazz bass line
    A3: 57, C4: 60, Ds4: 63, Fs4: 66, A4: 69, C5: 72, Ds5: 75, Fs5: 78, A5: 81, C6: 84,
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

  function decodeAll() {
    if (!decoding) {
      decoding = fetchAll().then(() => Promise.all([...raw.entries()].map(([midi, ab]) => new Promise((resolve) => {
        const keep = (b) => { if (b) buffers.set(midi, b); resolve(); };
        try {
          const p = ctx.decodeAudioData(ab.slice(0), keep, () => resolve());
          if (p && p.then) p.then(keep, () => resolve());
        } catch (e) { resolve(); }
      }))));
    }
    return decoding;
  }

  // Call from a tap or click: browsers only allow sound after the person touches the page.
  function unlock() {
    if (!init()) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* not supported */ }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    decodeAll();
  }

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
    let done = false;
    const v = {
      release(at = 0, tau = 0.16) {
        if (done) return; done = true;
        const t = Math.max(at, ctx.currentTime);
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(t < when ? 0 : level, t);
        g.gain.setTargetAtTime(0, t, tau);
        try { src.stop(t + tau * 8); } catch (e) { /* already stopped */ }
      },
    };
    src.onended = () => { voices.delete(v); try { g.disconnect(); } catch (e) { /* gone */ } };
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
    let done = false;
    const v = {
      release(at = 0, tau = 0.16) {
        if (done) return; done = true;
        const t = Math.max(at, ctx.currentTime), p = g.gain;
        if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { p.cancelScheduledValues(t); p.setValueAtTime(t < when ? 0 : p.value, t); }
        p.setTargetAtTime(0, t, tau);
        oscs.forEach((o) => { try { o.stop(t + tau * 8); } catch (e) { /* already stopped */ } });
      },
    };
    oscs[0].onended = () => { voices.delete(v); try { g.disconnect(); lp.disconnect(); } catch (e) { /* gone */ } };
    return v;
  }

  function play(midi, opts = {}) {
    if (!ctx) return NOOP;
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
  };
})();
