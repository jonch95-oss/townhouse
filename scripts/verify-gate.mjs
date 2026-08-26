/**
 * The gate stack, vertically. The width checks in verify-phase2 cannot see
 * crowding; this measures it against the real type and layout rules.
 */
import { launchChromium } from './lib/browser.mjs';
import { readFileSync } from 'node:fs';
const copy = readFileSync('src/data/copy.ts', 'utf8');
const pick = (k) => copy.match(new RegExp(`${k}:\\s*\\n?\\s*'([^']+)'`))[1];
const WORDS = ['TERRACOTTA', 'AND', 'BRICK'];

const r = []; const ok = (n, p, d) => { r.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d ? ` — ${d}` : ''}`); };
const b = await launchChromium();
console.log('viewport        headline   air above   btn -> secondary   verdict');
for (const [w, h, label] of [
  [650, 400, '650x400'], [844, 390, '844x390 phone LS'], [926, 428, '926x428 phone LS'],
  [650, 900, '650x900'], [768, 1024, '768x1024'], [1440, 900, '1440x900'],
]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(process.env.URL ?? 'http://localhost:4173/', { waitUntil: 'networkidle' });
  await p.waitForSelector('body.is-ready');
  await p.evaluate(() => document.fonts.ready);
  const m = await p.evaluate((d) => {
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.chrome').style.display = 'none';
    const g = document.createElement('div');
    g.className = 'intro';
    g.innerHTML = `
      <h1 class="intro__title" id="t">${d.words.join('<br>')}</h1>
      <p class="intro__body" id="b">${d.paragraph}</p>
      <div id="btn" style="display:inline-flex;align-items:center;height:4rem;padding-inline:1.35em;border:1px solid rgb(255 255 255/.4);border-radius:var(--radius-sm);font-size:var(--t-14);text-transform:uppercase">${d.primary}</div>
      <span class="intro__secondary uline-double" id="s">${d.secondary}</span>`;
    document.body.appendChild(g);
    const R = (id) => document.getElementById(id).getBoundingClientRect();
    const t = R('t'), btn = R('btn'), s = R('s');
    const line = parseFloat(getComputedStyle(document.getElementById('t')).lineHeight);
    return {
      size: Math.round(parseFloat(getComputedStyle(document.getElementById('t')).fontSize)),
      line: Math.round(line), airAbove: Math.round(t.top),
      gap: Math.round(s.top - btn.bottom),
      overlap: btn.bottom > s.top || t.top < 0,
      widest: Math.max(...['TERRACOTTA','AND','BRICK'].map((x) => { const e = document.getElementById('t'); const o = e.innerHTML; e.textContent = x; const wI = e.getBoundingClientRect().width; e.innerHTML = o; return wI; })),
      avail: window.innerWidth - parseFloat(getComputedStyle(document.documentElement).fontSize) * 4,
    };
  }, { words: WORDS, paragraph: pick('paragraph'), primary: pick('primary'), secondary: pick('secondary') });
  const tight = m.airAbove < m.line;
  const verdict = m.overlap ? 'OVERLAP' : tight ? 'tight' : 'ok';
  console.log(`${label.padEnd(16)} ${String(m.size).padStart(4)}px ${String(m.airAbove).padStart(9)}px ${String(m.gap).padStart(15)}px   ${verdict}`);
  ok(`${label}: no overlap`, !m.overlap);
  ok(`${label}: headline fits the width`, m.widest <= m.avail, `${Math.round(m.widest)}px into ${Math.round(m.avail)}px`);
  await p.close();
}
await b.close();
const f = r.filter((x) => !x).length;
console.log(`\n${r.length - f}/${r.length} checks passed`);
process.exit(f ? 1 : 0);
