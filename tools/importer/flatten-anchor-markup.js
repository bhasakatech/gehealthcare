#!/usr/bin/env node
/*
 * flatten-anchor-markup.js
 *
 * Guard for already-imported content/*.plain.html files: flattens nested inline
 * markup inside links to plain text. Anchors that wrap <u>/<strong>/<em>/<span>/
 * <br>/<b>/<i>/<mark>/<small> (e.g. "Download the form <u>here</u>") break
 * markdown link serialization and cause AEM package-creation failures. An anchor
 * that wraps an image/picture/svg is left intact (valid linked media).
 *
 * The cleanup transformer applies the same guard on fresh imports; this script
 * fixes content that was already imported.
 *
 * Usage: node tools/importer/flatten-anchor-markup.js [--dry-run] [file ...]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(scriptDir, '../..');
const JSDOM_PATH = process.env.JSDOM_PATH
  || '/home/node/.excat-marketplaces/excat-marketplace/edge-delivery-services/skills/block-collection-and-party/scripts/node_modules/jsdom/lib/api.js';
const { JSDOM } = await import(JSDOM_PATH);

const DRY_RUN = process.argv.includes('--dry-run');
const argFiles = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const NESTED = 'u, strong, em, span, br, b, i, mark, small';

function collect(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return collect(full);
    return e.name.endsWith('.plain.html') ? [full] : [];
  });
}

function processFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const dom = new JSDOM(raw);
  const { document } = dom.window;

  let flattened = 0;
  document.querySelectorAll('a').forEach((a) => {
    if (a.querySelector('img, picture, svg')) return; // linked media — keep
    if (a.querySelector(NESTED)) {
      a.textContent = a.textContent.replace(/\s+/g, ' ').trim();
      flattened += 1;
    }
  });

  if (flattened && !DRY_RUN) {
    const out = [...document.body.children].map((el) => el.outerHTML).join('\n');
    fs.writeFileSync(file, out);
  }
  return { file: path.relative(REPO_ROOT, file), flattened };
}

const CONTENT_DIR = path.join(REPO_ROOT, 'content');
const files = argFiles.length
  ? argFiles.map((f) => path.join(REPO_ROOT, f))
  : collect(CONTENT_DIR);

const results = files.map(processFile).filter((r) => r.flattened > 0);
console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Anchor-markup flatten:`);
if (!results.length) console.log('  (no nested-markup anchors found)');
results.forEach((r) => console.log(`  ${r.file}: ${r.flattened} anchor(s) flattened`));
