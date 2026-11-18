import { readFile, mkdir, copyFile, rm, writeFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const files = JSON.parse(await readFile(new URL('site-files.json', root), 'utf8'));
const output = new URL('_site/', root);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) {
  const destination = new URL(file, output);
  await mkdir(new URL('./', destination), { recursive: true });
  await copyFile(new URL(file, root), destination);
}
await writeFile(new URL('.nojekyll', output), '');
console.log(`Prepared ${files.length} website files in _site.`);
