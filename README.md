# Peyton_Lindogan_Resume

Personal site. Static, no framework, no runtime dependencies.

**Live:** https://peytonhl.github.io/Peyton_Lindogan_Resume/

## What's here

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Positioning, delivery record, scale metrics, toolkit, background, contact |
| Personal projects | `projects.html` | Contour, The Case Against Relaunches, and the academic work |

Copy rule on the public pages: **scale, not dollars.** Headcounts, megawatts,
report counts and business units are on the site; the dollar figures live in the
resume PDF only.

## Design system

Two accents, both literal to the subject:

- **Amber `#f7b733`** is generation. It draws the load curve, the section nodes, and the primary action.
- **Cyan `#3fd2e6`** is current. It runs the conductor rail down the left edge and marks section numbers.

Everything else is near-black `#05070a` and hairline rules. Display type is
Archivo (variable, 400 to 800), instrumentation labels are IBM Plex Mono. Both
are self-hosted from `src/fonts/`, so the page never waits on a third party and
renders identically inside a corporate network that blocks font CDNs.

The hero backdrop (`src/loadcurve.js`) is a real 24-hour system load curve:
overnight trough, morning ramp, a midday shoulder that solar flattens, and the
evening peak. It draws itself once on load and then holds.

`prefers-reduced-motion` disables the draw-in, the current pulses, and the
reveal transitions.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes `dist/` to GitHub Pages.

One time setup: **Settings → Pages → Source: GitHub Actions.**

### Custom domain

1. Point a CNAME record at `peytonhl.github.io`.
2. Set the domain under Settings → Pages.
Nothing else to change. `vite.config.js` uses a relative `base`, so the same
build works at a project subpath and at a domain root.

## Regenerating the share image

`public/og.png` is rendered from `tools/og.html` rather than hand-designed, so it
stays in step with the site's type and palette.

```bash
npm install --no-save playwright
node tools/og.mjs
```

## Screenshots

`node tools/shots.mjs` serves `dist/` and captures desktop and mobile frames
into `tools/shots/`. Useful for checking a layout change on a phone viewport
without a phone.
