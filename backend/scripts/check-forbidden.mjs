/* global URL, console, process */

import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const forbidden = /\b(prisma|@prisma\/client|schema\.prisma)\b/i;
const allowed = new Set([
  'BACKEND_STARTER_PROMPT.md',
  'IMPLEMENTATION_PLAN.md',
  'package-lock.json',
  'scripts/check-forbidden.mjs',
]);

async function walk(directory) {
  const violations = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      violations.push(...(await walk(path)));
      continue;
    }
    const name = relative(root, path);
    if (allowed.has(name) || !['.ts', '.js', '.mjs', '.json', '.sql'].includes(extname(path)))
      continue;
    if (forbidden.test(await readFile(path, 'utf8'))) violations.push(name);
  }
  return violations;
}

const violations = await walk(root);
if (violations.length > 0) {
  console.error(`Forbidden ORM references found:\n${violations.join('\n')}`);
  process.exitCode = 1;
}
