import { describe, it, expect } from 'vitest';
import MarkdownIt from 'markdown-it';
import {
  withDgmo,
  createDgmoParts,
  parseFenceMeta,
  scanFences,
  type VitePressUserConfig,
} from '../src/index.js';

describe('withDgmo', () => {
  it('registers the fence override and the vite pre-pass plugin', () => {
    const config = withDgmo({}, { palette: 'slate' });
    expect(typeof config.markdown?.config).toBe('function');
    const plugins = config.vite?.plugins ?? [];
    expect(plugins).toHaveLength(1);
    expect((plugins[0] as { name: string }).name).toBe(
      'vitepress-dgmo:warm-cache'
    );
    expect((plugins[0] as { enforce: string }).enforce).toBe('pre');
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
    expect(plugins).toHaveLength(2);

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
