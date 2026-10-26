import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('version sync updates the game label and check rejects drift without rewriting it', async () => {
  const root = await mkdtemp(join(tmpdir(), 'df-version-'));
  try {
    await mkdir(join(root, 'scripts')); await mkdir(join(root, 'dist'));
    const script = join(root, 'scripts/sync-version.mjs'), page = join(root, 'dist/index.html');
    await copyFile(new URL('../scripts/sync-version.mjs', import.meta.url), script);
    await writeFile(join(root, 'package.json'), JSON.stringify({ version:'1.2.3' }));
    const original='<span class="version" id="game-version">V1.0.0</span>';
    await writeFile(page, original);
    assert.notEqual(spawnSync(process.execPath,[script,'--check']).status,0);
    assert.equal(await readFile(page,'utf8'),original);
    assert.equal(spawnSync(process.execPath,[script]).status,0);
    assert.match(await readFile(page,'utf8'),/>V1\.2\.3</);
    assert.equal(spawnSync(process.execPath,[script,'--check']).status,0);
    await writeFile(page,'<p>Version label missing</p>');
    assert.notEqual(spawnSync(process.execPath,[script]).status,0);
    assert.equal(await readFile(page,'utf8'),'<p>Version label missing</p>');
  } finally { await rm(root,{recursive:true,force:true}); }
});
