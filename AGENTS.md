# AGENTS.md

Context for any AI coding agent (Claude, Codex, Cursor, Copilot, Gemini, etc.) working in this repo. Keep it accurate; update it when the structure changes.

## What this is

A 3D, browser-based "drive a car around a world" game built with Three.js, converted from **Bruno Simon's Folio 2019** (`package.json` name is still `bruno-simon-folio-2019`) into an interactive explorer for **tekion.com**: visitors drive through a generated world to see Tekion's **products, achievements, testimonials** and **social links**.

## Content and theme (read this first)

- **All copy and links live in `config.json`** at the repo root (git-ignored). `src/javascript/content/tekion.js` loads it (falling back to the committed `config.example.json`) and exports `brand`, `colors`, `social`, `products`, `achievements`, `testimonials`. Sections must not hardcode text or URLs.
  - Setup on a fresh clone: `cp config.example.json config.json`, then fill in the arrays.
  - Item shape: `{ id, name, desc, href }`. An empty `social` array means the Connect pads are not rendered.
- **Never invent Tekion facts, URLs, quotes or brand colours.** The brand colours in `content/tekion.js` (`colors`) are Tekion's own design tokens read from tekion.com (teal `#00C3B4`, text `#222630`, sky `#00CBF7`); the floor and glass tones follow the campus reference image. Override any of them from `config.json` `"colors"` (`primary, title, accent, surface, text, glow, shadow, car, floor{topLeft,topRight,bottomRight,bottomLeft}, shades{...}`).
- **No Blender.** Text and scenery that used to be baked into GLB/PNG files is generated in code (see Layout: `Buildings.js`, `Words.js`, `Labels.js`, `Links.js`, `Theme.js`). Do not edit `resources/3d/*`.
- Remove resources from `Resources.js` and their consumers in the same commit. Update this file when structure changes.

World layout (x, y): Intro (0,0), Connect (34,-8), Campus hub (0,-46) with one building per product on an ellipse (rx 34, ry 24) around it, Achievements board row (y -95) and Testimonials board row (y -118), both centred on x = 0 with a gap for the road, Konami easter egg (-60,-100). Roads are drawn by `World/Links.js`.

**Visual target:** a light, cool "campus" like the design reference (pale floor, white buildings with pale-blue glass, translucent glass server farm with racks, thin white roads with travelling light-blue pulses). Colours live in `colors` in `content/tekion.js`.

There are no tests, no linter, no TypeScript, no CI config. Plain ES modules.

## Commands

```bash
npm install
npm run dev      # Vite dev server (host: true, auto-opens browser)
npm run build    # outputs to dist/ (sourcemaps on)
```

Debug mode: open the app with `#debug` in the URL. This creates a `dat.GUI` panel. The car is the Cybertruck model by default (dirty off-white body, colour `colors.car` in `content/tekion.js`); `#classic` restores the original car, and `#cybertruck` also enables the debug "shooting ball" (press B).

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
      Floor.js, Shadows.js, Materials.js
      Sounds.js         howler wrapper + engine sound
      EasterEggs.js     Konami code
      Buildings.js      procedural buildings (warehouse, office, showroom, depot, annex, house) and the server farm, built at runtime
      Links.js          roads: thin white lines with pulses
      Words.js          3D text: wordLetters() (physical letters), wordGeometry() (merged, for signs)
      Labels.js         canvas textures: alphaLabel() (floor/area labels), card() (board cards)
      Menu.js           fast-travel menu ("Where to?"): DOM list of destinations that moves the car; sections expose `destinations`/`destination`
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

**Product pictures**: put full-size originals in `src/images/products/originals/` and run `npm run images` (sharp, `tools/optimiseImages.mjs`) to write 1280 px WebP files into `src/images/products/`; only those are bundled. The whole folder is git-ignored. A product picks it up automatically when the file name matches the product name (`crm.png` -> "Tekion CRM", `tekion_pay.png` -> "Tekion Pay"), or set `"image": "file.png"` on the product in `config.json`. The picture floats above the building only while the car is nearest to that building's entrance; products without a picture show the banner card the same way.

**Add or edit a product / achievement / testimonial**: edit the matching array in `config.json` (no code change). Products become buildings in `World/Sections/CampusSection.js` (types cycle through `Buildings.js`); achievements and testimonials are board rows from `World/Sections/BoardsSection.js` (one board, floor label and link area per item, 10 units apart along +x), instantiated in `World.setSections()`.

**Add a new world section**: create `World/Sections/FooSection.js` (receive `time, resources, objects, areas, zones, tiles, debug, x, y`; expose `this.container` as an `Object3D`), then instantiate and `this.container.add(...)` it in `World.setSections()`. For a new board row just add another `BoardsSection`. Generated objects pass `{ base: { children: [...] }, collision: { children: [...] } }` to `objects.add()`; visual meshes are named `shadeXxx` (matcap lookup), collision meshes `cube`/`cylinder` with the size in `scale`.

**Add a physical object**: add `base`/`collision` GLBs to `static/models/<name>/`, register both in `Resources.js`, create it via `objects.add(...)`. If it makes sound, add a settings block in `World/Sounds.js` `setSettings()` and files under `static/sounds/`.

**Add a shader**: create `src/shaders/<name>/{vertex,fragment}.glsl`, wrap in `Materials/<Name>.js` or `Passes/<Name>.js`. Reuse chunks via `#include ../partials/<file>.glsl`.

**Change content/branding**: copy and palette in `config.json`; `src/index.html` (title, meta), `IntroSection.js` (title letters come from `brand.name`), `CampusSection.js` (hub + product buildings), `ConnectSection.js`, `Application.setTitle` (animated tab title), favicons in `static/favicon` (generated from Tekion's site icon), share images in `static/social` (screenshots of the campus; og/twitter image URLs in `index.html` are relative: make them absolute once the production domain is known).

## Gotchas

- `Application.destructor()` is incomplete and calls `this.debug.destroy()` unguarded (throws when debug is off). Nothing calls it today.
- The original Google Analytics snippet was removed; add the real tracking id only when the owner provides one.
- `bruno-simon` mentions that remain are intentional: `license.md` (the MIT notice must stay) and the attribution line in `readme.md`.
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
