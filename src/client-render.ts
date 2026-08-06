// ============================================================
// vitepress-dgmo/client-render — the opt-in re-render
// ============================================================
//
// The base client (`vitepress-dgmo/client`) NOTICES that a live-linked diagram
// has moved since the build and offers a small link to the current version.
// This is what re-draws it in place instead.
//
// Call it beside `setupDgmo`, and only if you also set
// `liveLink: { refresh: 'render' }` in your config — the two halves are one
// decision, and the config half cannot reach your theme:
//
//   // .vitepress/theme/index.ts
//   import DefaultTheme from 'vitepress/theme'
//   import { setupDgmo } from 'vitepress-dgmo/client'
//   import { setupDgmoRender } from 'vitepress-dgmo/client-render'
//   import 'vitepress-dgmo/client.css'
//
//   export default {
//     extends: DefaultTheme,
//     enhanceApp({ router }) {
//       setupDgmo(router)
//       setupDgmoRender()
//     },
//   }
//
// ## Why it is a separate module
//
// Because the renderer is large and the cost lands on the adopter, not on us. A
// bundler resolves a static-analyzable dynamic `import()` at BUILD time —
// "lazy" says when a reader downloads the renderer, never whether the site
// ships it. Naming it from `./client.ts`, which every consumer imports, would
// pull its graph into every consumer's build whether or not a diagram ever
// changes. In a module nobody imports by default, Vite can decline to follow
// it.
//
// ## Why the import is inside the function
//
// `remark-dgmo/client-render.js` exports nothing — it registers a renderer by
// running — so `import 'remark-dgmo/client-render.js'` is a side-effect import,
// which any bundler honouring that package's `sideEffects` field may delete
// outright. Measured with esbuild against remark-dgmo 0.14.0 on 2026-08-06: 75
// bytes of output, zero registrations, and no error anywhere. A dynamic import
// is a call that produces a value, so it survives, and Vite emits the renderer
// as its own chunk fetched only when a diagram has actually changed.

let started = false;

/**
 * Register the browser-side renderer, once. Safe to call on every route change
 * and safe to call during SSR, where it does nothing: the module it loads
 * touches `globalThis` and the DOM.
 */
export function setupDgmoRender(): void {
  if (started) return;
  if (typeof document === 'undefined') return;
  started = true;
  // Fire and forget. A failed load must leave the baked diagram exactly as it
  // is — the page was correct before this ran and stays correct if it never
  // finishes.
  void import('remark-dgmo/client-render.js').catch(() => {});
}
