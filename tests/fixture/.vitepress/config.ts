import { defineConfig } from 'vitepress';
import { withDgmo } from 'vitepress-dgmo';

// GitHub Pages serves this demo under /vitepress-dgmo/. Locally (dev / plain
// build) `base` stays '/'. CI sets PAGES_BASE=/vitepress-dgmo (see pages.yml).
const base = process.env.PAGES_BASE || '/';

export default defineConfig(
  withDgmo(
    {
      base,
      lang: 'en-US',
      title: 'vitepress-dgmo',
      description:
        'Render Diagrammo (DGMO) diagrams from fenced ```dgmo code blocks in VitePress — at build time, as inline SVG.',
      cleanUrls: true,
      lastUpdated: false,
      themeConfig: {
        nav: [
          { text: 'All chart types', link: '/' },
          { text: 'npm', link: 'https://www.npmjs.com/package/vitepress-dgmo' },
        ],
        sidebar: [
          {
            text: 'Demo',
            items: [{ text: 'All chart types', link: '/' }],
          },
        ],
        socialLinks: [
          {
            icon: 'github',
            link: 'https://github.com/diagrammo/vitepress-dgmo',
          },
        ],
        footer: {
          message:
            'Every diagram on this page is rendered at build time by <code>vitepress-dgmo</code>.',
          copyright:
            'MIT · <a href="https://diagrammo.app">Diagrammo</a>',
        },
      },
    },
    // dgmo options — showcase mode adds syntax-highlighted source + copy +
    // open-in-editor chrome; colorMode auto (default) dual-renders light+dark.
    { palette: 'slate', mode: 'showcase' }
  )
);
