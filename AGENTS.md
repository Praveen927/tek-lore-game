# AGENTS.md

Context for any AI coding agent (Claude, Codex, Cursor, Copilot, Gemini, etc.) working in this repo. Keep it accurate; update it when the structure changes.

## What this is

A 3D, browser-based "drive a car around a world" portfolio game built with Three.js. The repo directory is `tek-lore-game`, but it is a fork of **Bruno Simon's Folio 2019** (`package.json` name: `bruno-simon-folio-2019`). Most content (page title, project list, contact links, Three.js Journey promo, Google Analytics id) is still Bruno's. Treat re-theming as an open task; do not assume the content is final.

## Project direction (read this first)

This fork is being converted into an interactive explorer for **tekion.com** (a SaaS company, not a person): visitors drive a car through a 3D world to explore Tekion's **products, achievements, testimonials, about, and social/contact**. Same engine and interaction model; new components, colours and content. Everything specific to an individual (Bruno's projects, career, socials, promo, analytics) is to be removed or remapped.

- **Full plan:** [docs/plan-tekion-conversion.md](docs/plan-tekion-conversion.md). It has 10 phases (0 baseline, 1 strip, 2 content layer, 3 branding shell, 4 code-generated text/labels, 5 remap sections, 6 visual identity, 7 new Achievements/Testimonials sections, 8 easter eggs/sounds, 9 QA/release), open decisions D1-D10, the definition of done, and risks.
- **Target world:** Intro (TEKION) -> Crossroads -> Products (reuses the project-board mechanic), Connect/About (replaces Information), Playground (kept, re-skinned), plus new Achievements and Testimonials.
- **Roles:** a planning agent maintains `docs/` and does not edit code; a coding agent implements the plan phase by phase, one commit per phase.
- **Rules for the coding agent:**
  - Never invent Tekion facts, URLs, quotes, or brand colours. If a plan input (D1-D10) is missing, ask the user.
  - All copy and links live in one data file, `src/javascript/content/tekion.js` (created in Phase 2). Sections must not hardcode text or URLs.
  - Only real, confirmed social links are rendered; an empty list means the block is not rendered.
  - Do not touch `resources/3d/*`. Assume no Blender: generate text/labels in code (Phase 4).
  - Remove resources from `Resources.js` and their consumers in the same commit.
  - When structure changes (new/renamed files or classes), update this file in the same commit.
- **Fix-up pending:** [docs/phase-1-fixup.md](docs/phase-1-fixup.md) lists what is broken after commit `080110a`. Do it before Phase 3+. `config.json` stays gitignored (copy it from `config.example.json`).
- **Status:** Phase 1 mostly done, Phase 2 partly done; see the fix-up checklist (update this line as phases complete). Sections described below still reflect the original Bruno code until the matching phase lands.

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
- Fonts load from Google Fonts (Comic Neue); analytics snippet is in `src/index.html`

## Layout

```
src/
  index.html            canvas (.js-canvas) + Three.js Journey promo DOM
  index.js              creates `window.application = new Application(...)`
  style/main.css
  javascript/
    Application.js      composition root: Time, Sizes, Resources, config, renderer, Camera, post passes, World
    Camera.js           angle, zoom, pan (follows car), orbit controls (debug)
    Resources.js        THE manifest of every asset to load (see below)
    ThreejsJourney.js   promo popup, uses localStorage
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
      EasterEggs.js     Konami code, wigs, etc.
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

**Add or edit a project board** (`World/Sections/ProjectsSection.js`): add an entry to the list in `setList()` (`name`, `imageSources`, `floorTexture`, `link {href,x,y,halfExtents}`, optional `distinctions`). Register its floor texture in `Resources.js` and put images under `static/models/projects/<name>/`. Some project folders in `static/` are present but their entries are commented out in the manifest.

**Add a new world section**: create `World/Sections/FooSection.js` (receive `time, resources, objects, areas, zones, tiles, debug, x, y`; expose `this.container` as an `Object3D`), load its assets in `Resources.js`, then instantiate and `this.container.add(...)` it in `World.setSections()`. The `DistinctionA..D` sections are disabled (imports and instantiation commented out).

**Add a physical object**: add `base`/`collision` GLBs to `static/models/<name>/`, register both in `Resources.js`, create it via `objects.add(...)`. If it makes sound, add a settings block in `World/Sounds.js` `setSettings()` and files under `static/sounds/`.

**Add a shader**: create `src/shaders/<name>/{vertex,fragment}.glsl`, wrap in `Materials/<Name>.js` or `Passes/<Name>.js`. Reuse chunks via `#include ../partials/<file>.glsl`.

**Change content/branding**: `src/index.html` (title, meta, analytics id, promo copy), `IntroSection.js` (titles), `InformationSection.js` (contact/activities), `Application.setTitle` (animated tab title), `ThreejsJourney.js` + its DOM, favicons in `src/favicon` and `static/favicon`, social images in `static/social`.

## Gotchas

- `Application.destructor()` is incomplete and calls `this.debug.destroy()` unguarded (throws when debug is off). Nothing calls it today.
- `index.html` also contains a Google Analytics snippet (`UA-3966601-5`, legacy Universal Analytics) that belongs to the original author; remove or replace it for any real deploy.
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
