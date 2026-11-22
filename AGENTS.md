# AGENTS.md

Context for any AI coding agent (Claude, Codex, Cursor, Copilot, Gemini, etc.) working in this repo. Keep it accurate; update it when the structure changes.

## What this is

A 3D, browser-based "drive a car around a world" game built with Three.js, converted from **Bruno Simon's Folio 2019** (`package.json` name is still `bruno-simon-folio-2019`) into an interactive explorer for **tekion.com**: visitors drive through a generated world to see Tekion's **products, achievements, testimonials** and **social links**.

## Content and theme (read this first)

- **All copy and links live in `config.json`** at the repo root (git-ignored). `src/javascript/content/tekion.js` loads it (falling back to the committed `config.example.json`) and exports `brand`, `colors`, `social`, `products`, `achievements`, `testimonials`. Sections must not hardcode text or URLs.
  - Setup on a fresh clone: `cp config.example.json config.json`, then fill in the arrays.
  - Item shape: `{ id, name, desc, href }`. An empty `social` array means the Connect pads are not rendered.
- **Never invent Tekion facts, URLs, quotes or brand colours.** The palette in `content/tekion.js` (`colors`) is a neutral *placeholder*; override it from `config.json` `"colors"` once real brand colours are confirmed (`primary, accent, surface, text, tree, glow, floor{topLeft,topRight,bottomRight,bottomLeft}`).
- **No Blender.** Text and scenery that used to be baked into GLB/PNG files is generated in code (see Layout: `Words.js`, `Labels.js`, `Signpost.js`, `Props.js`, `Theme.js`). Do not edit `resources/3d/*`.
- Remove resources from `Resources.js` and their consumers in the same commit. Update this file when structure changes.

World layout (x, y): Intro (0,0) -> Crossroads (0,-30) -> Products row east (30,-30), Connect south (1.2,-55), Achievements row (30,-75), Testimonials row (30,-120), Playground west (-38,-34), Konami easter egg (-60,-100).

There are no tests, no linter, no TypeScript, no CI config. Plain ES modules.

## Commands

```bash
npm install
npm run dev      # Vite dev server (host: true, auto-opens browser)
npm run build    # outputs to dist/ (sourcemaps on)
```

Debug mode: open the app with `#debug` in the URL. This creates a `dat.GUI` panel. `#cybertruck` swaps the car model.

## Stack

- Vite 5 (`vite.config.js`): `root: src/`, `publicDir: static/`, `outDir: dist/`
- `vite-plugin-glsl`: `.glsl` files are imported as strings (`#include` works, see `src/shaders/partials/`)
- `vite-plugin-restart`: restarts the dev server when `static/**` changes
- three 0.164, cannon 0.6 (physics), gsap 3 (tweens), howler 2 (audio), dat.gui (debug)
- Fonts load from Google Fonts (Comic Neue). 3D text uses three's bundled `helvetiker_bold` typeface.

## Layout

```
src/
  index.html            canvas (.js-canvas)
  index.js              creates `window.application = new Application(...)`
  style/main.css
  javascript/
    Application.js      composition root: Time, Sizes, Resources, config, renderer, Camera, post passes, World
    Camera.js           angle, zoom, pan (follows car), orbit controls (debug)
    Resources.js        THE manifest of every asset to load (see below)
    content/tekion.js   loads config.json; the single source of copy, links and palette
    Utils/              EventEmitter, Loader, Sizes, Time
    Passes/             Blur, Glows (post-processing ShaderPass definitions)
    Materials/          ShaderMaterial wrappers (Matcap, Floor, Shadow, AreaFence, ...)
    Geometries/         AreaFence, AreaFloorBorder
    World/
      index.js          World: builds everything in a fixed order (see below)
      Physics.js        cannon world, car vehicle, object bodies (largest file)
      Objects.js        add(): turns a visual mesh + collision mesh into a physics-backed object
      Car.js, Controls.js (keyboard + touch), Camera-follow lives in Application
      Areas.js / Area.js        interactive zones (key prompt, fence, floor border)
      Zones.js / Zone.js        invisible trigger regions
      Tiles.js, Walls.js, Floor.js, Shadows.js, Materials.js
      Sounds.js         howler wrapper + engine sound
      EasterEggs.js     Konami code
      Words.js          3D text: wordLetters() (physical letters), wordGeometry() (merged, for signs)
      Labels.js         canvas textures: alphaLabel() (floor/area labels), card() (board cards)
      Props.js          procedural physical props: trophy(), quote(), productCube()
      Signpost.js       generated signposts
      Theme.js          matcapTexture(hex): matcaps generated from palette colours
      Sections/         one class per themed area of the world (see below)
  shaders/<name>/{vertex,fragment}.glsl + partials/
static/                 served as-is at "/": models/*.glb, textures, sounds/, draco/, favicon/
resources/3d/           Blender sources (.blend) - not shipped, large binaries
```

## Architecture and conventions

- **Composition by options object.** Classes take `_options` and copy needed collaborators onto `this` (`this.time = _options.time`, etc.). No DI container, no globals except `window.application`.
- **Event bus.** `Utils/EventEmitter` (`on`, `off`, `trigger`, namespaced names like `tick.foo`). `Time` emits `tick` every `requestAnimationFrame` (delta clamped to 60ms); `Sizes` emits `resize`; `Loader`/`Resources` emit `fileEnd` and `end`. Per-frame logic is `this.time.on('tick', ...)`; there is no central update loop.
- **Code style** (match it): 4-space indent, no semicolons, single quotes, Allman braces (opening brace on its own line for classes, methods, and most blocks), `_` prefix for params, `export default class`, relative imports with `.js` extension. Section comments are `/** ... */` or `// Label`.
- **Startup sequence.** `Application` -> `World` constructor builds sounds, controls, floor, areas, starting screen. After resources load and the user clicks start, `World.start()` builds, in order: reveal, materials, shadows, physics, zones, objects, car, tiles, walls, sections, easter eggs. Order matters (later steps read earlier ones off `this`).
- **Asset naming.** `Resources.js` entries are `{ name, source, type? }`. The loader stores items in `resources.items[name]`; textures get a `Texture` suffix (entry `projectsLuniFloor` is read as `resources.items.projectsLuniFloorTexture`). GLB assets are read as `resources.items.xBase.scene.children`. Sources are relative to `static/` (`./models/...`).
- **Visual + collision pairs.** Physical objects ship as two GLBs: `base.glb` (render) and `collision.glb` (simplified bodies). Pass both to `objects.add({ base, collision, mass, offset, rotation, shadow, sounds, ... })`. `mass: 0` means static and gets merged/matrix-frozen for performance.
- **Shading.** Materials are matcap-based (`World/Materials.js` maps mesh names like `shade*` to matcap colours); a reveal uniform (`uRevealProgress`) animates in at start. Floor shadows are baked PNGs (`*floorShadow.png`) sampled by a shader.
- **Post-processing.** `EffectComposer`: RenderPass -> horizontal blur -> vertical blur -> glow. Blur is disabled on first `touchstart`.
- **Touch vs keyboard.** `config.touch` flips on first touch and calls `controls.setTouch()`. Keyboard uses `event.code` (WASD / arrows, Space or Ctrl = brake, Shift = boost).
- **Pixel ratio is hard-coded to 2** in `Application.setRenderer` (perf-heavy on low-end devices).

## Common tasks

**Add or edit a product / achievement / testimonial**: edit the matching array in `config.json` (no code change). Boards are laid out by `World/Sections/BoardsSection.js` (one board, floor label, prop and link area per item, 16 units apart along +x). Rows are instantiated in `World.setSections()` with their `x, y`, `tag` and `prop`.

**Add a new world section**: create `World/Sections/FooSection.js` (receive `time, resources, objects, areas, zones, tiles, debug, x, y`; expose `this.container` as an `Object3D`), then instantiate and `this.container.add(...)` it in `World.setSections()`. For a new board row just add another `BoardsSection`. Generated objects pass `{ base: { children: [...] }, collision: { children: [...] } }` to `objects.add()`; visual meshes are named `shadeXxx` (matcap lookup), collision meshes `cube`/`cylinder` with the size in `scale`.

**Add a physical object**: add `base`/`collision` GLBs to `static/models/<name>/`, register both in `Resources.js`, create it via `objects.add(...)`. If it makes sound, add a settings block in `World/Sounds.js` `setSettings()` and files under `static/sounds/`.

**Add a shader**: create `src/shaders/<name>/{vertex,fragment}.glsl`, wrap in `Materials/<Name>.js` or `Passes/<Name>.js`. Reuse chunks via `#include ../partials/<file>.glsl`.

**Change content/branding**: copy and palette in `config.json`; `src/index.html` (title, meta), `IntroSection.js` (title letters come from `brand.name`), `CrossroadsSection.js` (signposts), `ConnectSection.js`, `Application.setTitle` (animated tab title), favicons in `src/favicon` and `static/favicon` (still the original author's artwork: replace with Tekion's), social images in `static/social`.

## Gotchas

- `Application.destructor()` is incomplete and calls `this.debug.destroy()` unguarded (throws when debug is off). Nothing calls it today.
- The original Google Analytics snippet was removed; add the real tracking id only when the owner provides one.
- Favicons and share images in `static/` are still the original author's.
- `static/.htaccess` exists for Apache hosting; irrelevant for Vite dev.
- `static/draco/` holds Draco decoders used by the GLTF loader; do not delete.
- Assets are large and binary. Do not read `.glb`/`.blend` files as text and avoid committing regenerated binaries unnecessarily.
- `readme.md` says "localhost:1234" (old Parcel); Vite picks its own port (default 5173).
- `.gitignore` still mentions Parcel's `.cache`; bundler was switched to Vite (commit `dc93a2a`).
- `license.md` is the original project's license; check it before reusing assets or redistributing.
- Hot reload does not cover `static/` changes (the server restarts instead).

## Verifying changes

No automated checks exist. After a change: `npm run build` must succeed, then run `npm run dev` and load the page, confirm the loading screen finishes, the start button works, the car drives, and the browser console is clean. For visual or physics changes use `#debug` and say plainly if you could not run it in a browser.

## Git

History uses gitmoji prefixes with a `Area > Description` style, e.g. `:bug: Sounds > Engine > Fix variation on framerate`. Default branch: `master`.
