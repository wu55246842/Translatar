import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const source = resolve(root, 'manifest.json');
const distDir = resolve(root, 'dist');
const target = resolve(distDir, 'manifest.json');

await mkdir(distDir, { recursive: true });
await copyFile(source, target);
console.log('Copied manifest.json to dist/manifest.json');
