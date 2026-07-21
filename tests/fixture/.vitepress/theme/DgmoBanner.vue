<script setup>
// Brand top-bar for the GitHub Pages chart-type showcase, injected into
// VitePress's `layout-top` slot. Markup + CSS are kept identical to the other
// wrappers' showcases (fumadocs / astro / nextra / docusaurus) so every Pages
// site reads as one branded family.
</script>

<template>
  <a
    class="dgmo-embed-banner"
    href="https://diagrammo.app"
    aria-label="Diagrammo — go to diagrammo.app"
  >
    <span class="dgmo-embed-banner__brand">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect x="11" y="8" width="22" height="39.5" rx="2.5" fill="#c0504d" />
        <rect x="11" y="52.5" width="22" height="22.1" rx="2.5" fill="#5b9357" />
        <rect x="11" y="79.6" width="22" height="12.4" rx="2.5" fill="#4f96c4" />
        <path fill="#3a9188" d="M45 11.12 A3 3 0 0 1 48.23 8.12 A42 42 0 0 1 86.52 43.65 A3 3 0 0 1 83.78 47.10 L72.76 47.92 A3 3 0 0 1 69.59 45.47 A25 25 0 0 0 47.68 25.14 A3 3 0 0 1 45 22.16 Z" />
        <path fill="#7d5ba6" d="M83.78 52.90 A3 3 0 0 1 86.52 56.35 A42 42 0 0 1 74.53 79.87 A3 3 0 0 1 70.13 79.67 L62.99 71.24 A3 3 0 0 1 63.12 67.23 A25 25 0 0 0 69.59 54.53 A3 3 0 0 1 72.76 52.08 Z" />
        <path fill="#cc7a33" d="M65.43 83.08 A3 3 0 0 1 64.27 87.32 A42 42 0 0 1 48.23 91.88 A3 3 0 0 1 45 88.88 L45 77.84 A3 3 0 0 1 47.68 74.86 A25 25 0 0 0 55.78 72.56 A3 3 0 0 1 59.63 73.69 Z" />
      </svg>
      <span class="dgmo-embed-banner__word">Diagrammo</span>
    </span>
    <span class="dgmo-embed-banner__msg">
      Turn plain text into diagrams — a live showcase of every chart type.
    </span>
    <span class="dgmo-embed-banner__cta">
      Get started<span class="dgmo-embed-banner__cta-long"> at diagrammo.app</span> →
    </span>
  </a>
</template>

<style>
/* Reserve a 48px strip at the very top: VitePress offsets its fixed nav, the
   sidebar, and the content by --vp-layout-top-height, so a fixed banner of the
   same height slots in cleanly with no overlap and no scroll-off. */
:root {
  --vp-layout-top-height: 48px;
}
.dgmo-embed-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--vp-layout-top-height);
  padding: 0 clamp(0.75rem, 3vw, 1.25rem);
  background: linear-gradient(90deg, #27333f 0%, #1c242e 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 2px 0 #3a9188;
  color: #e6edf3;
  font: 500 0.875rem/1.3 system-ui, -apple-system, 'Segoe UI', sans-serif;
  text-decoration: none;
  z-index: 100;
}
.dgmo-embed-banner:hover .dgmo-embed-banner__cta {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}
.dgmo-embed-banner__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.dgmo-embed-banner__brand svg {
  width: 26px;
  height: 26px;
  display: block;
}
.dgmo-embed-banner__word {
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.01em;
  color: #fff;
}
.dgmo-embed-banner__msg {
  color: #aeb9c4;
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dgmo-embed-banner__cta {
  flex-shrink: 0;
  margin-left: auto;
  white-space: nowrap;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  padding: 0.32rem 0.8rem;
  border-radius: 999px;
  transition:
    background 0.15s,
    border-color 0.15s;
}
@media (max-width: 720px) {
  .dgmo-embed-banner__msg {
    display: none;
  }
}
@media (max-width: 460px) {
  .dgmo-embed-banner__cta-long {
    display: none;
  }
}
</style>
