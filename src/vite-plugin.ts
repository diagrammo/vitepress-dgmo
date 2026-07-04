import type { Plugin } from 'vite';
import type { DgmoCache } from './cache.js';
import { scanFences } from './scan-fences.js';

const MD_ID = /\.md(\?.*)?$/;

/**
 * Phase 1 of the two-phase design: an async warm-cache pre-pass.
 *
 * A Vite plugin with `enforce: 'pre'` so its `transform` runs BEFORE
 * VitePress's own markdown→Vue transform on the same `.md` module. It scans the
 * raw markdown for ```dgmo fences, `await`s each block's render, and stashes the
 * resulting HTML in the shared cache. The markdown-it fence override (phase 2)
 * then reads that cache synchronously.
 *
 * The hook returns nothing — it never rewrites the module; its only job is to
 * warm the cache while it still can `await`.
 */
export function dgmoVitePlugin(cache: DgmoCache): Plugin {
  return {
    name: 'vitepress-dgmo:warm-cache',
    enforce: 'pre',
    async transform(code, id) {
      if (!MD_ID.test(id)) return null;
      const fences = scanFences(code).filter((f) => f.lang === 'dgmo');
      if (fences.length === 0) return null;
      await Promise.all(
        fences.map((f) => cache.warm(f.content, f.meta || null))
      );
      // Cache-warm only; leave the module untouched.
      return null;
    },
  };
}
