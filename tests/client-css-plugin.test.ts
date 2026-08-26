import { describe, expect, it } from 'vitest';
import {
  CLIENT_CSS_SPECIFIER,
  dgmoClientCssPlugin,
} from '../src/client-css-plugin.js';
import { withDgmo } from '../src/index.js';

/** Call the plugin's `transform` without a Rollup plugin context. */
function transform(code: string, id: string) {
  const plugin = dgmoClientCssPlugin();
  const hook = plugin.transform as unknown as (
    code: string,
    id: string
  ) => { code: string } | null;
  return hook.call(null as never, code, id);
}

describe('dgmoClientCssPlugin (issue 507)', () => {
  it('adds the stylesheet to a compiled markdown module', () => {
    const out = transform('export default {}', '/docs/index.md');
    expect(out?.code).toContain(`import "${CLIENT_CSS_SPECIFIER}"`);
  });

  it('appends rather than prepends, so existing line numbers hold', () => {
    const code = 'const a = 1;\nconst b = 2;\nexport default {}';
    const out = transform(code, '/docs/index.md');
    expect(out?.code.startsWith(code)).toBe(true);
  });

  it('leaves non-markdown modules alone', () => {
    expect(transform('export default {}', '/docs/theme/index.ts')).toBeNull();
  });

  it('matches a markdown id carrying a Vite query suffix', () => {
    const out = transform('export default {}', '/docs/index.md?vue&type=script');
    expect(out?.code).toContain(CLIENT_CSS_SPECIFIER);
  });

  it('does not add a second import when the module already has one', () => {
    const code = `import '${CLIENT_CSS_SPECIFIER}';\nexport default {}`;
    expect(transform(code, '/docs/index.md')).toBeNull();
  });

  it('runs after VitePress’s own markdown transform', () => {
    expect(dgmoClientCssPlugin().enforce).toBe('post');
  });
});

describe('withDgmo wiring', () => {
  const names = (config: ReturnType<typeof withDgmo>) =>
    (config.vite?.plugins as { name: string }[]).map((p) => p.name);

  it('registers the stylesheet plugin by default', () => {
    expect(names(withDgmo())).toContain('vitepress-dgmo:client-css');
  });

  it('omits it under injectClientCss: false', () => {
    expect(names(withDgmo({}, { injectClientCss: false }))).not.toContain(
      'vitepress-dgmo:client-css'
    );
  });

  it('keeps the cache-warming pre-pass either way', () => {
    for (const options of [{}, { injectClientCss: false }]) {
      expect(names(withDgmo({}, options))).toContain(
        'vitepress-dgmo:warm-cache'
      );
    }
  });

  it('preserves plugins the site already had', () => {
    const config = withDgmo({ vite: { plugins: [{ name: 'theirs' }] } });
    expect(names(config)[0]).toBe('theirs');
  });
});
