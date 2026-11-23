# Tekion world

An interactive 3D explorer for tekion.com: drive a car around a campus to see Tekion's products, achievements, testimonials and links. Built with Three.js on Vite.

Based on [Folio 2019](https://github.com/brunosimon/folio-2019) by Bruno Simon (MIT, see `license.md`).

## Setup

Requires [Node.js](https://nodejs.org/en/download/).

``` bash
npm install

# Content: copy the template, then fill in config.json (it is git-ignored)
cp config.example.json config.json

npm run dev      # dev server (Vite prints the URL, default http://localhost:5173)
npm run build    # production build in dist/
```

## Content

- All copy and links live in `config.json` (`products`, `achievements`, `testimonials`, `social`, optional `colors`). Item shape: `{ id, name, desc, href }`.
- Product pictures: put full-size images in `src/images/products/originals/`, run `npm run images` to write web-sized WebP files next to them. A picture is matched to a product by file name (`crm.webp` -> "Tekion CRM", `tekion_pay.webp` -> "Tekion Pay"). The folder is git-ignored.
- Debug panel: open the app with `#debug` in the URL. `#classic` brings back the original car.

See `AGENTS.md` for the architecture and conventions.
