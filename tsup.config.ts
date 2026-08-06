import { defineConfig } from 'tsup';

// Two entries:
//   - index: the server/build-time API (withDgmo, the Vite pre-pass plugin,
//     and the markdown-it fence override). Runs in Node during the VitePress
//     build, so `remark-dgmo` (and its `@diagrammo/dgmo` peer) stay external.
//   - client: the tiny browser enhancement (re-exports remark-dgmo's
//     `bindDgmo` + a VitePress router hook). Ships to the browser, but
//     `remark-dgmo/client.js` is itself external — VitePress resolves it from
//     node_modules at consumer build time.
//   - client-render: the opt-in re-render for live links. Its own entry so a
//     site that has not asked for it never has the renderer in its graph.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    'client-render': 'src/client-render.ts',
  },
  format: ['esm'],
  // Build-only tsconfig (rootDir: ./src, no tests/) so tsc's declaration
  // emit doesn't trip over the tests/ tree.
  tsconfig: './tsconfig.build.json',
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20',
  external: [
    '@diagrammo/dgmo',
    'remark-dgmo',
    'remark-dgmo/client.js',
    // Left for the consumer's bundler to resolve, exactly like client.js —
    // Vite then emits it as the lazy chunk a reader fetches only when a
    // live-linked diagram has actually moved.
    'remark-dgmo/client-render.js',
    'vite',
    'vitepress',
    'markdown-it',
  ],
});
