# Classwork portal · 课作门户

**Phase**: video-only (website links reserved, not clickable)  
**This branch** is an information-architecture preview. **Do not merge it to `main`.** GitHub Pages publishes from `main/`, so a merge would go live. Do not change Pages until the owner approves.

## Pages

The homepage is a long scroll of the public works. A work interior reuses the four-theme browser (hero, reel, entries, All / Playable / Pending, 纸面 / 几何 / 舞台 / 编辑).

| Surface | Chinese | English |
|---|---|---|
| Homepage | `index-cn.html` | `index.html` |
| 班作品视频 / Class group videos | `work-cn.html?w=class` | `work.html?w=class` |
| 应用心理学 / Applied Psychology | `work-cn.html?w=psych` | `work.html?w=psych` |

班作品视频 keeps the ten slots in `data/works.json` (Taste sample + empty groups). 应用心理学 is the other top-level work. Assignment Two (文明航程个人作业, AI-assisted writing) is affiliated under it in `data/applied-psychology.json`. It is not a public film and it is not its own homepage card.

Language is the HTML file. Theme, work, and filter stay in the query, so they survive the trip between the homepage and a work: `work-cn.html?w=psych&v=stage`. Editorial contrast is `c=dark` (default) or `c=light`.

| Theme | Query |
|---|---|
| 纸面 Paper | `v=paper` (default) |
| 几何 Geometry | `v=geometry` |
| 舞台 Stage | `v=stage` |
| 编辑 Editorial | `v=editorial` |

The field color is the existing ink-teal `#0e3436`. Fonts are OFL faces already used by the portal (Fraunces, Plus Jakarta Sans, Noto Sans SC, Noto Serif SC, IBM Plex Mono, and the theme faces Syne, Oswald, Outfit).

## Open locally

No build step. From this folder:

```bash
npm run dev
```

Serves http://127.0.0.1:7100/ (`/` is the Chinese homepage).

```bash
python -m http.server 8765
```

- Chinese homepage: http://127.0.0.1:8765/index-cn.html
- English homepage: http://127.0.0.1:8765/index.html
- Class videos, paper: http://127.0.0.1:8765/work-cn.html?w=class&v=paper
- Applied Psychology, stage: http://127.0.0.1:8765/work-cn.html?w=psych&v=stage
- English editorial, light: http://127.0.0.1:8765/work.html?w=class&v=editorial&c=light

### file:// notes

Some browsers block `fetch` of the JSON catalogs under `file://`. If a work interior shows a load-failure message, use the http.server method above.

## Data

Class group slots are driven by `data/works.json`. The affiliated Assignment Two entry is `data/applied-psychology.json` (one entry, not padded out to ten).

`works.json`:

- `meta.*` — course / term / instructor / note (placeholders OK)
- `groups[]` — exactly 10 slots (`slot` 1–10); `status`: `ready` | `empty` | `broken`
- `video.kind`: `file` (relative path) or `url` (https)
- `website_url`: **reserved only** this phase — UI shows grey 「网页入口，后续开放」 / “Website entry, coming later”, never a live outbound link

## Replace the sample mp4

1. Put the real file under `media/groups/gXX/your-video.mp4` (keep each file small; prefer &lt; 50MB; use Git LFS or hosted URL for large films).
2. Edit the matching group in `data/works.json`:

```json
"video": { "kind": "file", "src": "media/groups/g02/your-video.mp4" },
"status": "ready"
```

Or point to a hosted URL:

```json
"video": { "kind": "url", "src": "https://example.com/video.mp4" },
"status": "ready"
```

Do **not** put a `.md` path into `video.src`. The Taste card uses a portal-generated placeholder mp4; it references the kuaizengji/taste methodology in copy only.

## Taste sample

- Card: slot 1 / `g01` — 「Taste 试料组」
- File: `media/samples/sample-demo.mp4` (≤5s, silent, generated with ffmpeg)
- Copy states it is a portal-generated placeholder referencing kuaizengji/taste methodology

## HOOTL

Do not merge this preview into `main`, and do not change GitHub Pages, until the owner approves. Pages publishes from `main/`, so a merge would go live.

## Self-check

See `docs/self-check.md`.
