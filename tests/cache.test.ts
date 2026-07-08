import { describe, it, expect, vi } from 'vitest';
import {
  createDgmoCache,
  neutralizeBakedStyles,
  type RenderFn,
} from '../src/cache.js';

const stub: RenderFn = (source, meta) =>
  Promise.resolve({
    html: `<div class="dgmo"><svg>${source}|${meta ?? ''}</svg></div>`,
    diagnostics: [],
  });

describe('createDgmoCache', () => {
  it('warms and returns rendered HTML', async () => {
    const cache = createDgmoCache({}, stub);
    await cache.warm('graph\nA -> B', null);
    expect(cache.get('graph\nA -> B', null)).toBe(
      '<div class="dgmo"><svg>graph\nA -> B|</svg></div>'
    );
  });

  it('returns undefined on a miss', () => {
    const cache = createDgmoCache({}, stub);
    expect(cache.get('nope', null)).toBeUndefined();
  });

  it('produces stable keys and tolerates trailing whitespace (trim)', () => {
    const cache = createDgmoCache({}, stub);
    // trailing newline (markdown-it fence content) hashes same as trimmed.
    expect(cache.keyOf('graph\nA -> B\n', null)).toBe(
      cache.keyOf('graph\nA -> B', null)
    );
  });

  it('different meta yields a different key', () => {
    const cache = createDgmoCache({}, stub);
    expect(cache.keyOf('x', 'showcase')).not.toBe(cache.keyOf('x', null));
  });

  it('different integration options yield a different key (salt)', () => {
    const a = createDgmoCache({ palette: 'slate' }, stub);
    const b = createDgmoCache({ palette: 'nord' }, stub);
    expect(a.keyOf('x', null)).not.toBe(b.keyOf('x', null));
  });

  it('option key order does not affect the key (stable stringify)', () => {
    const a = createDgmoCache({ palette: 'slate', mode: 'showcase' }, stub);
    const b = createDgmoCache({ mode: 'showcase', palette: 'slate' }, stub);
    expect(a.keyOf('x', null)).toBe(b.keyOf('x', null));
  });

  it('does not re-render an already-warmed key', async () => {
    const spy = vi.fn(stub);
    const cache = createDgmoCache({}, spy);
    await cache.warm('same', null);
    await cache.warm('same', null);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('caches an error card when the renderer throws', async () => {
    const boom: RenderFn = () => Promise.reject(new Error('kaboom'));
    const cache = createDgmoCache({}, boom);
    await cache.warm('bad', null);
    const html = cache.get('bad', null);
    expect(html).toContain('dgmo--error');
    expect(html).toContain('kaboom');
    expect(html).toContain('<pre>bad</pre>');
  });

  it('escapes html in the error card', async () => {
    const boom: RenderFn = () => Promise.reject(new Error('<script>'));
    const cache = createDgmoCache({}, boom);
    await cache.warm('a<b>c', null);
    const html = cache.get('a<b>c', null)!;
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('a&lt;b&gt;c');
  });

  it('honors className / legacyClassNames in the error card', async () => {
    const boom: RenderFn = () => Promise.reject(new Error('x'));
    const cache = createDgmoCache(
      { className: 'foo', legacyClassNames: ['legacy'] },
      boom
    );
    await cache.warm('bad', null);
    const html = cache.get('bad', null)!;
    expect(html).toContain('class="foo legacy foo--error"');
  });

  it('neutralizes inline <style> in warmed HTML so Vue keeps the geometry', async () => {
    // A baked-hover SVG: inline <style> followed by geometry that Vue would
    // otherwise drop during hydration.
    const bakedHover: RenderFn = () =>
      Promise.resolve({
        html:
          '<div class="dgmo-light"><svg viewBox="0 0 10 10">' +
          '<style>[data-branch]:hover{filter:saturate(1.4)}</style>' +
          '<rect/><g transform="translate(0, 40)"><line/></g></svg></div>',
        diagnostics: [],
      });
    const cache = createDgmoCache({}, bakedHover);
    await cache.warm('vc', null);
    const html = cache.get('vc', null)!;
    expect(html).not.toContain('<style>');
    expect(html).toContain('<desc class="dgmo-baked-css">');
    // CSS text preserved, geometry untouched.
    expect(html).toContain('[data-branch]:hover{filter:saturate(1.4)}');
    expect(html).toContain('<g transform="translate(0, 40)">');
  });
});

describe('neutralizeBakedStyles', () => {
  it('rewrites a bare inline <style> to an inert <desc>', () => {
    expect(neutralizeBakedStyles('<svg><style>a{color:red}</style></svg>')).toBe(
      '<svg><desc class="dgmo-baked-css">a{color:red}</desc></svg>'
    );
  });

  it('handles multiple <style> blocks (dual light/dark render)', () => {
    const out = neutralizeBakedStyles(
      '<svg><style>x{}</style></svg><svg><style>y{}</style></svg>'
    );
    expect(out).not.toContain('<style>');
    expect((out.match(/dgmo-baked-css/g) ?? []).length).toBe(2);
  });

  it('leaves HTML without inline <style> untouched', () => {
    const html = '<div class="dgmo"><svg><rect/></svg></div>';
    expect(neutralizeBakedStyles(html)).toBe(html);
  });
});
