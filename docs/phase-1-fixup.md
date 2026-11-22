# Phase 1 fix-up checklist

Review of commit `080110a` ("phase 1 changes"). Phase 1 (strip) is about 90% done; Phase 2 (content layer) is about 30% done. Nothing visible renders yet. Do these in order, one commit for the fix-up (`:bug: Phase 1 > Fix-up`). Do not start Phase 3+ until all boxes are ticked.

Not yet verified by the planner: a clean build and console (no `node_modules` was available during review).

## A. Broken things

- [ ] **`ProjectsSection.js` `setMeshes()`**: the line with `this.meshes.boardStructure` contains literal `\n` text, so the whole line (including `boardPlane`, `areaLabel`, `areaOpenTexture` filters) is one comment. Restore it as real separate lines. Keep `boardPlane` and `areaLabel`; they are needed by `Project.js`.
- [ ] **`InformationSection.js` `setLinks()`**: it only fills `items`/`options`. The code that built the 3D link pads (areas, labels, geometry) was deleted, so social links never draw. Rebuild it from `social` in `content/tekion.js`. Labels come from code (CanvasTexture, Phase 4), not the deleted `informationContact*Label.png` files. If `social` is empty, render nothing.
- [ ] **`World/index.js`**: the `InformationSection` block is commented out, so the Connect area is missing. Re-enable it (or its renamed `ConnectSection`, Phase 5) once the links work. Also remove the now-unused `InformationSection` import if it stays disabled.
- [ ] **`ProjectsSection.js` has no `add()` method** but the constructor calls `this.add(...)` for each list entry. Fine while the list is empty, a crash once it is filled. Restore `add()` (or have the Phase 5 `ProductsSection` provide it).
- [ ] Check no leftover consumers of removed assets: grep `src/` for `wig`, `Distinction`, `baguette`, `informationContact`, `informationActivities`, `ThreejsJourney`, `boyHi`, `bubbleTip`. Per the rules, a resource and its consumers are removed in the same commit.

## B. `config.json` handling (decision: keep it OUT of git)

`config.json` holds the raw Tekion data and must not be committed.

- [ ] Add `config.json` to `.gitignore`. While there, replace the stale Parcel `.cache` entry with Vite's `dist` if missing.
- [ ] Make sure it is not tracked: `git rm --cached config.json` if it ever got staged (currently untracked).
- [ ] Because `src/javascript/content/tekion.js` does `import config from '../../../config.json'`, a fresh checkout fails to build. Pick one and do it:
  1. **Preferred:** commit a `config.example.json` with the same keys (`social`, `products`, `achievements`, `testimonials`, plus optional `name`, `tagline`, `description`, `url`, `colors`) and empty arrays, and document `cp config.example.json config.json` in `AGENTS.md` and `readme.md`.
  2. Or load it optionally with `import.meta.glob('../../../config.json', { eager: true })` and fall back to `{}` when missing.
- [ ] Do not change what `tekion.js` exports (`brand`, `social`, `products`, `achievements`, `testimonials`, default). Sections already depend on it.
- [ ] Verify the contents of the local `config.json` against confirmed Tekion sources. Never invent facts, URLs, quotes or colours (see `AGENTS.md`). Flag anything unconfirmed to the user instead of shipping it. Placeholder accent colours such as `#ff8908` are not confirmed brand colours (decision D1 is still open).

## C. Repo hygiene

- [ ] `package-lock.json` lost about 146 lines (`@jridgewell/*` and similar optional/peer entries). Confirm it was an intentional dependency change. If not, restore it with `git checkout 2a70ea2 -- package-lock.json`, then run `npm install`.
- [ ] Commit discipline: Phase 2 work (`tekion.js`) landed inside the phase 1 commit. From now on, one commit per phase, with the phase named in the message (gitmoji style, e.g. `:fire: Phase 1 > Fix-up`).
- [ ] Update the **Status** line in `AGENTS.md` ("Phase 0 not started") to the real state, and update the Layout section for `content/tekion.js`, `config.json`/`config.example.json`, and the removed files (`ThreejsJourney.js`, promo DOM).
- [ ] Check the `index.html` leftovers still pending from Phase 1/3: the original Google Analytics id `UA-3966601-5` and Bruno's title and meta tags. Remove the analytics snippet at minimum (decision D9 is open, so do not add a new id).

## D. Verification (must pass before this is done)

- [ ] `npm install` then `npm run build` succeeds, also from a clean clone with only `config.example.json` copied to `config.json`.
- [ ] `npm run dev`: loading screen finishes, the start button works, the car drives, and the browser console has no errors or 404s for deleted assets.
- [ ] With `social` populated, the Connect pads appear and open the right URLs. With `social: []`, the block is not rendered and nothing errors.
- [ ] Say plainly in the commit/PR if any of the above could not be run in a browser.

## Out of scope for this fix-up

Products boards from `products` (Phase 5), Achievements and Testimonials (Phase 7), colours and branding (Phases 3 and 6), code-generated labels beyond what the social pads need (Phase 4).
