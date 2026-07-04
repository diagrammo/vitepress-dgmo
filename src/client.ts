// ============================================================
// vitepress-dgmo/client — optional browser enhancement
// ============================================================
//
// Diagrams are fully rendered at build time, so this is optional. It adds the
// same two niceties the other Diagrammo wrappers ship:
//
//   - viewBox tightening: shrink each SVG's viewBox to its real content bounds
//     (the exporter emits a generous box);
//   - showcase toolbar wiring: copy-to-clipboard + open-in-editor buttons.
//
// Both live in remark-dgmo's framework-neutral `bindDgmo()`, re-exported here.
// `bindDgmo()` is a no-op outside a real browser and is idempotent, so it is
// safe to call on every VitePress route change.

import { bindDgmo } from 'remark-dgmo/client.js';

export { bindDgmo };

/** Minimal structural mirror of VitePress's client `Router`. */
interface VitePressRouter {
  onAfterRouteChanged?: (to: string) => void;
}

/**
 * Wire `bindDgmo()` into a VitePress theme. Call from your custom theme's
 * `enhanceApp({ router })`:
 *
 * ```ts
 * // .vitepress/theme/index.ts
 * import DefaultTheme from 'vitepress/theme'
 * import { setupDgmo } from 'vitepress-dgmo/client'
 * import 'vitepress-dgmo/client.css'
 *
 * export default {
 *   extends: DefaultTheme,
 *   enhanceApp({ router }) {
 *     setupDgmo(router)
 *   },
 * }
 * ```
 *
 * Runs `bindDgmo()` on the initial load and after every client-side route
 * change (VitePress SPA navigation does not refire `DOMContentLoaded`).
 */
export function setupDgmo(router: VitePressRouter): void {
  // Initial paint (no-op during SSR).
  bindDgmo();

  const previous = router.onAfterRouteChanged;
  router.onAfterRouteChanged = (to: string) => {
    previous?.(to);
    // Defer to the next frame so the freshly-navigated DOM is in place before
    // we measure/tighten SVGs.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => bindDgmo());
    } else {
      bindDgmo();
    }
  };
}
