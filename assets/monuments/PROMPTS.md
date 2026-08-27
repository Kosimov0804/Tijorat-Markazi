# Higgsfield prompts for the monument background

Generate these on claude.ai (where the Higgsfield connector lives), save with
the filename given, and drop the file in this folder. `/api/monuments` picks it
up on the next page load — no code change, no rebuild.

---

## Read this first — it changes what you should ask for

`monument-bg.js` does not display the photograph. It runs it through a filter
chain before you ever see it:

```
1. desaturate   feColorMatrix saturate=0     → all colour is thrown away
2. posterise    5 discrete tone steps        → fine detail is destroyed
3. duotone      darks → navy #1F304F
                lights → sand #F7F2E8        → the palette is re-applied
4. fade         top and edges masked         → the headline sits on clear ground
```

Two consequences, both tested:

**Colour is wasted budget.** "Golden hour", "warm terracotta", "turquoise
tilework" — all discarded at step 1. Do not spend prompt words on colour.

**Tonal separation is everything.** I ran a test plate with soft mid-greys
through the real pipeline and it came out flat and muddy — five steps have
nothing to grip when the tones sit close together. Ask for **strong, simple
contrast**: a bright sky against a dark silhouette.

So the prompts below are written for *tone and shape*, not colour and mood.

---

## What every prompt needs

| Requirement | Why |
|---|---|
| **Wide, 2400 × 1000 or wider** | Cropped to full page width |
| **Empty upper third** | The headline sits there; a busy sky makes it unreadable |
| **Dusk / blue hour** | Widest gap between sky and silhouette — posterises cleanly |
| **Simple massing, few objects** | 5 tone steps erase fine ornament anyway |
| **No people, no cars, no text** | They posterise into unreadable blobs |
| **Straight-on or slight elevation** | Extreme angles fight the flat treatment |

---

## 1 · Registan, Samarkand → `registan.jpg`

```
The Registan ensemble in Samarkand at blue hour, photographed straight on from
ground level, wide panoramic framing. Three madrasah facades with their great
arched portals and ribbed domes read as one strong dark silhouette against a
clear, evenly lit twilight sky. The upper third of the frame is empty sky with
no clouds and no detail. High tonal contrast between the bright sky and the
dark architecture. Simple massing, minimal fine ornament, no people, no
vehicles, no text or signage. Architectural photography, calm and monumental.
Aspect ratio 21:9.
```

## 2 · Itchan Kala, Khiva → `khiva.jpg`

```
The walled old town of Itchan Kala in Khiva at dusk, wide panoramic view along
the city wall with the Kalta Minor minaret and surrounding domes forming a
clear dark skyline. Bright even twilight sky filling the upper third of the
frame, completely empty and cloudless. Strong separation between the pale sky
and the dark mud-brick masses below. Flat frontal light, no harsh shadows,
simple shapes, no people, no vehicles, no text. Aspect ratio 21:9.
```

## 3 · Poi Kalon, Bukhara → `bukhara.jpg`

```
The Poi Kalon complex in Bukhara at blue hour, wide panoramic framing, the
Kalon minaret and the mosque's domed roofline forming a bold dark silhouette
against a bright empty twilight sky. Upper third of the frame is clear sky with
no clouds. Very high contrast between sky and architecture, simplified massing,
minimal surface detail, no people, no vehicles, no text or signage.
Architectural photography, still and monumental. Aspect ratio 21:9.
```

## 4 · A composed skyline (not a real place) → `monument.jpg`

Use this if you want the background to read as *the platform's* skyline rather
than one specific city.

```
A wide panoramic skyline of Timurid architecture: ribbed domes, tall portal
arches and slender minarets arranged in a calm horizontal composition, at blue
hour. The buildings form one continuous dark silhouette along the lower half.
The upper half is empty, evenly lit twilight sky with no clouds and no detail.
Very high tonal contrast, simplified geometric massing, no fine ornament, no
people, no vehicles, no text. Architectural illustration photographed straight
on. Aspect ratio 21:9.
```

---

## After generating

1. **Resize to about 2400px wide** before saving. A 6MB camera-size file costs
   every visitor 6MB; the filter output looks identical at 2400.
2. Save as `.jpg` (or `.png`) with the exact filename above.
3. Drop it in this folder and reload any page.
4. Only the **first** file found is used, in this order: `registan` → `khiva` →
   `bukhara` → `monument`. To switch, rename or remove.

## If it comes out muddy

That is the contrast problem, not a bug. Regenerate asking for a **brighter
sky** and a **darker silhouette** — the gap between them is the only thing the
five posterise steps have to work with.
