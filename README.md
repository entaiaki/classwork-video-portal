# Classwork Video Portal · 班作品视频门户

**Ticket**: CW-PORTAL-VIDEO-20261109-01  
**Phase**: video-only (website links reserved, not clickable)  
**Primary demo page**: `index-cn.html`  
**Current shell (R5)**: 应用壳 + 作品索引 (App-shell + Work Index) — sticky site bar, work inspector, and a 10-slot work index with status filters. Local preview only; do not treat this as a public Pages update.


## Open locally

### Recommended (http.server)

```bash
cd /workspace/coursework/portal-video
python -m http.server 8765
```

Then open:

- Chinese: http://127.0.0.1:8765/index-cn.html
- English: http://127.0.0.1:8765/index.html

### file:// notes

You can open `index-cn.html` directly in a browser. Some browsers block `fetch("data/works.json")` under `file://`. If the page shows a load-failure message, use the http.server method above (this is the official smoke path).

## Data

The work index and inspector are driven by `data/works.json`:

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

Public GitHub Pages, making the repo public, posting to class chat, or merging into a user main branch requires **user approval** and a separate dispatcher envelope. This folder is a box working copy only.

## Self-check

See `docs/self-check.md`.
