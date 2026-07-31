# vitepress-dgmo

VitePress integration: renders ` ```dgmo ` fences to inline SVG at build time. Published unscoped as `vitepress-dgmo`.

## Not a remark host — but it still tracks remark-dgmo

VitePress renders markdown with **markdown-it, not remark**, so the `remark-dgmo` *plugin* is unusable here and this package never imports it. It nonetheless depends on `remark-dgmo` at runtime for three things: `renderDgmoBlock` (the actual render, in `src/cache.ts`), `bindDgmo` from `remark-dgmo/client.js`, and `dist/client.css` — generated from `remark-dgmo/client.css` by `scripts/build-css.mjs`. **That is why this package bumps alongside dgmo and remark-dgmo even though it is not a remark host.** It is the single most misunderstood thing here.

## The two-phase split

markdown-it's fence renderer is strictly synchronous; dgmo's `render()` is async. The bridge is a shared cache:

1. `src/vite-plugin.ts` — Vite `transform`, `enforce: 'pre'`, `await`s + warms every `dgmo` fence in each `.md`. Returns `null`; it never rewrites the module.
2. `src/markdown.ts` — the sync markdown-it fence override reads the warmed cache.

Both halves must share **one** cache instance — that is what `createDgmoParts()` / `withDgmo()` exist to guarantee. A miss warns and emits a placeholder rather than throwing inside markdown-it. The key is sha256 of `source.trim()` + `meta.trim()` + stable-stringified options; the pre-pass uses `src/scan-fences.ts`, not markdown-it (a devDependency only), and the trim is what makes two different tokenizers agree.

## Vue-specific transforms — do not copy these to the other wrappers

- Output is wrapped in `<div class="dgmo-vp" v-pre>`: VitePress compiles markdown-it's HTML as a Vue template, and SVG text/paths routinely contain `{{`, `<`, `>`.
- `neutralizeBakedStyles()` rewrites each inline `<style>` to `<desc class="dgmo-baked-css">`. Vue's `ignoreSideEffectTags` strips `<style>` **even inside `v-pre`**, and the resulting hydration mismatch silently blanks the diagram. `vitepress-dgmo/client`'s `promoteBakedStyles()` puts it back after hydration — ship both halves or neither.
- `scripts/build-css.mjs` rewrites `[data-theme="dark"]` → `html.dark` via remark-dgmo's `adaptClientCssToClassToggle`; VitePress signals dark mode with `<html class="dark">`.

## Dependency ranges — keep the two in step

`@diagrammo/dgmo` is declared **both** as a runtime dependency (`^0.56.0`) and as a peer (`>=0.56.0 <1`). Aligned 2026-07-31 in `989bc05`: the peer range had promised `>=0.45.0` while the runtime dependency pulled 0.56 regardless, and nothing checks a peer range against your own dependencies. A third declaration as a devDependency was deleted rather than aligned — pnpm ignores a devDependency for a package already listed as a runtime dependency, so it never reached the lockfile and could not flag the drift for six minors. tsup marks dgmo, remark-dgmo, vite, vitepress and markdown-it external.

## Commands

`pnpm build` (tsup + build-css; `postbuild` asserts `dist/client.css` and `dist/client.js` exist) · `pnpm test` (pretest builds) · `pnpm typecheck` · `pnpm lint`.

`tests/fixture/` is a real VitePress site consuming the package via `link:../..` — `cd tests/fixture && pnpm docs:dev` to look at output. `pages.yml` splices dgmo-content's `all-chart-types.md` into that fixture with `scripts/compose-showcase.mjs` and deploys to GitHub Pages; the rewritten page is built, never committed.
