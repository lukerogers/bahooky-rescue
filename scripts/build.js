import { cp, mkdir, rm, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of ['index.html', 'styles.css', 'manifest.webmanifest', 'sw.js', 'src', 'assets']) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}

// Any site change creates a new offline snapshot, without manual cache bumps.
const hash = createHash('sha256');
async function hashDirectory(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await hashDirectory(filename);
    else {
      hash.update(path.relative(output, filename).split(path.sep).join('/'));
      hash.update(await readFile(filename));
    }
  }
}
await hashDirectory(output);
const workerPath = path.join(output, 'sw.js');
const worker = await readFile(workerPath, 'utf8');
await writeFile(workerPath, worker.replace(/const VERSION = '[^']+';/, `const VERSION = '${hash.digest('hex').slice(0, 16)}';`));

console.log('Built static site in dist/');
