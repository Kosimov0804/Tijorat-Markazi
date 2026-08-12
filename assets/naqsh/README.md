# assets/naqsh — o'zbek milliy naqsh

Ornament artwork for the site. Everything here is referenced from the
`O'ZBEK MILLIY NAQSH` block at the bottom of `styles.css`, through CSS
custom properties, and attached with pseudo-elements — no page markup
carries ornament.

## Using the reference patterns

To use the supplied bodom (paisley) artwork instead of the generated SVG,
save the two files here with these exact names:

| File | Which image |
|------|-------------|
| `bodom-gold.png` | the gold-on-white paisley scatter |
| `bodom-navy.png` | the navy-on-white paisley scatter |

PNG, JPG, WEBP or SVG all work — if the extension differs, say so and the
stylesheet gets pointed at it.

### About the white background

Both reference images have a solid white ground. Laid straight over the
cream or near-black page that white would block everything behind it, so
the stylesheet drops it with a blend mode rather than requiring the images
be re-cut with transparency:

* light theme — `mix-blend-mode: multiply` keeps the ink, discards white
* dark theme — `mix-blend-mode: screen` over an inverted copy

If transparent PNGs are supplied instead, the blend modes come out and the
images are used directly.

## Generated fallback (current)

| File | Purpose |
|------|---------|
| `scatter.svg` / `scatter-dark.svg` | 560px scatter field — hero, CTA, footer |
| `band.svg` / `band-dark.svg` | horizontal band — under the header, above the footer |
| `paisley.svg` / `paisley-dark.svg` | single ornate bodom — card corners, directory marks |
| `rosette.svg` / `rosette-dark.svg` | six-petal flower — section titles, hero pill |

These are drawn from a single closed boteh silhouette that is stroked, then
dressed with a beaded border, a hairline and a rosette. The silhouette must
stay a simple closed loop: tracing an outer boundary and doubling back along
an inner one renders as a spiral instead of a paisley.
