import { cp, mkdir, rm, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const entry of ['index.html', 'styles.css', 'app.js', 'config.js', '.nojekyll']) await cp(path.join(root, entry), path.join(out, entry));
for (const directory of ['fonts', 'images', 'videos']) {
  const from = path.join(root, 'assets', directory);
  const to = path.join(out, 'assets', directory);
  await mkdir(to, { recursive: true });
  const names = await readdir(from).catch((error) => {
    if (directory === 'videos' && error.code === 'ENOENT') return [];
    throw error;
  });
  for (const name of names) {
    if (directory === 'fonts' && !['SpaceGrotesk.woff2', 'PretendardUI.woff2', 'Pretendard-LICENSE.txt', 'SpaceGrotesk-LICENSE.txt'].includes(name)) continue;
    if (directory === 'images' && name.endsWith('.jpg')) continue;
    await cp(path.join(from, name), path.join(to, name));
  }
}
console.log('Static showroom built: dist/');
