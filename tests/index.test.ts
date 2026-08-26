import { describe, it, expect, beforeEach, vi } from 'vitest';
import MarkdownIt from 'markdown-it';
import {
  withDgmo,
  createDgmoParts,
  parseFenceMeta,
  scanFences,
  resetRenderSetupNotice,
  type VitePressUserConfig,
} from '../src/index.js';

describe('withDgmo', () => {
  it('registers the fence override, the vite pre-pass, and the stylesheet', () => {
    const config = withDgmo({}, { palette: 'slate' });
    expect(typeof config.markdown?.config).toBe('function');
    const plugins = (config.vite?.plugins ?? []) as {
      name: string;
      enforce: string;
    }[];
    expect(plugins.map((p) => p.name)).toEqual([
      'vitepress-dgmo:warm-cache',
      'vitepress-dgmo:client-css',
    ]);
    // pre so the cache warms before VitePress's markdown transform, post so
    // the stylesheet import lands on a module that is already JavaScript
    expect(plugins.map((p) => p.enforce)).toEqual(['pre', 'post']);
  });

  it('preserves an existing markdown.config and vite.plugins', () => {
    let userCalled = false;
    const existingPlugin = { name: 'user-plugin' };
    const base: VitePressUserConfig = {
      title: 'Docs',
      markdown: {
        config() {
          userCalled = true;
        },
      },
      vite: { plugins: [existingPlugin] },
    };
    const config = withDgmo(base, {});

    // Passthrough of unrelated fields.
    expect(config['title']).toBe('Docs');
    // User's plugin kept, ours appended.
    const plugins = config.vite?.plugins ?? [];
    expect(plugins[0]).toBe(existingPlugin);
    expect(plugins).toHaveLength(3); // theirs, warm-cache, client-css

    // User's markdown.config still runs.
    const md = new MarkdownIt();
    config.markdown?.config?.(md);
    expect(userCalled).toBe(true);
    // And our fence override is installed.
    expect(md.render('```dgmo\ngraph\n```')).toContain('v-pre');
  });

  it('shares one cache between the plugin and the fence override', () => {
    const parts = createDgmoParts({});
    // Both artifacts exist and are distinct kinds.
    expect(typeof parts.dgmoMarkdown).toBe('function');
    expect(parts.dgmoVitePlugin.name).toBe('vitepress-dgmo:warm-cache');
  });

  it('re-exports parseFenceMeta from remark-dgmo', () => {
    expect(parseFenceMeta('showcase palette=slate title="Hi"')).toMatchObject({
      mode: 'showcase',
      palette: 'slate',
      title: 'Hi',
    });
  });

  it('re-exports scanFences', () => {
    expect(scanFences('```dgmo\ngraph\n```')[0].lang).toBe('dgmo');
  });
});

/**
 * Nothing on the config side can reach a VitePress theme, so `refresh: 'render'`
 * needs a second call only the site owner can make. Before this notice existed
 * the setting was accepted here and then dropped without a word.
 */
describe('refresh: render notice', () => {
  beforeEach(() => {
    resetRenderSetupNotice();
  });

  it('names the function and the module to import it from', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    withDgmo({}, { liveLink: { refresh: 'render' } });
    expect(info).toHaveBeenCalledOnce();
    const message = String(info.mock.calls[0]?.[0]);
    expect(message).toContain('setupDgmoRender');
    expect(message).toContain('vitepress-dgmo/client-render');
    info.mockRestore();
  });

  it('fires for createDgmoParts too, not only the wrapper', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    createDgmoParts({ liveLink: { refresh: 'render' } });
    expect(info).toHaveBeenCalledOnce();
    info.mockRestore();
  });

  it('says nothing on the default, or on an explicit notify', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    withDgmo();
    withDgmo({}, { liveLink: { refresh: 'notify' } });
    expect(info).not.toHaveBeenCalled();
    info.mockRestore();
  });

  it('warns once per build, not once per wrapped config', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    withDgmo({}, { liveLink: { refresh: 'render' } });
    withDgmo({}, { liveLink: { refresh: 'render' } });
    expect(info).toHaveBeenCalledOnce();
    info.mockRestore();
  });
});
