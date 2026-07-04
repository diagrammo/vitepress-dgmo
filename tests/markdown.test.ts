import { describe, it, expect, vi, afterEach } from 'vitest';
import MarkdownIt from 'markdown-it';
import { createDgmoCache, type RenderFn } from '../src/cache.js';
import { registerDgmoFence, splitInfo, wrapVPre } from '../src/markdown.js';

const stub: RenderFn = (source) =>
  Promise.resolve({
    html: `<div class="dgmo dgmo--diagram"><div class="dgmo-light"><svg>${source.trim()}</svg></div></div>`,
    diagnostics: [],
  });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('splitInfo', () => {
  it('splits language from meta', () => {
    expect(splitInfo('dgmo showcase palette=slate')).toEqual({
      lang: 'dgmo',
      meta: 'showcase palette=slate',
    });
  });
  it('handles a bare language', () => {
    expect(splitInfo('dgmo')).toEqual({ lang: 'dgmo', meta: '' });
  });
});

describe('wrapVPre', () => {
  it('wraps html in a v-pre container', () => {
    expect(wrapVPre('<svg/>')).toBe('<div class="dgmo-vp" v-pre><svg/></div>');
  });
});

describe('registerDgmoFence', () => {
  it('returns the cached, v-pre-wrapped HTML for a dgmo fence', async () => {
    const cache = createDgmoCache({}, stub);
    await cache.warm('graph\nA -> B', null);

    const md = new MarkdownIt();
    registerDgmoFence(md, cache);

    const out = md.render('```dgmo\ngraph\nA -> B\n```');
    expect(out).toContain('v-pre');
    expect(out).toContain('<svg>graph\nA -> B</svg>');
    // markdown-it's default fenced <pre><code> must NOT be present.
    expect(out).not.toContain('<code');
  });

  it('matches the cache across markdown-it trailing-newline content', async () => {
    // Warm with the trimmed source; markdown-it feeds content with a trailing
    // newline. The trim-based key bridges the difference.
    const cache = createDgmoCache({}, stub);
    await cache.warm('graph', null);
    const md = new MarkdownIt();
    registerDgmoFence(md, cache);
    expect(md.render('```dgmo\ngraph\n```')).toContain('<svg>graph</svg>');
  });

  it('respects fence meta when computing the key', async () => {
    const cache = createDgmoCache({}, stub);
    // Only the showcase variant is warmed.
    await cache.warm('graph', 'showcase');
    const md = new MarkdownIt();
    registerDgmoFence(md, cache);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Matching meta -> hit.
    expect(md.render('```dgmo showcase\ngraph\n```')).toContain(
      '<svg>graph</svg>'
    );
    expect(warn).not.toHaveBeenCalled();
    // Different meta -> miss -> placeholder + warning.
    const miss = md.render('```dgmo diagram\ngraph\n```');
    expect(miss).toContain('dgmo--error');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('emits a placeholder and warns on a cache miss', () => {
    const cache = createDgmoCache({}, stub);
    const md = new MarkdownIt();
    registerDgmoFence(md, cache);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const out = md.render('```dgmo\nnever warmed\n```');
    expect(out).toContain('dgmo--error');
    expect(out).toContain('v-pre');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('delegates non-dgmo fences to the original renderer', () => {
    const cache = createDgmoCache({}, stub);
    const md = new MarkdownIt();
    registerDgmoFence(md, cache);

    const out = md.render('```js\nconst x = 1\n```');
    expect(out).toContain('<code');
    expect(out).toContain('const x = 1');
    expect(out).not.toContain('v-pre');
  });

  it('uses the renderToken fallback for a non-dgmo fence when there is no original rule', () => {
    // Defensive branch: markdown-it always ships a default fence rule, but if a
    // host removed it, our override must not crash — it delegates to
    // self.renderToken instead of the (absent) original.
    const cache = createDgmoCache({}, stub);
    const md = new MarkdownIt();
    delete md.renderer.rules.fence;
    registerDgmoFence(md, cache);
    expect(typeof md.render('```\nplain\n```')).toBe('string');
  });
});
