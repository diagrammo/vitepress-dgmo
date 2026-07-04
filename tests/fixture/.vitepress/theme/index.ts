import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { setupDgmo } from 'vitepress-dgmo/client';
import 'vitepress-dgmo/client.css';

// Diagrams are fully rendered at build time, so this enhancement is optional.
// It adds viewBox tightening, theme-aware light/dark toggling, and wires the
// showcase copy / open-in-editor buttons — re-run on every SPA route change.
export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    setupDgmo(router);
  },
} satisfies Theme;
