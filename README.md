# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/StarsN/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/StarsN/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your own photo and a caption into GTA-poster-style cover art,
built for make.fun's "Make GTA 6 Cover Art" bounty. Drop in a photo and the studio splits it
across a bold multi-panel poster layout — one hero panel plus close-up crops of the same
picture — lays a Vice City sunset, neon or vice colour grade over it, frames it with thick
panel borders, and letters it with a heavy gradient title and a caption banner. Export a real
PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080 and post it.

Everything is original and everything stays on your machine: no uploads, no network calls, no
borrowed artwork or fonts — the lettering is drawn with heavy system font stacks, and the
bundled sample photo (`app/sample.jpg`, a sunset beach-city scene with palms and a
convertible) was drawn from code for this app.

## Run it

Serve `app/` with any static file server and open it in a desktop browser:

```
node serve.ts        # then visit http://localhost:8080
```

Then: choose a photo (or drop one onto the cover), drag the cover to reposition the hero
crop, scroll or use the slider to zoom, pick a panel layout (Hero Grid, Mosaic, Film Strip)
and a colour grade (Sunset, Neon, Vice), edit the title and caption, choose a post size and
hit **Export PNG**. Adding `?sample=1` to the URL loads the sample photo so you can try it
with no photo of your own handy.

## Handing it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output
directory and writes `dossier.json` with the vendored `vendor/makefun-app.ts` library:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The screenshots in `screenshots/` are the app's own work: the exported covers are the PNGs
the app itself rendered (scaled down to the screenshot limits, never edited), and the editor
shot is the app open in Chrome with the sample photo loaded.
