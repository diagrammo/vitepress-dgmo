import type MarkdownIt from 'markdown-it';
import type { DgmoCache } from './cache.js';

/**
 * Split a markdown-it fence info string into its language and the remaining
 * "meta" text, the same way the pre-pass scanner does: the first
 * whitespace-delimited word is the language, the trimmed remainder is the meta.
 */
export function splitInfo(info: string): { lang: string; meta: string } {
  const trimmed = info.trim();
  const spaceIdx = trimmed.search(/\s/);
  if (spaceIdx === -1) return { lang: trimmed, meta: '' };
  return {
    lang: trimmed.slice(0, spaceIdx),
    meta: trimmed.slice(spaceIdx + 1).trim(),
  };
}

/**
 * Wrap pre-rendered HTML so VitePress's Vue template compiler leaves it alone.
 *
 * VitePress compiles the HTML that markdown-it emits AS a Vue template, so raw
 * SVG — which routinely contains `{{`, `<`, `>` in text labels and paths —
 * would be mis-parsed as Vue interpolation/markup. The `v-pre` directive tells
 * Vue to skip compilation of the element and all its children, emitting them
 * verbatim.
 */
export function wrapVPre(html: string): string {
  return `<div class="dgmo-vp" v-pre>${html}</div>`;
}

/**
 * Phase 2 of the two-phase design: the synchronous markdown-it fence override.
 *
 * Registered via VitePress `markdown.config(md)`. It wraps the existing
 * `fence` rule: for a ```dgmo block it recomputes the cache key from
 * `token.content` + parsed meta and returns the HTML the async pre-pass warmed
 * (wrapped in a `v-pre` container). Any other language delegates to the
 * original fence renderer untouched.
 *
 * A cache miss "should not happen" in a normal build (the pre-pass sees every
 * `.md` module before its fences are rendered), but we degrade gracefully:
 * emit a visible placeholder and warn, rather than throw inside markdown-it.
 */
export function registerDgmoFence(md: MarkdownIt, cache: DgmoCache): void {
  const original = md.renderer.rules.fence;

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const { lang, meta } = splitInfo(token.info);

    if (lang !== 'dgmo') {
      if (original) return original(tokens, idx, options, env, self);
      return self.renderToken(tokens, idx, options);
    }

    const html = cache.get(token.content, meta || null);
    if (html !== undefined) return wrapVPre(html);

    // Defensive fallback: the block was never warmed. Should not happen when
    // the Vite pre-pass plugin is installed (withDgmo wires both together).
    console.warn(
      '[vitepress-dgmo] cache miss for a ```dgmo block — was the Vite pre-pass plugin registered? Falling back to a placeholder.'
    );
    return wrapVPre(
      '<div class="dgmo dgmo--error" role="alert"><strong>dgmo:</strong> diagram not pre-rendered (cache miss).</div>'
    );
  };
}
