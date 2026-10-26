import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)) throw new Error('Invalid package version');
const page = new URL('dist/index.html', root);
const html = await readFile(page, 'utf8');
const marker = /(<span\b[^>]*\bid="game-version"[^>]*>)[^<]*(<\/span>)/g;
if ([...html.matchAll(marker)].length !== 1) throw new Error('Expected one game-version label');
const updated = html.replace(marker, (_, open, close) => `${open}V${version}${close}`);
if (process.argv.includes('--check')) {
  if (updated !== html) throw new Error('Game version is stale. Run npm run version:sync.');
} else if (updated !== html) {
  await writeFile(page, updated);
}
console.log(`Game version: ${version}`);
