import { mkdir, writeFile } from 'node:fs/promises';

// Obtain the unmodified official webfont. It is not redistributed in source.
const css = await fetch('https://api.fontshare.com/v2/css?f[]=switzer@1&display=swap');
if (!css.ok) throw new Error(`Fontshare stylesheet: ${css.status}`);
const match = (await css.text()).match(/url\(['"]?(\/\/cdn\.fontshare\.com\/[^)'"\s]+\.woff2)/);
if (!match) throw new Error('Official Switzer WOFF2 URL was not found.');
const font = await fetch(`https:${match[1]}`);
if (!font.ok) throw new Error(`Fontshare webfont: ${font.status}`);
const bytes = Buffer.from(await font.arrayBuffer());
if (bytes.subarray(0,4).toString() !== 'wOF2') throw new Error('Invalid WOFF2 response.');
const output = new URL('./fonts/Switzer-Variable.woff2', import.meta.url);
await mkdir(new URL('./fonts/', import.meta.url), { recursive: true });
await writeFile(output, bytes);
console.log('Official Switzer webfont is ready.');
