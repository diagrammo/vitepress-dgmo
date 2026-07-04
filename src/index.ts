// ============================================================
// vitepress-dgmo — Public API
// ============================================================
//
// VitePress integration for rendering DGMO diagrams from fenced ```dgmo code
// blocks at build time.
//
// VitePress renders markdown with markdown-it, NOT remark — so this package
// cannot reuse the `remark-dgmo` plugin the way astro/docusaurus/fumadocs do.
// markdown-it's fence renderer is strictly synchronous, but dgmo's `render()`
// is async. The bridge is a two-phase design:
//
//   1. A Vite `transform` pre-pass (enforce: 'pre') scans each `.md` module and
//      `await`s + caches the render of every ```dgmo block.  (./vite-plugin.ts)
//   2. A synchronous markdown-it fence override reads the warmed cache and
//      returns the pre-rendered SVG HTML, wrapped in `v-pre`.  (./markdown.ts)
//
// `withDgmo(config, options)` wires both into a VitePress config in one call.

import type MarkdownIt from 'markdown-it';
import type { DgmoOptions } from 'remark-dgmo';
import { createDgmoCache } from './cache.js';
import { dgmoVitePlugin } from './vite-plugin.js';
import { registerDgmoFence } from './markdown.js';

/**
 * Integration options — a subset of remark-dgmo's `DgmoOptions`. All are
 * optional; sensible defaults come from remark-dgmo (`palette: 'slate'`,
 * `colorMode: 'auto'`, `mode: 'diagram'`, editor at online.diagrammo.app).
 * Per-block overrides go in the fence info string, e.g.
 * ` ```dgmo showcase palette=catppuccin title="Login flow" `.
 */
export type VitePressDgmoOptions = DgmoOptions;

/**
 * Minimal structural mirror of VitePress's `UserConfig`. We only read/augment
 * `markdown.config` and `vite.plugins`; everything else is passed through
 * untouched. Typed loosely on purpose so this composes with `defineConfig(...)`
 * without pinning to VitePress's internal types (which churn across minors).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VitePressUserConfig = Record<string, any> & {
  markdown?: {
    config?: (md: MarkdownIt) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  vite?: {
    plugins?: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
};

/**
 * Paired primitives, exported for users who prefer to wire the two phases by
 * hand (e.g. an existing `markdown.config` they don't want to wrap). Both must
 * share the SAME cache instance — that's the whole point of the pattern — so
 * build them together via `createDgmoParts()`.
 */
export interface DgmoParts {
  /** Register the markdown-it fence override (phase 2). */
  dgmoMarkdown: (md: MarkdownIt) => void;
  /** The Vite pre-pass plugin (phase 1). Push into `vite.plugins`. */
  dgmoVitePlugin: import('vite').Plugin;
}

/**
 * Build a matched `{ dgmoMarkdown, dgmoVitePlugin }` pair backed by one shared
 * cache. Prefer `withDgmo` unless you need to place the pieces yourself.
 */
export function createDgmoParts(options: VitePressDgmoOptions = {}): DgmoParts {
  const cache = createDgmoCache(options);
  return {
    dgmoMarkdown: (md: MarkdownIt) => registerDgmoFence(md, cache),
    dgmoVitePlugin: dgmoVitePlugin(cache),
  };
}

/**
 * Wrap a VitePress config so ```dgmo fenced blocks render to inline SVG at
 * build time. Registers BOTH the markdown-it fence override and the Vite
 * pre-pass plugin (sharing one cache), preserving any existing
 * `markdown.config` and `vite.plugins` the user already set.
 *
 * ```ts
 * // .vitepress/config.ts
 * import { defineConfig } from 'vitepress'
 * import { withDgmo } from 'vitepress-dgmo'
 * export default defineConfig(withDgmo({ /* vitepress config *\/ }, { palette: 'slate' }))
 * ```
 */
export function withDgmo(
  config: VitePressUserConfig = {},
  options: VitePressDgmoOptions = {}
): VitePressUserConfig {
  const { dgmoMarkdown, dgmoVitePlugin: vitePlugin } = createDgmoParts(options);

  const userMarkdownConfig = config.markdown?.config;
  const existingPlugins = config.vite?.plugins ?? [];

  return {
    ...config,
    markdown: {
      ...config.markdown,
      config(md: MarkdownIt) {
        // Preserve the user's own markdown-it customizations first, then add
        // our fence override on top.
        userMarkdownConfig?.(md);
        dgmoMarkdown(md);
      },
    },
    vite: {
      ...config.vite,
      plugins: [...existingPlugins, vitePlugin],
    },
  };
}

// Re-export the option types + the fence-meta parser from remark-dgmo so
// consumers have one import surface.
export type { DgmoOptions, Mode, Theme } from 'remark-dgmo';
export { parseFenceMeta } from 'remark-dgmo';
export type { BlockOptions } from 'remark-dgmo';

// Lower-level primitives, exported for advanced use / testing.
export { createDgmoCache } from './cache.js';
export type { DgmoCache, RenderFn } from './cache.js';
export { registerDgmoFence, splitInfo, wrapVPre } from './markdown.js';
export { dgmoVitePlugin } from './vite-plugin.js';
export { scanFences } from './scan-fences.js';
export type { ScannedFence } from './scan-fences.js';
