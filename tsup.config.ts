import { defineConfig } from 'tsup';

// Two entries:
//   - index: the server/build-time API (withDgmo, the Vite pre-pass plugin,
//     and the markdown-it fence override). Runs in Node during the VitePress
//     build, so `remark-dgmo` (and its `@diagrammo/dgmo` peer) stay external.
//   - client: the tiny browser enhancement (re-exports remark-dgmo's
//     `bindDgmo` + a VitePress router hook). Ships to the browser, but
//     `remark-dgmo/client.js` is itself external — VitePress resolves it from
//     node_modules at consumer build time.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
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
    'vite',
    'vitepress',
    'markdown-it',
  ],
});
