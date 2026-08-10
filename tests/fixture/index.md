---
title: Diagrammo × VitePress
titleTemplate: false
description: Every DGMO diagram type, rendered at build time by vitepress-dgmo.
---

# vitepress-dgmo — All Chart Types

This page is the GitHub Pages demo for [`vitepress-dgmo`](https://github.com/diagrammo/vitepress-dgmo).
In CI it is replaced by `scripts/compose-showcase.mjs`, which fetches
[`all-chart-types.md`](https://github.com/diagrammo/dgmo-content/blob/main/examples/all-chart-types.md)
from `dgmo-content` — one `dgmo` fence per chart type. Everything below renders
at build time, as inline SVG, through the markdown-it fence override.

```dgmo showcase title="Hello, Diagrammo"
flowchart
[Start] -> [Render at build time] -> [Ship inline SVG]
```

## Maps

A `map` needs basemap outlines, and `@diagrammo/dgmo` reads nothing from disk on
its own. The pre-pass supplies them for every `dgmo` fence, so a map renders at
build time like any other chart type — no extra configuration in
`.vitepress/config.ts`.

```dgmo
map Port Calls

poi Denver
poi Miami
```
