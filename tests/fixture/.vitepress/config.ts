import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type DefaultTheme } from 'vitepress';
import { withDgmo } from 'vitepress-dgmo';
// VitePress derives heading anchor ids with the `slugify` from @mdit-vue/shared
// (bundled into its dist). Importing the same function keeps the derived
// sidebar links in lockstep with the anchors VitePress actually emits.
import { slugify } from '@mdit-vue/shared';

// GitHub Pages serves this demo under /vitepress-dgmo/. Locally (dev / plain
// build) `base` stays '/'. CI sets PAGES_BASE=/vitepress-dgmo (see pages.yml).
const base = process.env.PAGES_BASE || '/';

// Derive the sidebar from index.md at config-load time: each h2 becomes a
// group whose items are its h3s, all linking to on-page anchors. Works for
// both the committed fixture body (few headings) and the CI-composed showcase
// (scripts/compose-showcase.mjs rewrites index.md with dgmo-content's
// all-chart-types.md — h2 sections, h3 chart types). Headings inside fenced
// code blocks are ignored.
function deriveSidebar(): DefaultTheme.SidebarItem[] {
  const pagePath = fileURLToPath(new URL('../index.md', import.meta.url));
  const lines = readFileSync(pagePath, 'utf8').split('\n');

  // Mirror markdown-it-anchor's uniqueness rule: duplicate slugs get a
  // numeric suffix starting at -1.
  const seen = new Map<string, number>();
  const anchor = (text: string): string => {
    const slug = slugify(text);
    const n = seen.get(slug) ?? 0;
    seen.set(slug, n + 1);
    return n === 0 ? slug : `${slug}-${n}`;
  };

  const sidebar: DefaultTheme.SidebarItem[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const text = m[2];
    const link = `/#${anchor(text)}`;
    const group = sidebar[sidebar.length - 1];
    if (m[1].length === 2) {
      sidebar.push({ text, link, collapsed: false, items: [] });
    } else if (group?.items) {
      group.items.push({ text, link });
    } else {
      // h3 before any h2 — surface it as a top-level entry.
      sidebar.push({ text, link });
    }
  }

  // Committed fixture body has no h2/h3 headings — keep a minimal sidebar so
  // local dev still shows navigation.
  if (sidebar.length === 0) {
    return [{ text: 'Demo', items: [{ text: 'All chart types', link: '/' }] }];
  }
  return sidebar;
}

export default defineConfig(
  withDgmo(
    {
      base,
      lang: 'en-US',
      title: 'Diagrammo × VitePress',
      head: [
        ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
        ['link', { rel: 'alternate icon', href: `${base}favicon.ico`, sizes: 'any' }],
      ],
      description:
        'Render Diagrammo (DGMO) diagrams from fenced ```dgmo code blocks in VitePress — at build time, as inline SVG.',
      cleanUrls: true,
      lastUpdated: false,
      themeConfig: {
        nav: [
          { text: 'All chart types', link: '/' },
          { text: 'npm', link: 'https://www.npmjs.com/package/vitepress-dgmo' },
        ],
        outline: { level: [2, 3], label: 'On this page' },
        sidebar: deriveSidebar(),
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
