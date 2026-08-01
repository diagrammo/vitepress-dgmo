# Changelog

## 0.5.0

**🔴 Live links: renamed keyword, renamed option, and now ON by default.** All
three arrive through `remark-dgmo` and all three are visible to a site that
upgrades and changes nothing.

The fence keyword is now `live-link`:

````md
```dgmo
live-link dgm_01HQ3RSTUV
```
````

`cloud <id>` no longer resolves — not deprecated, simply no longer a live link.
Same for `![[cloud:<id>]]`, which becomes `![[live-link:<id>]]`.

The option is `liveLink`, not `references`, and it resolves by default. Pass it
only to turn live links off:

```js
dgmo({ liveLink: { enabled: false } });
```

🔴 **A site that upgrades and does nothing will start fetching from
`api.diagrammo.app` at build time**, and a `.dgmo/references/` directory will
appear in the repository wanting to be committed. That is correct by design —
the cache belongs in your repo so a clean CI checkout never depends on our
uptime — but it is an unexplained directory until you know why it is there.

With live links off, a `live-link` fence now renders a small card naming the
diagram and linking through to it, plus a hover-revealed *"Show this diagram
here"* link to the guide and a build warning naming the option and the source
line. It is no longer an error block. See the
[live links guide](https://diagrammo.app/docs/live-links/).

`refresh` is unchanged and still defaults to `notify`, so the renderer stays out
of your bundle unless you ask for it.


**For VitePress specifically:** this package does not use the remark plugin, but
it does depend on `remark-dgmo` for the client runtime and `client.css`, so it
still needs the bump. Live-link resolution is a remark-plugin feature and is not
part of the VitePress pre-pass — what changes here is the shared client runtime
and stylesheet.

## 0.4.0

Bundled `@diagrammo/dgmo` bumped to `^0.54.0` — sankey emphasis directives (`highlight`/`dim`), working infra `default-rps`, a lighter `./completion` subpath, swimlane edge completions, consistent thousands separators, the infra async 2× downstream-load fix, surplus-value warnings, and the body `fill-tint` contrast fix. All legacy spellings still parse; no source changes required.

## 0.3.0

Bundled `@diagrammo/dgmo` bumped to `^0.53.0` and `remark-dgmo` to `^0.10.0` — language-consistency pass (decision #48). Embed toolbar moved from the diagram's top-right to bottom-right so it no longer collides with host chrome. All legacy spellings still parse; no source changes required.

## 0.2.10

Bundled `@diagrammo/dgmo` bumped to `^0.52.0` — fill-\* directive family (replaces solid-fill), outline mode across 20+ chart types, sankey SVG export fix.

## 0.2.9

dgmo 0.51.0 + remark-dgmo 0.9.0 — independent embed toolbar buttons, overlay toolbar, auto-collapse source.

## 0.2.8

Bumps `@diagrammo/dgmo` to `^0.50.2` and `remark-dgmo` to `^0.8.0`: transparent embed backgrounds by default + per-block `background: opaque` opt-out. map stays opaque automatically.

## 0.2.7

Tracks remark-dgmo 0.7.0 (live-tick countdown + clock charts) and `@diagrammo/dgmo` 0.50.0 (adds countdown, clock, bracket, goal chart types).

## 0.2.6

Bump remark-dgmo to `^0.6.0` (open diagrams in a full-screen lightbox). Standardize showcase page title and favicon.
