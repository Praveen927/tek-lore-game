# Plan: Convert the Bruno Simon Folio fork into the Tekion interactive explorer

Status: PLAN ONLY (written by the planning agent; no code changed). The coding agent executes it phase by phase.
Companion context: `/AGENTS.md` (architecture, conventions, gotchas). Read it first.

## 1. Goal

A drivable 3D world on tekion.com where visitors explore Tekion's **products**, **achievements**, **testimonials**, **about/company** and **social/contact**. Same engine and interaction model (car, physics, areas that open links, baked-looking matcap look). New content, new colours, new components. Nothing that belongs to an individual person remains.

## 2. Open decisions and inputs (BLOCKERS: get these from the user before the phase that needs them)

The coding agent must not invent Tekion facts, URLs, quotes or brand colours. Everything below goes into one content file (see Phase 2).

| # | Needed | Used by | Default if user says "you decide" |
|---|---|---|---|
| D1 | Brand tokens: primary/secondary/accent hex, logo SVG/PNG (light on dark and dark on light), font | Phase 3, 6 | Cannot default. Ask. |
| D2 | Official social URLs that exist (LinkedIn, X, YouTube, Facebook, Instagram, ...) and a contact link (web form or mailto) | Phase 5 (Connect) | Render only the ones provided |
| D3 | Intro copy: tagline, 1-2 line description, company facts the user approves (founding year, HQ, etc.) | Phase 3, 5 | Short neutral tagline supplied by user |
| D4 | Product list: name, one-line description, target URL, optional image per product | Phase 5 (Products) | Ask. Placeholder names are not acceptable in the final |
| D5 | Achievements list: title, year, issuer, optional image/badge | Phase 7 | Ask |
| D6 | Testimonials: quote, person, role, company (approved for public use) | Phase 7 | Ask |
| D7 | Keep the playground (bricks + bowling) and the Konami easter egg? | Phase 5, 8 | **Keep playground, keep Konami**; remove wigs and the egg hunt |
| D8 | Geometry authoring: is Blender available for new GLBs? (`resources/3d/model.blend` exists) | Phase 4 | **No Blender**: generate geometry and labels in code (this plan assumes it) |
| D9 | Analytics: replace the Universal Analytics id with Tekion's GA4/other, or none | Phase 3 | Remove the snippet, leave a marked TODO |
| D10 | Final deploy path (root of tekion.com vs a subpath such as `/explore`) | Phase 3 (Vite `base`, meta URLs) | Root |

## 3. What exists today (analysis summary)

World coordinates (set in `World/index.js` `setSections()`), all sections are classes that place objects/areas/tiles around an `(x, y)` origin:

| Section | Origin | Contents | Fate |
|---|---|---|---|
| Intro | (0,0) | Physical 3D letters B-R-U-N-O S-I-M-O-N, "creative"/"dev" words, arrow keys, horn, instruction labels | Keep structure, replace content |
| Crossroads | (0,-30) | Static hub with 3 forks (tiles to intro, east, west) | Keep, re-skin |
| Projects | (30,-30) | `ProjectsSection` + `Project`: boards with slides, floor image, link area, distinction trophies (awwwards/fwa/cssda) | **Remove content, reuse mechanic as Products** |
| Information | (1.2,-55) | Static + 2 baguettes, 4 social link areas (Twitter/GitHub/LinkedIn/mail label PNGs), activities.png | Becomes Connect/About |
| Playground | (-38,-34) | Brick walls + bowling, reset areas | Keep (re-skin), see D7 |
| DistinctionA-D | disabled (commented out in `World/index.js`) | Trophy sections (`awwwardsTrophy`, `webbyTrophy`, `distinctionA..C` models) | Candidate base for Achievements |
| EasterEggs | (-60,-100) | Konami code area, wigs (4), 2021 egg hunt with encoded codes + console log | Trim |
| ThreejsJourney | DOM overlay | Promo popup for Bruno's course, localStorage keys | **Delete** |

Key engineering facts that shape the plan:

1. **Text is baked into binary assets.** Intro letters are separate Blender GLBs (`intro/{b,r,u,n,o,s,i,m,creative,dev}`), and all signage is alpha-map PNGs (`information/static/contact*Label.png`, `activities.png`, `area/*.png`, `intro/instructions/*`, `projects/*/floorTexture.*`, `startingScreen/*`). Changing wording means new assets. See Phase 4 (code-generated text) as the way around this.
2. **Content is hard-coded inside section classes** (project list in `ProjectsSection.setList()`, links in `InformationSection.setLinks()`). There is no data layer. Phase 2 adds one.
3. **Palette lives in several places**: `World/Materials.js` (matcap textures + `indirectColor '#d04500'`), `Materials/Floor.js` + `World/Floor.js` (4 corner colours, orange `#f5883c` family), `Project.js` board colour `#8e7161`, `Application.setPasses` glow colour `#ffcfe0`, CSS, manifest, `theme-color`. Matcap PNGs in `static/models/matcaps/*` define the shading tint of every GLB mesh whose material is named `shade*`.
4. Blender material names drive colours (`shadeWhite`, `shadeOrange`, ...). Existing GLBs cannot be recoloured except by remapping which matcap a name uses (cheap) or replacing matcap textures (cheap).
5. `Resources.js` is a single manifest; missing files or removed consumers cause load/runtime errors. Every removal must be done on both sides (manifest + consumer).
6. Physics is by-name/by-option; adding objects is `objects.add({ base, collision, ... })`. Collision can be a simple generated box mesh, so new objects do not require Blender.

## 4. Target world

```
                         [Intro: "TEKION" + tagline + controls]   (0,0)
                                         |
                                   [Crossroads]                    (0,-30)
          west  /                        |                      \  east
 [Playground]                            |                         [Products]  (30,-30)
 (-38,-34)                               |                         one board per product
                                   [Connect/About]  (1.2,-55)
                                   social + contact + about
      new, placed beyond existing branches (positions to be chosen so tiles/walls connect):
      [Achievements]  trophies/badges     [Testimonials]  quote boards
```

Suggested placement: Achievements and Testimonials hang off the Products road (continue east, or a fork north/south of Products) and the Connect road. The coding agent picks coordinates and adds `tiles.add({ start, delta })` paths so the road visibly connects, then checks no overlap with existing sections.

## 5. Phases

Each phase ends in a buildable, runnable state (`npm run build` passes, page loads, car drives, console clean). Commit per phase using the repo style: `:gitmoji: Area > Description`.

### Phase 0: Baseline (small)
- Run `npm install`, `npm run build`, `npm run dev`; record that the original runs.
- Create a branch. Do not touch `resources/3d/*` (large binaries).
- Fix nothing yet.

### Phase 1: Strip individual-specific content
Remove and verify nothing else references it (grep before deleting).

1. **Three.js Journey promo**: delete `src/javascript/ThreejsJourney.js`; remove its import/instantiation in `Application.js` (`setThreejsJourney` + call in constructor); remove the `.threejs-journey` block in `src/index.html`; remove its CSS from `src/style/main.css` (all `.threejs-journey*` rules, keep canvas/body rules); delete `src/images/boy*.png`, `bubbleTip.svg`. Keep `src/images/mobile/*` (touch controls UI) after confirming they are used by `Controls.setTouch`.
2. **Projects content**: in `ProjectsSection.setList()` delete all Bruno projects. Remove their `floorTexture` entries from `Resources.js` and delete `static/models/projects/{bonhomme10ans,chartogne,citrixRedbull,gleecChat,keppler,luni,madbox,orano,priorHoldings,refletCommunication,scout,threejsJourney}/`. Keep `projects/board/*` and `projects/distinctions/*` for now (reused in Phases 5/7).
3. **Information content**: remove baguettes (`setBaguettes`, `informationBaguette*` resources, `static/models/information/baguette`), `setActivities` and `activities.png`, the four `contact*Label.png`, and the hard-coded `href`s in `setLinks`.
4. **Intro identity**: the B,R,U,N,O,S,I,M,O,N letter objects and the `creative` / `dev` words (`setTitles`) will be replaced in Phase 4; until then keep them so the world still loads, or stub `setTitles` to a no-op in this phase if the coding agent prefers.
5. **Easter egg personal items**: remove the egg hunt (`setEggs`, the `console.log('🥚 ...')`, base64 codes, `eggBase/eggCollision` references) and wigs (`setWigs`, `wig1-4.glb`) unless D7 says keep. Keep Konami (`setKonamiCode`) if D7 says so but review its label text.
6. **Meta and tracking** (`src/index.html`): remove Bruno title/description/OG/Twitter tags and URLs (`bruno-simon.com`), `application-name`, and the Google Analytics snippet (D9).
7. **Title animation**: `Application.setTitle` writes `_____🚗___` to `document.title`. Decide keep/remove; if kept, set a base title (e.g. brand name) alongside it.
8. **Dead assets**: remove commented-out manifest lines and unused models that nothing references after the above (`bunnyEar*`, `cone`, `egg`, `lemon` if unused, etc.). Verify with grep on each resource `name`.
9. Search the whole repo (`rg -i "bruno|simon|threejs.journey|immersive|uzik|bonhomme"`, also `package.json` name, `readme.md`, `license.md` header context, `static/favicon/site.webmanifest`, `src/favicon/*`) and list leftovers.

Acceptance: app builds and runs, the world still renders with generic sections, no "Bruno"/third-party promo visible in the UI or page source (except the license text, see Risks).

### Phase 2: Content layer (the key refactor that makes the rest cheap)
Create **one** data module, e.g. `src/javascript/content/tekion.js`, exporting plain objects:

```
brand      { name, tagline, description, url, colors{...} }
social     [{ id, label, href }]            // only confirmed links (D2)
products   [{ id, name, summary, href, image?, accent? }]
achievements [{ id, title, year, issuer, image? }]
testimonials [{ id, quote, author, role, company }]
```

Rules for the coding agent:
- Sections import from this file; no section contains literal copy or URLs.
- Empty array means the section/area is not rendered (supports "only available links").
- Validate in dev: console warn if a required field is missing.
- Leave clearly marked `TODO(content)` values only where the user has not yet supplied data; the final PR must not contain them.

### Phase 3: Branding shell
- `src/index.html`: title, description, OG/Twitter/itemprop tags, canonical/og:url (D10), `theme-color`, `mask-icon` colour, `apple-mobile-web-app-title`, fonts link (replace Comic Neue with the brand font from D1, or a safe fallback).
- `static/favicon/*` and `src/favicon/*` (+ `site.webmanifest`: name, short_name, theme_color, background_color) and `static/social/share-*.png`: need Tekion artwork from the user (D1). Until provided, the coding agent should remove the Bruno images only if replacements are available; otherwise flag it.
- `package.json`: rename (`tekion-explore` or user-chosen), set `"private": true`, version, description. `readme.md`: rewrite (setup, structure, content file, deploy). Fix port note (Vite 5173).
- `vite.config.js`: add `base` if D10 requires a subpath; confirm asset URLs (`./models/...`) still resolve.
- `src/style/main.css`: keep only game UI (canvas, touch controls, any new HUD); apply brand colours and font.
- `.gitignore`: remove Parcel `.cache` note.

### Phase 4: Code-generated text and labels (removes the Blender/PNG dependency)
Add small reusable helpers instead of baking new PNG/GLB assets for every string:

1. `Utils/CanvasLabel.js` (name flexible): draws text (brand font, colour, optional wrap, optional rounded panel) onto an offscreen canvas and returns a `THREE.CanvasTexture`, used as `alphaMap`/`map` in the same `MeshBasicMaterial` pattern the sections already use for PNG labels (`NearestFilter`/`LinearFilter`, `transparent`, `depthWrite: false`). Wait for `document.fonts.ready` before drawing.
2. `World/TextBlocks.js` (name flexible): builds physical letters for "TEKION" (and optionally a second word) as extruded geometry (`THREE.ExtrudeGeometry` from `FontLoader` + a JSON/typeface font shipped in `static/`, or from simple shape paths) plus a simple box collision per letter, passed to `objects.add` with the existing `mass`, `shadow`, `soundName: 'brick'` options. The `Objects.js` converter expects a `base` with `.children` carrying materials named `shade*`; the generated mesh must set `material.name` to an existing shade (for example the brand primary) so `Materials.js` can replace it. The coding agent must read `Objects.getConvertedMesh` before implementing.
3. Replace: Intro letters + `creative`/`dev` words, area prompt labels that carry words (keep `area/enter|open|reset|keyEnter|questionMark` since they are generic UI), Connect labels, instruction labels (`intro/instructions/*`) only if the text is wrong for Tekion (controls are generic; probably keep).
4. If the user supplies Blender GLBs later (D8 = yes), the helpers become unnecessary for those items; keep them for dynamic copy (testimonial text, achievement titles).

Acceptance: changing a string in `content/tekion.js` changes it in-world without any asset regeneration.

### Phase 5: Re-map existing sections
1. **Intro**: spell the brand name with the Phase 4 helper; replace "creative developer" words with tagline copy or a short descriptor; keep arrow keys, horn, controls label; keep tiles. Adjust positions/shadows so physics bodies do not overlap (compare with `introStatic` collision).
2. **Crossroads**: add direction signs (canvas labels or posts) naming each branch: Products, Achievements, Testimonials, Connect, Playground. This replaces Bruno's implicit knowledge of the layout.
3. **Products** (`ProjectsSection` renamed `ProductsSection`, `Project` renamed `ProductBoard`, update imports in `World/index.js`, and the key `sections.projects` -> `sections.products`): per product render 1-N boards from `products[].image` (or a generated title card via CanvasLabel when no image), a floor panel with the product name (CanvasLabel replaces `floorTexture` PNGs), an area with `href` (opens in new tab, same `window.open(..., '_blank')` pattern, add `rel` safety by using `noopener`), and the "open" label. Remove `distinctions` from products. Spacing constants: `interDistance`, `projectHalfWidth` must still fit the number of products; compute positions from `products.length`.
4. **Connect/About** (`InformationSection` renamed `ConnectSection`): replace baguettes with a Tekion-relevant decorative object (user choice) or nothing; render one link area per `social[]` entry with a CanvasLabel (platform name) and an icon option; add an "About" panel (brand description, D3) in place of `activities.png`; add a contact area. Use `social.length` to lay out areas (current code spaces 4 items by `distanceBetween`). Zero social links means skip that block.
5. **Playground**: keep (D7) or remove. If kept, only theme it; if removed, delete `PlaygroundSection.js`, resources (`brick*`, `bowling*`), `Walls` use, and the sounds `bowling*`, `bricks*`, then adjust tiles/crossroads west fork.
6. **Tiles/Walls/Zones**: after layout changes, review `tiles.add` calls in each section and `World.setWalls()` boundaries so no road ends nowhere and the car cannot leave the map.

### Phase 6: Visual identity
1. Replace colours using D1 tokens:
   - `World/Materials.js`: `shades.indirectColor` and, if needed, new named shades (e.g. `brandPrimary`) with a recoloured matcap PNG (generate a simple sphere matcap from the brand colour; the coding agent can create these with a small script or canvas, no Blender).
   - `Materials/Floor.js` and `World/Floor.js` 4 corner colours.
   - `Project.js` board colour (`#8e7161`), `Application.setPasses` glow colour (`#ffcfe0`), CSS variables, renderer clear colour if brand dark/light requires it.
2. Car: keep the default or recolour via matcap of its `shade*` materials; optionally hide `#cybertruck` hash easter egg.
3. Light checks: confirm the reveal animation still looks right (uniform `uRevealProgress`) with new colours; confirm text in labels has contrast against floor and sky colours (WCAG-style contrast check for label colour against floor colours).
4. Provide the user a before/after screenshot list in the PR description (agent runs the app; if it cannot, it says so).

### Phase 7: New sections (Achievements, Testimonials)
Both follow the existing section contract: class with `_options` (`time, resources, objects, areas, zones, tiles, walls, debug, x, y`), `this.container` Object3D, registered in `World.setSections()`, road via `tiles.add`.

- **AchievementsSection**: a plinth/podium zone; per achievement a physical trophy/badge (reuse `webbyTrophy` / `awwwardsTrophy` GLBs as generic trophies only if the user is OK with their look, or generated shapes recoloured to brand) with a CanvasLabel plate (title, year, issuer). Trophies are dynamic bodies (`mass 1.5`, sound `woodHit` replaced by a suitable existing sound) so the car can knock them. Optional area per item that opens a source link.
- **TestimonialsSection**: one board per testimonial using the Product board mechanic with a CanvasLabel-generated quote card (quote, author, role, company); a single area at the start of the row optionally linking to a customers page. Long quotes need wrapping and a max length (truncate with ellipsis plus a link, or split across two boards).
- The disabled `DistinctionA-D` files may be reused as the structural base or deleted; choose one and remove the rest to avoid dead code.

### Phase 8: Easter eggs, sounds, polish
- Konami: keep only if D7; update label text. Remove wigs/eggs (done in Phase 1).
- Sounds: remove unused sound files and `Sounds.setSettings()` entries tied to deleted objects (`bowling*`, `bricks*` only if the playground is gone). Total `static/sounds` is 7.2 MB, worth trimming.
- Loading/start screen: `World.setStartingScreen` uses base64 PNG labels (loading, start). Check whether their wording is generic; replace with a brand-neutral or CanvasLabel version if not.
- Page title animation, mute button behaviour, touch controls: regression check only.

### Phase 9: Quality, performance, release
- Remove all dead code and unused resources (grep each `Resources.js` name; remove entries with no consumer and their files).
- Asset budget: report `dist/` size before/after; target no regression vs 5.3 MB models + 7.2 MB sounds, ideally smaller.
- Cross-browser smoke: desktop Chrome/Safari/Firefox, iOS Safari and Android Chrome (touch controls and `config.touch` path, blur disabled on touch).
- Performance: renderer pixel ratio is hard-coded to 2 (`Application.setRenderer`); evaluate capping for mobile (decision for the user; default: leave unless frame rate is poor).
- Accessibility/SEO for a canvas-only page: add a visible, accessible fallback (`<noscript>` and a short text block or a "skip to text version" link listing products, socials, contact); add `aria-label` on the canvas. The explorer is a novelty layer, the content must also be reachable without WebGL (decide scope with user; default: simple fallback list rendered from `content/tekion.js`).
- Legal: `license.md` is the original author's licence for code and assets. Before publishing, the user must confirm the licence terms permit commercial reuse of the code and of the 3D models/sounds that remain, and keep required attribution. Record the outcome in the readme.
- Final grep for leftovers (Section 6 checklist), `npm run build`, serve `dist/` statically, test with the intended base path.

## 6. Definition of done

- [ ] `rg -i "bruno|simon|threejs.?journey|immersive|uzik|bonhomme|baguette"` returns nothing in `src/`, `static/`, `package.json`, `readme.md` (except attribution in the license section)
- [ ] No Bruno URLs, emails, analytics ids, images, or sounds that are personal to him
- [ ] All copy and URLs come from `src/javascript/content/tekion.js`; no `TODO(content)` left
- [ ] Sections present: Intro, Crossroads, Products, Achievements, Testimonials, Connect/About (+ Playground per D7)
- [ ] Roads connect every section; the car cannot leave the world; no overlapping objects
- [ ] Brand colours applied to floor, matcaps, boards, glow, CSS, meta, manifest
- [ ] `npm run build` clean; page loads on desktop and touch; console has no errors or warnings
- [ ] Unused resources removed from both `Resources.js` and `static/`
- [ ] Readme rewritten, `AGENTS.md` updated to match the new structure

## 7. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Real Tekion content/brand assets not supplied | Plan blocked at Phases 2-7 | Gather D1-D6 first; build with the content-file contract so only data changes later |
| No Blender: cannot recolour or author GLBs | Limits visual fidelity | Code-generated geometry/labels (Phase 4), matcap recolouring, reuse of existing GLBs |
| Generated text meshes not compatible with `Objects.getConvertedMesh` (material names, merge, collision) | Physics/shading bugs | Read `Objects.js` first; prototype one letter before the whole word |
| Removing a resource that is still read elsewhere | Runtime null errors on load | Grep each name before removal; keep manifest and consumers in the same commit |
| Layout collisions after content changes | Objects stuck in walls, unreachable areas | Compute positions from content length; visual check with `#debug` and orbit camera |
| Long copy in canvas labels | Illegible text on a tilted 3D plane | Max lengths in the content validator, wrap and truncate in `CanvasLabel` |
| Licence and third-party assets | Legal exposure for a company site | Confirm in Phase 9 before publishing; replace assets that are not covered |
| Canvas-only page hurts SEO/accessibility | Content invisible to crawlers and assistive tech | HTML fallback (Phase 9) |
| Mobile performance (DPR 2, post-processing blur, physics) | Low frame rate on phones | Test on real devices; cap pixel ratio if needed |

## 8. Hand-off notes for the coding agent

- Do not change `resources/3d/*`.
- Work phase by phase, one commit per phase, and stop at each "Acceptance" to run the checks in `AGENTS.md` ("Verifying changes").
- Match code style (4 spaces, no semicolons, Allman braces, `_options` pattern).
- Ask the user (do not guess) for any Section 2 item that is missing when you reach the phase that needs it.
- When a phase changes structure (new files, renamed classes), update `AGENTS.md` in the same commit so the next agent has accurate context.
