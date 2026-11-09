# Self-check · CW-PORTAL-VIDEO-20261109-01

**When**: 2026-11-09 (America/New_York)  
**Root**: `/workspace/coursework/portal-video/`  
**Implementer**: 课作·实现

## Tree

| Path | Present |
|---|---|
| README.md | YES |
| index.html | YES |
| index-cn.html | YES |
| assets/css/portal.css | YES |
| assets/js/portal.js | YES |
| assets/img/placeholder-cover.svg | YES |
| data/works.json | YES |
| media/README.md | YES |
| media/samples/sample-demo.mp4 | YES |
| docs/self-check.md | YES |

## Sample mp4

| Check | Result |
|---|---|
| duration ≤ 5s | **3.0s** (`ffprobe`) |
| size &lt; 3MB | **5376 bytes (~5.3 KB)** |
| silent / no audio stream | YES (`ffmpeg -an`) |
| kind:file relative path | `media/samples/sample-demo.mp4` |

## Server smoke (`python -m http.server 8765`)

| URL | Expect | Result |
|---|---|---|
| `/index-cn.html` | 200 | PASS |
| `/index.html` | 200 | PASS |
| `/data/works.json` | 200 | PASS |
| `/media/samples/sample-demo.mp4` | 200 | PASS |
| `/assets/js/portal.js` | 200 | PASS |

## Acceptance P0

### A · Structure / scope

| ID | Result | Notes |
|---|---|---|
| A1 | PASS | Dual HTML + works.json + assets + media/samples |
| A2 | PASS | UI shows grey website reserve text; no `<a href>` for `website_url` |
| A3 | PASS | Only wrote under `portal-video/` |
| A4 | PASS | No tokens/passwords/keys in source or JSON |
| A5 | PASS | No Pages / 发群 / merge |

### B · Content / data

| ID | Result | Notes |
|---|---|---|
| B1 | PASS | JS `ensureTenSlots` forces 10 cards; g02–g10 empty |
| B2 | PASS | Mutual language links on both pages |
| B3 | PASS | g01 name/title include Taste/试料; src → sample-demo.mp4 |
| B4 | PASS | Cards render from works.json only |
| B5 | PASS | Empty cards show 「待提交」 / “Pending submission” + non-play CTA |

### C · Playback / failure

| ID | Result | Notes |
|---|---|---|
| C1 | PASS (smoke) | Server serves mp4; modal uses `<video controls>`; live click left to 体验 |
| C2 | PASS | file sample present, ~5 KB |
| C3 | PASS (code path) | Missing/404 src → modal fail-box with explicit copy; see verify steps below |
| C4 | N/A | No kind:url card in this delivery |

### S · Safety / docs

| ID | Result | Notes |
|---|---|---|
| S1 | PASS | `website_url` present (null); UI non-clickable reserve |
| S2 | PASS | README covers open / replace mp4 / HOOTL |
| S3 | PASS | System font stack; no analytics SDK |
| S4 | PASS (P1) | media/README warns against huge uploads |

## How to verify C3 (failure state)

1. Keep server running.
2. Temporarily change g01 `video.src` in `data/works.json` to `media/samples/does-not-exist.mp4` (or set `status` to `broken` with a bad src).
3. Hard-refresh index-cn.html, click the Taste card.
4. Expect modal with **「视频无法播放」 / “Video cannot play”** and explanation — not a blank page.
5. Restore `src` to `media/samples/sample-demo.mp4` and `status: "ready"`.

(Implementer did not leave the broken src in the delivered JSON.)

## Grep / isolation

- No clickable `website_url` outbound links in HTML/JS.
- No edits outside `/workspace/coursework/portal-video/`.
- No civilization-voyage / maya-platform / A2 / 两队 / 大肥鱼 touches.

## Conclusion

**DONE** — ready for 课作·质核.

## C3 machine note (2026-11-09 America/New_York)

- Missing sample path via local server: `HEAD /media/samples/does-not-exist.mp4` → **404**.
- `portal.js` maps non-OK fetch / `video.onerror` to modal fail-box (`showFail`), so UI does not blank.
- Delivered `works.json` keeps g01 `src` correct; broken-src experiment is for质核/体验 only.
