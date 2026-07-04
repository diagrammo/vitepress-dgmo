import { describe, it, expect } from 'vitest';
import MarkdownIt from 'markdown-it';
import { createDgmoCache } from '../src/cache.js';
import { registerDgmoFence } from '../src/markdown.js';
import { dgmoVitePlugin } from '../src/vite-plugin.js';

// End-to-end through the REAL dgmo pipeline (no stub), on one small diagram, to
// prove the two phases actually cooperate: pre-pass warms -> fence override
// reads. Kept tiny so it stays fast.
describe('real render (integration)', () => {
  it('renders a real dgmo block end-to-end via the two phases', async () => {
    const cache = createDgmoCache({ palette: 'slate' });

    // Phase 1: the Vite pre-pass warms the cache from raw markdown.
    const plugin = dgmoVitePlugin(cache);
    const t = plugin.transform;
    const transform = (typeof t === 'function' ? t : t?.handler)!;
    await transform.call(
      {} as never,
      '```dgmo\ngraph\nA -> B\n```',
      '/docs/x.md'
    );

    // Phase 2: markdown-it fence override reads the warmed cache (sync).
    const md = new MarkdownIt();
    registerDgmoFence(md, cache);
    const out = md.render('```dgmo\ngraph\nA -> B\n```');

    expect(out).toContain('v-pre');
    expect(out).toContain('<svg');
    // colorMode defaults to 'auto' -> dual light/dark wrappers.
    expect(out).toContain('dgmo-light');
    expect(out).toContain('dgmo-dark');
  });
});
