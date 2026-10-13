// Draws the home-screen icons (the cat teacher on crayon paper) with headless Chromium.
//   node english/tools/icons.mjs
// Uses the Playwright that comes with the cloud session; elsewhere run `npm i playwright` first.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs'));
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff">
  <svg width="0" height="0" style="position:absolute"><filter id="wob" x="-6%" y="-6%" width="112%" height="112%">
    <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter></svg>
  <div id="icon"></div></body></html>`);
await page.addScriptTag({ path: path.join(root, 'js/art.js') });

for (const [name, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  await page.evaluate((size) => {
    const el = document.getElementById('icon');
    const cat = window.Art.svg('cat:teacher', Math.round(size * 0.62));
    const tile = (ch, x, y, r, bg, edge) => `<div style="position:absolute;left:${x * size}px;top:${y * size}px;width:${size * 0.17}px;height:${size * 0.17}px;
      transform:rotate(${r}deg);display:flex;align-items:center;justify-content:center;background:${bg};border:${size * 0.012}px solid ${edge};
      border-radius:${size * 0.04}px;font:700 ${size * 0.11}px 'Trebuchet MS',sans-serif;color:#4f3f5c">${ch}</div>`;
    el.style.cssText = `position:relative;width:${size}px;height:${size}px;overflow:hidden;
      background-color:#fff8ec;background-image:repeating-linear-gradient(115deg,rgba(79,63,92,.05) 0 ${size / 160}px,transparent ${size / 160}px ${size / 55}px)`;
    el.innerHTML = `<div style="position:absolute;left:${size * 0.12}px;top:${size * 0.14}px;width:${size * 0.76}px;height:${size * 0.76}px;border-radius:50%;background:#f3e8fb"></div>
      <div style="position:absolute;left:${size * 0.19}px;top:${size * 0.2}px">${cat}</div>
      ${tile('A', 0.11, 0.66, -10, '#ffe07a', '#b8932a')}${tile('B', 0.72, 0.62, 8, '#a6e3a0', '#5fae58')}`;
  }, size);
  await page.locator('#icon').screenshot({ path: path.join(root, 'icons', name) });
  console.log('icons/' + name);
}
await browser.close();
