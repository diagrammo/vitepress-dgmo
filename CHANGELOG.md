# Changelog

## 0.7.4

**Diagrams were blank in dark mode on a Tailwind v4 site.** A dual-render fence
ships a light SVG and a dark one and lets the stylesheet pick; the dark wrapper
carried the `hidden` attribute so a site that never loaded the stylesheet showed
one diagram rather than two. Tailwind v4's preflight hides `[hidden]` with
`!important` from inside `@layer base`, and for important declarations a layered
rule outranks an unlayered one at any specificity — so the reveal could not win
at any strength, and the block collapsed to a zero-height empty box.

Tracks `@diagrammo/dgmo` 0.82.0 and `remark-dgmo` 0.15.4, which hide the dark
wrapper with an inline `display: none` and reveal it with `!important`. **If you
wrote your own color-mode selector**, add `!important` to your `display: block`
rule — an inline declaration outranks every normal author rule.

## 0.7.3

**Verified against `@diagrammo/dgmo` 0.81.0 and `remark-dgmo` 0.15.3.** The
`remark-dgmo` dependency moves to `>=0.15.3 <1` and the `@diagrammo/dgmo` range
this package builds against to `>=0.81.0 <1`. Those moves are the release: a
range that is already satisfied is never re-resolved, so the last version was
built and tested against what it happened to have installed rather than against
what this workspace publishes.

What 0.81.0 brings to a rendered page: boxes-and-lines arrowheads are no longer
painted at the node centres under the boxes they point at, an edge label lands
on the line it names, a two-way pair of edges stops drawing as an X, `color:`
on an edge reaches the stroke, and a numbered heatmap row label is read as a
label rather than the row's first value.

## 0.7.2

**Verified against `@diagrammo/dgmo` 0.79.0 and `remark-dgmo` 0.15.2.** The
`remark-dgmo` dependency moves to `>=0.15.2 <1` and the `@diagrammo/dgmo` range
this package builds against to `>=0.79.0 <1`. Those moves are the release: a
range that is already satisfied is never re-resolved, so the last version was
still being built and tested against 0.77.0.

Nothing in this package's own source changes. What readers get is three
releases of the library. Every chart type was brought onto one visual language,
so a border, a shadow and a type weight mean the same thing wherever they
appear — which included making the error card's docs link bold, the one
declaration `remark-dgmo`'s stylesheet copy had drifted on. A group line can
carry a tag value and the group's frame takes that value's colour, in
boxes-and-lines, infra, kanban, c4, state and pert; a c4 diagram now names a
tag group nobody has switched to instead of drawing it as nothing at all; and a
long identifier wraps where a reader would break it — after an underscore or
hyphen, and between the words of camelCase — rather than being chopped
mid-word.

### Changed

- Formatting only, across the files that had drifted from Prettier, and
  `format:check` now runs on every push so the next drift fails there instead
  of accumulating.

## 0.7.0

**Verified against `@diagrammo/dgmo` 0.76.0 and `remark-dgmo` 0.15.0.** The
`remark-dgmo` dependency moves to `^0.15.0` — on a `0.x` version a caret locks
the minor, so `^0.14.7` would have kept every consumer on the old stylesheet.
The `@diagrammo/dgmo` range stays at `>=0.61.0 <1` and its lockfile entry was
refreshed onto 0.76.0: 0.76.0 is what emits the dark wrapper's `hidden`
attribute, but a site on an older dgmo still toggles correctly through the
stylesheet, so there is no reason to push a version requirement onto consumers.

### Fixed

- **`withDgmo` adds the color-mode stylesheet to every page — a site that never
  edited its theme file no longer renders each diagram twice.** Under the
  default `colorMode: 'auto'` every fence produces two SVGs, light and dark,
  and `vitepress-dgmo/client.css` is the only thing hiding the one you are not
  in. Importing it was a hand-written line in `.vitepress/theme/index.ts`,
  filed under an "(Optional)" heading, so a site that skipped it printed the
  same diagram twice, stacked, on a green build with no warning anywhere.

### Added

- **`injectClientCss`** (default `true`). Set `false` if you ship your own copy
  of the color-mode rules. Importing the stylesheet yourself as well is
  harmless — Vite resolves both to one module.
- `dgmoClientCssPlugin`, exported for sites that place the Vite plugins
  themselves rather than going through `withDgmo`. It runs `enforce: 'post'`
  so the `.md` module has already been through VitePress's markdown→Vue
  transform and is JavaScript by the time the import is added, and it appends
  rather than prepends, so existing line numbers and sourcemaps are untouched.

### Changed

- `tests/fixture/.vitepress/theme/index.ts` no longer imports the stylesheet,
  so the fixture build is now proving the injection rather than the theme file.
- `scripts/build-css.mjs` documents why its `[data-theme="dark"]` → `html.dark`
  rewrite survives remark-dgmo 0.15.0 adding `html.dark` rules of its own: 0.15.0
  added them for the two visibility rules only, while the lightbox background and
  every `.dgmo-tok-*` source colour are still keyed on the attribute alone.
  Replacing the rewrite with a verbatim copy was tried and reverted — it costs a
  VitePress site its dark source panel and gives it a light lightbox on a dark page.

## 0.6.9

**Verified against `@diagrammo/dgmo` 0.75.0 and `remark-dgmo` 0.14.7.** The `@diagrammo/dgmo` range stays at
`>=0.61.0 <1` and its lockfile entry was refreshed onto 0.75.0 by hand, because
a satisfied range is never re-resolved and raising that floor would push a
version requirement onto consumers for no reason. A caret would be worse still —
on a `0.x` version it locks the minor, so `^0.75.0` would exclude 0.76.
The `remark-dgmo` dependency moves to `^0.14.7`, so what the fixture builds
against is what this release was checked on — a range that already matches what
is installed is never re-resolved, which is the only reason a declaration has to
move at all.

Nothing in this package's own source changes. What readers get is dgmo 0.75.0:
a PERT chart no longer draws its Summary card, stating its headline once in the
subtitle instead, and a collapsed sequence group's corners no longer blob.

## 0.6.8

The NUL separator is written as an escape rather than as a literal byte, and
the class it guards is guarded (#348). The test fixture's favicon catches up
with the rest of the workspace (#349).

## 0.6.7

**Verified against `@diagrammo/dgmo` 0.72.0 and `remark-dgmo` 0.14.5.** The
`remark-dgmo` dependency moves to `^0.14.5`; the `@diagrammo/dgmo` range stays
at `>=0.61.0 <1` and its lockfile entry was refreshed onto 0.72.0 by hand,
because a satisfied range is never re-resolved and raising that floor would
push a version requirement onto consumers for no reason. A caret would be worse
still — on a `0.x` version it locks the minor, so `^0.72.0` would exclude 0.73.

## 0.6.6

**Verified against `@diagrammo/dgmo` 0.71.0 and `remark-dgmo` 0.14.4 — the
versions this package had stopped installing without anyone noticing.** The
declared ranges already admitted both, and that is precisely the problem: a
lockfile entry that already satisfies its range is never re-resolved, so a plain
install went on handing this repo dgmo 0.66.0 and remark-dgmo 0.14.3 through
five dgmo minors. The build, the tests and the typecheck were all green against
renderers nobody was shipping.

Refreshing the lockfile is the whole change. `pnpm install` cannot do it — it
takes `pnpm update` naming the two packages, and the check that it worked is
reading the version out of `node_modules`, not out of the lockfile or the
declared range.

The declared dependency and peer ranges are deliberately unchanged. Those floors
are set by which `@diagrammo/dgmo` subpaths this package and `remark-dgmo`
import, no import moved, and raising a floor for no reason forces every consumer
onto a newer renderer than the code actually needs.

## 0.6.5

**The first release published by GitHub Actions rather than from a laptop.**
Nothing in the package changed — this version exists to exercise the new publish
path end to end, and it is the first `vitepress-dgmo` tarball to carry a
provenance attestation, which npm can only issue to a build it ran itself.

The release now authenticates over npm trusted publishing: the workflow proves
which repository it is running in and is handed a credential valid for that run
alone, so no long-lived token is involved at any point. The credential the
previous releases used is a bypass-2FA token, and npm removes direct publish
from those in January 2027.

## 0.6.4

**The licence names the company that now publishes this.** Diagrammo LLC
exists as of August 2026, so the copyright line in `LICENSE` and the author
field in `package.json` name it rather than an individual. Both ship inside
the npm tarball, which is why this is a release rather than a repository
tidy-up. No code changed.

## 0.6.3

🔴 **The `@diagrammo/dgmo` peer floor rises to `>=0.61.0 <1`, correcting a range
this package could not honour.**

It advertised `>=0.60.0 <1` while depending on `remark-dgmo ^0.14.0`, which now
resolves to 0.14.2 — and that imports `parseCloudReferenceFence`, which first
ships in dgmo **0.61.0**. So a site pinned to dgmo 0.60.x installed a combination
this package called supported, and got a module-resolution error:

```
SyntaxError: The requested module '@diagrammo/dgmo/cloud-reference'
does not provide an export named 'parseCloudReferenceFence'
```

npm cannot catch this — nothing validates a peer range against the peers of your
own dependencies — so stating the floor correctly is the only fix. Found
2026-08-06, when it took down a showcase build.

Here the range moves in **both** places — `@diagrammo/dgmo` is declared as a
runtime dependency as well as a peer, and raising one alone re-creates the same
class of mismatch this release exists to remove.

The `remark-dgmo` dependency moves to `^0.14.2` in the same breath, and the
test fixture is repinned off dgmo 0.60.0, which the new floor forbids.

## 0.6.2

**`liveLink: { refresh: 'render' }` can now actually re-render, and saying it
without doing it is no longer silent.** The setting was accepted here and had no
effect: re-drawing a moved diagram needs the browser half of the renderer on the
page, only `astro-dgmo` was putting it there, and nothing reported the gap. A
site believed it had turned re-rendering on and kept getting the _"This diagram
has been updated"_ link forever.

- New `vitepress-dgmo/client-render`, exporting `setupDgmoRender()`. Call it in
  your theme's `enhanceApp`, beside `setupDgmo(router)`. It is a separate module
  rather than a flag on `setupDgmo` because a bundler resolves a
  static-analyzable dynamic import at BUILD time — "lazy" says when a reader
  downloads the renderer, not whether your site ships it. In a module nobody
  imports by default, Vite can decline to follow it.
- `withDgmo` and `createDgmoParts` now say, once per build, that the option needs
  that call — naming both the function and the module to import it from. Nothing
  on the config side can reach a theme file, so the notice is the honest
  remainder.

Nothing changes on the default (`refresh: 'notify'`).

## 0.6.1

**Takes `remark-dgmo` 0.14.0, where the step that asks the Cloud what a pointer
points at moved into dgmo itself.** Nothing about this integration changes:
`renderDgmoFence` resolves a live link exactly as before.

The move is worth knowing about here specifically. That fetch used to live where
only a remark host could reach it — and this package runs markdown-it and no
remark plugin, which is how 0.5.0 came to announce live links it could not
render. It now sits in `@diagrammo/dgmo` beside the parser and the card
renderer, where a live link is a chart type rather than a markdown feature.

🔴 **The `@diagrammo/dgmo` range rises to `>=0.60.0 <1`**, as both the runtime
dependency and the peer — they have to move together. 0.60.0 is the release that
adds the `@diagrammo/dgmo/live-link-resolve` subpath that `remark-dgmo` 0.14.0
imports.

This is a patch and not a minor on purpose. **A caret on a `0.x` version locks
the minor**, so a site on `^0.6.0` can reach 0.6.1 and cannot reach 0.7.0 — and
a dependency-floor release that no existing site can install is the exact
problem this release exists to undo.

## 0.6.0

**🔴 Live links never actually worked here. They do now.**

0.5.0 announced live links, and on this package they did not render. Every fence
went through `renderDgmoBlock`, which treats the body as DGMO source — so a fence
holding a share URL came back as an error card reading **"Unsupported chart type:
https://…"**, and the shorter spelling drew a reference card that never fetched
anything and so never changed:

````md
```dgmo
https://online.diagrammo.app/d/dgm_01HQ3RSTUV
```
````

The other four wrappers were never affected. Their remark plugin classifies a
fence body before rendering it; this package has no remark plugin — markdown-it
host, two-phase cache, by design — and the classification step had no home here.
`remark-dgmo` 0.13.0 gives it one as `renderDgmoFence`, which the cache now calls.

**One behaviour change worth knowing about:** a live link that resolves to nothing
now **fails the build** instead of caching an error card. Bad DGMO is still the
author's to fix and still gets an inline card. But a pointer to a diagram that
does not exist would otherwise deploy as a small red box on a page nobody re-reads,
with the id it names as the only clue.

**Requires `remark-dgmo` >= 0.13.0.** It is a dependency, so an install brings it.

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
diagram and linking through to it, plus a hover-revealed _"Show this diagram
here"_ link to the guide and a build warning naming the option and the source
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
