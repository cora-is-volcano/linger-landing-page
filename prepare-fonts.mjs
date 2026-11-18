import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Verify the bundled Latin variable font before packaging the site.
const bytes = await readFile(new URL('./fonts/instrument-sans-latin.woff2', import.meta.url));
const digest = createHash('sha256').update(bytes).digest('hex');
if (digest !== '2ee17598a98d8a59e4df8152d015bec9ab8e4d5672cc0ab42bef806b568e3971') {
  throw new Error('The bundled Instrument Sans webfont is missing or has changed.');
}
console.log('Instrument Sans is ready.');
