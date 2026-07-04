# vitepress-dgmo

Render [Diagrammo](https://diagrammo.app) (DGMO) diagrams from fenced `dgmo` code blocks in your [VitePress](https://vitepress.dev) docs — at build time, as inline SVG. No client-side rendering, no runtime diagram library shipped to readers.

````md
```dgmo
flowchart
[Start] -> [End]
```
````

## Why this package is different

The other Diagrammo docs integrations (`astro-dgmo`, `docusaurus-plugin-dgmo`, `fumadocs-dgmo`) are thin wrappers around the shared **`remark-dgmo`** plugin. VitePress does **not** use remark — it renders markdown with **markdown-it** — so that plugin can't be reused. `vitepress-dgmo` is a markdown-it integration built from scratch, sharing only dgmo's `render()` and the showcase CSS.

## Install

```bash
pnpm add -D vitepress-dgmo @diagrammo/dgmo
# or: npm i -D vitepress-dgmo @diagrammo/dgmo
```

`@diagrammo/dgmo` and `vitepress` are peer dependencies.

## Setup

### 1. Wrap your config

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress';
import { withDgmo } from 'vitepress-dgmo';

export default defineConfig(
  withDgmo(
    {
      title: 'My Docs',
      // ...the rest of your VitePress config
    },
    { palette: 'slate' } // dgmo options (optional)
  )
);
```

`withDgmo` registers **both** halves of the integration (see [How it works](#how-it-works)) while preserving any `markdown.config` and `vite.plugins` you already have.

### 2. (Optional) client enhancement + styles

Diagrams are fully rendered at build time, so this step is optional. It adds light/dark toggling styles, viewBox tightening, and showcase copy / open-in-editor buttons.

```ts
// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme';
import { setupDgmo } from 'vitepress-dgmo/client';
import 'vitepress-dgmo/client.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    setupDgmo(router); // re-tightens SVGs + wires buttons on every route change
  },
};
```

The stylesheet keys light/dark visibility on VitePress's `<html class="dark">` convention automatically.

## Usage in markdown

Write a fenced block with the `dgmo` language:

````md
```dgmo
sequence
Alice -> Bob
```
````

### Per-block options (fence meta)

Everything after `dgmo` on the fence line configures that block:

````md
```dgmo showcase palette=catppuccin theme=light title="Login flow"
flowchart
[User] -> [Login]
```
````

| Meta token                                                                  | Effect                                                    |
| --------------------------------------------------------------------------- | --------------------------------------------------------- |
| `showcase` / `diagram`                                                      | Output mode for this block (source + chrome vs SVG only). |
| `palette=<name>`                                                            | Palette for this block.                                   |
| `theme=light\|dark\|transparent`                                            | Theme (only when `colorMode` isn't `auto`).               |
| `colorMode=auto\|light\|dark`                                               | Color-mode strategy for this block.                       |
| `title="…"`                                                                 | Caption.                                                  |
| `noSource` / `source`, `noCopy` / `copy`, `noOpenInEditor` / `openInEditor` | Toggle showcase chrome.                                   |

## Options

Passed as the second argument to `withDgmo`. A subset of `remark-dgmo`'s `DgmoOptions`.

| Option                                         | Type                                 | Default                        | Description                                                              |
| ---------------------------------------------- | ------------------------------------ | ------------------------------ | ------------------------------------------------------------------------ |
| `palette`                                      | `string`                             | `'slate'`                      | Default palette name.                                                    |
| `theme`                                        | `'light' \| 'dark' \| 'transparent'` | `'dark'`                       | Default theme (only consulted when `colorMode` is not `auto`).           |
| `colorMode`                                    | `'auto' \| 'light' \| 'dark'`        | `'auto'`                       | `auto` dual-renders light + dark SVGs and toggles them via `client.css`. |
| `mode`                                         | `'diagram' \| 'showcase'`            | `'diagram'`                    | `showcase` adds syntax-highlighted source + copy + open-in-editor.       |
| `editorBaseUrl`                                | `string`                             | `https://online.diagrammo.app` | Base URL for the "Open in editor" link.                                  |
| `showSource` / `showCopy` / `showOpenInEditor` | `boolean`                            | mode-dependent                 | Fine-grained showcase chrome toggles.                                    |
| `className`                                    | `string`                             | `'dgmo'`                       | Outer wrapper class.                                                     |

## How it works

markdown-it's `renderer.rules.fence` is **strictly synchronous**, but dgmo's `render()` is **async**. `vitepress-dgmo` bridges that gap with a **two-phase design**, both halves sharing one cache:

1. **Async warm-cache pre-pass** — a Vite plugin (`enforce: 'pre'`) whose `transform` hook runs on every `.md` module _before_ VitePress compiles it. It scans the raw markdown for `dgmo` fences, `await`s `render()` for each (dual light + dark under `colorMode: auto`), sanitizes the SVG, and stores the resulting HTML in a cache keyed by a stable hash of `(source, meta, options)`. Render failures are cached as an inline error card, never thrown.

2. **Sync markdown-it fence override** — registered via VitePress's `markdown.config(md)`. For a `dgmo` fence it recomputes the same hash from the token and returns the pre-rendered HTML from the cache. Any other language delegates to the original fence renderer untouched.

Because both phases run for the same module in sequence (`pre` transform, then VitePress's markdown transform), the cache is always warm by the time the fence rule reads it. A cache miss (which shouldn't happen when `withDgmo` wires both halves) degrades to a visible placeholder plus a console warning rather than a crash.

### The `v-pre` guard

VitePress compiles the HTML that markdown-it emits **as a Vue template**. Raw SVG routinely contains `{{`, `<`, and `>` in text labels and path data, which Vue would mis-parse as interpolation or markup. So every rendered block is wrapped in `<div class="dgmo-vp" v-pre>…</div>` — the `v-pre` directive tells Vue to emit the element and all its children verbatim, skipping template compilation.

## Advanced: wire the two phases yourself

If you'd rather not let `withDgmo` merge your config, build a matched pair from one shared cache and place them yourself:

```ts
import { createDgmoParts } from 'vitepress-dgmo';

const { dgmoMarkdown, dgmoVitePlugin } = createDgmoParts({ palette: 'slate' });

export default defineConfig({
  markdown: { config: (md) => dgmoMarkdown(md) },
  vite: { plugins: [dgmoVitePlugin] },
});
```

Both **must** come from the same `createDgmoParts()` call — that shared cache is the whole mechanism.

## License

MIT © Demian Neidetcher
