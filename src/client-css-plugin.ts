import type { Plugin } from 'vite';

const MD_ID = /\.md(\?.*)?$/;

/**
 * Adds `vitepress-dgmo/client.css` to every compiled `.md` module, so the
 * color-mode rules ship without the consumer wiring anything.
 *
 * 🔴 Why this exists. Under `colorMode: 'auto'` (the default) each fence
 * renders TWO SVGs, and the rule that hides the one you are not in lives only
 * in that stylesheet. It used to be a hand-written line in the consumer's
 * `.vitepress/theme/index.ts`, which people reasonably did not know to add —
 * and a site that skipped it printed the SAME diagram twice, stacked, with a
 * green build and nothing said anywhere (issue 507).
 *
 * 🔴 `enforce: 'post'` and APPEND, not prepend. Post so the module has already
 * been through VitePress's markdown→Vue transform and is JavaScript by the
 * time we see it — a raw `.md` file has nowhere to put an import. Append
 * because ESM hoists import declarations regardless of position, so adding one
 * at the end leaves every existing line where it was and the module's
 * sourcemap stays honest. Prepending would shift all of them by one.
 *
 * Importing the stylesheet by hand as well costs nothing: Vite resolves both
 * to a single module.
 */
export function dgmoClientCssPlugin(): Plugin {
  return {
    name: 'vitepress-dgmo:client-css',
    enforce: 'post',
    transform(code, id) {
      if (!MD_ID.test(id)) return null;
      if (code.includes(CLIENT_CSS_SPECIFIER)) return null;
      return {
        code: `${code}\nimport ${JSON.stringify(CLIENT_CSS_SPECIFIER)};\n`,
        map: null,
      };
    },
  };
}

/** The stylesheet this plugin adds. Exported so tests can assert on it. */
export const CLIENT_CSS_SPECIFIER = 'vitepress-dgmo/client.css';
