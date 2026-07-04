import { describe, it, expect, vi } from 'vitest';
import { createDgmoCache, type RenderFn } from '../src/cache.js';
import { dgmoVitePlugin } from '../src/vite-plugin.js';

const stub: RenderFn = (source) =>
  Promise.resolve({ html: `<svg>${source.trim()}</svg>`, diagnostics: [] });

// The transform hook may be a plain function or an { handler } object depending
// on Vite's ObjectHook typing; normalize to a callable for the tests.
function getTransform(plugin: ReturnType<typeof dgmoVitePlugin>) {
  const t = plugin.transform;
  const fn = typeof t === 'function' ? t : t?.handler;
  if (!fn) throw new Error('no transform hook');
  return fn.bind({} as never) as (code: string, id: string) => Promise<unknown>;
}

describe('dgmoVitePlugin', () => {
  it('is an enforce:pre plugin', () => {
    const plugin = dgmoVitePlugin(createDgmoCache({}, stub));
    expect(plugin.enforce).toBe('pre');
    expect(plugin.name).toBe('vitepress-dgmo:warm-cache');
  });

  it('warms the cache for dgmo fences in .md files', async () => {
    const cache = createDgmoCache({}, stub);
    const transform = getTransform(dgmoVitePlugin(cache));
    const result = await transform('```dgmo\ngraph\nA -> B\n```', '/docs/x.md');
    // Returns nothing — pre-pass never rewrites the module.
    expect(result).toBeNull();
    // But the cache is now warm.
    expect(cache.get('graph\nA -> B', null)).toBe('<svg>graph\nA -> B</svg>');
  });

  it('ignores non-.md modules', async () => {
    const cache = createDgmoCache({}, stub);
    const transform = getTransform(dgmoVitePlugin(cache));
    await transform('```dgmo\ngraph\n```', '/src/app.ts');
    expect(cache.map.size).toBe(0);
  });

  it('ignores .md files with no dgmo fences', async () => {
    const spy = vi.fn(stub);
    const cache = createDgmoCache({}, spy);
    const transform = getTransform(dgmoVitePlugin(cache));
    await transform('```js\nconst x = 1\n```', '/docs/x.md');
    expect(spy).not.toHaveBeenCalled();
    expect(cache.map.size).toBe(0);
  });

  it('handles .md ids with a query suffix', async () => {
    const cache = createDgmoCache({}, stub);
    const transform = getTransform(dgmoVitePlugin(cache));
    await transform('```dgmo\ngraph\n```', '/docs/x.md?vue&type=script');
    expect(cache.get('graph', null)).toBeDefined();
  });
});
