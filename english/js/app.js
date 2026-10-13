/* 영단어 퀘스트: screens, the four quiz games, the effects, the review book and stickers.
   Every screen is plain page flow and every control is a real <button> handled on click,
   so where a button is drawn is where it can be pressed, upright or sideways. */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const fxLayer = document.getElementById('fx');
  const { LEVELS, WORDS, Art, Sound, Store } = window;
  const POS = { 명: '명사', 동: '동사', 형: '형용사', 부: '부사' };
  const QUIZ_LEN = 10;
  const SPEED_SEC = 60;
  const MODES = [
    { id: 'meaning', name: '뜻 고르기', sub: '영어 보고 뜻 찾기' },
    { id: 'spell', name: '철자 맞추기', sub: '뜻 보고 글자 놓기' },
    { id: 'listen', name: '듣고 쓰기', sub: '소리 듣고 쓰기' },
    { id: 'speed', name: '스피드 60초', sub: '60초 동안 많이!' },
  ];
  const VERSION = (document.querySelector('meta[name="version"]') || {}).content || 'dev';
  const DEBUG = window.VOCAB_DEBUG || /[?&#]debug/.test(location.search + location.hash);

  const byWord = new Map(WORDS.map((w) => [w.w, w]));
  const levelWords = (id) => WORDS.filter((w) => w.l === id);
  const levelOf = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0];

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = (n) => Math.floor(Math.random() * n);
  const one = (a) => a[rnd(a.length)];
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- icons ---------- */
  const SPK = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>';
  const I = {
    star: (s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z" fill="#ffe07a" stroke="#b8932a" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
    fire: (s = 26) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4 0-6 1-9Z" fill="#ffbe86" stroke="#c9723a" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
    play: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="#4f3f5c"/></svg>',
    spk: (s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true" fill="none" stroke="#4f3f5c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${SPK}</svg>`,
    mute: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="#6b5a78" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="#4f3f5c" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="#fff3c4" stroke="#b8932a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/><path d="M9.5 19h5M10.5 21.5h3"/></svg>',
    home: (on) => `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="${on ? '#ffe07a' : 'none'}" stroke="${on ? '#4f3f5c' : '#6b5a78'}" stroke-width="2.2" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>`,
    book: (on) => `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="${on ? '#cfe4f5' : 'none'}" stroke="${on ? '#4f3f5c' : '#6b5a78'}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 7h6M8 11h6"/></svg>`,
    sticker: (on) => `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="${on ? '#ffd3da' : 'none'}" stroke="${on ? '#4f3f5c' : '#6b5a78'}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><path d="M20 12.5A8.5 8.5 0 1 1 11.5 4H13a7 7 0 0 0 7 7z"/><path d="M13 4a7 7 0 0 0 7 7h-4.5A2.5 2.5 0 0 1 13 8.5z" fill="#fffdf7"/><path d="M8 14.5c1.6 1.6 4.4 1.6 6 0"/></svg>`,
  };

  /* ---------- timers that belong to the current screen ---------- */
  let timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  function stopTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    if (Q && Q.ticker) { clearInterval(Q.ticker); Q.ticker = null; }
  }

  let screen = 'home';
  let Q = null; // the quiz being played
  let lastStk = -1;

  function show(name) {
    stopTimers();
    closeSheet();
    screen = name;
    if (name === 'home') app.innerHTML = homeHTML();
    else if (name === 'review') app.innerHTML = reviewHTML();
    else if (name === 'stickers') app.innerHTML = stickersHTML();
    else if (name === 'quiz') startScreen();
    else if (name === 'result') resultScreen();
    window.scrollTo(0, 0);
    log('screen ' + name);
  }

  // Same screen again without jumping back to the top (picking a level lower down the page).
  function redrawHome() {
    const y = window.scrollY;
    app.innerHTML = homeHTML();
    window.scrollTo(0, y);
  }

  /* ---------- effects ---------- */
  function fx(cls, x, y, life = 1300, tag = 'div') {
    const e = document.createElement(tag);
    e.className = cls;
    e.style.left = x + 'px';
    e.style.top = y + 'px';
    fxLayer.appendChild(e);
    setTimeout(() => e.remove(), life);
    return e;
  }
  const SPARK = ['#ffe07a', '#ff9fae', '#a6e3a0', '#9dd2f6', '#d9aaf2', '#ffbe86'];
  function burst(el, gain) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    fx('ring', cx, cy, 700);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
      const d = 70 + Math.random() * 60;
      const s = fx('spark', cx + Math.cos(a) * 20, cy + Math.sin(a) * 12, 800);
      const c = SPARK[i % SPARK.length];
      s.innerHTML = i % 3 ? `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z" fill="${c}"/></svg>`
        : `<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="9" fill="${c}"/></svg>`;
      s.style.setProperty('--dx', Math.cos(a) * d + 'px');
      s.style.setProperty('--dy', Math.sin(a) * d * 0.75 + 'px');
      s.style.setProperty('--rot', rnd(160) - 80 + 'deg');
    }
    if (gain) fx('plus', Math.min(r.right - 46, window.innerWidth - 70), r.top + 4, 1100).innerHTML = `+${gain}${I.star(20)}`;
  }
  function toast(text, kind = '', life = 1300) {
    const t = fx('toast ' + kind, 0, 0, life);
    t.style.left = '';
    t.style.top = '';
    t.textContent = text;
  }
  function confetti(n = 46) {
    for (let i = 0; i < n; i++) {
      const c = fx('confetti', Math.random() * window.innerWidth, -20, 2800, 'i');
      c.style.background = SPARK[i % SPARK.length];
      c.style.setProperty('--dx', rnd(140) - 70 + 'px');
      c.style.setProperty('--rot', rnd(900) - 450 + 'deg');
      c.style.setProperty('--t', 1.3 + Math.random() * 1.1 + 's');
      c.style.animationDelay = Math.random() * 0.3 + 's';
      if (i % 3 === 0) c.style.borderRadius = '50%';
    }
  }
  function bumpEl(el) {
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }
  function reshake(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ---------- bottom menu ---------- */
  function navHTML(cur) {
    const due = Store.dueWords().length;
    const cur1 = (n) => (cur === n ? ' aria-current="page"' : '');
    return `<nav class="nav" aria-label="메뉴">
      <button type="button" data-act="nav" data-arg="home"${cur1('home')}>${I.home(cur === 'home')}홈</button>
      <button type="button" data-act="nav" data-arg="review"${cur1('review')}>${I.book(cur === 'review')}복습장${due ? `<span class="badge">${due}</span>` : ''}</button>
      <button type="button" data-act="nav" data-arg="stickers"${cur1('stickers')}>${I.sticker(cur === 'stickers')}스티커</button>
    </nav>`;
  }

  /* ---------- home ---------- */
  function greet(d, due) {
    if (due > 0) return `복습할 단어가 <b>${due}개</b> 있어요.<br>복습장에서 다시 만나요!`;
    if (d.today.right >= d.goal) return '오늘 목표 달성! 최고예요.<br>더 하면 별이 더 쌓여요.';
    if (!d.quizzes) return '안녕! 고양이 선생님이에요.<br>단계와 놀이를 골라 볼까요?';
    return `오늘 목표까지 <b>${d.goal - d.today.right}개</b> 남았어요.<br>같이 해 볼까요?`;
  }

  function homeHTML() {
    const d = Store.data;
    const due = Store.dueWords().length;
    const streak = Store.streakNow();
    const mode = MODES.find((m) => m.id === d.mode) || MODES[0];
    const pct = Math.min(100, (d.today.right / d.goal) * 100);
    const levels = LEVELS.map((lv) => {
      const words = levelWords(lv.id);
      return `<button type="button" class="level ${lv.group}" data-act="level" data-arg="${lv.id}" aria-pressed="${d.level === lv.id}">
        <span class="lv">Lv.${lv.id}</span><span class="nm">${lv.name}</span>
        <span class="pg">${I.star(12).replace('<svg', '<svg style="display:inline;vertical-align:-1px"')} ${Store.knownIn(words)} / ${words.length}</span>
      </button>`;
    }).join('');
    const modes = MODES.map((m) => `<button type="button" class="mode" data-act="mode" data-arg="${m.id}" aria-pressed="${d.mode === m.id}">
        <span>${m.name}<small>${m.sub}</small></span></button>`).join('');
    return `<section class="screen has-nav">
      <div class="home-grid">
        <div>
          <div class="hello">
            ${Art.svg('cat:teacher', 76, '고양이 선생님')}
            <p class="bubble">${greet(d, due)}</p>
            <button type="button" class="square" data-act="sound" aria-pressed="${d.sound}" aria-label="효과음 ${d.sound ? '끄기' : '켜기'}">${d.sound ? I.spk(22) : I.mute}</button>
          </div>
          <div class="stats">
            <div class="stat">${I.fire()}<div><b>${streak}일 연속</b><small>${streak ? '매일 하면 커져요' : '오늘 시작해요'}</small></div></div>
            <div class="stat">${I.star(26)}<div><b>별 ${d.stars}개</b><small>스티커 ${d.stickers.length} / ${Art.stickers.length}</small></div></div>
          </div>
          <div class="card goal${pct >= 100 ? ' done' : ''}">
            <div class="split"><span class="label">오늘의 목표</span><span class="num" style="font-size:18px">${Math.min(d.today.right, d.goal)} / ${d.goal}</span></div>
            <div class="bar" role="progressbar" aria-label="오늘 맞힌 단어" aria-valuemin="0" aria-valuemax="${d.goal}" aria-valuenow="${Math.min(d.today.right, d.goal)}"><i style="width:${pct}%"></i></div>
          </div>
        </div>
        <div>
          <div style="display:flex;flex-direction:column;gap:8px"><span class="label">단어 단계</span><div class="levels">${levels}</div></div>
          <div style="display:flex;flex-direction:column;gap:8px"><span class="label">놀이 고르기</span><div class="modes">${modes}</div></div>
          <button type="button" class="btn go" data-act="start">${I.play}${mode.name} 시작</button>
        </div>
      </div>
      ${navHTML('home')}
    </section>`;
  }

  /* ---------- review book ---------- */
  function whenText(due) {
    const n = Store.daysBetween(Store.dayKey(), due);
    return n <= 0 ? '오늘' : n === 1 ? '내일' : `${n}일 뒤`;
  }
  const boxes = (box) => `<span class="boxes" aria-label="${box}단계">${[1, 2, 3, 4].map((b) => `<i class="${b <= box ? 'on' : ''}"></i>`).join('')}</span>`;
  function wordItem(w, right) {
    return `<div class="witem">
      <div class="tx"><div class="en">${esc(w.w)}</div><div class="ko">${esc(w.k)}</div></div>
      ${right || ''}
      <button type="button" class="round" data-act="say" data-arg="${esc(w.w)}" aria-label="${esc(w.w)} 발음 듣기">${I.spk()}</button>
    </div>`;
  }

  function reviewHTML() {
    const list = Store.reviewList();
    const due = Store.dueWords();
    const say = due.length ? `오늘 다시 볼 단어가 <b>${due.length}개</b> 있어요.<br>틀려도 괜찮아요!`
      : list.length ? '오늘 복습은 끝!<br>날짜가 되면 다시 나와요.' : '틀린 단어는 여기에 모여요.<br>지금은 텅 비었어요!';
    const items = list.map((r) => {
      const w = byWord.get(r.w);
      return w ? wordItem(w, `<div class="when">${whenText(r.due)}<br>${boxes(r.box)}</div>`) : '';
    }).join('');
    return `<section class="screen has-nav">
      <div class="hello">${Art.svg(due.length ? 'cat:teacher' : 'cat:happy', 72, '고양이 선생님')}<p class="bubble">${say}</p></div>
      <div class="stats">
        <div class="stat">${I.book(true)}<div><b>복습 중 ${list.length}개</b><small>틀린 단어 모음</small></div></div>
        <div class="stat">${I.star(26)}<div><b>외운 단어 ${Store.learnedCount()}개</b><small>4번 맞히면 졸업</small></div></div>
      </div>
      <button type="button" class="btn go" data-act="review-go"${due.length ? '' : ' disabled'}>${due.length ? `${I.play}복습 시작 (${Math.min(due.length, QUIZ_LEN)}개)` : '오늘 복습 끝!'}</button>
      <span class="label">복습 단어</span>
      <div class="wlist">${items || '<div class="empty">아직 틀린 단어가 없어요.<br>퀴즈에서 틀린 단어가 여기에 담겨요.</div>'}</div>
      <div class="spacer"></div>
      ${navHTML('review')}
    </section>`;
  }

  /* ---------- sticker album ---------- */
  function fontsOK() {
    try { return document.fonts && document.fonts.check('16px Jua') && document.fonts.check('16px "Gowun Dodum"'); } catch (e) { return false; }
  }
  function stickersHTML() {
    const have = new Set(Store.data.stickers);
    const cells = Art.stickers.map((s) => (have.has(s.id)
      ? `<button type="button" class="stk" style="background:${s.bg}" data-act="stk" data-arg="${s.id}" aria-label="${s.name}">${Art.svg(s.art, 56)}</button>`
      : '<span class="stk locked" role="img" aria-label="아직 없는 스티커">?</span>')).join('');
    return `<section class="screen has-nav">
      <div class="split"><h1 style="font-size:26px">스티커 앨범</h1><span class="num" style="font-size:20px">${have.size} / ${Art.stickers.length}</span></div>
      <p class="muted">퀴즈를 절반 넘게 맞히면 한 장씩 붙어요. 스피드는 8개부터!</p>
      <p class="stk-name" id="stk-name" aria-live="polite">${have.size ? '스티커를 눌러 보세요' : '첫 스티커를 모아 볼까요?'}</p>
      <div class="album">${cells}</div>
      <p class="foot">영단어 퀘스트 · 버전 ${esc(VERSION)} · 글꼴 ${fontsOK() ? '적용됨' : '기본 글꼴'}<br>
        발음 목소리: ${esc(Sound.voiceName() || '없음')}<br>
        피아노 소리: Salamander Grand Piano (Alexander Holm, CC BY 3.0)<br>
        글꼴: Jua · Gowun Dodum · Fredoka (SIL Open Font License)</p>
      <div class="spacer"></div>
      ${navHTML('stickers')}
    </section>`;
  }

  /* ---------- building a quiz ---------- */
  function pickWords(levelId, n) {
    const t = Store.dayKey();
    const rank = (w) => {
      const r = Store.word(w.w);
      if (!r) return 1 + Math.random();
      if (r.box >= 1 && r.box < Store.LEARNED) return r.due <= t ? Math.random() * 0.5 : 2 + Math.random();
      if (!r.right) return 1.2 + Math.random();
      return 3 + Math.random();
    };
    return shuffle(levelWords(levelId).map((w) => [rank(w), w]).sort((a, b) => a[0] - b[0]).slice(0, n).map((x) => x[1]));
  }

  // Two meanings "clash" when one could pass for the other; such a pair never shares a question.
  const parts = (k) => k.replace(/\(.*?\)/g, '').split(/[,·]/).map((s) => s.trim()).filter(Boolean);
  function clash(a, b) {
    const pa = parts(a.k), pb = parts(b.k);
    return pa.some((x) => pb.some((y) => x === y || x.includes(y) || y.includes(x)));
  }
  function optionsFor(word) {
    const got = [];
    const tiers = [
      WORDS.filter((w) => w.l === word.l && w.p === word.p),
      WORDS.filter((w) => Math.abs(w.l - word.l) <= 1 && w.p === word.p),
      WORDS.filter((w) => Math.abs(w.l - word.l) <= 1),
      WORDS,
    ];
    for (const tier of tiers) {
      for (const w of shuffle(tier)) {
        if (got.length >= 3) break;
        if (w === word || got.includes(w) || clash(w, word) || got.some((g) => clash(g, w))) continue;
        got.push(w);
      }
      if (got.length >= 3) break;
    }
    return shuffle([word, ...got]);
  }

  function startQuiz(kind, mode, levelId, words) {
    Q = {
      kind, mode, level: levelId, words, i: 0,
      right: 0, combo: 0, bestCombo: 0, stars: 0, missed: [], log: [], view: 'question',
    };
    if (mode === 'speed') {
      Q.queue = shuffle(levelWords(levelId));
      Q.words = [];
    }
    show('quiz');
  }

  function levelChip() {
    if (Q.kind === 'review') return '<span class="chip mid">복습장</span>';
    if (Q.kind === 'retry') return '<span class="chip">틀린 단어 다시</span>';
    const lv = levelOf(Q.level);
    return `<span class="chip ${lv.group}">Lv.${lv.id} ${lv.name}</span>`;
  }

  /* ---------- the quiz screen ---------- */
  function startScreen() {
    const speed = Q.mode === 'speed';
    app.innerHTML = `<section class="screen quiz">
      <div class="qtop">
        <button type="button" class="square" data-act="quit" aria-label="그만하고 홈으로">${I.close}</button>
        <div class="bar${speed ? ' timer' : ''}" role="progressbar" aria-label="${speed ? '남은 시간' : '푼 문제'}"><i id="q-bar" style="width:${speed ? 100 : 0}%"></i></div>
        <span class="num" id="q-num">${speed ? SPEED_SEC + '초' : `1 / ${Q.words.length}`}</span>
      </div>
      <div class="qinfo">
        ${levelChip()}
        <span class="grow"></span>
        <span class="chip stars" id="q-stars">${speed ? '맞힘' : I.star(16)}<span class="num">${speed ? 0 : Store.data.stars}</span></span>
        <span class="chip combo" id="q-combo" hidden></span>
      </div>
      <div class="qbody" id="qbody"></div>
    </section>`;
    if (speed) countdown();
    else question();
  }

  const setBar = (pct) => { const b = document.getElementById('q-bar'); if (b) b.style.width = pct + '%'; };
  const setNum = (t) => { const n = document.getElementById('q-num'); if (n) n.textContent = t; };
  function setStarsChip() {
    const c = document.getElementById('q-stars');
    if (!c) return;
    c.querySelector('.num').textContent = Q.mode === 'speed' ? Q.right : Store.data.stars;
    bumpEl(c);
  }
  function setCombo() {
    const c = document.getElementById('q-combo');
    if (!c) return;
    if (Q.combo < 2) { c.hidden = true; return; }
    c.hidden = false;
    c.textContent = `콤보 ×${Q.combo}`;
    c.className = 'chip combo' + (Q.combo >= 10 ? ' fire' : Q.combo >= 5 ? ' hot' : '');
    bumpEl(c);
  }

  const wordSize = (w) => (w.length >= 12 ? ' xlong' : w.length >= 10 ? ' long' : '');

  function question() {
    Q.view = 'question';
    Q.answered = false;
    Q.mistakes = 0;
    Q.pos = 0;
    Q.gaveUp = false;
    const w = Q.cur = Q.words[Q.i];
    if (Q.mode !== 'speed') {
      setNum(`${Q.i + 1} / ${Q.words.length}`);
      setBar((Q.i / Q.words.length) * 100);
    }
    const body = document.getElementById('qbody');
    if (Q.mode === 'meaning' || Q.mode === 'speed') body.innerHTML = meaningHTML(w);
    else if (Q.mode === 'spell') body.innerHTML = spellHTML(w);
    else body.innerHTML = listenHTML(w);
    if (Q.mode === 'listen') Sound.speak(w.w);
    else if (Q.mode === 'meaning' && Store.data.sound) Sound.speak(w.w);
  }

  function meaningHTML(w) {
    Q.opts = optionsFor(w);
    const speed = Q.mode === 'speed';
    return `<div class="side">
        <div class="wordcard rise">
          <div class="wordline"><span class="word${wordSize(w.w)}" lang="en">${esc(w.w)}</span>
            ${speed ? '' : `<button type="button" class="round" data-act="say" data-arg="${esc(w.w)}" aria-label="발음 듣기">${I.spk()}</button>`}</div>
          <span class="pos">${POS[w.p] || ''}</span>
          ${speed ? '' : `<div class="pic">${Art.svg(w.i || 'cat:thinking', 104)}</div>`}
        </div>
        <p class="ask">알맞은 뜻을 골라 주세요</p>
      </div>
      <div class="side bottom choices">
        ${Q.opts.map((o, n) => `<button type="button" class="choice" data-act="pick" data-arg="${n}"><span class="n">${n + 1}</span><span class="t">${esc(o.k)}</span></button>`).join('')}
      </div>`;
  }

  function pick(n, btn) {
    if (Q.answered || Q.view !== 'question') return;
    Q.answered = true;
    const right = Q.opts[n] === Q.cur;
    const all = [...document.querySelectorAll('.choice')];
    all.forEach((b) => { b.disabled = true; });
    if (right) {
      btn.classList.add('right');
      all.forEach((b) => { if (b !== btn) b.classList.add('fade'); });
    } else {
      btn.classList.add('wrong');
      all[Q.opts.indexOf(Q.cur)].classList.add('was');
      all.forEach((b, i) => { if (b !== btn && i !== Q.opts.indexOf(Q.cur)) b.classList.add('fade'); });
    }
    const gain = record(right);
    if (right) { burst(btn, gain); Sound.correct(Q.combo); }
    else Sound.wrong();
    afterAnswer(right);
  }

  function afterAnswer(right) {
    if (Q.mode === 'speed') {
      later(nextSpeed, right ? 420 : 1050);
      return;
    }
    setBar(((Q.i + 1) / Q.words.length) * 100);
    later(() => answerView(right), right ? 800 : 1350);
  }

  // Save one answer and hand out stars. Returns the stars won.
  function record(right, w = Q.cur) {
    const d = Store.data;
    const before = d.today.right;
    Store.answer(w.w, right);
    Q.log.push({ w, right });
    let gain = 0;
    if (right) {
      Q.right++;
      Q.combo++;
      Q.bestCombo = Math.max(Q.bestCombo, Q.combo);
      gain = 1;
      const c = Q.combo;
      if (c === 3 || c === 5 || c === 10 || (c > 10 && c % 5 === 0)) {
        gain += c === 3 ? 1 : c === 5 ? 2 : 3;
        const text = c === 3 ? '3연속! 좋아요' : c === 5 ? '5연속! 대단해요' : c === 10 ? '10연속! 천재 냥!' : `${c}연속! 멈출 수 없어`;
        later(() => {
          toast(text, c >= 5 ? 'big' : '');
          Sound.streak(c);
          if (c >= 5) confetti(c >= 10 ? 70 : 40);
        }, 260);
      }
      Q.stars += gain;
      Q.lastGain = gain;
      Store.addStars(gain);
    } else {
      Q.combo = 0;
      if (!Q.missed.includes(w)) Q.missed.push(w);
    }
    setStarsChip();
    setCombo();
    if (before < d.goal && d.today.right >= d.goal) {
      later(() => { toast('오늘의 목표 달성!', 'calm', 1500); Sound.fanfare(); }, 900);
    }
    log(`answer ${w.w} ${right ? 'O' : 'X'} combo ${Q.combo}`);
    return gain;
  }

  /* spelling: tap the letters in order */
  function tileSet(word) {
    const letters = word.split('');
    const cols = letters.length <= 6 ? 4 : letters.length <= 10 ? 5 : 6;
    const total = Math.ceil((letters.length + 2) / cols) * cols;
    const extra = [];
    const abc = 'abcdefghiklmnoprstuvwy';
    while (letters.length + extra.length < total) extra.push(abc[rnd(abc.length)]);
    return { cols, tiles: shuffle(letters.concat(extra)) };
  }
  function slotsHTML(w) {
    return `<div class="slots${w.w.length > 9 ? ' many' : ''}" id="slots" aria-label="${w.w.length}글자">
      ${w.w.split('').map((c, i) => `<span class="slot${i === 0 ? ' on' : ''}"></span>`).join('')}</div>`;
  }
  function toolsHTML() {
    const st = Store.data.stars;
    return `<div class="tools">
      <button type="button" class="btn quiet" data-act="giveup">정답 보기</button>
      <button type="button" class="btn hint" id="hint" data-act="hint"${st < 1 ? ' disabled' : ''}>${I.bulb}힌트 (별 1개)</button>
    </div>`;
  }
  function spellHTML(w) {
    const t = tileSet(w.w);
    Q.letters = w.w.split('');
    Q.tiles = t.tiles;
    return `<div class="side">
        <div class="wordcard spell rise">
          <div class="meaning-big">${esc(w.k)}</div>
          <span class="pos">${POS[w.p] || ''}</span>
          <div class="pic">${Art.svg(w.i || 'cat:thinking', 84)}</div>
          <button type="button" class="pill" data-act="say" data-arg="${esc(w.w)}">${I.spk(18)}발음 듣기</button>
        </div>
        ${slotsHTML(w)}
      </div>
      <div class="side bottom">
        <div class="tiles" style="--cols:${t.cols}">${t.tiles.map((c, i) => `<button type="button" class="tile" data-act="tile" data-arg="${i}" lang="en">${c}</button>`).join('')}</div>
        ${toolsHTML()}
      </div>`;
  }

  const QWERTY = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  function listenHTML(w) {
    Q.letters = w.w.split('');
    const peek = Sound.canSpeak ? '들리는 단어를 써 보세요' : `이 기기는 소리를 못 읽어요. 뜻: ${esc(w.k)}`;
    return `<div class="side">
        <div class="wordcard listen rise">
          <button type="button" class="bigspeak" data-act="say" data-arg="${esc(w.w)}" aria-label="다시 듣기">${I.spk(46)}</button>
          <div class="listen-tools">
            <button type="button" class="pill" data-act="slow" data-arg="${esc(w.w)}">천천히 듣기</button>
          </div>
          <p class="peek" id="peek">${peek}</p>
        </div>
        ${slotsHTML(w)}
      </div>
      <div class="side bottom">
        <div class="keys" lang="en">${QWERTY.map((row) => `<div class="krow">${row.split('').map((c) => `<button type="button" class="key" data-act="key" data-arg="${c}">${c}</button>`).join('')}</div>`).join('')}</div>
        ${toolsHTML()}
      </div>`;
  }

  function glowNext() {
    document.querySelectorAll('.glow').forEach((e) => e.classList.remove('glow'));
    const want = Q.letters[Q.pos];
    if (want == null) return;
    const el = Q.mode === 'spell'
      ? [...document.querySelectorAll('.tile')].find((b) => !b.disabled && Q.tiles[+b.dataset.arg] === want)
      : document.querySelector(`.key[data-arg="${want}"]`);
    if (el) el.classList.add('glow');
  }

  function placeLetter(given) {
    const slots = document.querySelectorAll('.slot');
    const s = slots[Q.pos];
    s.textContent = Q.letters[Q.pos];
    s.className = 'slot full' + (given ? ' given' : '');
    Sound.letter(Q.pos);
    Q.pos++;
    if (Q.pos < Q.letters.length) {
      slots[Q.pos].classList.add('on');
      if (Q.mistakes >= 3) glowNext();
      else document.querySelectorAll('.glow').forEach((e) => e.classList.remove('glow'));
    } else {
      wordDone();
    }
  }

  function missLetter(btn) {
    Q.mistakes++;
    reshake(btn, 'no');
    setTimeout(() => btn.classList.remove('no'), 450);
    Sound.miss();
    if (Q.mode === 'listen' && Q.mistakes === 2) {
      const p = document.getElementById('peek');
      if (p) p.textContent = `뜻 힌트: ${Q.cur.k}`;
    }
    if (Q.mistakes === 3) {
      glowNext();
      toast('반짝이는 글자를 눌러요', 'calm', 1200);
    }
  }

  function tile(n, btn) {
    if (Q.answered || Q.view !== 'question') return;
    if (Q.tiles[n] === Q.letters[Q.pos]) {
      btn.classList.add('used');
      btn.disabled = true;
      placeLetter(false);
    } else {
      missLetter(btn);
    }
  }

  function key(c, btn) {
    if (Q.answered || Q.view !== 'question') return;
    if (c === Q.letters[Q.pos]) {
      reshake(btn, 'yes');
      setTimeout(() => btn.classList.remove('yes'), 250);
      placeLetter(false);
    } else {
      missLetter(btn);
    }
  }

  function hint() {
    if (Q.answered || Q.view !== 'question' || Store.data.stars < 1) return;
    Store.addStars(-1);
    Q.stars -= 1;
    setStarsChip();
    if (Q.mode === 'spell') {
      const b = [...document.querySelectorAll('.tile')].find((x) => !x.disabled && Q.tiles[+x.dataset.arg] === Q.letters[Q.pos]);
      if (b) { b.classList.add('used'); b.disabled = true; }
    }
    placeLetter(true);
    const h = document.getElementById('hint');
    if (h && Store.data.stars < 1) h.disabled = true;
  }

  function giveUp() {
    if (Q.answered || Q.view !== 'question') return;
    Q.gaveUp = true;
    Q.mistakes = Math.max(Q.mistakes, 3);
    const slots = document.querySelectorAll('.slot');
    for (let i = Q.pos; i < Q.letters.length; i++) {
      slots[i].textContent = Q.letters[i];
      slots[i].className = 'slot full given';
    }
    Q.pos = Q.letters.length;
    wordDone();
  }

  function wordDone() {
    Q.answered = true;
    document.querySelectorAll('.tile, .key, .tools button').forEach((b) => { b.disabled = true; });
    document.querySelectorAll('.glow').forEach((e) => e.classList.remove('glow'));
    const right = !Q.gaveUp && Q.mistakes < 3;
    const slots = document.getElementById('slots');
    if (right) {
      slots.classList.add('done');
      slots.querySelectorAll('.slot').forEach((s, i) => { s.style.animationDelay = i * 0.045 + 's'; });
    }
    const gain = record(right);
    if (right) {
      later(() => { burst(slots, gain); Sound.correct(Q.combo); }, 120);
      later(() => Sound.speak(Q.cur.w), 600);
    } else {
      Sound.wrong();
    }
    afterAnswer(right);
  }

  /* after each answer: the word, its example, and a tip */
  function markWord(sentence, word) {
    const tries = [word, word.slice(0, Math.max(3, word.length - 1)), word.slice(0, Math.max(3, word.length - 2))];
    for (const stem of tries) {
      const re = new RegExp('\\b(' + stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[a-z]*)', 'i');
      const m = sentence.match(re);
      if (m) return esc(sentence.slice(0, m.index)) + '<mark>' + esc(m[1]) + '</mark>' + esc(sentence.slice(m.index + m[1].length));
    }
    return esc(sentence);
  }
  const relHTML = (r) => esc(r).replace(/\b([a-z][a-z-]+(?: [a-z][a-z-]+)?)\b/g, '<b>$1</b>');

  function answerView(right) {
    Q.view = 'answer';
    const w = Q.cur;
    const last = Q.i + 1 >= Q.words.length;
    const gainText = right ? `별 ${Q.lastGain}개를 받았어요${Q.combo >= 2 ? ` · ${Q.combo}연속!` : ''}` : '';
    const body = document.getElementById('qbody');
    body.innerHTML = `<div class="side rise">
        <div class="verdict${right ? '' : ' no'}">
          ${Art.svg(right ? (Q.combo >= 3 ? 'cat:excited' : 'cat:happy') : 'cat:worried', 62)}
          <div><h2>${right ? one(['정답이에요!', '맞았어요!', '딩동댕!', '완벽해요!']) : Q.gaveUp ? '같이 볼까요?' : '아깝다!'}</h2>
          <p>${right ? gainText : '복습장에 담았어요. 내일 다시 만나요'}</p></div>
        </div>
        <div class="card info">
          <div class="head"><span class="w" lang="en">${esc(w.w)}</span>
            <button type="button" class="round" data-act="say" data-arg="${esc(w.w)}" aria-label="${esc(w.w)} 발음 듣기">${I.spk()}</button>
            <span class="grow"></span>${w.i ? Art.svg(w.i, 58) : ''}</div>
          <div class="m">${POS[w.p] || ''} · ${esc(w.k)}</div>
          ${w.r ? `<div class="tags"><span class="tag">${relHTML(w.r)}</span></div>` : ''}
        </div>
        <div class="card example">
          <div class="split"><span class="label" style="font-size:18px">예문</span>
            <button type="button" class="round" data-act="sayex" aria-label="예문 듣기">${I.spk()}</button></div>
          <p class="en-s" lang="en">${markWord(w.e, w.w)}</p>
          <p class="ko">${esc(w.x)}</p>
        </div>
        ${w.t ? `<div class="tip">${I.bulb}<p><b>외우는 꿀팁</b> ${esc(w.t)}</p></div>` : ''}
      </div>
      <div class="side bottom">
        <button type="button" class="btn go" data-act="next">${last ? '결과 보기' : '다음 문제'}</button>
      </div>`;
    window.scrollTo(0, 0);
  }

  function next() {
    if (Q.view !== 'answer') return;
    Q.i++;
    if (Q.i >= Q.words.length) finishQuiz();
    else question();
  }

  /* speed: 60 seconds of quick meaning questions */
  function countdown() {
    Q.view = 'count';
    document.getElementById('qbody').innerHTML = `<div class="side" style="align-items:center;justify-content:center;flex:1">
      ${Art.svg('cat:excited', 120)}<p class="ask">60초 동안 몇 개나 맞힐까요?</p></div>`;
    [3, 2, 1, 0].forEach((n, k) => later(() => {
      const c = fx('count', 0, 0, 700);
      c.style.left = '';
      c.style.top = '';
      c.textContent = n || '시작!';
      if (!n) c.style.fontFamily = 'var(--f-kr)';
      Sound.count(n);
    }, 150 + k * 650));
    later(() => {
      Q.end = Date.now() + SPEED_SEC * 1000;
      Q.lastSec = SPEED_SEC;
      Q.ticker = setInterval(speedTick, 200);
      nextSpeed(true);
    }, 150 + 3 * 650 + 250);
  }

  function speedTick() {
    if (Q.paused) return;
    const ms = Math.max(0, Q.end - Date.now());
    const sec = Math.ceil(ms / 1000);
    const bar = document.getElementById('q-bar');
    if (bar) {
      bar.style.transition = 'width .2s linear';
      bar.style.width = (ms / (SPEED_SEC * 10)) + '%';
      if (sec <= 10) bar.style.backgroundColor = '#ff9fae';
    }
    if (sec !== Q.lastSec) {
      Q.lastSec = sec;
      setNum(sec + '초');
      if (sec <= 5 && sec > 0) Sound.hurry();
    }
    if (ms <= 0) timeUp();
  }

  function timeUp() {
    clearInterval(Q.ticker);
    Q.ticker = null;
    Q.answered = true;
    Q.view = 'over';
    document.querySelectorAll('.choice').forEach((b) => { b.disabled = true; });
    Sound.timeUp();
    toast('끝!', 'big', 1100);
    later(finishQuiz, 1200);
  }

  function nextSpeed(first) {
    if (Q.view === 'over') return;
    if (!first) Q.i++;
    if (!Q.queue.length) Q.queue = shuffle(levelWords(Q.level));
    Q.words.push(Q.queue.pop());
    question();
  }

  /* ---------- result ---------- */
  function finishQuiz() {
    stopTimers();
    if (Q.finished) return;
    Q.finished = true;
    const speed = Q.mode === 'speed';
    Q.total = speed ? Q.log.length : Q.words.length;
    Q.prevBest = Store.data.best;
    Store.finishQuiz(speed ? Q.right : null);
    Q.need = speed ? 8 : Math.ceil(Q.total / 2);
    Q.sticker = Q.right >= Q.need ? Store.giveSticker(Art.stickers.length) : null;
    show('result');
  }

  function resultScreen() {
    const speed = Q.mode === 'speed';
    const ratio = Q.total ? Q.right / Q.total : 0;
    const grade = speed
      ? (Q.right >= 18 ? 0 : Q.right >= 12 ? 1 : Q.right >= 6 ? 2 : 3)
      : (Q.right === Q.total && Q.total ? 0 : ratio >= 0.8 ? 1 : ratio >= 0.5 ? 2 : 3);
    const stampWords = [['Perfect!', ''], ['Great', 'job!'], ['Good', 'job!'], ['Nice', 'try!']][grade];
    const cat = ['cat:excited', 'cat:happy', 'cat:proud', 'cat:thinking'][grade];
    const title = speed ? (Q.right > Q.prevBest && Q.right ? '새 최고 기록!' : '스피드 끝!') : Q.kind === 'review' ? '복습 끝!' : '오늘의 퀴즈 끝!';
    const st = Q.sticker != null ? Art.stickers[Q.sticker] : null;
    const full = Q.sticker == null && Store.data.stickers.length >= Art.stickers.length;
    const prize = st
      ? `<div class="prize new" id="prize" style="opacity:0"><div class="ph" style="background:${st.bg}">${Art.svg(st.art, 44)}</div>
          <div><b>새 스티커: ${st.name}</b><small>스티커 앨범 ${Store.data.stickers.length} / ${Art.stickers.length}</small></div></div>`
      : `<div class="prize" id="prize"><div class="ph">${I.star(30)}</div>
          <div><b>${full ? '앨범을 다 채웠어요!' : `스티커까지 ${Q.need - Q.right}개 더!`}</b>
          <small>${full ? '모든 스티커를 모았어요' : speed ? '스피드는 8개 맞히면 스티커' : '절반 넘게 맞히면 스티커'}</small></div></div>`;
    const missed = Q.missed.length
      ? `<div style="display:flex;flex-direction:column;gap:8px">
          <div class="split"><span class="label">복습장에 담은 단어</span><span class="muted" style="font-size:13px">내일 다시 나와요</span></div>
          <div class="wlist">${Q.missed.map((w) => wordItem(w)).join('')}</div></div>`
      : '';
    app.innerHTML = `<section class="screen result">
      <h1 style="text-align:center;font-size:28px">${title}</h1>
      <div class="result-top">
        ${Art.svg(cat, 96, '고양이 선생님')}
        <div class="stamp" id="stamp" aria-label="${stampWords.join(' ')}"><span>${stampWords[0]}</span>${stampWords[1] ? `<span>${stampWords[1]}</span>` : ''}
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 21s-7-4.4-9.3-8.6C1 9.1 3 5.5 6.5 5.5c2 0 3.3 1.1 4 2.2.7-1.1 2-2.2 4-2.2 3.5 0 5.5 3.6 3.8 6.9C19 16.6 12 21 12 21z" fill="#e04a66"/></svg></div>
      </div>
      <div class="tri">
        <div><span class="num" id="r-right">0${speed ? '개' : ` / ${Q.total}`}</span><small>${speed ? `맞힌 개수 (최고 ${Math.max(Q.prevBest, Q.right)})` : '맞힌 문제'}</small></div>
        <div><span class="num" id="r-stars">+0</span><small>받은 별</small></div>
        <div><span class="num" id="r-streak">${Store.streakNow()}일</span><small>연속 공부</small></div>
      </div>
      ${prize}
      ${missed}
      <div class="spacer"></div>
      <div class="row2">
        ${Q.missed.length ? '<button type="button" class="btn pinkish" data-act="retry">틀린 단어 다시</button>' : '<button type="button" class="btn pinkish" data-act="again">한 번 더</button>'}
        <button type="button" class="btn go" style="font-size:20px" data-act="nav" data-arg="home">홈으로</button>
      </div>
    </section>`;

    // The payoff, in order: fanfare, numbers counting up, the stamp, then the sticker.
    later(() => (grade <= 2 ? Sound.fanfare() : Sound.soft()), 120);
    const steps = Math.min(Q.right, 20);
    const rEl = document.getElementById('r-right');
    const sEl = document.getElementById('r-stars');
    for (let k = 1; k <= steps; k++) {
      later(() => {
        const v = Math.round((Q.right * k) / steps);
        rEl.textContent = speed ? `${v}개` : `${v} / ${Q.total}`;
        Sound.tick(k);
      }, 650 + k * 85);
    }
    const t1 = 650 + steps * 85 + 120;
    later(() => { sEl.textContent = '+' + Math.max(0, Q.stars); bumpEl(sEl); }, t1);
    later(() => { bumpEl(document.getElementById('r-streak')); }, t1 + 120);
    later(() => {
      document.getElementById('stamp').classList.add('land');
      later(() => Sound.stamp(), 230);
      if (grade === 0) later(() => confetti(70), 260);
    }, t1 + 260);
    if (st) later(() => { const p = document.getElementById('prize'); p.style.opacity = ''; p.classList.add('new'); Sound.sticker(); }, t1 + 950);
  }

  /* ---------- quit sheet ---------- */
  function askQuit() {
    if (document.querySelector('.sheet-back')) return;
    if (Q && Q.mode === 'speed' && Q.ticker) { Q.paused = Date.now(); }
    const back = document.createElement('div');
    back.className = 'sheet-back';
    back.dataset.act = 'stay';
    back.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-t" data-act="none">
      <h2 id="sheet-t">그만할까요?</h2>
      <p>지금까지 푼 문제는 저장돼요.</p>
      <div class="row2">
        <button type="button" class="btn" data-act="stay">계속하기</button>
        <button type="button" class="btn pinkish" data-act="leave">그만하기</button>
      </div></div>`;
    document.body.appendChild(back);
  }
  function closeSheet() {
    const s = document.querySelector('.sheet-back');
    if (s) s.remove();
    if (Q && Q.paused) { Q.end += Date.now() - Q.paused; Q.paused = 0; }
  }

  /* ---------- actions ---------- */
  const ACTS = {
    nav: (a) => { Sound.tap(); show(a); },
    level: (a) => { Store.set('level', +a); Sound.pop(); redrawHome(); },
    mode: (a) => { Store.set('mode', a); Sound.tap(); redrawHome(); },
    sound: () => {
      const on = !Store.data.sound;
      Store.set('sound', on);
      Sound.setOn(on);
      if (on) Sound.pop();
      redrawHome();
    },
    start: () => {
      const d = Store.data;
      Sound.pop();
      startQuiz('level', d.mode, d.level, d.mode === 'speed' ? [] : pickWords(d.level, QUIZ_LEN));
    },
    'review-go': () => {
      const due = shuffle(Store.dueWords()).slice(0, QUIZ_LEN).map((r) => byWord.get(r.w)).filter(Boolean);
      if (!due.length) return;
      Sound.pop();
      startQuiz('review', 'meaning', 0, due);
    },
    retry: () => { Sound.pop(); startQuiz('retry', 'meaning', Q.level, shuffle(Q.missed)); },
    again: () => {
      Sound.pop();
      if (Q.kind === 'level') startQuiz('level', Q.mode, Q.level, Q.mode === 'speed' ? [] : pickWords(Q.level, QUIZ_LEN));
      else show('home');
    },
    say: (a, b) => { Sound.speak(a); reshake(b, 'speaking'); },
    slow: (a) => { Sound.speak(a, true); },
    sayex: () => { if (Q && Q.cur) Sound.speak(Q.cur.e); },
    pick: (a, b) => pick(+a, b),
    tile: (a, b) => tile(+a, b),
    key: (a, b) => key(a, b),
    hint: () => hint(),
    giveup: () => giveUp(),
    next: () => { Sound.tap(); next(); },
    quit: () => { Sound.tap(); askQuit(); },
    stay: () => { Sound.tap(); closeSheet(); },
    leave: () => { Sound.tap(); closeSheet(); stopTimers(); Q = null; show('home'); },
    stk: (a, b) => {
      const s = Art.stickers[+a];
      reshake(b, 'wiggle');
      const n = document.getElementById('stk-name');
      if (n) n.textContent = s.name;
      if (lastStk !== +a) Sound.sticker(); else Sound.pop();
      lastStk = +a;
    },
    none: () => {},
  };

  /* ---------- input ---------- */
  // Browsers only allow sound after a tap, so the first touch anywhere wakes the audio.
  const wake = () => Sound.unlock();
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach((t) => document.addEventListener(t, wake, { capture: true, passive: true }));
  document.addEventListener('touchstart', () => {}, { passive: true }); // lets :active styles show on iPhone

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    // A tap inside the sheet panel must not count as a tap on the dimmed background.
    if (el.dataset.act === 'none') return;
    const fn = ACTS[el.dataset.act];
    log(`click ${el.dataset.act}${el.dataset.arg != null ? ' ' + el.dataset.arg : ''}`);
    if (fn) fn(el.dataset.arg, el, e);
  });

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || screen !== 'quiz' || !Q) return;
    if (document.querySelector('.sheet-back')) {
      if (e.key === 'Escape') ACTS.stay();
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'escape') { ACTS.quit(); return; }
    if (Q.view === 'answer' && (k === 'enter' || k === ' ')) { e.preventDefault(); ACTS.next(); return; }
    if (Q.view !== 'question' || Q.answered) return;
    if ((Q.mode === 'meaning' || Q.mode === 'speed') && /^[1-4]$/.test(k)) {
      const b = document.querySelectorAll('.choice')[+k - 1];
      if (b && !b.disabled) b.click();
    } else if (Q.mode === 'spell' && /^[a-z]$/.test(k)) {
      const free = [...document.querySelectorAll('.tile')].filter((b) => !b.disabled && Q.tiles[+b.dataset.arg] === k);
      if (free[0]) free[0].click();
      else Sound.miss();
    } else if (Q.mode === 'listen' && /^[a-z]$/.test(k)) {
      const b = document.querySelector(`.key[data-arg="${k}"]`);
      if (b && !b.disabled) b.click();
    }
  });

  /* ---------- check mode (?debug): where touches land, and a short log ---------- */
  let logBox = null;
  function log(msg) {
    if (!DEBUG) return;
    if (!logBox) {
      logBox = document.createElement('div');
      logBox.className = 'debug-log';
      document.body.appendChild(logBox);
    }
    const lines = (logBox.textContent ? logBox.textContent.split('\n') : []).concat(
      `${new Date().toTimeString().slice(3, 8)} ${msg}`);
    logBox.textContent = lines.slice(-9).join('\n');
  }
  if (DEBUG) {
    document.addEventListener('pointerdown', (e) => {
      const d = document.createElement('div');
      d.className = 'debug-dot';
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 900);
      const t = e.target.closest('[data-act]');
      log(`down ${Math.round(e.clientX)},${Math.round(e.clientY)} ${t ? t.dataset.act : e.target.tagName.toLowerCase()} · ${innerWidth}x${innerHeight}`);
    }, { capture: true, passive: true });
    log('check mode · version ' + VERSION);
  }

  Sound.setOn(Store.data.sound);
  window.VocabApp = { show, get quiz() { return Q; }, startQuiz, pickWords, optionsFor, VERSION };
  show('home');
})();
