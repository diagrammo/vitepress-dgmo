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

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Re-promote the inert `<desc class="dgmo-baked-css">` placeholders that the
 * warm-cache step swapped in for each SVG's baked hover `<style>` (see
 * `neutralizeBakedStyles` in ./cache.ts). We move the CSS back into a real
 * `<style>` element so the no-JS hover interactivity works again.
 *
 * Runs after hydration, so mutating the (v-pre, static) island is safe — Vue
 * will not re-diff it. Idempotent: each `<desc>` is consumed and removed, so a
 * second pass (SPA route change) finds nothing to do.
 */
function promoteBakedStyles(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('desc.dgmo-baked-css').forEach((desc) => {
    const svg = desc.closest('svg');
    if (svg) {
      const style = document.createElementNS(SVG_NS, 'style');
      style.textContent = desc.textContent ?? '';
      svg.insertBefore(style, svg.firstChild);
    }
    desc.remove();
  });
}

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
  // Initial paint (no-op during SSR). Promote baked-hover CSS first so the
  // `<style>` is in place before bindDgmo measures/tightens the SVG.
  promoteBakedStyles();
  bindDgmo();

  const previous = router.onAfterRouteChanged;
  router.onAfterRouteChanged = (to: string) => {
    previous?.(to);
    // Defer to the next frame so the freshly-navigated DOM is in place before
    // we measure/tighten SVGs.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        promoteBakedStyles();
        bindDgmo();
      });
    } else {
      promoteBakedStyles();
      bindDgmo();
    }
  };
}
