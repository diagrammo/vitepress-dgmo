import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { setupDgmo } from 'vitepress-dgmo/client';
import 'vitepress-dgmo/client.css';
import DgmoBanner from './DgmoBanner.vue';

// Diagrams are fully rendered at build time, so this enhancement is optional.
// It adds viewBox tightening, theme-aware light/dark toggling, and wires the
// showcase copy / open-in-editor buttons — re-run on every SPA route change.
//
// The `layout-top` slot injects a Diagrammo brand top-bar above the whole
// theme (see DgmoBanner.vue), matching the other wrappers' Pages showcases.
export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(DgmoBanner),
    });
  },
  enhanceApp({ router }) {
    setupDgmo(router);
  },
} satisfies Theme;
