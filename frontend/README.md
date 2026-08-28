# SURKH — Landing Page Code

Two ways to look at this, both built from the same Figma screens
(hero section + "Why SURKH?" + "SURKH Resolves This By" cards +
photo section):

## 1. Instant preview — `index.html`
No install, no build. Just **double-click `index.html`** (or drag it into a
browser tab). It uses the Tailwind CDN + Google Fonts over the network, so
you need an internet connection, but nothing else.

Because it loads the full Tailwind CDN script (with the Surkh brand colors
configured inline, right at the top of the file), **every** Tailwind
utility class is available — so if you hand-edit this file and add a class
that wasn't used before, it will still work immediately. No recompiling,
ever.

This is for quick visual review only — it's not what you ship.

## 2. Real project — `app/` folder
This is the actual Next.js code, matching Surkh's decided stack
(Next.js + Tailwind, frontend-only). To run it:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Files:
- `app/layout.jsx` — loads Montserrat + Outfit via `next/font/google`
- `app/page.jsx` — the hero page itself
- `app/globals.css` — base Tailwind setup
- `tailwind.config.js` — the 6 brand colors + fonts, defined **once**, reused everywhere
- `public/assets/` — images used by the Next.js version

## Where to put your own images

| What | Standalone (`index.html`) | Next.js (`app/page.jsx`) |
|---|---|---|
| Logo | `assets/logo.jpg` | `public/assets/logo.jpg` |
| Hero map background | `assets/hero-map-bg.png` | `public/assets/hero-map-bg.png` |
| Bottom photo | `assets/donation-photo-placeholder.svg` | `public/assets/donation-photo-placeholder.svg` |
| Card icons (×3) | not yet added — see below | not yet added — see below |

Just replace the file in place (**keep the same filename**, or update the
`src="..."` in the code if you rename it). Both folders currently hold the
files you uploaded, so the page works out of the box.

Three things worth swapping when you have final assets:

1. **Logo** — the JPG you gave me has a white background baked in. It looks
   fine on the cream header, but if you ever place it on a dark background,
   export a transparent PNG/SVG instead.
2. **Hero background map** — I used your maroon map image but darkened and
   desaturated it with a CSS `filter` to approximate the moody navy
   background in the Figma design. It's a close approximation, not pixel
   perfect. If you export a dark/desaturated version straight from Figma,
   drop it in and remove the `filter` / `opacity` styling in the hero
   `<Image>` (or `<img>`) tag so it shows at full quality.
3. **Bottom photo** — currently a plain placeholder graphic that says
   "PHOTO PLACEHOLDER". Replace it with a real photo from a donation camp
   (at least 1600px wide, since it stretches full-bleed edge to edge).

## Icons

**Header/hero icons** (download arrow, hamburger, headline blood-drop
badge, "Find Blood" droplet, yellow curved swoosh) are hand-drawn inline
SVGs (no icon library dependency) — search for `Icon` / `Swoosh` in
`app/page.jsx`. They're close approximations of the Figma icons. Swap any
`<svg>...</svg>` block for your own exported icon if you want an exact
match.

**Card icons** (the 3 cards in "SURKH Resolves This By") are left as plain
dashed-outline placeholder boxes labeled "ICON" — no custom SVG was drawn
for these on purpose, since you mentioned you already have your own icons
for them. To drop yours in:

- In `index.html`, find each `<!-- ICON PLACEHOLDER -->` comment (there are
  3, one per card) and replace the `<div class="w-10 h-10 ... ICON</div>`
  block with, e.g.:
  ```html
  <img src="assets/icons/hospitals.svg" alt="" class="w-10 h-10 mx-auto mb-4" />
  ```
- In `app/page.jsx`, do the same inside the `ImpactCard` component — replace
  the placeholder `<div>` with a Next.js `<Image>` tag pointing at
  `/assets/icons/your-icon.svg`.
- Put the actual icon files in `assets/icons/` (standalone) and
  `public/assets/icons/` (Next.js) — you'll need to create that `icons`
  subfolder.

## Layout notes

- The hero heading, paragraph, and buttons are centered on **every**
  screen size (mobile and desktop) using `text-center` + `mx-auto`.
- The "SURKH Resolves This By" cards stack in a single column on mobile
  and switch to a 3-column grid at the `lg` breakpoint (1024px+) on
  desktop.
- The decorative gold/black circles behind "Why SURKH?" shrink on mobile
  so they don't overlap the heading text on narrow screens.

## Design tokens used (do not change without checking Figma)

```
Primary:    #D8323A  (red — CTA, brand name, highlighted words)
Secondary:  #F0B856  (gold — secondary CTA, swoosh accent)
Accent:     #111415  (near-black — hamburger lines)
Text:       #1C0204  (body text on light backgrounds)
Background: #FFFCF7  (page background, header)
Hero navy:  #242B34  (dark background behind hero map art — derived to
                       match the sampled Figma hero background, not one
                       of the 5 core tokens)

Headings: Montserrat (600/700/800)
Body:     Outfit (400/500/600)
```

All corners are sharp (`border-radius: 0`) throughout — this is enforced
in `tailwind.config.js` so nobody accidentally reaches for a rounded class.
