import { describe, it, expect, vi } from 'vitest';
import { ReferenceBuildError } from 'remark-dgmo';
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

describe('the default renderer, on a fence that is a live link', () => {
  // Guards the wiring, not the resolution — remark-dgmo owns the latter. This
  // package went a whole release with `renderDgmoBlock` here, which fed the
  // share URL to the DGMO parser, and nothing failed because no test ever put a
  // live link through the real renderer.
  const ID = 'dgm_01HQ3';
  const stubFetch = vi.fn(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          id: ID,
          source: 'pie Revenue\n  Q1 40\n  Q2 60',
          dgmoVersion: '0.59.0',
          updatedAt: 4242,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )
  ) as unknown as typeof fetch;

  const memFs = () => {
    const files = new Map<string, string>();
    return {
      read: (p: string) => Promise.resolve(files.get(p) ?? null),
      write: (p: string, c: string) => {
        files.set(p, c);
        return Promise.resolve();
      },
    };
  };

  it('fetches the published diagram instead of parsing the URL', async () => {
    const cache = createDgmoCache({
      colorMode: 'light',
      liveLink: { enabled: true, fetchImpl: stubFetch, fs: memFs() },
    });
    await cache.warm(`https://online.diagrammo.app/d/${ID}`, null);
    const html = cache.get(`https://online.diagrammo.app/d/${ID}`, null)!;

    expect(html).toContain('<svg');
    expect(html).toContain(`data-dgmo-ref="${ID}"`);
    expect(html).not.toContain('dgmo--error');
  });
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

  it('fails the build — no error card — when a live link resolves to nothing', async () => {
    // The one exception to "a bad block never throws". An unresolvable pointer
    // deploys as a small red box naming an id, on a page nobody re-reads; a
    // build failure puts it in front of the person who can fix it.
    const gone: RenderFn = () =>
      Promise.reject(
        new ReferenceBuildError('no such diagram', 'dgm_01HQ3', {
          path: 'docs/index.md',
          line: 4,
        })
      );
    const cache = createDgmoCache({}, gone);
    await expect(cache.warm('live-link dgm_01HQ3', null)).rejects.toThrow(
      'no such diagram'
    );
    expect(cache.get('live-link dgm_01HQ3', null)).toBeUndefined();
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
