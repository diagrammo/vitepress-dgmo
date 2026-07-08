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
