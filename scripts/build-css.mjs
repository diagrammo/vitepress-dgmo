#!/usr/bin/env node
// Generate dist/client.css from remark-dgmo/client.css at build time.
//
// VitePress's dark mode is signalled by `<html class="dark">` (its
// `useDark()` default), whereas remark-dgmo's base stylesheet keys the
// color-mode visibility rules on `[data-theme="dark"]`. We rewrite that
// selector at build time so consumers can `import 'vitepress-dgmo/client.css'`
// in their theme and get correct light/dark toggling with no manual override.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adaptClientCssToClassToggle } from 'remark-dgmo/client-css';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'dist/client.css');

const require = createRequire(import.meta.url);
const sourcePath = require.resolve('remark-dgmo/client.css');
const source = readFileSync(sourcePath, 'utf8');

// The single transform: `[data-theme="dark"]` → `html.dark`. Delegates to the
// shared `adaptClientCssToClassToggle` helper from remark-dgmo/client-css
// (default toggleSelector `html.dark`) so the rewrite stays in sync with the
// other host integrations instead of being hand-copied here.
//
// 🔴 Still needed after remark-dgmo 0.15.0, which added `html.dark` rules of
// its own — it added them for the two color-mode VISIBILITY rules only. The
// lightbox background and every `.dgmo-tok-*` source colour are still keyed on
// the attribute alone, so dropping this rewrite in favour of a verbatim copy
// costs a VitePress site its dark source panel and a light lightbox on a dark
// page. Tried and reverted 2026-08-26. The visible cost of keeping it is one
// duplicated pair of visibility rules in the output; that is intentional.
const adapted = adaptClientCssToClassToggle(source);

const banner =
  `/* vitepress-dgmo/client.css\n` +
  ` *\n` +
  ` * Generated from remark-dgmo/client.css at build time. Selectors of the\n` +
  ` * form \`[data-theme="dark"]\` are rewritten to \`html.dark\` for VitePress's\n` +
  ` * dark-mode convention (<html class="dark">). Do not edit manually —\n` +
  ` * change scripts/build-css.mjs instead.\n` +
  ` */\n\n`;

if (!existsSync(dirname(OUT))) mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, banner + adapted);
console.log(`✓ wrote ${OUT}`);
