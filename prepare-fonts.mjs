import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const fonts = new URL('./fonts/', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const instrument = await readFile(new URL('instrument-sans-latin.woff2', fonts));
if (hash(instrument) !== '2ee17598a98d8a59e4df8152d015bec9ab8e4d5672cc0ab42bef806b568e3971') {
  throw new Error('The bundled Instrument Sans webfont has changed.');
}

// The original hero uses Fontshare's Switzer. Obtain it from the foundry on a fresh checkout.
const target = new URL('Switzer-Variable.woff2', fonts);
const switzerHash = 'd1bf801ffb1a6096def70a7c532255722ad87d948b13a8a586e342f7091f8ee4';
let cached;
try {
  cached = await readFile(target);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (!cached || hash(cached) !== switzerHash) {
  const response = await fetch('https://cdn.fontshare.com/wf/HJHZ26OECMTXRH7JXPFC7EVIHDSLT2RA/LJRNLR7WCPF3PY3SZ7B2LHNUTQMFNCHL/4MCJYGQDIOOXHWSIIB2OYNDBEALJSOGN.woff2');
  if (!response.ok) throw new Error('Fontshare returned ' + response.status);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (hash(bytes) !== switzerHash) throw new Error('Unexpected Switzer webfont.');
  await writeFile(target, bytes);
}
console.log('Site fonts are ready.');
