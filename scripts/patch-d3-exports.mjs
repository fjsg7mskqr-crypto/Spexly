#!/usr/bin/env node
/**
 * Patches d3 sub-packages with non-standard exports fields so Turbopack can resolve them.
 * d3-timer, d3-ease, etc. use a flat {"umd":"...","default":"..."} exports format
 * that Turbopack doesn't handle correctly. This adds the proper "." subpath.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packages = ['d3-timer', 'd3-ease', 'd3-interpolate', 'd3-color', 'd3-dispatch'];

for (const pkg of packages) {
  const pkgPath = resolve(root, 'node_modules', pkg, 'package.json');
  try {
    const raw = readFileSync(pkgPath, 'utf8');
    const json = JSON.parse(raw);

    if (json.exports && !json.exports['.']) {
      // Convert flat exports to proper subpath format
      json.exports = {
        '.': {
          import: json.exports.default || json.module || json.main,
          default: json.exports.default || json.module || json.main,
        },
      };
      writeFileSync(pkgPath, JSON.stringify(json, null, 2) + '\n');
      console.log(`Patched ${pkg} exports`);
    }
  } catch {
    // Package might not be installed yet, skip
  }
}
