# media/

Place group video files here.

## Layout suggestion

```
media/
  samples/sample-demo.mp4     # portal Taste placeholder (do not replace casually)
  groups/
    g02/work.mp4
    g03/work.mp4
```

## Rules

1. Prefer short / compressed mp4 (H.264 + yuv420p). **Do not commit huge raw masters** (hundreds of MB) into git — use a hosted URL (`video.kind: "url"`) or Git LFS if the class later approves it.
2. After adding a file, update `data/works.json` for that slot (`status: "ready"`, `video.src` relative to the portal root).
3. Never put a documentation `.md` path into `video.src`.
4. Keep the Taste sample under `samples/` unless the course owner replaces the trial card intentionally.
