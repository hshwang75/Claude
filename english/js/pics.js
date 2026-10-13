/* More pictures for the words, and things the cat teacher can wear. Registered into Art (art.js).
   Every drawing sits in a 100 x 100 box, in the same crayon colours. */
(function () {
  'use strict';

  const { PICS, ACCESSORY, C, INK, sparkle, star5, smile } = window.Art;
  // fill, outline colour, outline width
  const st = (fill, edge, w = 3) => `fill="${fill}" stroke="${edge}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const line = (edge, w = 3) => `fill="none" stroke="${edge}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const eye = (x, y, r = 3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
  const blush = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.6" fill="${C.blush}" opacity=".8"/>`;
  const W = C.white;
  // Several overlapping shapes drawn as one soft blob: outline them all, then fill them all.
  const blob = (shapes, fill, edge, w = 3) => shapes.map((sh) => `<${sh} fill="${edge}" stroke="${edge}" stroke-width="${w * 2}" stroke-linejoin="round"/>`).join('')
    + shapes.map((sh) => `<${sh} fill="${fill}"/>`).join('');

  /* ---------- what the cat can wear (drawn over the full-size cat face) ---------- */
  Object.assign(ACCESSORY, {
    crown: () => `<path d="M33 31 L35 13 L43 22 L50 9 L57 22 L65 13 L67 31 Z" ${st(C.yellow, C.yellowDeep)}/>
      <circle cx="50" cy="25" r="2.6" fill="${C.pink}"/><circle cx="40" cy="27" r="2" fill="${C.sky}"/><circle cx="60" cy="27" r="2" fill="${C.sky}"/>`,
    party: () => `<path d="M42 30 L56 2 L64 30 Z" ${st(C.pink, C.pinkDeep)}/><path d="M48 18 L59 18M45 25 L62 25" ${line(W, 3)}/>
      <circle cx="56" cy="3" r="4" ${st(C.yellow, C.yellowDeep, 2)}/>`,
    grad: () => `<path d="M38 27 v7 q12 6 24 0 v-7" fill="${INK}"/><path d="M24 22 L50 11 L76 22 L50 32 Z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M50 21 L74 25 L74 38" ${line(C.yellow, 2)}/><circle cx="74" cy="40" r="3" fill="${C.yellow}"/>`,
    chef: () => `<path d="M35 33 v-7 a8 8 0 0 1 3 -15 a12 12 0 0 1 24 0 a8 8 0 0 1 3 15 v7 Z" ${st(W, C.line || '#d8cbb8')}/><path d="M35 28 h30" ${line('#d8cbb8', 2)}/>`,
    bandage: () => `<g transform="rotate(-30 66 42)"><rect x="56" y="38" width="22" height="8" rx="3" ${st('#f4cfa6', C.peachDeep, 2)}/><circle cx="64" cy="42" r=".9" fill="${C.peachDeep}"/><circle cx="70" cy="42" r=".9" fill="${C.peachDeep}"/></g>`,
    scarf: () => `<path d="M20 84 q30 14 60 0 l1 9 q-31 13 -62 0 Z" ${st(C.pink, C.pinkDeep)}/><path d="M64 92 l6 8 l7 -3 l-4 -9" ${st(C.pink, C.pinkDeep)}/>`,
    shades: () => `<rect x="25" y="50" width="20" height="13" rx="5" fill="${INK}"/><rect x="55" y="50" width="20" height="13" rx="5" fill="${INK}"/>
      <path d="M45 55 h10" ${line(INK, 3)}/><path d="M29 53 l5 0" ${line('#ffffff', 2)}/><path d="M59 53 l5 0" ${line('#ffffff', 2)}/>`,
    goggles: () => `<path d="M14 56 h72" ${line(C.skyDeep, 4)}/><circle cx="36" cy="56" r="10" ${st('#d9efff', C.skyDeep)} fill-opacity=".75"/><circle cx="64" cy="56" r="10" ${st('#d9efff', C.skyDeep)} fill-opacity=".75"/>`,
    halo: () => `<ellipse cx="50" cy="7" rx="17" ry="5" ${line(C.yellowDeep, 3)}/><ellipse cx="50" cy="7" rx="17" ry="5" ${line(C.yellow, 1.5)}/>`,
    phones: () => `<path d="M14 60 Q14 22 50 22 Q86 22 86 60" ${line(INK, 4)}/><rect x="6" y="50" width="12" height="20" rx="5" ${st(C.lilac, C.lilacDeep)}/><rect x="82" y="50" width="12" height="20" rx="5" ${st(C.lilac, C.lilacDeep)}/>`,
    bow: () => `<path d="M70 24 l-10 -7 v14 Z M70 24 l10 -7 v14 Z" ${st(C.pink, C.pinkDeep, 2)}/><circle cx="70" cy="24" r="3" ${st(C.pink, C.pinkDeep, 2)}/>`,
    helmet: () => `<circle cx="50" cy="55" r="47" fill="${C.sky}" fill-opacity=".22" stroke="${C.skyDeep}" stroke-width="3"/><path d="M20 34 q8 -14 24 -18" ${line('#ffffff', 4)}/>`,
    bonnet: () => `<path d="M17 64 Q15 16 50 16 Q85 16 83 64" ${line(C.pink, 9)}/><path d="M17 64 Q15 16 50 16 Q85 16 83 64" ${line(C.pinkDeep, 2)}/><path d="M44 94 l6 -5 l6 5" ${line(C.pinkDeep, 3)}/>`,
    doctor: () => `<circle cx="50" cy="24" r="8" ${st('#e8eef3', '#8aa0b2')}/><circle cx="50" cy="24" r="3" fill="#ffffff"/><path d="M42 24 h-16M58 24 h16" ${line('#8aa0b2', 2)}/>
      <path d="M30 86 q20 16 40 0" ${line(INK, 2.5)}/><circle cx="50" cy="96" r="4" ${st('#cfd8e0', INK, 2)}/>`,
    flowers: () => [[34, 26, C.pink], [50, 20, C.yellow], [66, 26, C.lilac]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6" ${st(c, C.pinkDeep, 1.8)}/><circle cx="${x}" cy="${y}" r="2" fill="${C.yellowDeep}"/>`).join(''),
    sweat: () => `<path d="M84 34 q6 9 0 13 q-6 -4 0 -13z" ${st(C.sky, C.skyDeep, 1.6)}/><path d="M12 40 q5 7 0 10 q-5 -3 0 -10z" ${st(C.sky, C.skyDeep, 1.6)}/>`,
    mask: () => `<path d="M24 66 q26 -8 52 0 l-2 14 q-24 8 -48 0 Z" ${st('#e3f1fc', C.skyDeep, 2.5)}/><path d="M24 68 l-8 -6M76 68 l8 -6" ${line(C.skyDeep, 2)}/>`,
  });

  /* ---------- animals ---------- */
  Object.assign(PICS, {
    dog: () => `<path d="M24 30 Q10 34 14 60 Q22 62 28 48 Z M76 30 Q90 34 86 60 Q78 62 72 48 Z" ${st(C.brown, C.brownDeep)}/>
      <ellipse cx="50" cy="56" rx="28" ry="27" ${st('#f1d7b3', C.brownDeep)}/>${eye(40, 52)}${eye(60, 52)}
      <ellipse cx="50" cy="64" rx="6" ry="4.5" fill="${INK}"/><path d="M50 68 v4 M44 74 q6 5 12 0" ${line(INK, 2.2)}/><path d="M48 76 q2 7 4 0" ${st(C.pink, C.pinkDeep, 1.5)}/>${blush(33, 64)}${blush(67, 64)}`,
    rabbit: () => `<ellipse cx="38" cy="26" rx="8" ry="22" ${st(W, '#c9b9cf')}/><ellipse cx="62" cy="26" rx="8" ry="22" ${st(W, '#c9b9cf')}/>
      <ellipse cx="38" cy="28" rx="3.5" ry="14" fill="${C.pink}"/><ellipse cx="62" cy="28" rx="3.5" ry="14" fill="${C.pink}"/>
      <ellipse cx="50" cy="64" rx="27" ry="24" ${st(W, '#c9b9cf')}/>${eye(41, 60)}${eye(59, 60)}<path d="M47 68 L53 68 L50 71 Z" fill="#e8778a"/><path d="M50 71 v4 M45 76 q5 3 10 0" ${line(INK, 2)}/>${blush(34, 70)}${blush(66, 70)}`,
    horse: () => `<path d="M30 30 L26 10 L40 22 Z M70 30 L74 10 L60 22 Z" ${st(C.brown, C.brownDeep)}/>
      <path d="M50 18 C30 18 28 36 30 52 C32 66 34 80 50 86 C66 80 68 66 70 52 C72 36 70 18 50 18 Z" ${st('#d9a066', C.brownDeep)}/>
      <ellipse cx="50" cy="74" rx="16" ry="13" ${st('#f1d0a8', C.brownDeep)}/><circle cx="44" cy="74" r="2.6" fill="${C.brownDeep}"/><circle cx="56" cy="74" r="2.6" fill="${C.brownDeep}"/>
      ${eye(39, 46, 3.2)}${eye(61, 46, 3.2)}<path d="M50 18 Q42 8 34 14 Q42 18 44 30 Q50 22 56 30 Q58 18 66 14 Q58 8 50 18 Z" ${st(C.brownDeep, C.brownDeep, 2)}/>${blush(34, 58)}${blush(66, 58)}`,
    cow: () => `<ellipse cx="14" cy="40" rx="11" ry="6" transform="rotate(-20 14 40)" ${st(W, INK, 2.5)}/><ellipse cx="86" cy="40" rx="11" ry="6" transform="rotate(20 86 40)" ${st(W, INK, 2.5)}/>
      <path d="M30 22 q-4 -12 -12 -12 q6 6 6 16 M70 22 q4 -12 12 -12 q-6 6 -6 16" ${st(C.yellow, C.yellowDeep, 2)}/>
      <path d="M24 40 Q24 18 50 18 Q76 18 76 40 V62 Q76 70 70 72 H30 Q24 70 24 62 Z" ${st(W, INK)}/>
      <path d="M26 30 Q34 22 42 30 Q40 40 30 40 Q24 38 26 30 Z M64 24 Q74 26 74 36 Q66 40 60 32 Z" fill="${INK}"/>
      ${eye(40, 46, 3.4)}${eye(60, 46, 3.4)}<circle cx="41" cy="45" r="1.2" fill="${W}"/><circle cx="61" cy="45" r="1.2" fill="${W}"/>
      <path d="M20 68 Q20 56 50 56 Q80 56 80 68 Q80 90 50 90 Q20 90 20 68 Z" ${st('#ffc2cc', C.pinkDeep)}/>
      <ellipse cx="38" cy="70" rx="4" ry="5" fill="${C.pinkDeep}"/><ellipse cx="62" cy="70" rx="4" ry="5" fill="${C.pinkDeep}"/><path d="M42 82 q8 5 16 0" ${line(C.pinkDeep, 2.5)}/>${blush(28, 54)}${blush(72, 54)}`,
    duck: () => `<path d="M2 82 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" ${line(C.skyDeep, 3)}/>
      ${blob(['ellipse cx="46" cy="64" rx="34" ry="18"', 'circle cx="62" cy="34" r="19"', 'path d="M10 58 Q4 44 16 48 Z"'], C.yellow, C.yellowDeep)}
      <path d="M34 60 q10 -12 22 -4 q-6 10 -22 4 Z" ${st('#ffd34f', C.yellowDeep, 2.5)}/>
      <path d="M78 36 Q96 34 94 42 Q90 48 78 44 Z" ${st(C.peach, C.peachDeep, 2.5)}/><path d="M80 41 h12" ${line(C.peachDeep, 1.8)}/>
      ${eye(68, 30, 3.4)}<circle cx="69" cy="29" r="1.2" fill="${W}"/>${blush(64, 42)}<path d="M58 16 q4 -8 10 -4" ${line(C.yellowDeep, 2.5)}/>`,
    bear: () => `<circle cx="26" cy="28" r="12" ${st(C.brown, C.brownDeep)}/><circle cx="74" cy="28" r="12" ${st(C.brown, C.brownDeep)}/><circle cx="26" cy="28" r="5" fill="#e9b98a"/><circle cx="74" cy="28" r="5" fill="#e9b98a"/>
      <circle cx="50" cy="56" r="32" ${st(C.brown, C.brownDeep)}/><ellipse cx="50" cy="68" rx="14" ry="11" fill="#e9c9a0"/>${eye(38, 52, 3.4)}${eye(62, 52, 3.4)}
      <ellipse cx="50" cy="63" rx="5" ry="3.6" fill="${INK}"/><path d="M45 71 q5 4 10 0" ${line(INK, 2)}/>${blush(30, 64)}${blush(70, 64)}`,
    turtle: () => `<path d="M16 66 Q20 34 50 32 Q80 34 84 66 Z" ${st(C.mint, C.mintDeep)}/><path d="M36 38 L32 66 M64 38 L68 66 M22 52 H78" ${line(C.mintDeep, 2.5)}/>
      <ellipse cx="88" cy="60" rx="9" ry="8" ${st('#cdeec9', C.mintDeep)}/>${eye(90, 58, 2)}<path d="M24 66 v12 M44 66 v12 M58 66 v12 M76 66 v12" ${line(C.mintDeep, 6)}/><path d="M12 64 l-6 4" ${line(C.mintDeep, 4)}/>`,
    elephant: () => `<ellipse cx="22" cy="44" rx="16" ry="20" ${st('#c9d3de', '#7d8fa3')}/><ellipse cx="78" cy="44" rx="16" ry="20" ${st('#c9d3de', '#7d8fa3')}/>
      <ellipse cx="50" cy="46" rx="26" ry="26" ${st('#dbe3ec', '#7d8fa3')}/><path d="M44 58 Q44 84 56 88 Q64 88 60 80 Q54 78 56 58" ${st('#dbe3ec', '#7d8fa3')}/>
      ${eye(40, 42)}${eye(60, 42)}${blush(36, 54)}${blush(64, 54)}`,
    butterfly: () => `<path d="M50 50 Q30 14 14 26 Q6 44 50 50 Z M50 50 Q70 14 86 26 Q94 44 50 50 Z" ${st(C.lilac, C.lilacDeep)}/>
      <path d="M50 52 Q30 84 20 72 Q16 58 50 52 Z M50 52 Q70 84 80 72 Q84 58 50 52 Z" ${st(C.pink, C.pinkDeep)}/>
      <circle cx="30" cy="34" r="5" fill="${C.yellow}"/><circle cx="70" cy="34" r="5" fill="${C.yellow}"/><rect x="47" y="34" width="6" height="36" rx="3" fill="${INK}"/><path d="M48 34 q-6 -12 -10 -14 M52 34 q6 -12 10 -14" ${line(INK, 2)}/>`,
    ladybug: () => `<circle cx="50" cy="28" r="12" fill="${INK}"/><path d="M44 18 q-6 -10 -12 -10 M56 18 q6 -10 12 -10" ${line(INK, 2)}/>
      <circle cx="50" cy="58" r="30" ${st('#ff7a7a', '#c4414c')}/><path d="M50 30 V88" ${line(INK, 3)}/>
      <circle cx="36" cy="48" r="5" fill="${INK}"/><circle cx="64" cy="48" r="5" fill="${INK}"/><circle cx="34" cy="68" r="5" fill="${INK}"/><circle cx="66" cy="68" r="5" fill="${INK}"/>${eye(45, 27, 1.6).replace(INK, '#fff')}${eye(55, 27, 1.6).replace(INK, '#fff')}`,
    dinosaur: () => `<path d="M10 80 Q18 60 34 58 Q40 36 56 30 Q60 14 74 14 Q90 14 90 28 Q90 38 76 38 L70 40 Q72 60 66 72 L68 88 L58 88 L58 76 L42 76 L42 88 L32 88 L32 76 Q20 80 10 80 Z" ${st(C.mint, C.mintDeep)}/>
      ${eye(78, 24)}<path d="M80 32 h6" ${line(INK, 2)}/><path d="M48 34 l-2 -8 l6 4 M40 42 l-4 -7 l7 3 M36 52 l-6 -5 l8 1" ${st(C.yellow, C.yellowDeep, 1.8)}/>${blush(72, 30)}`,
    snail: () => `${blob(['path d="M10 82 Q10 70 26 70 H72 Q84 70 86 56 Q88 46 80 44 Q72 44 72 56 V70"', 'rect x="10" y="70" width="80" height="14" rx="7"'], '#f8e3c4', C.brownDeep)}
      <path d="M76 46 L72 28 M84 46 L90 28" ${line(C.brownDeep, 2.5)}/><circle cx="72" cy="27" r="3.4" fill="${INK}"/><circle cx="90" cy="27" r="3.4" fill="${INK}"/>
      ${eye(78, 54, 2.4)}<path d="M80 62 q3 2 6 -1" ${line(INK, 2)}/>${blush(84, 58)}
      <circle cx="42" cy="50" r="26" ${st(C.lilac, C.lilacDeep)}/>
      <path d="M42 50 m-3 0 a3 3 0 0 1 6 0 a6 6 0 0 1 -12 0 a10 10 0 0 1 20 0 a14 14 0 0 1 -28 0 a18 18 0 0 1 36 0" ${line(C.lilacDeep, 3)}/>
      <path d="M24 34 q6 -8 14 -10" ${line(W, 3)}/>`,
  });

  /* ---------- food ---------- */
  Object.assign(PICS, {
    egg: () => `<path d="M50 12 C30 12 22 46 22 60 C22 78 34 90 50 90 C66 90 78 78 78 60 C78 46 70 12 50 12 Z" ${st(W, C.yellowDeep)}/>${smile(50, 60)}${blush(38, 66)}${blush(62, 66)}`,
    milk: () => `<path d="M32 30 L40 14 H60 L68 30 V88 H32 Z" ${st(W, C.skyDeep)}/><path d="M32 30 H68" ${line(C.skyDeep, 3)}/><rect x="38" y="44" width="24" height="26" rx="4" ${st(C.sky, C.skyDeep, 2)}/>
      <path d="M44 54 q6 -8 12 0" ${line(W, 2.5)}/><circle cx="46" cy="62" r="2" fill="${W}"/><circle cx="54" cy="62" r="2" fill="${W}"/>`,
    bread: () => `<path d="M14 48 Q14 22 50 22 Q86 22 86 48 Q86 56 78 56 V84 H22 V56 Q14 56 14 48 Z" ${st('#f3c98b', C.peachDeep)}/><path d="M22 56 V84 H78 V56" fill="#fde8c4"/><path d="M30 40 q8 -6 14 0 M54 38 q8 -6 14 0" ${line(C.peachDeep, 2.5)}/>${smile(50, 68)}`,
    banana: () => `<path d="M20 30 Q24 74 72 82 Q86 84 88 74 Q50 76 34 30 Z" ${st(C.yellow, C.yellowDeep)}/><path d="M20 30 l-4 -8 l8 0 Z" ${st(C.brown, C.brownDeep, 2)}/><path d="M30 44 Q40 68 68 76" ${line(C.yellowDeep, 2)}/>`,
    carrot: () => `<path d="M30 30 Q24 36 32 44 L74 90 Q80 92 78 84 L40 32 Q36 26 30 30 Z" ${st(C.peach, C.peachDeep)}/><path d="M48 50 l6 -2 M58 62 l6 -2 M66 74 l5 -2" ${line(C.peachDeep, 2.5)}/>
      <path d="M32 30 Q20 14 12 18 Q20 22 28 32 M34 28 Q30 10 38 6 Q38 18 38 28 M36 30 Q48 18 56 22 Q46 26 40 34" ${st(C.mint, C.mintDeep, 2.5)}/>`,
    cup: () => `<path d="M38 26 q-6 -8 0 -14 M52 26 q-6 -8 0 -14 M66 26 q-6 -8 0 -14" ${line('#c9b9cf', 3)}/>
      <path d="M72 44 Q92 44 92 58 Q92 74 70 74" ${line(C.pinkDeep, 9)}/><path d="M72 44 Q92 44 92 58 Q92 74 70 74" ${line(C.pink, 4)}/>
      <path d="M18 32 H76 V68 Q76 88 56 88 H38 Q18 88 18 68 Z" ${st(W, C.pinkDeep)}/><path d="M18 40 H76" ${line(C.pink, 5)}/>
      <path d="M47 76 C36 68 34 60 39 56 C43 53 46 55 47 58 C48 55 51 53 55 56 C60 60 58 68 47 76 Z" fill="${C.pink}"/>
      <ellipse cx="47" cy="96" rx="34" ry="3" fill="#e8dccb"/>`,
    cookie: () => `<circle cx="50" cy="52" r="34" ${st('#e9b878', C.brownDeep)}/><circle cx="38" cy="40" r="4" fill="${C.brownDeep}"/><circle cx="60" cy="36" r="3.5" fill="${C.brownDeep}"/>
      <circle cx="64" cy="58" r="4" fill="${C.brownDeep}"/><circle cx="40" cy="66" r="3.5" fill="${C.brownDeep}"/><circle cx="50" cy="52" r="3" fill="${C.brownDeep}"/><path d="M80 34 l8 -4 l-2 8 Z" ${st('#e9b878', C.brownDeep, 2)}/>`,
    dish: () => `<path d="M8 22 V44 M4 22 V34 Q8 40 12 34 V22" ${line('#8aa0b2', 3)}/><path d="M8 44 V80" ${line('#8aa0b2', 4)}/>
      <ellipse cx="92" cy="30" rx="5" ry="9" ${st('#c9d3de', '#8aa0b2', 2.5)}/><path d="M92 39 V80" ${line('#8aa0b2', 4)}/>
      <circle cx="50" cy="54" r="36" ${st(W, C.skyDeep)}/><circle cx="50" cy="54" r="28" ${line('#cfe4f5', 3)}/>
      ${blob(['circle cx="42" cy="50" r="12"', 'circle cx="34" cy="58" r="9"', 'circle cx="52" cy="58" r="9"'], W, '#e4d6c2', 1.5)}<circle cx="42" cy="54" r="7" ${st(C.yellow, C.yellowDeep, 2)}/>
      <path d="M58 64 q12 -10 14 2 q-4 8 -14 -2 Z" ${st('#ff9a8c', '#c4514c', 2)}/>
      ${blob(['circle cx="64" cy="40" r="5"', 'circle cx="70" cy="44" r="5"', 'circle cx="60" cy="46" r="5"'], C.mint, C.mintDeep, 1.5)}<path d="M64 48 v6" ${line(C.mintDeep, 3)}/>`,
  });

  /* ---------- home and things ---------- */
  Object.assign(PICS, {
    chair: () => `<path d="M30 12 H70 V52 H30 Z" ${st(C.peach, C.peachDeep)}/><path d="M24 52 H76 V62 H24 Z" ${st(C.peach, C.peachDeep)}/><path d="M30 62 V92 M70 62 V92 M30 30 H70" ${line(C.peachDeep, 4)}/>`,
    bed: () => `<path d="M8 82 V36 M92 82 V54" ${line(C.brownDeep, 5)}/><rect x="8" y="54" width="84" height="20" rx="4" ${st(C.sky, C.skyDeep)}/><rect x="14" y="44" width="22" height="12" rx="6" ${st(W, C.skyDeep)}/>
      <path d="M36 56 Q60 44 92 56" ${st(C.lilac, C.lilacDeep)}/><text x="58" y="34" font-family="Fredoka, sans-serif" font-size="14" font-weight="600" fill="${C.skyDeep}">z</text><text x="70" y="24" font-family="Fredoka, sans-serif" font-size="10" font-weight="600" fill="${C.skyDeep}">z</text>`,
    desk: () => `<rect x="8" y="44" width="84" height="10" rx="3" ${st(C.peach, C.peachDeep)}/><path d="M14 54 V90 M86 54 V90" ${line(C.peachDeep, 5)}/><rect x="56" y="54" width="26" height="20" ${st('#ffd9b5', C.peachDeep, 2.5)}/>
      <path d="M66 64 h6" ${line(C.peachDeep, 3)}/><rect x="20" y="30" width="22" height="14" rx="2" ${st(C.sky, C.skyDeep, 2.5)}/><path d="M62 44 l-4 -22 l6 0 Z" ${st(C.yellow, C.yellowDeep, 2)}/>`,
    door: () => `<rect x="24" y="8" width="52" height="84" rx="6" ${st(C.peach, C.peachDeep)}/><rect x="32" y="16" width="36" height="28" rx="4" ${st('#ffd9b5', C.peachDeep, 2.5)}/>
      <rect x="32" y="52" width="36" height="30" rx="4" ${st('#ffd9b5', C.peachDeep, 2.5)}/><circle cx="66" cy="50" r="3.5" fill="${C.yellowDeep}"/>`,
    window: () => `<rect x="14" y="12" width="72" height="72" rx="6" ${st(C.sky, C.peachDeep)}/><path d="M50 12 V84 M14 48 H86" ${line(C.peachDeep, 4)}/>
      <path d="M22 22 l10 -2 M58 22 l10 -2" ${line('#ffffff', 3)}/><path d="M8 84 H92" ${line(C.peachDeep, 6)}/><circle cx="72" cy="66" r="8" ${st(C.yellow, C.yellowDeep, 2)}/>`,
    frame: () => `<rect x="12" y="16" width="76" height="66" rx="4" ${st('#f3c98b', C.peachDeep, 4)}/><rect x="22" y="26" width="56" height="46" fill="${C.sky}"/>
      <path d="M22 72 L40 48 L52 62 L60 54 L78 72 Z" ${st(C.mint, C.mintDeep, 2)}/><circle cx="64" cy="38" r="5" fill="${C.yellow}"/><path d="M50 6 L38 16 M50 6 L62 16" ${line(C.peachDeep, 2)}/>`,
    pot: () => `<path d="M18 40 H82 V70 Q82 86 66 86 H34 Q18 86 18 70 Z" ${st('#c9d3de', '#7d8fa3')}/><path d="M18 46 H8 M82 46 H92" ${line('#7d8fa3', 5)}/><rect x="16" y="34" width="68" height="8" rx="4" ${st('#dbe3ec', '#7d8fa3')}/>
      <path d="M36 26 q-4 -8 2 -14 M50 24 q-4 -8 2 -14 M64 26 q-4 -8 2 -14" ${line('#c9b9cf', 2.5)}/>`,
    umbrella: () => `<path d="M8 48 Q12 12 50 12 Q88 12 92 48 Q84 42 78 48 Q72 42 64 48 Q57 42 50 48 Q43 42 36 48 Q28 42 22 48 Q16 42 8 48 Z" ${st(C.lilac, C.lilacDeep)}/>
      <path d="M50 14 Q40 30 36 48 M50 14 Q60 30 64 48" ${line(C.lilacDeep, 2)}/><path d="M50 48 V82 Q50 90 42 90 Q36 90 36 84" ${line(INK, 4)}/>`,
    cap: () => `<path d="M18 62 Q18 26 50 26 Q82 26 82 62 Z" ${st(C.sky, C.skyDeep)}/><path d="M50 62 Q74 60 96 70 Q78 76 50 70 Z" ${st(C.sky, C.skyDeep)}/><circle cx="50" cy="26" r="4" ${st(C.yellow, C.yellowDeep, 2)}/>
      <path d="M50 30 V62 M32 34 Q34 48 34 62 M68 34 Q66 48 66 62" ${line(C.skyDeep, 2)}/>`,
    shoe: () => `<path d="M10 56 Q10 40 22 40 L40 40 Q46 54 62 56 L84 60 Q94 62 94 74 V80 H10 Z" ${st(C.pink, C.pinkDeep)}/><path d="M10 80 H94" ${line(C.pinkDeep, 6)}/>
      <path d="M40 46 l8 -2 M44 52 l8 -2 M50 56 l6 -2" ${line(W, 3)}/><circle cx="24" cy="54" r="3" fill="${W}"/>`,
    shirt: () => `<path d="M34 12 L14 24 L6 44 L22 50 L26 42 V88 H74 V42 L78 50 L94 44 L86 24 L66 12 Q58 22 50 22 Q42 22 34 12 Z" ${st(C.sky, C.skyDeep)}/>
      <path d="M40 16 L50 30 L60 16" ${line(C.skyDeep, 2.5)}/><circle cx="50" cy="42" r="2" fill="${C.skyDeep}"/><circle cx="50" cy="56" r="2" fill="${C.skyDeep}"/><path d="M34 40 h10 v8 h-10z" ${st(W, C.skyDeep, 2)}/>`,
    phone: () => `<rect x="28" y="8" width="44" height="84" rx="9" ${st(INK, INK)}/><rect x="33" y="17" width="34" height="62" rx="3" fill="${C.sky}"/>
      <circle cx="50" cy="86" r="3" fill="${C.lilac}"/><path d="M38 40 h14 l-4 6" ${st(W, W, 2)}/><path d="M62 54 h-14 l4 6" ${st(C.pink, C.pink, 2)}/><rect x="40" y="26" width="20" height="8" rx="4" fill="${W}"/>`,
    camera: () => `<rect x="10" y="30" width="80" height="54" rx="10" ${st(C.lilac, C.lilacDeep)}/><path d="M34 30 L40 18 H60 L66 30" ${st(C.lilac, C.lilacDeep)}/>
      <circle cx="50" cy="57" r="17" ${st(W, C.lilacDeep)}/><circle cx="50" cy="57" r="9" fill="${INK}"/><circle cx="46" cy="53" r="3" fill="${W}"/><rect x="72" y="38" width="10" height="6" rx="2" fill="${C.yellow}"/>`,
    ticket: () => `<path d="M8 32 H92 V44 Q84 44 84 50 Q84 56 92 56 V68 H8 V56 Q16 56 16 50 Q16 44 8 44 Z" ${st(C.yellow, C.yellowDeep)}/><path d="M66 32 V68" stroke="${C.yellowDeep}" stroke-width="2.5" stroke-dasharray="4 4"/>
      ${star5(38, 50, 9, C.pink, C.pinkDeep)}<path d="M74 44 h8 M74 50 h8 M74 56 h8" ${line(C.yellowDeep, 2)}/>`,
    teddy: () => `<circle cx="30" cy="22" r="9" ${st('#e9b878', C.brownDeep)}/><circle cx="70" cy="22" r="9" ${st('#e9b878', C.brownDeep)}/><circle cx="50" cy="34" r="22" ${st('#e9b878', C.brownDeep)}/>
      <ellipse cx="50" cy="72" rx="24" ry="22" ${st('#e9b878', C.brownDeep)}/><ellipse cx="50" cy="74" rx="12" ry="12" fill="#f6dcb3"/>${eye(42, 30, 2.6)}${eye(58, 30, 2.6)}<ellipse cx="50" cy="40" rx="4" ry="3" fill="${INK}"/>
      <path d="M40 54 l8 6 l-8 4 Z M60 54 l-8 6 l8 4 Z" fill="${C.pink}"/><circle cx="50" cy="59" r="3" fill="${C.pink}"/>`,
    puzzle: () => `<path d="M14 26 H40 Q38 14 48 14 Q58 14 56 26 H82 V50 Q94 48 94 58 Q94 68 82 66 V88 H56 Q58 76 48 76 Q38 76 40 88 H14 V66 Q26 68 26 58 Q26 48 14 50 Z" ${st(C.mint, C.mintDeep)}/>`,
    wand: () => `<path d="M18 86 L60 44" ${line(INK, 7)}/><path d="M18 86 L28 76" ${line(W, 7)}/>${star5(66, 36, 18, C.yellow, C.yellowDeep)}${sparkle(30, 30, C.yellow)}${sparkle(84, 74, C.pink)}`,
    medal: () => `<path d="M34 8 L44 40 M66 8 L56 40" ${line(C.sky, 9)}/><circle cx="50" cy="62" r="24" ${st(C.yellow, C.yellowDeep)}/>${star5(50, 62, 12, W, C.yellowDeep)}`,
    scissors: () => `<circle cx="28" cy="72" r="12" ${st(W, C.pinkDeep, 4)}/><circle cx="72" cy="72" r="12" ${st(W, C.pinkDeep, 4)}/><path d="M36 62 L70 12 M64 62 L30 12" ${line('#8aa0b2', 6)}/><circle cx="50" cy="38" r="3" fill="${INK}"/>`,
    lamp: () => `<path d="M30 48 L40 14 H60 L70 48 Z" ${st(C.yellow, C.yellowDeep)}/><path d="M50 48 V82 M34 86 H66" ${line(INK, 5)}/><path d="M24 58 l-8 4 M76 58 l8 4 M50 56 v4" ${line(C.yellowDeep, 3)}/>`,
    box: () => `<path d="M14 36 L50 22 L86 36 V76 L50 90 L14 76 Z" ${st('#e9c9a0', C.brownDeep)}/><path d="M14 36 L50 50 L86 36 M50 50 V90" ${line(C.brownDeep, 3)}/><path d="M30 29 L66 43" ${line('#c8a274', 4)}/>`,
  });

  /* ---------- going places ---------- */
  Object.assign(PICS, {
    car: () => `<path d="M8 70 V56 Q8 48 18 46 L28 30 Q32 24 40 24 H62 Q70 24 74 30 L84 46 Q92 48 92 56 V70 Z" ${st(C.pink, C.pinkDeep)}/><path d="M32 46 L38 32 H50 V46 Z M56 46 V32 H64 L70 46 Z" ${st(C.sky, C.skyDeep, 2.5)}/>
      <circle cx="28" cy="72" r="10" ${st(INK, INK)}/><circle cx="72" cy="72" r="10" ${st(INK, INK)}/><circle cx="28" cy="72" r="4" fill="#c9d3de"/><circle cx="72" cy="72" r="4" fill="#c9d3de"/><rect x="84" y="54" width="8" height="5" rx="2" fill="${C.yellow}"/>`,
    bus: () => `<rect x="10" y="18" width="80" height="58" rx="10" ${st(C.yellow, C.yellowDeep)}/><rect x="18" y="28" width="18" height="18" rx="3" ${st(C.sky, C.skyDeep, 2)}/><rect x="41" y="28" width="18" height="18" rx="3" ${st(C.sky, C.skyDeep, 2)}/>
      <rect x="64" y="28" width="18" height="18" rx="3" ${st(C.sky, C.skyDeep, 2)}/><path d="M10 56 H90" ${line(C.yellowDeep, 3)}/><circle cx="28" cy="78" r="9" fill="${INK}"/><circle cx="72" cy="78" r="9" fill="${INK}"/><circle cx="84" cy="64" r="3" fill="${W}"/>`,
    bike: () => `<circle cx="24" cy="66" r="16" ${line(INK, 4)}/><circle cx="76" cy="66" r="16" ${line(INK, 4)}/><path d="M24 66 L42 40 H66 L76 66 M42 40 L52 66 L66 40 M52 66 H40" ${line(C.mintDeep, 4)}/>
      <path d="M38 34 H48 M66 40 L62 28 H72" ${line(INK, 4)}/>`,
    train: () => `<rect x="14" y="20" width="56" height="54" rx="8" ${st(C.mint, C.mintDeep)}/><rect x="22" y="28" width="18" height="16" rx="3" ${st(C.sky, C.skyDeep, 2)}/><rect x="70" y="40" width="20" height="34" rx="4" ${st(C.mint, C.mintDeep)}/>
      <rect x="74" y="26" width="10" height="14" ${st(INK, INK, 2)}/><circle cx="30" cy="78" r="9" fill="${INK}"/><circle cx="58" cy="78" r="9" fill="${INK}"/><circle cx="82" cy="78" r="7" fill="${INK}"/><path d="M80 18 q4 -8 12 -6" ${line('#c9b9cf', 4)}/>`,
    boat: () => `<path d="M10 62 H90 L78 84 H22 Z" ${st(C.pink, C.pinkDeep)}/><path d="M50 62 V10" ${line(INK, 3)}/><path d="M52 12 L82 56 H52 Z" ${st(W, C.skyDeep)}/><path d="M48 20 L24 56 H48 Z" ${st(C.yellow, C.yellowDeep)}/>
      <path d="M4 90 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" ${line(C.skyDeep, 3)}/>`,
    suitcase: () => `<rect x="14" y="30" width="72" height="56" rx="8" ${st(C.peach, C.peachDeep)}/><path d="M38 30 V20 Q38 14 44 14 H56 Q62 14 62 20 V30" ${line(C.peachDeep, 4)}/>
      <path d="M32 30 V86 M68 30 V86" ${line(C.peachDeep, 3)}/><circle cx="24" cy="44" r="5" fill="${C.sky}"/>${star5(76, 72, 6, C.yellow, C.yellowDeep)}`,
    satellite: () => `<rect x="38" y="38" width="24" height="24" rx="4" transform="rotate(45 50 50)" ${st('#dbe3ec', '#7d8fa3')}/><path d="M22 22 L34 34 M66 66 L78 78" ${line('#7d8fa3', 3)}/>
      <rect x="4" y="10" width="26" height="14" transform="rotate(45 17 17)" ${st(C.sky, C.skyDeep, 2)}/><rect x="70" y="76" width="26" height="14" transform="rotate(45 83 83)" ${st(C.sky, C.skyDeep, 2)}/>
      <path d="M62 30 q8 -2 10 -10 M68 36 q14 -4 18 -18" ${line(C.yellowDeep, 2.5)}/>`,
    planet: () => `<circle cx="50" cy="50" r="24" ${st(C.peach, C.peachDeep)}/><path d="M28 42 q22 6 44 0 M30 58 q20 6 40 0" ${line('#f7a86a', 3)}/>
      <ellipse cx="50" cy="52" rx="44" ry="12" transform="rotate(-14 50 52)" ${line(C.lilacDeep, 3.5)}/>${star5(14, 18, 5, C.yellow, C.yellowDeep)}${star5(86, 84, 4, C.yellow, C.yellowDeep)}`,
    helmet: () => `<path d="M50 14 V4" ${line(INK, 3)}/><circle cx="50" cy="4" r="3.5" fill="${C.pink}"/>
      <path d="M12 56 Q12 14 50 14 Q88 14 88 56 Q88 92 50 92 Q12 92 12 56 Z" ${st(W, '#8aa0b2')}/>
      <rect x="22" y="34" width="56" height="38" rx="18" ${st('#3d4a6b', '#2c3550')}/><path d="M30 44 q6 -6 14 -6" ${line('#9fc4ff', 4)}/>
      ${star5(62, 58, 6, C.yellow, C.yellowDeep)}<circle cx="44" cy="62" r="1.8" fill="${W}"/><circle cx="70" cy="44" r="1.4" fill="${W}"/>
      <rect x="6" y="48" width="8" height="18" rx="3" ${st(C.sky, C.skyDeep, 2)}/><rect x="86" y="48" width="8" height="18" rx="3" ${st(C.sky, C.skyDeep, 2)}/>`,
    signpost: () => `<path d="M50 14 V92" ${line(C.brownDeep, 5)}/><path d="M50 22 H84 L92 30 L84 38 H50 Z" ${st(C.mint, C.mintDeep)}/><path d="M50 46 H16 L8 54 L16 62 H50 Z" ${st(C.sky, C.skyDeep)}/>
      <path d="M36 92 H64" ${line(C.brownDeep, 5)}/>`,
    compass: () => `<circle cx="50" cy="50" r="38" ${st(W, C.peachDeep, 4)}/><path d="M50 18 L58 50 L50 82 L42 50 Z" ${st(C.pink, C.pinkDeep, 2)}/><path d="M50 50 L58 50 L50 82 L42 50 Z" fill="#c9d3de"/>
      <circle cx="50" cy="50" r="4" fill="${INK}"/><text x="45" y="16" font-family="Fredoka, sans-serif" font-size="11" font-weight="600" fill="${C.peachDeep}">N</text>`,
    flag: () => `<path d="M22 92 V10" ${line(INK, 5)}/><path d="M24 12 Q44 4 56 14 Q70 24 86 14 V50 Q70 60 56 50 Q44 40 24 48 Z" ${st(C.pink, C.pinkDeep)}/>${star5(52, 30, 8, C.yellow, C.yellowDeep)}`,
  });

  /* ---------- places ---------- */
  Object.assign(PICS, {
    hospital: () => `<rect x="14" y="26" width="72" height="64" rx="4" ${st(W, C.skyDeep)}/><rect x="40" y="10" width="20" height="20" rx="3" ${st(W, C.skyDeep)}/><path d="M50 14 v12 M44 20 h12" ${line('#e04a66', 4)}/>
      ${[24, 44, 64].map((x) => `<rect x="${x}" y="38" width="12" height="12" rx="2" ${st(C.sky, C.skyDeep, 2)}/>`).join('')}<rect x="40" y="62" width="20" height="28" rx="3" ${st(C.mint, C.mintDeep, 2)}/>`,
    castle: () => `<path d="M14 90 V40 H22 V32 H30 V40 H38 V32 H46 V40 H54 V32 H62 V40 H70 V32 H78 V40 H86 V90 Z" ${st('#e3d6f0', C.lilacDeep)}/><path d="M42 90 V70 Q50 60 58 70 V90" ${st(C.peach, C.peachDeep)}/>
      <path d="M50 32 V8 L64 14 L50 20" ${st(C.pink, C.pinkDeep, 2)}/><rect x="22" y="52" width="10" height="12" rx="5" fill="${C.sky}"/><rect x="68" y="52" width="10" height="12" rx="5" fill="${C.sky}"/>`,
    city: () => `<rect x="8" y="40" width="24" height="52" ${st(C.sky, C.skyDeep)}/><rect x="36" y="14" width="28" height="78" ${st(C.lilac, C.lilacDeep)}/><rect x="68" y="30" width="24" height="62" ${st(C.peach, C.peachDeep)}/>
      ${[[14, 48], [22, 48], [14, 62], [22, 62], [42, 24], [52, 24], [42, 40], [52, 40], [42, 56], [52, 56], [74, 40], [82, 40], [74, 56], [82, 56]].map(([x, y]) => `<rect x="${x}" y="${y}" width="5" height="7" fill="${W}"/>`).join('')}`,
    barn: () => `<path d="M14 50 L50 22 L86 50 V90 H14 Z" ${st('#ff9a8c', '#c4514c')}/><path d="M38 90 V62 H62 V90 M38 62 L62 90 M62 62 L38 90" ${line(W, 3)}/><circle cx="50" cy="44" r="6" ${st(W, '#c4514c', 2)}/>
      <path d="M2 90 H98" ${line(C.mintDeep, 4)}/>`,
    park: () => `<circle cx="70" cy="34" r="20" ${st(C.mint, C.mintDeep)}/><path d="M70 54 V80" ${line(C.brownDeep, 5)}/><path d="M10 64 H54 M10 72 H54 M14 64 V84 M50 64 V84 M10 56 H54" ${line(C.peachDeep, 4)}/>
      <path d="M2 86 H98" ${line(C.mintDeep, 4)}/><circle cx="24" cy="24" r="8" ${st(C.yellow, C.yellowDeep, 2)}/>`,
    tent: () => `<path d="M8 86 L50 16 L92 86 Z" ${st(C.mint, C.mintDeep)}/><path d="M50 16 L36 86 H64 Z" ${st('#cdeec9', C.mintDeep)}/><path d="M50 16 V8 L58 12" ${line(INK, 2.5)}/><path d="M2 88 H98" ${line(C.brownDeep, 3)}/>`,
    bridge: () => `<path d="M4 50 Q50 10 96 50" ${line(C.pinkDeep, 5)}/><path d="M4 56 H96" ${line(C.peachDeep, 6)}/><path d="M20 38 V56 M35 28 V56 M50 25 V56 M65 28 V56 M80 38 V56" ${line(C.pinkDeep, 2.5)}/>
      <path d="M4 76 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" ${line(C.skyDeep, 3)}/><path d="M16 56 V88 M84 56 V88" ${line(C.peachDeep, 5)}/>`,
    river: () => `<path d="M30 8 Q10 30 40 46 Q72 62 46 92 H70 Q92 62 64 42 Q40 28 54 8 Z" ${st(C.sky, C.skyDeep)}/><path d="M44 26 q4 4 8 0 M56 58 q4 4 8 0" ${line(W, 2.5)}/>
      <circle cx="16" cy="70" r="10" ${st(C.mint, C.mintDeep)}/><circle cx="86" cy="20" r="9" ${st(C.mint, C.mintDeep)}/>`,
    volcano: () => `<path d="M6 90 L36 30 H64 L94 90 Z" ${st(C.brown, C.brownDeep)}/><path d="M36 30 Q42 44 50 36 Q58 46 64 30 Z" ${st('#ff7a5c', '#c4414c', 2)}/>
      <path d="M44 24 q-6 -10 0 -18 M56 24 q6 -10 0 -18" ${line('#c9b9cf', 4)}/><circle cx="50" cy="12" r="5" fill="#ff7a5c"/>`,
    quake: () => `<path d="M6 60 H94 V92 H6 Z" ${st(C.brown, C.brownDeep)}/><path d="M50 60 L42 70 L54 76 L44 92" ${line(INK, 3)}/><path d="M24 40 q-6 -6 0 -12 M76 40 q6 -6 0 -12 M14 50 q-6 -6 0 -12 M86 50 q6 -6 0 -12" ${line(C.peachDeep, 3)}/>
      <rect x="38" y="30" width="24" height="30" rx="2" transform="rotate(-8 50 45)" ${st(C.sky, C.skyDeep, 2.5)}/>`,
  });

  /* ---------- science and nature ---------- */
  Object.assign(PICS, {
    flask: () => `<path d="M40 10 H60 M43 10 V38 L18 82 Q14 90 24 90 H76 Q86 90 82 82 L57 38 V10" ${st(W, C.lilacDeep)}/><path d="M28 66 H72 L80 82 Q82 86 76 86 H24 Q18 86 20 82 Z" fill="${C.mint}"/>
      <circle cx="40" cy="76" r="4" fill="${W}"/><circle cx="56" cy="72" r="3" fill="${W}"/><circle cx="66" cy="48" r="3" ${line(C.mintDeep, 2)}/><circle cx="72" cy="34" r="4" ${line(C.mintDeep, 2)}/>`,
    gear: () => `<g transform="translate(50 50)">${Array.from({ length: 8 }, (_, i) => `<rect x="-6" y="-40" width="12" height="16" rx="2" transform="rotate(${i * 45})" ${st('#c9d3de', '#7d8fa3', 2.5)}/>`).join('')}
      <circle r="28" ${st('#dbe3ec', '#7d8fa3')}/><circle r="10" ${st(W, '#7d8fa3')}/></g>`,
    magnet: () => `<path d="M20 14 V54 A30 30 0 0 0 80 54 V14 H60 V54 A10 10 0 0 1 40 54 V14 Z" ${st('#ff7a7a', '#c4414c')}/><path d="M20 14 H40 V28 H20 Z M60 14 H80 V28 H60 Z" ${st('#dbe3ec', '#7d8fa3', 2)}/>
      <path d="M12 6 l-6 -2 M50 92 v6 M88 6 l6 -2" ${line(C.yellowDeep, 2.5)}/>`,
    battery: () => `<rect x="8" y="30" width="76" height="40" rx="8" ${st(W, INK)}/><rect x="84" y="42" width="8" height="16" rx="2" fill="${INK}"/><rect x="14" y="36" width="20" height="28" rx="4" fill="#ff7a7a"/>`,
    lightning: () => `<path d="M58 6 L22 56 H46 L36 94 L80 38 H54 Z" ${st(C.yellow, C.yellowDeep)}/>`,
    thermometer: () => `<rect x="40" y="8" width="20" height="62" rx="10" ${st(W, C.pinkDeep)}/><circle cx="50" cy="76" r="15" ${st('#ff7a7a', '#c4414c')}/><rect x="46" y="30" width="8" height="44" fill="#ff7a7a"/>
      <path d="M62 20 h8 M62 32 h8 M62 44 h8 M62 56 h8" ${line(C.pinkDeep, 2.5)}/>`,
    pill: () => `<g transform="rotate(-40 50 50)"><rect x="18" y="34" width="64" height="32" rx="16" ${st(W, C.skyDeep)}/><path d="M50 34 H66 A16 16 0 0 1 66 66 H50 Z" ${st(C.pink, C.pinkDeep)}/></g>
      <path d="M78 14 v12 M72 20 h12" ${line(C.mintDeep, 4)}/>`,
    stethoscope: () => `<path d="M26 10 V40 Q26 60 44 60 Q62 60 62 40 V10" ${line(INK, 4)}/><path d="M44 60 V74 Q44 88 60 88 Q74 88 74 74 V66" ${line(INK, 4)}/><circle cx="74" cy="60" r="9" ${st('#c9d3de', '#7d8fa3')}/>
      <circle cx="26" cy="10" r="4" fill="${C.pink}"/><circle cx="62" cy="10" r="4" fill="${C.pink}"/>`,
    fossil: () => `<ellipse cx="50" cy="52" rx="40" ry="34" ${st('#e9dcc6', C.brownDeep)}/><path d="M24 56 Q50 30 76 56" ${line(W, 6)}/><path d="M32 46 l-4 -6 M42 40 l-2 -7 M52 38 v-7 M62 40 l2 -7 M70 46 l4 -6" ${line(W, 4)}/>
      <circle cx="78" cy="58" r="5" fill="${W}"/>`,
    leaf: () => `<path d="M14 86 Q14 20 86 14 Q84 84 14 86 Z" ${st(C.mint, C.mintDeep)}/><path d="M14 86 Q46 52 70 30 M34 64 l-6 -14 M48 50 l-4 -16 M46 64 l16 2 M60 46 l16 2" ${line(C.mintDeep, 2.5)}/>`,
    sprout: () => `<path d="M24 70 H76 L70 92 H30 Z" ${st(C.peach, C.peachDeep)}/><path d="M50 70 V40" ${line(C.mintDeep, 4)}/><path d="M50 44 Q30 44 24 26 Q44 24 50 40 Z M50 40 Q56 18 80 18 Q76 40 50 44 Z" ${st(C.mint, C.mintDeep)}/>`,
    recycle: () => `<g transform="translate(50 52)">${[0, 120, 240].map((a) => `<g transform="rotate(${a})"><path d="M-14 -30 L14 -30 L24 -12" ${line(C.mintDeep, 7)}/><path d="M18 -18 L30 -8 L30 -24 Z" fill="${C.mintDeep}"/></g>`).join('')}</g>`,
    drop: () => `<path d="M50 8 Q20 46 20 62 A30 30 0 0 0 80 62 Q80 46 50 8 Z" ${st(C.sky, C.skyDeep)}/><path d="M34 60 q0 12 10 16" ${line(W, 4)}/>${smile(52, 60)}`,
    brain: () => `<path d="M50 18 Q34 10 26 22 Q12 24 14 40 Q6 52 16 62 Q14 78 32 80 Q42 92 50 82 Q58 92 68 80 Q86 78 84 62 Q94 52 86 40 Q88 24 74 22 Q66 10 50 18 Z" ${st('#ffc9d4', C.pinkDeep)}/>
      <path d="M50 18 V82 M30 36 q8 4 6 12 M70 36 q-8 4 -6 12 M28 62 q8 -4 12 2 M72 62 q-8 -4 -12 2" ${line(C.pinkDeep, 2.5)}/>`,
    eye: () => [[28, C.pink], [72, C.sky]].map(([x]) => `<path d="M${x - 19} 62 Q${x} 26 ${x + 19} 62" ${line(INK, 7)}/>
      <path d="M${x - 13} 46 l-6 -7 M${x} 39 v-10 M${x + 13} 46 l6 -7" ${line(INK, 3.5)}/><ellipse cx="${x}" cy="76" rx="9" ry="5" fill="${C.blush}" opacity=".85"/>`).join('')
      + `${sparkle(50, 20, C.yellow)}`,
    ear: () => `<path d="M64 88 Q52 92 48 80 Q46 70 38 62 Q24 48 30 30 Q38 10 60 12 Q82 16 80 40 Q78 56 70 64 Q66 70 68 80 Q68 86 64 88 Z" ${st('#f6c27a', '#b0743a')}/>
      <path d="M44 36 Q50 24 62 30 Q70 38 62 48 Q56 54 58 62" ${line('#b0743a', 3)}/><path d="M86 30 q6 10 0 20 M92 24 q10 16 0 32" ${line(C.skyDeep, 2.5)}/>`,
    feather: () => `<path d="M80 10 Q30 18 22 70 L18 90 L28 76 Q76 64 80 10 Z" ${st(W, C.lilacDeep)}/><path d="M18 90 Q50 50 78 14" ${line(C.lilacDeep, 2.5)}/>
      <path d="M38 50 l-10 -4 M48 40 l-10 -6 M58 30 l-8 -8" ${line(C.lilacDeep, 2)}/>`,
    crack: () => `<path d="M50 86 C22 66 10 50 14 34 C18 18 40 14 50 32 C60 14 82 18 86 34 C90 50 78 66 50 86 Z" ${st(C.pink, C.pinkDeep)}/><path d="M50 32 L44 46 L56 54 L46 66 L52 86" ${line(W, 4)}/>`,
    hourglass: () => `<path d="M24 10 H76 M24 90 H76" ${line(C.brownDeep, 5)}/><path d="M30 12 Q30 40 50 50 Q30 60 30 88 H70 Q70 60 50 50 Q70 40 70 12 Z" ${st('#eaf6ff', C.skyDeep)}/>
      <path d="M38 24 H62 Q60 38 50 44 Q40 38 38 24 Z M36 86 Q40 70 50 66 Q60 70 64 86 Z" fill="${C.yellow}"/><path d="M50 46 V66" ${line(C.yellowDeep, 2)}/>`,
    calendar: () => `<rect x="12" y="18" width="76" height="72" rx="8" ${st(W, C.pinkDeep)}/><path d="M12 38 H88" ${line(C.pinkDeep, 3)}/><path d="M12 26 Q12 18 20 18 H80 Q88 18 88 26 V38 H12 Z" fill="${C.pink}"/>
      <path d="M30 10 V26 M70 10 V26" ${line(INK, 4)}/>${[24, 40, 56, 72].map((x) => [50, 64, 78].map((y) => `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" rx="2" fill="${x === 56 && y === 64 ? C.yellowDeep : '#e8dccb'}"/>`).join('')).join('')}`,
    stopwatch: () => `<circle cx="50" cy="56" r="34" ${st(W, C.mintDeep, 4)}/><rect x="42" y="8" width="16" height="10" rx="3" fill="${C.mintDeep}"/><path d="M76 24 l6 -6" ${line(C.mintDeep, 5)}/>
      <path d="M50 56 L50 32 M50 56 L66 64" ${line(INK, 4)}/><path d="M50 56 L50 32 A24 24 0 0 1 72 46 Z" fill="${C.mint}" opacity=".7"/>`,
  });

  /* ---------- ideas drawn as things ---------- */
  Object.assign(PICS, {
    scale: () => `<path d="M50 14 V84 M30 88 H70" ${line(INK, 4)}/><path d="M14 30 H86" ${line(C.peachDeep, 4)}/><circle cx="50" cy="14" r="5" fill="${C.yellow}"/>
      <path d="M14 30 L4 58 H24 Z M86 30 L76 58 H96 Z" ${line('#8aa0b2', 2)}/><path d="M2 58 Q14 70 26 58 Z M74 58 Q86 70 98 58 Z" ${st(C.yellow, C.yellowDeep, 2.5)}/>`,
    magnifier: () => `<circle cx="42" cy="42" r="28" ${st('#eaf6ff', C.peachDeep, 6)}/><path d="M62 62 L88 88" ${line(C.peachDeep, 10)}/><path d="M28 32 q6 -10 16 -10" ${line(W, 4)}/>`,
    shield: () => `<path d="M50 8 L86 20 V48 Q86 76 50 92 Q14 76 14 48 V20 Z" ${st(C.sky, C.skyDeep)}/><path d="M50 18 L76 27 V48 Q76 68 50 81 Z" fill="#c4e2f8"/>${star5(50, 50, 13, C.yellow, C.yellowDeep)}`,
    chartup: () => `<path d="M12 88 H90 M12 88 V12" ${line(INK, 3)}/><rect x="20" y="62" width="14" height="26" ${st(C.sky, C.skyDeep, 2)}/><rect x="40" y="48" width="14" height="40" ${st(C.mint, C.mintDeep, 2)}/>
      <rect x="60" y="30" width="14" height="58" ${st(C.yellow, C.yellowDeep, 2)}/><path d="M22 52 L46 36 L58 42 L84 14" ${line('#e04a66', 4)}/><path d="M74 12 L86 12 L86 24" ${line('#e04a66', 4)}/>`,
    chartdown: () => `<path d="M12 88 H90 M12 88 V12" ${line(INK, 3)}/><rect x="20" y="30" width="14" height="58" ${st(C.yellow, C.yellowDeep, 2)}/><rect x="40" y="48" width="14" height="40" ${st(C.mint, C.mintDeep, 2)}/>
      <rect x="60" y="66" width="14" height="22" ${st(C.sky, C.skyDeep, 2)}/><path d="M22 18 L46 38 L58 34 L84 62" ${line('#5a7ad6', 4)}/><path d="M86 50 L86 64 L72 64" ${line('#5a7ad6', 4)}/>`,
    talk: () => `<path d="M8 16 H62 Q70 16 70 24 V48 Q70 56 62 56 H30 L18 68 L20 56 H16 Q8 56 8 48 V24 Q8 16 16 16 Z" ${st(C.sky, C.skyDeep)}/>
      <path d="M44 46 H84 Q92 46 92 54 V74 Q92 82 84 82 H80 L82 92 L70 82 H52 Q44 82 44 74 Z" ${st(C.pink, C.pinkDeep)}/><circle cx="26" cy="36" r="3" fill="${C.skyDeep}"/><circle cx="38" cy="36" r="3" fill="${C.skyDeep}"/><circle cx="50" cy="36" r="3" fill="${C.skyDeep}"/>`,
    lock: () => `<path d="M30 46 V32 Q30 12 50 12 Q70 12 70 32 V46" ${line('#8aa0b2', 7)}/><rect x="20" y="44" width="60" height="46" rx="8" ${st(C.yellow, C.yellowDeep)}/><circle cx="50" cy="62" r="6" fill="${INK}"/><path d="M50 64 V76" ${line(INK, 5)}/>`,
    target: () => `<circle cx="46" cy="54" r="38" ${st(W, '#e04a66')}/><circle cx="46" cy="54" r="26" ${st('#ff9fae', '#e04a66')}/><circle cx="46" cy="54" r="13" ${st(W, '#e04a66')}/><circle cx="46" cy="54" r="5" fill="#e04a66"/>
      <path d="M46 54 L88 12" ${line(INK, 3)}/><path d="M80 10 L92 8 L90 20" ${st(C.yellow, C.yellowDeep, 2)}/>`,
    ballot: () => `<rect x="14" y="44" width="72" height="46" rx="4" ${st(C.sky, C.skyDeep)}/><rect x="34" y="40" width="32" height="8" rx="2" fill="${INK}"/><rect x="38" y="10" width="24" height="34" rx="2" transform="rotate(8 50 27)" ${st(W, C.skyDeep, 2.5)}/>
      <path d="M44 26 l4 5 l9 -11" ${line(C.mintDeep, 3)}/><path d="M30 64 H70" ${line(W, 3)}/>`,
    chain: () => `<rect x="6" y="36" width="44" height="28" rx="14" ${line('#8aa0b2', 7)}/><rect x="50" y="36" width="44" height="28" rx="14" ${line(C.yellowDeep, 7)}/><path d="M38 50 H62" ${line(C.yellow, 7)}/>`,
    arrows: () => `<path d="M14 36 H74" ${line(C.mintDeep, 6)}/><path d="M66 24 L82 36 L66 48 Z" fill="${C.mintDeep}"/><path d="M86 66 H26" ${line(C.pinkDeep, 6)}/><path d="M34 54 L18 66 L34 78 Z" fill="${C.pinkDeep}"/>`,
    clash: () => `<path d="M8 30 L40 50 M92 30 L60 50" ${line(INK, 5)}/><path d="M30 22 L44 52 L34 54 Z M70 22 L56 52 L66 54 Z" ${st(C.sky, C.skyDeep, 2)}/>
      <path d="M50 52 L44 64 L50 62 L46 78 L58 58 L52 60 L56 52 Z" ${st(C.yellow, C.yellowDeep, 2)}/>${sparkle(24, 76, C.pink)}${sparkle(78, 78, C.pink)}`,
    confetti: () => `<path d="M14 88 L36 40 L60 64 Z" ${st(C.yellow, C.yellowDeep)}/><path d="M24 66 L44 74 M30 54 L52 66" ${line(C.pinkDeep, 3)}/>
      ${[[56, 20, C.pink], [72, 30, C.sky], [66, 46, C.mint], [84, 50, C.lilac], [46, 26, C.peach], [82, 16, C.yellow]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="8" height="5" rx="1.5" transform="rotate(${x} ${x} ${y})" fill="${c}"/>`).join('')}
      <path d="M56 36 q10 -10 18 0 q8 8 16 -2" ${line(C.lilacDeep, 2.5)}/>`,
    masks: () => `<path d="M10 20 H48 V44 Q48 66 29 66 Q10 66 10 44 Z" ${st(C.yellow, C.yellowDeep)}/><path d="M18 34 q4 -4 8 0 M32 34 q4 -4 8 0 M20 50 q9 8 18 0" ${line(INK, 2.5)}/>
      <path d="M52 34 H90 V58 Q90 80 71 80 Q52 80 52 58 Z" ${st(C.sky, C.skyDeep)}/><path d="M60 48 q4 4 8 0 M74 48 q4 4 8 0 M62 70 q9 -8 18 0" ${line(INK, 2.5)}/>`,
    microphone: () => `<rect x="36" y="8" width="28" height="46" rx="14" ${st('#c9d3de', '#7d8fa3')}/><path d="M42 18 h16 M42 28 h16 M42 38 h16" ${line('#7d8fa3', 2)}/>
      <path d="M26 42 Q26 70 50 70 Q74 70 74 42" ${line(INK, 4)}/><path d="M50 70 V88 M34 90 H66" ${line(INK, 5)}/>${sparkle(84, 20, C.yellow)}`,
    palette: () => `<path d="M50 10 Q90 10 90 46 Q90 66 72 64 Q60 62 62 74 Q64 90 46 90 Q10 88 10 50 Q10 10 50 10 Z" ${st('#f3d9b1', C.brownDeep)}/>
      <circle cx="32" cy="36" r="7" fill="${C.pink}"/><circle cx="52" cy="26" r="7" fill="${C.yellow}"/><circle cx="72" cy="36" r="7" fill="${C.sky}"/><circle cx="28" cy="58" r="7" fill="${C.mint}"/><circle cx="44" cy="74" r="6" fill="${C.lilac}"/>`,
    scroll: () => `<path d="M24 16 H80 V80 Q80 90 70 90 H20 Q12 90 12 82 Q12 74 20 74 H24 Z" ${st('#f6e7c8', C.brownDeep)}/><path d="M20 74 Q28 74 28 82 Q28 90 20 90" ${line(C.brownDeep, 3)}/>
      <path d="M24 16 Q16 16 16 24 Q16 30 24 30" ${line(C.brownDeep, 3)}/><path d="M34 34 H70 M34 46 H70 M34 58 H62" ${line('#c8a274', 3)}/>`,
    hammer: () => `<path d="M30 84 L64 34" ${line(C.brownDeep, 9)}/><path d="M30 84 L64 34" ${line('#c8935f', 4)}/>
      <g transform="rotate(34 64 32)"><rect x="40" y="22" width="48" height="20" rx="4" ${st('#c9d3de', '#7d8fa3')}/><rect x="40" y="22" width="10" height="20" rx="3" fill="#a9b6c4"/></g>${sparkle(82, 70, C.yellow)}`,
    wrench: () => `<path d="M30 70 L66 34" ${line('#8aa0b2', 11)}/><path d="M62 18 A18 18 0 1 0 82 38 L72 36 L66 30 L64 20 Z" ${st('#c9d3de', '#7d8fa3')}/><circle cx="28" cy="72" r="10" ${st('#c9d3de', '#7d8fa3')}/><circle cx="28" cy="72" r="4" fill="${W}"/>`,
    dumbbell: () => `<path d="M24 50 H76" ${line('#8aa0b2', 8)}/><rect x="10" y="28" width="14" height="44" rx="4" ${st(C.pink, C.pinkDeep)}/><rect x="76" y="28" width="14" height="44" rx="4" ${st(C.pink, C.pinkDeep)}/>
      <rect x="2" y="36" width="8" height="28" rx="3" ${st(C.pink, C.pinkDeep, 2)}/><rect x="90" y="36" width="8" height="28" rx="3" ${st(C.pink, C.pinkDeep, 2)}/>`,
    hearts: () => `<path d="M36 80 C14 64 6 50 10 38 C14 26 30 24 36 38 C42 24 58 26 62 38 C66 50 58 64 36 80 Z" ${st(C.pink, C.pinkDeep)}/>
      <path d="M66 62 C50 50 44 40 47 31 C50 22 62 21 66 31 C70 21 82 22 85 31 C88 40 82 50 66 62 Z" ${st('#ffd3da', C.pinkDeep)}/>`,
    sun_cloud: () => `<circle cx="34" cy="36" r="20" ${st(C.yellow, C.yellowDeep)}/><path d="M34 6 v6 M8 36 h6 M14 16 l5 5" ${line(C.yellowDeep, 3)}/>
      <path d="M34 80 C20 80 20 60 34 60 C34 46 54 42 60 54 C66 40 90 44 88 62 C100 62 100 80 88 80 Z" ${st(W, C.skyDeep)}/>`,
    bone: () => `<g transform="rotate(-30 50 50)">${blob(['rect x="22" y="42" width="56" height="16" rx="6"', 'circle cx="22" cy="40" r="11"', 'circle cx="22" cy="60" r="11"', 'circle cx="78" cy="40" r="11"', 'circle cx="78" cy="60" r="11"'], '#fffaf0', C.brownDeep)}
      <path d="M30 46 h30" ${line('#efe3cc', 3)}/></g>${sparkle(86, 18, C.yellow)}`,
    mirror: () => `<ellipse cx="50" cy="42" rx="28" ry="34" ${st(C.lilac, C.lilacDeep, 4)}/><ellipse cx="50" cy="42" rx="20" ry="26" fill="#eaf6ff"/><path d="M38 30 q4 -8 12 -10" ${line(W, 4)}/><path d="M50 76 V92 M38 92 H62" ${line(C.lilacDeep, 5)}/>`,
    rope: () => `<path d="M16 76 C10 40 46 26 66 36 C86 46 82 72 60 72 C42 72 42 52 58 50" ${line(C.brownDeep, 12)}/>
      <path d="M16 76 C10 40 46 26 66 36 C86 46 82 72 60 72 C42 72 42 52 58 50" stroke="#e9c48f" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M16 76 C10 40 46 26 66 36 C86 46 82 72 60 72 C42 72 42 52 58 50" stroke="#c99a5f" stroke-width="7" fill="none" stroke-dasharray="3 6"/>
      <path d="M58 50 l8 -4 M58 50 l9 1 M58 50 l6 6 M16 76 l-6 8 M16 76 l2 10 M16 76 l8 6" ${line(C.brownDeep, 2.5)}/>`,
    snowman: () => `<circle cx="50" cy="70" r="22" ${st(W, C.skyDeep)}/><circle cx="50" cy="34" r="16" ${st(W, C.skyDeep)}/>${eye(44, 31, 2)}${eye(56, 31, 2)}<path d="M50 36 l8 2 l-8 2 Z" fill="${C.peach}"/>
      <path d="M34 46 Q50 54 66 46" ${line('#e04a66', 5)}/><path d="M30 64 L12 52 M70 64 L88 52" ${line(C.brownDeep, 3)}/>`,
    robot: () => `<path d="M50 8 V18" ${line(INK, 3)}/><circle cx="50" cy="7" r="4" fill="${C.pink}"/><rect x="24" y="18" width="52" height="40" rx="10" ${st('#dbe3ec', '#7d8fa3')}/>
      <circle cx="38" cy="36" r="6" ${st(W, '#7d8fa3', 2)}/><circle cx="62" cy="36" r="6" ${st(W, '#7d8fa3', 2)}/><circle cx="38" cy="36" r="2.6" fill="${INK}"/><circle cx="62" cy="36" r="2.6" fill="${INK}"/>
      <rect x="40" y="46" width="20" height="5" rx="2.5" fill="${C.sky}"/><rect x="30" y="62" width="40" height="28" rx="6" ${st('#dbe3ec', '#7d8fa3')}/><circle cx="50" cy="76" r="5" fill="${C.yellow}"/>
      <path d="M30 70 H16 M70 70 H84" ${line('#7d8fa3', 5)}/><path d="M18 24 l-6 -2 M82 24 l6 -2" ${line(C.yellowDeep, 2)}/>`,
    statue: () => `<rect x="30" y="72" width="40" height="18" rx="2" ${st('#e8e1d6', '#a39886')}/><path d="M22 90 H78" ${line('#a39886', 4)}/>
      <path d="M36 72 Q36 52 50 50 Q64 52 64 72 Z" ${st('#e8e1d6', '#a39886')}/><circle cx="50" cy="34" r="16" ${st('#e8e1d6', '#a39886')}/><path d="M36 26 q14 -16 28 0" ${line('#a39886', 3)}/>
      <path d="M44 34 h3 M53 34 h3 M46 42 q4 3 8 0" ${line('#a39886', 2)}/>`,
    expand: () => `<rect x="34" y="34" width="32" height="32" rx="4" ${st(C.yellow, C.yellowDeep)}/>${[[0, 'M50 30 V8 M42 16 L50 8 L58 16'], [90, 'M50 30 V8 M42 16 L50 8 L58 16'], [180, 'M50 30 V8 M42 16 L50 8 L58 16'], [270, 'M50 30 V8 M42 16 L50 8 L58 16']].map(([a, d]) => `<path d="${d}" transform="rotate(${a} 50 50)" ${line(C.mintDeep, 4)}/>`).join('')}`,
    hurdle: () => `<path d="M18 90 V40 M82 90 V40" ${line(INK, 4)}/><rect x="14" y="36" width="72" height="12" rx="3" ${st(W, '#e04a66')}/><path d="M26 36 L34 48 M46 36 L54 48 M66 36 L74 48" ${line('#e04a66', 4)}/>
      <path d="M10 90 H90" ${line(C.mintDeep, 4)}/><path d="M28 24 q22 -22 44 0" stroke="${C.skyDeep}" stroke-width="3" fill="none" stroke-dasharray="4 5" stroke-linecap="round"/>`,
    check: () => `<circle cx="50" cy="50" r="38" ${st(C.mint, C.mintDeep)}/><path d="M30 52 L44 66 L72 36" ${line(W, 9)}/>`,
    trash: () => `<path d="M24 30 H76 L70 90 H30 Z" ${st(C.mint, C.mintDeep)}/><rect x="18" y="20" width="64" height="10" rx="4" ${st(C.mint, C.mintDeep)}/><path d="M42 20 V14 H58 V20" ${line(C.mintDeep, 3)}/>
      <path d="M40 42 V80 M50 42 V80 M60 42 V80" ${line(C.mintDeep, 3)}/>`,
    sparkles: () => `${star5(50, 50, 22, C.yellow, C.yellowDeep)}${sparkle(20, 22, C.pink)}${sparkle(82, 24, C.sky)}${sparkle(80, 80, C.lilac)}${sparkle(18, 78, C.mint)}`,
  });
})();
