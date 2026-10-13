/* Crayon-style pictures drawn in code: the cat teacher's faces, the word pictures and the
   stickers. Art.svg(key, size) returns SVG markup; the wobbly crayon edge comes from the
   #wob filter in index.html. */
(function () {
  'use strict';

  const INK = '#4f3f5c';
  const C = {
    fur: '#f6c27a', furEdge: '#b0743a', stripe: '#e09a4a', earIn: '#ffb3c1', blush: '#ff9fae',
    pink: '#ff9fae', pinkDeep: '#c9566a', yellow: '#ffe07a', yellowDeep: '#b8932a', mint: '#a6e3a0',
    mintDeep: '#5fae58', sky: '#9dd2f6', skyDeep: '#6aa9d6', lilac: '#d9aaf2', lilacDeep: '#a877c4',
    peach: '#ffbe86', peachDeep: '#c9723a', brown: '#c9935f', brownDeep: '#7a5233', white: '#fffdf7',
  };

  /* ---------- the cat teacher ---------- */
  // mood: teacher (glasses), happy, excited, proud, sad, angry, surprised, scared, sleepy,
  // thinking, reluctant, worried
  function cat(mood) {
    const flat = ['sad', 'reluctant', 'scared', 'worried'].includes(mood);
    const ears = flat
      ? `<path d="M10 50 L9 22 L32 37 Z" fill="${C.fur}" stroke="${C.furEdge}" stroke-width="3" stroke-linejoin="round"/>
         <path d="M90 50 L91 22 L68 37 Z" fill="${C.fur}" stroke="${C.furEdge}" stroke-width="3" stroke-linejoin="round"/>
         <path d="M14 43 L14 30 L25 37 Z" fill="${C.earIn}"/><path d="M86 43 L86 30 L75 37 Z" fill="${C.earIn}"/>`
      : `<path d="M17 44 L22 8 L45 27 Z" fill="${C.fur}" stroke="${C.furEdge}" stroke-width="3" stroke-linejoin="round"/>
         <path d="M83 44 L78 8 L55 27 Z" fill="${C.fur}" stroke="${C.furEdge}" stroke-width="3" stroke-linejoin="round"/>
         <path d="M24 34 L26 18 L37 28 Z" fill="${C.earIn}"/><path d="M76 34 L74 18 L63 28 Z" fill="${C.earIn}"/>`;
    const head = `<ellipse cx="50" cy="60" rx="37" ry="32" fill="${C.fur}" stroke="${C.furEdge}" stroke-width="3"/>
      <path d="M44 32 v7M50 30 v8M56 32 v7" stroke="${C.stripe}" stroke-width="3" stroke-linecap="round"/>`;
    const dots = (y = 57, r = 3.6) => `<circle cx="36" cy="${y}" r="${r}" fill="${INK}"/><circle cx="64" cy="${y}" r="${r}" fill="${INK}"/>`;
    const arcs = `<path d="M30 58 q6 -7 12 0M58 58 q6 -7 12 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    let eyes = dots();
    let mouth = `<path d="M42 73 q4 4 8 0 q4 4 8 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
    let extra = '';
    switch (mood) {
      case 'teacher':
        eyes = `<circle cx="36" cy="56" r="9.5" fill="#ffffff" fill-opacity="0.55" stroke="${INK}" stroke-width="2.5"/>
          <circle cx="64" cy="56" r="9.5" fill="#ffffff" fill-opacity="0.55" stroke="${INK}" stroke-width="2.5"/>
          <path d="M45.5 55 h9" stroke="${INK}" stroke-width="2.5"/>${dots(57, 3.4)}`;
        break;
      case 'happy':
        eyes = arcs;
        break;
      case 'excited':
        eyes = arcs;
        mouth = `<path d="M41 71 Q50 83 59 71 Z" fill="#e8778a" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
        extra = sparkle(86, 18, C.yellow) + sparkle(12, 24, C.yellow);
        break;
      case 'proud':
        eyes = `<path d="M30 56 h12M58 56 h12" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
        mouth = `<path d="M42 72 q8 7 16 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
        extra = sparkle(88, 30, C.yellow);
        break;
      case 'sad':
        eyes = dots(59) + `<path d="M28 50 l9 -3M72 50 l-9 -3" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
        mouth = `<path d="M43 77 q7 -6 14 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
        extra = `<path d="M33 64 q-3 7 0 10 q3 -3 0 -10z" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="1.5"/>`;
        break;
      case 'angry':
        eyes = dots(59) + `<path d="M28 47 l10 5M72 47 l-10 5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
        mouth = `<path d="M43 76 q7 -5 14 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
        extra = `<path d="M80 14 l6 6M86 14 l-6 6M83 10 v4M83 20 v4" stroke="#e04a66" stroke-width="3" stroke-linecap="round"/>`;
        break;
      case 'surprised':
      case 'scared':
        eyes = `<circle cx="36" cy="56" r="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="64" cy="56" r="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/>${dots(57, 2.6)}`;
        mouth = `<ellipse cx="50" cy="75" rx="5" ry="6" fill="#e8778a" stroke="${INK}" stroke-width="2.4"/>`;
        extra = mood === 'surprised'
          ? `<path d="M86 14 v14" stroke="#e04a66" stroke-width="4" stroke-linecap="round"/><circle cx="86" cy="35" r="2.6" fill="#e04a66"/>`
          : `<path d="M82 30 q5 8 0 12 q-5 -4 0 -12z" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="1.5"/><path d="M8 40 q4 -3 0 -7M14 36 q4 -3 0 -7" stroke="${C.skyDeep}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
        break;
      case 'sleepy':
        eyes = `<path d="M30 58 q6 4 12 0M58 58 q6 4 12 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
        mouth = `<ellipse cx="50" cy="75" rx="3.5" ry="3" fill="#e8778a"/>`;
        extra = `<text x="74" y="22" font-family="Fredoka, sans-serif" font-size="14" font-weight="600" fill="${C.skyDeep}">z</text><text x="84" y="12" font-family="Fredoka, sans-serif" font-size="11" font-weight="600" fill="${C.skyDeep}">z</text>`;
        break;
      case 'thinking':
        eyes = `<circle cx="36" cy="55" r="3.6" fill="${INK}"/><path d="M58 56 h11" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
        mouth = `<path d="M44 75 h11" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
        extra = `<text x="78" y="26" font-family="Fredoka, sans-serif" font-size="22" font-weight="600" fill="${C.lilacDeep}">?</text>`;
        break;
      case 'reluctant':
      case 'worried':
        eyes = dots(59, 3.2) + `<path d="M27 52 l9 -3M73 52 l-9 -3" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
        mouth = `<path d="M41 75 q4 -3 8 0 q4 3 8 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
        extra = `<path d="M84 30 q5 8 0 12 q-5 -4 0 -12z" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="1.5"/>`;
        break;
      case 'love': {
        const h = (x) => `<path d="M${x} 61 C${x - 9} 55 ${x - 8} 48 ${x - 3.5} 49 C${x - 1.5} 49 ${x} 51 ${x} 52 C${x} 51 ${x + 1.5} 49 ${x + 3.5} 49 C${x + 8} 48 ${x + 9} 55 ${x} 61 Z" fill="#e8778a"/>`;
        eyes = h(36) + h(64);
        mouth = `<path d="M42 71 Q50 81 58 71 Z" fill="#e8778a" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`;
        break;
      }
      case 'wink':
        eyes = `<circle cx="36" cy="57" r="3.6" fill="${INK}"/><path d="M58 58 q6 -7 12 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
        mouth = `<path d="M42 72 q8 7 16 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
        extra = sparkle(86, 30, C.yellow);
        break;
      case 'shy':
        eyes = `<path d="M31 59 q5 3 10 0M59 59 q5 3 10 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
        mouth = `<path d="M45 74 q2.5 -2 5 0 q2.5 2 5 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
        extra = `<ellipse cx="27" cy="69" rx="8" ry="5" fill="${C.blush}" opacity=".9"/><ellipse cx="73" cy="69" rx="8" ry="5" fill="${C.blush}" opacity=".9"/><path d="M14 64 l4 -3M15 70 l4 -2M86 64 l-4 -3M85 70 l-4 -2" stroke="#e8778a" stroke-width="1.8" stroke-linecap="round"/>`;
        break;
      case 'calm':
        eyes = `<path d="M30 57 q6 5 12 0M58 57 q6 5 12 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
        mouth = `<path d="M45 73 q5 4 10 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
        extra = `<path d="M8 30 q6 -4 12 0M80 26 q6 -4 12 0" fill="none" stroke="${C.skyDeep}" stroke-width="2" stroke-linecap="round"/>`;
        break;
      case 'bored':
        eyes = `<path d="M30 55 h12M58 55 h12" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M32 56 a4 3.6 0 0 0 8 0Z M60 56 a4 3.6 0 0 0 8 0Z" fill="${INK}"/>`;
        mouth = `<path d="M44 75 h12" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
        break;
      case 'confused':
        eyes = `<path d="M36 57 m-1.5 0 a1.5 1.5 0 1 1 3 0 a3 3 0 1 1 -6 0 a4.5 4.5 0 1 1 9 0M64 57 m-1.5 0 a1.5 1.5 0 1 1 3 0 a3 3 0 1 1 -6 0 a4.5 4.5 0 1 1 9 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
        mouth = `<path d="M41 75 q3 -3 6 0 q3 3 6 0 q3 -3 6 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
        extra = `<text x="80" y="24" font-family="Fredoka, sans-serif" font-size="18" font-weight="600" fill="${C.lilacDeep}">?</text><text x="10" y="30" font-family="Fredoka, sans-serif" font-size="13" font-weight="600" fill="${C.lilacDeep}">?</text>`;
        break;
      case 'determined':
        eyes = dots(58, 3.6) + `<path d="M28 49 l11 4M72 49 l-11 4" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
        mouth = `<path d="M43 74 q7 3 14 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
        extra = `<path d="M84 14 q6 6 2 12 q8 -2 8 -10 q-2 -6 -10 -2z" fill="${C.peach}" stroke="${C.peachDeep}" stroke-width="1.8" stroke-linejoin="round"/>`;
        break;
      default:
        break;
    }
    const nose = `<path d="M47 66 L53 66 L50 69.5 Z" fill="#e8778a"/>`;
    const whiskers = `<path d="M4 62 h16M5 70 l15 -3M96 62 h-16M95 70 l-15 -3" stroke="${C.furEdge}" stroke-width="2" stroke-linecap="round"/>`;
    const blush = `<ellipse cx="27" cy="71" rx="5.5" ry="3.6" fill="${C.blush}" opacity="0.75"/><ellipse cx="73" cy="71" rx="5.5" ry="3.6" fill="${C.blush}" opacity="0.75"/>`;
    return ears + head + blush + eyes + nose + mouth + whiskers + extra;
  }

  function sparkle(x, y, color) {
    return `<path d="M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z" fill="${color}" stroke="${C.yellowDeep}" stroke-width="1.2" stroke-linejoin="round"/>`;
  }
  const star5 = (cx, cy, r, fill, edge) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.48 : r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1) + ' ';
    }
    return `<path d="${d}Z" fill="${fill}" stroke="${edge}" stroke-width="3" stroke-linejoin="round"/>`;
  };
  const smile = (x, y) => `<circle cx="${x - 6}" cy="${y}" r="2.4" fill="${INK}"/><circle cx="${x + 6}" cy="${y}" r="2.4" fill="${INK}"/><path d="M${x - 4} ${y + 6} q4 4 8 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;

  /* ---------- word pictures ---------- */
  const PICS = {
    apple: () => `<path d="M50 30 C30 18 13 34 18 56 C22 80 40 91 50 84 C60 91 78 80 82 56 C87 34 70 18 50 30Z" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="4"/>
      <path d="M50 30 Q52 18 58 11" stroke="${C.brownDeep}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M57 20 Q70 9 78 21 Q65 29 57 20Z" fill="${C.mint}" stroke="${C.mintDeep}" stroke-width="3"/>
      <path d="M31 44 Q28 53 33 62" stroke="#fff" stroke-width="5" opacity=".7" fill="none" stroke-linecap="round"/>`,
    flower: () => `<path d="M50 60 Q48 78 52 94" stroke="${C.mintDeep}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M51 80 Q66 70 74 78 Q62 88 51 80Z" fill="${C.mint}" stroke="${C.mintDeep}" stroke-width="3"/>
      ${[0, 72, 144, 216, 288].map((a) => { const r = (a - 90) * Math.PI / 180; return `<circle cx="${(50 + Math.cos(r) * 17).toFixed(1)}" cy="${(40 + Math.sin(r) * 17).toFixed(1)}" r="13" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="3"/>`; }).join('')}
      <circle cx="50" cy="40" r="10" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="3"/>`,
    tree: () => `<path d="M42 92 Q46 80 45 64 H55 Q54 80 58 92 Z" fill="${C.brown}" stroke="${C.brownDeep}" stroke-width="3" stroke-linejoin="round"/>
      ${['circle cx="50" cy="30" r="20"', 'circle cx="30" cy="44" r="17"', 'circle cx="70" cy="44" r="17"', 'circle cx="40" cy="58" r="14"', 'circle cx="60" cy="58" r="14"'].map((c) => `<${c} fill="${C.mintDeep}" stroke="${C.mintDeep}" stroke-width="6"/>`).join('')}
      ${['circle cx="50" cy="30" r="20"', 'circle cx="30" cy="44" r="17"', 'circle cx="70" cy="44" r="17"', 'circle cx="40" cy="58" r="14"', 'circle cx="60" cy="58" r="14"'].map((c) => `<${c} fill="${C.mint}"/>`).join('')}
      <path d="M36 22 q6 -8 16 -8" fill="none" stroke="#d7f3d2" stroke-width="4" stroke-linecap="round"/>
      <circle cx="34" cy="44" r="5" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="1.5"/><circle cx="62" cy="34" r="5" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="1.5"/><circle cx="56" cy="56" r="5" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="1.5"/>
      <path d="M44 80 q6 -4 12 0" fill="none" stroke="${C.brownDeep}" stroke-width="2" stroke-linecap="round"/>`,
    sun: () => `${Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return `<path d="M${(50 + Math.cos(a) * 30).toFixed(1)} ${(50 + Math.sin(a) * 30).toFixed(1)} L${(50 + Math.cos(a) * 43).toFixed(1)} ${(50 + Math.sin(a) * 43).toFixed(1)}" stroke="${C.peachDeep}" stroke-width="5" stroke-linecap="round"/>`; }).join('')}
      <circle cx="50" cy="50" r="24" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="4"/>${smile(50, 48)}
      <ellipse cx="38" cy="56" rx="4" ry="2.6" fill="${C.blush}"/><ellipse cx="62" cy="56" rx="4" ry="2.6" fill="${C.blush}"/>`,
    moon: () => `<path d="M60 14 A36 36 0 1 0 86 66 A28 28 0 1 1 60 14 Z" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 54 q4 4 8 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      ${star5(78, 22, 7, C.white, C.yellowDeep)}${star5(84, 44, 5, C.white, C.yellowDeep)}`,
    cloud: () => `<path d="M24 70 C10 70 10 50 24 50 C24 34 44 30 50 42 C56 28 80 32 78 50 C92 50 92 70 78 70 Z" fill="${C.white}" stroke="${C.skyDeep}" stroke-width="4" stroke-linejoin="round"/>${smile(50, 58)}`,
    rain: () => `<path d="M24 54 C10 54 10 34 24 34 C24 18 44 14 50 26 C56 12 80 16 78 34 C92 34 92 54 78 54 Z" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="4" stroke-linejoin="round"/>
      ${[[30, 66], [50, 72], [70, 66], [40, 86], [60, 86]].map(([x, y]) => `<path d="M${x} ${y} q5 8 0 11 q-5 -3 0 -11z" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="2"/>`).join('')}`,
    snow: () => `<g stroke="${C.skyDeep}" stroke-width="4" stroke-linecap="round" fill="none">
      ${[0, 60, 120].map((a) => `<g transform="rotate(${a} 50 50)"><path d="M50 14 V86"/><path d="M42 22 L50 30 L58 22M42 78 L50 70 L58 78"/></g>`).join('')}</g>
      <circle cx="50" cy="50" r="7" fill="${C.white}" stroke="${C.skyDeep}" stroke-width="3"/>`,
    star: () => `${star5(50, 52, 40, C.yellow, C.yellowDeep)}${smile(50, 54)}`,
    heart: () => `<path d="M50 86 C22 66 10 50 14 34 C18 18 40 14 50 32 C60 14 82 18 86 34 C90 50 78 66 50 86 Z" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M26 34 Q28 26 36 24" stroke="#fff" stroke-width="5" opacity=".75" fill="none" stroke-linecap="round"/>`,
    house: () => `<path d="M14 48 L50 16 L86 48" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="22" y="46" width="56" height="42" rx="4" fill="${C.white}" stroke="${C.peachDeep}" stroke-width="4"/>
      <rect x="44" y="62" width="14" height="26" rx="3" fill="${C.peach}" stroke="${C.peachDeep}" stroke-width="3"/>
      <rect x="28" y="54" width="12" height="12" rx="2" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="3"/>
      <rect x="62" y="54" width="12" height="12" rx="2" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="3"/>`,
    school: () => `<rect x="16" y="40" width="68" height="48" rx="4" fill="${C.white}" stroke="${C.peachDeep}" stroke-width="4"/>
      <path d="M10 42 L50 18 L90 42 Z" fill="${C.peach}" stroke="${C.peachDeep}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="50" cy="34" r="6" fill="${C.white}" stroke="${C.peachDeep}" stroke-width="2.5"/>
      <path d="M50 18 V6 L62 10 L50 14" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="42" y="64" width="16" height="24" rx="3" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="3"/>
      ${[24, 64].map((x) => `<rect x="${x}" y="50" width="12" height="10" rx="2" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="2.5"/>`).join('')}`,
    book: () => `<path d="M50 30 C38 22 22 22 12 26 V82 C22 78 38 78 50 86 Z" fill="${C.white}" stroke="${C.lilacDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M50 30 C62 22 78 22 88 26 V82 C78 78 62 78 50 86 Z" fill="${C.white}" stroke="${C.lilacDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M20 40 Q32 37 42 41M20 52 Q32 49 42 53M58 41 Q68 37 80 40M58 53 Q68 49 80 52" stroke="${C.lilac}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M50 30 V86" stroke="${C.lilacDeep}" stroke-width="3"/>`,
    pencil: () => `<g transform="rotate(-35 50 50)"><rect x="40" y="12" width="20" height="60" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="4"/>
      <path d="M40 72 L50 92 L60 72 Z" fill="#ebc79e" stroke="${C.brownDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M46 84 L50 92 L54 84 Z" fill="${INK}"/>
      <rect x="40" y="6" width="20" height="10" rx="3" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="4"/></g>`,
    clock: () => `<circle cx="28" cy="20" r="9" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="3"/><circle cx="72" cy="20" r="9" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="3"/>
      <circle cx="50" cy="54" r="34" fill="${C.white}" stroke="${C.pinkDeep}" stroke-width="4"/>
      <path d="M50 54 V34M50 54 L64 62" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      ${[0, 90, 180, 270].map((a) => { const r = a * Math.PI / 180; return `<circle cx="${(50 + Math.cos(r) * 26).toFixed(1)}" cy="${(54 + Math.sin(r) * 26).toFixed(1)}" r="2.6" fill="${C.pinkDeep}"/>`; }).join('')}`,
    bag: () => `<path d="M34 30 Q34 14 50 14 Q66 14 66 30" fill="none" stroke="${C.skyDeep}" stroke-width="5"/>
      <rect x="20" y="28" width="60" height="62" rx="14" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="4"/>
      <rect x="30" y="56" width="40" height="24" rx="6" fill="${C.white}" stroke="${C.skyDeep}" stroke-width="3"/>
      <path d="M30 66 H70" stroke="${C.skyDeep}" stroke-width="3"/>`,
    bird: () => `<ellipse cx="48" cy="56" rx="32" ry="28" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="4"/>
      <path d="M40 58 Q48 74 62 60" fill="${C.white}" stroke="${C.skyDeep}" stroke-width="3"/>
      <path d="M78 50 L94 56 L78 62 Z" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="64" cy="46" r="4" fill="${INK}"/><ellipse cx="66" cy="56" rx="4" ry="2.5" fill="${C.blush}"/>
      <path d="M30 30 Q36 20 44 28" fill="none" stroke="${C.skyDeep}" stroke-width="3" stroke-linecap="round"/>`,
    fish: () => `<path d="M20 50 Q46 20 74 50 Q46 80 20 50 Z" fill="${C.peach}" stroke="${C.peachDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M72 50 L92 34 L90 66 Z" fill="${C.peach}" stroke="${C.peachDeep}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="34" cy="46" r="4" fill="${INK}"/><path d="M46 38 Q52 50 46 62" stroke="${C.peachDeep}" stroke-width="3" fill="none"/>
      <circle cx="16" cy="28" r="4" fill="none" stroke="${C.skyDeep}" stroke-width="2.5"/><circle cx="10" cy="16" r="3" fill="none" stroke="${C.skyDeep}" stroke-width="2.5"/>`,
    ball: () => { const cols = [C.pink, C.yellow, C.sky, C.mint, C.lilac, C.peach]; let d = '';
      for (let i = 0; i < 6; i++) { const a0 = (i * 60 - 90) * Math.PI / 180, a1 = ((i + 1) * 60 - 90) * Math.PI / 180;
        d += `<path d="M50 52 L${(50 + Math.cos(a0) * 38).toFixed(1)} ${(52 + Math.sin(a0) * 38).toFixed(1)} A38 38 0 0 1 ${(50 + Math.cos(a1) * 38).toFixed(1)} ${(52 + Math.sin(a1) * 38).toFixed(1)} Z" fill="${cols[i]}"/>`; }
      return `${d}<circle cx="50" cy="52" r="38" fill="none" stroke="${C.pinkDeep}" stroke-width="4"/><circle cx="50" cy="52" r="8" fill="#fff" stroke="${C.pinkDeep}" stroke-width="2.5"/>
        <path d="M24 38 q8 -14 22 -18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/><ellipse cx="50" cy="95" rx="26" ry="3" fill="#e8dccb"/>`; },
    cake: () => `<rect x="18" y="48" width="64" height="38" rx="8" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="4"/>
      <path d="M18 58 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0" fill="${C.white}" stroke="${C.pinkDeep}" stroke-width="3"/>
      <rect x="46" y="24" width="8" height="24" rx="3" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="3"/>
      <path d="M50 10 q6 8 0 12 q-6 -4 0 -12z" fill="${C.yellow}" stroke="${C.peachDeep}" stroke-width="2.5"/>
      <circle cx="30" cy="74" r="3" fill="${C.yellow}"/><circle cx="50" cy="76" r="3" fill="${C.mint}"/><circle cx="70" cy="74" r="3" fill="${C.yellow}"/>`,
    gift: () => `<rect x="16" y="40" width="68" height="48" rx="6" fill="${C.lilac}" stroke="${C.lilacDeep}" stroke-width="4"/>
      <rect x="12" y="30" width="76" height="16" rx="5" fill="${C.lilac}" stroke="${C.lilacDeep}" stroke-width="4"/>
      <rect x="44" y="30" width="12" height="58" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="3"/>
      <path d="M50 30 C36 12 22 22 34 30 Z M50 30 C64 12 78 22 66 30 Z" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="3" stroke-linejoin="round"/>`,
    music: () => `<path d="M34 72 V28 L78 18 V62" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M34 34 L78 24" stroke="${INK}" stroke-width="9"/>
      <ellipse cx="26" cy="72" rx="11" ry="9" fill="${C.lilac}" stroke="${INK}" stroke-width="4"/>
      <ellipse cx="70" cy="62" rx="11" ry="9" fill="${C.pink}" stroke="${INK}" stroke-width="4"/>
      ${sparkle(86, 82, C.yellow)}`,
    globe: () => `<circle cx="50" cy="50" r="38" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="4"/>
      <path d="M30 30 Q40 24 46 32 Q44 42 34 44 Q26 40 30 30Z M56 52 Q68 46 74 56 Q72 70 60 72 Q52 64 56 52Z M58 22 Q66 20 70 28 Q62 32 58 22Z" fill="${C.mint}" stroke="${C.mintDeep}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M12 50 H88M50 12 Q30 50 50 88M50 12 Q70 50 50 88" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>`,
    mountain: () => `<circle cx="76" cy="24" r="10" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="3"/>
      <path d="M6 86 L38 30 L70 86 Z" fill="${C.mint}" stroke="${C.mintDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M44 86 L68 46 L94 86 Z" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M30 44 L38 30 L46 44 L42 40 L38 46 L34 40 Z" fill="${C.white}" stroke="${C.mintDeep}" stroke-width="2.5" stroke-linejoin="round"/>`,
    wave: () => `<path d="M6 60 Q20 30 40 46 Q52 56 46 66 Q38 60 44 50" fill="none" stroke="${C.skyDeep}" stroke-width="5" stroke-linecap="round"/>
      <path d="M6 66 Q28 54 50 66 T94 66 V90 H6 Z" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M50 46 Q66 26 84 40 Q92 48 86 56 Q80 50 84 44" fill="none" stroke="${C.skyDeep}" stroke-width="5" stroke-linecap="round"/>`,
    island: () => `<path d="M6 76 Q28 70 50 76 T94 76 V92 H6 Z" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="3"/>
      <path d="M22 76 Q50 54 80 76 Z" fill="#ffe7b0" stroke="${C.yellowDeep}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M50 66 Q46 44 52 26" fill="none" stroke="${C.brownDeep}" stroke-width="5" stroke-linecap="round"/>
      <path d="M52 26 Q36 18 24 30 M52 26 Q66 14 80 24 M52 26 Q44 34 38 46 M52 26 Q66 32 70 44" fill="none" stroke="${C.mintDeep}" stroke-width="5" stroke-linecap="round"/>`,
    map: () => `<path d="M10 24 L36 16 L64 24 L90 16 V78 L64 86 L36 78 L10 86 Z" fill="${C.white}" stroke="${C.peachDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M36 16 V78M64 24 V86" stroke="${C.peach}" stroke-width="3"/>
      <path d="M20 68 Q32 52 44 60 T70 40" fill="none" stroke="${C.pinkDeep}" stroke-width="3" stroke-dasharray="4 5" stroke-linecap="round"/>
      <path d="M70 34 l8 8M78 34 l-8 8" stroke="#e04a66" stroke-width="4" stroke-linecap="round"/>`,
    bulb: () => `${[[-60], [-30], [0], [30], [60]].map(([a]) => { const r = (a - 90) * Math.PI / 180; return `<path d="M${(50 + Math.cos(r) * 36).toFixed(1)} ${(40 + Math.sin(r) * 36).toFixed(1)} L${(50 + Math.cos(r) * 46).toFixed(1)} ${(40 + Math.sin(r) * 46).toFixed(1)}" stroke="${C.yellowDeep}" stroke-width="4" stroke-linecap="round"/>`; }).join('')}
      <path d="M50 14 C30 14 22 32 28 46 C32 54 38 58 38 68 H62 C62 58 68 54 72 46 C78 32 70 14 50 14 Z" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="38" y="68" width="24" height="16" rx="4" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="3"/>
      <path d="M44 88 H56" stroke="${C.skyDeep}" stroke-width="4" stroke-linecap="round"/>${smile(50, 40)}`,
    trophy: () => `<path d="M30 16 H70 V40 C70 56 60 62 50 62 C40 62 30 56 30 40 Z" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M30 22 H16 C16 40 26 44 32 44M70 22 H84 C84 40 74 44 68 44" fill="none" stroke="${C.yellowDeep}" stroke-width="4"/>
      <rect x="44" y="62" width="12" height="14" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="3"/>
      <rect x="30" y="76" width="40" height="12" rx="3" fill="${C.peach}" stroke="${C.peachDeep}" stroke-width="3"/>
      ${star5(50, 36, 10, C.white, C.yellowDeep)}`,
    coin: () => `<ellipse cx="50" cy="72" rx="32" ry="12" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="4"/>
      <ellipse cx="50" cy="62" rx="32" ry="12" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="4"/>
      <circle cx="56" cy="36" r="24" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="4"/>
      ${star5(56, 37, 11, C.white, C.yellowDeep)}`,
    key: () => `<circle cx="32" cy="34" r="18" fill="${C.yellow}" stroke="${C.yellowDeep}" stroke-width="4"/><circle cx="32" cy="34" r="7" fill="${C.white}" stroke="${C.yellowDeep}" stroke-width="3"/>
      <path d="M44 46 L82 84 M66 68 L74 60 M74 76 L82 68" stroke="${C.yellowDeep}" stroke-width="7" stroke-linecap="round"/>
      <path d="M44 46 L82 84" stroke="${C.yellow}" stroke-width="3" stroke-linecap="round"/>`,
    rocket: () => `<path d="M50 8 C68 22 70 50 62 72 H38 C30 50 32 22 50 8 Z" fill="${C.white}" stroke="${C.skyDeep}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="50" cy="38" r="9" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="3"/>
      <path d="M38 60 L24 76 L38 72 Z M62 60 L76 76 L62 72 Z" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M42 74 Q50 98 58 74 Z" fill="${C.yellow}" stroke="${C.peachDeep}" stroke-width="3" stroke-linejoin="round"/>`,
    plane: () => `<path d="M10 54 Q50 40 88 46 Q94 50 88 54 Q50 60 10 54 Z" fill="${C.white}" stroke="${C.skyDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M44 50 L30 22 L40 22 L60 48 Z M44 54 L32 80 L42 80 L60 56 Z" fill="${C.sky}" stroke="${C.skyDeep}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M14 52 L8 38 L16 38 L24 50 Z" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="3" stroke-linejoin="round"/>
      ${[62, 70, 78].map((x) => `<circle cx="${x}" cy="49" r="2.6" fill="${C.skyDeep}"/>`).join('')}`,
    letter: () => `<rect x="12" y="26" width="76" height="52" rx="6" fill="${C.white}" stroke="${C.lilacDeep}" stroke-width="4"/>
      <path d="M14 30 L50 58 L86 30" fill="none" stroke="${C.lilacDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M50 70 C40 62 40 54 46 54 C49 54 50 57 50 57 C50 57 51 54 54 54 C60 54 60 62 50 70 Z" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="2.5"/>`,
    basket: () => `<circle cx="34" cy="40" r="13" fill="${C.pink}" stroke="${C.pinkDeep}" stroke-width="3"/>
      <circle cx="54" cy="32" r="13" fill="${C.peach}" stroke="${C.peachDeep}" stroke-width="3"/>
      <circle cx="70" cy="42" r="12" fill="${C.mint}" stroke="${C.mintDeep}" stroke-width="3"/>
      <path d="M12 50 H88 L78 88 Q76 92 70 92 H30 Q24 92 22 88 Z" fill="#ebc79e" stroke="${C.brownDeep}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M22 62 H78M26 76 H74" stroke="${C.brown}" stroke-width="3" stroke-linecap="round"/>`,
    rainbow: () => `${[[C.pink, C.pinkDeep, 40], [C.yellow, C.yellowDeep, 32], [C.mint, C.mintDeep, 24], [C.sky, C.skyDeep, 16]].map(([f, s, r]) => `<path d="M${50 - r} 74 A${r} ${r} 0 0 1 ${50 + r} 74" fill="none" stroke="${s}" stroke-width="10"/><path d="M${50 - r} 74 A${r} ${r} 0 0 1 ${50 + r} 74" fill="none" stroke="${f}" stroke-width="6"/>`).join('')}
      <path d="M6 80 Q10 70 20 74 Q28 68 32 78 Q34 86 20 86 Q6 88 6 80Z M68 80 Q72 70 82 74 Q90 68 94 78 Q96 86 82 86 Q68 88 68 80Z" fill="${C.white}" stroke="${C.skyDeep}" stroke-width="3" stroke-linejoin="round"/>`,
  };

  // Extra pictures and cat accessories live in js/pics.js; they register here.
  const ACCESSORY = {};

  // key: a picture name ('apple'), a cat ('cat:happy'), a cat with something on ('cat:happy/crown'),
  // or a cat with a small picture beside it ('cat:thinking+magnifier'). Combinations work too.
  function draw(key) {
    if (!key || !key.startsWith('cat:')) return (PICS[key] || (() => cat('thinking')))();
    const [head, prop] = key.slice(4).split('+');
    const [mood, ...wear] = head.split('/');
    const body = cat(mood) + wear.map((w) => (ACCESSORY[w] ? ACCESSORY[w]() : '')).join('');
    if (!prop || !PICS[prop]) return body;
    return `<g transform="translate(-2 18) scale(0.84)">${body}</g><g transform="translate(60 -1) scale(0.42)">${PICS[prop]()}</g>`;
  }

  function svg(key, size = 96, label = '') {
    const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
    return `<svg class="doodle" viewBox="0 0 100 100" width="${size}" height="${size}" ${a11y}><g filter="url(#wob)">${draw(key)}</g></svg>`;
  }
  const has = (key) => {
    if (!key) return false;
    if (!key.startsWith('cat:')) return !!PICS[key];
    const [head, prop] = key.slice(4).split('+');
    const [, ...wear] = head.split('/');
    return wear.every((w) => ACCESSORY[w]) && (!prop || !!PICS[prop]);
  };

  /* ---------- stickers: one for each finished quiz ---------- */
  const STICKER_ART = [
    ['cat:happy', '웃는 냥이'], ['star', '반짝 별'], ['apple', '빨간 사과'], ['rainbow', '무지개'], ['heart', '두근 하트'],
    ['cake', '생일 케이크'], ['rocket', '우주 로켓'], ['flower', '분홍 꽃'], ['cat:proud', '뿌듯 냥이'], ['music', '노래 음표'],
    ['globe', '파란 지구'], ['trophy', '금빛 트로피'], ['moon', '초승달'], ['gift', '깜짝 선물'], ['bird', '파랑새'],
    ['fish', '주황 물고기'], ['cat:excited', '신난 냥이'], ['sun', '햇님'], ['island', '야자수 섬'], ['bulb', '번뜩 전구'],
    ['cat:sleepy', '졸린 냥이'], ['cloud', '뭉게구름'], ['tree', '열매 나무'], ['plane', '비행기'], ['letter', '사랑 편지'],
    ['key', '황금 열쇠'], ['coin', '반짝 동전'], ['map', '보물 지도'], ['cat:teacher', '선생님 냥이'], ['basket', '과일 바구니'],
    ['mountain', '눈 덮인 산'], ['wave', '큰 파도'], ['house', '우리 집'], ['book', '펼친 책'], ['ball', '알록 공'],
    ['clock', '자명종'], ['cat:surprised', '깜짝 냥이'], ['pencil', '노란 연필'], ['school', '우리 학교'], ['bag', '책가방'],
  ];
  const STICKER_BG = ['#ffe7ec', '#fff3c4', '#e6f7e4', '#e3f1fc', '#f3e8fb', '#ffe9d6'];
  const stickers = STICKER_ART.map(([art, name], i) => ({ id: i, art, name, bg: STICKER_BG[i % STICKER_BG.length] }));

  window.Art = { svg, cat, stickers, has, PICS, ACCESSORY, C, INK, sparkle, star5, smile };
})();
