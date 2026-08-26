/**
 * The launch gate. Fails while any TK remains in the copy or legal content.
 *
 * It is EXPECTED to fail right now — every TK is a fact nobody has supplied.
 * That is the point: this is the thing that stops one shipping by accident.
 */
import { readFile } from 'node:fs/promises';

const FILES = ['src/data/copy.ts', 'src/data/legal.ts'];
const found = [];
for (const f of FILES) {
  const text = await readFile(f, 'utf8');
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/TK\(\s*'([^']+)'\s*\)/g)) found.push({ f, line: i + 1, what: m[1] });
  });
}

if (found.length === 0) {
  console.log('No TK markers. Copy is complete.');
  process.exit(0);
}
console.log(`${found.length} TK marker${found.length === 1 ? '' : 's'} outstanding — do not launch:\n`);
const byWhat = new Map();
for (const t of found) byWhat.set(t.what, (byWhat.get(t.what) ?? 0) + 1);
for (const [what, n] of [...byWhat].sort()) console.log(`  ${what}${n > 1 ? ` (×${n})` : ''}`);
console.log('\nSupply each from the client or the drawings. Do not estimate.');
process.exit(1);
