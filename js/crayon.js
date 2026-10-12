/* Crayon drawing: paper and wax textures, crayon-colored piano keys, and small doodles
   (teddy, bunny, flower, heart ...). Everything is drawn on canvas so it looks hand-colored. */
(function () {
  'use strict';

  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const tok = (name) => cs.getPropertyValue(name).trim();
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const TAU = Math.PI * 2;

  /* ---------- small helpers ---------- */
  function rngFrom(seed) {
    let s = (Math.imul((seed | 0) + 1, 2654435761) ^ 0x9e3779b9) >>> 0;
    if (!s) s = 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function hexToRgb(h) {
    h = String(h).trim().replace('#', '');
    if (h.length === 3) h = h.replace(/./g, (c) => c + c);
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const toRgb = (c) => (Array.isArray(c) ? c : hexToRgb(c));
  const INK = [70, 48, 88];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  // Negative t darkens toward plum ink, positive t lightens toward white.
  const shade = (c, t) => (t < 0 ? mix(toRgb(c), INK, -t) : mix(toRgb(c), [255, 255, 255], t));
  const rgba = (c, a = 1) => { c = toRgb(c); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  const hex = (c) => '#' + toRgb(c).map((v) => v.toString(16).padStart(2, '0')).join('');
  // A short blob: URL for a drawn canvas. Long data: URLs are slow when they sit in CSS variables
  // or many <img> tags, because the browser re-reads the whole string on every style change.
  function canvasURL(c) {
    const bin = atob(c.toDataURL('image/png').split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
  }
  function makeCanvas(w, h, scale = DPR) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * scale));
    c.height = Math.max(1, Math.round(h * scale));
    const ctx = c.getContext('2d');
    ctx.scale(scale, scale);
    return [c, ctx];
  }

  /* ---------- crayon strokes ---------- */
  // Points around a rounded rectangle, each with an outward normal so the edge can wobble.
  function rrPoints(x, y, w, h, rt, rb, step) {
    const pts = [];
    const seg = (x0, y0, x1, y1, nx, ny) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let i = 0; i < n; i++) { const t = i / n; pts.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, nx, ny }); }
    };
    const arc = (cx, cy, r, a0, a1) => {
      if (r <= 0) return;
      const n = Math.max(2, Math.round((r * Math.abs(a1 - a0)) / step));
      for (let i = 0; i < n; i++) {
        const a = a0 + ((a1 - a0) * i) / n, c = Math.cos(a), s = Math.sin(a);
        pts.push({ x: cx + c * r, y: cy + s * r, nx: c, ny: s });
      }
    };
    seg(x + rt, y, x + w - rt, y, 0, -1); arc(x + w - rt, y + rt, rt, -Math.PI / 2, 0);
    seg(x + w, y + rt, x + w, y + h - rb, 1, 0); arc(x + w - rb, y + h - rb, rb, 0, Math.PI / 2);
    seg(x + w - rb, y + h, x + rb, y + h, 0, 1); arc(x + rb, y + h - rb, rb, Math.PI / 2, Math.PI);
    seg(x, y + h - rb, x, y + rt, -1, 0); arc(x + rt, y + rt, rt, Math.PI, Math.PI * 1.5);
    return pts;
  }
  function wobble(pts, amp, r) {
    const f1 = 2 + ((r() * 3) | 0), f2 = 6 + ((r() * 5) | 0), f3 = 22 + ((r() * 14) | 0);
    const p1 = r() * TAU, p2 = r() * TAU, p3 = r() * TAU;
    const p = new Path2D();
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU;
      const d = amp * (0.55 * Math.sin(t * f1 + p1) + 0.3 * Math.sin(t * f2 + p2) + 0.15 * Math.sin(t * f3 + p3));
      const q = pts[i];
      const X = q.x + q.nx * d, Y = q.y + q.ny * d;
      if (i) p.lineTo(X, Y); else p.moveTo(X, Y);
    }
    p.closePath();
    return p;
  }
  // Fill a shape the way a child colors: a light wash, then back-and-forth zigzag strokes.
  function paint(ctx, path, box, col, r, o = {}) {
    const rgb = toRgb(col);
    const step = o.step ?? 4.4, width = o.width ?? 3.6, angle = o.angle ?? -0.95;
    ctx.save();
    ctx.clip(path);
    ctx.globalAlpha = o.wash ?? 0.5;
    ctx.fillStyle = rgba(rgb);
    ctx.fillRect(box.x - 6, box.y - 6, box.w + 12, box.h + 12);
    ctx.lineCap = 'round';
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2, R = Math.hypot(box.w, box.h) / 2 + step;
    const passes = o.passes ?? 2;
    for (let pass = 0; pass < passes; pass++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + pass * 0.55 + (r() - 0.5) * 0.2);
      let y = -R, left = r() < 0.5;
      while (y < R) {
        const ny = y + step * (0.7 + r() * 0.6);
        const x0 = (left ? -R : R) + (r() - 0.5) * 10, x1 = (left ? R : -R) + (r() - 0.5) * 10;
        ctx.strokeStyle = rgba(shade(rgb, (r() - 0.5) * 0.3));
        ctx.globalAlpha = 0.32 + r() * 0.38;
        ctx.lineWidth = width * (0.65 + r() * 0.7);
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, ny); ctx.stroke();
        y = ny; left = !left;
      }
      ctx.restore();
    }
    if (o.highlight) {
      ctx.strokeStyle = rgba(shade(rgb, 0.7));
      for (let i = 0; i < 6; i++) {
        const hx = box.x + box.w * (0.16 + r() * 0.14);
        ctx.globalAlpha = 0.25 + r() * 0.2;
        ctx.lineWidth = 1.5 + r() * 2.5;
        ctx.beginPath();
        ctx.moveTo(hx, box.y + box.h * (0.08 + r() * 0.1));
        ctx.lineTo(hx + (r() - 0.5) * 5, box.y + box.h * (0.4 + r() * 0.4));
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  function outline(ctx, path, col, r, o = {}) {
    const w = o.width ?? 3;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(col);
    for (const [k, a] of [[1, 0.85], [0.6, 0.4], [0.5, 0.3]]) {
      ctx.save();
      ctx.translate((r() - 0.5) * 1.4, (r() - 0.5) * 1.4);
      ctx.globalAlpha = a; ctx.lineWidth = w * k;
      ctx.stroke(path);
      ctx.restore();
    }
    ctx.restore();
  }
  // Knock tiny holes out of the wax so the paper shows through.
  function grain(ctx, box, r, amount = 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const n = Math.round(((box.w * box.h) / 9) * amount);
    for (let i = 0; i < n; i++) {
      const s = 0.6 + r() * 1.3;
      ctx.globalAlpha = 0.15 + r() * 0.55;
      ctx.fillRect(box.x + r() * box.w, box.y + r() * box.h, s, s * (0.6 + r() * 0.8));
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < n / 25; i++) {
      const x = box.x + r() * box.w, y = box.y + r() * box.h, l = 4 + r() * 10, a = -0.9 + (r() - 0.5) * 0.3;
      ctx.globalAlpha = 0.12 + r() * 0.2; ctx.lineWidth = 0.8 + r();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- textures for CSS backgrounds ---------- */
  function paperTile(S = 200) {
    const [c, ctx] = makeCanvas(S, S, 1);
    const r = rngFrom(7);
    ctx.fillStyle = tok('--paper'); ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < (S * S) / 6; i++) {
      ctx.fillStyle = r() < 0.5 ? `rgba(170,140,100,${0.03 + r() * 0.06})` : `rgba(255,255,255,${0.3 + r() * 0.5})`;
      ctx.fillRect(r() * S, r() * S, 1 + r(), 1 + r());
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 60; i++) {
      const x = r() * S, y = r() * S, l = 6 + r() * 18, a = r() * Math.PI;
      ctx.strokeStyle = `rgba(180,150,115,${0.05 + r() * 0.07})`; ctx.lineWidth = 0.6 + r() * 0.6;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + r() * 4, y + Math.sin(a) * l * 0.5 + r() * 4, x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
    return canvasURL(c);
  }
  function waxTile(S = 120) {
    const [c, ctx] = makeCanvas(S, S, 1);
    const r = rngFrom(11);
    ctx.lineCap = 'round';
    const a = -0.95;
    for (let i = 0; i < 140; i++) {
      const x = r() * S, y = r() * S, l = 5 + r() * 16;
      ctx.strokeStyle = r() < 0.7 ? `rgba(255,255,255,${0.18 + r() * 0.3})` : `rgba(80,60,90,${0.05 + r() * 0.06})`;
      ctx.lineWidth = 0.7 + r() * 1.4;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        ctx.beginPath(); ctx.moveTo(x + ox, y + oy); ctx.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); ctx.stroke();
      }
    }
    for (let i = 0; i < (S * S) / 14; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.5})`;
      const s = 0.6 + r() * 1.2;
      ctx.fillRect(r() * S, r() * S, s, s);
    }
    return canvasURL(c);
  }

  /* ---------- doodles ---------- */
  const P = () => new Path2D();
  const circle = (s, cx, cy, rad) => { const p = P(); p.arc(cx * s, cy * s, rad * s, 0, TAU); return p; };
  const ellipse = (s, cx, cy, rx, ry, rot = 0) => { const p = P(); p.ellipse(cx * s, cy * s, rx * s, ry * s, rot, 0, TAU); return p; };
  const boxOf = (s, cx, cy, rx, ry = rx) => ({ x: (cx - rx) * s, y: (cy - ry) * s, w: rx * 2 * s, h: ry * 2 * s });
  function heartPath(x, y, s) {
    const p = P(), m = (u, v) => [x + u * s, y + v * s];
    p.moveTo(...m(0.5, 0.9));
    p.bezierCurveTo(...m(0.12, 0.64), ...m(0.02, 0.4), ...m(0.2, 0.21));
    p.bezierCurveTo(...m(0.34, 0.08), ...m(0.5, 0.16), ...m(0.5, 0.31));
    p.bezierCurveTo(...m(0.5, 0.16), ...m(0.66, 0.08), ...m(0.8, 0.21));
    p.bezierCurveTo(...m(0.98, 0.4), ...m(0.88, 0.64), ...m(0.5, 0.9));
    p.closePath();
    return p;
  }
  function starPath(cx, cy, outer, inner) {
    const p = P();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? inner : outer;
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
      if (i) p.lineTo(x, y); else p.moveTo(x, y);
    }
    p.closePath();
    return p;
  }
  function blob(ctx, path, box, col, r, o = {}) {
    const rgb = toRgb(col);
    const step = Math.min(5, Math.max(2.2, box.w / 14));
    const width = Math.min(4.5, Math.max(1.5, box.w / 16));
    paint(ctx, path, box, rgb, r, { wash: 0.62, step, width, ...o });
    outline(ctx, path, o.edge || shade(rgb, -0.42), r, { width: Math.min(3, Math.max(1.2, box.w / 26)) });
  }
  function dot(ctx, s, cx, cy, rad, col) {
    ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx * s, cy * s, rad * s, 0, TAU); ctx.fill(); ctx.restore();
  }
  function line(ctx, s, col, w, draw) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.1, s * w); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); draw((u) => u * s); ctx.stroke(); ctx.restore();
  }

  const DOODLES = {
    heart(ctx, s, r, col) { blob(ctx, heartPath(0, 0, s), { x: 0.04 * s, y: 0.1 * s, w: 0.92 * s, h: 0.8 * s }, col || '#ff8fab', r); },
    star(ctx, s, r, col) { blob(ctx, starPath(0.5 * s, 0.54 * s, 0.45 * s, 0.2 * s), { x: 0.05 * s, y: 0.09 * s, w: 0.9 * s, h: 0.86 * s }, col || '#ffd35c', r); },
    flower(ctx, s, r, col) {
      const p = P();
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k * TAU) / 5, cx = 0.5 + Math.cos(a) * 0.24, cy = 0.5 + Math.sin(a) * 0.24;
        p.moveTo((cx + 0.18) * s, cy * s); p.arc(cx * s, cy * s, 0.18 * s, 0, TAU);
      }
      blob(ctx, p, { x: 0.08 * s, y: 0.08 * s, w: 0.84 * s, h: 0.84 * s }, col || '#ffa3c4', r);
      blob(ctx, circle(s, 0.5, 0.5, 0.13), boxOf(s, 0.5, 0.5, 0.13), '#ffd95e', r);
    },
    note(ctx, s, r, col) {
      const p = P();
      p.ellipse(0.36 * s, 0.74 * s, 0.17 * s, 0.12 * s, -0.45, 0, TAU);
      p.rect(0.46 * s, 0.18 * s, 0.07 * s, 0.56 * s);
      p.moveTo(0.5 * s, 0.18 * s);
      p.bezierCurveTo(0.62 * s, 0.22 * s, 0.84 * s, 0.3 * s, 0.76 * s, 0.54 * s);
      p.bezierCurveTo(0.76 * s, 0.4 * s, 0.64 * s, 0.36 * s, 0.53 * s, 0.36 * s);
      p.closePath();
      blob(ctx, p, { x: 0.18 * s, y: 0.16 * s, w: 0.66 * s, h: 0.72 * s }, col || '#a8b5f6', r);
    },
    teddy(ctx, s, r) {
      const fur = '#d9a77c', light = '#f4d5b3', dark = '#5c3d34';
      blob(ctx, circle(s, 0.23, 0.29, 0.13), boxOf(s, 0.23, 0.29, 0.13), fur, r);
      blob(ctx, circle(s, 0.77, 0.29, 0.13), boxOf(s, 0.77, 0.29, 0.13), fur, r);
      blob(ctx, circle(s, 0.21, 0.26, 0.06), boxOf(s, 0.21, 0.26, 0.06), light, r);
      blob(ctx, circle(s, 0.79, 0.26, 0.06), boxOf(s, 0.79, 0.26, 0.06), light, r);
      blob(ctx, circle(s, 0.5, 0.57, 0.33), boxOf(s, 0.5, 0.57, 0.33), fur, r);
      blob(ctx, ellipse(s, 0.5, 0.69, 0.15, 0.115), boxOf(s, 0.5, 0.69, 0.15, 0.115), light, r);
      dot(ctx, s, 0.3, 0.66, 0.05, 'rgba(255,128,150,.45)'); dot(ctx, s, 0.7, 0.66, 0.05, 'rgba(255,128,150,.45)');
      dot(ctx, s, 0.38, 0.53, 0.04, dark); dot(ctx, s, 0.62, 0.53, 0.04, dark);
      dot(ctx, s, 0.39, 0.515, 0.013, '#fff'); dot(ctx, s, 0.63, 0.515, 0.013, '#fff');
      ctx.save(); ctx.fillStyle = dark; ctx.fill(ellipse(s, 0.5, 0.635, 0.055, 0.04)); ctx.restore();
      line(ctx, s, dark, 0.018, (u) => {
        ctx.moveTo(u(0.5), u(0.67)); ctx.lineTo(u(0.5), u(0.7));
        ctx.moveTo(u(0.44), u(0.705)); ctx.quadraticCurveTo(u(0.47), u(0.745), u(0.5), u(0.705)); ctx.quadraticCurveTo(u(0.53), u(0.745), u(0.56), u(0.705));
      });
    },
    bunny(ctx, s, r) {
      const fur = '#f7f0fd', edge = [165, 140, 205], pink = '#ffb3c7', dark = '#5a4566';
      blob(ctx, ellipse(s, 0.36, 0.27, 0.085, 0.21, -0.18), boxOf(s, 0.36, 0.27, 0.085, 0.21), fur, r, { edge });
      blob(ctx, ellipse(s, 0.64, 0.27, 0.085, 0.21, 0.18), boxOf(s, 0.64, 0.27, 0.085, 0.21), fur, r, { edge });
      blob(ctx, ellipse(s, 0.36, 0.29, 0.04, 0.14, -0.18), boxOf(s, 0.36, 0.29, 0.04, 0.14), pink, r);
      blob(ctx, ellipse(s, 0.64, 0.29, 0.04, 0.14, 0.18), boxOf(s, 0.64, 0.29, 0.04, 0.14), pink, r);
      blob(ctx, circle(s, 0.5, 0.64, 0.29), boxOf(s, 0.5, 0.64, 0.29), fur, r, { edge });
      dot(ctx, s, 0.33, 0.72, 0.045, 'rgba(255,128,150,.4)'); dot(ctx, s, 0.67, 0.72, 0.045, 'rgba(255,128,150,.4)');
      dot(ctx, s, 0.4, 0.6, 0.035, dark); dot(ctx, s, 0.6, 0.6, 0.035, dark);
      dot(ctx, s, 0.41, 0.587, 0.011, '#fff'); dot(ctx, s, 0.61, 0.587, 0.011, '#fff');
      ctx.save(); ctx.fillStyle = '#f07f9c'; ctx.fill(ellipse(s, 0.5, 0.685, 0.035, 0.025)); ctx.restore();
      line(ctx, s, dark, 0.014, (u) => { ctx.moveTo(u(0.45), u(0.73)); ctx.quadraticCurveTo(u(0.475), u(0.76), u(0.5), u(0.72)); ctx.quadraticCurveTo(u(0.525), u(0.76), u(0.55), u(0.73)); });
    },
    sun(ctx, s, r) {
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 + 0.2;
        for (let j = 0; j < 2; j++) {
          line(ctx, s, rgba('#ffb65c', j ? 0.5 : 0.9), j ? 0.035 : 0.055, (u) => {
            ctx.moveTo(u(0.5 + Math.cos(a) * 0.31) + (r() - 0.5) * 1.5, u(0.5 + Math.sin(a) * 0.31));
            ctx.lineTo(u(0.5 + Math.cos(a) * 0.46), u(0.5 + Math.sin(a) * 0.46) + (r() - 0.5) * 1.5);
          });
        }
      }
      blob(ctx, circle(s, 0.5, 0.5, 0.25), boxOf(s, 0.5, 0.5, 0.25), '#ffde6b', r);
      dot(ctx, s, 0.43, 0.47, 0.024, '#7a5a3a'); dot(ctx, s, 0.57, 0.47, 0.024, '#7a5a3a');
      line(ctx, s, '#7a5a3a', 0.02, (u) => { ctx.moveTo(u(0.43), u(0.56)); ctx.quadraticCurveTo(u(0.5), u(0.62), u(0.57), u(0.56)); });
    },
    moon(ctx, s, r) {
      const p = P(), m = (u, v) => [u * s, v * s];
      p.moveTo(...m(0.6, 0.12));
      p.bezierCurveTo(...m(0.28, 0.12), ...m(0.1, 0.4), ...m(0.16, 0.62));
      p.bezierCurveTo(...m(0.22, 0.84), ...m(0.48, 0.94), ...m(0.72, 0.84));
      p.bezierCurveTo(...m(0.5, 0.8), ...m(0.36, 0.64), ...m(0.38, 0.46));
      p.bezierCurveTo(...m(0.4, 0.28), ...m(0.5, 0.18), ...m(0.6, 0.12));
      p.closePath();
      blob(ctx, p, { x: 0.12 * s, y: 0.1 * s, w: 0.62 * s, h: 0.8 * s }, '#ffe58a', r);
      line(ctx, s, '#7a5a3a', 0.022, (u) => { ctx.moveTo(u(0.22), u(0.5)); ctx.quadraticCurveTo(u(0.26), u(0.55), u(0.3), u(0.5)); });
      dot(ctx, s, 0.25, 0.62, 0.035, 'rgba(255,128,150,.45)');
      blob(ctx, starPath(0.78 * s, 0.3 * s, 0.1 * s, 0.045 * s), boxOf(s, 0.78, 0.3, 0.1), '#ffd35c', r);
    },
    house(ctx, s, r) {
      const rect = (x, y, w, h, col) => { const p = P(); p.rect(x * s, y * s, w * s, h * s); blob(ctx, p, { x: x * s, y: y * s, w: w * s, h: h * s }, col, r); };
      rect(0.24, 0.46, 0.52, 0.4, '#ffe07a');
      const roof = P(); roof.moveTo(0.14 * s, 0.5 * s); roof.lineTo(0.5 * s, 0.14 * s); roof.lineTo(0.86 * s, 0.5 * s); roof.closePath();
      blob(ctx, roof, { x: 0.14 * s, y: 0.14 * s, w: 0.72 * s, h: 0.36 * s }, '#ff9fae', r);
      rect(0.46, 0.63, 0.13, 0.23, '#d6a47c');
      rect(0.29, 0.56, 0.11, 0.1, '#9dd2f6');
    },
    cloud(ctx, s, r) {
      const puffs = [[0.3, 0.6, 0.17], [0.5, 0.47, 0.22], [0.7, 0.6, 0.17], [0.5, 0.66, 0.17]];
      const p = P();
      for (const [x, y, rad] of puffs) { p.moveTo((x + rad) * s, y * s); p.arc(x * s, y * s, rad * s, 0, TAU); }
      const col = '#d3e9ff', box = { x: 0.12 * s, y: 0.24 * s, w: 0.76 * s, h: 0.6 * s };
      outline(ctx, p, shade(col, -0.42), r, { width: Math.min(3, Math.max(1.2, box.w / 26)) });
      // Keep only the outer edge: erase the outline where puffs overlap, then color underneath.
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      for (const [x, y, rad] of puffs) { ctx.beginPath(); ctx.arc(x * s, y * s, rad * s - Math.max(1.5, s * 0.04), 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'destination-over';
      paint(ctx, p, box, col, r, { wash: 0.62, step: Math.min(5, Math.max(2.2, box.w / 14)), width: Math.min(4.5, Math.max(1.5, box.w / 16)) });
      ctx.restore();
    },
    rainbow(ctx, s, r) {
      const cols = ['#ff9fae', '#ffbe86', '#ffe07a', '#a6e3a0', '#9dd2f6', '#c9b0f2'];
      cols.forEach((c, i) => {
        const ro = 0.44 - i * 0.055, ri = ro - 0.055;
        const p = P();
        p.arc(0.5 * s, 0.72 * s, ro * s, Math.PI, 0);
        p.arc(0.5 * s, 0.72 * s, ri * s, 0, Math.PI, true);
        p.closePath();
        paint(ctx, p, { x: 0.06 * s, y: 0.28 * s, w: 0.88 * s, h: 0.44 * s }, c, r, { wash: 0.7, step: 2.4, width: 2 });
      });
      outline(ctx, (() => { const p = P(); p.arc(0.5 * s, 0.72 * s, 0.44 * s, Math.PI, 0); return p; })(), shade('#c9b0f2', -0.3), r, { width: 1.6 });
    },
  };

  const cache = new Map();
  function doodleURL(kind, size, seed = 1, col = null) {
    if (col && col.startsWith('--')) col = tok(col);
    const key = [kind, size, seed, col].join('|');
    let url = cache.get(key);
    if (url) return url;
    const [c, ctx] = makeCanvas(size, size);
    const r = rngFrom(seed * 97 + kind.length * 13);
    DOODLES[kind](ctx, size, r, col);
    grain(ctx, { x: 0, y: 0, w: size, h: size }, r, 0.55);
    url = canvasURL(c);
    cache.set(key, url);
    return url;
  }
  // <img data-doodle="teddy" data-size="48" data-seed="2" data-col="--c-black"> gets its picture here.
  function hydrate(scope) {
    scope.querySelectorAll('img[data-doodle]').forEach((im) => {
      const size = +im.dataset.size || 32;
      im.src = doodleURL(im.dataset.doodle, size, +im.dataset.seed || 1, im.dataset.col || null);
      im.width = size; im.height = size; im.draggable = false;
      if (!im.hasAttribute('alt')) im.alt = '';
    });
  }
  function fillLogos(scope) {
    const cols = ['--c-do', '--c-re', '--c-mi', '--c-fa', '--c-sol', '--c-la', '--c-si'];
    scope.querySelectorAll('[data-logo]').forEach((el) => {
      if (el.childElementCount) return;
      el.setAttribute('aria-label', '크레용 피아노');
      let i = 0;
      for (const ch of '크레용 피아노') {
        const s = document.createElement('span');
        s.setAttribute('aria-hidden', 'true');
        if (ch === ' ') { s.className = 'gap'; el.appendChild(s); continue; }
        s.className = 'ch'; s.textContent = ch;
        const name = cols[i % cols.length];
        s.style.setProperty('--lc', hex(shade(tok(name), name === '--c-mi' ? -0.45 : -0.3)));
        s.style.transform = `rotate(${[-4, 3, -2, 4, -3, 2][i % 6]}deg) translateY(${[0, 2, -1, 1, -2, 1][i % 6]}px)`;
        el.appendChild(s); i++;
      }
    });
  }

  /* ---------- piano parts ---------- */
  function key(w, h, o) {
    const [c, ctx] = makeCanvas(w, h);
    const r = rngFrom(o.seed), black = !!o.black;
    const ins = black ? 1.5 : 2.5, x = ins, y = -14, ww = w - ins * 2, hh = h + 14 - ins - 1;
    const rb = black ? Math.min(9, ww * 0.28) : Math.min(16, ww * 0.25);
    const pts = rrPoints(x, y, ww, hh, 6, rb, 4);
    const box = { x, y, w: ww, h: hh };
    paint(ctx, wobble(pts, black ? 1.4 : 2, r), box, o.fill, r, {
      wash: black ? 0.7 : 0.5, step: black ? 3.4 : 4.4, width: black ? 3 : 3.6, angle: black ? -1.15 : -0.95, highlight: true,
    });
    outline(ctx, wobble(pts, black ? 1 : 1.6, r), o.edge, r, { width: black ? 2.2 : 3 });
    grain(ctx, { x: 0, y: 0, w, h }, r, black ? 0.7 : 0.9);
    return c;
  }
  function rail(w, h, seed, col) {
    const [c, ctx] = makeCanvas(w, h);
    const r = rngFrom(seed), rgb = toRgb(col);
    const pts = rrPoints(1, 1, w - 2, h - 2, 5, 5, 5);
    paint(ctx, wobble(pts, 1, r), { x: 1, y: 1, w: w - 2, h: h - 2 }, rgb, r, { wash: 0.75, step: 3, width: 2.6, angle: -0.3 });
    outline(ctx, wobble(pts, 0.8, r), shade(rgb, -0.3), r, { width: 2 });
    grain(ctx, { x: 0, y: 0, w, h }, r, 0.7);
    return c;
  }
  function ring(w, h, seed) {
    const pad = 8, [c, ctx] = makeCanvas(w + pad * 2, h + pad * 2);
    const r = rngFrom(seed), pts = rrPoints(pad - 3, pad - 3, w + 6, h + 6, 10, 18, 4);
    ctx.save(); ctx.lineJoin = 'round';
    [[[255, 201, 60], 0.95, 8], [[255, 214, 90], 0.6, 5], [[255, 255, 255], 0.9, 2.5]].forEach(([col, a, lw]) => {
      ctx.strokeStyle = rgba(col); ctx.globalAlpha = a; ctx.lineWidth = lw; ctx.stroke(wobble(pts, 2, r));
    });
    ctx.restore();
    grain(ctx, { x: 0, y: 0, w: w + pad * 2, h: h + pad * 2 }, r, 0.5);
    return c;
  }
  function stamp(size, col) {
    const [c, ctx] = makeCanvas(size, size);
    const r = rngFrom(77), red = toRgb(col);
    const circ = (rad, w, a) => {
      const pts = [];
      for (let i = 0; i < 120; i++) { const t = (i / 120) * TAU; pts.push({ x: size / 2 + Math.cos(t) * rad, y: size / 2 + Math.sin(t) * rad, nx: Math.cos(t), ny: Math.sin(t) }); }
      ctx.save(); ctx.strokeStyle = rgba(red); ctx.globalAlpha = a; ctx.lineWidth = w; ctx.stroke(wobble(pts, size * 0.008, r)); ctx.restore();
    };
    circ(size * 0.45, size * 0.055, 0.95);
    circ(size * 0.375, size * 0.02, 0.9);
    ctx.fillStyle = rgba(red); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(size * 0.22)}px Gaegu, 'Comic Sans MS', sans-serif`;
    ctx.fillText('참', size / 2, size * 0.35);
    ctx.font = `700 ${Math.round(size * 0.18)}px Gaegu, 'Comic Sans MS', sans-serif`;
    ctx.fillText('잘했어요', size / 2, size * 0.56);
    const hs = size * 0.15;
    ctx.fill(heartPath(size / 2 - hs / 2, size * 0.66, hs));
    grain(ctx, { x: 0, y: 0, w: size, h: size }, r, 1.6);
    return c;
  }

  window.Crayon = {
    tok, hexToRgb, shade, hex, rgba, rngFrom,
    paperTile, waxTile, doodleURL, hydrate, fillLogos,
    key, rail, ring, stamp,
  };
})();
