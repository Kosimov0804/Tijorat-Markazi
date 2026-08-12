# Monument photographs

Drop a photograph in here and it becomes the site background.

## What to add

Any of these filenames is picked up automatically, in this order:

    registan.jpg      the Registan, Samarkand
    khiva.jpg         Itchan Kala, Khiva
    bukhara.jpg       Poi Kalon, Bukhara
    monument.jpg      anything else

`.png` also works. The first file found wins, so to switch monuments
just rename or remove one.

## What happens to it

The photo is not shown as a photo. `monument-bg.js` runs it through an
SVG filter chain in the browser:

1. **desaturate** — the original colour is stripped
2. **posterise** — tones collapse into five flat steps, which is what
   makes it read as an illustration rather than a photograph
3. **duotone** — those steps are remapped onto the brand palette:
   portal navy in the darks, warm sand in the lights
4. **fade** — the top and edges are masked so the headline always sits
   on clear ground

Nothing is baked in: change the palette tokens and the background
follows. Delete the file and the background simply disappears.

## Choosing a photo

- **Wide** beats tall — it is cropped to the full page width.
- **A calm sky** in the upper half gives the headline somewhere to sit.
- **Dusk or blue hour** posterises best; harsh midday light flattens.
- Resize to about **2400px wide** before adding it. A 6MB camera file
  costs every visitor the same 6MB.
