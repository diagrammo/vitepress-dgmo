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

  // A map is the one chart type that needs basemap outlines, and dgmo 0.62.0
  // stopped reading them off disk implicitly — `renderDgmoFence` has to supply
  // them. No fixture held a map fence, so the gap shipped unnoticed; this is the
  // test that would have caught it.
  it('renders a map with basemap data rather than the error card', async () => {
    const source = 'map Port Calls\n\npoi Denver\npoi Miami';
    const cache = createDgmoCache({ palette: 'slate' });

    const plugin = dgmoVitePlugin(cache);
    const t = plugin.transform;
    const transform = (typeof t === 'function' ? t : t?.handler)!;
    await transform.call(
      {} as never,
      '```dgmo\n' + source + '\n```',
      '/docs/map.md'
    );

    const md = new MarkdownIt();
    registerDgmoFence(md, cache);
    const out = md.render('```dgmo\n' + source + '\n```');

    expect(out).toContain('<svg');
    expect(out).toContain('Denver');
    expect(out).toContain('Miami');
    expect(out).not.toContain('no basemap data');
    expect(out).not.toContain("Couldn't render this diagram");
    expect(out).not.toContain('dgmo--error');
  });
});
