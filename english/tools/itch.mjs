// Cover image and screenshots for the itch.io page, drawn from the real app.
//   node english/tools/itch.mjs        -> english/itch/cover.png (1260x1000, 630x500 at 2x) and shot-*.png (1280x720)
// Uses the Playwright that comes with the cloud session; elsewhere run `npm i playwright` first.
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, 'itch');
fs.mkdirSync(out, { recursive: true });
let chromium, devices;
try {
  ({ chromium, devices } = await import('playwright'));
} catch {
  ({ chromium, devices } = await import('/opt/node22/lib/node_modules/playwright/index.mjs'));
}
const appUrl = pathToFileURL(path.join(root, 'index.html')).href;
const browser = await chromium.launch();

/* ---------- phone screens from the app ---------- */
const ctx = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(appUrl);
await page.waitForTimeout(500);
const shot = async () => (await page.screenshot()).toString('base64');
const answer = async (right) => {
  const k = await page.evaluate((right) => { const q = window.VocabApp.quiz; const r = q.opts.indexOf(q.cur); return right ? r : (r + 1) % 4; }, right);
  await page.click(`.choice >> nth=${k}`);
};
const words = (list) => page.evaluate((list) => list.map((w) => window.WORDS.find((x) => x.w === w)), list);

// A little history first, so the home screen and album look lived in.
await page.evaluate(() => {
  const d = window.Store.data;
  d.stars = 128; d.streak = 6; d.lastDay = window.Store.dayKey(); d.quizzes = 14; d.today = { day: window.Store.dayKey(), right: 7 };
  d.stickers = Array.from({ length: 14 }, (_, i) => i);
  for (const w of window.WORDS.filter((x) => x.l <= 2).slice(0, 70)) d.words[w.w] = { box: 0, due: '', right: 1, wrong: 0 };
  for (const w of ['reluctant', 'abundant', 'inevitable', 'curious', 'equanimity']) d.words[w] = { box: 1 + (w.length % 3), due: window.Store.dayKey(w.length % 2), right: 1, wrong: 1 };
  d.level = 5;
  window.Store.save();
  window.VocabApp.show('home');
});
await page.waitForTimeout(300);
const S = {};
S.home = await shot();

await page.evaluate(async () => { const w = window.WORDS.find((x) => x.w === 'reluctant'); window.VocabApp.startQuiz('level', 'meaning', 5, [w, ...window.WORDS.filter((x) => x.l === 5).slice(0, 9)]); });
await page.waitForTimeout(400);
S.quiz = await shot();
await answer(true);
await page.waitForTimeout(260);
S.right = await shot();
await page.waitForTimeout(900);
S.answer = await shot();

await page.evaluate(() => { const w = window.WORDS.find((x) => x.w === 'astronaut'); window.VocabApp.startQuiz('level', 'spell', 4, [w]); });
await page.waitForTimeout(300);
await page.evaluate(() => { const q = window.VocabApp.quiz; for (let i = 0; i < 5; i++) { const t = [...document.querySelectorAll('.tile')].find((b) => !b.disabled && q.tiles[+b.dataset.arg] === q.letters[q.pos]); t.click(); } });
await page.waitForTimeout(400);
S.spell = await shot();

await page.evaluate(() => { const w = window.WORDS.find((x) => x.w === 'elephant'); window.VocabApp.startQuiz('level', 'listen', 2, [w]); });
await page.waitForTimeout(300);
await page.evaluate(() => { const q = window.VocabApp.quiz; for (let i = 0; i < 4; i++) document.querySelector(`.key[data-arg="${q.letters[q.pos]}"]`).click(); });
await page.waitForTimeout(400);
S.listen = await shot();

await page.evaluate(() => window.VocabApp.startQuiz('level', 'meaning', 3, window.WORDS.filter((x) => x.l === 3).slice(10, 20)));
for (let i = 0; i < 10; i++) {
  await answer(i !== 4 && i !== 8);
  await page.waitForSelector('[data-act=next]');
  await page.click('[data-act=next]');
  await page.waitForTimeout(120);
}
await page.waitForTimeout(3600);
S.result = await shot();
await page.click('[data-act=nav][data-arg=home]');
await page.click('[data-act=nav][data-arg=review]');
await page.waitForTimeout(300);
S.review = await shot();
await page.click('[data-act=nav][data-arg=stickers]');
await page.waitForTimeout(300);
S.stickers = await shot();
await ctx.close();

/* ---------- pages laid out with the app's own fonts and drawings ---------- */
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const head = `<meta charset="utf-8"><script>${read('fonts/fonts.js')}</script><script>${read('js/art.js')}</script><script>${read('js/pics.js')}</script>
<svg width="0" height="0" style="position:absolute"><filter id="wob" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter></svg>
<style>
  * { box-sizing: border-box; margin: 0; }
  body { background: #fff8ec; background-image: repeating-linear-gradient(115deg, rgba(79,63,92,.035) 0 3px, transparent 3px 12px); color: #4f3f5c; font-family: 'Gowun Dodum', sans-serif; overflow: hidden; }
  .kr { font-family: Jua, sans-serif; }
  .en { font-family: Fredoka, sans-serif; font-weight: 600; }
  .phone { border-radius: 34px; border: 9px solid #4f3f5c; overflow: hidden; background: #fff8ec; box-shadow: 0 10px 0 rgba(79,63,92,.18); }
  .phone img { display: block; width: 100%; }
  .tile { display: inline-flex; align-items: center; justify-content: center; padding: 6px 16px; border-radius: 16px; border: 4px solid; background: #fffdf7; font-family: Fredoka, sans-serif; font-weight: 600; box-shadow: 0 5px 0 currentColor; }
</style>`;

async function render(file, w, h, scale, html) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await p.setContent(`<!doctype html><html><head>${head}</head><body style="width:${w}px;height:${h}px">${html}</body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, file) });
  await p.close();
  console.log('itch/' + file);
}
const art = (key, size, style) => `<div style="position:absolute;${style}" data-art="${key}" data-size="${size}"></div>`;
const fill = `<script>document.querySelectorAll('[data-art]').forEach((e) => { e.innerHTML = window.Art.svg(e.dataset.art, +e.dataset.size); });</script>`;

// Cover: the cat teacher, the name, and words floating around.
await render('cover.png', 630, 500, 2, `
  <div style="position:absolute;left:-60px;top:150px;width:420px;height:420px;border-radius:50%;background:#f3e8fb"></div>
  ${art('cat:teacher', 270, 'left:6px;top:196px')}
  ${art('star', 70, 'left:250px;top:300px;transform:rotate(12deg)')}
  ${art('book', 78, 'left:520px;top:396px;transform:rotate(-8deg)')}
  ${art('rocket', 74, 'left:548px;top:22px;transform:rotate(18deg)')}
  ${art('apple', 62, 'left:20px;top:30px;transform:rotate(-10deg)')}
  ${art('cat:excited/party', 92, 'left:420px;top:380px')}
  <div style="position:absolute;left:92px;top:22px;right:40px">
    <div class="kr" style="font-size:76px;line-height:1;letter-spacing:1px;text-shadow:0 5px 0 #ffe07a">영단어 퀘스트</div>
    <div class="kr" style="margin-top:12px;font-size:27px;color:#6b5a78">고양이 선생님과 600단어 놀이</div>
  </div>
  <div style="position:absolute;left:300px;top:176px;display:flex;flex-direction:column;gap:14px;align-items:flex-start">
    <span class="tile" style="color:#e8778a;font-size:30px;transform:rotate(-4deg)">apple</span>
    <span class="tile" style="color:#6aa9d6;font-size:30px;margin-left:46px;transform:rotate(3deg)">brave</span>
    <span class="tile" style="color:#5fae58;font-size:30px;margin-left:8px;transform:rotate(-2deg)">inevitable</span>
  </div>
  ${fill}`);

// Screenshots: three phones each, with a line saying what they show.
const phones = (title, sub, list) => `
  <div style="position:absolute;left:0;right:0;top:26px;text-align:center">
    <div class="kr" style="font-size:44px">${title}</div>
    <div style="font-size:21px;color:#6b5a78;margin-top:4px">${sub}</div>
  </div>
  <div style="position:absolute;left:0;right:0;top:130px;display:flex;justify-content:center;gap:48px">
    ${list.map(([img, cap]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:250px">
      <div class="phone" style="width:250px;height:520px"><img src="data:image/png;base64,${img}" style="width:232px"></div>
      <div class="kr" style="font-size:20px">${cap}</div></div>`).join('')}
  </div>`;
await render('shot-1-home.png', 1280, 720, 1, phones('고양이 선생님과 영단어 600', '초등 기초부터 도전 단계까지, 6단계 600단어', [[S.home, '단계와 놀이 고르기'], [S.quiz, '뜻 고르기'], [S.right, '맞히면 반짝!']]));
await render('shot-2-play.png', 1280, 720, 1, phones('네 가지 놀이', '뜻 고르기 · 철자 맞추기 · 듣고 쓰기 · 스피드 60초', [[S.answer, '예문과 외우는 꿀팁'], [S.spell, '철자 맞추기'], [S.listen, '듣고 쓰기']]));
await render('shot-3-review.png', 1280, 720, 1, phones('틀린 단어는 복습장으로', '1일, 3일, 7일, 14일 뒤에 다시 나와요', [[S.result, '퀴즈 결과와 도장'], [S.review, '복습장'], [S.stickers, '스티커 앨범 40장']]));

// A page of the cat teacher's many faces.
const cats = ['cat:teacher', 'cat:happy/crown', 'cat:excited/party', 'cat:proud/grad', 'cat:happy/chef', 'cat:teacher/doctor', 'cat:excited/helmet', 'cat:happy/bonnet',
  'cat:thinking+magnifier', 'cat:love+hearts', 'cat:determined+mountain', 'cat:calm+leaf', 'cat:wink/shades', 'cat:sad/bandage', 'cat:confused+puzzle', 'cat:sleepy+battery',
  'dog', 'rabbit', 'elephant', 'dinosaur', 'rocket', 'volcano', 'castle', 'eye'];
await render('shot-4-pictures.png', 1280, 720, 1, `
  <div style="position:absolute;left:0;right:0;top:26px;text-align:center">
    <div class="kr" style="font-size:44px">단어마다 뜻에 맞는 그림</div>
    <div style="font-size:21px;color:#6b5a78;margin-top:4px">어려운 단어는 표정과 소품이 다른 고양이 선생님이 보여 줘요</div>
  </div>
  <div style="position:absolute;left:96px;right:96px;top:138px;display:grid;grid-template-columns:repeat(8,1fr);gap:14px">
    ${cats.map((k) => `<div style="background:#fffdf7;border:3px solid #f0e2cc;border-radius:22px;display:flex;align-items:center;justify-content:center;height:166px" data-art="${k}" data-size="128"></div>`).join('')}
  </div>
  ${fill}`);

await browser.close();
