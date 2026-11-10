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

## Beautify · CW-PORTAL-BEAUTIFY-20261109-01

**When**: 2026-11-09 (America/New_York)  
**Direction**: Mayalee Glass Academic (glass hero + academic blue `#1457d4`)  
**Implementer**: 课作·实现  
**Did NOT push** Pages / public tip.

### Changed files

| Path | Change |
|---|---|
| `assets/css/portal.css` | Full rewrite: tokens, glow bg, glass hero, card states, modal, responsive |
| `index.html` | Wrap header content in `.hero` / `.hero-inner` |
| `index-cn.html` | Same hero wrap |
| `assets/img/play-glyph.svg` | NEW — Ready-only cover affordance (CSS `::after`) |
| `assets/img/placeholder-cover.svg` | “Awaiting exhibit” dashed pending look (no fake player) |
| `assets/js/portal.js` | Untouched (CSS-only play glyph) |
| `data/works.json` | Untouched |

### sha256 / mtime (America/New_York)

| File | sha256 | mtime |
|---|---|---|
| `assets/css/portal.css` | `fd0fee12a4bb46fe0da4cb4b8b494de7aa73c1b1054a0438201017223fa72225` | 2026-11-09 04:49:34 -0500 |
| `index.html` | `a56e815597a5f00d7a8b849786bff33025271150ff734531e97e92247418970f` | 2026-11-09 04:48:42 -0500 |
| `index-cn.html` | `18a8f6e5b9294bdd7936f642bfef0f0899afba794efc2119672323765874a461` | 2026-11-09 04:48:42 -0500 |
| `assets/img/play-glyph.svg` | `ed7445711aec6660907dca8e7f3970a45170b524f41b5d40a98cf37eb9d8ce16` | — |
| `assets/img/placeholder-cover.svg` | `22597e5ed3b233c59919f5802c787e32e4d2d5893d12cbbfa74054cb219533b8` | — |

### Server smoke (`python -m http.server 8765` from portal-video)

| URL | Result |
|---|---|
| `/index.html` | 200 |
| `/index-cn.html` | 200 |
| `/assets/css/portal.css` | 200 |
| `/data/works.json` | 200 |
| `/media/samples/sample-demo.mp4` | 200 |
| `/assets/img/play-glyph.svg` | 200 |
| `/assets/img/placeholder-cover.svg` | 200 |

### V1–V6 checklist (scheme §5)

| ID | Item | Result | Evidence |
|---|---|---|---|
| V1 | Page bg not flat gray; cold blue glow/gradient | PASS | `body` uses `--bg-glow-radial` + `--bg-glow-linear` |
| V2 | Hero is independent rounded glass panel | PASS | `.hero` radius 28px + `backdrop-filter: blur(14px)` + shadow; `@supports` fallback opaque white (not full-width bar) |
| V3 | Card radius ≥18px | PASS | `--radius-card: 20px` |
| V4 | Ready has play affordance; Empty does **not** | PASS | `.card.is-ready .cover::after` + play-glyph.svg; `.is-empty/.is-broken .cover::after { display:none }`; JS empty branch only `emptyCta` |
| V5 | Accent is vivid academic blue | PASS | `--accent: #1457d4` (was `#2f5d8c`) |
| V6 | Ready hover lift/shadow | PASS | `translateY(-3px)` + `--shadow-card-hover` |

### Hard red lines

| Check | Result |
|---|---|
| Empty has no Ready-level play circle | PASS (CSS hard-block + JS never injects play node) |
| website not clickable outbound | PASS (`website-reserve` div only) |
| No CDN / Google Fonts `@import` | PASS (system stack only) |
| Did not push Pages/public tip | PASS |
| Did not touch Maya / 两队 / 大肥鱼 / A2 / civilization-voyage | PASS |
| works.json semantics unchanged | PASS (sha `d1dad598…`) |

### Beautify conclusion

**DONE** — ready for 课作·质核 (then 体验). Publish Pages only after 体验 PASS + 调度发布信封.

## Beautify R2 · CW-PORTAL-BEAUTIFY-R2-20261109-01 · 纸金影廊

**When**: 2026-11-09 (America/New_York)  
**Direction**: Paper-Gold Cinema Gallery（扬弃 R1 玻璃 blur + 教育蓝）  
**Implementer**: 课作·实现  
**Did NOT push** Pages / public tip.  
**Rollback**: `assets/css/portal.css.r1-glass.bak` (R1 sha `fd0fee12…`)

### Changed files

| Path | Change |
|---|---|
| `assets/css/portal.css` | `622c45b20495a2f9c82d9e32d25f8e3843f4f13ed6fa3d1e815e0c577f9c291a` |
| `assets/css/portal.css.r1-glass.bak` | NEW — R1 glass CSS backup before rewrite |
| `assets/img/play-glyph.svg` | `b9be9b8d0900b9436d08b8a3ecedfe2adb318f6fbe272fabe9801bbcbcd263aa` |
| `assets/img/placeholder-cover.svg` | `d544e665a39445149536967c51a7bd922c58a2b1335073465caddfeab0eb21c4` |
| `assets/js/portal.js` | `8f9cfd9816e7d2dd246a86fd350cf6818229b6f5af23cd49677bca471f092465` |
| `assets/js/portal.js.pre-r2-ix.bak` | Pre-ix JS backup |
| `index.html` / `index-cn.html` | Untouched (CSS `::before` top gold line; ids preserved) |
| `data/works.json` | Untouched |

### sha256 / mtime (America/New_York)

| File | sha256 |
|---|---|
| `assets/css/portal.css` | `622c45b20495a2f9c82d9e32d25f8e3843f4f13ed6fa3d1e815e0c577f9c291a` |
| `assets/css/portal.css.r1-glass.bak` | `fd0fee12a4bb46fe0da4cb4b8b494de7aa73c1b1054a0438201017223fa72225` |
| `assets/js/portal.js` | `8f9cfd9816e7d2dd246a86fd350cf6818229b6f5af23cd49677bca471f092465` |
| `assets/img/play-glyph.svg` | `b9be9b8d0900b9436d08b8a3ecedfe2adb318f6fbe272fabe9801bbcbcd263aa` |
| `assets/img/placeholder-cover.svg` | `d544e665a39445149536967c51a7bd922c58a2b1335073465caddfeab0eb21c4` |
| `index.html` | `a56e815597a5f00d7a8b849786bff33025271150ff734531e97e92247418970f` |
| `index-cn.html` | `18a8f6e5b9294bdd7936f642bfef0f0899afba794efc2119672323765874a461` |
| `data/works.json` | `d1dad59865ee6a94ca2720bbcc60a3b88f984ee0b692de0339e0eb0a45203b96` |

### Server smoke (`python -m http.server 8765` from portal-video)

| URL | Result |
|---|---|
| `/index.html` | 200 |
| `/index-cn.html` | 200 |
| `/assets/css/portal.css` | 200 |
| `/data/works.json` | 200 |
| `/media/samples/sample-demo.mp4` | 200 |
| `/assets/img/play-glyph.svg` | 200 |
| `/assets/img/placeholder-cover.svg` | 200 |
| `/assets/js/portal.js` | 200 |

### G1–G6 checklist (scheme §6 / 验收表)

| ID | Item | Result | Evidence |
|---|---|---|---|
| G1 | Warm paper bg; no cold blue radial | PASS | `--bg:#f7f3eb` + gold-tint `--bg-warm`; no `rgba(20,87,212` glow |
| G2 | Solid paper hero + top gold line; no blur | PASS | `.hero` solid `--surface`, `::before` 2px gold; backdrop-filter only in REMOVED comments |
| G3 | Serif `#course-title` / h1 | PASS | `--font-display` Songti/Georgia stack |
| G4 | Accent not education blue | PASS | `--accent:#8a6a34`; `#1457d4` only in discard comments |
| G5 | Exhibit card radius ~6px | PASS | `--radius-card:6px` (≪ R1 20px) |
| G6 | Ready copper play; Empty no circle | PASS | `.is-ready .cover::after`; `.is-empty/.is-broken .cover::after{content:none;display:none}` |

### Interaction polish (dispatcher amendment · 最高级交互)

| Item | Result | Evidence |
|---|---|---|
| Ready **hover/focus** lift + thin gold border | PASS | `.card.is-ready:hover,:focus-visible` → `border-color:var(--gold)` + `translateY(-2px)`; play glyph restrained `scale(1.04)` (no bounce) |
| Modal open/close opacity+scale ≤280ms | PASS | `.modal` opacity + `.modal-panel` scale 220ms; class `is-open` |
| **Esc** close | PASS | `keydown` Escape → `closePlayer()` |
| Backdrop close | PASS | `#player-backdrop` click → `closePlayer()` |
| Focus restore to triggering card | PASS | `lastTrigger` saved in `openPlayer`; restored in `finishClose` |
| **prefers-reduced-motion** → instant | PASS | CSS `@media (prefers-reduced-motion: reduce)` zeros transitions/animations; JS `prefersReducedMotion()` skips close delay |
| **Empty no false-open** | PASS | Empty branch: no click/keydown listeners + `aria-disabled`; CSS hover does not lift/gold; `openPlayer` early-returns if `status==="empty"`; `::after` play forced off |
| Keyboard: lang + close Tab-able; copper focus ring | PASS | native `<a>` / `<button>`; `:focus-visible` outline `var(--gold)` |
| Touch cover affordance ≥44px; no double-open | PASS | play glyph 54×54; `modalBusy` / `is-open` guard |
| Fail-box clean (no white flash) | PASS | video hidden+src cleared before fail reveal; modal-body near-black `#0c0b09`; fail-in opacity anim |

### Hard red lines

| Check | Result |
|---|---|
| Empty/Broken no Ready-level play circle | PASS |
| website not clickable outbound | PASS |
| No CDN / Google Fonts `@import` | PASS (comments only mention ban) |
| Did not push Pages/public tip | PASS |
| No glass blur hero as main sell | PASS |
| No `#1457d4` as `--accent` | PASS (`#8a6a34`) |
| works.json semantics unchanged | PASS (sha `d1dad598…`) |
| No Maya / 两队 / 大肥鱼 / A2 | PASS |

### R2 conclusion

**DONE** — ready for 课作·质核 (then 体验). Publish Pages only after 体验 PASS + 用户批 + 调度发布信封.

## Beautify R3 · CW-PORTAL-BEAUTIFY-R3-20261109-01 · 黑馆影格

**When**: 2026-11-09 (America/New_York)  
**Direction**: Black Gallery Frames / Criterion charcoal（扬弃 R1 玻璃 + R2 纸金）  
**Implementer**: 课作·实现  
**Did NOT push** Pages / public tip.  
**Rollback**: `assets/css/portal.css.r2-paper-gold.bak` (R2 sha `622c45b2…`); also keep `portal.css.r1-glass.bak`

### Changed files

| Path | Change |
|---|---|
| `assets/css/portal.css` | Full rewrite → charcoal tokens, 0px radius, white micro Ready, Empty charcoal well, cinema modal |
| `assets/css/portal.css.r2-paper-gold.bak` | NEW — R2 paper-gold CSS backup before rewrite |
| `assets/img/play-glyph.svg` | White thin triangle 32×32 (no gold/blue circle) |
| `assets/img/placeholder-cover.svg` | Deep charcoal `#0e0e0e` quiet well (no dashed gift) |
| `assets/js/portal.js` | MOTION_MS 220→180 only (Esc/backdrop/focus/empty early-return kept) |
| `index.html` / `index-cn.html` | Untouched |
| `data/works.json` | Untouched |

### sha256 (America/New_York)

| File | sha256 |
|---|---|
| `assets/css/portal.css` | `d3cc75b7842da2204ecc2852af818501c34bec460c8322e3afa6b79f8d4c2407` |
| `assets/css/portal.css.r2-paper-gold.bak` | `622c45b20495a2f9c82d9e32d25f8e3843f4f13ed6fa3d1e815e0c577f9c291a` |
| `assets/css/portal.css.r1-glass.bak` | `fd0fee12a4bb46fe0da4cb4b8b494de7aa73c1b1054a0438201017223fa72225` |
| `assets/js/portal.js` | `59f2bf1d5502a947a878ce70cb6c37cfe8814a2376bdde79bafdebf1b779e903` |
| `assets/img/play-glyph.svg` | `94846d14fb1cf4c873db23b2a5f2c38ae81c0ff7d136cb75af0632815f1e6f41` |
| `assets/img/placeholder-cover.svg` | `d27985379a3ccc99e2a463988356362f92c14fc9eb507a8fecefbe4732cc4aac` |
| `data/works.json` | `d1dad59865ee6a94ca2720bbcc60a3b88f984ee0b692de0339e0eb0a45203b96` |

### Server smoke (`python -m http.server 8765` from portal-video)

| URL | Result |
|---|---|
| `/index.html` | 200 |
| `/index-cn.html` | 200 |
| `/assets/css/portal.css` | 200 |
| `/assets/js/portal.js` | 200 |
| `/data/works.json` | 200 |
| `/media/samples/sample-demo.mp4` | 200 |
| `/assets/img/play-glyph.svg` | 200 |
| `/assets/img/placeholder-cover.svg` | 200 |

### D1–D8 / G1–G8 checklist

| ID | Item | Result | Evidence |
|---|---|---|---|
| G1/D1 | Charcoal page bg; no cream/blue glow | PASS | `--bg:#1a1a1a` + neutral luminance only |
| G2/D2 | No glass / no gold hero line | PASS | `.hero` elevated charcoal + hairline; no `backdrop-filter`; no `::before` gold |
| G3/D3 | Accent white/gray; not blue/gold | PASS | `--accent:#ffffff`; gold/blue only in DELETED comments |
| G4/D4 | Radius 0–2px | PASS | `--radius-hero/card/modal:0px`; `--radius-pill:2px` |
| G5/D5 | No warm brown soft shadow | PASS | `--shadow:none`; `--inset-hairline` |
| G6/D6 | Cover weight + white micro play | PASS | Ready `::after` 32px white triangle SVG; not ≥54 copper circle |
| G7/D7 | Empty charcoal well; no play | PASS | `--cover-well:#0e0e0e`; faint inset only; `::after{content:none}` |
| G8/D8 | First-screen colored decoration = 0 | PASS | Grayscale chrome; Broken red only |

### C items

| ID | Item | Result |
|---|---|---|
| C1 | Taste playable via http.server | PASS (mp4 200; modal `<video>`; live click → 体验) |
| C2 | Fail-box path retained | PASS (JS `showFail`; deep fail-box + red left border) |
| C3 | EN/CN same tokens | PASS (shared CSS; pages untouched) |
| C4 | ≤560 single column | PASS (`@media (max-width:560px)` 1fr) |
| C5 | No CDN fonts | PASS (`rg fonts.googleapis` empty as active import) |
| C6 | website-reserve gray | PASS (cursor:default; never `<a href>`) |
| C7 | Empty/Broken no Ready play | PASS (`content:none; display:none`) |
| C8 | Modal cinema scrim ≥70%; ≤200ms | PASS (`rgba(0,0,0,.78)`; opacity 180ms; MOTION_MS=180) |
| C9 | No active gold/cream/edu-blue tokens | PASS (only DELETED comments) |

### Interaction retained from R2 JS

| Item | Result |
|---|---|
| Esc / backdrop close | PASS (unchanged) |
| Focus restore to trigger card | PASS (`lastTrigger` + `finishClose`) |
| Empty early-return / no false-open | PASS |
| prefers-reduced-motion instant | PASS (CSS + JS) |
| focus-visible white/light-gray ring | PASS (not blue/gold) |

### Hard red lines

| Check | Result |
|---|---|
| Empty/Broken no Ready-level play | PASS |
| website not outbound | PASS |
| No CDN / Google Fonts | PASS |
| Did not push Pages/public tip | PASS |
| No glass / no paper-gold main sell | PASS |
| No education/electric blue CTA | PASS |
| Ready not copper big circle ≥54 | PASS (32px white triangle) |
| works.json semantics unchanged | PASS (sha `d1dad598…`) |
| No Maya / 两队 / 大肥鱼 / A2 | PASS |

### R3 conclusion

**DONE** — ready for 课作·质核 (then 体验). Publish Pages only after 体验 PASS + 用户批 + 调度发布信封.

---

## R4 · CW-PORTAL-BEAUTIFY-R4-20261109-01 · 放映厅双区 (Now Showing + Programme)

**When**: 2026-11-09 ~06:14 America/New_York  
**Theme (structure name only)**: **放映厅双区** — NOT a color/token reskin.  
**Work root**: `/workspace/coursework/portal-video/` (local; Pages not pushed)

### Backups (pre-edit R3)

| File | Bak path | sha prefix |
|---|---|---|
| portal.css | `assets/css/portal.css.r3-black-gallery.bak` | `d3cc75b7` |
| portal.js | `assets/js/portal.js.r3.bak` | `59f2bf1d` |
| index-cn.html | `index-cn.html.r3.bak` | `18a8f6e5` |
| index.html | `index.html.r3.bak` | `a56e8155` |

### Post-edit sha prefixes

| File | sha prefix | Note |
|---|---|---|
| index-cn.html | `fc012f92` | **changed** from R3 `18a8f6e5` (DOM must change) |
| index.html | `6e5e627e` | changed from R3 `a56e8155` |
| assets/css/portal.css | `eb9636c9` | dual-zone layout CSS |
| assets/js/portal.js | `1b065367` | renderStage + renderProgramme |
| data/works.json | `d1dad598` | **unchanged** |

### Structural change list

1. HTML (CN+EN isomorphic): removed `.hero`/`.hero-inner` + `#works-grid`; added `#site-masthead`, `#now-showing` (+ `#stage`), `#programme` (+ `#programme-list`); kept `#player-modal*` ids.
2. JS: replaced `buildCard → #works-grid` with `renderStage` / `renderProgramme` + `buildStage` / `buildProgrammeRow`; Empty rows no click/keydown/play; Ready stage `#stage-play` + row `.row-play`; Esc/backdrop/close/focus restore/MOTION_MS=180 retained.
3. CSS: masthead + letterbox stage + programme credit-roll rows; killed equal-weight multi-col card wall; ≤560 stage single-col, programme still rows; white square Play CTA; no CDN fonts.

### Self-test (http.server :8765 + jsdom interaction)

| Check | Result |
|---|---|
| index-cn.html / index.html / works.json / portal.js / portal.css / sample mp4 → 200 | PASS |
| DOM has `#now-showing` `#programme` `#site-masthead` `#player-modal*` | PASS |
| No `#works-grid` / no `.hero` as primary | PASS |
| 10 programme rows; slots 1…10; 1 ready + 9 empty | PASS CN+EN |
| Stage letterbox + `#stage-play` for Taste (g01) | PASS |
| Empty rows: 0 `.row-play`; `aria-disabled=true`; click keeps modal hidden | PASS |
| Stage Play → modal open; Esc / close / backdrop → close + focus restore to `.row-play` | PASS |
| i18n: 正在放映/节目单 · Now Showing/Programme | PASS |
| `rg fonts.googleapis\|fonts.gstatic\|^@import` active CSS/JS | PASS empty |
| works.json sha unchanged `d1dad598` | PASS |
| ≤560 CSS still `programme-list` flex column (no empty-card wall) | PASS |
| Pages / public tip not pushed | PASS |
| Delivery name uses 放映厅双区 (not 黑馆/纸金/玻璃) | PASS |

### R4 conclusion

**DONE** — structural rebuild 放映厅双区 ready for 课作·质核 (then 体验). Publish Pages only after 体验 PASS + 用户批 + 调度发布信封.

---

## R5 · CW-PORTAL-BEAUTIFY-R5-20261110-01 · 应用壳 + 作品索引 (App-shell + Work Index)

**When**: 2026-11-10 00:47 America/New_York (EST, UTC-5)  
**Theme (structure name only)**: **应用壳 + 作品索引** — NOT a reskin of R4 cinema dual-zone.  
**Work root**: `/workspace/coursework/portal-video/` (local; Pages not pushed)

### Backups (pre-edit R4)

| File | Bak path | sha prefix |
|---|---|---|
| index-cn.html | `index-cn.html.r4-cinema.bak` | `fc012f92` |
| index.html | `index.html.r4-cinema.bak` | `6e5e627e` |
| portal.css | `assets/css/portal.css.r4-cinema.bak` | `eb9636c9` |
| portal.js | `assets/js/portal.js.r4-cinema.bak` | `1b065367` |

Earlier `.r3` baks were left in place and not overwritten.

### Post-edit sha prefixes

| File | sha prefix | Note |
|---|---|---|
| index-cn.html | `d8de7a58` | **changed** from R4 `fc012f92` (DOM must change) |
| index.html | `663db14e` | changed from R4 `6e5e627e` |
| assets/css/portal.css | `c315ee70` | app-shell typography + split layout |
| assets/js/portal.js | `80d04f90` | renderShellMeta / renderDetail / renderIndex |
| data/works.json | `d1dad598` | **unchanged** |

### Structural change list

1. HTML (CN+EN isomorphic ids): retired `#now-showing` `#stage` `.stage-letterbox` `#programme` `.programme-row`. Added `#app-shell`, sticky `#site-bar` (course short name, term/teacher, 作品/Works anchor, 中\|EN), `#workspace` `#page-header` (`#page-title` 作品/Works + `#work-summary` counts + `#note-text`), product inspector `#work-detail`, `#work-index` (`#index-filter` 全部/可播放/待提交 + `#work-list` 10 × `.work-row`). Kept `#player-modal*` ids.
2. JS: replaced `renderStage` / `renderProgramme` / `buildStage` / `buildProgrammeRow` with `renderShellMeta` / `renderDetail` / `renderIndex`. Landing selects first Ready (g01 Taste). Row click selects; `#selected-play` is the primary CTA; row play is secondary/ghost. Empty: no button, no play glyph, no `openPlayer` binding; click may show read-only pending detail, modal stays hidden (0→0). Filter hides rows only (does not delete slots). `ensureTenSlots` kept. Modal Esc / backdrop / `#player-close` / focus restore / MOTION_MS=180 / reduced-motion ported. Load error mounts in `#workspace`.
3. CSS: typography tokens `--text-display/title/body/ui/meta/caption` all present; unique sizes converged to 4 (display 28–32 / title 20 / ui=body 14 / meta=caption 12). `--font-sans` only (no `--font-display` serif masthead). `--wrap: min(1120px, …)`; `--bar-height: 56px`. Mid 16:9 detail cover, not 2.39:1 theatre. Light product surface. ≤560 stacks with list still rows.
4. Copy: no cinema section titles; meta and counts are not joined with middle-dot 「·」 (hairline + muted tags; aria-label uses a comma).

**Filter note**: the 可播放 / Playable segment includes `status=ready` **and** `status=broken` (currently 0 broken, so 1 visible Ready). 待提交 = empty only. Switching back to 全部 still shows 10 rows in the DOM and on screen.

### Self-test (http.server :8766 + jsdom interaction + Chrome CDP)

| Check | Result |
|---|---|
| index-cn.html / index.html / works.json / portal.js / portal.css / sample mp4 → 200 | PASS |
| DOM has `#app-shell` `#site-bar` `#workspace` `#work-detail` `#work-index` `#work-list` `#index-filter` `#player-modal*` | PASS CN+EN |
| No `#now-showing` `#programme` `#stage` `.stage-letterbox` `.programme-row` in live HTML/JS/CSS (bak excluded) | PASS |
| 10 `.work-row`; slots 1…10; 1 ready + 9 empty | PASS CN+EN |
| Landing: first Ready (g01 Taste) selected; `#selected-play` visible | PASS |
| `#selected-play` opens modal; Chrome: Taste `sample-demo.mp4` readyState=4, duration 3s, modal `is-open` | PASS |
| Empty rows: 0 buttons / 0 play glyphs / no 「点击播放」; `aria-disabled=true`; click keeps modal hidden (0→0); Empty detail has no play CTA | PASS |
| Filters: 全部=10; 可播放=1 Ready (ready+broken policy); 待提交=9 Empty; back to 全部 still 10 | PASS |
| Esc / `#player-close` / backdrop close modal; MOTION_MS=180; reduced-motion disables transition in CSS | PASS (close paths jsdom; reduce via CSS rule) |
| Typography (Chrome 1280): `#page-title` 30.72px/600; `.detail-title` 20px/600; `.row-name` 14px/500; `#meta-line` 12px/400; same `--font-sans`; wrap 1120px; bar sticky 56px | PASS |
| Cover ~16:9 (1.778), mid width ~423px; `#selected-play` 62×44, radius 6px, solid ink button (not a circle, not copper) | PASS |
| ≤560 (Chrome 520): workspace single column; detail stacked above index; `#work-list` flex column; rows remain rows (not a multi-col card wall); no letterbox | PASS |
| Meta / summary have no 「·」; i18n / generated joins use tags, hairline, or comma aria-labels | PASS |
| `rg fonts.googleapis\|fonts.gstatic\|cdnjs\|jsdelivr\|@import` live CSS/JS/HTML | PASS empty |
| works.json sha unchanged `d1dad598` | PASS |
| ready=0 temp smoke: `#detail-empty`, no play CTA, 10 rows, points to index; then `works.json` restored to `d1dad598` | PASS |
| CN/EN same ids; lang mutual links 中\|EN; website reserve is grey text, not `<a href>` | PASS |
| Pages / public tip not pushed | PASS |
| Delivery name uses 应用壳 + 作品索引 (not 放映厅/影廊/黑馆/纸金/玻璃) | PASS |

### R5 conclusion

**DONE** — structural rebuild **应用壳 + 作品索引** ready for 课作·质核 (then 体验). Publish Pages only after 体验 PASS + 用户批 + 调度发布信封.

---

## R5 返工 · S-IX4 / S-IA5 过滤可见性（2026-11-10 01:42 America/New_York）

质核 FAIL 原因：`.work-row { display: grid }` 盖掉 `[hidden]`，JS 已设 `row.hidden = true` 但计算样式仍是 `display: grid`。

**只改** `assets/css/portal.css`，补与模态同类规则：

```css
.work-row[hidden] { display: none !important; }
```

未改 HTML / JS / `data/works.json`；未推 Pages。中英同构；Empty / 反换皮未回退。

| 文件 | sha8 |
|---|---|
| index-cn.html | `d8de7a58`（未改） |
| index.html | `663db14e`（未改） |
| assets/css/portal.css | `4f987c8c`（原 `c315ee70`） |
| assets/js/portal.js | `80d04f90`（未改） |
| data/works.json | `d1dad598`（未改） |

Chrome CDP 复验（http.server :8766，计算样式）：

| 分段 | CN | EN |
|---|---|---|
| 全部 | 10 行可见 | 10 行可见 |
| 可播放 | 仅 1 Ready（`display: grid`）；其余 `display: none` | 同左 |
| 待提交 | 9 Empty，无播钮，Ready 不可见 | 同左 |
| 切回全部 | 仍 10 行 | 仍 10 行 |

### R5 返工 conclusion

**DONE** — S-IX4 / S-IA5 过滤可见性已修；请调度再派质核只复审 FAIL 项。

